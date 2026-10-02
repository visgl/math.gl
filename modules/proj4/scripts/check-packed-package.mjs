// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Exercise actual npm tarballs in a temporary consumer, with no workspace source aliases.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, symlinkSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root = fileURLToPath(new URL('../../../', import.meta.url));
const temporary = mkdtempSync(join(tmpdir(), 'math-gl-proj4-packed-'));
function run(command, args, cwd = temporary) {
  return execFileSync(command, args, {cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']});
}
try {
  for (const name of ['types', 'core', 'crs', 'proj4']) {
    const [manifest] = JSON.parse(
      run(
        'npm',
        ['pack', '--ignore-scripts', '--json', '--pack-destination', temporary],
        join(root, 'modules', name)
      )
    );
    if (name === 'proj4') {
      assert(
        manifest.files.every(file => !file.path.startsWith('test/')),
        'Test grids must not ship in npm'
      );
    }
    const directory = join(temporary, 'node_modules', '@math.gl', name);
    mkdirSync(directory, {recursive: true});
    run('tar', [
      '-xzf',
      join(temporary, manifest.filename),
      '--strip-components=1',
      '-C',
      directory
    ]);
  }
  // Only the unmodified third-party dependency uses the already installed package and its dependencies.
  symlinkSync(join(root, 'node_modules', 'proj4'), join(temporary, 'node_modules', 'proj4'), 'dir');
  for (const name of [
    'PROJ4-LICENSE.md',
    'PROJ-LICENSE.txt',
    'APACHE-2.0-LICENSE.txt',
    'THIRD-PARTY-NOTICES.md'
  ]) {
    assert(readFileSync(join(temporary, 'node_modules/@math.gl/proj4', name), 'utf8').length > 100);
  }
  const packageManifest = JSON.parse(
    readFileSync(join(root, 'modules/proj4/package.json'), 'utf8')
  );
  const subpaths = Object.keys(packageManifest.exports).filter(
    path => path !== '.' && path !== './classic'
  );
  // Enumerate the manifest so every newly supported subpath must work in a real tarball.
  for (const [path, entry] of Object.entries(packageManifest.exports)) {
    if (path.startsWith('./native'))
      assert.deepEqual(entry, packageManifest.exports[path.replace('./native', './experimental')]);
  }
  // CJS descriptors must keep their package imports deferred, too.
  const packedRoot = join(temporary, 'node_modules/@math.gl/proj4');
  for (const [path, entry] of Object.entries(packageManifest.exports)) {
    if (!path.startsWith('./projections/lazy/')) continue;
    const cjs = readFileSync(join(packedRoot, entry.require), 'utf8');
    assert(
      cjs.includes('import("@math.gl/proj4/projections/'),
      path + ' must retain a dynamic import'
    );
    assert(!cjs.includes('function clenshaw'), path + ' must not inline a projection kernel');
  }
  const entrySmoke = `
    const stable = await load('@math.gl/proj4');
    assert.equal(stable.ProjectionEngine, api.ProjectionEngine);
    assert(!('TypeScriptProjection' in api));
    assert(!('checkTypeScriptCRSCompatibility' in api));
    assert.equal(stable.mercator, api.mercator);
    const subpaths = ${JSON.stringify(subpaths)};
    for (const subpath of subpaths) {
      const entry = await load('@math.gl/proj4' + subpath.slice(1));
      assert(Object.keys(entry).length > 0, subpath);
      for (const [name, value] of Object.entries(entry)) {
        if (subpath.startsWith('./projections/lazy')) {
          if (typeof value === 'function') assert(['lazyObliqueTransformation', 'LazyProjection'].includes(name));
          else { assert.equal(typeof value.preload, 'function'); assert.equal((await value.preload()).name, value.name); }
          continue;
        }
        assert(name in api, 'Unexpected public export: ' + name);
        assert.equal(typeof value, typeof api[name]);
        if (value && typeof value === 'object' && 'create' in value) assert.equal(value.name, api[name].name);
      }
    }
    const {LazyProjection} = await load('@math.gl/proj4/projections/lazy');
    const automatic = new LazyProjection({to: 'EPSG:32631'});
    assert(Math.abs((await automatic.project([3, 0]))[0] - 500000) < 1e-7);
    assert(Math.abs(automatic.projectSync([3, 0])[0] - 500000) < 1e-7);
    const core = await load('@math.gl/proj4/core');
    assert(!('TypeScriptProjection' in core));
    assert(!('checkTypeScriptCRSCompatibility' in core));
    assert.deepEqual(new core.ProjectionEngine({}).project([12, 55, 123, 8]), [12, 55, 123, 8]);
    const {ProjectionPipeline} = await load('@math.gl/proj4/pipeline');
    const pipeline = new ProjectionPipeline({input: {space: 'geographic', units: ['deg', 'deg', 'm']}, steps: [
      {type: 'unitconvert', xy: {from: 'deg', to: 'rad'}}, {type: 'projection', name: 'merc', parameters: {a: '6378137', b: '6378137'}}
    ], projections: [api.mercator]});
    const pipelinePoint = [11, 41, 123, 8];
    const pipelineBuffer = new Float64Array(pipelinePoint);
    assert.equal(pipeline.projectFlat(pipelineBuffer, 4), pipelineBuffer);
    assert.deepEqual(Array.from(pipelineBuffer), pipeline.project(pipelinePoint));
    assert(Math.abs(pipeline.unproject(pipeline.project(pipelinePoint))[0] - 11) < 1e-10);

    const exact = new ProjectionPipeline({input: {space: 'geocentric', units: ['m', 'm', 'm']}, steps: [
      {type: 'push', components: [3]},
      {type: 'helmert', translation: [100, -200, 30], rotation: [15000, -7000, 3000], convention: 'position_vector', exact: true},
      {type: 'pop', components: [3]}
    ]});
    const exactInput = [4000000, 1000000, 4800000, 8];
    const exactBuffer = new Float64Array(exactInput);
    exact.projectFlat(exactBuffer, 4);
    assert.deepEqual(Array.from(exactBuffer), exact.project(exactInput));
    assert.equal(exactBuffer[2], exactInput[2]);
    assert.equal(exactBuffer[3], 8);
    const fullExact = new ProjectionPipeline({input: exact.input, steps: [
      {type: 'helmert', translation: [100, -200, 30], rotation: [15000, -7000, 3000], convention: 'position_vector', exact: true}
    ]});
    fullExact.unproject(fullExact.project(exactInput)).forEach((value, index) => assert(Math.abs(value - exactInput[index]) < 1e-8));
    const {obliqueTransformation} = await load('@math.gl/proj4/projections/ob_tran');
    const rotated = new ProjectionPipeline({input: {space: 'geographic', units: ['rad', 'rad', 'm']}, projections: [obliqueTransformation('longlat')], steps: [
      {type: 'projection', name: 'ob_tran', parameters: {o_proj: 'longlat', o_lat_p: '45', o_lon_p: '-90'}, output: {space: 'geographic', unit: 'rad'}}
    ]});
    const rotatedPoint = [0.2, 0.7, 123, 8];
    rotated.unproject(rotated.project(rotatedPoint)).forEach((value, index) => assert(Math.abs(value - rotatedPoint[index]) < 1e-12));

    const {parseGTXGrid} = await load('@math.gl/proj4/grids/gtx');
    const {createVerticalGrid} = await load('@math.gl/proj4/grids/vertical');
    const local = createVerticalGrid({origin: [0, 0], step: [1, 1], size: [2, 2], offsets: [10, 20, 30, 40]});
    const height = new core.ProjectionEngine({from: '+proj=longlat +datum=WGS84 +geoidgrids=local', verticalGrids: {local}});
    assert.deepEqual(height.project([0, 0, 100, 7]), [0, 0, 110, 7]);
    const heights = new Float64Array([0, 0, 100, 7]);
    assert.equal(height.projectFlat(heights, 4), heights);
    assert.deepEqual(Array.from(heights), [0, 0, 110, 7]);
    const gtx = new ArrayBuffer(56), data = new DataView(gtx);
    data.setFloat64(16, 1); data.setFloat64(24, 1);
    data.setInt32(32, 2); data.setInt32(36, 2);
    for (let i = 0; i < 4; i++) data.setFloat32(40 + i * 4, 25);
    assert.equal(parseGTXGrid(gtx).getOffset(0, 0), 25);
    const {loadVerticalGeoTIFFGrid} = await load('@math.gl/proj4/grids/vertical-geotiff');
    const tiffGrid = await loadVerticalGeoTIFFGrid({getImageCount: async () => 1, getImage: async () => ({
      getWidth: () => 2, getHeight: () => 2,
      getGeoKeys: () => ({GTModelTypeGeoKey: 2, GTRasterTypeGeoKey: 2}),
      getGDALMetadata: sample => sample === 0 ? {DESCRIPTION: 'geoid_undulation'} : {TYPE: 'VERTICAL_OFFSET_GEOGRAPHIC_TO_VERTICAL'},
      fileDirectory: {ModelPixelScale: [1, 1, 0], ModelTiepoint: [0, 0, 0, 0, 1, 0]},
      readRasters: async () => [new Float32Array(4).fill(15)]
    })});
    assert.equal(tiffGrid.getOffset(0, 0), 15);
    assert.deepEqual(new core.ProjectionEngine({from: '+proj=longlat +geoidgrids=tiff', verticalGrids: {tiff: tiffGrid}}).project([0, 0, 100, 7]), [0, 0, 115, 7]);
    const descriptors = await load('@math.gl/proj4/projections/lazy/utm');
    const lazy = new core.ProjectionEngine({to: 'EPSG:32631', projections: [descriptors.lazyUniversalTransverseMercator]});
    await descriptors.lazyUniversalTransverseMercator.preload();
    assert(Math.abs(lazy.projectSync([3, 0])[0] - 500000) < 1e-7);
    assert(Math.abs((await lazy.project([3, 0]))[0] - 500000) < 1e-7);
    const {universalTransverseMercator} = await load('@math.gl/proj4/projections/utm');
    const utm = new core.ProjectionEngine({to: 'EPSG:32631', projections: [universalTransverseMercator]});
    assert(Math.abs(utm.project([3, 0])[0] - 500000) < 1e-7);
    const {wktCRSParser} = await load('@math.gl/proj4/parsers/wkt');
    const unsupported = 'PROJCS["Unsupported",GEOGCS["WGS84",DATUM["WGS_1984",SPHEROID["WGS84",6378137,298.257223563]],UNIT["degree",0.017453292519943295]],PROJECTION["Unimplemented"],UNIT["metre",1]]';
    assert.equal(core.checkProjectionCompatibility(unsupported, {parsers: [wktCRSParser]}).reason, 'missing-transform-stage');
    assert.throws(() => core.normalizeCRS(unsupported, {parsers: [wktCRSParser]}), error =>
      error instanceof core.TypeScriptCRSError && error instanceof api.TypeScriptCRSError);
    assert(!(new Error('unbranded') instanceof core.TypeScriptCRSError));
    class CustomError extends core.TypeScriptCRSError {}
    assert(new CustomError('invalid-definition', 'custom') instanceof api.TypeScriptCRSError);
    assert(!(new core.TypeScriptCRSError('invalid-definition', 'base') instanceof CustomError));
    const {parseWKTCRS} = await load('@math.gl/crs/wkt');
    const {parsePROJString} = await load('@math.gl/crs/proj-string');
    const {inferCRSRepresentation} = await load('@math.gl/crs/spatial-reference');
    assert.equal(typeof parseWKTCRS, 'function');
    assert.equal(typeof parsePROJString, 'function');
    assert.equal(inferCRSRepresentation('EPSG:4326'), 'identifier');
  `;
  const smoke = `
    assert.equal(api.Projection, api.Proj4Projection);
    assert.notEqual(api.Projection, wrapper.Proj4Projection);
    for (const Wrapper of [api.Projection, wrapper.Proj4Projection]) {
      Wrapper.defineProjectionAliases({'PACKED:UTM': '+proj=utm +zone=31 +datum=WGS84'});
      const p = new Wrapper({to: 'PACKED:UTM'});
      const project = p.project;
      const unproject = p.unproject;
      assert(Math.abs(project([3, 0])[0] - 500000) < 1e-8);
      assert(Math.abs(unproject([500000, 0])[0] - 3) < 1e-8);
    }
    assert(new api.Proj4Projection({}) instanceof api.ProjectionEngine);
    const projection = new api.ProjectionEngine({to: 'EPSG:3857', projections: [api.mercator]});
    const input = new Float64Array([12, 48, 123, 7]);
    const scalar = projection.project(Array.from(input));
    assert.equal(projection.projectFlat(input, 4), input);
    assert.deepEqual(Array.from(input), scalar);
    projection.unprojectFlat(input, 4);
    assert(Math.abs(input[0] - 12) < 1e-10);
    assert(Math.abs(input[1] - 48) < 1e-10);
    assert.equal(input[2], 123);
    assert.equal(input[3], 7);
    assert(new wrapper.Proj4Projection({to: 'EPSG:3857'}).project([0,0]).every(value => Math.abs(value) < 1e-8));
  `;
  writeFileSync(
    join(temporary, 'smoke.mjs'),
    "import assert from 'node:assert/strict'; import * as api from '@math.gl/proj4'; import * as wrapper from '@math.gl/proj4/classic';\n" +
      smoke +
      '\nconst load = specifier => import(specifier);\n' +
      entrySmoke
  );
  writeFileSync(
    join(temporary, 'smoke.cjs'),
    "const assert = require('node:assert/strict'); const api = require('@math.gl/proj4'); const wrapper = require('@math.gl/proj4/classic');\n" +
      smoke +
      '\nconst load = specifier => Promise.resolve(require(specifier));\n(async () => {' +
      entrySmoke +
      '})().catch(error => {console.error(error); process.exitCode = 1;});'
  );
  run(process.execPath, ['smoke.mjs']);
  run(process.execPath, ['smoke.cjs']);
  writeFileSync(join(temporary, 'package.json'), '{"type":"module"}');
  writeFileSync(
    join(temporary, 'consumer.ts'),
    `
    ${subpaths.map((path, index) => 'import * as entry' + index + " from '@math.gl/proj4" + path.slice(1) + "';\nvoid entry" + index + ';').join('\n')}
    import {LazyProjection, type LazyProjectionOptions} from '@math.gl/proj4/projections/lazy';
    const lazyOptions: LazyProjectionOptions = {to: 'EPSG:32631'};
    const automatic = new LazyProjection(lazyOptions);
    const automaticResult: Promise<number[]> = automatic.project([3, 0]);
    const automaticFlat: Promise<Float32Array> = automatic.projectFlat(new Float32Array([3, 0]));
    import {ProjectionEngine, checkProjectionCompatibility, type ProjectionPoint, type ProjectionEngineOptions, type ProjectionEngineCreateOptions, type ProjectionCompatibility} from '@math.gl/proj4/core';
    const engineOptions: ProjectionEngineOptions = {};
    const createOptions: ProjectionEngineCreateOptions = engineOptions;
    const configured: ProjectionEngine = new ProjectionEngine(engineOptions);
    const capability: ProjectionCompatibility = checkProjectionCompatibility('EPSG:4326');
    const eagerEngine: number[] = new ProjectionEngine({}).project([0, 0]);
    const createdEngine: Promise<ProjectionEngine> = ProjectionEngine.create(createOptions);

    import {Projection, Proj4Projection, type ProjectionOptions, type DatumGridOptions, type Proj4ProjectionOptions, type Proj4DatumGridOptions} from '@math.gl/proj4';
    import {Proj4Projection as Classic, type Proj4ProjectionOptions as ClassicOptions, type Proj4DatumGridOptions as ClassicGridOptions} from '@math.gl/proj4/classic';
    import {parseGTXGrid} from '@math.gl/proj4/grids/gtx';
    import {loadVerticalGeoTIFFGrid, type VerticalGridGeoTIFF, type VerticalGridGeoTIFFImage} from '@math.gl/proj4/grids/vertical-geotiff';
    const geoTIFFImage: VerticalGridGeoTIFFImage = {
      getWidth: () => 2, getHeight: () => 2,
      getGeoKeys: () => ({GTModelTypeGeoKey: 2, GTRasterTypeGeoKey: 2}),
      getGDALMetadata: async sample => sample === 0 ? {DESCRIPTION: 'geoid_undulation'} : {TYPE: 'VERTICAL_OFFSET_GEOGRAPHIC_TO_VERTICAL'},
      fileDirectory: {getValue: name => name === 'ModelPixelScale' ? [1, 1, 0] : undefined},
      readRasters: async options => [new Float32Array(4)]
    };
    const geoTIFF: VerticalGridGeoTIFF = {getImageCount: async () => 1, getImage: async () => geoTIFFImage};
    const loadedGeoTIFF: Promise<import('@math.gl/proj4/core').VerticalGrid> = loadVerticalGeoTIFFGrid(geoTIFF);
    import {createGeoidGrid, createVerticalGrid, type VerticalGridOptions} from '@math.gl/proj4/grids/vertical';
    import type {VerticalGridCollection} from '@math.gl/proj4/core';
    const verticalOptions: VerticalGridOptions = {origin: [0, 0], step: [1, 1], size: [2, 2], offsets: [1, 2, 3, 4]};
    const verticalGrids: VerticalGridCollection = {local: createVerticalGrid(verticalOptions), geoid: createGeoidGrid({getHeight: () => 1})};
    const heightOptions: ProjectionOptions = {from: '+proj=longlat +geoidgrids=local', verticalGrids};
    new Projection(heightOptions).project([0, 0, 1]);
    new LazyProjection({...heightOptions, verticalGrids});
    const readGTX: (buffer: ArrayBuffer) => typeof verticalGrids.local = parseGTXGrid;
    type WrapperAPI = Pick<Classic, keyof Classic>;
    const compatible: WrapperAPI = new Projection({});
    const legacy: Proj4Projection = new Projection({});
    const modern: Projection = new Proj4Projection({});
    const options: ProjectionOptions = {} as Proj4ProjectionOptions;
    const gridOptions: DatumGridOptions = {} as Proj4DatumGridOptions;
    const methods: Pick<typeof Classic, 'defineProjectionAliases' | 'registerDatumGrid'> = Proj4Projection;
    const ctor: new (options: ClassicOptions) => WrapperAPI = Proj4Projection;
    const tsOptions: Proj4ProjectionOptions = {} as ClassicOptions;
    const classicOptions: ClassicOptions = {} as Proj4ProjectionOptions;
    const tsGrid: Proj4DatumGridOptions = {} as ClassicGridOptions;
    const classicGrid: ClassicGridOptions = {} as Proj4DatumGridOptions;
    import {lazyUniversalTransverseMercator} from '@math.gl/proj4/projections/lazy/utm';
    const lazy = new ProjectionEngine({to: 'EPSG:32631', projections: [lazyUniversalTransverseMercator]});
    const asyncResult: Promise<number[]> = lazy.project([3, 0]);
    const syncResult: number[] = lazy.projectSync([3, 0]);
    const asyncBuffer: Promise<Float64Array> = lazy.projectFlat(new Float64Array([3, 0]));
    const mixed = new ProjectionEngine({to: 'EPSG:32631', projections: [mercator, lazyUniversalTransverseMercator]});
    const mixedResult: Promise<number[]> = mixed.project([3, 0]);
    import {ProjectionPipeline, type PipelineStep, type ProjectionPipelineOptions, type PipelineProjectionOutput} from '@math.gl/proj4/pipeline';
    const pipelineOptions: ProjectionPipelineOptions = {input: {space: 'geographic', units: ['deg', 'deg', 'm']}, steps: [{type: 'unitconvert', xy: {from: 'deg', to: 'rad'}}]};
    const rotationOutput: PipelineProjectionOutput = {space: 'geographic', unit: 'rad'};
    const stackSteps: PipelineStep[] = [{type: 'push', components: [3]}, {type: 'pop', components: [3]}];
    const exactStep: PipelineStep = {type: 'helmert', translation: [1, 2, 3], rotation: [1, 2, 3], convention: 'position_vector', exact: true, omitInverse: true};
    // @ts-expect-error M is preserved, never used as an ordinate stack or epoch.
    const measureStack: PipelineStep = {type: 'push', components: [4]};
    // @ts-expect-error Geographic helper output cannot have linear units.
    const mixedOutput: PipelineProjectionOutput = {space: 'geographic', unit: 'm'};
    const pipeline = new ProjectionPipeline(pipelineOptions);
    const pipelineScalar: number[] = pipeline.project([0, 0]);
    const pipelineFlat: Float32Array = pipeline.projectFlat(new Float32Array([0, 0]));
    const deferredPipeline = new ProjectionPipeline({...pipelineOptions, projections: [lazyUniversalTransverseMercator]});
    const deferredScalar: Promise<number[]> = deferredPipeline.project([0, 0]);
    const deferredFlat: Promise<Float64Array> = deferredPipeline.projectFlat(new Float64Array([0, 0]));
    const explicitSync: number[] = deferredPipeline.projectSync([0, 0]);
    // @ts-expect-error Integer buffers are not supported.
    pipeline.projectFlat(new Int32Array([0, 0]));
    // @ts-expect-error Unknown operations are not supported.
    const unknownStep: PipelineStep = {type: 'affine'};
    // @ts-expect-error Unknown unit names are not supported.
    const unknownUnits: PipelineStep = {type: 'unitconvert', xy: {from: 'degree', to: 'rad'}};
    // @ts-expect-error Time-dependent parameters are not supported.
    const dynamicStep: PipelineStep = {type: 'helmert', translation: [0, 0, 0], epoch: 2020};
    import {mercator} from '@math.gl/proj4/projections/merc';
    import {parseWKTCRS} from '@math.gl/crs/wkt';
    import {parsePROJString} from '@math.gl/crs/proj-string';
    import {inferCRSRepresentation} from '@math.gl/crs/spatial-reference';
    void [parseWKTCRS, parsePROJString, inferCRSRepresentation];
    const projection = new ProjectionEngine({to: 'EPSG:3857', projections: [mercator]});
    const a: Float32Array = projection.projectFlat(new Float32Array([1, 2]));
    const b: Float64Array = projection.unprojectFlat(new Float64Array([1, 2]));
    const point: ProjectionPoint = {x: 0, y: 0, z: 0};
    // @ts-expect-error Integer buffers are not supported.
    projection.projectFlat(new Int32Array([1, 2]));
  `
  );
  writeFileSync(
    join(temporary, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'ES2020',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        strict: true,
        skipLibCheck: false,
        noEmit: true,
        types: []
      },
      files: ['consumer.ts']
    })
  );
  run(process.execPath, [
    join(root, 'node_modules/typescript/bin/tsc'),
    '--project',
    'tsconfig.json'
  ]);
  // A CommonJS TypeScript consumer must also resolve each declaration condition.
  writeFileSync(join(temporary, 'consumer.cts'), readFileSync(join(temporary, 'consumer.ts')));
  const configPath = join(temporary, 'tsconfig.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  config.files = ['consumer.cts'];
  writeFileSync(configPath, JSON.stringify(config));
  run(process.execPath, [
    join(root, 'node_modules/typescript/bin/tsc'),
    '--project',
    'tsconfig.json'
  ]);
  console.log(
    'Packed proj4 ESM, CommonJS, all subpath declarations, typed-array API and licenses passed'
  );
} catch (error) {
  if (error.stdout) console.error(error.stdout.toString());
  if (error.stderr) console.error(error.stderr.toString());
  throw error;
} finally {
  rmSync(temporary, {recursive: true, force: true});
}
