// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {test, expect, vi} from 'vitest';
import {earcut, subdivideTriangleMesh, subdivideGlobeMesh} from '@math.gl/polygon';
import type {SubdividedTriangleMesh} from '@math.gl/polygon';

const quad = {positions: [0, 0, 1, 0, 1, 1, 0, 1], indices: [0, 1, 2, 0, 2, 3]};
const identity = (p: readonly number[]) => p;

test('source-edge refinement splits only long shared edges and projects each vertex once', () => {
  const transform = vi.fn((position: readonly number[]) => [position[0], position[1], 7]);
  const positions = Object.freeze(quad.positions.slice());
  const indices = new Uint16Array(quad.indices);
  const result = subdivideTriangleMesh(
    {positions, indices},
    {
      refinement: 'source-edge',
      maxEdgeLength: 1,
      transform,
      targetSize: 3
    }
  );
  // Only the shared diagonal is long; both triangles reuse its one midpoint.
  expect(result.sourcePositions.length / 2).toBe(5);
  expect(result.indices.length / 3).toBe(4);
  expect(transform).toHaveBeenCalledTimes(5);
  expect(Array.from(result.sourceTriangleIndices)).toEqual([0, 0, 1, 1]);
  expect(Array.from(result.sourceVertexIndices.slice(12))).toEqual([2, 0, 0]);
  expect(Array.from(result.sourceVertexWeights.slice(12))).toEqual([0.5, 0.5, 0]);
  expect(Array.from(result.positions.filter((_, index) => index % 3 === 2))).toEqual([
    7, 7, 7, 7, 7
  ]);
  expect(positions).toEqual(quad.positions);
  expect(Array.from(indices)).toEqual(quad.indices);
  checkQuadConformity(result);
});

test.each([0.9, 0.4, 0.2])(
  'source-edge refinement is conforming with edge limit %s',
  maxEdgeLength => {
    const result = subdivideTriangleMesh(quad, {
      refinement: 'source-edge',
      maxEdgeLength,
      transform: identity
    });
    checkQuadConformity(result);
    for (let index = 0; index < result.indices.length; index += 3) {
      const original = quad.indices.slice(
        result.sourceTriangleIndices[index / 3] * 3,
        result.sourceTriangleIndices[index / 3] * 3 + 3
      );
      for (let corner = 0; corner < 3; corner++) {
        const vertex = result.indices[index + corner];
        const next = result.indices[index + ((corner + 1) % 3)];
        expect(
          Math.hypot(
            result.sourcePositions[vertex * 2] - result.sourcePositions[next * 2],
            result.sourcePositions[vertex * 2 + 1] - result.sourcePositions[next * 2 + 1]
          )
        ).toBeLessThanOrEqual(maxEdgeLength);
        for (let component = 0; component < 2; component++) {
          let reconstructed = 0;
          for (let slot = 0; slot < 3; slot++) {
            const weight = result.sourceVertexWeights[vertex * 3 + slot];
            const source = result.sourceVertexIndices[vertex * 3 + slot];
            if (weight) expect(original).toContain(source);
            reconstructed += quad.positions[source * 2 + component] * weight;
          }
          expect(reconstructed).toBeCloseTo(result.sourcePositions[vertex * 2 + component]);
        }
      }
    }
  }
);

test('source-edge mode deliberately does not validate unsampled interiors', () => {
  const transform = vi.fn((position: readonly number[]) =>
    position[0] === 1 / 3 ? null : position
  );
  const mesh = {positions: [0, 0, 1, 0, 0, 1], indices: [0, 1, 2]};
  expect(() => subdivideTriangleMesh(mesh, {transform, tolerance: 0.01})).toThrow(RangeError);
  transform.mockClear();
  const result = subdivideTriangleMesh(mesh, {
    transform,
    refinement: 'source-edge',
    maxEdgeLength: 2
  });
  expect(Array.from(result.indices)).toEqual(mesh.indices);
  expect(transform).toHaveBeenCalledTimes(3);
});

