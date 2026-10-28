// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {projectionEngine} from '@math.gl/geospatial/projection';
import type {CRSBounds} from '@math.gl/geospatial/projection/types';
import {
  createSpatialReference,
  inferCRSRepresentation,
  type CRSDefinition,
  type CRSUnit,
  type PROJJSONCRSByType,
  type ReadonlyCRSDefinition,
  type SpatialReference
} from '@math.gl/geospatial/crs';

const serialized: CRSDefinition = 'EPSG:4326';

import {createCRSResolver, createCRSDictionaryProvider} from '@math.gl/geospatial/crs';
import type {CRSInput} from '@math.gl/geospatial/crs';
const resolver = createCRSResolver({
  providers: [
    createCRSDictionaryProvider({
      'APP:geographic': '+proj=longlat +datum=WGS84'
    })
  ]
});
resolver.resolve('APP:geographic').then(result => {
  const input: CRSInput = result.input;
  // @ts-expect-error Resolution provenance is immutable.
  result.lookups.push({identifier: 'x', provider: 'x'});
  return input;
});
const geographic: PROJJSONCRSByType<'GeographicCRS'> = {
  type: 'GeographicCRS',
  name: 'WGS 84',
  datum: {
    name: 'World Geodetic System 1984',
    ellipsoid: {
      name: 'WGS 84',
      semi_major_axis: 6378137,
      inverse_flattening: 298.257223563
    }
  }
};
const definition: ReadonlyCRSDefinition = geographic;
const readonlyDefinition: ReadonlyCRSDefinition = geographic;

projectionEngine.createProjection({from: definition, to: serialized});

if (typeof readonlyDefinition === 'object') {
  // @ts-expect-error Spatial-reference PROJJSON definitions are deeply readonly.
  readonlyDefinition.name = 'Mutated name';
}

const spatialReference: SpatialReference = createSpatialReference({
  crs: {
    state: 'explicit',
    definition: geographic,
    representation: inferCRSRepresentation(geographic),
    provenance: 'metadata'
  },
  coordinateEpoch: 2020.25,
  coordinateFrame: 'geographic',
  coordinateOrder: ['x', 'y']
});

if (spatialReference.crs.state === 'explicit') {
  const spatialDefinition: ReadonlyCRSDefinition = spatialReference.crs.definition;
  projectionEngine.createProjection({
    from: spatialDefinition,
    to: serialized
  });
  void spatialDefinition;
}

// The native backend consumes the same readonly CRS and spatial-reference contracts.
import {
  ProjectionTransform,
  normalizeCRS,
  checkProjectionCompatibility,
  projJSONCRSParser,
  type TypeScriptCRSInput,
  type NormalizedCRS
} from '@math.gl/geospatial/projection/experimental';
const nativeInput: TypeScriptCRSInput = spatialReference;
new ProjectionTransform({
  from: nativeInput,
  to: readonlyDefinition,
  parsers: [projJSONCRSParser]
});
new ProjectionTransform({from: spatialReference.crs});
const normalized: NormalizedCRS = normalizeCRS(geographic, {
  parsers: [projJSONCRSParser]
});
checkProjectionCompatibility(nativeInput, {parsers: [projJSONCRSParser]});
// @ts-expect-error The engine's normalized parameters are immutable.
normalized.parameters['proj'] = 'merc';

// Grid preparation is optional and registration stays local to the native instance.
import {
  parseNTv2Grid,
  loadGeoTIFFGrid,
  type DatumGrid,
  type DatumGridCollection,
  type DatumGridGeoTIFF
} from '@math.gl/geospatial/projection/experimental';
const preparedGrid: DatumGrid = parseNTv2Grid(new ArrayBuffer(0), {
  includeErrorFields: false
});
const gridCollection: DatumGridCollection = Object.freeze({
  local: preparedGrid
});
new ProjectionTransform({
  from: '+proj=longlat +nadgrids=local',
  datumGrids: gridCollection
});
checkProjectionCompatibility('+proj=longlat +nadgrids=local', {
  datumGrids: gridCollection
});
declare const tiff: DatumGridGeoTIFF;
const preparedTIFF: Promise<DatumGrid> = loadGeoTIFFGrid(tiff);
void preparedTIFF;
// @ts-expect-error Grid preparation must finish before synchronous projection construction.
new ProjectionTransform({datumGrids: {local: preparedTIFF}});
// @ts-expect-error Prepared grid metadata is immutable.
preparedGrid.subgridCount = 2;

