// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {HeightField} from './height-field';
import {assembleTerrainMesh, type TerrainGridMesh, type TerrainMeshOptions} from './mesh-data';
export type {TerrainGridMesh, TerrainMeshOptions} from './mesh-data';

/** Regular triangle mesh as plain arrays; preserves registration, diagonal and missing-data holes. */
export function createTerrainMesh(
  field: HeightField,
  options: TerrainMeshOptions = {}
): TerrainGridMesh {
  const count = field.width * field.height;
  if (count > 0xffffffff) throw new Error('Terrain mesh exceeds uint32 capacity');
  const coordinates = new Uint32Array(count * 2);
  for (let row = 0; row < field.height; row++)
    for (let column = 0; column < field.width; column++)
      coordinates.set([column, row], (row * field.width + column) * 2);
  const output = new Uint32Array((field.width - 1) * (field.height - 1) * 6);
  let used = 0;
  const add = (a: number, b: number, c: number): void => {
    for (const i of [a, b, c])
      if (field.getHeight(i % field.width, Math.floor(i / field.width)) === undefined) return;
    output[used++] = a;
    output[used++] = b;
    output[used++] = c;
  };
  for (let row = 0; row < field.height - 1; row++)
    for (let column = 0; column < field.width - 1; column++) {
      const a = row * field.width + column,
        b = a + 1,
        c = a + field.width,
        d = c + 1;
      if (field.diagonal === '00-11') {
        add(a, b, d);
        add(a, d, c);
      } else {
        add(a, b, c);
        add(b, d, c);
      }
    }
  return assembleTerrainMesh(
    field,
    coordinates,
    used === output.length ? output : output.slice(0, used),
    options
  );
}
