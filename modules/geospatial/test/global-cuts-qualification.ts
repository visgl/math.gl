// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {
  cutSphericalPolygon,
  projectSphericalPolygon,
  MapEngine,
  type GeographicPosition,
  type MapDefinition
} from '../src/discontinuous';
export const provenance = {
  oracle: 'Analytic hemisphere/solid-angle/complement identities; original rotated inputs',
  version: 1
};
type P = [number, number];
const vector = ([l, p]: GeographicPosition) => {
  l *= Math.PI / 180;
  p *= Math.PI / 180;
  return [Math.cos(l) * Math.cos(p), Math.sin(l) * Math.cos(p), Math.sin(p)];
};
const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0);
const determinant = (a: number[], b: number[], c: number[]) =>
  a[0] * (b[1] * c[2] - b[2] * c[1]) +
  a[1] * (b[2] * c[0] - b[0] * c[2]) +
  a[2] * (b[0] * c[1] - b[1] * c[0]);
export function solidAngle(r: readonly GeographicPosition[]): number {
  const v = r.map(vector);
  let sum = 0;
  for (let i = 1; i < v.length - 1; i++)
    sum +=
      2 *
      Math.atan2(
        determinant(v[0], v[i], v[i + 1]),
        1 + dot(v[0], v[i]) + dot(v[i], v[i + 1]) + dot(v[i + 1], v[0])
      );
  return sum;
}
const total = (parts: ReturnType<typeof cutSphericalPolygon>) =>
  parts.reduce((s, p) => s + p.rings.reduce((s, r) => s + solidAngle(r), 0), 0);
export const mapDefinitions: MapDefinition[] = [
  {type: 'goode'},
  {type: 'air-ocean'},
  {type: 'gray-fuller'},
  {type: 'butterfly'},
  {type: 'waterman'},
  {type: 'healpix'},
  {type: 'mercator'},
  {type: 'interrupted-sinusoidal'},
  {type: 'interrupted-mollweide'},
  {type: 'goode-ocean'},
  {type: 'isea'},
  {type: 'regional', projection: 'satellite', center: [0, 0], distance: 2},
  {type: 'regional', projection: 'airy', center: [30, 40]},
  {type: 'world', projection: 'mollweide'},
  {type: 'world', projection: 'natural-earth2'}
];
export function qualifyGlobalCuts() {
  const rows: {id: number; mode: string; passed: boolean; budgetUsage: number; error: string}[] =
    [];
  const run = (mode: string, fn: () => number, budget: number) => {
    let error = '',
      usage = Infinity;
    try {
      usage = fn() / budget;
    } catch (e) {
      error = String(e);
    }
    rows.push({
      id: rows.length,
      mode,
      passed: Number.isFinite(usage) && usage <= 1,
      budgetUsage: usage,
      error
    });
  };
  const north: P[] = [
      [-135, 0],
      [-45, 0],
      [45, 0],
      [135, 0]
    ],
    triangle: P[] = [
      [10, 10],
      [40, 10],
      [20, 40]
    ],
    hole: P[] = [
      [-20, 20],
      [-20, 40],
      [20, 40],
      [20, 20]
    ];
  const rotate = (r: P[], yaw: number, pitch: number): P[] =>
    r.map(p => {
      const [x, y, z] = vector(p),
        c = Math.cos(pitch),
        s = Math.sin(pitch),
        u = c * x - s * z,
        w = s * x + c * z;
      return [
        (Math.atan2(y, u) * 180) / Math.PI + yaw,
        (Math.atan2(w, Math.hypot(u, y)) * 180) / Math.PI
      ];
    });
  for (let i = 0; i < 12; i++) {
    const r = rotate(north, i * 31, (i - 6) * 0.19);
    for (const interior of ['left', 'right'] as const)
      run(
        'rotated hemisphere',
        () => Math.abs(total(cutSphericalPolygon([r], {interior})) - 2 * Math.PI),
        2e-10
      );
    const t = rotate(triangle, i * 31, (i - 6) * 0.19);
    run(
      'global complement',
      () =>
        Math.abs(
          total(cutSphericalPolygon([t], {interior: 'left'})) +
            total(cutSphericalPolygon([t], {interior: 'right'})) -
            4 * Math.PI
        ),
      2e-10
    );
    run(
      'hemisphere hole',
      () =>
        Math.abs(
          total(
            cutSphericalPolygon(
              [rotate(north, i * 31, (i - 6) * 0.19), rotate(hole, i * 31, (i - 6) * 0.19)],
              {interior: 'left'}
            )
          ) -
            (2 * Math.PI + solidAngle(hole))
        ),
      2e-10
    );
  }
  for (const definition of mapDefinitions)
    run(
      'map family ' + ('projection' in definition ? definition.projection : definition.type),
      () => {
        const map = new MapEngine({version: 1, id: 'qualification', definition});
        const parts = projectSphericalPolygon(map, [north], {
          interior: 'left',
          maxAngularStep: 10,
          tolerance: 0.005
        });
        if (!parts.length) throw new Error('No projected coverage');
        for (const part of parts)
          for (let k = 0; k < part.coordinates.length; k++)
            for (let i = 0; i < part.coordinates[k].length; i++) {
              const xy = part.coordinates[k][i],
                source = part.sourceCoordinates[k][i];
              if (!xy.every(Number.isFinite) || !map.findRegions(source).includes(part.regionId))
                throw new Error(
                  'Fragment escaped its map region ' +
                    JSON.stringify({
                      xy,
                      source,
                      regionId: part.regionId,
                      regions: map.findRegions(source)
                    })
                );
            }
        return 0;
      },
      1
    );
  return rows;
}
