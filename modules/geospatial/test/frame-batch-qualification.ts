// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Packed-frame expectations use the original independent Decimal frame geometry.
import {Ellipsoid, LocalReferenceFrame} from '@math.gl/geospatial';
import type {LocalFrameAxis} from '@math.gl/core';
import type {C8Row} from './c8-qualification';
import reference from './c8-reference.json';
export const frameBatchMethods = [
  'localToFixedPointsFlat',
  'fixedToLocalPointsFlat',
  'localToFixedVectorsFlat',
  'fixedToLocalVectorsFlat'
] as const;
export function qualifyFrameBatches(): C8Row[] {
  const rows: C8Row[] = [];
  const selections: readonly (readonly LocalFrameAxis[])[] = [
    ['east', 'north', 'up'],
    ['north', 'east', 'down'],
    ['west', 'up', 'north']
  ];
  reference.frames.forEach((r, index) =>
    selections.forEach((selected, k) => {
      const row: C8Row = {
        id: `${index}/${k}`,
        family: 'Decimal packed frames',
        passed: true,
        budgetUsage: 0,
        checks: []
      };
      try {
        const frame = new LocalReferenceFrame(r.origin, {
          ellipsoid: new Ellipsoid(...(r.radii as [number, number, number])),
          axes: selected as readonly [LocalFrameAxis, LocalFrameAxis, LocalFrameAxis]
        });
        const basis = selected.map(axis => {
          const j = {east: 0, west: 0, north: 1, south: 1, up: 2, down: 2}[axis];
          return r.basis
            .slice(3 * j, 3 * j + 3)
            .map(x => (['west', 'south', 'down'].includes(axis) ? -x : x));
        });
        const input = Float64Array.from([1, 2, -0.5, 0].flatMap(f => r.local.map(x => x * f)));
        const scale = Math.max(...r.radii);
        frameBatchMethods.forEach((method, mi) => {
          const inverse = mi % 2 === 1,
            position = mi < 2;
          const expected = Array.from({length: input.length}, (_, i) => {
            const j = i % 3,
              offset = i - j;
            const point = [0, 1, 2].map(
              a => input[offset + a] - (inverse && position ? r.origin[a] : 0)
            );
            return inverse
              ? basis[j].reduce((sum, x, a) => sum + x * point[a], 0)
              : basis.reduce((sum, col, a) => sum + col[j] * point[a], position ? r.origin[j] : 0);
          });
          const storage = new Float64Array(input.length + 2).fill(99),
            out = storage.subarray(1, -1);
          if (frame[method](input, out) !== out || storage[0] !== 99 || storage.at(-1) !== 99)
            throw new Error('Output ownership or bounds');
          let error = Math.max(...expected.map((x, i) => Math.abs(out[i] - x) / scale));
          const alias = input.slice();
          frame[method](alias, alias);
          error = Math.max(error, ...expected.map((x, i) => Math.abs(alias[i] - x) / scale));
          row.checks.push({name: method, error, budget: 2e-12});
          row.budgetUsage = Math.max(row.budgetUsage, error / 2e-12);
          row.passed &&= error <= 2e-12;
        });
      } catch (error) {
        row.passed = false;
        row.error = String(error);
        row.budgetUsage = Infinity;
      }
      rows.push(row);
    })
  );
  return rows;
}
