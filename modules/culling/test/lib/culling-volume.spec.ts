// This file is derived from the Cesium math library under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

/* eslint-disable */
import {test, expect, describe} from 'vitest';

import {Vector3} from '@math.gl/core';
import {
  CullingVolume,
  BoundingSphere,
  makeBoundingSphereFromPoints,
  makeAxisAlignedBoundingBoxFromPoints,
  _PerspectiveFrustum as PerspectiveFrustum,
  INTERSECTION
} from '@math.gl/culling';
import type {CullingResult} from '@math.gl/culling';
import {BoundingVolume} from '../../dist/lib/bounding-volumes/bounding-volume';

const VECTOR3_UNIT_Z = Object.freeze(new Vector3(0, 0, 1));

const frustum = new PerspectiveFrustum();
frustum.near = 1.0;
frustum.far = 2.0;
frustum.fov = Math.PI / 3;
frustum.aspectRatio = 1.0;

const cullingVolume = frustum.computeCullingVolume(
  new Vector3(),
  new Vector3().copy(VECTOR3_UNIT_Z).negate(),
  new Vector3(0, 1, 0)
);

test('INTERSECTION compatibility constants are string-valued', () => {
  expect(INTERSECTION.OUTSIDE).toBe('outside');
  expect(INTERSECTION.INTERSECTING).toBe('intersecting');
  expect(INTERSECTION.INSIDE).toBe('inside');
});

test('CullingVolume#constructor', () => {
  expect(() => new CullingVolume()).not.toThrow();
  expect(CullingVolume.MASK_INSIDE >= 0).toBeTruthy();
  expect(CullingVolume.MASK_OUTSIDE >= 0).toBeTruthy();
  expect(CullingVolume.MASK_INDETERMINATE >= 0).toBeTruthy();
});

test.skip('CullingVolume#computeVisibility throws without a bounding volume', () => {
  // @ts-ignore
  expect(() => new CullingVolume().computeVisibility()).toThrow();
});

test('CullingVolume#fromBoundingSphere', () => {
  const sphere = makeBoundingSphereFromPoints([
    new Vector3(0, -2.0, -1.5),
    new Vector3(0, 0, -1.5)
  ]);
  expect(() => new CullingVolume().fromBoundingSphere(sphere)).not.toThrow();
});

test.skip('CullingVolume#computeVisibilityWithPlaneMask throws without a bounding volume', () => {
  expect(() =>
    new CullingVolume().computeVisibilityWithPlaneMask(undefined, CullingVolume.MASK_INDETERMINATE)
  ).toThrow();
});

test('CullingVolume#computeVisibilityWithPlaneMask throws without a parent plane mask', () => {
  expect(() =>
    new CullingVolume().computeVisibilityWithPlaneMask(new BoundingSphere(), undefined)
  ).toThrow();
});

function testWithAndWithoutPlaneMask(
  culling: CullingVolume,
  bound: BoundingVolume,
  intersect: CullingResult
) {
  const actualIntersect = culling.computeVisibility(bound);
  expect(actualIntersect).toBe(intersect);

  const mask = culling.computeVisibilityWithPlaneMask(bound, CullingVolume.MASK_INDETERMINATE);
  if (intersect === INTERSECTION.INSIDE) {
    expect(mask).toBe(CullingVolume.MASK_INSIDE);
  } else if (intersect === INTERSECTION.OUTSIDE) {
    expect(mask).toBe(CullingVolume.MASK_OUTSIDE);
  } else {
    expect(mask === CullingVolume.MASK_INSIDE).toBeFalsy();
    expect(mask === CullingVolume.MASK_OUTSIDE).toBeFalsy();
  }
  expect(culling.computeVisibilityWithPlaneMask(bound, mask)).toBe(mask);
}

