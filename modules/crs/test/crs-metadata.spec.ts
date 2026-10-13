// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getCRSSignature} from '@math.gl/crs';
import type {CRSMetadata} from '@math.gl/crs';

const metadata: CRSMetadata = {
  coordinateFrame: 'projected',
  projection: 'merc',
  parameters: {proj: 'merc', lon_0: '0', units: 'm'},
  ellipsoid: {semiMajorAxis: 6378137, semiMinorAxis: 6356752.314245179},
  axis: 'enu',
  xUnit: {name: 'meters', metersPerUnit: 1},
  yUnit: {name: 'meters', metersPerUnit: 1},
  zUnit: {name: 'meters', metersPerUnit: 1},
  lossy: false
};

test('CRS signatures ignore object identity and property order', () => {
  const parameters: Record<string, string | undefined> = {};
  for (const key of Object.keys(metadata.parameters).reverse())
    parameters[key] = metadata.parameters[key];
  expect(
    getCRSSignature({
      ...metadata,
      parameters,
      ellipsoid: {...metadata.ellipsoid},
      xUnit: {metersPerUnit: 1, name: 'meters'}
    })
  ).toBe(getCRSSignature(metadata));
  const descriptor = {
    ...metadata,
    bounds: [
      [0, 0],
      [100, 100]
    ],
    converter: {}
  };
  expect(getCRSSignature(descriptor)).toBe(getCRSSignature(metadata));
});

test('CRS signatures track projection parameters, ellipsoid, units and effective axes', () => {
  for (const changed of [
    {...metadata, coordinateFrame: 'identity' as const},
    {...metadata, projection: 'eqc'},
    {...metadata, parameters: {...metadata.parameters, lon_0: '30'}},
    {...metadata, ellipsoid: {...metadata.ellipsoid, semiMajorAxis: 6371008.8}},
    {...metadata, ellipsoid: {...metadata.ellipsoid, semiMinorAxis: 6371008.8}},
    {...metadata, axis: 'wsu'},
    {...metadata, xUnit: {name: 'feet', metersPerUnit: 0.3048}},
    {...metadata, yUnit: {name: 'feet', metersPerUnit: 0.3048}},
    {...metadata, zUnit: {name: 'feet', metersPerUnit: 0.3048}},
    {...metadata, areaOfUse: [2, 40, 4, 50] as const},
    {...metadata, lossy: true}
  ]) {
    expect(getCRSSignature(changed)).not.toBe(getCRSSignature(metadata));
  }
});
