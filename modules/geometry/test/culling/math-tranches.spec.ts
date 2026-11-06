// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {
  Matrix4,
  mat4PerspectiveProjection,
  mat4OrthographicProjection,
  type Bounds2D
} from '@math.gl/core';
import {
  AxisAlignedBoundingBox,
  BoundingSphere,
  CullingVolume,
  extractFrustumPlanes,
  createEmptyBounds,
  isEmptyBounds,
  boundsContainsPoint,
  boundsContainsBounds,
  boundsIntersect,
  unionBounds,
  intersectBounds,
  expandBoundsByPoint,
  expandBounds,
  clampPointToBounds,
  spheresIntersect,
  boundsIntersectSphere,
  getRayPoint,
  getClosestPointOnRay,
  distanceToRay,
  getClosestPointsRaySegment,
  transformRay,
  getTriangleBarycentric,
  getTriangleArea,
  getTriangleNormal,
  isTriangleFrontFacing,
  triangleContainsPoint,
  interpolateTriangleAttribute,
  intersectPlaneSegment,
  triangleIntersectsBounds,
  Ray
} from '@math.gl/geometry';
import {Vector3} from '@math.gl/core';
const close = (a: ArrayLike<number>, b: ArrayLike<number>, digits = 10) => {
  expect(a.length).toBe(b.length);
  for (let i = 0; i < a.length; i++) expect(a[i]).toBeCloseTo(b[i], digits);
};

it('affine AABB transforms enclose all eight corners and maintain cached fields', () => {
  const matrices = [
    new Matrix4().translate([3, -4, 5]),
    new Matrix4().rotateZ(Math.PI / 4),
    new Matrix4().rotateX(0.7).scale([-2, 3, 4])
  ];
  const shear = new Matrix4();
  shear[4] = 2;
  matrices.push(shear);
  for (const matrix of matrices) {
    const box = new AxisAlignedBoundingBox([-1, -2, -3], [2, 3, 4]).transform(matrix);
    const corners = Array.from({length: 8}, (_, i) =>
      matrix.transformAsPoint([i & 1 ? 2 : -1, i & 2 ? 3 : -2, i & 4 ? 4 : -3])
    );
    for (let j = 0; j < 3; j++) {
      expect(box.minimum[j]).toBeCloseTo(Math.min(...corners.map(c => c[j])), 12);
      expect(box.maximum[j]).toBeCloseTo(Math.max(...corners.map(c => c[j])), 12);
      expect(box.center[j]).toBeCloseTo((box.minimum[j] + box.maximum[j]) / 2, 12);
      expect(box.halfDiagonal[j]).toBeCloseTo((box.maximum[j] - box.minimum[j]) / 2, 12);
    }
  }
  const box = new AxisAlignedBoundingBox([-1, -1, -1], [1, 1, 1]),
    before = box.clone();
  expect(() => box.transform(new Matrix4().perspective({fovy: 1}))).toThrow();
  expect(box.equals(before)).toBe(true);
  expect(() =>
    new AxisAlignedBoundingBox([1, 1, 1], [-1, -1, -1]).transform(new Matrix4())
  ).toThrow();
});

