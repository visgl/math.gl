// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';

import {normalizeCRSIdentifier} from '@math.gl/geospatial/crs';

describe('normalizeCRSIdentifier', () => {
  test.each([
    ['EPSG:32619', 'EPSG:32619'],
    ['epsg:32619', 'EPSG:32619'],
    ['  EPSG:32619 ', 'EPSG:32619'],
    ['urn:ogc:def:crs:EPSG::32619', 'EPSG:32619'],
    ['URN:OGC:DEF:CRS:EPSG:0:32619', 'EPSG:32619'],
    ['http://www.opengis.net/def/crs/EPSG/0/32619', 'EPSG:32619'],
    ['https://www.opengis.net/def/crs/EPSG/0/32619/', 'EPSG:32619'],
    ['urn:ogc:def:crs:ESRI::102100', 'ESRI:102100'],
    ['http://www.opengis.net/def/crs/IAU/0/49900', 'IAU:49900']
  ])('normalizes %s to %s', (identifier, expected) => {
    expect(normalizeCRSIdentifier(identifier)).toBe(expected);
  });

  test.each([
    'OGC:CRS84',
    'ogc:crs84',
    'CRS:84',
    'urn:ogc:def:crs:OGC::CRS84',
    'urn:ogc:def:crs:OGC:1.3:CRS84',
    'http://www.opengis.net/def/crs/OGC/1.3/CRS84',
    'http://www.opengis.net/def/crs/OGC/0/CRS84'
  ])('normalizes %s to OGC:CRS84', identifier => {
    expect(normalizeCRSIdentifier(identifier)).toBe('OGC:CRS84');
  });

  test('maps each WMS 1.3 CRS code to its OGC register entry', () => {
    expect(normalizeCRSIdentifier('CRS:83')).toBe('OGC:CRS83');
    expect(normalizeCRSIdentifier('CRS:27')).toBe('OGC:CRS27');
    expect(normalizeCRSIdentifier('CRS:1')).toBe('CRS:1');
  });

  test('keeps distinct registry entries distinct', () => {
    expect(normalizeCRSIdentifier('urn:ogc:def:crs:EPSG::4326')).toBe('EPSG:4326');
    expect(normalizeCRSIdentifier('http://www.opengis.net/def/crs/OGC/1.3/CRS84')).toBe(
      'OGC:CRS84'
    );
    expect(normalizeCRSIdentifier('EPSG:900913')).toBe('EPSG:900913');
    expect(normalizeCRSIdentifier('urn:ogc:def:crs:ESRI::102100')).not.toBe('EPSG:102100');
  });

  test.each([
    'urn:ogc:def:crs:EPSG:6.6:4326',
    'http://www.opengis.net/def/crs/EPSG/9.9.1/32619',
    'urn:ogc:def:crs:OGC:1.2:CRS84',
    'http://www.opengis.net/def/crs/OGC/1.3/AnsiDate'
  ])('returns versioned identifier %s unchanged', identifier => {
    expect(normalizeCRSIdentifier(identifier)).toBe(identifier);
  });

  test.each([
    'WGS84',
    '+proj=longlat +datum=WGS84',
    'GEOGCRS["WGS 84"]',
    'urn:x-ogc:def:crs:EPSG:4326',
    'urn:ogc:def:crs,crs:EPSG::4326,crs:EPSG::5773',
    'http://example.com/def/crs/EPSG/0/4326',
    ''
  ])('returns unrecognized identifier %j unchanged', identifier => {
    expect(normalizeCRSIdentifier(identifier)).toBe(identifier);
  });
});
