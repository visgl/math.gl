// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Matrix4, Vector3} from '@math.gl/core';
import {
  BoxShape,
  CapsuleShape,
  CullingVolume,
  CylinderShape,
  INTERSECTION,
  Plane,
  PlaneShape,
  Ray,
  SphereShape
} from '@math.gl/culling';

test('glTF shapes use the specification defaults', () => {
  const box = new BoxShape();
  const capsule = new CapsuleShape();
  const cylinder = new CylinderShape();
  const plane = new PlaneShape();
  const sphere = new SphereShape();
  expect(box.size).toEqual([1, 1, 1]);
  expect(capsule.height).toBe(1);
  expect(capsule.radiusBottom).toBe(0.5);
  expect(cylinder.height).toBe(2);
  expect(cylinder.radiusTop).toBe(0.5);
  expect(plane.sizeX).toBeUndefined();
  expect(sphere.radius).toBe(0.5);
});

test('shape containment and distance follow analytic surfaces', () => {
  expect(new BoxShape().containsPoint([0.5, 0, 0])).toBe(true);
  expect(new BoxShape().distanceTo([1.5, 0, 0])).toBe(1);
  expect(new SphereShape().containsPoint([0, 0.5, 0])).toBe(true);
  expect(new SphereShape().distanceTo([0, 2, 0])).toBe(1.5);
  expect(new CylinderShape({radiusBottom: 1, radiusTop: 0}).containsPoint([0.5, -0.5, 0])).toBe(
    true
  );
  expect(new CylinderShape({radiusBottom: 1, radiusTop: 0}).containsPoint([0.75, 0.5, 0])).toBe(
    false
  );
  expect(new CapsuleShape({radiusBottom: 0.25, radiusTop: 0.75}).containsPoint([0, 1.2, 0])).toBe(
    true
  );
  expect(new CapsuleShape().distanceTo([1.5, 0, 0])).toBe(1);
  expect(new PlaneShape().containsPoint([100, -1, 100]), 'negative Y half-space is inside').toBe(
    true
  );
  expect(new PlaneShape().containsPoint([0, 0.1, 0])).toBe(false);
});

test('shape ray intersections return nearest forward hits and normals', () => {
  const sphereHit = new SphereShape().intersectRay(
    new Ray(new Vector3(0, 0, -2), new Vector3(0, 0, 1))
  );
  expect(sphereHit).toBeTruthy();
  expect(sphereHit?.distance).toBe(1.5);
  expect(sphereHit && Array.from(sphereHit.normal)).toEqual([0, 0, -1]);
  expect(sphereHit?.entering).toBe(true);
  const exitHit = new BoxShape().intersectRay(new Ray(new Vector3(0, 0, 0), new Vector3(1, 0, 0)));
  expect(exitHit?.distance).toBe(0.5);
  expect(exitHit?.entering).toBe(false);
  const finitePlane = new PlaneShape({sizeX: 1, sizeZ: 1});
  expect(
    finitePlane.intersectRay(new Ray(new Vector3(0, 1, 0), new Vector3(0, -1, 0)))
  ).toBeTruthy();
  expect(
    finitePlane.intersectRay(new Ray(new Vector3(2, 1, 0), new Vector3(0, -1, 0)))
  ).toBeUndefined();
  const partiallyInfinitePlane = new PlaneShape({sizeX: 1});
  expect(
    partiallyInfinitePlane.intersectRay(new Ray(new Vector3(0, 1, 100), new Vector3(0, -1, 0)))
  ).toBeTruthy();
});

test('shape transforms, plane classification and enclosing bounds', () => {
  const sphere = new SphereShape({matrix: new Matrix4().translate([2, 0, 0])});
  expect(sphere.containsPoint([2, 0, 0])).toBe(true);
  expect(sphere.intersectPlane(new Plane([1, 0, 0], -3))).toBe(INTERSECTION.OUTSIDE);
  expect(sphere.intersectPlane(new Plane([1, 0, 0], -2))).toBe(INTERSECTION.INTERSECTING);
  expect(sphere.intersectPlane(new Plane([1, 0, 0], -1))).toBe(INTERSECTION.INSIDE);
  expect(new CullingVolume([new Plane([1, 0, 0], 1)]).computeVisibility(new BoxShape())).toBe(
    INTERSECTION.INSIDE
  );
  const bounds = sphere.getAxisAlignedBoundingBox();
  expect(bounds && Array.from(bounds.minimum)).toEqual([1.5, -0.5, -0.5]);
  expect(bounds && Array.from(bounds.maximum)).toEqual([2.5, 0.5, 0.5]);
  expect(new PlaneShape().getAxisAlignedBoundingBox()).toBeUndefined();
  const ellipsoid = new SphereShape({matrix: new Matrix4().scale([2, 1, 1])});
  expect(ellipsoid.containsPoint([1, 0, 0])).toBe(true);
  expect(
    ellipsoid.intersectRay(new Ray(new Vector3(-3, 0, 0), new Vector3(1, 0, 0)))?.distance
  ).toBe(2);
  expect(() => new BoxShape({matrix: new Matrix4().scale([0, 1, 1])})).toThrow();
});

test('tapered capsule handles contained endpoint spheres', () => {
  const capsule = new CapsuleShape({height: 1, radiusBottom: 0.25, radiusTop: 2});
  expect(capsule.containsPoint([0, 2.4, 0])).toBe(true);
  expect(capsule.containsPoint([0, -2, 0])).toBe(false);
  const hit = capsule.intersectRay(new Ray(new Vector3(0, 4, 0), new Vector3(0, -1, 0)));
  expect(hit?.distance).toBe(1.5);
});
