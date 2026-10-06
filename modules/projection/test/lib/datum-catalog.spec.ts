// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import proj4 from 'proj4';
import {
  ProjectionEngine,
  normalizeCRS,
  checkProjectionCompatibility,
  createProjectionDescriptor,
  type DatumCatalogPlugin,
  type DatumDefinition
} from '@math.gl/projection/core';
import {datumCatalog} from '@math.gl/projection/datums';
import {Projection, mercator, wktCRSParser, projJSONCRSParser} from '@math.gl/projection';
import {LazyProjection} from '@math.gl/projection/projections/lazy';
import {geographicJSON} from '../fixtures/crs-datums';

const regional = '+proj=longlat +datum=OSGB36';
const datumCatalogs = [datumCatalog];
const parsers = [wktCRSParser, projJSONCRSParser];
const point = [-2, 52, 100];
function close(actual: readonly number[], expected: readonly number[]): void {
  expect(actual.length).toBe(expected.length);
  actual.forEach((value, index) => expect(value).toBeCloseTo(expected[index], 6));
}

test('default named datums are WGS84 and NAD83, with the existing aliases', () => {
  for (const name of ['wgs84', 'WGS_84', 'nad83', 'North American Datum 1983']) {
    const crs = normalizeCRS('+proj=longlat +datum=' + name.replace(/ /g, '_'));
    expect(crs.datum.towgs84).toEqual([0, 0, 0]);
  }
  for (const name of ['OSGB36', 'potsdam', 'NAD27', 'not_a_datum']) {
    expect(() => normalizeCRS('+proj=longlat +datum=' + name)).toThrow('datumCatalogs');
  }
  expect(checkProjectionCompatibility(regional).reason).toBe('missing-transform-stage');
  expect(checkProjectionCompatibility(regional, {datumCatalogs}).status).toBe('supported');
});

test('regional catalogue preserves datum transforms, inverse heights and flat buffers', () => {
  const engine = new ProjectionEngine({from: regional, datumCatalogs});
  const expected = proj4(regional, 'WGS84').forward([...point], true);
  close(engine.project(point), expected);
  close(engine.unproject(expected), proj4('WGS84', regional).forward([...expected], true));
  const flat = new Float64Array([...point, 7]);
  engine.projectFlat(flat, 4);
  close(Array.from(flat), [...expected, 7]);
  close(new Projection({from: regional}).project(point), expected);
  expect(() => new ProjectionEngine({from: regional})).toThrow('Unknown datum');
});

test('every regional name and alias resolves its declared operation', () => {
  expect(Object.keys(datumCatalog.datums).length).toBe(452);
  for (const [name, definition] of Object.entries(datumCatalog.datums)) {
    const crs = normalizeCRS('+proj=longlat +datum=' + name.replace(/ /g, '_'), {datumCatalogs});
    if (definition.towgs84)
      expect(crs.datum.towgs84).toEqual(definition.towgs84.split(',').map(Number));
    if (definition.nadgrids)
      expect(crs.datum.grids?.map(grid => (grid.optional ? '@' : '') + grid.name).join(',')).toBe(
        definition.nadgrids
      );
  }
});

test('WKT and PROJJSON require the same catalogue as PROJ strings', () => {
  const json = {
    ...geographicJSON,
    datum: {
      type: 'GeodeticReferenceFrame' as const,
      name: 'OSGB36',
      ellipsoid: {
        name: 'Airy 1830',
        semi_major_axis: 6377563.396,
        semi_minor_axis: 6356256.91
      }
    }
  };
  const wkt =
    'GEOGCS["OSGB36",DATUM["OSGB36",SPHEROID["Airy 1830",6377563.396,' +
    6377563.396 / (6377563.396 - 6356256.91) +
    ']],PRIMEM["Greenwich",0],UNIT["degree",0.017453292519943295]]';
  for (const from of [json, wkt]) {
    expect(() => new ProjectionEngine({from, parsers})).toThrow('datumCatalogs');
    close(
      new ProjectionEngine({from, parsers, datumCatalogs}).project(point),
      new ProjectionEngine({from: regional, datumCatalogs}).project(point)
    );
  }
  // An explicit WKT operation remains usable without any named catalogue.
  const explicit = wkt.replace(']],PRIMEM', '],TOWGS84[1,2,3]],PRIMEM');
  expect(normalizeCRS(explicit, {parsers}).datum.towgs84).toEqual([1, 2, 3]);
});

test('compatibility wrapper retains ellipsoid-only handling of unmatched structured labels', () => {
  const from = {
    ...geographicJSON,
    datum: {...geographicJSON.datum, name: 'Application spheroid'}
  };
  expect(() => new ProjectionEngine({from, parsers})).toThrow('Unknown datum');
  close(new Projection({from}).project(point), point);
});

test('catalogue registrations are isolated and reject normalized conflicts', () => {
  const definition: DatumDefinition = {ellipse: 'airy', towgs84: '1,2,3'};
  const custom: DatumCatalogPlugin = {
    name: 'local',
    datums: {local: definition, LO_CAL: {...definition}}
  };
  const engine = new ProjectionEngine({
    from: '+proj=longlat +datum=local',
    datumCatalogs: [custom]
  });
  close(
    engine.project(point),
    proj4('+proj=longlat +ellps=airy +towgs84=1,2,3', 'WGS84').forward([...point], true)
  );
  expect(() => normalizeCRS('+proj=longlat +datum=local')).toThrow('Unknown datum');
  for (const catalogs of [
    [custom, {name: 'other', datums: {LOCAL: definition}}],
    [{name: 'override', datums: {WGS_84: definition}}],
    [
      {
        name: 'conflict',
        datums: {local: definition, LOCAL: {towgs84: '4,5,6'}}
      }
    ]
  ])
    expect(() => normalizeCRS('WGS84', {datumCatalogs: catalogs})).toThrow('Conflicting datum');
  expect(() =>
    normalizeCRS('WGS84', {
      datumCatalogs: [{name: 'invalid', datums: {none: {}}}]
    })
  ).toThrow('Invalid datum');
});

