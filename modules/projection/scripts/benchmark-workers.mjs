// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original optional worker end-to-end evaluation; no backend promotion or third-party binary.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {transform} from 'esbuild';
import {gzipSync} from 'node:zlib';
import {readFileSync, writeFileSync, mkdtempSync, rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir, cpus} from 'node:os';
import {fileURLToPath} from 'node:url';
import {createServer} from 'node:http';
import {parseArgs} from 'node:util';
import {chromium, firefox, webkit} from 'playwright';
import {bundleRuntime} from './benchmark-runtime.mjs';
import {codeFingerprint} from './benchmark-metadata.mjs';
const {values} = parseArgs({
  options: {
    browser: {type: 'string', default: 'chromium'},
    points: {type: 'string', default: '1000,10000,100000'},
    samples: {type: 'string', default: '7'},
    output: {type: 'string'}
  }
});
const points = values.points.split(',').map(Number),
  samples = Number(values.samples);
assert(points.length && points.every(n => Number.isSafeInteger(n) && n >= 10 && n <= 1000000));
assert(Number.isSafeInteger(samples) && samples >= 3 && samples <= 31);
const browsers = {chromium, firefox, webkit};
assert(Object.hasOwn(browsers, values.browser));
const root = fileURLToPath(new URL('../../../', import.meta.url)),
  directory = mkdtempSync(join(tmpdir(), 'math-gl-workers-'));
