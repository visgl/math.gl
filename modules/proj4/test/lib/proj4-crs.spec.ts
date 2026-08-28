// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  checkProj4CRSCompatibility,
  Proj4CRSCompatibilityError,
  toProj4CRSDefinition
} from '@math.gl/proj4';
import {createSpatialReference} from '@math.gl/crs';
import {
  egm2008VerticalCRS,
  etrs89BoundCRS,
  utm31NProjectedCRS,
  wgs84Egm2008CompoundCRS,
  wgs84GeographicCRS
} from '@math.gl/crs/test/projjson-fixtures';

const WGS84_WKT2 =
  'GEOGCRS["WGS 84",DATUM["World Geodetic System 1984",ELLIPSOID["WGS 84",6378137,298.257223563]],PRIMEM["Greenwich",0],CS[ellipsoidal,2],AXIS["geodetic latitude (Lat)",north,ORDER[1]],AXIS["geodetic longitude (Lon)",east,ORDER[2]],ANGLEUNIT["degree",0.0174532925199433]]';

test('toProj4CRSDefinition preserves supported definitions', () => {
  expect(toProj4CRSDefinition(wgs84GeographicCRS)).toBe(wgs84GeographicCRS);
  expect(toProj4CRSDefinition('EPSG:4326')).toBe('EPSG:4326');
});

test('toProj4CRSDefinition rejects unsupported CRS objects in strict mode', () => {
  expect(() => toProj4CRSDefinition(wgs84Egm2008CompoundCRS)).toThrow(Proj4CRSCompatibilityError);

  try {
    toProj4CRSDefinition(egm2008VerticalCRS);
  } catch (error) {
    expect(error).toBeInstanceOf(Proj4CRSCompatibilityError);
    expect((error as Proj4CRSCompatibilityError).compatibility).toMatchObject({
      status: 'unsupported',
      reason: 'unsupported-crs-type',
      type: 'VerticalCRS',
      lossy: false
    });
  }
});

test('toProj4CRSDefinition explicitly extracts a compound horizontal CRS', () => {
  const horizontal = toProj4CRSDefinition(wgs84Egm2008CompoundCRS, {mode: 'horizontal'});
  expect(horizontal).toBe(wgs84Egm2008CompoundCRS.components[0]);

  const compatibility = checkProj4CRSCompatibility(wgs84Egm2008CompoundCRS, {
    mode: 'horizontal'
  });
  expect(compatibility).toMatchObject({
    status: 'supported',
    checked: true,
    lossy: true,
    type: 'CompoundCRS'
  });
});

test('horizontal extraction rejects missing or ambiguous components', () => {
  const verticalOnlyCompound = {
    type: 'CompoundCRS' as const,
    components: [egm2008VerticalCRS]
  };
  const verticalBoundCRS = {
    ...etrs89BoundCRS,
    source_crs: egm2008VerticalCRS
  };
  const verticalBoundCompound = {
    type: 'CompoundCRS' as const,
    components: [verticalBoundCRS]
  };
  const horizontalAndVerticalBoundCompound = {
    type: 'CompoundCRS' as const,
    components: [wgs84GeographicCRS, verticalBoundCRS]
  };
  const ambiguousCompound = {
    type: 'CompoundCRS' as const,
    components: [wgs84GeographicCRS, utm31NProjectedCRS]
  };

  expect(() => toProj4CRSDefinition(verticalOnlyCompound, {mode: 'horizontal'})).toThrow(
    'does not contain a Proj4-compatible horizontal CRS'
  );
  expect(() => toProj4CRSDefinition(verticalBoundCompound, {mode: 'horizontal'})).toThrow(
    'does not contain a Proj4-compatible horizontal CRS'
  );
  expect(() => toProj4CRSDefinition(ambiguousCompound, {mode: 'horizontal'})).toThrow(
    'more than one Proj4-compatible horizontal CRS'
  );

  expect(checkProj4CRSCompatibility(verticalOnlyCompound, {mode: 'horizontal'})).toMatchObject({
    status: 'unsupported',
    reason: 'missing-horizontal-crs',
    lossy: true
  });
  expect(checkProj4CRSCompatibility(verticalBoundCompound, {mode: 'horizontal'})).toMatchObject({
    status: 'unsupported',
    reason: 'missing-horizontal-crs',
    lossy: true
  });
  expect(
    checkProj4CRSCompatibility(horizontalAndVerticalBoundCompound, {mode: 'horizontal'})
  ).toMatchObject({
    status: 'supported',
    checked: true,
    lossy: true
  });
  expect(checkProj4CRSCompatibility(ambiguousCompound, {mode: 'horizontal'})).toMatchObject({
    status: 'unsupported',
    reason: 'ambiguous-horizontal-crs',
    lossy: true
  });
});

test('checkProj4CRSCompatibility probes supported CRS objects without transforming coordinates', () => {
  for (const definition of [wgs84GeographicCRS, utm31NProjectedCRS, etrs89BoundCRS]) {
    expect(checkProj4CRSCompatibility(definition)).toMatchObject({
      status: 'supported',
      checked: true,
      lossy: false
    });
  }
});

test('compatibility utilities accept frozen spatial-reference definitions', () => {
  const spatialReference = createSpatialReference({
    crs: {
      state: 'explicit',
      definition: wgs84GeographicCRS,
      representation: 'projjson',
      provenance: 'metadata'
    }
  });

  expect(spatialReference.crs.state).toBe('explicit');
  if (spatialReference.crs.state === 'explicit') {
    expect(Object.isFrozen(spatialReference.crs.definition)).toBe(true);
    expect(checkProj4CRSCompatibility(spatialReference.crs.definition)).toMatchObject({
      status: 'supported',
      checked: true,
      lossy: false
    });
    expect(toProj4CRSDefinition(spatialReference.crs.definition)).toBe(
      spatialReference.crs.definition
    );
  }
});

test('checkProj4CRSCompatibility supports serialized definition policies', () => {
  expect(checkProj4CRSCompatibility(WGS84_WKT2)).toMatchObject({
    status: 'supported',
    checked: true,
    lossy: false
  });
  expect(checkProj4CRSCompatibility('+proj=longlat +datum=WGS84 +no_defs')).toMatchObject({
    status: 'supported',
    checked: true,
    lossy: false
  });
  expect(
    checkProj4CRSCompatibility('+proj=longlat +datum=WGS84 +no_defs', {serialized: 'unknown'})
  ).toMatchObject({
    status: 'unknown',
    checked: false,
    reason: 'serialized-definition-not-checked'
  });
  expect(
    checkProj4CRSCompatibility('+proj=longlat +datum=WGS84 +no_defs', {serialized: 'accept'})
  ).toMatchObject({status: 'supported', checked: false});
  expect(checkProj4CRSCompatibility('+proj=not-a-projection')).toMatchObject({
    status: 'unsupported',
    checked: true,
    reason: 'proj4js-parse-error'
  });
});
