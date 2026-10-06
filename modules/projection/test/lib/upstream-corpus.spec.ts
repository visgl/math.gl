// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Fixture data adapted from proj4js 2.22.0 tests. See modules/projection/PROJ4-LICENSE.md for upstream attribution and MIT terms.
// Fixture inputs and tolerance semantics adapted from proj4js 2.22.0 tests (MIT).
// Copyright (c) 2014, proj4js authors. See ../../PROJ4-LICENSE.md.
import {expect, test} from 'vitest';
import {datumCatalog} from '@math.gl/projection/datums';
import {unshiftedStructuredDatums} from '../fixtures/unshifted-structured-datums';
import proj4 from 'proj4';
import upstreamManifest from 'proj4/package.json';
import * as native from '@math.gl/projection/experimental';
import type {TypeScriptCRSInput, ProjectionPlugin} from '@math.gl/projection/experimental';
import corpus from '../fixtures/upstream-corpus-2.22.0.json';
import corrections from '../fixtures/upstream-corpus-numeric-corrections.json';
import independent from '../fixtures/native-proj-reference.json';
import exceptions from '../fixtures/upstream-corpus-exceptions.json';
import {geographicWKT, projectedJSON, projectedWKT2} from '../fixtures/crs-datums';

const plugins = Object.values(native).filter(
  (value): value is ProjectionPlugin =>
    value && typeof value === 'object' && 'create' in value && typeof value.create === 'function'
);
const datumCatalogs = [datumCatalog, unshiftedStructuredDatums];
const parsers = [native.wktCRSParser, native.projJSONCRSParser];
const rejections = new Map(exceptions.map(entry => [entry.index, entry]));
// Resolve aliases locally so this suite does not modify the upstream global registry.
const aliases: Record<string, string> = corpus.aliases;
function options(to: TypeScriptCRSInput) {
  const wrapped = JSON.stringify(to).match(/\+o_proj=([\w]+)/)?.[1] || 'longlat';
  const plugin = plugins.find(value => value.name === wrapped || value.aliases?.includes(wrapped));
  if (!plugin && !['longlat', 'latlong', 'latlon', 'lonlat'].includes(wrapped))
    throw new Error('Unresolved ob_tran dependency: ' + wrapped);
  return {
    to,
    datumCatalogs,
    aliases,
    projections: [...plugins, native.obliqueTransformation(plugin || 'longlat')],
    parsers
  };
}
function close(actual: readonly number[], expected: readonly number[], tolerance: number) {
  // Upstream's coordinate corpus asserts X/Y only; 3D is covered in crs-datums.spec.ts.
  for (let index = 0; index < 2; index++) {
    expect(Number.isFinite(actual[index])).toBe(true);
    expect(Math.abs(actual[index] - expected[index])).toBeLessThanOrEqual(tolerance);
  }
}
test('Upstream coordinate corpus version, completeness and exception integrity', () => {
  // Upstream's browser ESM entry keeps a literal __VERSION__ placeholder.
  expect(upstreamManifest.version).toBe(corpus.source.version);
  expect(corpus.fixtures).toHaveLength(242);
  expect(corpus.fixtures.map(fixture => fixture.index)).toEqual(
    Array.from({length: 242}, (_, index) => index)
  );
  expect(rejections.size).toBe(exceptions.length);
  expect(new Set(corrections.map(row => row.index)).size).toBe(corrections.length);
  for (const correction of corrections) {
    expect(rejections.has(correction.index)).toBe(false);
    expect(corpus.fixtures[correction.index].sourceLine).toBe(correction.sourceLine);
    expect(independent.cases.some(row => row.id === correction.referenceId)).toBe(true);
  }
  for (const entry of exceptions) {
    expect(corpus.fixtures[entry.index].sourceLine).toBe(entry.sourceLine);
    expect(entry.note.length).toBeGreaterThan(0);
  }
});
for (const fixture of corpus.fixtures) {
  const rejection = rejections.get(fixture.index);
  test(
    'Upstream corpus #' +
      fixture.index +
      ' line ' +
      fixture.sourceLine +
      (rejection ? ' [' + rejection.disposition + ']' : ' forward/inverse'),
    () => {
      const code = fixture.code as TypeScriptCRSInput;
      const referenceCode = typeof code === 'string' ? aliases[code] || code : code;
      const reference = proj4('WGS84', referenceCode as string);
      const forwardTolerance = 10 ** -(fixture.acc?.xy ?? 2);
      const inverseTolerance = 10 ** -(fixture.acc?.ll ?? 6);
      close(reference.forward([...fixture.ll]), fixture.xy, forwardTolerance);
      close(reference.inverse([...fixture.xy]), fixture.ll, inverseTolerance);
      const nativeOptions = options(code);
      if (rejection) {
        // Exact errors keep an unrelated regression from satisfying a known gap.
        // A newly accepted definition fails here until reviewed and numerically tested.
        expect(() => new native.ProjectionEngine(nativeOptions)).toThrowError(
          new native.TypeScriptCRSError('missing-transform-stage', rejection.error)
        );
      } else {
        const projection = new native.ProjectionEngine(nativeOptions);
        const correction = corrections.find(row => row.index === fixture.index);
        if (correction) {
          expect(correction.sourceLine).toBe(fixture.sourceLine);
          const expected = independent.cases.find(row => row.id === correction.referenceId)!
            .results[0];
          expect(expected.input).toEqual(fixture.ll);
          close(projection.project(fixture.ll), expected.forward, 1e-5);
          close(projection.unproject(expected.forward), fixture.ll, 1e-8);
        } else close(projection.project(fixture.ll), fixture.xy, forwardTolerance);
        close(projection.unproject(fixture.xy), fixture.ll, inverseTolerance);
      }
    }
  );
}

