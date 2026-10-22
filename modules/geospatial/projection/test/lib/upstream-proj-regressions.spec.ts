// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original tests informed by OSGeo/PROJ #2844/#2855 and PR #3082. Coordinates independently generated with pyproj 3.7.2 / PROJ 9.5.1. See ../../PROJ-LICENSE.txt.
import {expect, test} from 'vitest';
import {projectionEngine} from '@math.gl/geospatial/projection';

const ortho = [
  {input: [120, 84], projected: [663929.0677970207, 5118338.242269817]},
  {
    input: [-132.18030375876134, 60.17101375662846],
    projected: [-1335097.4621092621, 6158336.747621704]
  },
  {
    input: [171.66658585876388, 55.67067909419186],
    projected: [1874756.6326674547, 6061693.507544079]
  }
];

test('PROJ #2844: historical orthographic inverse convergence cases', () => {
  const transform = projectionEngine.createProjection({
    to: '+proj=ortho +lon_0=23 +lat_0=37 +ellps=WGS84'
  });
  for (const row of ortho) {
    const forward = transform.project(row.input);
    const inverse = transform.unproject(row.projected);
    for (let axis = 0; axis < 2; axis++) {
      expect(Math.abs(forward[axis] - row.projected[axis])).toBeLessThan(1e-8);
      expect(Math.abs(inverse[axis] - row.input[axis])).toBeLessThan(1e-8);
    }
  }
});

test('PROJ #3082: Mollweide does not collapse distinct near-pole latitudes', () => {
  const transform = projectionEngine.createProjection({to: '+proj=moll +R=6371000'});
  const rows = [
    [89.1, 198860.2322681377, 8990182.060014155],
    [89.2, 183854.6521102594, 8993056.165846888],
    [89.3, 168205.60916753582, 8995812.573492248],
    [89.4, 151787.18632758228, 8998440.300996656]
  ];
  for (const sign of [-1, 1]) {
    const northings: number[] = [];
    for (const [latitude, x, y] of rows) {
      const actual = transform.project([30, sign * latitude]);
      expect(Math.abs(actual[0] - x)).toBeLessThan(1e-5);
      expect(Math.abs(actual[1] - sign * y)).toBeLessThan(1e-5);
      northings.push(actual[1]);
    }
    expect(new Set(northings).size).toBe(rows.length);
  }
});
