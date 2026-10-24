// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DISCONTINUOUS_VIEWS,
  discontinuousGrid,
  sourceSample,
  sampleField,
} from "./discontinuous-views.js";

test("geographic field sampling wraps at the date line and stays within polar rows", () => {
  assert.deepEqual(sourceSample([-180, 30]), sourceSample([180, 30]));
  const field = Float32Array.from({ length: 360 * 181 }, (_, i) =>
    Math.floor(i / 360),
  );
  for (const latitude of [-90, -89.5, 12.75, 89.5, 90]) {
    const sample = sourceSample([179.75, latitude]);
    assert(sample.indices.every((index) => index >= 0 && index < field.length));
    assert(Math.abs(sampleField(field, sample) - (latitude + 90)) < 1e-9);
  }
});
for (const view of Object.keys(DISCONTINUOUS_VIEWS)) {
  test(`${view}: cached geometry and graticules remain local to each region`, () => {
    const grid = discontinuousGrid(view, 5);
    assert.equal(discontinuousGrid(view, 5), grid);
    assert(grid.indices.length > 0);
    assert(grid.positions.every(Number.isFinite));
    for (let i = 0; i < grid.indices.length; i += 3) {
      const ids = [...grid.indices.slice(i, i + 3)].map(
        (index) => grid.regionIds[index],
      );
      assert.equal(new Set(ids).size, 1, "triangles cannot bridge regions");
    }
    // Region lookup scans every panel; sample across the full grid for dense H3 nets.
    const stride = Math.max(1, Math.floor(grid.sources.length / 2000));
    for (let i = 0; i < grid.sources.length; i += stride) {
      assert(grid.map.findRegions(grid.sources[i]).includes(grid.regionIds[i]), `${view}: ${grid.sources[i]} in ${grid.regionIds[i]}, owners ${grid.map.findRegions(grid.sources[i])}`);
    }
    for (const part of grid.lines) {
      assert(part.coordinates.length > 1);
      for (let i = 0; i < part.coordinates.length; i++) {
        const point = grid.map.projectPoint(
          part.sourceCoordinates[i],
          part.regionId,
        );
        assert(point);
        assert(
          Math.hypot(
            point.position[0] - part.coordinates[i][0],
            point.position[1] - part.coordinates[i][1],
          ) < 1e-8,
        );
      }
    }
    if (view === "albersUsa")
      assert.deepEqual([...new Set(grid.regionIds)].sort(), [
        "alaska",
        "hawaii",
        "lower48",
      ]);
  });
}

test("layout metadata drives inset order and finer reference polygons retain all main Hawaiian islands", async () => {
  const { default: land } = await import("./assets/hawaii-land.json", {
    with: { type: "json" },
  });
  const grid = discontinuousGrid("albersUsa", 5);
  assert.deepEqual(
    grid.layout.regions.filter((r) => r.kind === "inset").map((r) => r.label),
    ["Alaska", "Hawaii"],
  );
  assert.equal(grid.referenceLand.length, 8);
  assert(grid.referenceLand.every((p) => p.regionId === "hawaii"));
  for (const polygon of land.geometry.coordinates)
    for (const ring of polygon)
      for (const p of ring)
        assert(
          grid.map.findRegions(p).includes("hawaii"),
          `Inset must include island vertex ${p}`,
        );
  assert.equal(
    discontinuousGrid("interruptedMollweide", 5).referenceLand.length,
    0,
  );
});

test("Albers USA insets use independent display mesh spacing", () => {
  const grid = discontinuousGrid("albersUsa", 1);
  const spacing = { lower48: 1, alaska: 0.5, hawaii: 0.25 };
  for (let i = 0; i < grid.sources.length; i++) {
    const step = spacing[grid.regionIds[i]];
    assert(step, `unexpected region ${grid.regionIds[i]}`);
    assert(grid.samples[i].indices.every((index) => index < 360 * 181));
  }
  const hasQuarterDegreeVertex = grid.sources.some(
    ([lon, lat], i) =>
      grid.regionIds[i] === "hawaii" &&
      (Math.abs(lon * 2 - Math.round(lon * 2)) > 1e-8 ||
        Math.abs(lat * 2 - Math.round(lat * 2)) > 1e-8),
  );
  const hasHalfDegreeVertex = grid.sources.some(
    ([lon, lat], i) =>
      grid.regionIds[i] === "alaska" &&
      (Math.abs(lon - Math.round(lon)) > 1e-8 ||
        Math.abs(lat - Math.round(lat)) > 1e-8),
  );
  assert(hasQuarterDegreeVertex);
  assert(hasHalfDegreeVertex);
  assert(
    grid.sources.some(
      ([lon], i) => grid.regionIds[i] === "alaska" && lon > 170,
    ),
    "Aleutian cells across the antimeridian must remain in the display mesh",
  );
  assert(
    grid.sources.some(
      ([lon], i) => grid.regionIds[i] === "alaska" && lon > 155 && lon < 168,
    ),
    "western Alaska mask cells must remain in the display mesh",
  );
  assert(
    grid.sources.some(
      ([, lat], i) => grid.regionIds[i] === "lower48" && lat > 54,
    ),
    "northern great-circle-edge cells must remain in the display mesh",
  );
});