test('Geographic base authority IDs take precedence without borrowing other CRS IDs', () => {
  const datum = {
    type: 'GeodeticReferenceFrame' as const,
    name: 'Reseau National Belge 1972',
    ellipsoid: {
      name: 'International 1924',
      semi_major_axis: 6378388,
      inverse_flattening: 297
    }
  };
  const definition = {
    ...projectedJSON,
    base_crs: {name: 'BD72', datum, id: {authority: 'EPSG', code: 4313}}
  };
  const named = [106.869, -52.2978, 103.724, -0.33657, 0.456955, -1.84218, 1];
  const authority = [-106.8686, 52.2978, -103.7239, 0.3366, -0.457, 1.8422, -1.2747];
  expect(native.normalizeCRS(definition, {parsers, datumCatalogs}).datum.towgs84).toEqual(
    authority
  );
  for (const id of [
    undefined,
    {authority: 'EPSG', code: 999999},
    {authority: 'OTHER', code: 4313}
  ]) {
    const withoutBaseID = {
      ...definition,
      id: {authority: 'EPSG', code: 4313},
      base_crs: {
        ...definition.base_crs,
        id,
        datum: {...datum, id: {authority: 'EPSG', code: 4313}}
      }
    };
    expect(native.normalizeCRS(withoutBaseID, {parsers, datumCatalogs}).datum.towgs84).toEqual(
      named
    );
  }
});