describe('CullingVolume#box intersections', () => {
  test('CullingVolume#can contain an axis aligned bounding box', () => {
    const box1 = makeAxisAlignedBoundingBoxFromPoints([
      new Vector3(-0.5, 0, -1.25),
      new Vector3(0.5, 0, -1.25),
      new Vector3(-0.5, 0, -1.75),
      new Vector3(0.5, 0, -1.75)
    ]);
    testWithAndWithoutPlaneMask(cullingVolume, box1, INTERSECTION.INSIDE);
  });

  describe('CullingVolume#can partially contain an axis aligned bounding box', () => {
    test('CullingVolume#on the far plane', () => {
      const box2 = makeAxisAlignedBoundingBoxFromPoints([
        new Vector3(-0.5, 0, -1.5),
        new Vector3(0.5, 0, -1.5),
        new Vector3(-0.5, 0, -2.5),
        new Vector3(0.5, 0, -2.5)
      ]);
      testWithAndWithoutPlaneMask(cullingVolume, box2, INTERSECTION.INTERSECTING);
    });

    test('CullingVolume#on the near plane', () => {
      const box3 = makeAxisAlignedBoundingBoxFromPoints([
        new Vector3(-0.5, 0, -0.5),
        new Vector3(0.5, 0, -0.5),
        new Vector3(-0.5, 0, -1.5),
        new Vector3(0.5, 0, -1.5)
      ]);
      testWithAndWithoutPlaneMask(cullingVolume, box3, INTERSECTION.INTERSECTING);
    });

    test('CullingVolume#on the left plane', () => {
      const box4 = makeAxisAlignedBoundingBoxFromPoints([
        new Vector3(-1.5, 0, -1.25),
        new Vector3(0, 0, -1.25),
        new Vector3(-1.5, 0, -1.5),
        new Vector3(0, 0, -1.5)
      ]);
      testWithAndWithoutPlaneMask(cullingVolume, box4, INTERSECTION.INTERSECTING);
    });

    test('CullingVolume#on the right plane', () => {
      const box5 = makeAxisAlignedBoundingBoxFromPoints([
        new Vector3(0, 0, -1.25),
        new Vector3(1.5, 0, -1.25),
        new Vector3(0, 0, -1.5),
        new Vector3(1.5, 0, -1.5)
      ]);
      testWithAndWithoutPlaneMask(cullingVolume, box5, INTERSECTION.INTERSECTING);
    });

    test('CullingVolume#on the top plane', () => {
      const box6 = makeAxisAlignedBoundingBoxFromPoints([
        new Vector3(-0.5, 0, -1.25),
        new Vector3(0.5, 0, -1.25),
        new Vector3(-0.5, 2.0, -1.75),
        new Vector3(0.5, 2.0, -1.75)
      ]);
      testWithAndWithoutPlaneMask(cullingVolume, box6, INTERSECTION.INTERSECTING);
    });

    test('CullingVolume#on the bottom plane', () => {
      const box7 = makeAxisAlignedBoundingBoxFromPoints([
        new Vector3(-0.5, -2.0, -1.25),
        new Vector3(0.5, 0, -1.25),
        new Vector3(-0.5, -2.0, -1.5),
        new Vector3(0.5, 0, -1.5)
      ]);
      testWithAndWithoutPlaneMask(cullingVolume, box7, INTERSECTION.INTERSECTING);
    });
  });

  describe('CullingVolume#can not contain an axis aligned bounding box', () => {
    test('CullingVolume#past the far plane', () => {
      const box8 = makeAxisAlignedBoundingBoxFromPoints([
        new Vector3(-0.5, 0, -2.25),
        new Vector3(0.5, 0, -2.25),
        new Vector3(-0.5, 0, -2.75),
        new Vector3(0.5, 0, -2.75)
      ]);
      testWithAndWithoutPlaneMask(cullingVolume, box8, INTERSECTION.OUTSIDE);
    });

    test('CullingVolume#before the near plane', () => {
      const box9 = makeAxisAlignedBoundingBoxFromPoints([
        new Vector3(-0.5, 0, -0.25),
        new Vector3(0.5, 0, -0.25),
        new Vector3(-0.5, 0, -0.75),
        new Vector3(0.5, 0, -0.75)
      ]);
      testWithAndWithoutPlaneMask(cullingVolume, box9, INTERSECTION.OUTSIDE);
    });

    test('CullingVolume#past the left plane', () => {
      const box10 = makeAxisAlignedBoundingBoxFromPoints([
        new Vector3(-5, 0, -1.25),
        new Vector3(-3, 0, -1.25),
        new Vector3(-5, 0, -1.75),
        new Vector3(-3, 0, -1.75)
      ]);
      testWithAndWithoutPlaneMask(cullingVolume, box10, INTERSECTION.OUTSIDE);
    });

    test('CullingVolume#past the right plane', () => {
      const box11 = makeAxisAlignedBoundingBoxFromPoints([
        new Vector3(3, 0, -1.25),
        new Vector3(5, 0, -1.25),
        new Vector3(3, 0, -1.75),
        new Vector3(5, 0, -1.75)
      ]);
      testWithAndWithoutPlaneMask(cullingVolume, box11, INTERSECTION.OUTSIDE);
    });

    test('CullingVolume#past the top plane', () => {
      const box12 = makeAxisAlignedBoundingBoxFromPoints([
        new Vector3(-0.5, 3, -1.25),
        new Vector3(0.5, 3, -1.25),
        new Vector3(-0.5, 5, -1.75),
        new Vector3(0.5, 5, -1.75)
      ]);
      testWithAndWithoutPlaneMask(cullingVolume, box12, INTERSECTION.OUTSIDE);
    });

    test('CullingVolume#past the bottom plane', () => {
      const box13 = makeAxisAlignedBoundingBoxFromPoints([
        new Vector3(-0.5, -3, -1.25),
        new Vector3(0.5, -3, -1.25),
        new Vector3(-0.5, -5, -1.75),
        new Vector3(0.5, -5, -1.75)
      ]);
      testWithAndWithoutPlaneMask(cullingVolume, box13, INTERSECTION.OUTSIDE);
    });
  });
});