test.each([
  {maxEdgeLength: Infinity},
  {maxEdgeLength: 0},
  {maxEdgeLength: NaN},
  {maxEdgeLength: -1},
  {maxEdgeLength: undefined},
  {tolerance: 1},
  {refinement: 'unknown'}
])('source-edge mode rejects invalid policy options: %j', overrides => {
  expect(() =>
    Reflect.apply(subdivideTriangleMesh, undefined, [
      quad,
      {
        transform: identity,
        refinement: 'source-edge',
        maxEdgeLength: 1,
        ...overrides
      }
    ])
  ).toThrow(RangeError);
});

test.each([{maxDepth: 0}, {maxVertices: 4}, {maxTriangles: 2}])(
  'source-edge mode enforces resource limits: %j',
  limits => {
    expect(() =>
      subdivideTriangleMesh(quad, {
        refinement: 'source-edge',
        maxEdgeLength: 0.5,
        transform: identity,
        ...limits
      })
    ).toThrow(RangeError);
  }
);

test('source-edge mode retains seam identities and unused vertices', () => {
  const positions = [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 2, 2];
  const transform = vi.fn(identity);
  const result = subdivideTriangleMesh(
    {positions, indices: [0, 1, 2, 3, 4, 5]},
    {
      refinement: 'source-edge',
      maxEdgeLength: 1,
      transform
    }
  );
  expect(result.sourcePositions.length / 2).toBe(9);
  expect(transform).toHaveBeenCalledTimes(9);
  expect(Array.from(result.sourceVertexIndices.slice(21, 24))).toEqual([2, 0, 0]);
  expect(Array.from(result.sourceVertexIndices.slice(24, 27))).toEqual([3, 4, 0]);
  expect(Array.from(result.sourcePositions.slice(12, 14))).toEqual([2, 2]);
});

test('source-edge mode rejects invalid output vertices and propagates callback exceptions', () => {
  for (const output of [null, [0], [NaN, 0]]) {
    expect(() =>
      subdivideTriangleMesh(quad, {
        refinement: 'source-edge',
        maxEdgeLength: 1,
        transform: () => output
      })
    ).toThrow(RangeError);
  }
  const failure = new Error('transform failure');
  expect(() =>
    subdivideTriangleMesh(quad, {
      refinement: 'source-edge',
      maxEdgeLength: 1,
      transform: () => {
        throw failure;
      }
    })
  ).toThrow(failure);
  expect(() =>
    subdivideTriangleMesh(quad, {
      refinement: 'source-edge',
      maxEdgeLength: 1,
      transform: position => (position[0] === 0.5 ? null : position)
    })
  ).toThrow(RangeError);
});

test('source-edge length includes altitude and globe adapter preserves the policy', () => {
  const result = subdivideTriangleMesh(
    {positions: [0, 0, 0, 0, 0, 8, 1, 0, 0], indices: [0, 1, 2]},
    {
      refinement: 'source-edge',
      maxEdgeLength: 4,
      size: 3,
      transform: identity
    }
  );
  expect(result.indices.length).toBeGreaterThan(3);
  const globe = subdivideGlobeMesh(quad, {
    refinement: 'source-edge',
    maxEdgeLength: 1,
    semiMajorAxis: 1
  });
  checkQuadConformity(globe);
  expect(globe.positions.length).toBe(15);
  for (let index = 0; index < globe.positions.length; index += 3) {
    expect(Math.hypot(...globe.positions.slice(index, index + 3))).toBeCloseTo(1);
  }
  expect(
    subdivideTriangleMesh(
      {positions: [], indices: []},
      {
        refinement: 'source-edge',
        maxEdgeLength: 1,
        transform: identity
      }
    ).indices.length
  ).toBe(0);
});

function sourceArea(result: SubdividedTriangleMesh): number {
  let area = 0;
  for (let i = 0; i < result.indices.length; i += 3) {
    const [a, b, c] = Array.from(result.indices.slice(i, i + 3), index => index * 2);
    const p = result.sourcePositions;
    const signed =
      ((p[b] - p[a]) * (p[c + 1] - p[a + 1]) - (p[c] - p[a]) * (p[b + 1] - p[a + 1])) / 2;
    expect(signed).toBeGreaterThan(0);
    area += signed;
  }
  return area;
}

