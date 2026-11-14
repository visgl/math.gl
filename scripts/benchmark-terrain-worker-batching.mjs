// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { bundleRuntime } from "../modules/geospatial/scripts/projection/benchmark-runtime.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const fixtures = new URL(
  "../modules/geospatial/test/terrain/fixtures/",
  import.meta.url,
);
const key = ({ spacing, column, row }) => `${spacing}/${column}/${row}`;
const tileBytes = (tile) =>
  tile.field.heights.byteLength +
  tile.field.validity.byteLength +
  tile.statuses.byteLength;

function percentiles(times) {
  const sorted = [...times].sort((a, b) => a - b);
  const quantile = (p) => sorted[Math.ceil(sorted.length * p) - 1];
  return { p50: quantile(0.5), p95: quantile(0.95), p99: quantile(0.99) };
}

function readSource(name) {
  const dem = JSON.parse(
    readFileSync(new URL(name + "-streaming.json", fixtures)),
  );
  const raster = readFileSync(new URL(name.split("-")[0] + ".tif", fixtures));
  assert.equal(createHash("sha256").update(raster).digest("hex"), dem.sha256);

  function tile(column, row, spacing) {
    const width = 9;
    return {
      column,
      row,
      spacing,
      field: {
        width,
        height: width,
        origin: [column, row],
        columnStep: [spacing, 0],
        rowStep: [0, spacing],
        heightReference: dem.heightReference,
        heights: Float64Array.from(
          { length: width * width },
          (_, i) =>
            dem.heights[
              (row + Math.floor(i / width) * spacing) * dem.width +
                column +
                (i % width) * spacing
            ] ?? NaN,
        ),
      },
    };
  }

  const coarse = Array.from({ length: 64 }, (_, i) =>
    tile((i % 8) * 32, Math.floor(i / 8) * 32, 4),
  );
  const fine = Array.from({ length: 16 }, (_, i) =>
    tile(96 + (i % 4) * 8, 96 + Math.floor(i / 4) * 8, 1),
  );
  return { source: [...coarse, ...fine], sha256: dem.sha256 };
}

function makeEvents(source, burstSize) {
  return Array.from({ length: 128 }, (_, i) => {
    // Revisit the same tile within bursts and exercise both edge and interior samples.
    const { column, row, spacing, field } =
      source[(Math.floor(i / 2) * 17) % source.length];
    const index = i % 3 === 0 ? 80 : 40;
    const initial = field.heights[index];
    const height =
      i % 7 === 0 ? null : (Number.isFinite(initial) ? initial : 0) + i + 1;
    return {
      arrivalMs: Math.floor(i / burstSize) * 8,
      edit: {
        type: "samples",
        address: { column, row, spacing },
        samples: [{ index, height }],
      },
    };
  });
}

async function replay(
  handle,
  events,
  revision,
  outputOwnership,
  maxBatchSize,
  maxWaitMs,
) {
  const start = performance.now();
  const commits = [];
  let cursor = 0;
  while (cursor < events.length) {
    const first = events[cursor];
    const limit = Math.min(cursor + maxBatchSize, events.length);
    const deadline = first.arrivalMs + maxWaitMs;
    let end = cursor + 1;
    while (end < limit && events[end].arrivalMs <= deadline) end++;
    // A full batch or the end of the stream can dispatch immediately.
    const readyMs = end === limit ? events[end - 1].arrivalMs : deadline;
    let remainingMs = readyMs - (performance.now() - start);
    while (remainingMs > 0) {
      await delay(remainingMs);
      remainingMs = readyMs - (performance.now() - start);
    }
    const batch = events.slice(cursor, end);
    const sentMs = performance.now() - start;
    const delta = await handle.runTask(
      { revision, edits: batch.map((event) => event.edit) },
      { outputOwnership },
    );
    const ackMs = performance.now() - start;
    assert.equal(delta.error, undefined);
    assert.equal(delta.revision, ++revision);
    commits.push({ batch, delta, sentMs, ackMs });
    cursor = end;
  }
  return commits;
}

