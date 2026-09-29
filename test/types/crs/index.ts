// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  checkProj4CRSCompatibility,
  Proj4Projection,
  toProj4CRSDefinition,
  type Proj4CRSCompatibilityResult,
  type Proj4CRSDefinition
} from '@math.gl/proj4';
import {
  createSpatialReference,
  inferCRSRepresentation,
  type CRSDefinition,
  type PROJJSONCRSByType,
  type ReadonlyCRSDefinition,
  type SpatialReference
} from '@math.gl/crs';

const serialized: CRSDefinition = 'EPSG:4326';
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
const definition: Proj4CRSDefinition = geographic;
const readonlyDefinition: ReadonlyCRSDefinition = geographic;
const convertedDefinition: Proj4CRSDefinition = toProj4CRSDefinition(geographic);
const compatibility: Proj4CRSCompatibilityResult = checkProj4CRSCompatibility(geographic);

new Proj4Projection({from: definition, to: serialized});
void convertedDefinition;
void compatibility;

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
  const spatialCompatibility = checkProj4CRSCompatibility(spatialReference.crs.definition);
  const executableSpatialDefinition = toProj4CRSDefinition(spatialReference.crs.definition);
  new Proj4Projection({from: executableSpatialDefinition, to: serialized});
  void spatialDefinition;
  void spatialCompatibility;
}

// The native backend consumes the same readonly CRS and spatial-reference contracts.
import {
  TypeScriptProjection,
  normalizeCRS,
  checkTypeScriptCRSCompatibility,
  projJSONCRSParser,
  type TypeScriptCRSInput,
  type NormalizedCRS
} from '@math.gl/proj4/experimental';
const nativeInput: TypeScriptCRSInput = spatialReference;
new TypeScriptProjection({from: nativeInput, to: readonlyDefinition, parsers: [projJSONCRSParser]});
new TypeScriptProjection({from: spatialReference.crs});
const normalized: NormalizedCRS = normalizeCRS(geographic, {parsers: [projJSONCRSParser]});
checkTypeScriptCRSCompatibility(nativeInput, {parsers: [projJSONCRSParser]});
// @ts-expect-error The engine's normalized parameters are immutable.
normalized.parameters['proj'] = 'merc';

// Grid preparation is optional and registration stays local to the native instance.
import {
  parseNTv2Grid,
  loadGeoTIFFGrid,
  type DatumGrid,
  type DatumGridCollection,
  type DatumGridGeoTIFF
} from '@math.gl/proj4/experimental';
const preparedGrid: DatumGrid = parseNTv2Grid(new ArrayBuffer(0), {includeErrorFields: false});
const gridCollection: DatumGridCollection = Object.freeze({local: preparedGrid});
new TypeScriptProjection({from: '+proj=longlat +nadgrids=local', datumGrids: gridCollection});
checkTypeScriptCRSCompatibility('+proj=longlat +nadgrids=local', {datumGrids: gridCollection});
declare const tiff: DatumGridGeoTIFF;
const preparedTIFF: Promise<DatumGrid> = loadGeoTIFFGrid(tiff);
void preparedTIFF;
// @ts-expect-error Grid preparation must finish before synchronous projection construction.
new TypeScriptProjection({datumGrids: {local: preparedTIFF}});
// @ts-expect-error Prepared grid metadata is immutable.
preparedGrid.subgridCount = 2;

// Batch methods preserve the concrete typed-array type.
const batchProjection = new TypeScriptProjection();
const float32Output: Float32Array = batchProjection.projectFlat(new Float32Array([0, 0]));
const float64Output: Float64Array = batchProjection.unprojectFlat(new Float64Array([0, 0]));
void float32Output;
void float64Output;
// @ts-expect-error Integer buffers cannot represent projected coordinates.
batchProjection.projectFlat(new Int32Array([0, 0]));
// @ts-expect-error The scalar array API is deliberately separate.
batchProjection.projectFlat([0, 0]);
