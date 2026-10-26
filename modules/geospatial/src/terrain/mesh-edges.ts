// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {validateTerrainGridMesh, type TerrainGridMesh, type TerrainMeshEdge} from './mesh-data';
export type {TerrainMeshEdge} from './mesh-data';

/** Referenced vertices on a grid side, sorted by ascending coordinate along that side.
 * A grid side is not necessarily geographic north/south/east/west. No boundary-loop inference.
 */
export function getTerrainMeshEdge(mesh: TerrainGridMesh, edge: TerrainMeshEdge): Uint32Array {
  validateTerrainGridMesh(mesh);
  if (!['minColumn', 'maxColumn', 'minRow', 'maxRow'].includes(edge))
    throw new Error('Unknown terrain mesh edge');
  const column = edge === 'minColumn' || edge === 'maxColumn';
  const axis = column ? 0 : 1;
  const value = edge.startsWith('min') ? 0 : (column ? mesh.width : mesh.height) - 1;
  const vertices = new Set<number>();
  for (const index of mesh.indices)
    if (mesh.gridCoordinates[2 * index + axis] === value) vertices.add(index);
  return Uint32Array.from(
    [...vertices].sort(
      (a, b) =>
        mesh.gridCoordinates[2 * a + 1 - axis] - mesh.gridCoordinates[2 * b + 1 - axis] || a - b
    )
  );
}
