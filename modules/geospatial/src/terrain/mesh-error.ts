// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {HeightField} from './height-field';
import {validateTerrainGridMesh, type TerrainGridMesh} from './mesh-data';

export type TerrainMeshError = {
  maxSampleError: number;
  rmsSampleError: number;
  coveredSampleCount: number;
  uncoveredSampleCount: number;
  sampleTests: number;
};

/** Measure vertical error at valid source-grid nodes. This is not a continuous-surface certificate.
 * Overlapping triangles contribute the worst error per node. Uncovered samples remain explicit.
 */
export function measureTerrainMeshError(
  field: HeightField,
  mesh: TerrainGridMesh,
  options: {maxSampleTests?: number} = {}
): TerrainMeshError {
  validateTerrainGridMesh(mesh);
  if (
    mesh.width !== field.width ||
    mesh.height !== field.height ||
    mesh.heightReference !== field.heightReference
  )
    throw new Error('Terrain mesh and field metadata differ');
  const limit = options.maxSampleTests ?? 10_000_000;
  if (!Number.isSafeInteger(limit) || limit < 0)
    throw new Error('Invalid terrain mesh sample-test limit');
  // Verify that grid coordinates describe the actual XY geometry, not a stale/forged index grid.
  const shift = field.registration === 'cell' ? 0.5 : 0;
  for (let i = 0; i < mesh.positions.length / 3; i++) {
    const x = mesh.gridCoordinates[i * 2] + shift,
      y = mesh.gridCoordinates[i * 2 + 1] + shift;
    for (let axis = 0; axis < 2; axis++) {
      const expected =
        field.origin[axis] -
        mesh.origin[axis] +
        x * field.columnStep[axis] +
        y * field.rowStep[axis];
      if (!Number.isFinite(expected) || mesh.positions[i * 3 + axis] !== expected)
        throw new Error('Terrain mesh XY does not match the source grid frame');
    }
  }
  const errors = new Float64Array(field.width * field.height);
  const covered = new Uint8Array(errors.length);
  let sampleTests = 0,
    coveredSampleCount = 0,
    maxSampleError = 0;
  for (let t = 0; t < mesh.indices.length; t += 3) {
    const a = mesh.indices[t],
      b = mesh.indices[t + 1],
      c = mesh.indices[t + 2];
    const ax = mesh.gridCoordinates[a * 2],
      ay = mesh.gridCoordinates[a * 2 + 1];
    const bx = mesh.gridCoordinates[b * 2],
      by = mesh.gridCoordinates[b * 2 + 1];
    const cx = mesh.gridCoordinates[c * 2],
      cy = mesh.gridCoordinates[c * 2 + 1];
    const determinant = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    if (!Number.isFinite(determinant) || determinant === 0)
      throw new Error('Degenerate terrain mesh grid triangle');
    for (let row = Math.min(ay, by, cy); row <= Math.max(ay, by, cy); row++)
      for (let column = Math.min(ax, bx, cx); column <= Math.max(ax, bx, cx); column++) {
        if (sampleTests++ === limit) throw new Error('Terrain mesh sample-test budget exceeded');
        const sign = Math.sign(determinant),
          area = Math.abs(determinant);
        const nu = ((column - ax) * (cy - ay) - (row - ay) * (cx - ax)) * sign;
        const nv = ((bx - ax) * (row - ay) - (by - ay) * (column - ax)) * sign;
        // Integer grid determinants remain exact within the admitted uint32 sample domain.
        if (nu < 0 || nv < 0 || nu + nv > area) continue;
        const u = nu / area,
          v = nv / area,
          w = (area - nu - nv) / area;
        const height = field.getHeight(column, row);
        if (height === undefined) continue;
        const predicted =
          w * mesh.positions[a * 3 + 2] +
          u * mesh.positions[b * 3 + 2] +
          v * mesh.positions[c * 3 + 2];
        const error = Math.abs(predicted - (height - mesh.origin[2]));
        if (!Number.isFinite(error)) throw new Error('Terrain mesh error arithmetic overflow');
        const index = row * field.width + column;
        if (!covered[index]) {
          covered[index] = 1;
          coveredSampleCount++;
        }
        errors[index] = Math.max(errors[index], error);
        maxSampleError = Math.max(maxSampleError, error);
      }
  }
  let squares = 0;
  if (maxSampleError) for (const error of errors) squares += (error / maxSampleError) ** 2;
  return {
    maxSampleError,
    rmsSampleError: coveredSampleCount
      ? maxSampleError * Math.sqrt(squares / coveredSampleCount)
      : 0,
    coveredSampleCount,
    uncoveredSampleCount: field.validCount - coveredSampleCount,
    sampleTests
  };
}
