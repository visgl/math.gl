// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {createLayout, type MeshEdge} from '../unfolding-polyhedron/layout';
import {landArc} from '../unfolding-polyhedron/geography';
import {dot, edgeKey, type Polyhedron, type Vec3} from '../unfolding-polyhedron/polyhedra';

/** Independent, closed graticule mesh. Equal-latitude trapezoids are planar.
 * Pole cells are triangles; shared longitude seams use the same vertex IDs.
 */
export function createGraticule(columns: number): Polyhedron {
  if (!Number.isInteger(columns) || columns < 12 || columns > 96 || columns % 4)
    throw new RangeError('Use a multiple of four between 12 and 96 columns');
  const rows = columns / 2;
  const vertices: Vec3[] = [[0, 0, -1]];
  for (let row = 1; row < rows; row++) {
    const latitude = -Math.PI / 2 + (row * Math.PI) / rows;
    for (let col = 0; col < columns; col++) {
      const longitude = -Math.PI + (col * 2 * Math.PI) / columns;
      vertices.push([
        Math.cos(latitude) * Math.cos(longitude),
        Math.cos(latitude) * Math.sin(longitude),
        Math.sin(latitude)
      ]);
    }
  }
  const north = vertices.push([0, 0, 1]) - 1;
  const at = (row: number, col: number) =>
    row === 0 ? 0 : row === rows ? north : 1 + (row - 1) * columns + (col % columns);
  const faces: number[][] = [];
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < columns; col++) {
      const cell = [at(row, col), at(row, col + 1), at(row + 1, col + 1), at(row + 1, col)];
      faces.push([...new Set(cell)]);
    }
  // Root just north of the equator in Africa. Its southern edge points east,
  // establishing an east-right, north-up flat frame without a camera spin.
  const root = (rows / 2) * columns + Math.floor((columns * 200) / 360);
  [faces[0], faces[root]] = [faces[root], faces[0]];
  return {vertices, faces};
}

/** Geographic joins dominate; direction and distance create coherent ocean strips.
 * No imported mesh, edge table, animation frames or parameters from Nico's code.
 */
export function createMyriahedralLayout(level: number, seed: number, mode: string) {
  const columns = [24, 48, 72, 96][level];
  if (!columns) throw new RangeError('Unknown graticule resolution');
  const mesh = createGraticule(columns);
  const exposure = new Map<string, number>();
  const land = (edge: MeshEdge) => {
    const key = edgeKey(edge.a, edge.b);
    if (!exposure.has(key))
      exposure.set(key, landArc(mesh.vertices[edge.a], mesh.vertices[edge.b]));
    return exposure.get(key)!;
  };
  const weight = (edge: MeshEdge, geographic: boolean) => {
    const a = mesh.vertices[edge.a],
      b = mesh.vertices[edge.b];
    const arc = Math.acos(Math.max(-1, Math.min(1, dot(a, b))));
    const fraction = arc > 1e-12 ? land(edge) / arc : 0;
    const alongMeridian = Math.abs(a[2] - b[2]) < 1e-10;
    const latitude = Math.asin((a[2] + b[2]) / 2);
    const longitude = Math.atan2(a[1] + b[1], a[0] + b[0]);
    const central = ((20 + (seed - 1) * 10) * Math.PI) / 180;
    const distance = Math.abs(
      Math.atan2(Math.sin(longitude - central), Math.cos(longitude - central))
    );
    // A continuous equatorial backbone fixes west/east continent order.
    // Leave its date-line join open rather than closing a cycle around the globe.
    if (!alongMeridian && Math.abs(Math.abs(longitude) - Math.PI) < 1e-8) return -1e9;
    if (!alongMeridian && Math.min(a[2], b[2]) === 0) return 1e6;
    return (
      (geographic ? fraction * 10000 : 0) +
      (alongMeridian ? 100 : 0) -
      Math.abs(latitude) -
      distance * 0.01
    );
  };
  const baseline = createLayout(mesh, seed, {weight: e => weight(e, false)});
  const layout =
    mode === 'legacy' ? baseline : createLayout(mesh, seed, {weight: e => weight(e, true)});
  const cutLand = (edges: MeshEdge[]) =>
    edges.reduce((sum, edge) => sum + (edge.hinge ? 0 : land(edge) * 6371), 0);
  return {...layout, cutLandKm: cutLand(layout.edges), baselineLandKm: cutLand(baseline.edges)};
}
