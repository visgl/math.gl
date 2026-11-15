// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {subdivideTriangleMesh} from '@math.gl/geometry';
import type {SubdividedTriangleMesh, SubdivideTriangleMeshOptions} from '@math.gl/geometry';

// Pins the exact output and the transform call count of representative refinements.
// The digests were captured from the implementation that sampled every face in every round.

const DEG = Math.PI / 180;

function grid(cells: number): {positions: number[]; indices: number[]} {
  const positions: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= cells; row++) {
    for (let column = 0; column <= cells; column++) positions.push(column / cells, row / cells);
  }
  for (let row = 0; row < cells; row++) {
    for (let column = 0; column < cells; column++) {
      const a = row * (cells + 1) + column;
      const b = a + 1;
      const c = a + cells + 1;
      const d = c + 1;
      indices.push(a, b, d, a, d, c);
    }
  }
  return {positions, indices};
}

/** Tile UV to lng/lat through Web Mercator, as a raster tile mesh does. */
function tileToLngLat(z: number, x: number, y: number, u: number, v: number): [number, number] {
  const scale = 2 ** z;
  const worldX = (x + u) / scale;
  const worldY = (y + v) / scale;
  const lng = worldX * 360 - 180;
  const lat = (Math.atan(Math.sinh(Math.PI * (1 - 2 * worldY))) * 180) / Math.PI;
  return [lng, lat];
}

/** Spherical transverse Mercator, in meters. */
function transverseMercator(lng: number, lat: number, centralLng: number): [number, number] {
  const radius = 6378137;
  const lambda = (lng - centralLng) * DEG;
  const phi = lat * DEG;
  const b = Math.cos(phi) * Math.sin(lambda);
  return [
    (radius / 2) * Math.log((1 + b) / (1 - b)),
    radius * Math.atan2(Math.tan(phi), Math.cos(lambda))
  ];
}

/** Spherical north polar stereographic, in meters. */
function polarStereographic(lng: number, lat: number): [number, number] {
  const radius = 6378137;
  const rho = 2 * radius * Math.tan(Math.PI / 4 - (lat * DEG) / 2);
  return [rho * Math.sin(lng * DEG), -rho * Math.cos(lng * DEG)];
}

function geocentric(lng: number, lat: number, height: number): [number, number, number] {
  const a = 6378137;
  const e2 = 0.00669437999014;
  const phi = lat * DEG;
  const lambda = lng * DEG;
  const n = a / Math.sqrt(1 - e2 * Math.sin(phi) ** 2);
  return [
    (n + height) * Math.cos(phi) * Math.cos(lambda),
    (n + height) * Math.cos(phi) * Math.sin(lambda),
    (n * (1 - e2) + height) * Math.sin(phi)
  ];
}

const tile = (z: number, x: number, y: number, centralLng: number) => (uv: readonly number[]) => [
  ...transverseMercator(...tileToLngLat(z, x, y, uv[0], uv[1]), centralLng),
  0
];

type Case = {
  name: string;
  mesh: {positions: number[]; indices: number[]};
  options: Omit<SubdivideTriangleMeshOptions, 'transform'> & {
    transform: (position: readonly number[]) => ArrayLike<number> | null;
  };
  /** FNV-1a digests of every output array, or the error message for a rejected mesh. */
  expected: string;
  /** Transform calls, then errorMetric calls. */
  calls: [number, number];
};

