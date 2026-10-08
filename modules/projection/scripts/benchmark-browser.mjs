// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original browser qualification of the proj4js-inspired native API.
import {
  codeFingerprint,
  benchmarkFingerprint,
  benchmarkDependencies
} from './benchmark-metadata.mjs';
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
    output: {type: 'string'},
    'min-sample-ms': {type: 'string', default: '12'},
    distribution: {type: 'string', default: 'regional'}
  }
});
const points = Number(values.points),
  samples = Number(values.samples);
assert(Number.isSafeInteger(points) && points >= 10 && points <= 1e6);
assert(Number.isSafeInteger(samples) && samples >= 3 && samples <= 31);
assert(
  Number.isFinite(Number(values['min-sample-ms'])) &&
    Number(values['min-sample-ms']) >= 0 &&
    Number(values['min-sample-ms']) <= 100
);
assert(['regional', 'clustered'].includes(values.distribution));
const browsers = {chromium, firefox, webkit},
  names = values.browsers.split(',');
assert(names.length > 0 && names.every(name => name in browsers));
const entries = {
  typescript: new URL('../test/benchmark-typescript.ts', import.meta.url),
  proj4: new URL('../test/benchmark-proj4.ts', import.meta.url)
};
const assets = new Map();
assets.set(
  '/pipeline-horizontal.gsb',
  readFileSync(new URL('../test/fixtures/real-grids/BETA2007.gsb', import.meta.url))
);
for (const [name, entry] of Object.entries(entries)) {
  const result = await build({
    entryPoints: [fileURLToPath(entry)],
    tsconfigRaw: {},
    bundle: true,
    format: 'esm',
    platform: 'browser',
    minify: true,
    write: false
  });
  assets.set('/' + name + '.js', result.outputFiles[0].contents);
}
// Cold measurements exclude the shared workload and synthetic grid fixture.
for (const [name, contents] of Object.entries({
  typescript:
    "import {projectionEngine} from '@math.gl/projection'; export const create = () => projectionEngine.createProjection({to: 'EPSG:3857'});",
  proj4:
    "import proj4 from 'proj4'; export const create = () => {const converter = proj4('WGS84', 'EPSG:3857'); return {project: point => converter.forward(point)};};"
})) {
  const result = await build({
    stdin: {contents, resolveDir: fileURLToPath(new URL('../', import.meta.url))},
    bundle: true,
    format: 'esm',
    platform: 'browser',
    minify: true,
    write: false,
    tsconfigRaw: {}
  });
  assets.set('/cold-' + name + '.js', result.outputFiles[0].contents);
}
const workload = await build({
  entryPoints: [fileURLToPath(new URL('../test/benchmark-workload.ts', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  write: false,
  tsconfigRaw: {}
});
assets.set('/workload.js', workload.outputFiles[0].contents);
const accuracy = await build({
  entryPoints: [fileURLToPath(new URL('./qualify-browser.mjs', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  write: false
});
assets.set('/accuracy.js', accuracy.outputFiles[0].contents);
const deformation = await build({
  entryPoints: [fileURLToPath(new URL('./qualify-deformation.mjs', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  write: false,
  tsconfigRaw: {}
});
assets.set('/deformation.js', deformation.outputFiles[0].contents);
assets.set(
  '/deformation/linear-enu.tif',
  readFileSync(new URL('../test/fixtures/deformation/linear-enu.tif', import.meta.url))
);
const verticalGeoTIFF = await build({
  entryPoints: [fileURLToPath(new URL('./qualify-vertical-geotiff.mjs', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  write: false,
  tsconfigRaw: {}
});
assets.set('/vertical-geotiff.js', verticalGeoTIFF.outputFiles[0].contents);
const verticalGeoTIFFReference = JSON.parse(
  readFileSync(new URL('../test/fixtures/vertical-geotiff-reference.json', import.meta.url))
);
for (const fixture of verticalGeoTIFFReference.cases)
  assets.set(
    '/' + fixture.file,
    readFileSync(new URL('../test/fixtures/' + fixture.file, import.meta.url))
  );
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
      console.error(name + ' qualification exceeded 300 seconds');
      void browser.close();
    }, 300000);
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
                const api = await import('/cold-' + backend + '.js');
                const loaded = performance.now();
                const instance = api.create();
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
            typescript: await import('/typescript.js'),
            proj4: await import('/proj4.js')
          };
          return measure(modules, options);
        },
        {
          points,
          samples,
          minSampleMs: Number(values['min-sample-ms']),
          distribution: values.distribution
        }
      );
      const independent = await page.evaluate(async () => {
        const {
          qualify,
          qualifyAccuracy,
          qualifyFactors,
          qualifyBulkLayouts,
          qualifyTemporalModels,
          qualifyVertical,
          qualifyPipelines,
          qualifyKinematicPipelines
        } = await import('/accuracy.js');
        const {qualifyVerticalGeoTIFF} = await import('/vertical-geotiff.js');
        const {qualifyDeformation} = await import('/deformation.js');
        const inputs = await (await fetch('/native-proj-cases.json')).json();
        const reference = await (await fetch('/native-proj-reference.json')).json();
        return {
          ...qualify(inputs, reference),
          accuracy: qualifyAccuracy(),
          factors: qualifyFactors(),
          bulkLayouts: qualifyBulkLayouts(),
          temporalModels: qualifyTemporalModels(),
          vertical: qualifyVertical(),
          verticalGeoTIFF: await qualifyVerticalGeoTIFF(),
          pipelines: qualifyPipelines(
            await (await fetch('/pipeline-horizontal.gsb')).arrayBuffer()
          ),
          kinematicPipelines: qualifyKinematicPipelines(),
          deformation: await qualifyDeformation()
        };
      });
      results.push({browser: name, version: browser.version(), cold, independent, ...warm});
      console.log(
        name +
          ': correctness passed; ' +
          warm.rows.length * 3 +
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
  schemaVersion: 2,
  metadata: {
    workloadSHA256: benchmarkFingerprint(),
    dependencies: benchmarkDependencies(),
    sourceSHA256: codeFingerprint(),
    date: new Date().toISOString(),
    platform: process.platform,
    arch: process.arch,
    cpu: cpus()[0]?.model,
    points,
    samples,
    minSampleMs: Number(values['min-sample-ms']),
    distribution: values.distribution
  },
  methodology:
    'Separate minified bundles; fresh contexts for cold module fetch/parse/evaluation, first construction and first projection. Warm transforms use the shared seeded scenario matrix and adaptive independent buffer copies, preconstructed converters, rotated execution order, reused scalar input and buffer resets outside timing. Median/p10/p90 are per-buffer; raw samples are aggregate milliseconds. All coordinates compared before timing. OS caches not flushed; browser clocks may quantize short samples. No CI timing thresholds.',
  results
};
if (values.output) writeFileSync(values.output, JSON.stringify(report, null, 2) + '\n');
