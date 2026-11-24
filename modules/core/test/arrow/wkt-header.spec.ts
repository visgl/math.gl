// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {inspectWKTHeader} from '@math.gl/core/arrow';
import {expect, test} from 'vitest';

test('reads WKT headers without decoding coordinates', () => {
  expect(inspectWKTHeader('  point (invalid payload')).toEqual({
    geometryType: 'Point',
    dimension: 'xy'
  });
  expect(inspectWKTHeader('SRID=4326; MULTIPOLYGON ZM EMPTY')).toEqual({
    geometryType: 'MultiPolygon',
    dimension: 'xyzm',
    srid: 4326
  });
  expect(inspectWKTHeader('linestring m (0 0 8, 1 1 9)')?.dimension).toBe('xym');
  expect(inspectWKTHeader('GeometryCollection Z (POINT (0 0 0))')?.dimension).toBe('xyz');
});

test.each([
  'POINT',
  'POINTLESS (1 2)',
  'POINT M EMPTYISH',
  'SRID=x; POINT EMPTY'
])('rejects an unrecognized header: %s', text => expect(inspectWKTHeader(text)).toBeNull());