test('Explicit WKT Helmert overrides named grids and authority shifts', () => {
  for (const keyword of ['GEOGCS', 'BASEGEOGCRS']) {
    const geographic =
      keyword +
      '["NAD27",DATUM["North_American_Datum_1927",SPHEROID["Clarke 1866",6378206.4,294.9786982138982],TOWGS84[1,2,3]],PRIMEM["Greenwich",0],UNIT["degree",0.017453292519943295],ID["EPSG",4267]]';
    const definition =
      keyword === 'GEOGCS'
        ? 'PROJCS["explicit",' + geographic + ',PROJECTION["Transverse_Mercator"],UNIT["metre",1]]'
        : 'PROJCRS["explicit",' +
          geographic +
          ',CONVERSION["TM",METHOD["Transverse Mercator"]],CS[Cartesian,2],AXIS["E",east],AXIS["N",north],LENGTHUNIT["metre",1]]';
    const normalized = native.normalizeCRS(definition, {
      parsers,
      datumCatalogs
    });
    expect(normalized.datum.towgs84).toEqual([1, 2, 3]);
    expect(normalized.datum.grids).toBeUndefined();
    const projection = new native.ProjectionEngine(options(definition));
    close(
      projection.project([-80, 40]),
      proj4('+proj=tmerc +a=6378206.4 +rf=294.9786982138982 +towgs84=1,2,3').forward([-80, 40]),
      1e-7
    );
  }
});

function polarWKT(latitude: number, method = 'Polar_Stereographic') {
  return (
    'PROJCS["polar",' +
    geographicWKT +
    ',PROJECTION["' +
    method +
    '"],PARAMETER["latitude_of_origin",' +
    latitude +
    ']' +
    (method === 'Azimuthal_Equidistant' ? '' : ',PARAMETER["scale_factor",0.994]') +
    ',UNIT["metre",1]]'
  );
}
test('WKT1 polar origin is true-scale latitude; variant A retains pole scale', () => {
  for (const sign of [-1, 1]) {
    const polar = new native.ProjectionEngine(options(polarWKT(sign * 71)));
    close(polar.project([0, sign * 90]), [0, 0], 1e-8);
    const reference = proj4(
      '+proj=stere +datum=WGS84 +lat_0=' + sign * 90 + ' +lat_ts=' + sign * 71 + ' +k_0=0.994'
    );
    close(polar.project([30, sign * 80]), reference.forward([30, sign * 80]), 1e-7);
    const variantAWKT2 = projectedWKT2
      .replace('Transverse Mercator', 'Polar Stereographic (variant A)')
      .replace('"Latitude of natural origin",0,', '"Latitude of natural origin",' + sign * 90 + ',')
      .replace('"Longitude of natural origin",3,', '"Longitude of natural origin",0,')
      .replace('0.9996', '0.994')
      .replace('500000', '0');
    for (const definition of [
      polarWKT(sign * 90, 'Polar Stereographic (variant A)'),
      variantAWKT2
    ]) {
      const variantA = new native.ProjectionEngine(options(definition));
      close(
        variantA.project([30, sign * 80]),
        proj4('+proj=stere +datum=WGS84 +lat_0=' + sign * 90 + ' +k_0=0.994').forward([
          30,
          sign * 80
        ]),
        1e-7
      );
    }
  }
  const ambiguous = polarWKT(71).replace(
    ',UNIT["metre",1]]',
    ',PARAMETER["standard_parallel_1",70],UNIT["metre",1]]'
  );
  expect(() => new native.ProjectionEngine(options(ambiguous))).toThrow('Duplicate polar');
});

test('Structured pole roundoff tolerance does not accept invalid latitude definitions', () => {
  for (const sign of [-1, 1]) {
    for (const factor of [0.0174532925199433, 0.017453292519943295]) {
      const definition = polarWKT(sign * 90, 'Azimuthal_Equidistant').replace(
        '0.017453292519943295',
        String(factor)
      );
      const projection = new native.ProjectionEngine(options(definition));
      close(projection.project([0, sign * 90]), [0, 0], 1e-8);
    }
    expect(
      () =>
        new native.ProjectionEngine(options(polarWKT(sign * 90.000001, 'Azimuthal_Equidistant')))
    ).toThrow(/latitude/i);
    expect(
      () => new native.ProjectionEngine(options('+proj=aeqd +lat_0=' + sign * 90.00000000000003))
    ).toThrow(/latitude/i);
  }
});