it('bounds distinguish empty, point, touching and disjoint sets with alias-safe outputs', () => {
  const empty = createEmptyBounds(2),
    a: Bounds2D = [
      [0, 0],
      [1, 1]
    ],
    b: Bounds2D = [
      [1, 1],
      [2, 2]
    ];
  expect(isEmptyBounds(empty)).toBe(true);
  expect(
    isEmptyBounds([
      [0, 0],
      [0, 0]
    ])
  ).toBe(false);
  expect(boundsContainsBounds(a, empty)).toBe(true);
  expect(boundsContainsBounds(empty, a)).toBe(false);
  expect(boundsContainsPoint(a, [1, 1])).toBe(true);
  expect(boundsContainsPoint(a, [2, 1])).toBe(false);
  expect(boundsIntersect(a, b)).toBe(true);
  expect(boundsIntersect(a, empty)).toBe(false);
  expect(intersectBounds(a, b)).toEqual([
    [1, 1],
    [1, 1]
  ]);
  expect(unionBounds(a, empty)).toEqual(a);
  expect(unionBounds(a, b, a)).toBe(a);
  expect(a).toEqual([
    [0, 0],
    [2, 2]
  ]);
  expect(expandBoundsByPoint(empty, [-1, 4], empty)).toBe(empty);
  expect(empty).toEqual([
    [-1, 4],
    [-1, 4]
  ]);
  expect(expandBounds(a, 1)).toEqual([
    [-1, -1],
    [3, 3]
  ]);
  expect(isEmptyBounds(expandBounds(a, -2))).toBe(true);
  expect(
    isEmptyBounds(
      intersectBounds(a, [
        [4, 4],
        [5, 5]
      ])
    )
  ).toBe(true);
  const point = [-1, 3];
  expect(clampPointToBounds(a, point, point)).toBe(point);
  expect(point).toEqual([0, 2]);
  expect(clampPointToBounds(createEmptyBounds(3), [1, 2, 3])).toBeNull();
  expect(spheresIntersect([0, 0, 0], 1, [2, 0, 0], 1)).toBe(true);
  expect(spheresIntersect([0, 0, 0], 1, [3, 0, 0], 1)).toBe(false);
  expect(
    boundsIntersectSphere(
      [
        [0, 0, 0],
        [1, 1, 1]
      ],
      [2, 1, 1],
      1
    )
  ).toBe(true);
  expect(boundsIntersectSphere(createEmptyBounds(3), [0, 0, 0], 1)).toBe(false);
  expect(() => boundsIntersect(a, createEmptyBounds(3))).toThrow();
  expect(() => boundsContainsPoint(a, [NaN, 0])).toThrow();
  expect(() => clampPointToBounds(a, [0, 0], [])).toThrow();
  expect(() => spheresIntersect([0, 0, 0], -1, [0, 0, 0], 1)).toThrow();
});

it('frusta agree with clip inequalities for depth ranges, reverse depth and moved cameras', () => {
  for (const depthRange of ['negative-one-to-one', 'zero-to-one'] as const)
    for (const reversedDepth of [false, true]) {
      const options = {depthRange, reversedDepth},
        view = new Matrix4().lookAt({eye: [3, 2, 6], center: [0, 0, 0], up: [0, 1, 0]});
      for (const projection of [
        mat4PerspectiveProjection(new Array(16), {
          ...options,
          fovy: 1,
          aspect: 1.5,
          near: 0.5,
          far: 20
        }),
        mat4OrthographicProjection(new Array(16), {
          ...options,
          left: -3,
          right: 3,
          bottom: -2,
          top: 2,
          near: 0.5,
          far: 20
        })
      ]) {
        const matrix = new Matrix4(projection).multiplyRight(view),
          volume = new CullingVolume().fromViewProjection(matrix, options);
        expect(volume.planes).toHaveLength(6);
        for (let x = -10; x <= 10; x += 2)
          for (let y = -4; y <= 4; y += 2)
            for (const z of [-12, 0, 8]) {
              const clip = matrix.transform([x, y, z, 1]),
                low = depthRange === 'zero-to-one' ? 0 : -clip[3];
              const inside =
                clip[0] >= -clip[3] &&
                clip[0] <= clip[3] &&
                clip[1] >= -clip[3] &&
                clip[1] <= clip[3] &&
                clip[2] >= low &&
                clip[2] <= clip[3];
              expect(volume.computeVisibility(new BoundingSphere([x, y, z], 0)) !== 'outside').toBe(
                inside
              );
            }
      }
      const infinite = mat4PerspectiveProjection(new Array(16), {
        ...options,
        fovy: 1,
        aspect: 1,
        near: 1,
        far: Infinity
      });
      expect(extractFrustumPlanes(infinite, options)).toHaveLength(5);
    }
  expect(() => extractFrustumPlanes(new Array(16).fill(0))).toThrow();
  expect(() => extractFrustumPlanes([1])).toThrow();
});

