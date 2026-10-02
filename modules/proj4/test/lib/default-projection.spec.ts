// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {Projection, Proj4Projection, ProjectionEngine} from '@math.gl/proj4';
import {Proj4Projection as ClassicProjection} from '@math.gl/proj4/classic';
import {makeNTv2} from '../fixtures/datum-grids';
import structured from '../fixtures/structured-proj-reference.json';

function close(actual: number[], expected: number[], tolerance = 1e-7): void {
  expect(actual.length).toBe(expected.length);
  expected.forEach((value, i) =>
    expect(Math.abs(actual[i] - value)).toBeLessThanOrEqual(tolerance)
  );
}

for (const Wrapper of [Projection, ClassicProjection]) {
  const backend = Wrapper === Projection ? 'TypeScript' : 'classic';
  test(backend + ' wrapper keeps defaults, bound methods and array ownership', () => {
    const projection = new Wrapper({});
    const input = [12, 45, 123, 7];
    const project = projection.project,
      unproject = projection.unproject;
    close(project(input), input);
    expect(project(input)).not.toBe(input);
    close(unproject(input), input);
    expect(input).toEqual([12, 45, 123, 7]);
    close(
      new Wrapper({to: 'EPSG:3857'}).project([12, 45]),
      [1335833.8895192828, 5621521.486192066],
      1e-6
    );
    close(
      new Wrapper({from: 'EPSG:3857'}).project([1335833.8895192828, 5621521.486192066]),
      [12, 45]
    );
  });
  test(backend + ' wrapper registers aliases and honors enforceAxis', () => {
    Wrapper.defineProjectionAliases({'DEFAULT:UTM': '+proj=utm +zone=31 +datum=WGS84'});
    const projection = new Wrapper({to: 'DEFAULT:UTM'});
    close(projection.project([3, 0]), [500000, 0]);
    Wrapper.defineProjectionAliases({'DEFAULT:UTM': '+proj=utm +zone=32 +datum=WGS84'});
    close(projection.project([3, 0]), [500000, 0]);
    close(new Wrapper({to: 'DEFAULT:UTM'}).project([9, 0]), [500000, 0]);
    const axis = new Wrapper({from: '+proj=longlat +datum=WGS84 +axis=neu', enforceAxis: true});
    close(axis.project([45, 12]), [12, 45]);
    close(axis.unproject([12, 45]), [45, 12]);
  });
  test(backend + ' wrapper reads WKT and PROJJSON without configuration', () => {
    const fixture = structured.cases.find(row => row.id === 'EPSG:32631')!;
    for (const to of [fixture.wkt1, fixture.wkt2, fixture.esri, fixture.projjson]) {
      const projection = new Wrapper({to: to as ConstructorParameters<typeof Wrapper>[0]['to']});
      const row = fixture.results[0];
      close(projection.project(row.input), row.forward, 1e-4);
      close(projection.unproject(row.forward), row.inverse);
    }
  });
  for (const includeErrorFields of [true, false]) {
    test(backend + ' wrapper registers NTv2 grids, errors=' + includeErrorFields, () => {
      const grid = makeNTv2([{shift: () => [2, 1]}], true, includeErrorFields);
      Wrapper.registerDatumGrid('default-grid', grid, {includeErrorFields});
      const p = new Wrapper({from: '+proj=longlat +ellps=WGS84 +nadgrids=default-grid'});
      const input = [-1, 1];
      close(p.project(input), [-1 - 2 / 3600, 1 + 1 / 3600]);
      close(p.unproject(p.project(input)), input);
    });
  }
}

test('default wrapper uses the math.gl engine and keeps its registries separate from classic and core', () => {
  expect(new Projection({})).toBeInstanceOf(ProjectionEngine);
  Projection.defineProjectionAliases({'BACKEND:ONLY': '+proj=utm +zone=31 +datum=WGS84'});
  expect(() => new ClassicProjection({to: 'BACKEND:ONLY'})).toThrow();
  expect(() => new ProjectionEngine({to: 'BACKEND:ONLY'})).toThrow();
  expect(() => new ProjectionEngine({to: 'EPSG:3857'})).toThrow('not registered');
  const p = new Projection({to: 'EPSG:3857'});
  const input = new Float64Array([12, 45, 123, 7]);
  const expected = p.project(Array.from(input));
  expect(p.projectFlat(input, 4)).toBe(input);
  close(Array.from(input), expected);
});

test('default wrapper resolves both oblique projection dependencies independently', () => {
  const from = '+proj=ob_tran +o_proj=merc +o_lat_p=45 +o_lon_p=0 +datum=WGS84';
  const to = '+proj=ob_tran +o_proj=eqearth +o_lat_p=30 +o_lon_p=20 +datum=WGS84';
  const p = new Projection({from, to});
  const source = new Projection({to: from}).project([12, 45]);
  const expected = new Projection({to}).project([12, 45]);
  // This composes iterative kernels; independent fixtures test their accuracy separately.
  close(p.project(source), expected, 0.01);
  close(p.unproject(expected), source, 0.01);
  for (const definition of [
    '+proj=ob_tran +o_lat_p=45 +o_lon_p=0',
    '+proj=ob_tran +o_proj=unknown +o_lat_p=45 +o_lon_p=0',
    '+proj=ob_tran +o_proj=geocent +o_lat_p=45 +o_lon_p=0',
    '+proj=ob_tran +o_proj=longlat +o_lat_p=45 +o_lon_p=0 +zone=31'
  ])
    expect(() => new Projection({to: definition})).toThrow();
});

test('deprecated Proj4Projection is the same constructor and shares static registrations', () => {
  expect(Proj4Projection).toBe(Projection);
  const legacy: Proj4Projection = new Projection({to: 'EPSG:3857'});
  expect(legacy).toBeInstanceOf(Proj4Projection);
  expect(new Proj4Projection({})).toBeInstanceOf(Projection);
  Proj4Projection.defineProjectionAliases({'ALIAS:NEW': '+proj=utm +zone=31 +datum=WGS84'});
  close(new Projection({to: 'ALIAS:NEW'}).project([3, 0]), [500000, 0]);
  Projection.defineProjectionAliases({'ALIAS:OLD': '+proj=utm +zone=32 +datum=WGS84'});
  close(new Proj4Projection({to: 'ALIAS:OLD'}).project([9, 0]), [500000, 0]);
});
