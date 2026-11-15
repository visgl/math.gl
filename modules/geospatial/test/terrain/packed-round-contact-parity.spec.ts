// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  createTerrainMesh,
  HeightField,
  packTerrainHeightField,
  sweepTerrainRotatingCapsule,
  sweepTerrainRotatingSphere,
  TerrainSurface,
  unpackTerrainHeightField
} from '@math.gl/geospatial/terrain';
import corpus from './fixtures/packed-round-contact-parity.json';
import pacific from './fixtures/pacific-streaming.json';
import sierra from './fixtures/sierra-nodata-streaming.json';

/** Read a serialized Cartesian point. */
const point = ([x, y, z]: number[]) => [x, y, z] as const;

for (const fixture of corpus.fixtures) {
  test(`${fixture.source} packed round contacts at ${fixture.scenario}`, () => {
    const source = fixture.source === 'pacific' ? pacific : sierra;
    const [column, row] = fixture.pixelWindow;
    expect(fixture.sourceSha256).toBe(source.sha256);
    const meshes = fixture.tiles.map(tile => {
      const [x, y, heightOrigin] = tile.origin;
      const expectedSamples = Array.from(
        {length: 15},
        (_, i) =>
          source.heights[(row + y + Math.floor(i / 3)) * source.width + column + x + (i % 3)]
      );
      expect(tile.heights).toEqual(expectedSamples);
      const expectedHeights = new Float32Array(Uint32Array.from(tile.heightWords).buffer);
      const packed = packTerrainHeightField(
        new HeightField({
          width: 3,
          height: 5,
          origin: [x, y],
          heights: Float64Array.from(tile.heights, value => value ?? NaN)
        }),
        {heightOrigin}
      );
      expect([...packed.header]).toEqual(corpus.header);
      // Signed zero has the same transform semantics for this identity lattice.
      expect(Array.from(packed.transform, value => value + 0)).toEqual(corpus.transform);
      expect(packed.origin).toEqual(tile.origin);
      expect(packed.heights).toEqual(expectedHeights);
      expect([...packed.validity]).toEqual(tile.validity);
      return createTerrainMesh(unpackTerrainHeightField(packed), {origin: [0, 0, heightOrigin]});
    });
    for (const order of [meshes, [...meshes].reverse()]) {
      const positions: number[] = [];
      const indices: number[] = [];
      for (const mesh of order) {
        const offset = positions.length / 3;
        positions.push(...mesh.positions);
        indices.push(...Array.from(mesh.indices, index => index + offset));
      }
      const surface = new TerrainSurface({
        positions: Float64Array.from(positions),
        indices: Uint32Array.from(indices)
      });
      for (const {
        shape,
        start,
        end,
        pivot,
        rotation: [x, y, z, w],
        translation,
        radius,
        expected
      } of fixture.cases) {
        const motion = {
          pivot: point(pivot),
          rotation: [x, y, z, w] as const,
          translation: point(translation)
        };
        const options = {fractionTolerance: corpus.tolerances.fraction};
        const result =
          shape === 'capsule'
            ? sweepTerrainRotatingCapsule(
                surface,
                point(start),
                point(end),
                radius,
                motion,
                options
              )
            : sweepTerrainRotatingSphere(surface, point(start), radius, motion, options);
        expect(result.status).toBe(expected.status);
        if (expected.status === 'hit' && result.status === 'hit') {
          expect(result.lowerFraction).toBeLessThanOrEqual(expected.fraction! + 1e-12);
          expect(result.fraction).toBeGreaterThanOrEqual(expected.fraction! - 1e-12);
          expect(result.fraction - result.lowerFraction).toBeLessThanOrEqual(
            options.fractionTolerance
          );
          expect(result.contact.distance).toBeLessThanOrEqual(radius);
          expect(
            Math.hypot(...result.contact.point.map((value, i) => value - expected.witness![i]))
          ).toBeLessThan(corpus.tolerances.witnessMeters);
        }
      }
    }
  });
}