function checkQuadConformity(result: SubdividedTriangleMesh): void {
  const incidence = new Map<string, number>();
  for (let i = 0; i < result.indices.length; i += 3) {
    for (let j = 0; j < 3; j++) {
      const a = result.indices[i + j];
      const b = result.indices[i + ((j + 1) % 3)];
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      incidence.set(key, (incidence.get(key) || 0) + 1);
    }
  }
  for (const [key, count] of incidence) {
    const [a, b] = key.split(':').map(Number);
    const p = result.sourcePositions;
    const boundary = [0, 1].some(
      value =>
        (p[a * 2] === value && p[b * 2] === value) ||
        (p[a * 2 + 1] === value && p[b * 2 + 1] === value)
    );
    expect(count).toBe(boundary ? 1 : 2);
  }
  expect(sourceArea(result)).toBeCloseTo(1);
}

function checkMeshBoundary(mesh: {indices: number[]}, result: SubdividedTriangleMesh): void {
  function edges(indices: ArrayLike<number>): Map<string, number> {
    const counts = new Map<string, number>();
    for (let i = 0; i < indices.length; i += 3) {
      for (let j = 0; j < 3; j++) {
        const a = indices[i + j];
        const b = indices[i + ((j + 1) % 3)];
        const key = a < b ? a + ':' + b : b + ':' + a;
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }
    return counts;
  }
  const boundary = Array.from(edges(mesh.indices))
    .filter(([, count]) => count === 1)
    .map(([key]) => key.split(':').map(Number));
  for (const [key, count] of edges(result.indices)) {
    expect(count).toBeLessThanOrEqual(2);
    if (count === 1) {
      const support = new Set<number>();
      for (const vertex of key.split(':').map(Number)) {
        for (let j = 0; j < 3; j++) {
          if (result.sourceVertexWeights[vertex * 3 + j])
            support.add(result.sourceVertexIndices[vertex * 3 + j]);
        }
      }
      expect(boundary.some(edge => Array.from(support).every(index => edge.includes(index)))).toBe(
        true
      );
    }
  }
}

test('affine transforms preserve topology and do not mutate borrowed buffers', () => {
  const result = subdivideTriangleMesh(
    {positions: Object.freeze(quad.positions.slice()), indices: new Uint16Array(quad.indices)},
    {
      transform: p => [p[0] * 2 + 10, p[1] * 3],
      tolerance: 0.001
    }
  );
  expect(Array.from(result.indices)).toEqual(quad.indices);
  expect(Array.from(result.sourcePositions)).toEqual(quad.positions);
  expect(Array.from(result.positions)).toEqual([10, 0, 12, 0, 12, 3, 10, 3]);
  expect(Array.from(result.sourceTriangleIndices)).toEqual([0, 1]);
  expect(result.sourceVertexWeights.filter(value => value === 1).length).toBe(4);
});

test('interior probes find deformation that is zero along all triangle edges', () => {
  const mesh = {positions: [0, 0, 1, 0, 0, 1], indices: [0, 1, 2]};
  const bump = (x: number, y: number) => 27 * x * y * (1 - x - y);
  const result = subdivideTriangleMesh(mesh, {
    transform: p => [p[0], p[1], bump(p[0], p[1])],
    targetSize: 3,
    tolerance: 0.02
  });
  expect(result.indices.length).toBeGreaterThan(3);
  expect(Math.max(...result.positions.filter((_, i) => i % 3 === 2))).toBeGreaterThan(0.8);
  expect(sourceArea(result)).toBeCloseTo(0.5);
  // Dense independent surface probes supplement the algorithm's fixed samples.
  for (let i = 0; i < result.indices.length; i += 3) {
    const ids = Array.from(result.indices.slice(i, i + 3));
    for (let a = 0; a <= 10; a++) {
      for (let b = 0; b <= 10 - a; b++) {
        const weights = [a / 10, b / 10, 1 - (a + b) / 10];
        const coords = [0, 1, 2].map(component =>
          ids.reduce((sum, id, j) => sum + result.positions[id * 3 + component] * weights[j], 0)
        );
        expect(Math.abs(coords[2] - bump(coords[0], coords[1]))).toBeLessThan(0.025);
      }
    }
  }
});

test('textured bitmap mesh remains conforming and reconstructs UVs from provenance', () => {
  const result = subdivideTriangleMesh(quad, {
    transform: p => [p[0], p[1], Math.sin(p[0] * 2)],
    targetSize: 3,
    tolerance: 0.01
  });
  checkQuadConformity(result);
  const uvs = quad.positions;
  for (let i = 0; i < result.sourcePositions.length / 2; i++) {
    let total = 0;
    for (let component = 0; component < 2; component++) {
      let uv = 0;
      for (let j = 0; j < 3; j++) {
        const index = result.sourceVertexIndices[i * 3 + j];
        const weight = result.sourceVertexWeights[i * 3 + j];
        uv += uvs[index * 2 + component] * weight;
        if (component === 0) total += weight;
      }
      expect(uv).toBeCloseTo(result.sourcePositions[i * 2 + component]);
    }
    expect(total).toBeCloseTo(1);
  }
  for (let i = 0; i < result.indices.length; i += 3) {
    const original = result.sourceTriangleIndices[i / 3];
    const inputVertices = quad.indices.slice(original * 3, original * 3 + 3);
    for (const vertex of result.indices.slice(i, i + 3)) {
      for (let j = 0; j < 3; j++) {
        if (result.sourceVertexWeights[vertex * 3 + j]) {
          expect(inputVertices).toContain(result.sourceVertexIndices[vertex * 3 + j]);
        }
      }
    }
  }
});

test('polygon triangulation with a hole retains source area and hole exclusion', () => {
  const positions = [0, 0, 4, 0, 4, 4, 0, 4, 1, 1, 1, 3, 3, 3, 3, 1];
  const indices = earcut(positions, [4]);
  const result = subdivideTriangleMesh(
    {positions, indices},
    {
      transform: p => [p[0], p[1], p[0] ** 2],
      targetSize: 3,
      tolerance: 0.05
    }
  );
  expect(sourceArea(result)).toBeCloseTo(12);
  for (let i = 0; i < result.indices.length; i += 3) {
    const ids = Array.from(result.indices.slice(i, i + 3));
    const x = ids.reduce((sum, id) => sum + result.sourcePositions[id * 2] / 3, 0);
    const y = ids.reduce((sum, id) => sum + result.sourcePositions[id * 2 + 1] / 3, 0);
    expect(x > 1 && x < 3 && y > 1 && y < 3).toBe(false);
  }
});

test('source-edge refinement preserves polygon holes and clockwise winding', () => {
  const positions = [0, 0, 4, 0, 4, 4, 0, 4, 1, 1, 1, 3, 3, 3, 3, 1];
  const indices = earcut(positions, [4]);
  const mesh = {positions, indices};
  const result = subdivideTriangleMesh(mesh, {
    transform: identity,
    refinement: 'source-edge',
    maxEdgeLength: 0.75
  });
  expect(sourceArea(result)).toBeCloseTo(12);
  checkMeshBoundary(mesh, result);
  for (let index = 0; index < result.indices.length; index += 3) {
    const vertices = result.indices.slice(index, index + 3);
    const x = vertices.reduce((sum, vertex) => sum + result.sourcePositions[vertex * 2] / 3, 0);
    const y = vertices.reduce((sum, vertex) => sum + result.sourcePositions[vertex * 2 + 1] / 3, 0);
    expect(x > 1 && x < 3 && y > 1 && y < 3).toBe(false);
  }
  const reversed = subdivideTriangleMesh(
    {positions, indices: indices.slice().reverse()},
    {
      transform: identity,
      refinement: 'source-edge',
      maxEdgeLength: 0.75
    }
  );
  for (let index = 0; index < reversed.indices.length; index += 3) {
    const [a, b, c] = reversed.indices.slice(index, index + 3);
    const source = reversed.sourcePositions;
    expect(
      (source[b * 2] - source[a * 2]) * (source[c * 2 + 1] - source[a * 2 + 1]) -
        (source[c * 2] - source[a * 2]) * (source[b * 2 + 1] - source[a * 2 + 1])
    ).toBeLessThan(0);
  }
});

test('equal positions at attribute seams retain independent vertex provenance', () => {
  const mesh = {positions: [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], indices: [0, 1, 2, 3, 4, 5]};
  const result = subdivideTriangleMesh(mesh, {
    transform: identity,
    tolerance: 1,
    maxEdgeLength: 0.6
  });
  for (let i = 0; i < result.indices.length; i += 3) {
    const original = result.sourceTriangleIndices[i / 3];
    for (const vertex of result.indices.slice(i, i + 3)) {
      for (let j = 0; j < 3; j++) {
        if (result.sourceVertexWeights[vertex * 3 + j]) {
          expect(Math.floor(result.sourceVertexIndices[vertex * 3 + j] / 3)).toBe(original);
        }
      }
    }
  }
});

test('partial refinement uses conforming one-edge and two-edge neighbor templates', () => {
  // Central triangle is linear; one or two neighbors have an interior-only bump.
  for (const twoNeighbors of [false, true]) {
    for (let rotation = 0; rotation < 3; rotation++) {
      const central = [0, 1, 2];
      const order = central.slice(rotation).concat(central.slice(0, rotation));
      const mesh = {
        positions: [0, 0, 1, 0, 0, 1, 0, -1, 1, 1],
        indices: [...order, 0, 3, 1, ...(twoNeighbors ? [1, 4, 2] : [])]
      };
      const result = subdivideTriangleMesh(mesh, {
        transform: ([x, y]) => {
          const lower = y < 0 ? 27 * x * -y * (1 - x + y) : 0;
          const upper = twoNeighbors && x + y > 1 ? 27 * (x + y - 1) * (1 - x) * (1 - y) : 0;
          return [x, y, lower + upper];
        },
        targetSize: 3,
        tolerance: 0.9,
        maxDepth: 6
      });
      expect(
        result.sourceTriangleIndices.filter(value => value === 0).length
      ).toBeGreaterThanOrEqual(twoNeighbors ? 3 : 2);
      expect(sourceArea(result)).toBeCloseTo(twoNeighbors ? 1.5 : 1);
      checkMeshBoundary(mesh, result);
    }
  }
});

test('fails explicitly on invalid domains, malformed inputs and exhausted budgets', () => {
  const options = {transform: identity, tolerance: 1};
  expect(() => subdivideTriangleMesh({...quad, indices: [0, 1]}, options)).toThrow(RangeError);
  expect(() => subdivideTriangleMesh({...quad, indices: [0, 1, 4]}, options)).toThrow(RangeError);
  expect(() => subdivideTriangleMesh({...quad, positions: [NaN, 0]}, options)).toThrow(RangeError);
  expect(() => subdivideTriangleMesh(quad, {...options, transform: () => [Infinity, 0]})).toThrow(
    RangeError
  );
  expect(() =>
    subdivideTriangleMesh(quad, {...options, transform: p => (p[0] === 0.5 ? null : p)})
  ).toThrow(RangeError);
  for (const limits of [{maxDepth: 0}, {maxVertices: 4}, {maxTriangles: 2}]) {
    expect(() => subdivideTriangleMesh(quad, {...options, maxEdgeLength: 0.1, ...limits})).toThrow(
      RangeError
    );
  }
  const error = new Error('converter failure');
  expect(() =>
    subdivideTriangleMesh(quad, {
      ...options,
      transform: () => {
        throw error;
      }
    })
  ).toThrow(error);
  expect(subdivideTriangleMesh({positions: [], indices: []}, options).indices.length).toBe(0);
});

test('XYZ source positions and altitude attributes survive source-length refinement', () => {
  const mesh = {positions: [0, 0, 10, 1, 0, 20, 0, 1, 30], indices: [0, 1, 2]};
  const result = subdivideTriangleMesh(mesh, {
    transform: p => {
      const output = Array.from(p);
      output[2] *= 2;
      return output;
    },
    size: 3,
    tolerance: 0.001,
    maxEdgeLength: 6
  });
  expect(result.indices.length).toBeGreaterThan(3);
  for (let vertex = 0; vertex < result.sourcePositions.length / 3; vertex++) {
    let altitude = 0;
    for (let j = 0; j < 3; j++) {
      altitude +=
        mesh.positions[result.sourceVertexIndices[vertex * 3 + j] * 3 + 2] *
        result.sourceVertexWeights[vertex * 3 + j];
    }
    expect(result.sourcePositions[vertex * 3 + 2]).toBeCloseTo(altitude);
    expect(result.positions[vertex * 3 + 2]).toBeCloseTo(altitude * 2);
  }
});
