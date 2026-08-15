// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CRSDefinition, PROJJSONCRS} from '@math.gl/crs';
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
