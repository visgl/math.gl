// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
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

test('glTF shapes use the specification defaults', t => {
  const box = new BoxShape();
  const capsule = new CapsuleShape();
  const cylinder = new CylinderShape();
  const plane = new PlaneShape();
  const sphere = new SphereShape();
  t.deepEqual(box.size, [1, 1, 1]);
  t.equal(capsule.height, 1);
  t.equal(capsule.radiusBottom, 0.5);
  t.equal(cylinder.height, 2);
  t.equal(cylinder.radiusTop, 0.5);
  t.equal(plane.sizeX, undefined);
  t.equal(sphere.radius, 0.5);
  t.end();
});

test('shape containment and distance follow analytic surfaces', t => {
  t.ok(new BoxShape().containsPoint([0.5, 0, 0]));
  t.equal(new BoxShape().distanceTo([1.5, 0, 0]), 1);
  t.ok(new SphereShape().containsPoint([0, 0.5, 0]));
  t.equal(new SphereShape().distanceTo([0, 2, 0]), 1.5);
  t.ok(new CylinderShape({radiusBottom: 1, radiusTop: 0}).containsPoint([0.5, -0.5, 0]));
  t.notOk(new CylinderShape({radiusBottom: 1, radiusTop: 0}).containsPoint([0.75, 0.5, 0]));
  t.ok(new CapsuleShape({radiusBottom: 0.25, radiusTop: 0.75}).containsPoint([0, 1.2, 0]));
  t.equal(new CapsuleShape().distanceTo([1.5, 0, 0]), 1);
  t.ok(new PlaneShape().containsPoint([100, -1, 100]), 'negative Y half-space is inside');
  t.notOk(new PlaneShape().containsPoint([0, 0.1, 0]));
  t.end();
});

test('shape ray intersections return nearest forward hits and normals', t => {
  const sphereHit = new SphereShape().intersectRay(
    new Ray(new Vector3(0, 0, -2), new Vector3(0, 0, 1))
  );
  t.ok(sphereHit);
  t.equal(sphereHit?.distance, 1.5);
  t.deepEqual(sphereHit && Array.from(sphereHit.normal), [0, 0, -1]);
  t.ok(sphereHit?.entering);
  const exitHit = new BoxShape().intersectRay(new Ray(new Vector3(0, 0, 0), new Vector3(1, 0, 0)));
  t.equal(exitHit?.distance, 0.5);
  t.notOk(exitHit?.entering);
  const finitePlane = new PlaneShape({sizeX: 1, sizeZ: 1});
  t.ok(finitePlane.intersectRay(new Ray(new Vector3(0, 1, 0), new Vector3(0, -1, 0))));
  t.equal(
    finitePlane.intersectRay(new Ray(new Vector3(2, 1, 0), new Vector3(0, -1, 0))),
    undefined
  );
  const partiallyInfinitePlane = new PlaneShape({sizeX: 1});
  t.ok(partiallyInfinitePlane.intersectRay(new Ray(new Vector3(0, 1, 100), new Vector3(0, -1, 0))));
  t.end();
});

test('shape transforms, plane classification and enclosing bounds', t => {
  const sphere = new SphereShape({matrix: new Matrix4().translate([2, 0, 0])});
  t.ok(sphere.containsPoint([2, 0, 0]));
  t.equal(sphere.intersectPlane(new Plane([1, 0, 0], -3)), INTERSECTION.OUTSIDE);
  t.equal(sphere.intersectPlane(new Plane([1, 0, 0], -2)), INTERSECTION.INTERSECTING);
  t.equal(sphere.intersectPlane(new Plane([1, 0, 0], -1)), INTERSECTION.INSIDE);
  t.equal(
    new CullingVolume([new Plane([1, 0, 0], 1)]).computeVisibility(new BoxShape()),
    INTERSECTION.INSIDE
  );
  const bounds = sphere.getAxisAlignedBoundingBox();
  t.deepEqual(bounds && Array.from(bounds.minimum), [1.5, -0.5, -0.5]);
  t.deepEqual(bounds && Array.from(bounds.maximum), [2.5, 0.5, 0.5]);
  t.equal(new PlaneShape().getAxisAlignedBoundingBox(), undefined);
  const ellipsoid = new SphereShape({matrix: new Matrix4().scale([2, 1, 1])});
  t.ok(ellipsoid.containsPoint([1, 0, 0]));
  t.equal(
    ellipsoid.intersectRay(new Ray(new Vector3(-3, 0, 0), new Vector3(1, 0, 0)))?.distance,
    2
  );
  t.throws(() => new BoxShape({matrix: new Matrix4().scale([0, 1, 1])}));
  t.end();
});

test('tapered capsule handles contained endpoint spheres', t => {
  const capsule = new CapsuleShape({height: 1, radiusBottom: 0.25, radiusTop: 2});
  t.ok(capsule.containsPoint([0, 2.4, 0]));
  t.notOk(capsule.containsPoint([0, -2, 0]));
  const hit = capsule.intersectRay(new Ray(new Vector3(0, 4, 0), new Vector3(0, -1, 0)));
  t.equal(hit?.distance, 1.5);
  t.end();
});
