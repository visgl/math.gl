// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  createGeographicTerrainCutoutFrame,
  projectGeographicTerrainCutout,
  unprojectGeographicTerrainCutout,
  splitTerrainMesh,
  updateTerrainTileCutouts,
  createTerrainCutoutSkirts
} from '@math.gl/geospatial';

/** Independent Cartesian basis projection of a unit globe. */
function oracle(lon: number, lat: number, center: readonly [number, number], radius: number) {
  const d = Math.PI / 180;
  const unit = (a: number, b: number) => [
    Math.cos(b * d) * Math.cos(a * d),
    Math.cos(b * d) * Math.sin(a * d),
    Math.sin(b * d)
  ];
  const p = unit(lon, lat),
    normal = unit(...center);
  const east = [-Math.sin(center[0] * d), Math.cos(center[0] * d), 0];
  const north = [
    -Math.sin(center[1] * d) * Math.cos(center[0] * d),
    -Math.sin(center[1] * d) * Math.sin(center[0] * d),
    Math.cos(center[1] * d)
  ];
  const dot = (a: number[], b: number[]) => a.reduce((sum, v, i) => sum + v * b[i], 0);
  return [(radius * dot(p, east)) / dot(p, normal), (radius * dot(p, north)) / dot(p, normal)];
}

test('geographic chart agrees with independent 3D tangent-plane intersections', () => {
  for (const center of [
    [0, 0],
    [179, 20],
    [35, 90],
    [-80, -90]
  ] as const) {
    const frame = createGeographicTerrainCutoutFrame({center});
    const positions = Float64Array.of(
      center[0] + 3,
      Math.max(-89, Math.min(89, center[1] - 2)),
      -4300
    );
    const projected = projectGeographicTerrainCutout(positions, frame);
    const expected = oracle(positions[0], positions[1], center, frame.radius);
    expect(projected[0]).toBeCloseTo(expected[0], 7);
    expect(projected[1]).toBeCloseTo(expected[1], 7);
    expect(projected[2]).toBe(-4300);
    const inverse = unprojectGeographicTerrainCutout(projected, frame);
    expect(inverse[0]).toBeCloseTo(positions[0] > 180 ? positions[0] - 360 : positions[0], 11);
    expect(inverse[1]).toBeCloseTo(positions[1], 11);
    expect(inverse[2]).toBe(-4300);
  }
});

test('antimeridian aliases and duplicate pole longitudes produce identical coordinates', () => {
  const frame = createGeographicTerrainCutoutFrame({center: [180, 0]});
  expect(frame.center).toEqual([-180, 0]);
  const a = projectGeographicTerrainCutout(Float64Array.of(180, 1, 4), frame);
  expect(projectGeographicTerrainCutout(Float64Array.of(-180, 1, 4), frame)).toEqual(a);
  expect(projectGeographicTerrainCutout(Float64Array.of(540, 1, 4), frame)).toEqual(a);
  for (const sign of [-1, 1]) {
    const polar = createGeographicTerrainCutoutFrame({center: [20, sign * 90]});
    const pole = projectGeographicTerrainCutout(Float64Array.of(-140, sign * 90, 7), polar);
    expect(pole).toEqual(Float64Array.of(0, 0, 7));
    expect(projectGeographicTerrainCutout(Float64Array.of(160, sign * 90, 7), polar)).toEqual(pole);
    expect(unprojectGeographicTerrainCutout(pole, polar)).toEqual(
      Float64Array.of(20, sign * 90, 7)
    );
  }
});

test('dateline tiles cut together without longitude discontinuities and preserve bathymetry', () => {
  const frame = createGeographicTerrainCutoutFrame({center: [180, 0]});
  const tiles = [
    Float64Array.of(178, -1, -100, 180, -1, -100, 180, 1, -100, 178, 1, -100),
    Float64Array.of(-180, -1, -100, -178, -1, -100, -178, 1, -100, -180, 1, -100)
  ].map((positions, i) => ({
    id: String(i),
    revision: 0,
    mesh: {
      positions: projectGeographicTerrainCutout(positions, frame),
      indices: Uint32Array.of(0, 1, 2, 0, 2, 3)
    }
  }));
  const projected = projectGeographicTerrainCutout(
    Float64Array.of(179, -0.5, 0, -179, -0.5, 0, -179, 0.5, 0, 179, 0.5, 0),
    frame
  );
  const polygon = Array.from(
    {length: 4},
    (_, i) => [projected[i * 3], projected[i * 3 + 1]] as const
  );
  const cut = updateTerrainTileCutouts(tiles, polygon);
  for (const piece of cut.tiles.values()) {
    const skirts = createTerrainCutoutSkirts(piece, {
      lift: 100,
      patch: {baseZ: -200},
      remainder: {baseZ: -200}
    });
    expect(skirts.patch.skirt).toBeDefined();
    const restored = unprojectGeographicTerrainCutout(piece.patch.positions, frame);
    for (let i = 0; i < restored.length; i += 3) {
      expect(Math.abs(restored[i])).toBeGreaterThan(178.9);
      expect(restored[i + 2]).toBeCloseTo(-100, 12);
    }
  }
});