it('ray helpers respect ray domain, direction scale and transform parameterization', () => {
  close(getRayPoint([1, 0, 0], [2, 0, 0], 3), [7, 0, 0]);
  close(getClosestPointOnRay([-1, 2, 0], [0, 0, 0], [2, 0, 0]), [0, 0, 0]);
  expect(distanceToRay([2, 3, 0], [0, 0, 0], [2, 0, 0])).toBe(3);
  const hit = getClosestPointsRaySegment([0, 0, 0], [2, 0, 0], [2, -1, 0], [2, 1, 0]);
  expect(hit.distance).toBe(0);
  expect(hit.rayParameter).toBe(1);
  expect(hit.segmentFraction).toBe(0.5);
  const behind = getClosestPointsRaySegment([0, 0, 0], [1, 0, 0], [-2, 0, 0], [-1, 0, 0]);
  expect(behind.distance).toBe(1);
  expect(behind.rayParameter).toBe(0);
  expect(getClosestPointsRaySegment([0, 0, 0], [1, 0, 0], [1, 2, 0], [1, 2, 0]).distance).toBe(2);
  const matrix = new Matrix4().translate([1, 2, 3]).rotateZ(0.5).scale([2, 3, 4]);
  const ray = transformRay([1, 2, 3], [2, 0, 0], matrix);
  close(
    getRayPoint(ray.origin, ray.direction, 2),
    matrix.transformAsPoint(getRayPoint([1, 2, 3], [2, 0, 0], 2))
  );
  const object = new Ray(new Vector3(), new Vector3(1, 0, 0));
  close(object.at(2), [2, 0, 0]);
  close(object.closestPointTo([2, 3, 0]), [2, 0, 0]);
  expect(object.distanceTo([2, 3, 0])).toBe(3);
  object.transform(matrix);
  expect(object.direction.len()).toBeCloseTo(1, 12);
  expect(() => getRayPoint([0, 0, 0], [0, 0, 0], 1)).toThrow();
  expect(() => getRayPoint([0, 0, 0], [1, 0, 0], -1)).toThrow();
  expect(() => transformRay([0, 0, 0], [1, 0, 0], new Matrix4().scale(0))).toThrow();
});

it('triangle queries handle winding, attributes, projection and degeneracies across scales', () => {
  for (const scale of [1e-8, 1, 1e8]) {
    const a = [0, 0, 0],
      b = [scale, 0, 0],
      c = [0, scale, 0],
      p = [scale / 4, scale / 4, 0];
    close(getTriangleBarycentric(p, a, b, c)!, [0.5, 0.25, 0.25]);
    close(getTriangleNormal(a, b, c), [0, 0, 1]);
    expect(getTriangleArea(a, b, c) / (scale * scale)).toBeCloseTo(0.5, 12);
    expect(triangleContainsPoint(p, a, b, c)).toBe(true);
    expect(triangleContainsPoint([scale / 4, scale / 4, scale], a, b, c)).toBe(false);
    expect(triangleContainsPoint([scale, scale, 0], a, b, c)).toBe(false);
    expect(isTriangleFrontFacing(a, b, c, [0, 0, -1])).toBe(true);
    expect(isTriangleFrontFacing(a, c, b, [0, 0, -1])).toBe(false);
  }
  expect(getTriangleBarycentric([0, 0, 0], [0, 0, 0], [1, 0, 0], [2, 0, 0])).toBeNull();
  close(getTriangleNormal([0, 0, 0], [0, 0, 0], [0, 0, 0]), [0, 0, 0]);
  close(interpolateTriangleAttribute([0.5, 0.25, 0.25], [0, 0], [1, 0], [0, 1]), [0.25, 0.25]);
  expect(() => interpolateTriangleAttribute([1, 0, 0], [1], [1, 2], [1])).toThrow();
});

