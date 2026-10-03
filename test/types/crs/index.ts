// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Projection} from '@math.gl/projection';
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
const definition: ReadonlyCRSDefinition = geographic;
const readonlyDefinition: ReadonlyCRSDefinition = geographic;

new Projection({from: definition, to: serialized});

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
  new Projection({from: spatialDefinition, to: serialized});
  void spatialDefinition;
}

// The native backend consumes the same readonly CRS and spatial-reference contracts.
import {
  ProjectionEngine,
  normalizeCRS,
  checkProjectionCompatibility,
  projJSONCRSParser,
  type TypeScriptCRSInput,
  type NormalizedCRS
} from '@math.gl/projection/experimental';
const nativeInput: TypeScriptCRSInput = spatialReference;
new ProjectionEngine({from: nativeInput, to: readonlyDefinition, parsers: [projJSONCRSParser]});
new ProjectionEngine({from: spatialReference.crs});
const normalized: NormalizedCRS = normalizeCRS(geographic, {parsers: [projJSONCRSParser]});
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
} from '@math.gl/projection/experimental';
const preparedGrid: DatumGrid = parseNTv2Grid(new ArrayBuffer(0), {includeErrorFields: false});
const gridCollection: DatumGridCollection = Object.freeze({local: preparedGrid});
new ProjectionEngine({from: '+proj=longlat +nadgrids=local', datumGrids: gridCollection});
checkProjectionCompatibility('+proj=longlat +nadgrids=local', {datumGrids: gridCollection});
declare const tiff: DatumGridGeoTIFF;
const preparedTIFF: Promise<DatumGrid> = loadGeoTIFFGrid(tiff);
void preparedTIFF;
// @ts-expect-error Grid preparation must finish before synchronous projection construction.
new ProjectionEngine({datumGrids: {local: preparedTIFF}});
// @ts-expect-error Prepared grid metadata is immutable.
preparedGrid.subgridCount = 2;

// Batch methods preserve the concrete typed-array type.
const batchProjection = new ProjectionEngine();
const float32Output: Float32Array = batchProjection.projectFlat(new Float32Array([0, 0]));
const float64Output: Float64Array = batchProjection.unprojectFlat(new Float64Array([0, 0]));
void float32Output;
void float64Output;
// @ts-expect-error Integer buffers cannot represent projected coordinates.
batchProjection.projectFlat(new Int32Array([0, 0]));
// @ts-expect-error The scalar array API is deliberately separate.
batchProjection.projectFlat([0, 0]);
