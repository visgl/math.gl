// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {HeightField, TerrainSampleStatus as Status} from '@math.gl/geospatial/terrain';
import type {TerrainInterpolation, TerrainSampleBatch} from '@math.gl/geospatial/terrain';

test('height fields copy strided input and normalize missing samples without losing zero or negative heights', () => {
  const heights = new Float64Array([99, -2, 0, 99, NaN, Infinity, 99]);
  const field = new HeightField({width: 2, height: 2, heights, offset: 1, stride: 3});
  heights[1] = 200;
  expect(field.getHeight(0, 0)).toBe(-2);
  expect(field.getHeight(1, 0)).toBe(0);
  expect(field.getHeight(0, 1)).toBeUndefined();
  expect(field.getHeight(-1, 0)).toBeUndefined();
  expect(field.getHeight(0.5, 0)).toBeUndefined();
  expect(field.heightRange).toEqual([-2, 0]);
  expect(field.validCount).toBe(2);
  expect(field.heightReference).toBe('unknown');
  const packed = field.copyData();
  expect(packed.heights).toBeInstanceOf(Float64Array);
  expect(Array.from(packed.heights)).toEqual([-2, 0, 0, 0]);
  expect(Array.from(packed.validity)).toEqual([1, 1, 0, 0]);
  packed.heights[0] = 500;
  packed.validity[0] = 0;
  expect(field.getHeight(0, 0)).toBe(-2);
});

test('validity, not elevation, controls missingness and extrema', () => {
  const validity = new Uint8Array([1, 0, 255, 1]);
  const field = new HeightField({
    width: 2,
    height: 2,
    heights: new Float32Array([0, 900, -10, 2]),
    validity,
    heightReference: 'local-survey'
  });
  validity[0] = 0;
  expect(field.getHeight(0, 0)).toBe(0);
  expect(field.getHeight(1, 0)).toBeUndefined();
  expect(field.heightRange).toEqual([-10, 2]);
  expect(field.heightReference).toBe('local-survey');
  expect(field.copyData().heights).toBeInstanceOf(Float32Array);
  const missing = new HeightField({
    width: 2,
    height: 2,
    heights: new Float32Array(4),
    validity: new Uint8Array(4)
  });
  expect(missing.heightRange).toBeUndefined();
  expect(missing.validCount).toBe(0);
});

test('bilinear sampling and metric gradients reproduce a plane on a rotated, sheared grid', () => {
  // World surface h(x,y) = 3x - 2y + 7; coordinates x=10+2u-v, y=20+u+3v.
  const heights = new Float64Array(12);
  for (let v = 0; v < 3; v++) {
    for (let u = 0; u < 4; u++)
      heights[v * 4 + u] = 3 * (10 + 2 * u - v) - 2 * (20 + u + 3 * v) + 7;
  }
  const origin: [number, number] = [10, 20];
  const field = new HeightField({
    width: 4,
    height: 3,
    heights,
    origin,
    columnStep: [2, 1],
    rowStep: [-1, 3]
  });
  origin[0] = 400;
  for (const interpolation of ['bilinear', 'triangle'] as const) {
    for (const [u, v] of [
      [0, 0],
      [3, 2],
      [0.25, 0.75],
      [2.9, 0.1],
      [1, 1]
    ]) {
      const x = 10 + 2 * u - v;
      const y = 20 + u + 3 * v;
      const sample = field.sample(x, y, {interpolation});
      expect(sample.status).toBe(Status.VALID);
      expect(sample.height).toBeCloseTo(3 * x - 2 * y + 7, 12);
      expect(sample.gradientStatus).toBe(Status.VALID);
      expect(sample.gradientX).toBeCloseTo(3, 12);
      expect(sample.gradientY).toBeCloseTo(-2, 12);
      expect(sample.normalX).toBeCloseTo(-3 / Math.sqrt(14), 12);
      expect(sample.normalY).toBeCloseTo(2 / Math.sqrt(14), 12);
      expect(sample.normalZ).toBeCloseTo(1 / Math.sqrt(14), 12);
    }
  }
  expect(Object.isFrozen(field.origin)).toBe(true);
});

