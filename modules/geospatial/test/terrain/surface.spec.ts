// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {HeightField, TerrainSampleStatus as Status} from '@math.gl/geospatial/terrain';
import {TerrainSurface, createTerrainSurface} from '@math.gl/geospatial/terrain';
import {intersectRayTriangle, getClosestPointOnTriangle} from '@math.gl/geometry/culling';

function plane(): TerrainSurface {
  return new TerrainSurface({
    positions: new Float64Array([0, 0, 0, 2, 0, 4, 2, 2, 10, 0, 2, 6]),
    indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
    origin: [100, 200, 1000],
    heightReference: 'survey'
  });
}

test('surface sampling returns barycentric heights, physical gradients and upward contact normals', () => {
  const surface = plane();
  const sample = surface.sample(101.5, 200.5);
  expect(sample.status).toBe(Status.VALID);
  expect(sample.height).toBe(1004.5);
  expect(sample.gradientX).toBe(2);
  expect(sample.gradientY).toBe(3);
  expect(sample.triangleIndex).toBe(0);
  expect(sample.barycentric).toEqual([0.25, 0.5, 0.25]);
  expect(sample.normalX).toBeCloseTo(-2 / Math.sqrt(14), 14);
  expect(sample.normalY).toBeCloseTo(-3 / Math.sqrt(14), 14);
  expect(sample.normalZ).toBeCloseTo(1 / Math.sqrt(14), 14);
  expect(surface.sample(101, 201).triangleIndex).toBe(0);
  expect(surface.sample(103, 201).status).toBe(Status.NO_DATA);
  expect(surface.sample(NaN, 200).status).toBe(Status.INVALID_INPUT);
  expect(surface.heightReference).toBe('survey');
  expect(surface.activeTriangleCount).toBe(2);
});

test('surface topology preserves original halfedge order and detached ownership', () => {
  const positions = new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]);
  const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
  const validity = new Uint8Array([1, 1]);
  const surface = new TerrainSurface({positions, indices, triangleValidity: validity});
  positions.fill(99);
  indices.fill(0);
  validity.fill(0);
  const topology = surface.copyTopology();
  expect(Array.from(topology.halfedges)).toEqual([-1, -1, 3, 2, -1, -1]);
  expect(Array.from(topology.boundaryHalfedges)).toEqual([0, 1, 4, 5]);
  topology.halfedges.fill(0);
  topology.boundaryHalfedges.fill(0);
  const data = surface.copyData();
  data.positions.fill(88);
  data.indices.fill(0);
  data.triangleValidity.fill(0);
  expect(surface.sample(0.75, 0.25).height).toBe(0);
  expect(surface.copyTopology().halfedges[2]).toBe(3);
  expect(surface.copyData().triangleValidity).toEqual(new Uint8Array([1, 1]));
});

test('skirt exclusion, clockwise winding and overlapping components have explicit semantics', () => {
  const positions = new Float64Array([
    0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 5, 2, 0, 5, 0, 2, 5, 0, 0, -10
  ]);
  const indices = new Uint32Array([0, 2, 1, 3, 4, 5, 0, 1, 6]);
  const surface = new TerrainSurface({
    positions,
    indices,
    triangleValidity: new Uint8Array([1, 1, 0])
  });
  expect(surface.triangleCount).toBe(3);
  expect(surface.activeTriangleCount).toBe(2);
  expect(surface.sample(0.25, 0.25).height).toBe(5);
  expect(surface.sample(0.25, 0.25).triangleIndex).toBe(1);
  expect(surface.intersectRay([0.25, 0.25, -1], [0, 0, 2])?.triangleIndex).toBe(0);
  expect(surface.intersectRay([0.25, 0.25, -1], [0, 0, 2])?.normal).toEqual([0, 0, 1]);
  expect(surface.copyTopology().boundaryHalfedges).toHaveLength(6);
  expect(Array.from(surface.copyTopology().halfedges.slice(6))).toEqual([-1, -1, -1]);
  expect(() => new TerrainSurface({positions, indices})).toThrow('XY projections');
});