// Batch methods preserve the concrete typed-array type.
const batchProjection = new ProjectionTransform();
const float32Output: Float32Array = batchProjection.projectFlat(new Float32Array([0, 0]));
const float64Output: Float64Array = batchProjection.unprojectFlat(new Float64Array([0, 0]));
void float32Output;
void float64Output;
// @ts-expect-error Integer buffers cannot represent projected coordinates.
batchProjection.projectFlat(new Int32Array([0, 0]));
// @ts-expect-error The scalar array API is deliberately separate.
batchProjection.projectFlat([0, 0]);

import type {
  ProjectionEngine,
  Projection,
  PreparedProjection
} from '@math.gl/geospatial/projection/types';
import {ConfigurableProjectionEngine, FullProjectionEngine} from '@math.gl/geospatial/projection';
const projectionEngines: ProjectionEngine[] = [
  new ConfigurableProjectionEngine(),
  new FullProjectionEngine(),
  new LazyProjectionEngine()
];
async function useEngine(engine: ProjectionEngine): Promise<number[]> {
  const projection = await engine.createProjection({to: 'EPSG:3857'});
  return await projection.project([12, 55]);
}
void projectionEngines;
void useEngine;
// @ts-expect-error ProjectionEngine is an interface, not a runtime constructor.
new ProjectionEngine();
// @ts-expect-error Engines configure algorithms, not a specific CRS pair.
new ConfigurableProjectionEngine({to: 'EPSG:3857'});

import {LazyProjectionEngine} from '@math.gl/geospatial/projection/projections/lazy';

import {WebMercatorProjectionEngine} from '@math.gl/geospatial/projection/web-mercator';
const minimalEngine: ProjectionEngine = new WebMercatorProjectionEngine();
const minimalProjection: Projection = minimalEngine.createProjection({
  to: 'EPSG:3857'
});
async function preparedEngine(engine: ProjectionEngine) {
  const projection: PreparedProjection = await engine.createProjectionAsync({
    to: 'EPSG:3857'
  });
  const buffer: Float32Array = projection.projectFlat(new Float32Array(4));
  const coordinate: number[] = projection.project([12, 55]);
  return {buffer, coordinate};
}
void minimalProjection;
void preparedEngine;
// @ts-expect-error Projection is a type contract, not a constructor.
new Projection();

const angularUnit: CRSUnit = {name: 'degrees', degreesPerUnit: 1};
const renderingBounds: CRSBounds = [
  [0, 0, 0],
  [1, 1, 0]
];
// @ts-expect-error Rendering envelopes require all three target coordinate axes.
const incompleteCorner: CRSBounds[0] = [0, 0];
void angularUnit;
void renderingBounds;
void incompleteCorner;

import {
  createCRSDescriptor,
  type CRSDescriptorOptions
} from '@math.gl/geospatial/projection/crs-descriptor';
import type {CRSMetadata} from '@math.gl/geospatial/crs';
import type {CRSConverter, CRSDescriptor} from '@math.gl/geospatial/projection/types';
declare const externalMetadata: CRSMetadata;
declare const externalConverter: CRSConverter;
const descriptorOptions: CRSDescriptorOptions = {
  metadata: externalMetadata,
  renderingBounds,
  renderingScale: () => null,
  converter: {WGS84: externalConverter}
};
const externalDescriptor: CRSDescriptor = createCRSDescriptor(descriptorOptions);
const reused: Float64Array = externalDescriptor.converter.WGS84.from([1, 2], new Float64Array(2));
const allocated: number[] = externalDescriptor.converter.WGS84.to([1, 2]);
// @ts-expect-error A descriptor requires an explicitly prepared WGS84 converter.
createCRSDescriptor({...descriptorOptions, converter: {}});
// @ts-expect-error Scale callbacks must be synchronous.
createCRSDescriptor({...descriptorOptions, renderingScale: async () => [1, 1, 1]});
const asynchronousConverter: CRSConverter = {
  ...externalConverter,
  // @ts-expect-error Converters must be synchronous and support reusable output.
  from: async () => [1, 2]
};
// @ts-expect-error Descriptor metadata is immutable.
externalDescriptor.ellipsoid.semiMajorAxis = 1;
void reused;
void allocated;
void asynchronousConverter;
