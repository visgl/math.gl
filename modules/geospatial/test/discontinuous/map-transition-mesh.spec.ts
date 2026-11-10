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