test('surface ray, segment and nearest queries use world coordinates and metric distance limits', () => {
  const surface = plane();
  const hit = surface.intersectRay([101, 201, 1020], [0, 0, -10]);
  expect(hit?.point).toEqual([101, 201, 1005]);
  expect(hit?.distance).toBe(15);
  expect(hit?.barycentric).toEqual([0.5, 0, 0.5]);
  expect(surface.intersectRay([101, 201, 1020], [0, 0, -10], {maxDistance: 14.9})).toBeNull();
  expect(surface.intersectRay([101, 201, 1020], [0, 0, -10], {maxDistance: 15})?.distance).toBe(15);
  expect(surface.intersectSegment([101, 201, 1020], [101, 201, 1005])?.distance).toBe(15);
  expect(surface.intersectSegment([101, 201, 1020], [101, 201, 1006])).toBeNull();
  expect(surface.intersectSegment([101, 201, 1005], [101, 201, 1005])).toBeNull();
  const normal = [-2 / Math.sqrt(14), -3 / Math.sqrt(14), 1 / Math.sqrt(14)];
  const query: [number, number, number] = [
    101 + normal[0] * 0.1,
    201 + normal[1] * 0.1,
    1005 + normal[2] * 0.1
  ];
  const nearest = surface.nearest(query)!;
  expect(nearest.distance).toBeCloseTo(0.1, 11);
  nearest.point.forEach((value, axis) => expect(value).toBeCloseTo([101, 201, 1005][axis], 11));
  expect(surface.nearest(query, {maxDistance: 0.05})).toBeNull();
  expect(() => surface.intersectRay([101, 201, 1020], [0, 0, 0])).toThrow();
  expect(() => surface.nearest([Infinity, 0, 0])).toThrow('finite');
  expect(() => surface.nearest([101, 201, 1005], {maxDistance: -1})).toThrow();
  expect(() => surface.intersectSegment([-1e308, 0, 0], [1e308, 0, 0])).toThrow('overflow');
});

test('surface queries agree with exhaustive triangle kernels on an irregular mesh', () => {
  const field = new HeightField({
    width: 5,
    height: 4,
    heights: Float64Array.from({length: 20}, (_, i) => Math.sin(i) * 2)
  });
  const surface = createTerrainSurface(field);
  const data = surface.copyData();
  const triangle = (i: number) =>
    [0, 1, 2].map(j =>
      data.positions.subarray(data.indices[i * 3 + j] * 3, data.indices[i * 3 + j] * 3 + 3)
    );
  for (let i = 0; i < 40; i++) {
    const origin: [number, number, number] = [((i * 0.37) % 5) - 0.5, ((i * 0.61) % 4) - 0.5, 5];
    let closest = Infinity,
      rayDistance = Infinity;
    for (let j = 0; j < surface.triangleCount; j++) {
      const [a, b, c] = triangle(j);
      const point = getClosestPointOnTriangle(origin, a, b, c);
      closest = Math.min(closest, Math.hypot(...origin.map((value, axis) => value - point[axis])));
      const ray = intersectRayTriangle(origin, [0, 0, -1], a, b, c);
      if (ray) rayDistance = Math.min(rayDistance, ray.t);
    }
    expect(surface.nearest(origin)?.distance).toBeCloseTo(closest, 12);
    const hit = surface.intersectRay(origin, [0, 0, -1]);
    if (Number.isFinite(rayDistance)) expect(hit?.distance).toBeCloseTo(rayDistance, 12);
    else expect(hit).toBeNull();
  }
});

