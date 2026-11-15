// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {fillTerrainDepressions, HeightField} from '@math.gl/geospatial';
import sierra from './fixtures/sierra-nodata-streaming.json';

/** Find first outlet connectivity by scanning all source elevation thresholds. */
function thresholdOracle(source: number[], width: number, outlets: number[]) {
  const levels = [...new Set(source.filter(Number.isFinite))].sort((a, b) => a - b);
  const spills = source.map(() => Infinity);
  for (const level of levels) {
    const connected = new Set(outlets.filter(i => source[i] <= level));
    let previousSize = -1;
    while (connected.size !== previousSize) {
      previousSize = connected.size;
      for (let i = 0; i < source.length; i++) {
        if (!(source[i] <= level) || connected.has(i)) continue;
        const x = i % width;
        if (
          (x > 0 && connected.has(i - 1)) ||
          (x < width - 1 && connected.has(i + 1)) ||
          connected.has(i - width) ||
          connected.has(i + width)
        )
          connected.add(i);
      }
    }
    for (const i of connected) spills[i] = Math.min(spills[i], level);
  }
  return spills;
}

/** Check minimal elevations and follow every receiver path to its outlet. */
function qualify(field: HeightField, outlets: number[]) {
  const {heights, validity} = field.copyData();
  const source = Array.from(heights, (value, i) => (validity[i] ? value : NaN));
  const reference = thresholdOracle(source, field.width, outlets);
  const actual = fillTerrainDepressions(field, {outlets});
  const actualHeights = actual.field.copyData();
  expect(actualHeights.validity).toEqual(validity);
  expect(actual.disconnectedCells).toBe(
    reference.filter((v, i) => !Number.isFinite(v) && validity[i]).length
  );
  for (let i = 0; i < source.length; i++) {
    if (!Number.isFinite(reference[i])) {
      expect(actualHeights.heights[i]).toBe(heights[i]);
      expect(actual.receiver[i]).toBe(-2);
      continue;
    }
    expect(actualHeights.heights[i]).toBe(reference[i]);
    const seen = new Set<number>();
    let cell = i;
    while (actual.receiver[cell] >= 0) {
      expect(seen.has(cell)).toBe(false);
      seen.add(cell);
      const next = actual.receiver[cell];
      const faceDistance =
        Math.abs((cell % field.width) - (next % field.width)) +
        Math.abs(Math.floor(cell / field.width) - Math.floor(next / field.width));
      expect(faceDistance).toBe(1);
      expect(actualHeights.heights[next]).toBeLessThanOrEqual(actualHeights.heights[cell]);
      cell = next;
    }
    expect(outlets).toContain(cell);
    expect(actual.receiver[cell]).toBe(-1);
  }
  expect(field.copyData()).toEqual({heights, validity});
  return actual;
}

test('fills a bowl to its lowest spill and identifies an outlet-disconnected island', () => {
  const field = new HeightField({
    width: 5,
    height: 4,
    registration: 'cell',
    origin: [120, 30],
    columnStep: [3, 1],
    rowStep: [0, -2],
    heightReference: 'test',
    heights: new Float32Array([
      9,
      9,
      4,
      NaN,
      -9,
      9,
      0,
      5,
      NaN,
      -8,
      9,
      1,
      9,
      NaN,
      -7,
      9,
      9,
      9,
      NaN,
      -6
    ])
  });
  const result = qualify(field, [2, 0]);
  expect(result.field.getHeight(1, 1)).toBe(5);
  expect(result.disconnectedCells).toBe(4);
  expect(result.field.origin).toEqual(field.origin);
  expect(result.field.rowStep).toEqual(field.rowStep);
  expect(result.field.heightReference).toBe(field.heightReference);
  expect(fillTerrainDepressions(field, {outlets: [0, 2, 2]}).receiver).toEqual(result.receiver);
});

test('pinned Sierra nodata crop agrees with independent threshold connectivity', () => {
  const width = 9;
  let heights: Float64Array | undefined;
  for (let row = 0; row <= sierra.height - width && !heights; row += 4) {
    for (let col = 0; col <= sierra.width - width && !heights; col += 4) {
      const samples = Array.from(
        {length: width ** 2},
        (_, i) => sierra.heights[(row + Math.floor(i / width)) * sierra.width + col + (i % width)]
      );
      if (
        samples.filter(value => value === null).length >= 5 &&
        samples.filter(Number.isFinite).length >= 30
      )
        heights = Float64Array.from(samples, value => value ?? NaN);
    }
  }
  if (!heights) throw new Error('No mixed Sierra window');
  const field = new HeightField({width, height: width, heights, registration: 'cell'});
  const outlets = [heights.findIndex(Number.isFinite), heights.findLastIndex(Number.isFinite)];
  qualify(field, outlets);
});

test('rejects missing outlets, nodata outlets and work above the cell budget', () => {
  const field = new HeightField({
    width: 2,
    height: 2,
    registration: 'cell',
    heights: new Float32Array([0, NaN, 2, 3])
  });
  expect(() => fillTerrainDepressions(field, {outlets: []})).toThrow('requires an outlet');
  expect(() => fillTerrainDepressions(field, {outlets: [1]})).toThrow('valid cell');
  expect(() => fillTerrainDepressions(field, {outlets: [0], maxCells: 3})).toThrow('cell budget');
});
