// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mapLongitudeOffset,
  sampleLongitudeRow,
  wrapLongitude,
  geographicSource,
} from "./map-center.js";
import { sourceSample, sampleField } from "./discontinuous-views.js";

test("central meridian resamples geography periodically without bridging map seams", () => {
  const field = Float32Array.from({ length: 360 * 181 }, (_, i) =>
    Math.sin(((i % 360) * Math.PI) / 180),
  );
  for (const offset of [-180, -25.5, 0, 71.3, 180]) {
    for (const x of [0, 17, 359, 360]) {
      const source = geographicSource([x - 180, 20], offset);
      assert(
        Math.abs(
          sampleLongitudeRow(field, x, 110, offset) -
            sampleField(field, sourceSample(source)),
        ) < 1e-12,
      );
    }
    assert.equal(
      sampleLongitudeRow(field, 0, 110, offset),
      sampleLongitudeRow(field, 360, 110, offset),
    );
  }
});

test("fixed geographic layouts keep their masks and drag longitudes wrap", () => {
  assert.equal(mapLongitudeOffset(undefined, 60), 0);
  for (const view of ["globe", "eqearth", "waterman", "interruptedMollweide"])
    assert.equal(mapLongitudeOffset(view, 60), 60);
  for (const view of ["albersUsa", "albersEurope", "myriahedral:coastline"])
    assert.equal(mapLongitudeOffset(view, 60), 0);
  assert.equal(wrapLongitude(181), -179);
  assert.equal(wrapLongitude(-181), 179);
});

test("centered graticules retain actual geographic meridians and cache reprojection", async () => {
  const { centeredGraticules } = await import("./map-center.js");
  let calls = 0;
  const map = {
    projectLine: (sourceCoordinates) => {
      calls++;
      return [{ sourceCoordinates }];
    },
  };
  const parallel = { kind: "parallel" };
  const original = [parallel, { meridian: 0 }];
  assert.strictEqual(centeredGraticules(map, original, 0), original);
  const lines = centeredGraticules(map, original, 17);
  assert.strictEqual(lines[0], parallel);
  for (const [i, line] of lines.slice(1).entries()) {
    const geographic = wrapLongitude(line.sourceCoordinates[0][0] + 17);
    assert.equal(geographic, wrapLongitude(-180 + 30 * i));
  }
  assert.strictEqual(centeredGraticules(map, original, 17), lines);
  assert.equal(calls, 13);
});
