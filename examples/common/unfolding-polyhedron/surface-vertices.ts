// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {Polyhedron} from './polyhedra';

/** Positions move with the hinges; source positions always stay on the original sphere. */
export function surfaceVertices(mesh: Polyhedron, positions: number[][][]): Float32Array {
  const data: number[] = [];
  mesh.faces.forEach((ids, face) => {
    const color = [0.35 + (face % 3) * 0.12, 0.6, 0.7 + (face % 2) * 0.15];
    for (let j = 1; j < ids.length - 1; j++) {
      for (const k of [0, j, j + 1])
        data.push(...positions[face][k], ...mesh.vertices[ids[k]], ...color);
    }
  });
  return new Float32Array(data);
}
