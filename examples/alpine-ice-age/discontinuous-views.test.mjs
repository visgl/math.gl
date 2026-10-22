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
    for (let i = 0; i < grid.sources.length; i++) {
      assert(grid.map.findRegions(grid.sources[i]).includes(grid.regionIds[i]));
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
