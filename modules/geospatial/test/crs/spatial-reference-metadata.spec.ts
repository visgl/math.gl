// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  createSpatialReference,
  SPATIAL_REFERENCE_METADATA_KEY,
  getSpatialReferenceMetadata,
  setSpatialReferenceMetadata,
  resolveSpatialReferenceMetadata
} from '@math.gl/geospatial/crs';
import {wgs84GeographicCRS} from './projjson-fixtures';

const geographic = createSpatialReference({
  crs: {
    state: 'explicit',
    definition: 'EPSG:4326',
    representation: 'identifier',
    provenance: 'metadata'
  },
  vertical: {state: 'unknown', provenance: 'metadata'},
  coordinateFrame: 'geographic',
  coordinateOrder: ['longitude', 'latitude', 'height'],
  units: ['degree', 'degree', 'metre'],
  coordinateEpoch: 2020.25
});

/** Build metadata from untrusted JSON to exercise validation. */
function metadata(value: unknown): Map<string, string> {
  return new Map([[SPATIAL_REFERENCE_METADATA_KEY, JSON.stringify(value)]]);
}

describe('spatial reference metadata', () => {
  test('round trips all descriptor fields without modifying caller metadata', () => {
    const original = new Map([['source', 'LAS']]);
    const encoded = setSpatialReferenceMetadata(original, geographic);
    expect(original.size).toBe(1);
    expect(encoded.get('source')).toBe('LAS');
    const decoded = getSpatialReferenceMetadata(encoded)!;
    expect(decoded).toEqual(geographic);
    expect(decoded).not.toBe(geographic);
    expect(Object.isFrozen(decoded)).toBe(true);
    expect(Object.isFrozen(decoded.coordinateOrder)).toBe(true);
    expect(Object.isFrozen(decoded.vertical)).toBe(true);
  });

  test('replaces an existing declaration and preserves unrelated entries', () => {
    const original = setSpatialReferenceMetadata(new Map([['source', 'LAS']]), geographic);
    const replacement = createSpatialReference();
    expect(getSpatialReferenceMetadata(setSpatialReferenceMetadata(original, replacement))).toEqual(
      replacement
    );
    expect(getSpatialReferenceMetadata(original)).toEqual(geographic);
  });

  test('missing keys inherit; field declarations override the entire schema descriptor', () => {
    const schema = setSpatialReferenceMetadata(undefined, geographic);
    expect(resolveSpatialReferenceMetadata(undefined)).toBeUndefined();
    expect(getSpatialReferenceMetadata(new Map())).toBeUndefined();
    expect(resolveSpatialReferenceMetadata(schema, new Map())).toEqual(geographic);
    for (const state of ['unknown', 'absent'] as const) {
      const field = createSpatialReference({crs: {state, provenance: 'metadata'}});
      expect(
        resolveSpatialReferenceMetadata(schema, setSpatialReferenceMetadata(undefined, field))
      ).toEqual(field);
    }
    const field = createSpatialReference({
      crs: {
        ...geographic.crs,
        state: 'default',
        definition: 'EPSG:3857',
        representation: 'identifier',
        provenance: 'format-default'
      }
    });
    expect(
      resolveSpatialReferenceMetadata(schema, setSpatialReferenceMetadata(undefined, field))
    ).toEqual(field);
  });

  test.each(['identifier', 'wkt', 'proj-string', 'opaque', 'projjson'] as const)(
    'preserves %s definitions and alternatives without interpreting them',
    representation => {
      const reference = createSpatialReference({
        crs: {
          state: 'explicit',
          provenance: 'metadata',
          representation,
          definition: representation === 'projjson' ? wgs84GeographicCRS : 'source definition',
          alternatives: [{definition: 'EPSG:4326', representation: 'identifier'}]
        }
      });
      const decoded = getSpatialReferenceMetadata(
        setSpatialReferenceMetadata(undefined, reference)
      )!;
      expect(decoded).toEqual(reference);
      if (decoded.crs.state === 'explicit' && typeof decoded.crs.definition === 'object') {
        expect(Object.isFrozen(decoded.crs.definition.datum?.ellipsoid)).toBe(true);
      }
    }
  );

  test.each([
    null,
    [],
    {},
    {...geographic, crs: {state: 'explicit', provenance: 'metadata'}},
    {...geographic, crs: {...geographic.crs, provenance: 'invented'}},
    {...geographic, crs: {...geographic.crs, representation: 'projjson', definition: 'EPSG:4326'}},
    {...geographic, crs: {...geographic.crs, alternatives: [{}]}},
    {...geographic, crs: {state: 'unknown', provenance: 'metadata', definition: 'EPSG:4326'}},
    {...geographic, vertical: {}},
    {...geographic, coordinateFrame: 'invented'},
    {...geographic, coordinateOrder: [1]},
    {...geographic, units: 'metres'},
    {...geographic, coordinateEpoch: '2020'}
  ])('rejects malformed descriptors: %j', value => {
    expect(() => getSpatialReferenceMetadata(metadata(value))).toThrow(
      'Invalid spatial reference metadata'
    );
  });

  test('invalid field metadata never silently falls back to the schema', () => {
    const schema = setSpatialReferenceMetadata(undefined, geographic);
    expect(() => resolveSpatialReferenceMetadata(schema, metadata(null))).toThrow();
    expect(() =>
      getSpatialReferenceMetadata(new Map([[SPATIAL_REFERENCE_METADATA_KEY, '{']]))
    ).toThrow(SyntaxError);
    expect(() =>
      setSpatialReferenceMetadata(undefined, {...geographic, coordinateEpoch: Infinity})
    ).toThrow();
  });
});
