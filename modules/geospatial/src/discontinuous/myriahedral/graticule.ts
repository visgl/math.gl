// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Polyhedron, Vec3} from './mesh';

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
