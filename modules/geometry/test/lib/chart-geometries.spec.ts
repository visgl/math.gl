// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {PrismGeometry, RingGeometry, type Geometry} from '../../src';

export function validateMesh(geometry: Geometry): void {
  const positions = geometry.attributes.POSITION.value;
  const normals = geometry.attributes.NORMAL.value;
  const textureCoordinates = geometry.attributes.TEXCOORD_0.value;
  const indices = geometry.indices!.value;
  expect(Array.from(positions).every(Number.isFinite)).toBe(true);
  for (let vertex = 0; vertex < normals.length; vertex += 3) {
    expect(Math.hypot(...normals.slice(vertex, vertex + 3))).toBeCloseTo(1, 6);
  }
  for (let triangle = 0; triangle < indices.length; triangle += 3) {
    const offsets = Array.from(indices.slice(triangle, triangle + 3), index => index * 3);
    const firstEdge = [0, 1, 2].map(
      axis => positions[offsets[1] + axis] - positions[offsets[0] + axis]
    );
    const secondEdge = [0, 1, 2].map(
      axis => positions[offsets[2] + axis] - positions[offsets[0] + axis]
    );
    const cross = [
      firstEdge[1] * secondEdge[2] - firstEdge[2] * secondEdge[1],
      firstEdge[2] * secondEdge[0] - firstEdge[0] * secondEdge[2],
      firstEdge[0] * secondEdge[1] - firstEdge[1] * secondEdge[0]
    ];
    expect(Math.hypot(...cross)).toBeGreaterThan(1e-8);
    const textureOffsets = Array.from(indices.slice(triangle, triangle + 3), index => index * 2);
    const textureArea =
      (textureCoordinates[textureOffsets[1]] - textureCoordinates[textureOffsets[0]]) *
        (textureCoordinates[textureOffsets[2] + 1] - textureCoordinates[textureOffsets[0] + 1]) -
      (textureCoordinates[textureOffsets[2]] - textureCoordinates[textureOffsets[0]]) *
        (textureCoordinates[textureOffsets[1] + 1] - textureCoordinates[textureOffsets[0] + 1]);
    expect(Math.abs(textureArea)).toBeGreaterThan(0);
    expect(
      cross.reduce((sum, component, axis) => sum + component * normals[offsets[0] + axis], 0)
    ).toBeGreaterThan(0);
  }
}

test('prism has flat outward sides, hard caps and requested bounds', () => {
  const geometry = new PrismGeometry({radius: 2, height: 3, sides: 6});
  validateMesh(geometry);
  expect(geometry.indices!.value.length).toBe(72);
  const positions = geometry.attributes.POSITION.value;
  const normals = geometry.attributes.NORMAL.value;
  const sideNormals = new Set<string>();
  for (let index = 0; index < positions.length; index += 3) {
    expect(Math.abs(positions[index + 1])).toBe(1.5);
    if (normals[index + 1] === 0) {
      sideNormals.add(Array.from(normals.slice(index, index + 3)).join(','));
      expect(
        normals[index] * positions[index] + normals[index + 2] * positions[index + 2]
      ).toBeCloseTo(Math.sqrt(3), 5);
    } else {
      expect(normals[index + 1]).toBe(Math.sign(positions[index + 1]));
    }
  }
  expect(sideNormals.size).toBe(6);
});

test('ring inner wall points into hole, outer wall outwards, partial ends close', () => {
  const full = new RingGeometry({segments: 12});
  const partial = new RingGeometry({segments: 12, startAngle: 0.3, sweepAngle: Math.PI});
  validateMesh(full);
  validateMesh(partial);
  expect(partial.indices!.value.length - full.indices!.value.length).toBe(12);
  const positions = full.attributes.POSITION.value;
  const normals = full.attributes.NORMAL.value;
  for (let index = 0; index < positions.length; index += 3) {
    const radius = Math.hypot(positions[index], positions[index + 2]);
    expect(radius >= 0.5 - 1e-6 && radius <= 1 + 1e-6).toBe(true);
    expect(Math.abs(positions[index + 1])).toBeCloseTo(0.05, 6);
    if (normals[index + 1] === 0) {
      const normalRadius =
        positions[index] * normals[index] + positions[index + 2] * normals[index + 2];
      expect(normalRadius).toBeCloseTo(radius < 0.75 ? -0.5 : 1, 6);
    }
  }
});

test('chart solids preserve custom attributes and validate dimensions and arcs', () => {
  const attribute = {size: 1, value: new Float32Array(1), constant: true};
  expect(new PrismGeometry({id: 'prism', attributes: {custom: attribute}}).id).toBe('prism');
  expect(new RingGeometry({attributes: {custom: attribute}}).attributes.custom.value).toBe(
    attribute.value
  );
  for (const props of [
    {radius: 0},
    {height: NaN},
    {sides: 2},
    {sides: 3.5},
    {startAngle: Infinity}
  ]) {
    expect(() => new PrismGeometry(props)).toThrow();
  }
  for (const props of [
    {innerRadius: 1},
    {innerRadius: 0},
    {height: -1},
    {segments: 2},
    {sweepAngle: 0},
    {sweepAngle: Math.PI * 3}
  ]) {
    expect(() => new RingGeometry(props)).toThrow();
  }
  validateMesh(new PrismGeometry({sides: 3, startAngle: -8}));
  validateMesh(new RingGeometry({segments: 3, sweepAngle: 0.1}));
});

test('closed solids have exactly two incident faces on every welded edge', () => {
  for (const geometry of [
    new PrismGeometry(),
    new RingGeometry({segments: 8}),
    new RingGeometry({segments: 8, sweepAngle: 1.7, startAngle: 0.4}),
    new RingGeometry({segments: 11, startAngle: 0, sweepAngle: Math.PI / 2})
  ]) {
    const positions = geometry.attributes.POSITION.value;
    const indices = geometry.indices!.value;
    const vertices: string[] = [];
    for (let index = 0; index < positions.length; index += 3) {
      vertices.push(Array.from(positions.slice(index, index + 3)).join(','));
    }
    const edges = new Map<string, number>();
    for (let index = 0; index < indices.length; index += 3) {
      for (let corner = 0; corner < 3; corner++) {
        const edge = [
          vertices[indices[index + corner]],
          vertices[indices[index + ((corner + 1) % 3)]]
        ]
          .sort()
          .join('|');
        edges.set(edge, (edges.get(edge) ?? 0) + 1);
      }
    }
    expect(Array.from(edges.values()).every(count => count === 2)).toBe(true);
  }
});

test('solid angles follow the torus convention from positive X toward negative Z', () => {
  const prism = new PrismGeometry({startAngle: Math.PI / 2});
  expect(prism.attributes.POSITION.value[0]).toBeCloseTo(0, 6);
  expect(prism.attributes.POSITION.value[2]).toBe(-1);
  const ring = new RingGeometry({startAngle: 0, sweepAngle: Math.PI / 2});
  const positions = ring.attributes.POSITION.value;
  for (let index = 0; index < positions.length; index += 3) {
    expect(positions[index]).toBeGreaterThanOrEqual(0);
    expect(positions[index + 2]).toBeLessThanOrEqual(0);
  }
});

test('large solid rings promote indices and keep the indexed draw count', () => {
  const geometry = new RingGeometry({segments: 4097});
  expect(geometry.indices!.value).toBeInstanceOf(Uint32Array);
  expect(geometry.getVertexCount()).toBe(4097 * 24);
});
