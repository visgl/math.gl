// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test, expect} from 'vitest';
import {
  prepareMapTransitionMesh,
  prepareMapTransitionMeshAsync,
  type MapTransitionEndpoint
} from '@math.gl/geospatial/discontinuous';

const identity: MapTransitionEndpoint = (x, y) => ({position: [x, y, 0], inside: true});

test('subpixel coverage boundaries stop refining without losing endpoint correspondence', () => {
  const target: MapTransitionEndpoint = (x, y) => ({position: [x, y, 0], inside: x > y});
  const bounded = prepareMapTransitionMesh(identity, target, {maxDepth: 4});
  expect(prepareMapTransitionMesh(identity, target, {maxDepth: 7})).toEqual(bounded);
  expect(bounded.lifetime.some((v, i) => i % 2 === 1 && v === 0)).toBe(true);
  expect(bounded.positions.length).toBe(bounded.destination.length);
  for (let i = 0; i < bounded.texCoords.length; i += 2) {
    const index = (i / 2) * 3;
    expect(bounded.positions[index]).toBeCloseTo(bounded.texCoords[i] * 360 - 180, 4);
    expect(bounded.positions[index + 1]).toBeCloseTo(90 - bounded.texCoords[i + 1] * 180, 4);
  }
});

test('cooperative preparation preserves buffers and lets pending host tasks run', async () => {
  let inputHandled = false;
  const input = setTimeout(() => {
    inputHandled = true;
  }, 0);
  try {
    const mesh = await prepareMapTransitionMeshAsync(identity, identity);
    expect(inputHandled).toBe(true);
    expect(mesh).toEqual(prepareMapTransitionMesh(identity, identity));
  } finally {
    clearTimeout(input);
  }
});

test('pending preparation aborts without returning a partial mesh', async () => {
  const controller = new AbortController();
  const pending = prepareMapTransitionMeshAsync(identity, identity, {signal: controller.signal});
  controller.abort();
  await expect(pending).rejects.toHaveProperty('name', 'AbortError');
});

test('invalid refinement budgets fail before sampling either endpoint', async () => {
  const unexpected: MapTransitionEndpoint = () => {
    throw new Error('unexpected sampling');
  };
  for (const options of [
    {maxDepth: -1},
    {maxDepth: 13},
    {maxDepth: 0.5},
    {error: 0},
    {error: NaN},
    {maxVertices: 2},
    {maxTriangles: 0}
  ]) {
    expect(() => prepareMapTransitionMesh(unexpected, unexpected, options)).toThrow(RangeError);
    await expect(
      prepareMapTransitionMeshAsync(unexpected, unexpected, options)
    ).rejects.toBeInstanceOf(RangeError);
  }
});

test('transition work budgets reject instead of returning partial buffers', async () => {
  expect(() => prepareMapTransitionMesh(identity, identity, {maxVertices: 3})).toThrow(RangeError);
  await expect(
    prepareMapTransitionMeshAsync(identity, identity, {maxTriangles: 1})
  ).rejects.toBeInstanceOf(RangeError);
});

test('a single nonzero world copy receives its requested screen offset', () => {
  const endpoint: MapTransitionEndpoint = Object.assign(identity, {
    worldWidth: 500,
    wrapCopies: [1]
  });
  const mesh = prepareMapTransitionMesh(endpoint, endpoint, {maxDepth: 0});
  let left = Infinity,
    right = -Infinity;
  for (let i = 0; i < mesh.positions.length; i += 3) {
    left = Math.min(left, mesh.positions[i]);
    right = Math.max(right, mesh.positions[i]);
  }
  expect([left, right]).toEqual([320, 680]);
  delete endpoint.worldWidth;
  delete endpoint.wrapCopies;
});

test('part and seam IDs preserve their types and tuple boundaries', () => {
  const source: MapTransitionEndpoint = (x, y) => ({
    position: [x + 1000, y + 1000, 0],
    inside: true,
    part: x < 0 ? 'a:b' : 'a'
  });
  const target: MapTransitionEndpoint = (x, y) => ({
    position: [x + 2000, y + 3000, 0],
    inside: true,
    part: x < 0 ? 'c' : 'b:c'
  });
  const mesh = prepareMapTransitionMesh(source, target, {maxDepth: 0});
  expect(new Set(Array.from(mesh.pieceCenters).filter((_, i) => i % 4 === 0)).size).toBe(2);
  const a: MapTransitionEndpoint = (x, y, sector = x) => ({
    position: [x + (sector < 0 ? -500 : 500), y + 1000, 0],
    inside: true,
    seam: sector < 0 ? 'a:b' : 'a'
  });
  const b: MapTransitionEndpoint = (x, y, sector = x) => ({
    position: [x + (sector < 0 ? -500 : 500), y + 1000, 0],
    inside: true,
    seam: sector < 0 ? 'c' : 'b:c'
  });
  const cut = prepareMapTransitionMesh(a, b, {maxDepth: 0});
  const banks = new Set<number>();
  for (let i = 0; i < cut.texCoords.length; i += 2)
    if (cut.texCoords[i] === 0.5) banks.add(cut.positions[(i / 2) * 3]);
  expect(banks).toEqual(new Set([-500, 500]));
});

test('cancellation is checked inside a deeply refined cell', async () => {
  const controller = new AbortController();
  let calls = 0;
  const endpoint: MapTransitionEndpoint = Object.assign(
    (x: number, y: number) => {
      if (++calls === 50) controller.abort();
      return {position: [x * 1000, y * 1000, 0] as const, inside: true};
    },
    {width: 1000000, height: 1000000}
  );
  await expect(
    prepareMapTransitionMeshAsync(endpoint, endpoint, {
      maxDepth: 12,
      error: 1e-8,
      signal: controller.signal
    })
  ).rejects.toHaveProperty('name', 'AbortError');
  expect(calls).toBeLessThan(100);
});

test('seam identities prevent triangles crossing a wrap cut within one part', () => {
  const cut: MapTransitionEndpoint = (x, y) => ({
    position: [x < 0 ? x - 500 : x + 500, y, 0],
    inside: true,
    part: 0,
    seam: x < 0 ? 'west' : 'east'
  });
  const mesh = prepareMapTransitionMesh(cut, cut, {maxDepth: 1});
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const xs = Array.from(mesh.indices.subarray(i, i + 3), index => mesh.positions[index * 3]);
    expect(Math.max(...xs) - Math.min(...xs)).toBeLessThan(10);
  }
});

test('empty visible-world lists produce empty buffers without sampling endpoints', async () => {
  const hidden: MapTransitionEndpoint = Object.assign(
    () => {
      throw new Error('No visible worlds');
    },
    {wrapCopies: []}
  );
  const mesh = prepareMapTransitionMesh(hidden, hidden);
  expect(mesh.vertexCount).toBe(0);
  for (const [key, value] of Object.entries(mesh))
    if (key !== 'vertexCount') expect(value.length).toBe(0);
  expect(await prepareMapTransitionMeshAsync(hidden, hidden)).toEqual(mesh);
});
