// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {HeightField} from './height-field';

/** Detached grid-derived mesh data. No renderer, query index, normals or physics state. */
export type TerrainGridMesh = {
  positions: Float64Array;
  indices: Uint32Array;
  /** Packed integer [column, row] for each vertex. */
  gridCoordinates: Uint32Array;
  width: number;
  height: number;
  origin: readonly [number, number, number];
  heightReference: string;
};
export type TerrainMeshOptions = {origin?: readonly [number, number, number]};
export type TerrainMeshEdge = 'minColumn' | 'maxColumn' | 'minRow' | 'maxRow';

/** Internal assembly shared by regular and optional adaptive builders. */
export function assembleTerrainMesh(
  field: HeightField,
  gridCoordinates: Uint32Array,
  indices: Uint32Array,
  options: TerrainMeshOptions
): TerrainGridMesh {
  const origin = options.origin ?? [field.origin[0], field.origin[1], 0];
  if (
    origin.length !== 3 ||
    !Number.isFinite(origin[0]) ||
    !Number.isFinite(origin[1]) ||
    !Number.isFinite(origin[2])
  )
    throw new Error('Terrain mesh origin must be finite XYZ');
  const positions = new Float64Array((gridCoordinates.length / 2) * 3);
  for (let i = 0; i < gridCoordinates.length / 2; i++) {
    const column = gridCoordinates[2 * i],
      row = gridCoordinates[2 * i + 1];
    const shift = field.registration === 'cell' ? 0.5 : 0;
    positions[3 * i] =
      field.origin[0] -
      origin[0] +
      (column + shift) * field.columnStep[0] +
      (row + shift) * field.rowStep[0];
    positions[3 * i + 1] =
      field.origin[1] -
      origin[1] +
      (column + shift) * field.columnStep[1] +
      (row + shift) * field.rowStep[1];
    const height = field.getHeight(column, row);
    positions[3 * i + 2] = height === undefined ? 0 : height - origin[2];
  }
  if (!positions.every(Number.isFinite)) throw new Error('Terrain mesh coordinate overflow');
  const reverse =
    field.columnStep[0] * field.rowStep[1] - field.columnStep[1] * field.rowStep[0] < 0;
  for (let i = 0; i < indices.length; i += 3) {
    if (reverse) [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
    const a = indices[i] * 3,
      b = indices[i + 1] * 3,
      c = indices[i + 2] * 3;
    const area =
      (positions[b] - positions[a]) * (positions[c + 1] - positions[a + 1]) -
      (positions[b + 1] - positions[a + 1]) * (positions[c] - positions[a]);
    if (!Number.isFinite(area) || area <= 0)
      throw new Error('Terrain mesh triangles degenerate or overflow; use a local origin');
  }
  return {
    positions,
    indices,
    gridCoordinates,
    width: field.width,
    height: field.height,
    origin: Object.freeze([...origin] as [number, number, number]),
    heightReference: field.heightReference
  };
}

/** Validate detached caller-owned data before inspection. Does not certify manifoldness. */
export function validateTerrainGridMesh(mesh: TerrainGridMesh): void {
  if (
    !Number.isSafeInteger(mesh.width) ||
    !Number.isSafeInteger(mesh.height) ||
    mesh.width < 2 ||
    mesh.height < 2 ||
    mesh.width * mesh.height > 0xffffffff
  )
    throw new Error('Invalid terrain mesh grid dimensions');
  if (
    !(mesh.positions instanceof Float64Array) ||
    mesh.positions.length % 3 ||
    !mesh.positions.every(Number.isFinite) ||
    !(mesh.indices instanceof Uint32Array) ||
    mesh.indices.length % 3 ||
    !(mesh.gridCoordinates instanceof Uint32Array) ||
    mesh.gridCoordinates.length !== (mesh.positions.length / 3) * 2
  )
    throw new Error('Invalid terrain mesh buffers');
  if (
    mesh.origin.length !== 3 ||
    !Number.isFinite(mesh.origin[0]) ||
    !Number.isFinite(mesh.origin[1]) ||
    !Number.isFinite(mesh.origin[2])
  )
    throw new Error('Invalid terrain mesh origin');
  for (let i = 0; i < mesh.gridCoordinates.length; i += 2)
    if (mesh.gridCoordinates[i] >= mesh.width || mesh.gridCoordinates[i + 1] >= mesh.height)
      throw new Error('Terrain mesh grid coordinate out of bounds');
  for (const i of mesh.indices)
    if (i >= mesh.positions.length / 3) throw new Error('Terrain mesh vertex index out of bounds');
}