test('height-field adapters preserve holes, local origins and both triangulations', () => {
  for (const diagonal of ['00-11', '10-01'] as const)
    for (const rowStep of [
      [-1, 3],
      [-1, -3]
    ] as const) {
      const field = new HeightField({
        width: 3,
        height: 3,
        heights: new Float64Array([0, 2, 4, 3, 9, 1, 6, -2, NaN]),
        origin: [1000, 2000],
        columnStep: [2, 1],
        rowStep,
        diagonal,
        heightReference: 'survey'
      });
      const surface = createTerrainSurface(field, {origin: [1000, 2000, 10]});
      const {positions, indices} = surface.copyData();
      expect(surface.origin).toEqual([1000, 2000, 10]);
      expect(surface.heightReference).toBe('survey');
      for (let i = 0; i < indices.length; i += 3) {
        const p = [0, 1, 2].map(
          axis =>
            (positions[indices[i] * 3 + axis] +
              positions[indices[i + 1] * 3 + axis] +
              positions[indices[i + 2] * 3 + axis]) /
              3 +
            surface.origin[axis]
        );
        const expected = field.sample(p[0], p[1], {interpolation: 'triangle'});
        const actual = surface.sample(p[0], p[1]);
        expect(actual.status).toBe(Status.VALID);
        expect(actual.height).toBeCloseTo(expected.height, 10);
        expect(actual.gradientX).toBeCloseTo(expected.gradientX, 10);
        expect(actual.gradientY).toBeCloseTo(expected.gradientY, 10);
      }
      expect(surface.copyTopology().boundaryHalfedges.length).toBeGreaterThan(0);
    }
});

test('invalid topology and malformed surfaces fail explicitly; empty surfaces are queryable', () => {
  const positions = new Float64Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, -1, 0, 0.5, 2, 0]);
  expect(
    () => new TerrainSurface({positions, indices: new Uint32Array([0, 1, 2, 0, 1, 3])})
  ).toThrow('winding');
  expect(
    () => new TerrainSurface({positions, indices: new Uint32Array([0, 1, 2, 1, 0, 3, 0, 1, 4])})
  ).toThrow('Nonmanifold');
  expect(() => new TerrainSurface({positions, indices: new Uint32Array([0, 1, 99])})).toThrow(
    'bounds'
  );
  expect(() => new TerrainSurface({positions, indices: new Uint32Array([0, 1])})).toThrow(
    'triangle list'
  );
  expect(
    () => new TerrainSurface({positions: new Float32Array([0]), indices: new Uint32Array()})
  ).toThrow('packed');
  expect(
    () =>
      new TerrainSurface({
        positions,
        indices: new Uint32Array([0, 1, 2]),
        triangleValidity: new Uint8Array()
      })
  ).toThrow('validity');
  expect(
    () => new TerrainSurface({positions, indices: new Uint32Array([0, 1, 2]), origin: [0, 0, NaN]})
  ).toThrow('origin');
  const empty = new TerrainSurface({positions: new Float64Array(), indices: new Uint32Array()});
  expect(empty.sample(0, 0).status).toBe(Status.NO_DATA);
  expect(empty.nearest([0, 0, 0])).toBeNull();
  expect(empty.intersectRay([0, 0, 1], [0, 0, -1])).toBeNull();
  expect(empty.copyTopology().halfedges).toHaveLength(0);
});

test('surface numeric failures are explicit and leave no successful sample payload', () => {
  const indices = new Uint32Array([0, 1, 2]);
  expect(
    () => new TerrainSurface({positions: new Float64Array([0, 0, NaN, 1, 0, 0, 0, 1, 0]), indices})
  ).toThrow('finite');
  expect(
    () =>
      new TerrainSurface({
        positions: new Float64Array([0, 0, -1e308, 1, 0, 1e308, 0, 1, 0]),
        indices
      })
  ).toThrow('gradient overflow');
  const source = new Float64Array([0, 0, 1e308, 1, 0, 1e308, 0, 1, 1e308]);
  const surface = new TerrainSurface({positions: source, indices, origin: [0, 0, 1e308]});
  const sample = surface.sample(0.2, 0.2);
  expect(sample.status).toBe(Status.NUMERIC_ERROR);
  expect(sample.gradientStatus).toBe(Status.NUMERIC_ERROR);
  expect(sample.height).toBe(0);
  expect(sample.triangleIndex).toBe(-1);
  expect(sample.barycentric).toEqual([0, 0, 0]);
  expect(() => surface.nearest([0.2, 0.2, 1e308])).toThrow('result overflow');
  const distant = new TerrainSurface({
    positions: new Float64Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
    indices,
    origin: [1e308, 0, 0]
  });
  expect(distant.sample(-1e308, 0).status).toBe(Status.NUMERIC_ERROR);
  expect(() => distant.nearest([-1e308, 0, 0])).toThrow('coordinate overflow');
});
