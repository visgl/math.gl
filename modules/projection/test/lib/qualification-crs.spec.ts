// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original independent PROJ tests of the proj4js-inspired CRS/datum API.
import {expect, test} from 'vitest';
import {datumCatalog} from '@math.gl/projection/datums';
import {unshiftedStructuredDatums} from '../fixtures/unshifted-structured-datums';
import * as native from '@math.gl/projection/experimental';
import structured from '../fixtures/structured-proj-reference.json';
import datumInputs from '../fixtures/datum-proj-cases.json';
import datums from '../fixtures/datum-proj-reference.json';
const projections = Object.values(native).filter((value): value is native.ProjectionPlugin =>
  Boolean(value && typeof value === 'object' && 'create' in value)
);
const datumCatalogs = [datumCatalog, unshiftedStructuredDatums];
const parsers = [native.wktCRSParser, native.projJSONCRSParser];
function close(actual: ArrayLike<number>, expected: number[], angular = false): void {
  expect(actual.length).toBe(expected.length);
  expected.forEach((value, index) =>
    expect(
      Math.abs(actual[index] - value),
      JSON.stringify({actual: Array.from(actual), expected, index})
    ).toBeLessThanOrEqual(angular && index < 2 ? 1e-7 : 0.001)
  );
}
for (const fixture of structured.cases) {
  for (const format of ['wkt2', 'wkt1', 'esri', 'projjson'] as const) {
    test('independent structured conversion ' + fixture.id + ' / ' + format, () => {
      const definition = fixture[format];
      const projection = new native.ProjectionTransform({
        datumCatalogs,
        from: '+proj=longlat +datum=none',
        to: definition as native.TypeScriptCRSInput,
        projections,
        parsers
      });
      for (const row of fixture.results) {
        close(projection.project(row.input), row.forward);
        close(projection.unproject(row.forward), row.inverse, true);
        const batch = new Float64Array([...row.input, 123, 7]);
        projection.projectFlat(batch, 4);
        close(batch, [...row.forward, 123, 7]);
        batch.set([...row.forward, 123, 7]);
        projection.unprojectFlat(batch, 4);
        close(batch, [...row.inverse, 123, 7], true);
      }
    });
  }
}
for (const [index, fixture] of datumInputs.cases.entries()) {
  test('independent 3D datum chain ' + fixture.id, () => {
    expect(datums.cases[index].id).toBe(fixture.id);
    const projection = new native.ProjectionTransform({
      datumCatalogs,
      from: fixture.fromCRS,
      to: fixture.toCRS
    });
    for (const row of datums.cases[index].results) {
      close(projection.project(row.input), row.forward, true);
      close(projection.unproject(row.forward), row.inverse, true);
      const forward = new Float64Array([...row.input, 7]);
      const inverse = new Float64Array([...row.forward, 7]);
      projection.projectFlat(forward, 4);
      projection.unprojectFlat(inverse, 4);
      close(forward, [...row.forward, 7], true);
      close(inverse, [...row.inverse, 7], true);
    }
  });
}

test('ESRI Krovak accepts only the complete supported axis adjustment', () => {
  const definition = structured.cases.find(row => row.id === 'EPSG:5514')!.esri;
  for (const invalid of [
    definition.replace('"X_Scale",-1.0', '"X_Scale",1.0'),
    definition.replace(',PARAMETER["Y_Scale",1.0]', ''),
    definition.replace('PARAMETER["X_Scale",-1.0]', value => value + ',' + value),
    definition.replace('"XY_Plane_Rotation",90.0', '"XY_Plane_Rotation",45.0'),
    definition.replace('PROJECTION["Krovak"]', 'PROJECTION["Transverse_Mercator"]')
  ]) {
    expect(
      () =>
        new native.ProjectionTransform({
          datumCatalogs,
          to: invalid,
          projections,
          parsers
        })
    ).toThrow('ESRI Krovak axis adjustment');
  }
});

test('Cassini exact poles and nonconvergent inverse fail observably', () => {
  const projection = new native.ProjectionTransform({
    datumCatalogs,
    to: '+proj=cass +lon_0=10 +lat_0=40 +ellps=WGS84',
    projections
  });
  for (const latitude of [-90, 90]) {
    close(projection.unproject(projection.project([10, latitude])), [10, latitude], true);
  }
  expect(() => projection.unproject([1e12, 1e12])).toThrow();
});