function verify(source, seed, commits, rebuild) {
  const input = new Map(source.map((tile) => [key(tile), tile]));
  let previous = rebuild(source).tiles;
  assert.deepEqual(seed.tiles, previous);
  const cache = new Map(seed.tiles.map((tile) => [key(tile), tile]));
  const rebuildMs = [];
  for (const { batch, delta } of commits) {
    for (const { edit } of batch) {
      const address = key(edit.address);
      const tile = input.get(address);
      const heights = tile.field.heights.slice();
      for (const { index, height } of edit.samples)
        heights[index] = height ?? NaN;
      input.set(address, { ...tile, field: { ...tile.field, heights } });
    }
    const start = performance.now();
    const full = rebuild([...input.values()]).tiles;
    rebuildMs.push(performance.now() - start);
    const changed = full.filter((tile, i) => {
      const old = previous[i];
      return (
        tile.statuses.some((value, j) => value !== old.statuses[j]) ||
        tile.field.validity.some(
          (value, j) => value !== old.field.validity[j],
        ) ||
        tile.field.heights.some(
          (value, j) => !Object.is(value, old.field.heights[j]),
        )
      );
    });
    assert.deepEqual(delta.tiles, changed);
    assert.deepEqual(delta.removed, []);
    for (const tile of delta.tiles) cache.set(key(tile), tile);
    assert.deepEqual(
      full.map((tile) => cache.get(key(tile))),
      full,
    );
    previous = full;
  }
  return { final: previous, rebuildMs: percentiles(rebuildMs) };
}

const directory = mkdtempSync(join(tmpdir(), "terrain-worker-batching-"));
try {
  const entries = [
    "geospatial/src/terrain/index.ts",
    "tasks/src/index.ts",
    "geospatial/src/tasks/terrain-residency.ts",
    "geospatial/src/tasks/terrain-residency-worker.ts",
  ];
  const modules = [];
  for (const [i, entry] of entries.entries()) {
    const output = join(directory, i + ".mjs");
    await bundleRuntime(root, "./modules/" + entry, output, undefined, "node");
    modules.push(pathToFileURL(output));
  }
  const { createTerrainMixedVertexTileHalos } = await import(modules[0]);
  const { TaskRunner } = await import(modules[1]);
  const { TerrainResidencyTask } = await import(modules[2]);
  const task = {
    ...TerrainResidencyTask,
    worker: {
      url: modules[3],
      capabilities: { atomic: true, streaming: false },
    },
  };
  const runner = new TaskRunner();
  const results = [];
  try {
    for (const name of ["pacific", "sierra-nodata"]) {
      const { source, sha256 } = readSource(name);
      for (const burstSize of [1, 8]) {
        const events = makeEvents(source, burstSize);
        let expected;
        for (const outputOwnership of ["copy", "transfer"]) {
          for (const maxBatchSize of [1, 2, 4, 8]) {
            const maxWaitMs = maxBatchSize === 1 ? 0 : 2;
            const handle = await runner.initializeTask(
              task,
              {},
              { execution: "worker" },
            );
            try {
              const upserts = source.map((tile) => ({ type: "upsert", tile }));
              await handle.runTask(
                { revision: 0, edits: upserts },
                { outputOwnership },
              );
              const warmup = await handle.runTask(
                {
                  revision: 1,
                  edits: events.slice(0, 16).map((event) => event.edit),
                },
                { outputOwnership },
              );
              assert.equal(warmup.revision, 2);
              const reset = await handle.runTask(
                { revision: 2, edits: upserts },
                { outputOwnership },
              );
              assert.equal(reset.revision, 3);
              const seed = await handle.runTask(
                { type: "snapshot" },
                { outputOwnership },
              );
              assert.equal(seed.revision, 3);
              const commits = await replay(
                handle,
                events,
                seed.revision,
                outputOwnership,
                maxBatchSize,
                maxWaitMs,
              );
              const { final, rebuildMs } = verify(
                source,
                seed,
                commits,
                createTerrainMixedVertexTileHalos,
              );
              expected ??= final;
              assert.deepEqual(final, expected);
              results.push({
                name,
                sha256,
                burstSize,
                outputOwnership,
                maxBatchSize,
                maxWaitMs,
                edits: events.length,
                commits: commits.length,
                editToAckMs: percentiles(
                  commits.flatMap(({ batch, ackMs }) =>
                    batch.map((event) => ackMs - event.arrivalMs),
                  ),
                ),
                arrivalToSendMs: percentiles(
                  commits.flatMap(({ batch, sentMs }) =>
                    batch.map((event) => sentMs - event.arrivalMs),
                  ),
                ),
                requestMs: percentiles(
                  commits.map(({ sentMs, ackMs }) => ackMs - sentMs),
                ),
                directRebuildMs: rebuildMs,
                outputBytes: commits.reduce(
                  (total, { delta }) =>
                    total +
                    delta.tiles.reduce((sum, tile) => sum + tileBytes(tile), 0),
                  0,
                ),
              });
            } finally {
              await handle.close();
            }
          }
        }
      }
    }
  } finally {
    await runner.close();
  }
  const revision = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  }).trim();
  console.log(
    JSON.stringify(
      {
        revision,
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        processPeakRssKiB: process.resourceUsage().maxRSS,
        results,
      },
      null,
      2,
    ),
  );
} finally {
  rmSync(directory, { recursive: true, force: true });
}
