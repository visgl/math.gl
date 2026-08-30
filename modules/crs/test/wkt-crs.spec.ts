// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';

import {
  encodeWKTCRS,
  parseWKTCRS,
  validateWKTCRS,
  WKTCRSSyntaxError,
  WKTCRSValidationError
} from '@math.gl/crs';

const WKT1 =
  'PROJCS["NAD83 / Massachusetts Mainland",GEOGCS["NAD83",DATUM["North_American_Datum_1983",SPHEROID["GRS 1980",6378137,298.257222101]],PRIMEM["Greenwich",0],UNIT["degree",0.01745329251994328]],PROJECTION["Lambert_Conformal_Conic_2SP"],PARAMETER["standard_parallel_1",42.68333333333333],UNIT["metre",1]]';

const WKT2 = `GEODCRS["WGS 84",
  DATUM["World Geodetic System 1984",
    ELLIPSOID["WGS 84",6378137,298.257223563,LENGTHUNIT["metre",1]]],
  CS[ellipsoidal,2],
  AXIS["Latitude (lat)",north,ORDER[1]],
  AXIS["Longitude (lon)",east,ORDER[2]],
  ANGLEUNIT["degree",1.74532925199433E-2]]`;

const WKT2_DOCUMENTS = [
  'COORDINATEMETADATA[GEOGCRS["WGS 84",DATUM["World Geodetic System 1984",ELLIPSOID["WGS 84",6378137,298.257223563]],CS[ellipsoidal,2],AXIS["latitude",north],AXIS["longitude",east],ANGLEUNIT["degree",0.0174532925199433]],EPOCH[2021.3]]',
  'COORDINATEOPERATION["Longitude rotation",SOURCECRS[GEOGCRS["Source",DATUM["Datum",ELLIPSOID["Sphere",6371000,0]],CS[ellipsoidal,2],AXIS["latitude",north],AXIS["longitude",east],ANGLEUNIT["degree",0.0174532925199433]]],TARGETCRS[GEOGCRS["Target",DATUM["Datum",ELLIPSOID["Sphere",6371000,0]],CS[ellipsoidal,2],AXIS["latitude",north],AXIS["longitude",east],ANGLEUNIT["degree",0.0174532925199433]]],METHOD["Longitude rotation"],PARAMETER["Longitude offset",2,ANGLEUNIT["degree",0.0174532925199433]],OPERATIONACCURACY[0.1]]',
  'CONCATENATEDOPERATION["Two steps",SOURCECRS[GEOGCRS["A",DATUM["A",ELLIPSOID["Sphere",6371000,0]],CS[ellipsoidal,2],AXIS["lat",north],AXIS["lon",east],ANGLEUNIT["degree",0.0174532925199433]]],TARGETCRS[GEOGCRS["B",DATUM["B",ELLIPSOID["Sphere",6371000,0]],CS[ellipsoidal,2],AXIS["lat",north],AXIS["lon",east],ANGLEUNIT["degree",0.0174532925199433]]],STEP[COORDINATEOPERATION["First",SOURCECRS[GEOGCRS["A"]],TARGETCRS[GEOGCRS["B"]],METHOD["noop"]]],STEP[COORDINATEOPERATION["Second",SOURCECRS[GEOGCRS["B"]],TARGETCRS[GEOGCRS["C"]],METHOD["noop"]]]]',
  'BOUNDCRS[SOURCECRS[GEOGCRS["NAD83",DATUM["North American Datum 1983",ELLIPSOID["GRS 1980",6378137,298.257222101]],CS[ellipsoidal,2],AXIS["latitude",north],AXIS["longitude",east],ANGLEUNIT["degree",0.0174532925199433]]],TARGETCRS[GEOGCRS["WGS 84",DATUM["World Geodetic System 1984",ELLIPSOID["WGS 84",6378137,298.257223563]],CS[ellipsoidal,2],AXIS["latitude",north],AXIS["longitude",east],ANGLEUNIT["degree",0.0174532925199433]]],ABRIDGEDTRANSFORMATION["NAD83 to WGS 84",METHOD["Geocentric translations"],PARAMETER["X-axis translation",0,LENGTHUNIT["metre",1]]]]'
];

