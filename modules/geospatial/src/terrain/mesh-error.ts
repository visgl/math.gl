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
  const baseX = field.origin[0] - mesh.origin[0],
    baseY = field.origin[1] - mesh.origin[1];
  const [columnX, columnY] = field.columnStep,
    [rowX, rowY] = field.rowStep;
  const frameArea = Math.abs(columnX * rowY - columnY * rowX);
  // Bound coordinate construction roundoff in grid units. Below 1/8 of a cell,
  // expanding each integer bounding box by one includes all possibly shifted nodes.
  // Reject distant origins / ill-conditioned frames rather than certify aliased XY.
  const roundX =
    16 *
    Number.EPSILON *
    (Math.abs(baseX) + (field.width + 1) * Math.abs(columnX) + (field.height + 1) * Math.abs(rowX));
  const roundY =
    16 *
    Number.EPSILON *
    (Math.abs(baseY) + (field.width + 1) * Math.abs(columnY) + (field.height + 1) * Math.abs(rowY));
  const gridRoundoff = Math.max(
    (Math.abs(rowY) * roundX + Math.abs(rowX) * roundY) / frameArea,
    (Math.abs(columnY) * roundX + Math.abs(columnX) * roundY) / frameArea
  );
  if (!Number.isFinite(gridRoundoff) || gridRoundoff >= 0.125)
    throw new Error(
      'Terrain mesh XY precision is insufficient; use a local origin and a well-conditioned frame'
    );
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
    const px = mesh.positions[a * 3],
      py = mesh.positions[a * 3 + 1];
    const ux = mesh.positions[b * 3] - px,
      uy = mesh.positions[b * 3 + 1] - py;
    const vx = mesh.positions[c * 3] - px,
      vy = mesh.positions[c * 3 + 1] - py;
    const xyArea = ux * vy - uy * vx;
    if (!Number.isFinite(xyArea) || xyArea === 0)
      throw new Error('Degenerate terrain mesh XY triangle');
    for (
      let row = Math.max(0, Math.min(ay, by, cy) - 1);
      row <= Math.min(field.height - 1, Math.max(ay, by, cy) + 1);
      row++
    )
      for (
        let column = Math.max(0, Math.min(ax, bx, cx) - 1);
        column <= Math.min(field.width - 1, Math.max(ax, bx, cx) + 1);
        column++
      ) {
        if (sampleTests++ === limit) throw new Error('Terrain mesh sample-test budget exceeded');
        const dx = baseX + (column + shift) * columnX + (row + shift) * rowX - px;
        const dy = baseY + (column + shift) * columnY + (row + shift) * rowY - py;
        const sign = Math.sign(xyArea),
          area = Math.abs(xyArea);
        const nu = (dx * vy - dy * vx) * sign;
        const nv = (ux * dy - uy * dx) * sign;
        const tolerance =
          16 *
          Number.EPSILON *
          (Math.abs(dx * vy) + Math.abs(dy * vx) + Math.abs(ux * dy) + Math.abs(uy * dx) + area);
        if (nu < -tolerance || nv < -tolerance || nu + nv > area + tolerance) continue;
        const u = nu / area,
          v = nv / area,
          w = (area - nu - nv) / area;
        const height = field.getHeight(column, row);
        if (height === undefined) continue;
        const predicted =
          w * mesh.positions[a * 3 + 2] +
          u * mesh.positions[b * 3 + 2] +
          v * mesh.positions[c * 3 + 2];
        // Error-free TwoDiff retains the low part lost when rebasing source Z.
        // Comparing only with the rounded local height would certify that loss as zero.
        const localHeight = height - mesh.origin[2];
        const virtualOrigin = height - localHeight;
        const remainder = height - (localHeight + virtualOrigin) + (virtualOrigin - mesh.origin[2]);
        const error = Math.abs(predicted - localHeight - remainder);
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
