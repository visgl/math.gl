// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {BoxShape, CapsuleShape, CylinderShape, PlaneShape, SphereShape} from '@math.gl/culling';
import {
  BoxGeometry,
  CapsuleGeometry,
  ConeGeometry,
  CubeGeometry,
  CylinderGeometry,
  IcoSphereGeometry,
  PlaneGeometry,
  SphereGeometry,
  TruncatedConeGeometry,
  type Geometry
} from '@math.gl/geometry';

test('primitive tessellators emit standard finite attributes', () => {
  const geometries: Geometry[] = [
    new BoxGeometry(),
    new CapsuleGeometry(),
    new CylinderGeometry(),
    new PlaneGeometry({sizeX: 1, sizeZ: 1}),
    new SphereGeometry(),
    new CubeGeometry(),
    new ConeGeometry(),
    new TruncatedConeGeometry({topRadius: 0.25, bottomRadius: 0.5}),
    new IcoSphereGeometry({iterations: 1})
  ];
  for (const geometry of geometries) {
    expect(geometry.topology).toBe('triangle-list');
    for (const [name, size] of [
      ['POSITION', 3],
      ['NORMAL', 3],
      ['TEXCOORD_0', 2]
    ] as const) {
      const attribute = geometry.attributes[name];
      expect(attribute.size, `${geometry.constructor.name} ${name} size`).toBe(size);
      expect(
        Array.from(attribute.value).every(Number.isFinite),
        `${geometry.constructor.name} ${name} finite`
      ).toBe(true);
    }
    expect(geometry.getVertexCount() % 3, `${geometry.constructor.name} triangle draw count`).toBe(
      0
    );
  }
});

test('glTF geometry defaults and bounds match analytic shapes', () => {
  const pairs = [
    [new BoxGeometry(), new BoxShape()],
    [new CapsuleGeometry(), new CapsuleShape()],
    [new CylinderGeometry(), new CylinderShape()],
    [new PlaneGeometry({sizeX: 1, sizeZ: 1}), new PlaneShape({sizeX: 1, sizeZ: 1})],
    [new SphereGeometry(), new SphereShape()]
  ] as const;
  for (const [geometry, shape] of pairs) {
    const positions = geometry.attributes.POSITION.value;
    for (let i = 0; i < positions.length; i += 3) {
      expect(
        shape.containsPoint([
          Number(positions[i]),
          Number(positions[i + 1]),
          Number(positions[i + 2])
        ]),
        `${shape.type} mesh vertex is on/in analytic shape`
      ).toBe(true);
    }
  }
});

test('plane orientation, subdivisions and index width', () => {
  const plane = new PlaneGeometry({sizeX: 2, sizeZ: 4, nx: 2, nz: 3});
  expect(plane.attributes.POSITION.value.length / 3).toBe(12);
  expect(Array.from(plane.attributes.NORMAL.value.slice(0, 3))).toEqual([0, 1, 0]);
  const largePlane = new PlaneGeometry({sizeX: 1, sizeZ: 1, nx: 256, nz: 256});
  expect(largePlane.indices?.value).toBeInstanceOf(Uint32Array);
});

test('custom attributes override generated attributes', () => {
  const position = {size: 3, value: new Float32Array([1, 2, 3])};
  const box = new BoxGeometry({attributes: {POSITION: position}});
  expect(box.attributes.POSITION.value).toBe(position.value);
});

test('generated triangle winding agrees with outward vertex normals', () => {
  const geometries = [
    new BoxGeometry(),
    new CapsuleGeometry(),
    new CylinderGeometry(),
    new PlaneGeometry({sizeX: 1, sizeZ: 1}),
    new SphereGeometry()
  ];
  for (const geometry of geometries) {
    const positions = geometry.attributes.POSITION.value;
    const normals = geometry.attributes.NORMAL.value;
    const indices = geometry.indices?.value;
    let checked = false;
    for (let triangle = 0; indices && triangle < indices.length; triangle += 3) {
      const i0 = Number(indices[triangle]);
      const i1 = Number(indices[triangle + 1]);
      const i2 = Number(indices[triangle + 2]);
      const a = readVector(positions, i0);
      const b = readVector(positions, i1);
      const c = readVector(positions, i2);
      const ab = b.map((value, i) => value - a[i]);
      const ac = c.map((value, i) => value - a[i]);
      const cross = [
        ab[1] * ac[2] - ab[2] * ac[1],
        ab[2] * ac[0] - ab[0] * ac[2],
        ab[0] * ac[1] - ab[1] * ac[0]
      ];
      if (Math.hypot(...cross) < 1e-10) continue;
      const normal = readVector(normals, i0);
      expect(
        cross[0] * normal[0] + cross[1] * normal[1] + cross[2] * normal[2] > 0,
        `${geometry.constructor.name} winding`
      ).toBe(true);
      checked = true;
      break;
    }
    expect(checked, `${geometry.constructor.name} has a non-degenerate triangle`).toBe(true);
  }
});

function readVector(array: ArrayLike<number>, index: number): number[] {
  return [Number(array[index * 3]), Number(array[index * 3 + 1]), Number(array[index * 3 + 2])];
}
