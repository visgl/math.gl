// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import {
  HeightField,
  createTerrainLodMorph,
  evaluateTerrainLodMorph,
  coordinateTerrainLodMorphs,
  createTerrainMixedIsobands,
  createTerrainMesh,
} from "../modules/geospatial/dist/terrain/index.js";
const folder = new URL(
    "../modules/geospatial/test/terrain/fixtures/",
    import.meta.url,
  ),
  results = [];
for (const name of ["sierra", "pacific", "sierra-nodata"])
  for (const ratio of [2, 4])
    for (const [coarseFactor, fineFactor] of [
      [0, 0],
      [1, 0],
      [0.5, 0.9],
      [0.2, 0.8],
    ]) {
      const fixture = JSON.parse(
        readFileSync(new URL(`${name}-reference.json`, folder), "utf8"),
      );
      const make = (column, row, spacing, factor) => {
        const heights = Float64Array.from(
          { length: 25 },
          (_, i) =>
            fixture.heights[
              (row + Math.floor(i / 5) * spacing) * 33 +
                column +
                (i % 5) * spacing
            ] ?? NaN,
        );
        const fine = new HeightField({
          width: 5,
          height: 5,
          origin: [column, row],
          columnStep: [spacing, 0],
          rowStep: [0, spacing],
          heights,
        });
        const coarse = new HeightField({
          width: 3,
          height: 3,
          origin: [column, row],
          columnStep: [2 * spacing, 0],
          rowStep: [0, 2 * spacing],
          heights: Float64Array.from(
            { length: 9 },
            (_, i) => fine.getHeight((i % 3) * 2, Math.floor(i / 3) * 2) ?? NaN,
          ),
        });
        return {
          column,
          row,
          spacing,
          morph: createTerrainLodMorph(fine, coarse, { ratio: 2 }),
          factor,
        };
      };
      const input = [
          make(0, 0, ratio, coarseFactor),
          make(4 * ratio, 0, 1, fineFactor),
          make(4 * ratio, 4, 1, 1 - fineFactor),
        ],
        start = performance.now();
      const coordinated = coordinateTerrainLodMorphs(input),
        source = input.map((t) => ({
          column: t.column,
          row: t.row,
          spacing: t.spacing,
          field: {
            ...evaluateTerrainLodMorph(t.morph, t.factor),
            width: 5,
            height: 5,
            origin: t.morph.origin,
            columnStep: t.morph.columnStep,
            rowStep: t.morph.rowStep,
          },
        }));
      const heights = input.flatMap((t) => Array.from(t.morph.fineHeights)),
        min = Math.min(...heights),
        max = Math.max(...heights),
        bands = createTerrainMixedIsobands(
          source,
          [min - 1, (min + max) / 2, max + 1],
          { maxHeightAdjustment: Infinity },
        );
      const milliseconds = performance.now() - start,
        points = new Map();
      let sharedChecks = 0,
        expectedArea = 0;
      for (const tile of coordinated.tiles) {
        for (let y = 0; y < tile.field.height; y++)
          for (let x = 0; x < tile.field.width; x++) {
            const i = y * tile.field.width + x,
              key = `${tile.column + x},${tile.row + y}`,
              value = [tile.field.validity[i], tile.field.heights[i]];
            const prior = points.get(key);
            if (prior) {
              sharedChecks++;
              if (prior[0] !== value[0] || prior[1] !== value[1])
                throw new Error("Shared transition sample mismatch");
            } else points.set(key, value);
          }
        expectedArea +=
          createTerrainMesh(new HeightField(tile.field)).indices.length / 6;
      }
      let area = 0;
      for (let ring = 0; ring < bands.parents.length; ring++)
        for (
          let i = bands.offsets[ring];
          i + 1 < bands.offsets[ring + 1];
          i++
        ) {
          const a = bands.indices[i],
            b = bands.indices[i + 1];
          area +=
            (bands.positions[2 * a] * bands.positions[2 * b + 1] -
              bands.positions[2 * b] * bands.positions[2 * a + 1]) /
            2;
        }
      const areaResidual = Math.abs(area - expectedArea);
      if (areaResidual > 1e-8)
        throw new Error(
          `Mixed band coverage mismatch ${name}/${ratio}: ${areaResidual}`,
        );
      results.push({
        name,
        ratio,
        coarseFactor,
        fineFactor,
        milliseconds,
        nativeSamples: 75,
        transitionSamples: coordinated.tiles.reduce(
          (n, t) => n + t.field.width * t.field.height,
          0,
        ),
        sharedChecks,
        maxHeightAdjustment: coordinated.maxHeightAdjustment,
        rings: bands.parents.length,
        coveredSampleGridArea: area,
        areaResidual,
      });
    }
console.log(
  JSON.stringify(
    {
      runtime: process.version,
      platform: `${process.platform}/${process.arch}`,
      scope:
        "Bounded CPU reference transition tessellation, not sparse LOD selection. Real DEM heights use unit sample-grid XY for coverage checks. Independent factors, partial edges and nodata are compared against coordinated regular-mesh triangle area. Timings include both reconciliation and band generation, are single observations and are not regional throughput claims.",
      results,
    },
    null,
    2,
  ),
);
