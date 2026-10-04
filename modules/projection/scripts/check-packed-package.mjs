// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Exercise actual npm tarballs in a temporary consumer, with no workspace source aliases.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root = fileURLToPath(new URL('../../../', import.meta.url));
const temporary = mkdtempSync(join(tmpdir(), 'math-gl-proj4-packed-'));
function run(command, args, cwd = temporary) {
  return execFileSync(command, args, {cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']});
}
try {
  for (const name of ['types', 'core', 'culling', 'crs', 'geospatial', 'projection']) {
    const [manifest] = JSON.parse(
      run(
        'npm',
        ['pack', '--ignore-scripts', '--json', '--pack-destination', temporary],
        join(root, 'modules', name)
      )
    );
    if (name === 'projection') {
      assert(
        manifest.files.every(
          file => !file.path.startsWith('src/classic.') && !file.path.startsWith('dist/classic.')
        ),
        'Removed classic wrapper must not ship in npm'
      );
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
  for (const name of [
    'PROJ4-LICENSE.md',
    'PROJ-LICENSE.txt',
    'APACHE-2.0-LICENSE.txt',
    'THIRD-PARTY-NOTICES.md'
  ]) {
    assert(
      readFileSync(join(temporary, 'node_modules/@math.gl/projection', name), 'utf8').length > 100
    );
  }
  assert(
    readFileSync(join(temporary, 'node_modules/@math.gl/core/PROJ4-LICENSE.md'), 'utf8').includes(
      'Calvin Metcalf'
    )
  );
  const packageManifest = JSON.parse(
    readFileSync(join(root, 'modules/projection/package.json'), 'utf8')
  );
  assert(!('proj4' in packageManifest.dependencies));
  assert(!('./classic' in packageManifest.exports));
  const subpaths = Object.keys(packageManifest.exports).filter(path => path !== '.');
  // Enumerate the manifest so every newly supported subpath must work in a real tarball.
  for (const [path, entry] of Object.entries(packageManifest.exports)) {
    if (path.startsWith('./native'))
      assert.deepEqual(entry, packageManifest.exports[path.replace('./native', './experimental')]);
  }
  // CJS descriptors must keep their package imports deferred, too.
  const packedRoot = join(temporary, 'node_modules/@math.gl/projection');
  for (const [path, entry] of Object.entries(packageManifest.exports)) {
    if (!path.startsWith('./projections/lazy/')) continue;
    const cjs = readFileSync(join(packedRoot, entry.require), 'utf8');
    assert(
      cjs.includes('import("@math.gl/projection/projections/'),
      path + ' must retain a dynamic import'
    );
    assert(!cjs.includes('function clenshaw'), path + ' must not inline a projection kernel');
  }
  const entrySmoke = `
    const stable = await load('@math.gl/projection');
    assert.equal(stable.ProjectionEngine, api.ProjectionEngine);
    assert(!('TypeScriptProjection' in api));
    assert(!('checkTypeScriptCRSCompatibility' in api));
    assert.equal(stable.mercator, api.mercator);
    const subpaths = ${JSON.stringify(subpaths)};
    const optionalEntries = {
      './bulk': ['ProjectionBuffer'],
      './operations': ['OperationCatalog'],
      './analysis': ['ProjectionAnalysis', 'createProjectionJacobian', 'createProjectionFactors'],
      './deformation': ['createDeformationModel'],
      './grids/velocity': ['createVelocityGrid'],
      './grids/velocity-geotiff': ['loadVelocityGeoTIFFGrid']
    };
    for (const names of Object.values(optionalEntries)) for (const name of names)
      assert(!(name in api), name + ' must remain outside the root');
    for (const subpath of subpaths) {
      const entry = await load('@math.gl/projection' + subpath.slice(1));
      assert(Object.keys(entry).length > 0, subpath);
      if (optionalEntries[subpath]) {
        assert.deepEqual(Object.keys(entry).sort(), optionalEntries[subpath].slice().sort());
        for (const name of optionalEntries[subpath]) assert.equal(typeof entry[name], 'function');
        continue;
      }
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
    const {LazyProjection} = await load('@math.gl/projection/projections/lazy');
    const automatic = new LazyProjection({to: 'EPSG:32631'});
    assert(Math.abs((await automatic.project([3, 0]))[0] - 500000) < 1e-7);
    assert(Math.abs(automatic.projectSync([3, 0])[0] - 500000) < 1e-7);
    const core = await load('@math.gl/projection/core');
    const {spheroidToCartesian, cartesianToSpheroid} = await load('@math.gl/core/spheroid');
    const numericOutput = {x:0,y:0,z:3};
    const numericGeometry = {semiMajorAxis:10,semiMinorAxis:5,eccentricitySquared:.75};
    assert(spheroidToCartesian(numericOutput,numericGeometry));
    assert.deepEqual(numericOutput,{x:13,y:0,z:0});
    assert(cartesianToSpheroid(numericOutput,numericGeometry));
    assert.deepEqual(numericOutput,{x:0,y:0,z:3});
    assert(!cartesianToSpheroid({x:0,y:0,z:0},numericGeometry,numericOutput));
    assert.deepEqual(numericOutput,{x:0,y:0,z:3});
    const frames = await load('@math.gl/core/local-frame');
    const basis = frames.createLocalFrameBasis();
    assert(frames.eastNorthUpBasis(0,0,basis));
    const velocityPoint = {x:1,y:2,z:3};
    assert(frames.localToFixed(velocityPoint,basis));
    assert.deepEqual(velocityPoint,{x:3,y:1,z:2});
    assert(frames.fixedToLocal(velocityPoint,basis));
    assert.deepEqual(velocityPoint,{x:1,y:2,z:3});
    assert(frames.eastNorthUpBasisFromDirections({x:0,y:1,z:0},{x:1,y:0,z:0},basis));
    const frameMatrix = new Float64Array(16);
    assert(frames.localFrameToMatrix(basis,{x:10,y:0,z:0},'north','east','down',frameMatrix));
    [0,0,1,0,0,1,0,0,-1,0,0,0,10,0,0,1].forEach((v,i)=>assert(Math.abs(frameMatrix[i]-v)<1e-15));
    assert(!frames.eastNorthUpBasis(0,Infinity,basis));
    const {Ellipsoid} = await load('@math.gl/geospatial');
    const equatorialFrame = new Ellipsoid(10,10,5).eastNorthUpToFixedFrame([10,0,0],[]);
    [0,1,0,0,0,0,1,0,1,0,0,0,10,0,0,1].forEach((v,i)=>assert(Math.abs(equatorialFrame[i]-v)<1e-15));
    const shape = Ellipsoid.fromSpheroid(core.normalizeCRS('EPSG:4326').ellipsoid);
    const axes = shape.toSpheroid();
    assert(Object.isFrozen(axes));
    assert.deepEqual(axes, {semiMajorAxis: 6378137, semiMinorAxis: 6356752.314245179});
    const geocentric = new core.ProjectionEngine({to: 'EPSG:4978', projections: [api.geocentric]});
    const llh = [12, 55, 100];
    const expectedXYZ = geocentric.project(llh);
    const actualXYZ = shape.cartographicToCartesian(llh);
    for (let i = 0; i < 3; i++) assert(Math.abs(actualXYZ[i] - expectedXYZ[i]) < 1e-5);
    const polarXYZ = shape.cartographicToCartesian([123,89.999999,100]);
    const polarOutput = [7,8,9];
    assert.equal(shape.cartesianToCartographic(polarXYZ,polarOutput),polarOutput);
    assert(Math.abs(polarOutput[1]-89.999999)<1e-9);
    const untouched = [7,8,9];
    assert.equal(shape.cartesianToCartographic([Infinity,1,2],untouched),undefined);
    assert.deepEqual(untouched,[7,8,9]);
    const spherical = new core.ProjectionEngine({from:'+proj=longlat +R=2',to:'+proj=geocent +R=2',projections:[api.geocentric]});
    assert(Math.abs(spherical.unproject([1e-13,1e-13,0])[0]-45)<1e-12);
    assert.throws(() => new Ellipsoid(1, 2, 3).toSpheroid());

    assert(!('TypeScriptProjection' in core));
    assert(!('checkTypeScriptCRSCompatibility' in core));
    assert.deepEqual(new core.ProjectionEngine({}).project([12, 55, 123, 8]), [12, 55, 123, 8]);
    const {ProjectionBuffer} = await load('@math.gl/projection/bulk');
    const bufferProjection = new core.ProjectionEngine({to:'EPSG:3857',projections:[api.mercator]});
    const bufferInput = new Float64Array([3,40,12,7,4,50,20,9]);
    const bufferOutput = new Float32Array(8);
    const buffers = new ProjectionBuffer({projection:bufferProjection,dimension:4});
    assert.equal(buffers.projectFlatTo(bufferInput,bufferOutput),bufferOutput);
    assert.deepEqual([...bufferOutput], [...new Float32Array(bufferProjection.project(bufferInput.slice(0,4))),...new Float32Array(bufferProjection.project(bufferInput.slice(4)))]);
    const bufferColumns = [new Float64Array([3,4]),new Float64Array([40,50]),new Float64Array([12,20]),new Float64Array([7,9])];
    const bufferColumnOutput = bufferColumns.map(()=>new Float32Array(2));
    assert.equal(buffers.projectColumnsTo(bufferColumns,bufferColumnOutput),bufferColumnOutput);
    for(let i=0;i<4;i++) for(let j=0;j<2;j++) assert.equal(bufferColumnOutput[i][j],bufferOutput[j*4+i]);
    const {ProjectionAnalysis, createProjectionFactors, createProjectionJacobian} = await load('@math.gl/projection/analysis');
    const inspected = new ProjectionAnalysis({projection: api.mercator, context: {semiMajorAxis:10,eccentricitySquared:0,parameters:{}}, domain:{west:-1,east:1,south:-1,north:1}});
    const factors = createProjectionFactors(), jacobian = createProjectionJacobian();
    assert(inspected.factors(0,0,factors)); assert(inspected.jacobian(0,0,jacobian));
    assert(Math.abs(factors.meridionalScale - 1) < 1e-10);
    assert(Math.abs(jacobian.dxDLongitude - 10) < 1e-10);
    const {OperationCatalog} = await load('@math.gl/projection/operations');
    const createOperation = () => new core.ProjectionEngine({});
    const selection = new OperationCatalog([{
      id:'authored',sourceCRS:'app:source',targetCRS:'app:target',area:[-180,-90,180,90],
      epochRange:[2000,2030],accuracyMeters:1,grids:[{id:'local',revision:'1'}],
      provenance:{authority:'math.gl tests',version:'1',reference:'authored synthetic metadata'},operation:createOperation
    }]);
    const selectionRequest = {sourceCRS:'app:source',targetCRS:'app:target',area:[170,-10,-170,10],epoch:2020};
    assert.equal(selection.select(selectionRequest), undefined);
    assert.deepEqual(selection.inspect(selectionRequest).rejected[0].reasons, ['grid']);
    const chosen = selection.select({...selectionRequest,availableGrids:[{id:'local',revision:'1'}]});
    assert.equal(chosen.operation, createOperation);
    assert.deepEqual(chosen.operation().project([12,55,100,8]), [12,55,100,8]);
    const {ProjectionPipeline} = await load('@math.gl/projection/pipeline');
    const pipeline = new ProjectionPipeline({input: {space: 'geographic', units: ['deg', 'deg', 'm']}, steps: [
      {type: 'unitconvert', xy: {from: 'deg', to: 'rad'}}, {type: 'projection', name: 'merc', parameters: {a: '6378137', b: '6378137'}}
    ], projections: [api.mercator]});
    const ownedOutput = new Float64Array(4);
    const convenience = new stable.Projection({to: 'EPSG:3857'});
    assert.equal(convenience.projectTo([11, 41, 123, 8], ownedOutput), ownedOutput);
    assert.deepEqual(Array.from(ownedOutput), convenience.project([11, 41, 123, 8]));
    assert.equal(convenience.unprojectToSync(ownedOutput, ownedOutput), ownedOutput);
    const lazyOutput = new Float32Array(4);
    assert.equal(await automatic.projectTo([3, 0, 123, 8], lazyOutput), lazyOutput);
    assert.deepEqual(Array.from(lazyOutput), [500000, 0, 123, 8]);
    const pipelineOutput = [77, 77, 77, 77];
    assert.equal(pipeline.projectToSync([11, 41, 123, 8], pipelineOutput), pipelineOutput);
    assert.deepEqual(pipelineOutput, pipeline.project([11, 41, 123, 8]));
    const angular = new ProjectionPipeline({input: {space: 'geographic', units: ['rad', 'rad', 'm']}, steps: [
      {type: 'unitconvert', xy: {from: 'rad', to: 'deg'}}, {type: 'axisswap', order: [-2, 1]}
    ]});
    const angularInput = [0.3, 0.7, 123, 8], angularBuffer = new Float64Array(angularInput);
    assert.equal(angular.projectFlatSync(angularBuffer, 4), angularBuffer);
    assert.deepEqual(Array.from(angularBuffer), angular.project(angularInput));
    const angularInverse = angular.unproject(Array.from(angularBuffer));
    assert.equal(angular.unprojectFlatSync(angularBuffer, 4), angularBuffer);
    assert.deepEqual(Array.from(angularBuffer), angularInverse);
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
    const fullExactBuffer = new Float64Array([...exactInput, ...exactInput]);
    assert.equal(fullExact.projectFlatSync(fullExactBuffer, 4), fullExactBuffer);
    assert.deepEqual(Array.from(fullExactBuffer), [...fullExact.projectSync(exactInput), ...fullExact.projectSync(exactInput)]);
    fullExact.unprojectFlatSync(fullExactBuffer, 4);
    fullExactBuffer.forEach((value, index) => assert(Math.abs(value - exactInput[index % 4]) < 1e-8));
    const smallHelmert = new ProjectionPipeline({input: exact.input, steps: [
      {type:'helmert',translation:[1.2,-2.3,3.4],rotation:[.12,-.25,.31],scalePPM:1.7,convention:'coordinate_frame',inverse:true}
    ]});
    const smallBuffer = new Float32Array(exactInput);
    const smallExpected = new Float32Array(smallHelmert.projectSync(Array.from(smallBuffer)));
    assert.equal(smallHelmert.projectFlatSync(smallBuffer,4),smallBuffer);
    assert.deepEqual(Array.from(smallBuffer),Array.from(smallExpected));
    fullExact.unproject(fullExact.project(exactInput)).forEach((value, index) => assert(Math.abs(value - exactInput[index]) < 1e-8));
    const moving = new ProjectionPipeline({input: exact.input, steps: [
      {type: 'helmert', translation: [1, 2, 3], referenceEpoch: 2000, rates: {translation: [0.1, -0.2, 0.3]}}
    ]});
    assert.throws(() => moving.project([10, 20, 30, 2020]), /epoch/);
    assert.deepEqual(moving.project([10, 20, 30, 8], 2020), [13, 18, 39, 8]);
    const epochBuffer = new Float64Array([2000, 2020]);
    const movingBuffer = new Float64Array([10, 20, 30, 8, 10, 20, 30, 9]);
    moving.projectFlat(movingBuffer, 4, epochBuffer);
    assert.deepEqual(Array.from(movingBuffer), [11, 22, 33, 8, 13, 18, 39, 9]);
    moving.unprojectFlat(movingBuffer, 4, epochBuffer);
    assert.deepEqual(Array.from(movingBuffer), [10, 20, 30, 8, 10, 20, 30, 9]);
    assert.deepEqual(Array.from(epochBuffer), [2000, 2020]);
    for (const convention of ['position_vector','coordinate_frame']) {
      const rotating = new ProjectionPipeline({input: exact.input, steps: [{
        type:'helmert',translation:[1,2,3],rotation:[15000,-7000,3000],scalePPM:12.5,
        referenceEpoch:2000,rates:{translation:[.1,-.2,.3],rotation:[.01,-.02,.03],scalePPM:.5},
        exact:true,convention,inverse:true
      }]});
      for (const inverse of [false,true]) for (const epochs of [2020,epochBuffer]) {
        const buffer = new Float32Array([...exactInput,...exactInput]);
        const expected = buffer.slice();
        for (let offset=0;offset<buffer.length;offset+=4) expected.set(
          (inverse ? rotating.unprojectSync : rotating.projectSync)(Array.from(buffer.subarray(offset,offset+4)),
          typeof epochs==='number' ? epochs : epochs[offset/4]),offset);
        assert.equal((inverse ? rotating.unprojectFlatSync : rotating.projectFlatSync)(buffer,4,epochs),buffer);
        assert.deepEqual(Array.from(buffer),Array.from(expected));
      }
    }


    for (const rates of [undefined, {translation:[.1,-.2,.3], rotation:[.01,-.02,.03], scalePPM:.5}]) {
      const mixed = new ProjectionPipeline({input: exact.input, steps: [
        {type:'unitconvert',xy:{from:'m',to:'ft'},z:{from:'m',to:'us-ft'}},
        {type:'unitconvert',xy:{from:'ft',to:'m'},z:{from:'us-ft',to:'m'}},
        {type:'helmert',translation:[1,2,3],rotation:[15000,-7000,3000],scalePPM:12.5,
          exact:true,convention:'coordinate_frame',...(rates ? {rates,referenceEpoch:2000} : {})},
        {type:'axisswap',order:[-3,1,-2]},
        {type:'unitconvert',xy:{from:'m',to:'ft'},z:{from:'m',to:'us-ft'}}
      ]});
      for (const ArrayType of [Float32Array,Float64Array]) for (const inverse of [false,true])
        for (const epochs of [2020,epochBuffer]) {
          const buffer = new ArrayType([...exactInput,...exactInput]);
          const expected = buffer.slice();
          for (let offset=0;offset<buffer.length;offset+=4) expected.set(
            (inverse ? mixed.unprojectSync : mixed.projectSync)(Array.from(buffer.subarray(offset,offset+4)),
              typeof epochs==='number' ? epochs : epochs[offset/4]),offset);
          assert.equal((inverse ? mixed.unprojectFlatSync : mixed.projectFlatSync)(buffer,4,epochs),buffer);
          assert.deepEqual(Array.from(buffer),Array.from(expected));
        }
    }

    const {obliqueTransformation} = await load('@math.gl/projection/projections/ob_tran');
    const rotated = new ProjectionPipeline({input: {space: 'geographic', units: ['rad', 'rad', 'm']}, projections: [obliqueTransformation('longlat')], steps: [
      {type: 'projection', name: 'ob_tran', parameters: {o_proj: 'longlat', o_lat_p: '45', o_lon_p: '-90'}, output: {space: 'geographic', unit: 'rad'}}
    ]});
    const rotatedPoint = [0.2, 0.7, 123, 8];
    rotated.unproject(rotated.project(rotatedPoint)).forEach((value, index) => assert(Math.abs(value - rotatedPoint[index]) < 1e-12));

    const {parseGTXGrid} = await load('@math.gl/projection/grids/gtx');
    const {createVerticalGrid} = await load('@math.gl/projection/grids/vertical');
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
    const {loadVerticalGeoTIFFGrid} = await load('@math.gl/projection/grids/vertical-geotiff');
    const tiffGrid = await loadVerticalGeoTIFFGrid({getImageCount: async () => 1, getImage: async () => ({
      getWidth: () => 2, getHeight: () => 2,
      getGeoKeys: () => ({GTModelTypeGeoKey: 2, GTRasterTypeGeoKey: 2}),
      getGDALMetadata: sample => sample === 0 ? {DESCRIPTION: 'geoid_undulation'} : {TYPE: 'VERTICAL_OFFSET_GEOGRAPHIC_TO_VERTICAL'},
      fileDirectory: {ModelPixelScale: [1, 1, 0], ModelTiepoint: [0, 0, 0, 0, 1, 0]},
      readRasters: async () => [new Float32Array(4).fill(15)]
    })});
    assert.equal(tiffGrid.getOffset(0, 0), 15);
    assert.deepEqual(new core.ProjectionEngine({from: '+proj=longlat +geoidgrids=tiff', verticalGrids: {tiff: tiffGrid}}).project([0, 0, 100, 7]), [0, 0, 115, 7]);
    const {createVelocityGrid} = await load('@math.gl/projection/grids/velocity');
    const {createDeformationModel} = await load('@math.gl/projection/deformation');
    const velocityGrid = createVelocityGrid({origin: [-1, -1], step: [2, 2], size: [2, 2], units: 'm/year', east: [1,1,1,1], north: [2,2,2,2], up: [3,3,3,3]});
    const deformation = createDeformationModel({grid: velocityGrid, epochRange: [2000,2030]});
    const propagation = new ProjectionPipeline({input: {space: 'geocentric', units: ['m','m','m']}, steps: [{type:'deformation', model:deformation, sourceEpoch:2010, targetEpoch:2020}]});
    assert.deepEqual(propagation.project([6378137,0,0,7]), [6378167,10,20,7]);
    const restored = propagation.unproject([6378167,10,20,7]);
    assert(Math.hypot(restored[0]-6378137,restored[1],restored[2]) < 1e-8);
    const {loadVelocityGeoTIFFGrid} = await load('@math.gl/projection/grids/velocity-geotiff');
    const decodedVelocity = await loadVelocityGeoTIFFGrid({images:[{width:2,height:2,bands:[0,1,2].map(index => ({index,data:new Float32Array(4).fill(index+1),metadata:{DESCRIPTION:['east_velocity','north_velocity','up_velocity'][index],UNITTYPE:'mm/year'}})),geoKeys:{GTModelTypeGeoKey:2,GTRasterTypeGeoKey:2},metadata:{TYPE:'VELOCITY'},noData:null,fileDirectory:{ModelPixelScale:[2,2,0],ModelTiepoint:[0,0,0,-1,1,0]}}]});
    const sampled = {x:0,y:0,z:0};
    assert(decodedVelocity.sample(0,0,sampled));
    assert.deepEqual(sampled,{x:0.001,y:0.002,z:0.003});
    const descriptors = await load('@math.gl/projection/projections/lazy/utm');
    const lazy = new core.ProjectionEngine({to: 'EPSG:32631', projections: [descriptors.lazyUniversalTransverseMercator]});
    await descriptors.lazyUniversalTransverseMercator.preload();
    assert(Math.abs(lazy.projectSync([3, 0])[0] - 500000) < 1e-7);
    assert(Math.abs((await lazy.project([3, 0]))[0] - 500000) < 1e-7);
    const {universalTransverseMercator} = await load('@math.gl/projection/projections/utm');
    const utm = new core.ProjectionEngine({to: 'EPSG:32631', projections: [universalTransverseMercator]});
    assert(Math.abs(utm.project([3, 0])[0] - 500000) < 1e-7);
    const {wktCRSParser} = await load('@math.gl/projection/parsers/wkt');
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
    assert(!('Proj4Projection' in api));
    for (const Wrapper of [api.Projection]) {
      Wrapper.defineProjectionAliases({'PACKED:UTM': '+proj=utm +zone=31 +datum=WGS84'});
      const p = new Wrapper({to: 'PACKED:UTM'});
      const project = p.project;
      const unproject = p.unproject;
      assert(Math.abs(project([3, 0])[0] - 500000) < 1e-8);
      assert(Math.abs(unproject([500000, 0])[0] - 3) < 1e-8);
    }
    assert(new api.Projection({}) instanceof api.ProjectionEngine);
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
  `;
  writeFileSync(
    join(temporary, 'smoke.mjs'),
    "import assert from 'node:assert/strict'; import * as api from '@math.gl/projection';\n" +
      smoke +
      '\nconst load = specifier => import(specifier);\n' +
      entrySmoke
  );
  writeFileSync(
    join(temporary, 'smoke.cjs'),
    "const assert = require('node:assert/strict'); const api = require('@math.gl/projection');\n" +
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
    ${subpaths.map((path, index) => 'import * as entry' + index + " from '@math.gl/projection" + path.slice(1) + "';\nvoid entry" + index + ';').join('\n')}
    import {createLocalFrameBasis, eastNorthUpBasis, eastNorthUpBasisFromDirections, localToFixed, fixedToLocal, localFrameToMatrix, type LocalFrameBasis, type LocalFramePoint, type LocalFrameAxis} from '@math.gl/core/local-frame';
    const basis: LocalFrameBasis = createLocalFrameBasis();
    const framePoint: LocalFramePoint = {x:1,y:2,z:3};
    const axis: LocalFrameAxis = 'east';
    const frameStatus: boolean = eastNorthUpBasis(0,0,basis);
    eastNorthUpBasisFromDirections({x:0,y:1,z:0},{x:1,y:0,z:0},basis);
    localToFixed(framePoint,basis); fixedToLocal(framePoint,basis,framePoint);
    localFrameToMatrix(basis,framePoint,axis,'north','up',new Float64Array(16));
    // @ts-expect-error Result basis is required.
    eastNorthUpBasis(0,0);
    // @ts-expect-error Axes are named signed local directions.
    localFrameToMatrix(basis,framePoint,'x','y','z',[]);
    import {spheroidToCartesian, cartesianToSpheroid, type SpheroidPoint, type SpheroidGeometry} from '@math.gl/core/spheroid';
    const numericPoint: SpheroidPoint = {x:0,y:0,z:0};
    const numericGeometry: SpheroidGeometry = {semiMajorAxis:10,semiMinorAxis:5,eccentricitySquared:.75};
    const forwardStatus: boolean = spheroidToCartesian(numericPoint,numericGeometry);
    const inverseStatus: boolean = cartesianToSpheroid(numericPoint,numericGeometry);
    void forwardStatus; void inverseStatus;
    import {Ellipsoid, type SpheroidParameters as GeospatialSpheroid} from '@math.gl/geospatial';
    import type {SpheroidParameters as TypesSpheroid} from '@math.gl/types';
    import type {SpheroidParameters as CoreSpheroid} from '@math.gl/core';
    import {normalizeCRS, type SpheroidParameters as ProjectionSpheroid} from '@math.gl/projection/core';
    const shape = Ellipsoid.fromSpheroid(normalizeCRS('EPSG:4326').ellipsoid);
    const axes: GeospatialSpheroid = shape.toSpheroid();
    const sharedAxes: TypesSpheroid = axes;
    const coreAxes: CoreSpheroid = sharedAxes;
    const projectionAxes: ProjectionSpheroid = coreAxes;
    const importedShape: Ellipsoid = Ellipsoid.fromSpheroid(projectionAxes);
    // @ts-expect-error Geometry snapshots have readonly axes.
    axes.semiMajorAxis = 1;
    // @ts-expect-error Both axes are required; no implicit WGS84 polar radius.
    Ellipsoid.fromSpheroid({semiMajorAxis: 6378137});
    // @ts-expect-error PROJ string parameters are a distinct contract.
    Ellipsoid.fromSpheroid({a: '6378137', b: '6356752'});
    // @ts-expect-error The axes are numeric metres.
    Ellipsoid.fromSpheroid({semiMajorAxis: '6378137', semiMinorAxis: 6356752});
    import {LazyProjection, type LazyProjectionOptions} from '@math.gl/projection/projections/lazy';
    const lazyOptions: LazyProjectionOptions = {to: 'EPSG:32631'};
    const automatic = new LazyProjection(lazyOptions);
    const automaticResult: Promise<number[]> = automatic.project([3, 0]);
    const automaticFlat: Promise<Float32Array> = automatic.projectFlat(new Float32Array([3, 0]));
    import {ProjectionBuffer, type BulkProjection, type ProjectionBufferOptions} from '@math.gl/projection/bulk';
    const bufferTransform: BulkProjection = automatic;
    const bufferOptions: ProjectionBufferOptions = {projection:bufferTransform,dimension:4,inputStride:6,outputStride:7};
    const bufferProjection = new ProjectionBuffer(bufferOptions);
    const separateResult:Float32Array = bufferProjection.projectFlatTo(new Float64Array(6),new Float32Array(7),1,0,new Float64Array([2020]));
    const columnOutputs = [new Float32Array(1),new Float64Array(1),new Float64Array(1),new Float64Array(1)] as const;
    const columnResult:typeof columnOutputs = bufferProjection.unprojectColumnsTo(columnOutputs,columnOutputs,1,0,2020);
    import {ProjectionAnalysis, createProjectionFactors, createProjectionJacobian, type ProjectionAnalysisOptions, type ProjectionDomain, type ProjectionFactors, type ProjectionJacobian} from '@math.gl/projection/analysis';
    const analysisDomain: ProjectionDomain = {west:-1,east:1,south:-1,north:1};
    const analysisOptions: ProjectionAnalysisOptions = {projection:mercator,context:{semiMajorAxis:10,eccentricitySquared:0,parameters:{}},domain:analysisDomain};
    const inspected = new ProjectionAnalysis(analysisOptions);
    const factors: ProjectionFactors = createProjectionFactors(), jacobian: ProjectionJacobian = createProjectionJacobian();
    inspected.factors(0,0,factors); inspected.jacobian(0,0,jacobian);
    // @ts-expect-error Reusable factors storage is required.
    inspected.factors(0,0);
    // @ts-expect-error Analysis requires an explicit application domain.
    new ProjectionAnalysis({projection:mercator,context:analysisOptions.context});
    import {ProjectionEngine, checkProjectionCompatibility, type ProjectionPoint, type ProjectionEngineOptions, type ProjectionEngineCreateOptions, type ProjectionCompatibility} from '@math.gl/projection/core';
    const engineOptions: ProjectionEngineOptions = {};
    const createOptions: ProjectionEngineCreateOptions = engineOptions;
    const configured: ProjectionEngine = new ProjectionEngine(engineOptions);
    const capability: ProjectionCompatibility = checkProjectionCompatibility('EPSG:4326');
    import type {ProjectionCoordinate, ProjectionOutput} from '@math.gl/projection/core';
    const resultInput: ProjectionCoordinate = new Float64Array([1, 2, 3, 8]);
    const outputStorage: ProjectionOutput = [0, 0, 0, 0];
    const typedResult: Float32Array = configured.projectTo(resultInput, new Float32Array(4));
    const arrayResult: number[] = configured.unprojectToSync(resultInput, outputStorage);
    // @ts-expect-error only floating typed outputs or number arrays are supported
    configured.projectTo(resultInput, new Int32Array(4));
    // @ts-expect-error result storage is required
    configured.projectTo(resultInput);
    // @ts-expect-error readonly arrays cannot be used as writable results
    configured.projectTo(resultInput, [1, 2] as readonly number[]);
    const eagerEngine: number[] = new ProjectionEngine({}).project([0, 0]);
    const createdEngine: Promise<ProjectionEngine> = ProjectionEngine.create(createOptions);

    import {OperationCatalog, type CoordinateOperation, type OperationArea, type OperationEpochRange,
      type OperationGrid, type OperationProvenance, type OperationSelectionRequest,
      type OperationSelection, type OperationRejection, type OperationRejectionReason} from '@math.gl/projection/operations';
    const selectionArea: OperationArea = [-180,-90,180,90];
    const selectionEpoch: OperationEpochRange = [2000,2030];
    const selectionGrid: OperationGrid = {id:'local',revision:'1'};
    const selectionProvenance: OperationProvenance = {authority:'app',version:'1',reference:'authored'};
    const selectedDefinition: CoordinateOperation<() => ProjectionEngine> = {
      id:'local',sourceCRS:'app:source',targetCRS:'app:target',area:selectionArea,epochRange:selectionEpoch,
      accuracyMeters:1,grids:[selectionGrid],provenance:selectionProvenance,operation:()=>new ProjectionEngine({})
    };
    const operationCatalog = new OperationCatalog([selectedDefinition]);
    const operationRequest: OperationSelectionRequest = {sourceCRS:'app:source',targetCRS:'app:target',area:selectionArea,epoch:2020,availableGrids:[selectionGrid]};
    const selectionResult: OperationSelection<() => ProjectionEngine> = operationCatalog.inspect(operationRequest);
    const selectionFailure: OperationRejection<() => ProjectionEngine> | undefined = selectionResult.rejected[0];
    const selectionReason: OperationRejectionReason | undefined = selectionFailure?.reasons[0];
    const selectedEngine: ProjectionEngine | undefined = operationCatalog.select(operationRequest)?.operation();
    // @ts-expect-error area requires four ordinates
    operationCatalog.select({...operationRequest,area:[0,0]});
    // @ts-expect-error declared accuracy is numeric metres
    new OperationCatalog([{...selectedDefinition,accuracyMeters:'1'}]);
    // @ts-expect-error reviewed metadata cannot be mutated
    selectedDefinition.epochRange = null;
    import {Projection, type ProjectionOptions, type DatumGridOptions} from '@math.gl/projection';
    import {createDeformationModel, type DeformationModel, type DeformationModelOptions} from '@math.gl/projection/deformation';
    import {createVelocityGrid, type VelocityGrid, type VelocityGridOptions} from '@math.gl/projection/grids/velocity';
    import {loadVelocityGeoTIFFGrid, type VelocityGridGeoTIFFData, type VelocityGridGeoTIFF} from '@math.gl/projection/grids/velocity-geotiff';
    const velocityOptions: VelocityGridOptions = {origin:[0,0],step:[1,1],size:[2,2],units:'mm/year',east:[1,1,1,1],north:[2,2,2,2],up:[3,3,3,3]};
    const velocity: VelocityGrid = createVelocityGrid(velocityOptions);
    const modelOptions: DeformationModelOptions = {grid:velocity,epochRange:[2000,2030]};
    const deformation: DeformationModel = createDeformationModel(modelOptions);
    const step: import('@math.gl/projection/pipeline').PipelineStep = {type:'deformation',model:deformation,sourceEpoch:'coordinate',targetEpoch:2020};
    const deferredVelocity: Promise<VelocityGrid> = loadVelocityGeoTIFFGrid({images:[]} satisfies VelocityGridGeoTIFFData);
    const tiffVelocity: VelocityGridGeoTIFF = {getImageCount:async()=>0,getImage:async()=>geoTIFFImage};
    loadVelocityGeoTIFFGrid(tiffVelocity);
    // @ts-expect-error dimensional units must be explicit
    createVelocityGrid({...velocityOptions,units:'m'});
    // @ts-expect-error epochs cannot be omitted
    const missingEpoch: import('@math.gl/projection/pipeline').PipelineStep = {type:'deformation',model:deformation,targetEpoch:2020};
    import {parseGTXGrid} from '@math.gl/projection/grids/gtx';
    import {loadVerticalGeoTIFFGrid, type VerticalGridGeoTIFF, type VerticalGridGeoTIFFImage} from '@math.gl/projection/grids/vertical-geotiff';
    const geoTIFFImage: VerticalGridGeoTIFFImage = {
      getWidth: () => 2, getHeight: () => 2,
      getGeoKeys: () => ({GTModelTypeGeoKey: 2, GTRasterTypeGeoKey: 2}),
      getGDALMetadata: async sample => sample === 0 ? {DESCRIPTION: 'geoid_undulation'} : {TYPE: 'VERTICAL_OFFSET_GEOGRAPHIC_TO_VERTICAL'},
      fileDirectory: {getValue: name => name === 'ModelPixelScale' ? [1, 1, 0] : undefined},
      readRasters: async options => [new Float32Array(4)]
    };
    const geoTIFF: VerticalGridGeoTIFF = {getImageCount: async () => 1, getImage: async () => geoTIFFImage};
    const loadedGeoTIFF: Promise<import('@math.gl/projection/core').VerticalGrid> = loadVerticalGeoTIFFGrid(geoTIFF);
    import {createGeoidGrid, createVerticalGrid, type VerticalGridOptions} from '@math.gl/projection/grids/vertical';
    import type {VerticalGridCollection} from '@math.gl/projection/core';
    const verticalOptions: VerticalGridOptions = {origin: [0, 0], step: [1, 1], size: [2, 2], offsets: [1, 2, 3, 4]};
    const verticalGrids: VerticalGridCollection = {local: createVerticalGrid(verticalOptions), geoid: createGeoidGrid({getHeight: () => 1})};
    const heightOptions: ProjectionOptions = {from: '+proj=longlat +geoidgrids=local', verticalGrids};
    new Projection(heightOptions).project([0, 0, 1]);
    new LazyProjection({...heightOptions, verticalGrids});
    const readGTX: (buffer: ArrayBuffer) => typeof verticalGrids.local = parseGTXGrid;
    const options: ProjectionOptions = {};
    const gridOptions: DatumGridOptions = {includeErrorFields: false};
    new Projection(options);
    Projection.registerDatumGrid('local', new ArrayBuffer(0), gridOptions);
    import {lazyUniversalTransverseMercator} from '@math.gl/projection/projections/lazy/utm';
    const lazy = new ProjectionEngine({to: 'EPSG:32631', projections: [lazyUniversalTransverseMercator]});
    const asyncResult: Promise<number[]> = lazy.project([3, 0]);
    const asyncTypedResult: Promise<Float64Array> = lazy.projectTo(resultInput, new Float64Array(4));
    const preloadedTypedResult: Float32Array = lazy.projectToSync(resultInput, new Float32Array(4));
    const syncResult: number[] = lazy.projectSync([3, 0]);
    const asyncBuffer: Promise<Float64Array> = lazy.projectFlat(new Float64Array([3, 0]));
    const mixed = new ProjectionEngine({to: 'EPSG:32631', projections: [mercator, lazyUniversalTransverseMercator]});
    const mixedResult: Promise<number[]> = mixed.project([3, 0]);
    import {ProjectionPipeline, type PipelineStep, type ProjectionPipelineOptions, type PipelineProjectionOutput, type PipelineHelmertRates, type PipelineEpochs} from '@math.gl/projection/pipeline';
    const pipelineOptions: ProjectionPipelineOptions = {input: {space: 'geographic', units: ['deg', 'deg', 'm']}, steps: [{type: 'unitconvert', xy: {from: 'deg', to: 'rad'}}]};
    const rotationOutput: PipelineProjectionOutput = {space: 'geographic', unit: 'rad'};
    const stackSteps: PipelineStep[] = [{type: 'push', components: [3]}, {type: 'pop', components: [3]}];
    const exactStep: PipelineStep = {type: 'helmert', translation: [1, 2, 3], rotation: [1, 2, 3], convention: 'position_vector', exact: true, omitInverse: true};
    // @ts-expect-error M is preserved, never used as an ordinate stack or epoch.
    const measureStack: PipelineStep = {type: 'push', components: [4]};
    // @ts-expect-error Geographic helper output cannot have linear units.
    const mixedOutput: PipelineProjectionOutput = {space: 'geographic', unit: 'm'};
    const rates: PipelineHelmertRates = {translation: [0.1, 0.2, 0.3], rotation: [0, 0, 0], scalePPM: 0.1};
    const moving = new ProjectionPipeline({input: {space: 'geocentric', units: ['m', 'm', 'm']}, steps: [{type: 'helmert', translation: [1, 2, 3], referenceEpoch: 2000, rates, convention: 'position_vector'}]});
    const epochs: PipelineEpochs = new Float64Array([2000]);
    const timedScalar: number[] = moving.project([1, 2, 3], 2020);
    const timedFlat: Float32Array = moving.projectFlat(new Float32Array([1, 2, 3]), 3, epochs);
    moving.unprojectFlatSync(timedFlat, 3, 2020);
    // @ts-expect-error Time is separate; scalar coordinates do not accept an epoch buffer.
    moving.project([1, 2, 3], new Float64Array([2020]));
    // @ts-expect-error Epochs must be decimal-year float buffers, not integer arrays.
    moving.projectFlat(new Float64Array([1, 2, 3]), 3, new Int32Array([2020]));
    const pipeline = new ProjectionPipeline(pipelineOptions);
    const pipelineScalar: number[] = pipeline.project([0, 0]);
    const reusablePipeline: Float32Array = pipeline.projectTo(resultInput, new Float32Array(4));
    const epochResult: Float64Array = moving.projectToSync(resultInput, new Float64Array(4), 2020);
    const pipelineCoordinate: import('@math.gl/projection/pipeline').ProjectionCoordinate = resultInput;
    const pipelineResult: import('@math.gl/projection/pipeline').ProjectionOutput = outputStorage;
    const pipelineFlat: Float32Array = pipeline.projectFlat(new Float32Array([0, 0]));
    const deferredPipeline = new ProjectionPipeline({...pipelineOptions, projections: [lazyUniversalTransverseMercator]});
    const deferredScalar: Promise<number[]> = deferredPipeline.project([0, 0]);
    const deferredOutput: Promise<Float32Array> = deferredPipeline.projectTo(resultInput, new Float32Array(4));
    const deferredFlat: Promise<Float64Array> = deferredPipeline.projectFlat(new Float64Array([0, 0]));
    const explicitSync: number[] = deferredPipeline.projectSync([0, 0]);
    // @ts-expect-error Integer buffers are not supported.
    pipeline.projectFlat(new Int32Array([0, 0]));
    // @ts-expect-error Unknown operations are not supported.
    const unknownStep: PipelineStep = {type: 'affine'};
    // @ts-expect-error Unknown unit names are not supported.
    const unknownUnits: PipelineStep = {type: 'unitconvert', xy: {from: 'degree', to: 'rad'}};
    // @ts-expect-error Observation epoch is supplied separately, not in a step.
    const dynamicStep: PipelineStep = {type: 'helmert', translation: [0, 0, 0], epoch: 2020};
    import {mercator} from '@math.gl/projection/projections/merc';
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
    'Packed projection ESM, CommonJS, all subpath declarations, typed-array API and licenses passed'
  );
} catch (error) {
  if (error.stdout) console.error(error.stdout.toString());
  if (error.stderr) console.error(error.stderr.toString());
  throw error;
} finally {
  rmSync(temporary, {recursive: true, force: true});
}
