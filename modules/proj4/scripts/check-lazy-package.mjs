// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Verify deferred code in the transitive initial graph, not merely a dynamic import.
import assert from 'node:assert/strict';
import {mkdtempSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {gzipSync} from 'node:zlib';
import {build} from 'esbuild';

const packageRoot = fileURLToPath(new URL('../', import.meta.url));
const temporary = mkdtempSync(join(tmpdir(), 'math-gl-proj4-lazy-'));
const budgets = JSON.parse(
  readFileSync(new URL('../test/fixtures/bundle-budgets.json', import.meta.url), 'utf8')
);
const measurements = {};
const scenarios = {
  catalogue: {
    imports: "import {LazyProjection} from '@math.gl/proj4/projections/lazy';",
    load: "return new LazyProjection({to: 'EPSG:32631'});",
    deferred: '/experimental/kernels/etmerc.js',
    expected: [500000, 0],
    point: [3, 0]
  },
  utm: {
    imports: "import {lazyUniversalTransverseMercator} from '@math.gl/proj4/projections/lazy/utm';",
    load: "return new TypeScriptProjection({to: 'EPSG:32631', projections: [lazyUniversalTransverseMercator]});",
    deferred: '/experimental/kernels/etmerc.js',
    expected: [500000, 0],
    point: [3, 0]
  },
  wkt: {
    load: `const {wktCRSParser} = await import('@math.gl/proj4/parsers/wkt'); return new TypeScriptProjection({to: 'GEOGCS["WGS84",DATUM["WGS_1984",SPHEROID["WGS84",6378137,298.257223563]],UNIT["degree",0.017453292519943295]]', parsers: [wktCRSParser]});`,
    deferred: '/experimental/crs/wkt.js',
    expected: [3, 0],
    point: [3, 0]
  },
  rotated: {
    load: "const [{obliqueTransformation}, {mollweide}] = await Promise.all([import('@math.gl/proj4/projections/ob_tran'), import('@math.gl/proj4/projections/moll')]); return new TypeScriptProjection({to: '+proj=ob_tran +o_lat_p=45 +o_lon_p=0', projections: [obliqueTransformation(mollweide)]});",
    deferred: '/experimental/kernels/moll.js',
    point: [3, 30]
  }
};
try {
  for (const [name, scenario] of Object.entries(scenarios)) {
    const result = await build({
      stdin: {
        contents: `import {TypeScriptProjection} from '@math.gl/proj4/core';
import {mercator} from '@math.gl/proj4/projections/merc';
${scenario.imports || ''}
export const eager = new TypeScriptProjection({to: 'EPSG:3857', projections: [mercator]});
export async function load() {${scenario.load}}`,
        resolveDir: packageRoot,
        sourcefile: 'application.js'
      },
      absWorkingDir: packageRoot,
      outdir: join(temporary, name),
      outExtension: {'.js': '.mjs'},
      entryNames: 'application',
      tsconfigRaw: {},
      bundle: true,
      splitting: true,
      format: 'esm',
      platform: 'browser',
      target: 'es2020',
      minify: true,
      metafile: true
    });
    const outputs = new Map(
      Object.entries(result.metafile.outputs).map(([path, output]) => [
        resolve(packageRoot, path),
        output
      ])
    );
    const entry = [...outputs].find(
      ([, output]) => output.entryPoint === 'application.js' || output.entryPoint === '<stdin>'
    )?.[0];
    assert(entry, 'Missing application entry');
    function closure(path, visited = new Set()) {
      if (visited.has(path)) return visited;
      visited.add(path);
      const output = outputs.get(path);
      assert(output, 'Unresolved output: ' + path);
      for (const dependency of output.imports) {
        assert(!dependency.external, 'Browser bundle has an external runtime dependency');
        if (dependency.kind !== 'dynamic-import')
          closure(resolve(packageRoot, dependency.path), visited);
      }
      return visited;
    }
    const initial = closure(entry);
    const emittedInputs = paths =>
      [...paths].flatMap(path =>
        Object.entries(outputs.get(path).inputs)
          .filter(([, input]) => input.bytesInOutput > 0)
          .map(([input]) => input)
      );
    const initialInputs = emittedInputs(initial);
    assert(
      !initialInputs.some(path =>
        /\/experimental\/(kernels|entries\/projections\/(?!merc\.js)|crs\/(wkt|projjson|structured)|grids\/(ntv2|geotiff|grid))/.test(
          path
        )
      ),
      'Optional code was hoisted into the initial graph'
    );
    assert(
      !initialInputs.some(path => path.endsWith('/crs/dist/wkt-crs.js')),
      'Shared CRS WKT syntax was hoisted into the initial graph'
    );
    assert(
      emittedInputs(outputs.keys()).some(path => path.endsWith(scenario.deferred)),
      'Expected deferred implementation is absent'
    );
    assert(
      !Object.keys(result.metafile.inputs).some(path =>
        /node_modules\/(proj4|geotiff)\//.test(path)
      ),
      'Native split bundles must not import proj4js or a GeoTIFF decoder'
    );
    function size(paths) {
      let minified = 0,
        gzip = 0;
      for (const path of paths) {
        const bytes = readFileSync(path);
        minified += bytes.length;
        gzip += gzipSync(bytes, {level: 9}).length;
      }
      return {minified, gzip};
    }
    measurements[name] = {
      initial: size(initial),
      deferred: size([...outputs.keys()].filter(path => !initial.has(path)))
    };
    if (!process.argv.includes('--measure')) {
      for (const metric of ['minified', 'gzip']) {
        const initialSize = measurements[name].initial[metric];
        const initialLimit = (budgets.lazyInitialLimits?.[name] || budgets.limits.mercator)[metric];
        assert(
          initialSize <= initialLimit,
          `${name}: initial ${metric} ${initialSize} exceeds budget ${initialLimit}`
        );
        assert(
          measurements[name].deferred[metric] <= budgets.lazyLimits[name][metric],
          `${name}: deferred ${metric} exceeds budget`
        );
      }
    }
    // Execute the emitted chunks from disk, including shared dependencies.
    const application = await import(pathToFileURL(entry).href);
    assert.deepEqual(application.eager.project([0, 0]), [0, 0]);
    const projection = await application.load();
    if (['utm', 'catalogue'].includes(name))
      assert.throws(() => projection.projectSync(scenario.point), /preload/);
    const xy = await projection.project(scenario.point);
    if (scenario.expected)
      xy.forEach((value, i) => assert(Math.abs(value - scenario.expected[i]) < 1e-7));
    (await projection.unproject(xy)).forEach((value, i) =>
      assert(Math.abs(value - scenario.point[i]) < 1e-7)
    );
    const flat = new Float64Array(scenario.point);
    await projection.projectFlat(flat);
    if (name === 'utm') assert.deepEqual(projection.projectSync(scenario.point), xy);
    assert.deepEqual([...flat], xy);
  }
  console.log(JSON.stringify(measurements, null, 2));
} finally {
  rmSync(temporary, {recursive: true, force: true});
}