it('plane/segment and triangle/box queries include boundaries and degenerate triangles', () => {
  close(intersectPlaneSegment([0, 0, 2], -2, [0, 0, 0], [0, 0, 2])!, [0, 0, 1]);
  close(intersectPlaneSegment([0, 0, 1], 0, [1, 2, 0], [3, 4, 0])!, [1, 2, 0]);
  expect(intersectPlaneSegment([0, 0, 1], 0, [0, 0, 1], [0, 0, 2])).toBeNull();
  const min = [-1, -1, -1],
    max = [1, 1, 1];
  expect(triangleIntersectsBounds([-2, -2, 0], [2, -2, 0], [0, 2, 0], min, max)).toBe(true);
  expect(triangleIntersectsBounds([2, 2, 0], [3, 2, 0], [2, 3, 0], min, max)).toBe(false);
  expect(triangleIntersectsBounds([1, 1, 1], [1, 1, 1], [1, 1, 1], min, max)).toBe(true);
  expect(triangleIntersectsBounds([-2, 0, 0], [2, 0, 0], [0, 0, 0], min, max)).toBe(true);
  expect(triangleIntersectsBounds([2, 2, 0], [3, 3, 0], [4, 4, 0], min, max)).toBe(false);
});

it('ray distance queries are invariant to very small and large direction scales', () => {
  for (const scale of [1e-200, 1, 1e200]) {
    close(getClosestPointOnRay([2, 3, 0], [0, 0, 0], [scale, 0, 0]), [2, 0, 0]);
    expect(distanceToRay([2, 3, 0], [0, 0, 0], [scale, 0, 0])).toBe(3);
    const hit = getClosestPointsRaySegment([0, 0, 0], [scale, 0, 0], [2, -1, 0], [2, 1, 0]);
    expect(hit.distance).toBeCloseTo(0, 12);
    expect(hit.rayParameter * scale).toBeCloseTo(2, 12);
    expect(hit.segmentFraction).toBeCloseTo(0.5, 12);
  }
});

it('bounds outputs need capacity but do not require initialized values', () => {
  const out: Bounds2D = [
    [NaN, NaN],
    [NaN, NaN]
  ];
  expect(
    unionBounds(
      [
        [0, 0],
        [1, 1]
      ],
      [
        [1, 1],
        [2, 2]
      ],
      out
    )
  ).toBe(out);
  expect(out).toEqual([
    [0, 0],
    [2, 2]
  ]);
  expect(() => unionBounds(out, out, createEmptyBounds(3))).toThrow();
  expect(() =>
    isEmptyBounds([
      [Infinity, Infinity],
      [Infinity, Infinity]
    ])
  ).toThrow();
});

it('Ray.transform keeps normalized distance semantics at extreme finite scales', () => {
  for (const scale of [1e-200, 1e200]) {
    const ray = new Ray(new Vector3(), new Vector3(1, 1, 1));
    ray.transform(new Matrix4().scale(scale));
    expect(Math.hypot(...ray.direction)).toBeCloseTo(1, 12);
    expect(Math.hypot(...ray.at(2))).toBeCloseTo(2, 12);
  }
});

it('nearly parallel ray and segment crossings retain the interior closest pair', () => {
  for (const scale of [1e-9, 1, 1e9]) {
    const hit = getClosestPointsRaySegment(
      [0, 0, 0],
      [2, 0, 0],
      [scale, scale, 0],
      [1e9 * scale, -scale, 0]
    );
    expect(hit.distance / scale).toBeLessThan(1e-6);
    expect(hit.segmentFraction).toBeCloseTo(0.5, 12);
    expect(hit.rayParameter / scale).toBeCloseTo(250000000.25, 5);
  }
});