const workerSource = `import {createWorkerEngine} from '/engine.js';
let projection;
onmessage=({data})=>{
  if(data.type==='init'){projection=createWorkerEngine(data.to);postMessage({ready:true});return;}
  const {coordinates,inverse}=data;
  try {projection[inverse?'unprojectFlatSync':'projectFlatSync'](coordinates,4);postMessage({coordinates},[coordinates.buffer]);}
  catch(error){postMessage({error:String(error),coordinates},[coordinates.buffer]);}
};`;
let server, browser, browserServer, watchdog;
try {
  const outfile = join(directory, 'engine.js');
  await bundleRuntime(root, 'modules/projection/test/worker-benchmark-entry.ts', outfile);
  const engine = Buffer.from(
    (
      await transform(readFileSync(outfile, 'utf8'), {
        minify: true,
        target: 'es2020',
        legalComments: 'none'
      })
    ).code
  );
  server = createServer((request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    if (request.url === '/engine.js') {
      response.setHeader('Content-Type', 'text/javascript');
      response.end(engine);
    } else if (request.url === '/worker.js') {
      response.setHeader('Content-Type', 'text/javascript');
      response.end(workerSource);
    } else response.end('<!doctype html><title>Projection worker evaluation</title>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  browserServer = await browsers[values.browser].launchServer({headless: true, timeout: 30000});
  watchdog = setTimeout(() => {
    console.error(values.browser + ' worker evaluation exceeded 90 seconds');
    // A hung renderer can also stall graceful close; kill only this owned browser.
    void browserServer.kill();
  }, 90000);
  browser = await browsers[values.browser].connect(browserServer.wsEndpoint(), {timeout: 30000});
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:' + server.address().port);
  const evaluation = await page.evaluate(
    async ({sizes, samples}) => {
      const importStart = performance.now();
      const {createWorkerEngine} = await import('/engine.js');
      const mainModuleImportMs = performance.now() - importStart;
      const rows = [],
        startup = [],
        mainPreparation = [];
      const spawn = async to => {
        const begin = performance.now(),
          worker = new Worker('/worker.js', {type: 'module'});
        await new Promise((resolve, reject) => {
          worker.onmessage = () => resolve();
          worker.onerror = reject;
          worker.postMessage({type: 'init', to});
        });
        startup.push({to, milliseconds: performance.now() - begin});
        return worker;
      };
      const run = (worker, coordinates, inverse) =>
        new Promise((resolve, reject) => {
          const before = coordinates.length;
          worker.onmessage = ({data}) => {
            if (data.error) reject(new Error(data.error));
            else resolve(data.coordinates);
          };
          worker.onerror = reject;
          worker.postMessage({coordinates, inverse}, [coordinates.buffer]);
          if (before && coordinates.byteLength !== 0)
            reject(new Error('Transfer failed to detach input'));
        });
      for (const to of ['EPSG:3857', 'EPSG:32631']) {
        const prepareStart = performance.now(),
          projection = createWorkerEngine(to);
        mainPreparation.push({to, milliseconds: performance.now() - prepareStart});
        const workers = [await spawn(to), await spawn(to)];
        try {
          for (const Type of [Float64Array, Float32Array])
            for (const count of sizes)
              for (const inverse of [false, true]) {
                const source = new Type(count * 4);
                for (let i = 0; i < count; i++) {
                  source[i * 4] = 1 + (i % 97) / 24;
                  source[i * 4 + 1] = 40 + (i % 127) / 9;
                  source[i * 4 + 2] = i % 13;
                  source[i * 4 + 3] =
                    i % 19 === 0 ? NaN : i % 23 === 0 ? -0 : i % 29 === 0 ? Infinity : i % 17;
                }
                if (inverse) projection.projectFlatSync(source, 4);
                const expected = source.slice();
                projection[inverse ? 'unprojectFlatSync' : 'projectFlatSync'](expected, 4);
                const runners = [
                  () => {
                    const output = source.slice();
                    projection[inverse ? 'unprojectFlatSync' : 'projectFlatSync'](output, 4);
                    return output;
                  },
                  () => run(workers[0], source.slice(), inverse),
                  async () => {
                    const split = Math.floor(count / 2) * 4;
                    return await Promise.all([
                      run(workers[0], source.slice(0, split), inverse),
                      run(workers[1], source.slice(split), inverse)
                    ]);
                  }
                ];
                for (const runner of runners) {
                  const result = await runner(),
                    parts = Array.isArray(result) ? result : [result];
                  let offset = 0;
                  for (const part of parts)
                    for (const value of part) {
                      if (!Object.is(value, expected[offset++]))
                        throw new Error('Worker numeric/payload mismatch');
                    }
                  if (offset !== source.length) throw new Error('Worker length mismatch');
                }
                for (let warm = 0; warm < 3; warm++) for (const runner of runners) await runner();
                const times = runners.map(() => []);
                for (let sample = 0; sample < samples; sample++)
                  for (let order = 0; order < 3; order++) {
                    const index = (sample + order) % 3,
                      start = performance.now();
                    await runners[index]();
                    times[index].push(performance.now() - start);
                  }
                rows.push({
                  to,
                  type: Type.name,
                  count,
                  inverse,
                  measurements: times.map((raw, index) => {
                    const sorted = raw.slice().sort((a, b) => a - b);
                    return {
                      implementation: ['main thread', 'one worker', 'two workers'][index],
                      medianMs: sorted[Math.floor(samples / 2)],
                      p10Ms: sorted[Math.floor((samples - 1) * 0.1)],
                      p90Ms: sorted[Math.floor((samples - 1) * 0.9)],
                      resolutionLimited: sorted[Math.floor(samples / 2)] < 1,
                      unstable: sorted.at(-1) > Math.max(0.1, sorted[0]) * 1.5,
                      samples: raw
                    };
                  })
                });
              }
          // Failed records are returned with their prefix commits, not silently dropped.
          const failed = new Float64Array([3, 40, 7, 8, 3, 100, 9, 10]);
          const expected = failed.slice();
          projection.projectFlatSync(expected.subarray(0, 4), 4);
          const failure = await new Promise(resolve => {
            workers[0].onmessage = event => resolve(event.data);
            workers[0].postMessage({coordinates: failed, inverse: false}, [failed.buffer]);
          });
          if (!failure.error || failure.coordinates.some((v, i) => !Object.is(v, expected[i])))
            throw new Error('Worker failed-record contract');
        } finally {
          workers.forEach(worker => worker.terminate());
        }
      }
      const simd = [
        0,
        97,
        115,
        109,
        1,
        0,
        0,
        0,
        1,
        4,
        1,
        96,
        0,
        0,
        3,
        2,
        1,
        0,
        10,
        23,
        1,
        21,
        0,
        253,
        12,
        ...new Array(16).fill(0),
        26,
        11
      ];
      return {
        rows,
        startup,
        mainModuleImportMs,
        mainPreparation,
        capabilities: {
          webAssembly: typeof WebAssembly !== 'undefined',
          wasmSIMD:
            typeof WebAssembly !== 'undefined' && WebAssembly.validate(new Uint8Array(simd)),
          webGPU: 'gpu' in navigator
        }
      };
    },
    {sizes: points, samples}
  );
  const report = {
    schemaVersion: 1,
    metadata: {
      date: new Date().toISOString(),
      browser: values.browser,
      version: browser.version(),
      cpu: cpus()[0]?.model,
      platform: process.platform,
      arch: process.arch,
      sourceSHA256: codeFingerprint(),
      workloadSHA256: createHash('sha256')
        .update(readFileSync(new URL('../test/worker-benchmark-entry.ts', import.meta.url)))
        .update(readFileSync(fileURLToPath(import.meta.url)))
        .digest('hex'),
      points,
      samples,
      engineModuleBytes: engine.length,
      engineGzipBytes: gzipSync(engine, {level: 9}).length,
      workerBootstrapBytes: Buffer.byteLength(workerSource),
      workerBootstrapGzipBytes: gzipSync(workerSource, {level: 9}).length
    },
    methodology:
      'Prepared engine versus persistent one/two application workers, both precisions/directions, XYZM. Main-thread clone, worker clone/partition, transfer and scheduling included in warm elapsed timing. Worker import/preparation measured separately with no-store assets. Three warmups and rotated samples; exact numeric/signed-zero/NaN/payload comparisons precede timing. Capability probes do not benchmark or qualify Wasm/SIMD/WebGPU algorithms. No production backend selected or implicit workers created.',
    ...evaluation
  };
  console.table(
    report.rows
      .filter(r => r.type === 'Float64Array' && !r.inverse)
      .map(r => ({
        to: r.to,
        count: r.count,
        main: r.measurements[0].medianMs,
        one: r.measurements[1].medianMs,
        two: r.measurements[2].medianMs,
        twoRatio: r.measurements[0].medianMs / r.measurements[2].medianMs
      }))
  );
  if (values.output) writeFileSync(values.output, JSON.stringify(report, null, 2) + '\n');
} finally {
  clearTimeout(watchdog);
  await browserServer?.kill();
  await browser?.close();
  if (server) {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
  rmSync(directory, {recursive: true, force: true});
}