test('a north/south polar fan remains a valid planar surface for cutting', () => {
  for (const sign of [-1, 1]) {
    const frame = createGeographicTerrainCutoutFrame({center: [0, sign * 90]});
    const positions = Float64Array.of(
      0,
      sign * 90,
      -1,
      0,
      sign * 85,
      -1,
      90,
      sign * 85,
      -1,
      180,
      sign * 85,
      -1,
      -90,
      sign * 85,
      -1
    );
    const indices =
      sign === 1
        ? Uint32Array.of(0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 1)
        : Uint32Array.of(0, 2, 1, 0, 3, 2, 0, 4, 3, 0, 1, 4);
    const cut = splitTerrainMesh(
      {positions: projectGeographicTerrainCutout(positions, frame), indices},
      [
        [-100000, -100000],
        [100000, -100000],
        [100000, 100000],
        [-100000, 100000]
      ]
    );
    expect(cut.patch.indices.length).toBeGreaterThan(0);
    expect(cut.patch.cutEdges.length).toBeGreaterThan(0);
    expect(
      unprojectGeographicTerrainCutout(cut.patch.positions, frame).every(Number.isFinite)
    ).toBe(true);
  }
});

test('rejects malformed inputs, ambiguous global extents and invalid frames', () => {
  const frame = createGeographicTerrainCutoutFrame({center: [0, 0], maxAngularRadius: 20});
  for (const positions of [
    Float64Array.of(50, 0, 0),
    Float64Array.of(180, 0, 0),
    Float64Array.of(0, 91, 0),
    Float64Array.of(NaN, 0, 0),
    Float64Array.of(0)
  ])
    expect(() => projectGeographicTerrainCutout(positions, frame)).toThrow();
  expect(() => unprojectGeographicTerrainCutout(Float64Array.of(1e10, 0, 0), frame)).toThrow();
  for (const options of [
    {center: [0, 91] as const},
    {center: [NaN, 0] as const},
    {center: [0, 0] as const, radius: 0},
    {center: [0, 0] as const, maxAngularRadius: 90}
  ])
    expect(() => createGeographicTerrainCutoutFrame(options)).toThrow();
  expect(() =>
    projectGeographicTerrainCutout(new Float64Array(), {...frame, radius: NaN})
  ).toThrow();
  expect(projectGeographicTerrainCutout(new Float32Array(), frame)).toHaveLength(0);
});

test('projection validates packed shapes and prevents numerical overflow', () => {
  expect(() =>
    createGeographicTerrainCutoutFrame({center: [0, 0, 0] as unknown as [number, number]})
  ).toThrow();
  const frame = createGeographicTerrainCutoutFrame({
    center: [0, 0],
    radius: Number.MAX_VALUE,
    maxAngularRadius: 80
  });
  expect(() => projectGeographicTerrainCutout(Float64Array.of(70, 0, 0), frame)).toThrow(
    /overflow/
  );
  expect(() => unprojectGeographicTerrainCutout(Float64Array.of(Infinity, 0, 0), frame)).toThrow();
});

test('inclusive chart caps survive non-equatorial forward/inverse round trips', () => {
  for (const centerLatitude of Array.from({length: 33}, (_, i) => -80 + i * 5))
    for (const cap of [1, 5, 10, 20, 30, 40, 60, 80]) {
      const frame = createGeographicTerrainCutoutFrame({
        center: [0, centerLatitude],
        maxAngularRadius: cap
      });
      for (const latitude of [centerLatitude - cap, centerLatitude + cap]) {
        if (Math.abs(latitude) > 90) continue;
        const positions = Float64Array.of(0, latitude, -4000);
        const projected = projectGeographicTerrainCutout(positions, frame);
        const restored = unprojectGeographicTerrainCutout(projected, frame);
        expect(restored[1]).toBeCloseTo(latitude, 12);
        expect(restored[2]).toBe(-4000);
      }
      expect(() =>
        projectGeographicTerrainCutout(
          Float64Array.of(0, centerLatitude + cap + 0.000001, 0),
          frame
        )
      ).toThrow();
    }
});