test('static creation and deferred projection paths retain catalogue options', async () => {
  const descriptor = createProjectionDescriptor({name: 'merc'}, async () => mercator);
  const options = {from: regional, to: 'EPSG:3857', datumCatalogs};
  const expected = new ProjectionEngine({
    ...options,
    projections: [mercator]
  }).project(point);
  const deferred = new ProjectionEngine({
    ...options,
    projections: [descriptor]
  });
  close(await deferred.project(point), expected);
  close(
    (await ProjectionEngine.create({...options, projections: [descriptor]})).project(point),
    expected
  );
  const lazy = new LazyProjection(options);
  close(await lazy.project(point), expected);
  close((await LazyProjection.create(options)).project(point), expected);
  expect(() => new LazyProjection({from: regional, to: 'EPSG:3857'})).toThrow('datumCatalogs');
});

test('structured names prefer exact catalogue matches over broader aliases', () => {
  const first = {ellipse: 'WGS84', towgs84: '1,2,3'};
  const second = {ellipse: 'WGS84', towgs84: '100,200,300'};
  const catalog: DatumCatalogPlugin = {
    name: 'distinct-names',
    datums: {local: first, D_Local: second, foobar: first, 'foo.bar': second, WGS_1984: second}
  };
  const catalogs = [catalog];
  for (const name of Object.keys(catalog.datums)) {
    const json = {...geographicJSON, datum: {...geographicJSON.datum, name}};
    const wkt =
      'GEOGCS["local",DATUM["' +
      name +
      '",SPHEROID["WGS84",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.017453292519943295]]';
    const proj = '+proj=longlat +datum=' + name;
    const expected = new ProjectionEngine({from: proj, datumCatalogs: catalogs}).project(point);
    for (const from of [json, wkt]) {
      expect(normalizeCRS(from, {parsers, datumCatalogs: catalogs}).datum.towgs84).toEqual(
        normalizeCRS(proj, {datumCatalogs: catalogs}).datum.towgs84
      );
      close(
        new ProjectionEngine({from, parsers, datumCatalogs: catalogs}).project(point),
        expected
      );
    }
  }
  const ambiguous = {...geographicJSON, datum: {...geographicJSON.datum, name: 'D_foo..bar'}};
  expect(() => normalizeCRS(ambiguous, {parsers, datumCatalogs: catalogs})).toThrow(
    'Ambiguous structured datum'
  );
  const equivalent: DatumCatalogPlugin = {
    name: 'equivalent-fallbacks',
    datums: {foobar: first, 'foo.bar': {...first}}
  };
  expect(normalizeCRS(ambiguous, {parsers, datumCatalogs: [equivalent]}).datum.towgs84).toEqual([
    1, 2, 3
  ]);
});

test('catalogue validation is reused within a normalization configuration', () => {
  let scans = 0;
  const datums = new Proxy(
    {local: {ellipse: 'WGS84', towgs84: '1,2,3'}},
    {
      ownKeys(target) {
        scans++;
        return Reflect.ownKeys(target);
      }
    }
  );
  const options = {datumCatalogs: [{name: 'local', datums}], parsers};
  const from = {...geographicJSON, datum: {...geographicJSON.datum, name: 'local'}};
  const engine = new ProjectionEngine({from, to: from, ...options});
  expect(scans).toBe(1);
  close(engine.project(point), point);
  normalizeCRS(from, options);
  normalizeCRS('+proj=longlat +datum=local', options);
  expect(scans).toBe(2);
  const other = {datumCatalogs: [{name: 'other', datums: {local: {towgs84: '4,5,6'}}}]};
  expect(normalizeCRS('+proj=longlat +datum=local', other).datum.towgs84).toEqual([4, 5, 6]);
  options.datumCatalogs = [
    {name: 'replacement', datums: {local: {ellipse: 'WGS84', towgs84: '7,8,9'}}}
  ];
  expect(normalizeCRS('+proj=longlat +datum=local', options).datum.towgs84).toEqual([7, 8, 9]);
});

test('registered structured fallback names take priority over legacy aliases', () => {
  const catalogs: readonly DatumCatalogPlugin[] = [
    {
      name: 'legacy-name-overrides',
      datums: {
        New_Zealand_1949: {ellipse: 'WGS84', towgs84: '1,2,3'},
        Belge_1972: {ellipse: 'WGS84', towgs84: '4,5,6'}
      }
    }
  ];
  for (const name of Object.keys(catalogs[0].datums)) {
    const proj = '+proj=longlat +datum=' + name;
    const expected = new ProjectionEngine({from: proj, datumCatalogs: catalogs}).project(point);
    const datumName = 'D_' + name;
    const json = {...geographicJSON, datum: {...geographicJSON.datum, name: datumName}};
    const wkt =
      'GEOGCS["local",DATUM["' +
      datumName +
      '",SPHEROID["WGS84",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.017453292519943295]]';
    for (const from of [json, wkt])
      close(
        new ProjectionEngine({from, parsers, datumCatalogs: catalogs}).project(point),
        expected
      );
  }
});