test('bilinear saddle and both triangle diagonals describe distinct, explicit surfaces', () => {
  // h(u,v)=u*v is bilinear. The diagonals produce different linear approximations.
  for (const diagonal of ['00-11', '10-01'] as const) {
    const field = new HeightField({
      width: 2,
      height: 2,
      heights: new Float64Array([0, 0, 0, 1]),
      diagonal
    });
    const bilinear = field.sample(0.25, 0.75);
    expect(bilinear.height).toBe(0.1875);
    expect(bilinear.gradientX).toBe(0.75);
    expect(bilinear.gradientY).toBe(0.25);
    const triangle = field.sample(0.25, 0.75, {interpolation: 'triangle'});
    expect(triangle.height).toBe(diagonal === '00-11' ? 0.25 : 0);
    expect(field.sample(0.75, 0.25, {interpolation: 'triangle'}).height).toBe(
      diagonal === '00-11' ? 0.25 : 0
    );
    expect(field.sample(0.8, 0.8, {interpolation: 'triangle'}).height).toBeCloseTo(
      diagonal === '00-11' ? 0.8 : 0.6,
      14
    );
  }
});

test('cell registration uses centers and does not extrapolate to the pixel footprint', () => {
  const field = new HeightField({
    width: 2,
    height: 2,
    heights: new Float32Array([1, 2, 3, 4]),
    registration: 'cell',
    origin: [10, 20],
    columnStep: [2, 0],
    rowStep: [0, -4]
  });
  expect(field.sample(11, 18).height).toBe(1);
  expect(field.sample(13, 14).height).toBe(4);
  expect(field.sample(12, 16).height).toBe(2.5);
  expect(field.sample(10, 20).status).toBe(Status.OUTSIDE_DOMAIN);
  expect(field.sample(14, 12).status).toBe(Status.OUTSIDE_DOMAIN);
});

test('nearest sampling has deterministic ties and unavailable derivatives', () => {
  const field = new HeightField({width: 2, height: 2, heights: new Float32Array([1, 2, 3, 4])});
  const sample = field.sample(0.5, 0.5, {interpolation: 'nearest'});
  expect(sample.height).toBe(4);
  expect(sample.gradientStatus).toBe(Status.UNAVAILABLE);
  expect(sample.normalZ).toBe(0);
  expect(field.sample(0.49, 0.49, {interpolation: 'nearest'}).height).toBe(1);
});

test('interpolation does not bridge missing data; triangles require only their own vertices', () => {
  const field = new HeightField({
    width: 2,
    height: 2,
    heights: new Float32Array([1, 2, 3, 4]),
    validity: new Uint8Array([1, 1, 0, 1])
  });
  expect(field.sample(0, 0).status).toBe(Status.NO_DATA); // Conservative full-cell bilinear footprint.
  expect(field.sample(0, 0, {interpolation: 'nearest'}).status).toBe(Status.VALID);
  expect(field.sample(0, 1, {interpolation: 'nearest'}).status).toBe(Status.NO_DATA);
  expect(field.sample(0.75, 0.25, {interpolation: 'triangle'}).status).toBe(Status.VALID);
  expect(field.sample(0.25, 0.75, {interpolation: 'triangle'}).status).toBe(Status.NO_DATA);
});

test('invalid and out-of-domain queries clear reused outputs', () => {
  const field = new HeightField({width: 2, height: 2, heights: new Float32Array([1, 2, 3, 4])});
  const result = field.sample(0.5, 0.5);
  expect(field.sample(-0.01, 0, undefined, result)).toBe(result);
  expect(result.status).toBe(Status.OUTSIDE_DOMAIN);
  expect(result.height).toBe(0);
  expect(result.gradientX).toBe(0);
  expect(result.normalZ).toBe(0);
  expect(field.sample(NaN, 0).status).toBe(Status.INVALID_INPUT);
  expect(field.sample(Infinity, 0).status).toBe(Status.INVALID_INPUT);
  expect(field.sample(1 + Number.EPSILON, 1).status).toBe(Status.VALID);
  expect(field.sample(1 + 1e-10, 1).status).toBe(Status.OUTSIDE_DOMAIN);
});