const CASES: Case[] = [
  {
    name: 'affine transform needs no refinement',
    mesh: grid(4),
    options: {
      transform: p => [p[0] * 2 + 10, p[1] * 3 - 1],
      tolerance: 1e-3
    },
    expected:
      'v25 t32 400:1239d125 400:8ab9ff41 384:cd26d755 300:0ef0858d 600:acf9acf8 128:80421a45',
    calls: [441, 0]
  },
  {
    name: 'raster tile far from the transverse Mercator central meridian',
    mesh: grid(4),
    options: {
      transform: tile(6, 40, 20, 9),
      targetSize: 3,
      size: 2,
      tolerance: 30
    },
    expected:
      'v1089 t2048 17424:6834e171 26136:1a27221f 24576:03ba8b2a 13068:3e524085 26136:1f0cc5f8 8192:299addc5',
    calls: [36449, 0]
  },
  {
    name: 'raster tile near the transverse Mercator central meridian',
    mesh: grid(4),
    options: {
      transform: tile(9, 268, 170, 9),
      targetSize: 3,
      size: 2,
      tolerance: 0.5
    },
    expected:
      'v289 t512 4624:9ba2d4d5 6936:728e9339 6144:c417f930 3468:643799c5 6936:734236f8 2048:07742dc5',
    calls: [9025, 0]
  },
  {
    name: 'lng/lat quad in polar stereographic',
    mesh: {
      positions: [-60, 60, 60, 60, 60, 85, -60, 85],
      indices: [0, 1, 2, 0, 2, 3]
    },
    options: {
      transform: p => polarStereographic(p[0], p[1]),
      tolerance: 2000
    },
    expected:
      'v1994 t3808 31904:88a32de6 31904:7068c313 45696:1758751c 23928:8e74e9b5 47856:8f091a02 15232:71edf5e5',
    calls: [68268, 0]
  },
  {
    name: 'maxDepth is exhausted',
    mesh: grid(2),
    options: {
      transform: tile(3, 6, 2, 9),
      targetSize: 3,
      tolerance: 1e-3,
      maxDepth: 3
    },
    expected: 'throws Triangle mesh subdivision exceeded maxDepth',
    calls: [9129, 0]
  },
  {
    name: 'errorMetric that also overwrites its sample arrays',
    mesh: grid(2),
    options: {
      transform: p => [p[0], p[1] + Math.sin(3 * p[0]) * Math.cos(2 * p[1])],
      tolerance: 0.02,
      errorMetric: sample => {
        const value = Math.hypot(
          4 * (sample.exact[0] - sample.interpolated[0]),
          sample.exact[1] - sample.interpolated[1]
        );
        (sample.source as number[]).fill(100);
        (sample.exact as number[]).fill(100);
        (sample.interpolated as number[]).fill(100);
        return value;
      }
    },
    expected:
      'v171 t294 2736:2e7d61b4 2736:efea5128 3528:af0fad94 2052:49ce8309 4104:a6c45d94 1176:0f284581',
    calls: [5423, 5252]
  },
  {
    name: 'XYZ source to geocentric output',
    mesh: {
      positions: [0, 0, 0, 40, 0, 1000, 0, 40, 5000],
      indices: [0, 1, 2]
    },
    options: {
      transform: p => geocentric(p[0], p[1], p[2]),
      size: 3,
      tolerance: 5000
    },
    expected:
      'v153 t256 3672:38b06d49 3672:2bdba9bc 3072:e920047e 1836:653d2305 3672:ce208d5d 1024:1f116dc5',
    calls: [4586, 0]
  },
  {
    name: 'transform error with a source edge limit',
    mesh: grid(2),
    options: {
      transform: p => polarStereographic(p[0] * 90, 50 + p[1] * 30),
      tolerance: 5000,
      maxEdgeLength: 0.2
    },
    expected:
      'v1089 t2048 17424:ec5007fd 17424:86cad79b 24576:6df22b3d 13068:11e731f1 26136:c0a63fc8 8192:cc58bdc5',
    calls: [36553, 0]
  },
  {
    name: 'source-edge refinement',
    mesh: grid(2),
    options: {
      refinement: 'source-edge',
      maxEdgeLength: 0.15,
      transform: p => polarStereographic(p[0] * 90, 50 + p[1] * 30)
    },
    expected:
      'v145 t256 2320:638abb65 2320:5e96a699 3072:4bc54985 1740:d336a591 3480:7bf4c438 1024:121821c5',
    calls: [145, 0]
  },
  {
    name: 'signed zero sources stay distinct',
    // Vertex (-0, 0.5) and the +0 midpoint of the second triangle's left edge compare equal.
    mesh: {
      positions: [-0, 0.5, -1, 1, -1, 0, 0, 0, 1, 0.5, 0, 1],
      indices: [0, 1, 2, 3, 4, 5]
    },
    options: {
      transform: ([x, y]) => [x, y + 4 * x * x + (Object.is(x, -0) ? 0.01 : 0)],
      tolerance: 0.05
    },
    expected:
      'v90 t128 1440:d4787de5 1440:b45bab8c 1536:76073fb5 1080:df904005 2160:6c7999a5 512:457623c5',
    calls: [2300, 0]
  }
];

test.each(CASES)('$name: output is unchanged', ({mesh, options, expected}) => {
  expect(run(mesh, options).digest).toBe(expected);
});

test.each(CASES)('$name: transform call count', ({mesh, options, calls}) => {
  expect(run(mesh, options).calls).toEqual(calls);
});

test('a nonfinite sample inside the domain still rejects the mesh', () => {
  for (const options of [{}, {errorMetric: () => 1}]) {
    expect(() =>
      subdivideTriangleMesh(grid(4), {
        transform: p => {
          const [lng, lat] = tileToLngLat(6, 40, 20, p[0], p[1]);
          return Math.hypot(p[0] - 0.4, p[1] - 0.6) < 0.05
            ? [NaN, 0]
            : transverseMercator(lng, lat, 9);
        },
        tolerance: 30,
        ...options
      })
    ).toThrow(RangeError);
  }
});

function run(
  mesh: Case['mesh'],
  options: Case['options']
): {digest: string; calls: [number, number]} {
  let transformCalls = 0;
  let metricCalls = 0;
  const counted = {
    ...options,
    transform: (position: readonly number[]) => {
      transformCalls++;
      return options.transform(position);
    }
  } as SubdivideTriangleMeshOptions;
  if ('errorMetric' in options && options.errorMetric) {
    const metric = options.errorMetric;
    (counted as {errorMetric: typeof metric}).errorMetric = sample => {
      metricCalls++;
      return metric(sample);
    };
  }
  let digest: string;
  try {
    digest = digestResult(subdivideTriangleMesh(mesh, counted));
  } catch (error) {
    digest = `throws ${(error as Error).message}`;
  }
  return {digest, calls: [transformCalls, metricCalls]};
}

function digestResult(result: SubdividedTriangleMesh): string {
  return [
    `v${result.sourceVertexIndices.length / 3}`,
    `t${result.sourceTriangleIndices.length}`,
    fnv(result.sourcePositions),
    fnv(result.positions),
    fnv(result.indices),
    fnv(result.sourceVertexIndices),
    fnv(result.sourceVertexWeights),
    fnv(result.sourceTriangleIndices)
  ].join(' ');
}

function fnv(array: ArrayBufferView): string {
  const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
  let hash = 0x811c9dc5;
  for (const byte of bytes) hash = Math.imul(hash ^ byte, 0x01000193) >>> 0;
  return `${bytes.length}:${hash.toString(16).padStart(8, '0')}`;
}