describe('CullingVolume#sphere intersection', () => {
  test('CullingVolume#can contain a sphere', () => {
    const sphere1 = makeBoundingSphereFromPoints([
      new Vector3(0, 0, -1.25),
      new Vector3(0, 0, -1.75)
    ]);
    testWithAndWithoutPlaneMask(cullingVolume, sphere1, INTERSECTION.INSIDE);
  });

  describe('CullingVolume#can partially contain a sphere', () => {
    test('CullingVolume#on the far plane', () => {
      const sphere2 = makeBoundingSphereFromPoints([
        new Vector3(0, 0, -1.5),
        new Vector3(0, 0, -2.5)
      ]);
      testWithAndWithoutPlaneMask(cullingVolume, sphere2, INTERSECTION.INTERSECTING);
    });

    test('CullingVolume#on the near plane', () => {
      const sphere3 = makeBoundingSphereFromPoints([
        new Vector3(0, 0, -0.5),
        new Vector3(0, 0, -1.5)
      ]);
      testWithAndWithoutPlaneMask(cullingVolume, sphere3, INTERSECTION.INTERSECTING);
    });

    test('CullingVolume#on the left plane', () => {
      const sphere4 = makeBoundingSphereFromPoints([
        new Vector3(-1.0, 0, -1.5),
        new Vector3(0, 0, -1.5)
      ]);
      testWithAndWithoutPlaneMask(cullingVolume, sphere4, INTERSECTION.INTERSECTING);
    });

    test('CullingVolume#on the right plane', () => {
      const sphere5 = makeBoundingSphereFromPoints([
        new Vector3(0, 0, -1.5),
        new Vector3(1.0, 0, -1.5)
      ]);
      testWithAndWithoutPlaneMask(cullingVolume, sphere5, INTERSECTION.INTERSECTING);
    });

    test('CullingVolume#on the top plane', () => {
      const sphere6 = makeBoundingSphereFromPoints([
        new Vector3(0, 0, -1.5),
        new Vector3(0, 2.0, -1.5)
      ]);
      testWithAndWithoutPlaneMask(cullingVolume, sphere6, INTERSECTION.INTERSECTING);
    });

    test('CullingVolume#on the bottom plane', () => {
      const sphere7 = makeBoundingSphereFromPoints([
        new Vector3(0, -2.0, -1.5),
        new Vector3(0, 0, -1.5)
      ]);
      testWithAndWithoutPlaneMask(cullingVolume, sphere7, INTERSECTION.INTERSECTING);
    });
  });

  describe('CullingVolume#can not contain a sphere', () => {
    test('CullingVolume#past the far plane', () => {
      const sphere8 = makeBoundingSphereFromPoints([
        new Vector3(0, 0, -2.25),
        new Vector3(0, 0, -2.75)
      ]);
      testWithAndWithoutPlaneMask(cullingVolume, sphere8, INTERSECTION.OUTSIDE);
    });

    test('CullingVolume#before the near plane', () => {
      const sphere9 = makeBoundingSphereFromPoints([
        new Vector3(0, 0, -0.25),
        new Vector3(0, 0, -0.5)
      ]);
      testWithAndWithoutPlaneMask(cullingVolume, sphere9, INTERSECTION.OUTSIDE);
    });

    test('CullingVolume#past the left plane', () => {
      const sphere10 = makeBoundingSphereFromPoints([
        new Vector3(-5, 0, -1.25),
        new Vector3(-4.5, 0, -1.75)
      ]);
      testWithAndWithoutPlaneMask(cullingVolume, sphere10, INTERSECTION.OUTSIDE);
    });

    test('CullingVolume#past the right plane', () => {
      const sphere11 = makeBoundingSphereFromPoints([
        new Vector3(4.5, 0, -1.25),
        new Vector3(5, 0, -1.75)
      ]);
      testWithAndWithoutPlaneMask(cullingVolume, sphere11, INTERSECTION.OUTSIDE);
    });

    test('CullingVolume#past the top plane', () => {
      const sphere12 = makeBoundingSphereFromPoints([
        new Vector3(-0.5, 4.5, -1.25),
        new Vector3(-0.5, 5, -1.25)
      ]);
      testWithAndWithoutPlaneMask(cullingVolume, sphere12, INTERSECTION.OUTSIDE);
    });

    test('CullingVolume#past the bottom plane', () => {
      const sphere13 = makeBoundingSphereFromPoints([
        new Vector3(-0.5, -4.5, -1.25),
        new Vector3(-0.5, -5, -1.25)
      ]);
      testWithAndWithoutPlaneMask(cullingVolume, sphere13, INTERSECTION.OUTSIDE);
    });
  });
});

