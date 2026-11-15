// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getGeographicTileBounds, type GeographicTile} from '@math.gl/geospatial';
import {
  createTerrainLodMorph,
  createTerrainMesh,
  discoverGeographicTerrainLodSeams,
  discoverGeographicTerrainPoles,
  evaluateTerrainLodMorph,
  HeightField,
  stitchTerrainLodCut,
  type TerrainSeamMesh
} from '@math.gl/geospatial/terrain';

type Vertex = [number, number, number];

/** Extract the actual indexed triangle segments on an edge, including inserted knots. */
function edge(mesh: TerrainSeamMesh, axis: 0 | 1, boundary: number): Vertex[] {
  const points = new Map<number, Vertex>();
  const segments = new Set<string>();
  const segmentKey = (a: number, b: number) => `${Math.min(a, b)}/${Math.max(a, b)}`;
  for (let i = 0; i < mesh.indices.length; i++) {
    const a = mesh.indices[i];
    const b = mesh.indices[i - (i % 3) + ((i + 1) % 3)];
    if (
      mesh.gridCoordinates[2 * a + axis] !== boundary ||
      mesh.gridCoordinates[2 * b + axis] !== boundary
    )
      continue;
    const key = segmentKey(a, b);
    expect(segments.has(key)).toBe(false);
    segments.add(key);
    for (const index of [a, b]) {
      points.set(index, [
        mesh.origin[0] + mesh.positions[3 * index],
        mesh.origin[1] + mesh.positions[3 * index + 1],
        mesh.origin[2] + mesh.positions[3 * index + 2]
      ]);
    }
  }
  const other = axis === 0 ? 1 : 0;
  const chain = [...points].sort(([, a], [, b]) => a[other] - b[other]);
  expect(chain.length).toBeGreaterThanOrEqual(2);
  expect(segments.size).toBe(chain.length - 1);
  for (let i = 1; i < chain.length; i++) {
    expect(segments.has(segmentKey(chain[i - 1][0], chain[i][0]))).toBe(true);
  }
  return chain.map(([, point]) => point);
}

for (const pole of [90, -90] as const) {
  for (const ratio of [2, 4]) {
    test(`geographic morph replay preserves mixed ${ratio}:1 seams and the ${pole}° pole`, () => {
      const coarseRow = pole === 90 ? 0 : 1;
      const level = 1 + Math.log2(ratio);
      const cut: GeographicTile[] = [{x: 0, y: coarseRow, level: 1}];
      for (let y = 0; y < ratio; y++) {
        for (let x = 0; x < ratio; x++) {
          cut.push({x: ratio + x, y: coarseRow * ratio + y, level});
        }
      }

      const morphs = cut.map((tile, index) => {
        const [west, south, east, north] = getGeographicTileBounds(tile);
        const dx = east - west;
        const dy = south - north;
        // The fine tiles have identical boundary heights and distinct interior relief.
        // The coarse owner adds a tent profile on its meridians, pinned at either end.
        const fine = new HeightField({
          width: 3,
          height: 3,
          origin: [west, north],
          columnStep: [dx / 2, 0],
          rowStep: [0, dy / 2],
          heights: Float64Array.from(
            {length: 9},
            (_, i) => 10 + (index === 0 && Math.floor(i / 3) === 1 ? 8 : i === 4 ? index : 0)
          )
        });
        const coarse = new HeightField({
          width: 2,
          height: 2,
          origin: fine.origin,
          columnStep: [dx, 0],
          rowStep: [0, dy],
          heights: new Float64Array(4).fill(10)
        });
        return createTerrainLodMorph(fine, coarse, {ratio: 2});
      });

      const seams = discoverGeographicTerrainLodSeams(cut);
      expect(seams).toHaveLength(2 * ratio);
      const coverage = discoverGeographicTerrainPoles(cut);
      const cap = pole === 90 ? coverage.north : coverage.south;
      expect(cap.gaps).toEqual([]);
      expect(cap.incident).toHaveLength(ratio + 1);
      const evicted = cut.filter((_, i) => i !== cap.incident[1].tile);
      expect(
        (pole === 90
          ? discoverGeographicTerrainPoles(evicted).north
          : discoverGeographicTerrainPoles(evicted).south
        ).gaps
      ).toEqual([[0, 180 / ratio]]);

      for (const frame of [0, 0.25, 0.5, 0.75, 1]) {
        const factors = morphs.map((_, i) => (i % 2 ? 1 - frame : frame));
        const meshes = morphs.map((morph, i) =>
          createTerrainMesh(
            new HeightField({...morph, ...evaluateTerrainLodMorph(morph, factors[i])})
          )
        );
        const output = stitchTerrainLodCut(
          meshes,
          seams.map(seam => ({
            ...seam,
            options: {...seam.options, maxHeightAdjustment: 8}
          }))
        );

        // Use addresses and an analytical tent, independently of the discovered spans.
        const west = edge(output[0], 0, 0);
        const east = edge(output[0], 0, 2);
        for (let y = 0; y < ratio; y++) {
          const first = 1 + y * ratio;
          const last = first + ratio - 1;
          for (const [chain, mesh, column] of [
            [east, output[first], 0],
            [west, output[last], 2]
          ] as const) {
            const fine = edge(mesh, 0, column);
            const lo = fine[0][1];
            const hi = fine[fine.length - 1][1];
            expect(fine.map(([, latitude, height]) => [latitude, height])).toEqual(
              chain
                .filter(p => p[1] >= lo && p[1] <= hi)
                .map(([, latitude, height]) => [latitude, height])
            );
            const middle = pole / 2;
            for (const [, latitude, height] of fine) {
              const tent = 1 - Math.abs(latitude - middle) / 45;
              expect(height).toBeCloseTo(10 + 8 * (1 - frame) * tent, 12);
            }
          }
        }

        // Fine-to-fine chains meet across all interior grid edges and at common corners.
        for (let y = 0; y < ratio; y++) {
          for (let x = 0; x < ratio; x++) {
            const i = 1 + y * ratio + x;
            if (x + 1 < ratio) expect(edge(output[i], 0, 2)).toEqual(edge(output[i + 1], 0, 0));
            if (y + 1 < ratio) expect(edge(output[i], 1, 2)).toEqual(edge(output[i + ratio], 1, 0));
          }
        }
        // All incident sectors share the same height at the collapsed geographic pole.
        for (const {tile, edge: side, longitude} of cap.incident) {
          const points = edge(output[tile], 1, side === 'north' ? 0 : 2);
          expect(points[0][0]).toBe(longitude[0]);
          expect(points[points.length - 1][0]).toBe(longitude[1]);
          for (const [, latitude, height] of points) expect([latitude, height]).toEqual([pole, 10]);
        }
        const interior =
          [...output[1].gridCoordinates].findIndex(
            (value, i, coords) => i % 2 === 0 && value === 1 && coords[i + 1] === 1
          ) / 2;
        expect(output[1].positions[3 * interior + 2] + output[1].origin[2]).toBeCloseTo(10 + frame);
      }
    });
  }
}