test('batch queries preserve caller buffers and match scalar samples across interpolation modes', () => {
  const field = new HeightField({width: 2, height: 2, heights: new Float64Array([0, 2, -3, 8])});
  const positions = new Float64Array([0.2, 0.8, 0.8, 0.2, -1, 0, 1, 1]);
  const output: TerrainSampleBatch = {
    heights: new Float64Array(5).fill(99),
    statuses: new Uint8Array(4),
    gradients: new Float64Array(8),
    normals: new Float64Array(12),
    gradientStatuses: new Uint8Array(4)
  };
  for (const interpolation of ['nearest', 'bilinear', 'triangle'] as const) {
    expect(field.sampleBatch(positions, output, {interpolation})).toBe(output);
    for (let i = 0; i < 4; i++) {
      const sample = field.sample(positions[2 * i], positions[2 * i + 1], {interpolation});
      expect(output.heights[i]).toBe(sample.height);
      expect(output.statuses[i]).toBe(sample.status);
      expect(output.gradientStatuses![i]).toBe(sample.gradientStatus);
      expect(Array.from(output.gradients!.slice(2 * i, 2 * i + 2))).toEqual([
        sample.gradientX,
        sample.gradientY
      ]);
      expect(Array.from(output.normals!.slice(3 * i, 3 * i + 3))).toEqual([
        sample.normalX,
        sample.normalY,
        sample.normalZ
      ]);
    }
    expect(output.heights[4]).toBe(99);
  }
});

test('batch validation rejects insufficient, overlapping, and ambiguous derivative output buffers', () => {
  const field = new HeightField({width: 2, height: 2, heights: new Float32Array(4)});
  const xy = new Float32Array(4);
  const output = {heights: new Float32Array(2), statuses: new Uint8Array(2)};
  expect(() => field.sampleBatch(new Float32Array(3), output)).toThrow(/XY pairs/);
  expect(() => field.sampleBatch(xy, {...output, heights: new Float32Array(1)})).toThrow(/length/);
  expect(() => field.sampleBatch(xy, {...output, heights: xy.subarray(1, 3)})).toThrow(/overlap/);
  expect(() => field.sampleBatch(xy, {...output, gradients: new Float32Array(4)})).toThrow(
    /gradientStatuses/
  );
  const shared = new ArrayBuffer(40);
  expect(() =>
    field.sampleBatch(xy, {
      heights: new Float64Array(shared, 0, 2),
      statuses: new Uint8Array(shared, 8, 2)
    })
  ).toThrow(/overlap/);
  expect(() =>
    field.sampleBatch(xy, {
      heights: new Float64Array(shared, 0, 2),
      statuses: new Uint8Array(shared, 16, 2)
    })
  ).not.toThrow();
});

test('invalid grid descriptions are rejected before sampling', () => {
  const base = {width: 2, height: 2, heights: new Float32Array(4)};
  for (const props of [
    {...base, width: 1},
    {...base, height: 2.1},
    {...base, stride: 1},
    {...base, offset: -1},
    {...base, offset: 1},
    {...base, validity: new Uint8Array(3)},
    {...base, columnStep: [0, 0] as const},
    {...base, rowStep: [1, 0] as const},
    {...base, origin: [Infinity, 0] as const},
    {...base, heights: [0, 1, 2, 3] as never},
    {...base, registration: 'other' as never},
    {...base, diagonal: 'other' as never}
  ])
    expect(() => new HeightField(props)).toThrow();
  const field = new HeightField(base);
  expect(() => field.sample(0, 0, {interpolation: 'other' as TerrainInterpolation})).toThrow(
    /interpolation/
  );
});

test('numeric status prevents overflow from becoming a valid GPU sample', () => {
  const field = new HeightField({
    width: 2,
    height: 2,
    heights: new Float64Array([0, 1.7e308, 0, 1.7e308]),
    rowStep: [-1, 1]
  });
  const sample = field.sample(0, 0.25);
  expect(sample.status).toBe(Status.VALID);
  expect(sample.gradientStatus).toBe(Status.VALID);
  expect(Math.hypot(sample.normalX, sample.normalY, sample.normalZ)).toBeCloseTo(1, 14);
  const output = {
    heights: new Float32Array(1),
    statuses: new Uint8Array(1),
    gradients: new Float32Array(2),
    normals: new Float32Array(3),
    gradientStatuses: new Uint8Array(1)
  };
  field.sampleBatch(new Float64Array([0, 0.25]), output);
  expect(output.statuses[0]).toBe(Status.NUMERIC_ERROR);
  expect(output.heights[0]).toBe(0);
  expect(Array.from(output.normals)).toEqual([0, 0, 0]);
  const steep = new HeightField({
    width: 2,
    height: 2,
    heights: new Float64Array([0, 1e10, 0, 1e10]),
    columnStep: [1e-30, 0]
  });
  steep.sampleBatch(new Float64Array([0, 0]), output);
  expect(output.statuses[0]).toBe(Status.VALID);
  expect(output.gradientStatuses[0]).toBe(Status.NUMERIC_ERROR);
  expect(Array.from(output.gradients)).toEqual([0, 0]);
  expect(Array.from(output.normals)).toEqual([0, 0, 0]);
});