describe('CullingVolume#construct from bounding sphere', () => {
  const boundingSphereCullingVolume = new BoundingSphere(
    new Vector3(1000.0, 2000.0, 3000.0),
    100.0
  );
  const cullingVolume = new CullingVolume().fromBoundingSphere(boundingSphereCullingVolume);

  test('CullingVolume#throws without a boundingSphere', () => {
    // @ts-expect-error
    expect(() => new CullingVolume().fromBoundingSphere()).toThrow();
  });

  test('CullingVolume#can contain a volume', () => {
    const sphere1 = boundingSphereCullingVolume.clone();
    sphere1.radius *= 0.5;
    testWithAndWithoutPlaneMask(cullingVolume, sphere1, INTERSECTION.INSIDE);
  });

  describe('CullingVolume#can partially contain a volume', () => {
    test('CullingVolume#on the far plane', () => {
      const offset = new Vector3(0.0, 0.0, boundingSphereCullingVolume.radius * 1.5);
      const center = new Vector3().add(boundingSphereCullingVolume.center, offset, new Vector3());
      const radius = boundingSphereCullingVolume.radius * 0.5;
      const sphere2 = new BoundingSphere(center, radius);

      testWithAndWithoutPlaneMask(cullingVolume, sphere2, INTERSECTION.INTERSECTING);
    });

    test('CullingVolume#on the near plane', () => {
      const offset = new Vector3(0.0, 0.0, -boundingSphereCullingVolume.radius * 1.5);
      const center = new Vector3().add(boundingSphereCullingVolume.center, offset, new Vector3());
      const radius = boundingSphereCullingVolume.radius * 0.5;
      const sphere3 = new BoundingSphere(center, radius);

      testWithAndWithoutPlaneMask(cullingVolume, sphere3, INTERSECTION.INTERSECTING);
    });

    test('CullingVolume#on the left plane', () => {
      const offset = new Vector3(-boundingSphereCullingVolume.radius * 1.5, 0.0, 0.0);
      const center = new Vector3().add(boundingSphereCullingVolume.center, offset, new Vector3());
      const radius = boundingSphereCullingVolume.radius * 0.5;
      const sphere4 = new BoundingSphere(center, radius);

      testWithAndWithoutPlaneMask(cullingVolume, sphere4, INTERSECTION.INTERSECTING);
    });

    test('CullingVolume#on the right plane', () => {
      const offset = new Vector3(boundingSphereCullingVolume.radius * 1.5, 0.0, 0.0);
      const center = new Vector3().add(boundingSphereCullingVolume.center, offset, new Vector3());
      const radius = boundingSphereCullingVolume.radius * 0.5;
      const sphere5 = new BoundingSphere(center, radius);

      testWithAndWithoutPlaneMask(cullingVolume, sphere5, INTERSECTION.INTERSECTING);
    });

    test('CullingVolume#on the top plane', () => {
      const offset = new Vector3(0.0, boundingSphereCullingVolume.radius * 1.5, 0.0);
      const center = new Vector3().add(boundingSphereCullingVolume.center, offset, new Vector3());
      const radius = boundingSphereCullingVolume.radius * 0.5;
      const sphere6 = new BoundingSphere(center, radius);

      testWithAndWithoutPlaneMask(cullingVolume, sphere6, INTERSECTION.INTERSECTING);
    });

    test('CullingVolume#on the bottom plane', () => {
      const offset = new Vector3(0.0, -boundingSphereCullingVolume.radius * 1.5, 0.0);
      const center = new Vector3().add(boundingSphereCullingVolume.center, offset, new Vector3());
      const radius = boundingSphereCullingVolume.radius * 0.5;
      const sphere7 = new BoundingSphere(center, radius);

      testWithAndWithoutPlaneMask(cullingVolume, sphere7, INTERSECTION.INTERSECTING);
    });
  });

  describe('CullingVolume#can not contain a volume', () => {
    test('CullingVolume#past the far plane', () => {
      const offset = new Vector3(0.0, 0.0, boundingSphereCullingVolume.radius * 2.0);
      const center = new Vector3().add(boundingSphereCullingVolume.center, offset, new Vector3());
      const radius = boundingSphereCullingVolume.radius * 0.5;
      const sphere8 = new BoundingSphere(center, radius);

      testWithAndWithoutPlaneMask(cullingVolume, sphere8, INTERSECTION.OUTSIDE);
    });

    test('CullingVolume#before the near plane', () => {
      const offset = new Vector3(0.0, 0.0, -boundingSphereCullingVolume.radius * 2.0);
      const center = new Vector3().add(boundingSphereCullingVolume.center, offset, new Vector3());
      const radius = boundingSphereCullingVolume.radius * 0.5;
      const sphere9 = new BoundingSphere(center, radius);

      testWithAndWithoutPlaneMask(cullingVolume, sphere9, INTERSECTION.OUTSIDE);
    });

    test('CullingVolume#past the left plane', () => {
      const offset = new Vector3(-boundingSphereCullingVolume.radius * 2.0, 0.0, 0.0);
      const center = new Vector3().add(boundingSphereCullingVolume.center, offset, new Vector3());
      const radius = boundingSphereCullingVolume.radius * 0.5;
      const sphere10 = new BoundingSphere(center, radius);

      testWithAndWithoutPlaneMask(cullingVolume, sphere10, INTERSECTION.OUTSIDE);
    });

    test('CullingVolume#past the right plane', () => {
      const offset = new Vector3(boundingSphereCullingVolume.radius * 2.0, 0.0, 0.0);
      const center = new Vector3().add(boundingSphereCullingVolume.center, offset, new Vector3());
      const radius = boundingSphereCullingVolume.radius * 0.5;
      const sphere11 = new BoundingSphere(center, radius);

      testWithAndWithoutPlaneMask(cullingVolume, sphere11, INTERSECTION.OUTSIDE);
    });

    test('CullingVolume#past the top plane', () => {
      const offset = new Vector3(0.0, boundingSphereCullingVolume.radius * 2.0, 0.0);
      const center = new Vector3().add(boundingSphereCullingVolume.center, offset, new Vector3());
      const radius = boundingSphereCullingVolume.radius * 0.5;
      const sphere12 = new BoundingSphere(center, radius);

      testWithAndWithoutPlaneMask(cullingVolume, sphere12, INTERSECTION.OUTSIDE);
    });

    test('CullingVolume#past the bottom plane', () => {
      const offset = new Vector3(0.0, -boundingSphereCullingVolume.radius * 2.0, 0.0);
      const center = new Vector3().add(boundingSphereCullingVolume.center, offset, new Vector3());
      const radius = boundingSphereCullingVolume.radius * 0.5;
      const sphere13 = new BoundingSphere(center, radius);

      testWithAndWithoutPlaneMask(cullingVolume, sphere13, INTERSECTION.OUTSIDE);
    });
  });
});
