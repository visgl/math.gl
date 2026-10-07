// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { interpolateField, sampleAt } from "./data.js";
const manifest = JSON.parse(
  readFileSync(new URL("./data/manifest.json", import.meta.url)),
);
const packed = readFileSync(new URL("./data/alpine.bin.gz", import.meta.url));
const raw = gunzipSync(packed);
test("the bundled simulation is complete, ordered and pinned to its published source", () => {
  assert.equal(manifest.source.md5, "0b59b7c26bb8d1b1797c9414638a2f32");
  assert.equal(
    createHash("sha256").update(packed).digest("hex"),
    manifest.assetSha256,
  );
  assert.equal(
    raw.byteLength,
    manifest.width * manifest.height * 2 * (manifest.ages.length + 1),
  );
  assert.equal(manifest.ages.length, 120);
  assert.equal(manifest.ages[0], 119);
  assert.equal(manifest.ages.at(-1), 0);
  manifest.ages
    .slice(1)
    .forEach((age, i) => assert.equal(age, manifest.ages[i] - 1));
  assert.equal(manifest.source.license, "CC-BY-4.0");
  assert(manifest.areaKm2[95] > manifest.areaKm2.at(-1));
  assert(manifest.volumeKm3[95] > manifest.volumeKm3.at(-1));
});
test("interpolation preserves snapshots, handles endpoints and never extrapolates", () => {
  const ages = [2, 1, 0],
    data = new Uint16Array([0, 10, 20, 30, 0, 50]);
  assert.deepEqual(Array.from(interpolateField(data, 2, ages, 2)), [0, 10]);
  assert.deepEqual(Array.from(interpolateField(data, 2, ages, 1.5)), [10, 20]);
  assert.deepEqual(Array.from(interpolateField(data, 2, ages, 1)), [20, 30]);
  assert.deepEqual(Array.from(interpolateField(data, 2, ages, 0)), [0, 50]);
  assert.deepEqual(Array.from(interpolateField(data, 2, ages, -10)), [0, 50]);
  assert.deepEqual(sampleAt(ages, 10), { index: 0, fraction: 0 });
});
const globalManifest = JSON.parse(
  readFileSync(new URL("./data/global-manifest.json", import.meta.url)),
);
const globalPacked = readFileSync(
  new URL("./data/global.bin.gz", import.meta.url),
);
const globalRaw = gunzipSync(globalPacked);
test("global reconstruction preserves its full time range, source and longitude seam", () => {
  const m = globalManifest,
    count = m.width * m.height,
    length = count * m.ages.length;
  assert.equal(
    m.source.sha256,
    "ab6f74541339f5be44dd630dfb9c41189a6c1dfaf58fce6fc3c356430b539037",
  );
  assert.equal(m.source.license, "CC-BY-4.0");
  assert.equal(
    createHash("sha256").update(globalPacked).digest("hex"),
    m.assetSha256,
  );
  assert.equal(globalRaw.byteLength, length * 4);
  assert.equal(m.width, 360);
  assert.equal(m.height, 181);
  assert.deepEqual(
    m.ages,
    Array.from({ length: 33 }, (_, i) => 80 - i * 2.5),
  );
  const ice = new Uint16Array(
    globalRaw.buffer,
    globalRaw.byteOffset + length * 2,
    length,
  );
  const at = (age, lon, lat) =>
    ice[m.ages.indexOf(age) * count + (lat + 90) * 360 + (lon + 180)];
  assert(
    at(20, -90, 60) > 1000,
    "Laurentide ice sheet must be present at the maximum",
  );
  assert.equal(at(0, -90, 60), 0, "Laurentide interior must deglaciate");
  assert(at(0, -45, 75) > 1000, "Greenland must retain present grounded ice");
  assert(at(0, 0, -85) > 1000, "Antarctica must retain present grounded ice");
  assert.equal(
    at(20, 20, 0),
    0,
    "The equatorial continent must not gain invented ice",
  );
  assert(m.areaKm2[m.ages.indexOf(20)] > m.areaKm2.at(-1) * 2);
  assert(m.volumeKm3[m.ages.indexOf(20)] > m.volumeKm3.at(-1) * 2);
});

import { projectionWeights } from "./projection-transition.js";
test("projection transitions preserve endpoints and continuous interrupted shapes", () => {
  assert.deepEqual(projectionWeights({ globe: 1 }, "eqearth", 0), { globe: 1 });
  assert.deepEqual(projectionWeights({ globe: 1 }, "eqearth", 1), {
    eqearth: 1,
  });
  const midway = projectionWeights({ globe: 1 }, "eqearth", 0.5);
  assert.deepEqual(midway, { globe: 0.5, eqearth: 0.5 });
  assert.deepEqual(projectionWeights(midway, "merc", 0), midway);
  for (let i = 0; i <= 20; i++) {
    const values = Object.values(projectionWeights(midway, "merc", i / 20));
    assert(values.every((value) => value >= 0 && value <= 1));
    assert(Math.abs(values.reduce((a, b) => a + b, 0) - 1) < 1e-12);
  }
  assert.deepEqual(projectionWeights(midway, "merc", 1), { merc: 1 });
});

import { glacialPhase } from "./glacial-phase.js";
test("timeline chapters change phase labels while keeping regional glaciation names meaningful", () => {
  assert.equal(glacialPhase(119), "Last interglacial");
  assert.equal(glacialPhase(80), "Last glacial period");
  assert.equal(glacialPhase(60), "Last glacial period");
  assert.equal(glacialPhase(24), "Last glacial maximum");
  assert.equal(glacialPhase(20), "Last glacial maximum");
  assert.equal(glacialPhase(14), "Glacial retreat");
  assert.equal(glacialPhase(0), "Holocene");
});

test("climate context preserves source samples and never extrapolates albedo", async () => {
  const { climateAt } = await import("./climate.js");
  assert.equal(climateAt(0).temperature, 0);
  assert.equal(climateAt(0).albedo, null);
  assert.equal(climateAt(1).albedo, null);
  assert.equal(climateAt(20).albedo, -3.9495);
  assert.ok(climateAt(20).temperature < -3);
  assert.equal(climateAt(21).albedo, (-3.9495 - 3.8135) / 2);
});
