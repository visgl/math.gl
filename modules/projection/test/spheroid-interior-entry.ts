// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original qualification against authored Decimal references; no external models.
import {config} from '@math.gl/core';
import {cartesianToSpheroid} from '@math.gl/core/spheroid';
import {Ellipsoid} from '@math.gl/geospatial';
import {ProjectionEngine} from '@math.gl/projection/core';
import {geocentric} from '@math.gl/projection/projections/geocent';
import fixtures from './fixtures/interior-reference.json';

export const cases = fixtures.cases;
export const provenance = fixtures.provenance;
export type InteriorCase = (typeof cases)[number];
export type InteriorPath = 'geospatial' | 'projection' | 'leaf';
export const angleTolerance = (1e-9 * Math.PI) / 180;
export function heightTolerance(row: InteriorCase): number {
  return Math.max(1e-12, Math.max(...row.radii) * 2e-12);
}

/** Diagnostic-only allocations: this code is never imported by production modules. */
export function evaluateInterior(row: InteriorCase, path: InteriorPath) {
  const [a, ay, b] = row.radii;
  const spheroid = a === ay && b <= a;
  if (path !== 'geospatial' && !spheroid) throw new Error('Non-spheroid reference');
  const previous = config._cartographicRadians;
  config._cartographicRadians = false;
  const source = row.xyz.slice();
  const output = [7, 8, 9];
  let success = false;
  let longitude = 0;
  let latitude = 0;
  let height = 0;
  try {
    if (path === 'geospatial') {
      success = Boolean(new Ellipsoid(a, ay, b).cartesianToCartographic(source, output));
      longitude = (output[0] * Math.PI) / 180;
      latitude = (output[1] * Math.PI) / 180;
      height = output[2];
    } else if (path === 'leaf') {
      const point = {x: source[0], y: source[1], z: source[2]};
      const result = {x: 7, y: 8, z: 9};
      success = cartesianToSpheroid(
        point,
        {semiMajorAxis: a, semiMinorAxis: b, eccentricitySquared: 1 - (b / a) ** 2},
        result
      );
      longitude = result.x;
      latitude = result.y;
      height = result.z;
      output[0] = result.x;
      output[1] = result.y;
      output[2] = result.z;
      if (point.x !== source[0] || point.y !== source[1] || point.z !== source[2])
        throw new Error('Leaf mutated separate input');
    } else {
      const axes = `+a=${a} +b=${b}`;
      const engine = new ProjectionEngine({
        from: '+proj=longlat ' + axes,
        to: '+proj=geocent ' + axes,
        projections: [geocentric]
      });
      try {
        engine.unprojectTo(source, output);
        success = true;
      } catch (error) {
        if (!(error instanceof Error) || !/Geocentric inverse did not converge/.test(error.message))
          throw error;
      }
      longitude = (output[0] * Math.PI) / 180;
      latitude = (output[1] * Math.PI) / 180;
      height = output[2];
    }
  } finally {
    config._cartographicRadians = previous;
  }
  const expected = row.reference.normal;
  const horizontal = Math.cos(latitude);
  const normalError = success
    ? 2 *
      Math.asin(
        Math.min(
          1,
          Math.hypot(
            horizontal * Math.cos(longitude) - expected[0],
            horizontal * Math.sin(longitude) - expected[1],
            Math.sin(latitude) - expected[2]
          ) / 2
        )
      )
    : null;
  const heightError = success ? Math.abs(height - row.reference.height) : null;
  const withinTolerance =
    success && normalError! <= angleTolerance && heightError! <= heightTolerance(row);
  const qualified = row.qualified[path === 'leaf' ? 'projection' : path];
  return {
    id: row.id,
    path,
    qualified,
    status: !success ? 'rejected' : withinTolerance ? 'matches-reference' : 'outside-tolerance',
    normalErrorRadians: normalError,
    heightError,
    finite: !success || output.every(Number.isFinite),
    inputUnchanged: source.every((value, i) => value === row.xyz[i]),
    failureAtomic: success || output.every((value, i) => value === [7, 8, 9][i])
  };
}
export function qualifyInteriors() {
  return cases.flatMap(row => {
    const paths: InteriorPath[] = ['geospatial'];
    if (row.radii[0] === row.radii[1] && row.radii[2] <= row.radii[0])
      paths.push('projection', 'leaf');
    return paths.map(path => evaluateInterior(row, path));
  });
}
