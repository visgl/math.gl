// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  CRSReference,
  CRSDefinition,
  PROJJSONCRS,
  PROJParameter,
  PROJStringAst,
  ReadonlyCRSDefinition,
  WKTCRSAst,
  SpatialReference,
  WKTCRSNode
} from '@math.gl/crs';
import type {Proj4CRSDefinition} from '@math.gl/proj4';

import {
  egm2008VerticalCRS,
  etrs89BoundCRS,
  utm31NProjectedCRS,
  wgs84Egm2008CompoundCRS,
  wgs84GeographicCRS
} from './projjson-fixtures';

export const serializedDefinitions: CRSDefinition[] = [
  'EPSG:4326',
  '+proj=longlat +datum=WGS84 +no_defs',
  'GEOGCRS["WGS 84",DATUM["World Geodetic System 1984"]]'
];
export const objectDefinitions: CRSDefinition[] = [
  wgs84GeographicCRS,
  utm31NProjectedCRS,
  wgs84Egm2008CompoundCRS,
  etrs89BoundCRS
];

// @ts-expect-error `NotACRS` is not a PROJJSON CRS type.
export const invalidCRSType: PROJJSONCRS = {type: 'NotACRS', name: 'Invalid'};

const geodeticCRS = {
  ...wgs84GeographicCRS,
  type: 'GeodeticCRS' as const
};
export const proj4Definitions: Proj4CRSDefinition[] = [
  wgs84GeographicCRS,
  geodeticCRS,
  utm31NProjectedCRS,
  etrs89BoundCRS
];

// @ts-expect-error proj4js does not transform CompoundCRS objects.
export const unsupportedCompoundCRS: Proj4CRSDefinition = wgs84Egm2008CompoundCRS;
// @ts-expect-error proj4js does not transform VerticalCRS objects.
export const unsupportedVerticalCRS: Proj4CRSDefinition = egm2008VerticalCRS;

const wktRoot: WKTCRSNode = {
  type: 'node',
  keyword: 'GEOGCRS',
  delimiter: 'bracket',
  values: [{type: 'string', value: 'WGS 84'}]
};
export const wktAst: WKTCRSAst = {type: 'wkt-crs', root: wktRoot};

const projParameter: PROJParameter = {type: 'parameter', name: 'proj', value: 'longlat'};
export const projAst: PROJStringAst = {type: 'proj-string', parameters: [projParameter]};

export const explicitCRSReference: CRSReference = {
  state: 'explicit',
  definition: 'EPSG:4326',
  representation: 'identifier',
  provenance: 'metadata'
};
export const readonlyCRSDefinition: ReadonlyCRSDefinition = wgs84GeographicCRS;

function assertReadonlyCRSDefinition(definition: ReadonlyCRSDefinition): void {
  if (typeof definition === 'object') {
    // @ts-expect-error Spatial-reference PROJJSON definitions are deeply readonly.
    definition.name = 'Mutated name';
  }
  if (typeof definition === 'object' && 'datum' in definition && definition.datum) {
    // @ts-expect-error Nested PROJJSON definitions are deeply readonly.
    definition.datum.ellipsoid.name = 'Mutated ellipsoid';
  }
}
void assertReadonlyCRSDefinition;

function assertReadonlyCRSArrays(definition: ReadonlyCRSDefinition): void {
  if (typeof definition === 'object' && definition.type === 'CompoundCRS') {
    // @ts-expect-error Nested PROJJSON arrays are deeply readonly.
    definition.components.push(wgs84GeographicCRS);
  }
}
void assertReadonlyCRSArrays;

export const spatialReference: SpatialReference = {
  crs: explicitCRSReference,
  coordinateFrame: 'geographic',
  coordinateOrder: ['x', 'y']
};

// @ts-expect-error A known reference requires a CRS definition and representation.
export const invalidKnownCRSReference: CRSReference = {
  state: 'explicit',
  provenance: 'metadata'
};