describe('WKT-CRS codec', () => {
  test('round trips WKT1 with exact number lexemes', () => {
    const ast = parseWKTCRS(WKT1, {profile: 'wkt1', strict: true});
    expect(ast.root.keyword).toBe('PROJCS');
    expect(ast.root.values[1]).toMatchObject({type: 'node', keyword: 'GEOGCS'});
    expect(encodeWKTCRS(ast)).toBe(WKT1);
  });

  test('round trips WKT2 with canonical whitespace and scientific notation', () => {
    const ast = parseWKTCRS(WKT2, {profile: 'wkt2:2019', strict: true});
    const encoded = encodeWKTCRS(ast);
    expect(encoded).toContain('1.74532925199433E-2');
    expect(encoded).not.toContain('\n');
    expect(encodeWKTCRS(parseWKTCRS(encoded))).toBe(encoded);
  });

  test.each(WKT2_DOCUMENTS)('round trips WKT2 root forms', text => {
    const ast = parseWKTCRS(text, {profile: 'wkt2:2019', strict: true});
    expect(encodeWKTCRS(ast)).toBe(text);
  });

  test('preserves alternate delimiters, escaped strings, and vendor nodes', () => {
    const text = 'GEOGCS("A ""quoted"" name",VENDOR_NODE("é",custom),UNIT("degree",1.0))';
    const ast = parseWKTCRS(text);
    expect(encodeWKTCRS(ast)).toBe(text);
    expect(validateWKTCRS(ast, {profile: 'gdal'})).toContainEqual(
      expect.objectContaining({code: 'unknown-keyword', keyword: 'VENDOR_NODE'})
    );
    expect(validateWKTCRS(ast, {profile: 'gdal', allowExtensions: true})).toEqual([]);
  });

  test('treats a backslash before a closing quote as literal', () => {
    const text = 'GEOGCRS["C:\\"]';
    const ast = parseWKTCRS(text);
    expect(ast.root.values[0]).toEqual({type: 'string', value: 'C:\\'});
    expect(encodeWKTCRS(ast)).toBe(text);
  });

  test('rejects quotes embedded in unquoted values', () => {
    expect(() => parseWKTCRS('GEOGCRS["x",VENDOR[north"bad]]')).toThrow(WKTCRSSyntaxError);
  });

  test('accepts and preserves independently matched delimiters', () => {
    const text =
      'GEOGCS["WGS 84",DATUM("WGS_1984",SPHEROID("WGS 84",6378137,298.257223563)),PRIMEM("Greenwich",0),UNIT("degree",0.0174532925199433)]';
    const ast = parseWKTCRS(text);
    expect(validateWKTCRS(ast, {profile: 'wkt1'})).toEqual([]);
    expect(encodeWKTCRS(ast)).toBe(text);
  });

  test('parses standard unquoted date-time values in temporal extents', () => {
    const text =
      'TIMECRS["Calendar time",TDATUM["Gregorian",TIMEORIGIN["0000-01-01"]],CS[temporalDateTime,1],AXIS["time (T)",future],TIMEUNIT["day",86400],USAGE[SCOPE["History"],TIMEEXTENT[2013-01-01,2014-07-12T17:00+01]]]';
    const ast = parseWKTCRS(text, {profile: 'wkt2:2019', strict: true});
    expect(encodeWKTCRS(ast)).toBe(text);
  });

  test('distinguishes WKT2:2015 from WKT2:2019 additions', () => {
    const text = 'COORDINATEMETADATA[GEOGCRS["WGS 84"],EPOCH[2021.3]]';
    expect(validateWKTCRS(parseWKTCRS(text), {profile: 'wkt2:2015'})).toContainEqual(
      expect.objectContaining({code: 'invalid-root', keyword: 'COORDINATEMETADATA'})
    );
    expect(validateWKTCRS(parseWKTCRS(text), {profile: 'wkt2:2019'})).toEqual([]);

    const pointMotionOperation =
      'POINTMOTIONOPERATION["Velocity model",SOURCECRS[GEODCRS["Source"]],METHOD["Velocity grid"]]';
    expect(
      validateWKTCRS(parseWKTCRS(pointMotionOperation), {profile: 'wkt2:2015'})
    ).toContainEqual(
      expect.objectContaining({code: 'invalid-root', keyword: 'POINTMOTIONOPERATION'})
    );
  });

  test('distinguishes GDAL and ESRI WKT1 extensions', () => {
    const gdal = 'PROJCS["Web Mercator",EXTENSION["PROJ4","+proj=merc"]]';
    expect(validateWKTCRS(parseWKTCRS(gdal), {profile: 'gdal'})).toEqual([]);
    expect(validateWKTCRS(parseWKTCRS(gdal), {profile: 'wkt1'})).toContainEqual(
      expect.objectContaining({code: 'unknown-keyword', keyword: 'EXTENSION'})
    );

    const esri =
      'VERTCS["NAVD_1988",VDATUM["North_American_Vertical_Datum_1988"],PARAMETER["Vertical_Shift",0],UNIT["Meter",1]]';
    expect(validateWKTCRS(parseWKTCRS(esri), {profile: 'esri'})).toEqual([]);
    expect(validateWKTCRS(parseWKTCRS(esri), {profile: 'wkt1'})).toContainEqual(
      expect.objectContaining({code: 'invalid-root', keyword: 'VERTCS'})
    );
  });

  test('validates unambiguous standard value shapes', () => {
    const ast = parseWKTCRS('GEOGCRS["WGS 84",CS[ellipsoidal,"two"]]');
    expect(validateWKTCRS(ast, {profile: 'wkt2:2019'})).toContainEqual(
      expect.objectContaining({code: 'invalid-value', keyword: 'CS'})
    );
  });

  test('strict mode rejects profile violations', () => {
    expect(() =>
      parseWKTCRS('GEOGCS["WGS 84",VENDOR[1]]', {profile: 'wkt1', strict: true})
    ).toThrow(WKTCRSValidationError);
  });

  test('reports precise syntax locations', () => {
    let error: WKTCRSSyntaxError | undefined;
    try {
      parseWKTCRS('GEOGCRS["WGS 84",\n  DATUM["WGS 84"]');
    } catch (caughtError) {
      error = caughtError as WKTCRSSyntaxError;
    }
    expect(error).toBeInstanceOf(WKTCRSSyntaxError);
    expect(error?.line).toBe(2);
    expect(error?.column).toBeGreaterThan(1);
  });

  test('pretty prints a parseable document', () => {
    const pretty = encodeWKTCRS(parseWKTCRS(WKT1), {format: 'pretty', indent: 2});
    expect(pretty).toContain('\n');
    expect(encodeWKTCRS(parseWKTCRS(pretty))).toBe(WKT1);
  });

  test('rejects unsafe caller-constructed AST lexemes', () => {
    const ast = parseWKTCRS('GEOGCRS["WGS 84",ID["EPSG",4326]]');
    const id = ast.root.values[1] as any;
    id.values[1] = {type: 'number', value: 4326, raw: '4326]'};
    expect(() => encodeWKTCRS(ast)).toThrow('Invalid WKT number lexeme');
  });

  test('reports structural validation errors for standard WKT2 nodes', () => {
    const invalidNodes = [
      'AUTHORITY[4326]',
      'AXIS[1,north]',
      'METHOD[1]',
      'TIMEEXTENT[2020]',
      'VERTICALEXTENT["low",2]',
      'COORDINATEMETADATA[GEOGCRS["x"],1]',
      'BOUNDCRS[TARGETCRS["x"]]',
      'GEOGCRS[1]',
      'PROJCRS[1]',
      'VERTCRS[1]'
    ];
    for (const text of invalidNodes) {
      expect(
        validateWKTCRS(parseWKTCRS(text), {profile: 'wkt2:2019'}).length,
        text
      ).toBeGreaterThan(0);
    }
  });

  test.each([
    '',
    'GEOGCRS',
    'GEOGCRS["WGS 84",]',
    'GEOGCRS["unterminated]',
    'GEOGCRS[DATUM["WGS 84"] extra]',
    'GEOGCRS[DATUM["WGS 84"]])'
  ])('rejects malformed input %#', text => {
    expect(() => parseWKTCRS(text)).toThrow(WKTCRSSyntaxError);
  });
});
