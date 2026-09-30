// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original browser qualification of the proj4js-inspired native API.
import {codeFingerprint} from './benchmark-metadata.mjs';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {chromium, firefox, webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFileSync, writeFileSync} from 'node:fs';
import {cpus} from 'node:os';
import {parseArgs} from 'node:util';
import {fileURLToPath} from 'node:url';
const {values} = parseArgs({
  options: {
    browsers: {type: 'string', default: 'chromium,firefox,webkit'},
    points: {type: 'string', default: '20000'},
    samples: {type: 'string', default: '7'},
    output: {type: 'string'}
  }
});
const points = Number(values.points),
  samples = Number(values.samples);
assert(Number.isSafeInteger(points) && points >= 10 && points <= 1e6);
assert(Number.isSafeInteger(samples) && samples >= 3 && samples <= 30);
const browsers = {chromium, firefox, webkit},
  names = values.browsers.split(',');
assert(names.length > 0 && names.every(name => name in browsers));
const entries = {
  native: `import {TypeScriptProjection,mercator,universalTransverseMercator} from '@math.gl/proj4';
    export function create(to) {return new TypeScriptProjection({to,projections:[mercator,universalTransverseMercator]});}`,
  proj4: `import proj4 from 'proj4';export function create(to){const p=proj4('WGS84',to);return {project:p.forward,unproject:p.inverse};}`,
  wrapper: `import {Proj4Projection} from '@math.gl/proj4/classic';export function create(to){return new Proj4Projection({to});}`
};
const assets = new Map();
for (const [name, contents] of Object.entries(entries)) {
  const result = await build({
    stdin: {contents, resolveDir: fileURLToPath(new URL('../../../', import.meta.url))},
    bundle: true,
    format: 'esm',
    platform: 'browser',
    minify: true,
    write: false
  });
  assets.set('/' + name + '.js', result.outputFiles[0].contents);
}
assets.set(
  '/workload.js',
  readFileSync(new URL('./benchmark-browser-workload.mjs', import.meta.url))
);
const accuracy = await build({
  entryPoints: [fileURLToPath(new URL('./qualify-browser.mjs', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  write: false
});
assets.set('/accuracy.js', accuracy.outputFiles[0].contents);
for (const name of ['native-proj-cases', 'native-proj-reference'])
  assets.set(
    '/' + name + '.json',
    readFileSync(new URL('../test/fixtures/' + name + '.json', import.meta.url))
  );
const server = createServer((request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  if (path === '/') {
    response.setHeader('Content-Type', 'text/html');
    response.end('<!doctype html><title>Projection qualification</title>');
    return;
  }
  const body = assets.get(path);
  response.statusCode = body ? 200 : 404;
  response.setHeader('Content-Type', 'text/javascript');
  response.setHeader('Cache-Control', 'no-store');
  response.end(body);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = 'http://127.0.0.1:' + server.address().port;
const results = [];
try {
  for (const name of names) {
    const browser = await browsers[name].launch({headless: true});
    const watchdog = setTimeout(() => {
      console.error(name + ' qualification exceeded 180 seconds');
      void browser.close();
    }, 180000);
    try {
      const cold = [];
      // Fresh contexts isolate module registries and HTTP caches, not OS disk caches.
      for (let sample = 0; sample < samples; sample++)
        for (const backend of Object.keys(entries)) {
          const context = await browser.newContext();
          try {
            const page = await context.newPage();
            await page.goto(origin);
            cold.push(
              await page.evaluate(async backend => {
                const start = performance.now();
                const api = await import('/' + backend + '.js');
                const loaded = performance.now();
                const instance = api.create('EPSG:3857');
                const constructed = performance.now();
                const point = instance.project([12, 55]);
                const projected = performance.now();
                if (Math.abs(point[0] - 1335833.8895192828) > 1e-5)
                  throw new Error('Cold transform mismatch');
                return {
                  backend,
                  loadMilliseconds: loaded - start,
                  firstConstructionMicroseconds: (constructed - loaded) * 1000,
                  firstProjectionMicroseconds: (projected - constructed) * 1000
                };
              }, backend)
            );
          } finally {
            await context.close();
          }
        }
      const page = await browser.newPage();
      await page.goto(origin);
      const warm = await page.evaluate(
        async options => {
          const {measure} = await import('/workload.js');
          const modules = {
            native: await import('/native.js'),
            proj4: await import('/proj4.js'),
            wrapper: await import('/wrapper.js')
          };
          return measure(modules, options);
        },
        {points, samples}
      );
      const independent = await page.evaluate(async () => {
        const {qualify} = await import('/accuracy.js');
        const inputs = await (await fetch('/native-proj-cases.json')).json();
        const reference = await (await fetch('/native-proj-reference.json')).json();
        return qualify(inputs, reference);
      });
      results.push({browser: name, version: browser.version(), cold, independent, ...warm});
      console.log(
        name +
          ': correctness passed; ' +
          warm.timings.length +
          ' warm workloads and ' +
          cold.length +
          ' cold samples'
      );
    } finally {
      clearTimeout(watchdog);
      await browser.close();
    }
  }
} finally {
  await new Promise(resolve => server.close(resolve));
}
const report = {
  metadata: {
    sourceSHA256: codeFingerprint(),
    date: new Date().toISOString(),
    platform: process.platform,
    arch: process.arch,
    cpu: cpus()[0]?.model,
    points,
    samples
  },
  methodology:
    'Separate minified bundles; fresh contexts for cold module fetch/parse/evaluation, first construction and first projection. Warm transforms use preconstructed converters, rotated execution order, reused scalar input and buffer reset outside timing. All coordinates compared before timing. OS caches not flushed; browser clocks may quantize short samples. No CI timing thresholds.',
  results
};
if (values.output) writeFileSync(values.output, JSON.stringify(report, null, 2) + '\n');
