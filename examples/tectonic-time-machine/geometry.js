// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original mesh adapter: triangulate geographic cells before morphing their vertices.
import {earcut, cutPolygonByGrid} from '@math.gl/polygon';
const IDENTITY = [1, 0, 0, 0];
export function makeMesh(parts) {
  const coordinates = [],
    indices = [],
    colors = [],
    reference = [],
    starts = [0];
  for (const part of parts) {
    for (const cell of cutPolygonByGrid(part.positions, part.holeIndices, {gridResolution: 5})) {
      const offset = coordinates.length / 2;
      const triangles = earcut(
        cell.positions,
        cell.holeIndices?.map(i => i / 2),
        2
      );
      if (!triangles.length) continue;
      coordinates.push(...cell.positions);
      for (const index of triangles) indices.push(offset + index);
      for (let i = 0; i < cell.positions.length / 2; i++) colors.push(...part.color, 255);
      const q = part.rotation || IDENTITY;
      const w = q[0],
        qx = -q[1],
        qy = -q[2],
        qz = -q[3];
      for (let i = 0; i < cell.positions.length; i += 2) {
        const lon = ((cell.positions[i] + (part.longitude || 0)) * Math.PI) / 180,
          lat = (cell.positions[i + 1] * Math.PI) / 180;
        const x = Math.cos(lat) * Math.cos(lon),
          y = Math.cos(lat) * Math.sin(lon),
          z = Math.sin(lat);
        const tx = 2 * (qy * z - qz * y),
          ty = 2 * (qz * x - qx * z),
          tz = 2 * (qx * y - qy * x);
        reference.push(
          x + w * tx + qy * tz - qz * ty,
          y + w * ty + qz * tx - qx * tz,
          z + w * tz + qx * ty - qy * tx
        );
      }
      starts.push(coordinates.length / 2);
    }
  }
  return {
    coordinates: new Float64Array(coordinates),
    reference: new Float32Array(reference),
    normals: new Float32Array((coordinates.length / 2) * 3),
    positions: new Float64Array((coordinates.length / 2) * 3),
    projected: new Float64Array(coordinates.length),
    indices: new Uint32Array(indices),
    colors: new Uint8Array(colors),
    starts
  };
}
export function blendWeights(from, target, progress) {
  const t = Math.max(0, Math.min(1, progress));
  const ease = t * t * (3 - 2 * t),
    result = {};
  for (const [key, weight] of Object.entries(from)) {
    if (weight * (1 - ease) > 1e-8) result[key] = weight * (1 - ease);
  }
  result[target] = (result[target] || 0) + ease;
  return result;
}
// Every endpoint reads the same current geological coordinates. Interrupted transitions
// begin from the current mixture, so neither time nor the displayed shape jumps backwards.
export function transformMesh(mesh, weights, engines, scales, latitude = 15, ocean = false) {
  const {coordinates, projected, positions} = mesh;
  const tilt = (latitude * Math.PI) / 180,
    sinTilt = Math.sin(tilt),
    cosTilt = Math.cos(tilt);
  positions.fill(0);
  if (mesh.normals)
    for (let i = 0, j = 0; i < coordinates.length; i += 2, j += 3) {
      const lon = (coordinates[i] * Math.PI) / 180,
        lat = (coordinates[i + 1] * Math.PI) / 180;
      const north = Math.sin(lat),
        front = Math.cos(lat) * Math.cos(lon);
      mesh.normals[j] = Math.cos(lat) * Math.sin(lon);
      mesh.normals[j + 1] = north * cosTilt - front * sinTilt;
      mesh.normals[j + 2] = north * sinTilt + front * cosTilt;
    }
  for (const [view, weight] of Object.entries(weights)) {
    if (view !== 'globe') {
      projected.set(coordinates);
      if (view === 'merc')
        for (let i = 1; i < projected.length; i += 2)
          projected[i] = Math.max(-85.05112878, Math.min(85.05112878, projected[i]));
      engines[view].projectFlatSync(projected, 2);
    }
    for (let i = 0, j = 0; i < coordinates.length; i += 2, j += 3) {
      let x, y, z;
      if (view === 'globe') {
        const lon = (coordinates[i] * Math.PI) / 180,
          lat = (coordinates[i + 1] * Math.PI) / 180;
        const r = ocean ? 0.994 : 1,
          cosLat = Math.cos(lat);
        x = r * cosLat * Math.sin(lon);
        const north = r * Math.sin(lat),
          front = r * cosLat * Math.cos(lon);
        y = north * cosTilt - front * sinTilt;
        z = north * sinTilt + front * cosTilt;
      } else {
        x = projected[i] * scales[view];
        y = projected[i + 1] * scales[view];
        z = ocean ? -0.01 : 0;
      }
      positions[j] += x * weight;
      positions[j + 1] += y * weight;
      positions[j + 2] += z * weight;
    }
  }
  return positions;
}
export function binaryMesh(mesh) {
  return {
    length: mesh.starts.length - 1,
    startIndices: mesh.starts,
    attributes: {
      getPolygon: {value: mesh.positions, size: 3},
      getSurfaceNormal: {value: mesh.normals, size: 3},
      getReferencePosition: {value: mesh.reference, size: 3},
      indices: {value: mesh.indices, size: 1},
      getFillColor: {value: mesh.colors, size: 4}
    }
  };
}

// Recover endpoint coordinates for hover labels. Intermediate morphs have no unique CRS.
export function worldToGeographic(x, y, mode, engine, scale, latitude, longitude, out) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  if (mode === 'globe') {
    const squared = x * x + y * y;
    if (squared > 1) return false;
    const z = Math.sqrt(1 - squared),
      tilt = (latitude * Math.PI) / 180;
    const north = y * Math.cos(tilt) + z * Math.sin(tilt);
    const front = z * Math.cos(tilt) - y * Math.sin(tilt);
    out[0] = (Math.atan2(x, front) * 180) / Math.PI;
    out[1] = (Math.asin(Math.max(-1, Math.min(1, north))) * 180) / Math.PI;
  } else {
    if (!Number.isFinite(scale) || scale <= 0) return false;
    const projectedX = x / scale,
      projectedY = y / scale;
    out[0] = projectedX;
    out[1] = projectedY;
    try {
      engine.unprojectFlatSync(out, 2);
    } catch (error) {
      // Hovering the background is normal. The engine rejects positions with no inverse.
      if (/outside .*domain|inverse did not converge|non-finite/.test(error.message)) return false;
      throw error;
    }
    if (
      !Number.isFinite(out[0]) ||
      !Number.isFinite(out[1]) ||
      Math.abs(out[0]) > 180.00001 ||
      Math.abs(out[1]) > (mode === 'merc' ? 85.05112879 : 90.00001)
    )
      return false;
    const lon = out[0],
      lat = out[1];
    // Some inverses wrap longitude for points beyond the curved map outline.
    // Require the recovered coordinate to project back to the actual hover position.
    engine.projectFlatSync(out, 2);
    const tolerance = 1e-6 * Math.max(1, Math.abs(projectedX), Math.abs(projectedY));
    if (Math.abs(out[0] - projectedX) > tolerance || Math.abs(out[1] - projectedY) > tolerance)
      return false;
    out[0] = lon;
    out[1] = lat;
  }
  out[0] = ((((out[0] + longitude + 180) % 360) + 360) % 360) - 180;
  return true;
}