// The spherical area catches missing/duplicated fan triangles, including at poles
// and the antimeridian, independently of the flattened layout's possible overlaps.
test("myriahedral meshes cover the sphere once and retain the source field", () => {
  const rad = Math.PI / 180;
  const sphere = ([lon, lat]) => [
    Math.cos(lon * rad) * Math.cos(lat * rad),
    Math.sin(lon * rad) * Math.cos(lat * rad),
    Math.sin(lat * rad),
  ];
  const dot = (a, b) => a.reduce((sum, x, i) => sum + x * b[i], 0);
  const field = Float32Array.from({ length: 360 * 181 }, (_, i) =>
    Math.floor(i / 360),
  );
  for (const view of Object.keys(DISCONTINUOUS_VIEWS).filter((id) =>
    id.startsWith("myriahedral:"),
  )) {
    const g = discontinuousGrid(view, 5);
    const vectors = g.sources.map(sphere);
    let area = 0;
    for (let i = 0; i < g.indices.length; i += 3) {
      const [a, b, c] = [...g.indices.slice(i, i + 3)].map(
        (index) => vectors[index],
      );
      const cross = [
        b[1] * c[2] - b[2] * c[1],
        b[2] * c[0] - b[0] * c[2],
        b[0] * c[1] - b[1] * c[0],
      ];
      area +=
        2 *
        Math.atan2(
          Math.abs(dot(a, cross)),
          1 + dot(a, b) + dot(b, c) + dot(c, a),
        );
    }
    // A5's sampled curved edges are faceted; constrained, nondegenerate
    // triangulation can shift spherical area by roughly one part in 10 million.
    const areaTolerance = view.startsWith("myriahedral:a5-") ? 1e-5 : 1e-8;
    assert(
      Math.abs(area - 4 * Math.PI) < areaTolerance,
      `${view} covers the sphere once`,
    );
    for (let i = 0; i < g.sources.length; i++) {
      const expected = g.map.projectPoint(
        g.sources[i],
        g.regionIds[i],
      ).position;
      assert(
        Math.hypot(
          expected[0] - g.positions[i * 2],
          expected[1] - g.positions[i * 2 + 1],
        ) < 1e-5,
      );
      assert(
        Math.abs(sampleField(field, g.samples[i]) - (g.sources[i][1] + 90)) <
          1e-8,
      );
    }
  }
});

test("cycling bounds cached mesh retention", () => {
  const first = discontinuousGrid("myriahedral:cylindric", 5);
  discontinuousGrid("myriahedral:azimuthal", 5);
  discontinuousGrid("myriahedral:hemispheres", 5);
  assert.equal(discontinuousGrid("myriahedral:cylindric", 5), first);
  discontinuousGrid("myriahedral:icosahedron", 5);
  assert.equal(
    discontinuousGrid("myriahedral:cylindric", 5),
    first,
    "recent mesh retained",
  );
  discontinuousGrid("myriahedral:coastline", 5);
  discontinuousGrid("myriahedral:sealine", 5);
  discontinuousGrid("myriahedral:polyconic", 5);
  assert.notEqual(
    discontinuousGrid("myriahedral:cylindric", 5),
    first,
    "old mesh evicted",
  );
});

test("cooperative grid preparation matches synchronous output and can be cancelled", async () => {
  const { prepareDiscontinuousGrid } = await import("./discontinuous-views.js");
  let yields = 0;
  const grid = await prepareDiscontinuousGrid("guyou", 30, {
    yieldTask: async () => {
      yields++;
    },
  });
  assert(yields > 0);
  assert.strictEqual(grid, discontinuousGrid("guyou", 30));
  assert(grid.indices.length > 0);
  const controller = new AbortController();
  await assert.rejects(
    prepareDiscontinuousGrid("waterman", 30, {
      signal: controller.signal,
      yieldTask: async () => controller.abort(),
    }),
    { name: "AbortError" },
  );
});

test("source triangulation preserves a clipped polygon's hole", async () => {
  const {triangulateSourcePolygon} = await import("./triangulate-source-polygon.js");
  const rings = [
    [[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]],
    [[1, 1], [1, 2], [2, 2], [2, 1], [1, 1]],
  ];
  const mesh = triangulateSourcePolygon({coordinates: rings, sourceCoordinates: rings});
  let area = 0;
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const [a, b, c] = mesh.indices.slice(i, i + 3).map(j => mesh.positions[j]);
    area += Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2;
  }
  assert(Math.abs(area - 15) < 1e-10);
});
