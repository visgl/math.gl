// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';

import {createSpatialReference, inferCRSRepresentation} from '@math.gl/crs';
import {wgs84GeographicCRS} from './projjson-fixtures';

describe('createSpatialReference', () => {
  test('preserves a preferred definition and alternate representation immutably', () => {
    const coordinateOrder = ['x', 'y'];
    const spatialReference = createSpatialReference({
      crs: {
        state: 'explicit',
        definition: 'GEOGCRS["WGS 84"]',
        representation: 'wkt',
        provenance: 'metadata',
        alternatives: [{definition: 'EPSG:4326', representation: 'identifier'}]
      },
      coordinateEpoch: 2020.25,
      coordinateFrame: 'geographic',
      coordinateOrder,
      units: ['degree', 'degree']
    });

    coordinateOrder[0] = 'latitude';
    expect(spatialReference).toMatchObject({
      coordinateEpoch: 2020.25,
      coordinateFrame: 'geographic',
      coordinateOrder: ['x', 'y'],
      units: ['degree', 'degree']
    });
    expect(spatialReference.crs).toEqual({
      state: 'explicit',
      definition: 'GEOGCRS["WGS 84"]',
      representation: 'wkt',
      provenance: 'metadata',
      alternatives: [{definition: 'EPSG:4326', representation: 'identifier'}]
    });
    expect(Object.isFrozen(spatialReference)).toBe(true);
    expect(Object.isFrozen(spatialReference.coordinateOrder)).toBe(true);
    expect(
      spatialReference.crs.state === 'explicit' &&
        Object.isFrozen(spatialReference.crs.alternatives)
    ).toBe(true);
  });

  test('keeps explicit unknown metadata distinct from absent and defaulted metadata', () => {
    expect(createSpatialReference({crs: {state: 'unknown', provenance: 'metadata'}}).crs).toEqual({
      state: 'unknown',
      provenance: 'metadata'
    });
    expect(createSpatialReference().crs).toEqual({state: 'absent', provenance: 'unknown'});
    expect(
      createSpatialReference({
        crs: {
          state: 'default',
          definition: 'OGC:CRS84',
          representation: 'identifier',
          provenance: 'format-default'
        }
      }).crs
    ).toEqual({
      state: 'default',
      definition: 'OGC:CRS84',
      representation: 'identifier',
      provenance: 'format-default',
      alternatives: undefined
    });
  });

  test('clones and recursively freezes PROJJSON definitions', () => {
    const spatialReference = createSpatialReference({
      crs: {
        state: 'explicit',
        definition: wgs84GeographicCRS,
        representation: 'projjson',
        provenance: 'metadata'
      }
    });

    expect(
      spatialReference.crs.state === 'explicit' &&
        spatialReference.crs.definition !== wgs84GeographicCRS
    ).toBe(true);
    expect(
      spatialReference.crs.state === 'explicit' &&
        typeof spatialReference.crs.definition === 'object' &&
        Object.isFrozen(spatialReference.crs.definition.datum?.ellipsoid)
    ).toBe(true);
  });

  test('rejects a non-finite coordinate epoch', () => {
    expect(() => createSpatialReference({coordinateEpoch: Number.NaN})).toThrow(
      'finite decimal year'
    );
    expect(() => createSpatialReference({coordinateEpoch: Number.POSITIVE_INFINITY})).toThrow(
      'finite decimal year'
    );
  });
});

describe('inferCRSRepresentation', () => {
  test.each([
    ['EPSG:4326', 'identifier'],
    ['urn:ogc:def:crs:EPSG::4326', 'identifier'],
    ['https://www.opengis.net/def/crs/EPSG/0/4326', 'identifier'],
    ['WGS84', 'identifier'],
    ['GEOGCRS["WGS 84"]', 'wkt'],
    ['PROJCS("Vendor form")', 'wkt'],
    ['+proj=longlat +datum=WGS84', 'proj-string'],
    ['proj=pipeline step proj=unitconvert', 'proj-string'],
    ['vendor supplied description', 'opaque'],
    ['', 'opaque']
  ] as const)('classifies %j as %s', (definition, representation) => {
    expect(inferCRSRepresentation(definition)).toBe(representation);
  });

  test('classifies object definitions as PROJJSON', () => {
    expect(inferCRSRepresentation(wgs84GeographicCRS)).toBe('projjson');
  });
});
