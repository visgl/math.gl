// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test, expect} from 'vitest';
import {MapEngine, prepareProjectionSurface} from '@math.gl/geospatial/projection';

const usa = () =>
  new MapEngine({version: 1, id: 'usa', radius: 100, definition: {type: 'albers-usa'}});

test('raster surfaces share vertices within charts and retain geographic correspondence', () => {
  const map = usa();
  const mesh = map.prepareSurface({maxAngularStep: 2});
  expect(mesh.positions.length / 3).toBeLessThan(mesh.indices.length / 2);
  expect(new Set(mesh.partIds)).toEqual(new Set([0, 1, 2]));
  expect(mesh.bounds!.every(Number.isFinite)).toBe(true);
  for (let i = 0; i < mesh.positions.length / 3; i++) {
    const region = map.regions[mesh.partIds[i]];
    const point = map.unprojectPoint(
      [mesh.positions[i * 3], mesh.positions[i * 3 + 1]],
      region.id
    )[0];
    expect(point).toBeDefined();
    const longitude = mesh.texCoords[i * 2] * 360 - 180;
    expect(((longitude - point.position[0] + 540) % 360) - 180).toBeCloseTo(0, 4);
    expect(90 - mesh.texCoords[i * 2 + 1] * 180).toBeCloseTo(point.position[1], 4);
  }
  for (let i = 0; i < mesh.indices.length; i += 3) {
    expect(mesh.partIds[mesh.indices[i]]).toBe(mesh.partIds[mesh.indices[i + 1]]);
    expect(mesh.partIds[mesh.indices[i]]).toBe(mesh.partIds[mesh.indices[i + 2]]);
  }
});

test('raster patches outside coverage are empty and invalid budgets reject', () => {
  const map = usa();
  const empty = map.prepareSurface({textureBounds: [0, 0, 10, 10]});
  expect(empty.vertexCount).toBe(0);
  expect(empty.bounds).toBeNull();
  for (const options of [
    {maxVertices: 3},
    {maxVertices: 2.5},
    {maxAngularStep: 0},
    {maxAngularStep: NaN},
    {maxEdgeLength: 0},
    {textureBounds: [10, 0, 0, 10] as const},
    {textureProjection: 'mercator' as const}
  ]) {
    expect(() => map.prepareSurface(options)).toThrow(RangeError);
  }
});

test('ordinary projected surfaces use the same bounded raster sampler', () => {
  const mesh = prepareProjectionSurface(
    {project: p => [p[0] * 1000, p[1] * 1000]},
    {
      extent: [-180, -80, 180, 80],
      scale: 0.001,
      maxAngularStep: 10
    }
  );
  expect(mesh.bounds).toEqual([-180, -80, 180, 80]);
  expect(Math.min(...mesh.texCoords)).toBe(0);
  expect(Math.max(...mesh.texCoords)).toBe(1);
  expect(mesh.positions.every(Number.isFinite)).toBe(true);
  const empty = prepareProjectionSurface(
    {project: () => [NaN, Infinity]},
    {extent: [-10, -10, 10, 10]}
  );
  expect(empty.vertexCount).toBe(0);
  expect(empty.bounds).toBeNull();
});

test('built-in H3 chart maps restore without callbacks and preserve radius scaling', () => {
  const map = new MapEngine({version: 1, id: 'h3', radius: 2, definition: {type: 'h3'}});
  const restored = MapEngine.fromPrepared(map.toPrepared());
  const unit = new MapEngine({version: 1, id: 'unit', definition: {type: 'h3'}});
  expect(map.regions.length).toBe(20);
  for (const position of [
    [-150, 60],
    [0, 0],
    [100, -45]
  ] as const) {
    const a = map.projectPoint(position)!;
    const b = restored.projectPoint(position)!;
    const c = unit.projectPoint(position)!;
    expect(a).toEqual(b);
    expect(a.position[0]).toBeCloseTo(c.position[0] * 2, 12);
    expect(a.position[1]).toBeCloseTo(c.position[1] * 2, 12);
    const inverse = map.unprojectPoint(a.position, a.regionId)[0].position;
    expect(inverse[0]).toBeCloseTo(position[0], 8);
    expect(inverse[1]).toBeCloseTo(position[1], 8);
  }
});
