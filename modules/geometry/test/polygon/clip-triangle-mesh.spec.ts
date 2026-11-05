// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {clipTriangleMesh, earcut, interpolatePackedAttributes} from '@math.gl/geometry';
import type {MeshClipRegion, ClipTriangleMeshOptions} from '@math.gl/geometry';
const square: MeshClipRegion = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1]
];
const mesh = {positions: [-1, 0, 2, 0, 0, 2], indices: [0, 1, 2]};
function area(result: ReturnType<typeof clipTriangleMesh>) {
  let sum = 0;
  for (let i = 0; i < result.indices.length; i += 3) {
    const [a, b, c] = Array.from(result.indices.slice(i, i + 3), n => [
      result.positions[2 * n],
      result.positions[2 * n + 1]
    ]);
    sum += ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2;
  }
  return sum;
}
test('clip mesh preserves area, winding and interpolates packed attributes', () => {
  const result = clipTriangleMesh(mesh, {regions: [square]});
  expect(area(result)).toBeCloseTo(1);
  expect(area(clipTriangleMesh({...mesh, indices: [2, 1, 0]}, {regions: [square]}))).toBeCloseTo(
    -1
  );
  expect(area(clipTriangleMesh(mesh, {regions: [[...square].reverse()]}))).toBeCloseTo(1);
  const source = new Float64Array([0, 0, 3, 0, 1, 2]);
  const output = interpolatePackedAttributes(new Uint8Array(source.buffer), result, {
    byteStride: 16,
    attributes: [{type: 'float64', size: 2, byteOffset: 0, interpolation: 'linear'}]
  });
  const uv = new Float64Array(output.buffer);
  for (let i = 0; i < uv.length; i += 2) {
    expect(uv[i]).toBeCloseTo(result.positions[i] + 1);
    expect(uv[i + 1]).toBeCloseTo(result.positions[i + 1]);
    expect(
      result.sourceVertexWeights.slice((i / 2) * 3, (i / 2) * 3 + 3).reduce((a, b) => a + b)
    ).toBeCloseTo(1);
  }
  expect(Array.from(result.sourceTriangleIndices).every(i => i === 0)).toBe(true);
});
test('clip mesh retains Z and categorical provenance without welding', () => {
  const result = clipTriangleMesh(
    {positions: [-1, 0, 1, 2, 0, 4, 0, 2, 2], indices: [0, 1, 2]},
    {regions: [square], size: 3}
  );
  for (let i = 0; i < result.positions.length; i += 3)
    expect(result.positions[i + 2]).toBeCloseTo(result.positions[i] + 2);
  expect(result.positions.length / 3).toBe(result.indices.length);
  const bytes = new Uint8Array([7, 7, 7]);
  expect(
    Array.from(
      interpolatePackedAttributes(bytes, result, {
        byteStride: 1,
        attributes: [{type: 'uint8', size: 1, byteOffset: 0, interpolation: 'flat'}]
      })
    ).every(v => v === 7)
  ).toBe(true);
});
test('clip mesh splits a rotated periodic seam and reports copies', () => {
  const result = clipTriangleMesh(
    {positions: [170, -10, 190, 0, 175, 10], indices: [0, 1, 2]},
    {
      regions: [
        [
          [-180, -90],
          [180, -90],
          [180, 90],
          [-180, 90]
        ]
      ],
      periodic: {axis: 0, minimum: -180, period: 360}
    }
  );
  expect(new Set(result.periodicCopies)).toEqual(new Set([-1, 0]));
  expect(area(result)).toBeCloseTo(175);
  for (let i = 0; i < result.positions.length; i += 2)
    expect(Math.abs(result.positions[i])).toBeLessThanOrEqual(180);
  const vertical = clipTriangleMesh(
    {positions: [0, 170, 10, 190, -10, 175], indices: [0, 1, 2]},
    {
      regions: [
        [
          [-90, -180],
          [90, -180],
          [90, 180],
          [-90, 180]
        ]
      ],
      periodic: {axis: 1, minimum: -180, period: 360}
    }
  );
  expect(new Set(vertical.periodicCopies)).toEqual(new Set([-1, 0]));
});
test('clip mesh supports holes and disconnected lobes through disjoint triangulated regions', () => {
  const coordinates = [0, 0, 4, 0, 4, 4, 0, 4, 1, 1, 1, 3, 3, 3, 3, 1];
  const triangles = earcut(coordinates, [4], 2);
  const regions: MeshClipRegion[] = [];
  for (let i = 0; i < triangles.length; i += 3)
    regions.push(triangles.slice(i, i + 3).map(n => [coordinates[n * 2], coordinates[n * 2 + 1]]));
  regions.push([
    [10, 0],
    [11, 0],
    [11, 1],
    [10, 1]
  ]);
  const result = clipTriangleMesh(
    {positions: [-20, -20, 50, -20, -20, 50], indices: [0, 1, 2]},
    {regions}
  );
  expect(area(result)).toBeCloseTo(13);
  for (let i = 0; i < result.indices.length; i += 3) {
    const ids = result.indices.slice(i, i + 3);
    const x = ids.reduce((s, n) => s + result.positions[n * 2], 0) / 3;
    const y = ids.reduce((s, n) => s + result.positions[n * 2 + 1], 0) / 3;
    expect(x > 1 && x < 3 && y > 1 && y < 3).toBe(false);
  }
});
test('clip mesh handles empty, disjoint, degenerate, and full-world meshes', () => {
  expect(clipTriangleMesh(mesh, {regions: []}).indices.length).toBe(0);
  expect(clipTriangleMesh({positions: [], indices: []}, {regions: [square]}).indices.length).toBe(
    0
  );
  expect(
    clipTriangleMesh({positions: [10, 10, 11, 10, 10, 11], indices: [0, 1, 2]}, {regions: [square]})
      .indices.length
  ).toBe(0);
  expect(
    clipTriangleMesh({positions: [0, 0, 1, 0, 2, 0], indices: [0, 1, 2]}, {regions: [square]})
      .indices.length
  ).toBe(0);
  const world = clipTriangleMesh(
    {positions: [-180, -90, 180, -90, 180, 90, -180, 90], indices: [0, 1, 2, 0, 2, 3]},
    {
      regions: [
        [
          [-180, -90],
          [180, -90],
          [180, 90],
          [-180, 90]
        ]
      ],
      periodic: {axis: 0, minimum: -180, period: 360}
    }
  );
  expect(area(world)).toBeCloseTo(360 * 180);
});
test('clip mesh rejects invalid geometry and stops at resource limits', () => {
  for (const opts of [
    {size: 4},
    {maxVertices: -1},
    {maxVertices: 2},
    {maxTriangles: 0},
    {maxIntersections: 0},
    {maxVertices: 2 ** 32},
    {periodic: {axis: 3, minimum: 0, period: 1}},
    {periodic: {axis: 0, minimum: 0, period: 0}},
    {periodic: {axis: 0, minimum: 1e30, period: 1}},
    {periodic: {axis: 0, minimum: 0, period: 0.5}}
  ]) {
    expect(() =>
      clipTriangleMesh(mesh, {regions: [square], ...opts} as ClipTriangleMeshOptions)
    ).toThrow(RangeError);
  }
  for (const positions of [
    [NaN, 0, 1, 0, 0, 1],
    [0, 0, 1]
  ])
    expect(() => clipTriangleMesh({positions, indices: [0, 1, 2]}, {regions: [square]})).toThrow(
      RangeError
    );
  for (const indices of [
    [-1, 1, 2],
    [0, 1, 99],
    [0, 1]
  ])
    expect(() => clipTriangleMesh({...mesh, indices}, {regions: [square]})).toThrow(RangeError);
  for (const region of [
    [],
    [
      [0, 0],
      [1, 1],
      [2, 2]
    ],
    [
      [0, 0],
      [2, 0],
      [1, 0.5],
      [2, 2],
      [0, 2]
    ],
    [
      [0, 0],
      [1, 0],
      [1, 0],
      [0, 1]
    ],
    [
      [0, 0],
      [Infinity, 0],
      [0, 1]
    ]
  ])
    expect(() => clipTriangleMesh(mesh, {regions: [region as MeshClipRegion]})).toThrow(RangeError);
  expect(() =>
    clipTriangleMesh(
      {positions: [1e20, 0, 1e20, 1, 1e20, 2], indices: [0, 1, 2]},
      {regions: [square], periodic: {axis: 0, minimum: 0, period: 1}}
    )
  ).toThrow(RangeError);
});

test('clip mesh rejects overflowing region arithmetic and sparse inputs', () => {
  expect(() =>
    clipTriangleMesh(mesh, {
      regions: [
        [
          [1e308, 0],
          [-1e308, 0],
          [0, 1e308]
        ]
      ]
    })
  ).toThrow(RangeError);
  expect(() => clipTriangleMesh(mesh, {regions: [new Array(3)]})).toThrow(RangeError);
  expect(() =>
    clipTriangleMesh({positions: new Array(6), indices: [0, 1, 2]}, {regions: [square]})
  ).toThrow(RangeError);
});
