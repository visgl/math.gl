// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {projectionEngine} from '@math.gl/geospatial/projection';
import {PROJECTIONS} from './projections.js';

import {isCutMap, projectCutMap, cutPart} from './cut-maps.js';

/** Project geographic coordinates into the endpoint's current screen space. */
export function createEndpoint(id, viewport) {
  const preset = PROJECTIONS.find(p => p.id === id);
  const native = id === 'globe' || id === 'map';
  const projection =
    !native && !isCutMap(id)
      ? projectionEngine.createProjection({
          from: 'WGS84',
          to: `+proj=${id} +datum=WGS84 +units=m ${preset.parameters}`
        })
      : null;
  const project = (lon, lat, sector) => {
    const extent = id === 'map' ? [-180, -85.051129, 180, 85.051129] : preset.extent;
    const inside = lon >= extent[0] && lon <= extent[2] && lat >= extent[1] && lat <= extent[3];
    const clampedLon = Math.max(extent[0], Math.min(extent[2], lon));
    const clampedLat = Math.max(extent[1], Math.min(extent[3], lat));
    try {
      const coordinate = native
        ? [clampedLon, clampedLat, 0]
        : isCutMap(id)
          ? projectCutMap(id, clampedLon, clampedLat, sector)
          : projection
              .project([clampedLon, clampedLat])
              .slice(0, 2)
              .map(v => v / 100000)
              .concat(0);
      if (!coordinate) return null;
      const p = viewport.project(coordinate);
      if (!p.every(Number.isFinite) || Math.abs(p[0]) > 1e6 || Math.abs(p[1]) > 1e6) return null;
      return {
        position: [
          p[0] - viewport.width / 2,
          viewport.height / 2 - p[1],
          native && id === 'globe' ? -p[2] * 100 : 0
        ],
        cutPosition: coordinate,
        part: coordinate.part ?? (isCutMap(id) ? cutPart(id, lon, lat, sector) : 0),
        front:
          id !== 'globe' ||
          Math.sin((lat * Math.PI) / 180) * Math.sin((viewport.latitude * Math.PI) / 180) +
            Math.cos((lat * Math.PI) / 180) *
              Math.cos((viewport.latitude * Math.PI) / 180) *
              Math.cos(((lon - viewport.longitude) * Math.PI) / 180) >
            0,
        inside
      };
    } catch {
      return null;
    }
  };
  const cache = new Map();
  const endpoint = (lon, lat, sector) => {
    const key = `${lon},${lat},${['isinu', 'imoll'].includes(id) ? cutPart(id, lon, lat, sector) : ''}`;
    if (!cache.has(key)) cache.set(key, project(lon, lat, sector));
    return cache.get(key);
  };
  endpoint.width = viewport.width;
  endpoint.height = viewport.height;
  return endpoint;
}

/**
 * Refine visible curvature in screen space. Vertices on cut banks are independent;
 * patches outside either endpoint keep their shape and retire instead of stretching.
 */
export function createMorphMesh(source, target, options = {}) {
  const from = [],
    to = [],
    uv = [],
    lifetime = [],
    groupIndices = [];
  const groups = new Map();
  const vertices = new Map(),
    indices = [];
  const width = source.width || 1000,
    height = source.height || 800;
  const maxDepth = options.maxDepth ?? 7;
  const errorLimit = options.error ?? 0.6;
  const usable = points =>
    points.every(p => p?.inside) &&
    points.every((p, i) => {
      const q = points[(i + 1) % 3];
      if ((p.part ?? 0) !== (q.part ?? 0)) return false;
      const a = p.cutPosition || p.position,
        b = q.cutPosition || q.position;
      return Math.hypot(a[0] - b[0], a[1] - b[1]) < (p.cutPosition ? 20 : 300);
    });
  const emit = (triangle, sector) => {
    const a = triangle.map(([x, y]) => source(x, y, sector));
    const b = triangle.map(([x, y]) => target(x, y, sector));
    const va = usable(a),
      vb = usable(b);
    if (!va && !vb) return;
    const key = `${va ? (a[0].part ?? 0) : 'none'}:${vb ? (b[0].part ?? 0) : 'none'}`;
    if (!groups.has(key)) groups.set(key, {index: groups.size, pairs: [], rotation: 0});
    const group = groups.get(key);
    triangle.forEach(([x, y], i) => {
      const vertexKey = `${x},${y},${group.index}`;
      if (vertices.has(vertexKey)) {
        indices.push(vertices.get(vertexKey));
        return;
      }
      const index = from.length / 3;
      vertices.set(vertexKey, index);
      indices.push(index);
      const p = va ? a[i].position : b[i].position;
      const q = vb ? b[i].position : a[i].position;
      from.push(...p);
      to.push(...q);
      uv.push((x + 180) / 360, (90 - y) / 180);
      lifetime.push(va ? 1 : 0, vb ? 1 : 0);
      groupIndices.push(group.index);
      if (va && vb && a[i].front !== false && b[i].front !== false) group.pairs.push([p, q]);
    });
  };
  const refine = (lon, lat, size, depth) => {
    const sector = lon + size / 2;
    const coordinates = [
      [lon, lat],
      [lon + size, lat],
      [lon, lat + size],
      [lon + size, lat + size],
      [lon + size / 2, lat],
      [lon + size, lat + size / 2],
      [lon + size / 2, lat + size],
      [lon, lat + size / 2],
      [lon + size / 2, lat + size / 2]
    ];
    let split = false;
    for (const endpoint of [source, target]) {
      const p = coordinates.map(([x, y]) => endpoint(x, y, sector));
      const visible = p.some(
        v =>
          v?.inside &&
          v.front !== false &&
          Math.abs(v.position[0]) < width * 0.7 &&
          Math.abs(v.position[1]) < height * 0.7
      );
      if (!visible) continue;
      if (p.some(v => !v?.inside) || p.some(v => v?.part !== p[0]?.part)) {
        split = true;
        continue;
      }
      for (const [a, b, mid] of [
        [0, 1, 4],
        [1, 3, 5],
        [2, 3, 6],
        [0, 2, 7],
        [0, 3, 8]
      ]) {
        const error = Math.hypot(
          p[mid].position[0] - (p[a].position[0] + p[b].position[0]) / 2,
          p[mid].position[1] - (p[a].position[1] + p[b].position[1]) / 2
        );
        const length = Math.hypot(
          p[a].position[0] - p[b].position[0],
          p[a].position[1] - p[b].position[1]
        );
        if (error > errorLimit || length > 48) split = true;
      }
    }
    if (split && depth < maxDepth) {
      const half = size / 2;
      refine(lon, lat, half, depth + 1);
      refine(lon + half, lat, half, depth + 1);
      refine(lon, lat + half, half, depth + 1);
      refine(lon + half, lat + half, half, depth + 1);
    } else {
      emit([coordinates[0], coordinates[1], coordinates[2]], sector);
      emit([coordinates[1], coordinates[3], coordinates[2]], sector);
    }
  };
  for (let lat = -90; lat < 90; lat += 2)
    for (let lon = -180; lon < 180; lon += 2) refine(lon, lat, 2, 0);

  // Separate rigid motion of each cut piece from its remaining deformation.
  const motions = Array.from(groups.values()).map(group => {
    const pairs = group.pairs,
      n = pairs.length;
    if (!n) return [0, 0, 0, 0, 0];
    const centers = [0, 0, 0, 0];
    for (const [a, b] of pairs) {
      centers[0] += a[0] / n;
      centers[1] += a[1] / n;
      centers[2] += b[0] / n;
      centers[3] += b[1] / n;
    }
    let dot = 0,
      cross = 0;
    for (const [a, b] of pairs) {
      const x = a[0] - centers[0],
        y = a[1] - centers[1];
      const u = b[0] - centers[2],
        v = b[1] - centers[3];
      dot += x * u + y * v;
      cross += x * v - y * u;
    }
    return [...centers, Math.atan2(cross, dot)];
  });
  // Keep the viewed location fixed while the surrounding piece rotates.
  let focusGroup = -1,
    focusDistance = Infinity;
  for (const group of groups.values())
    for (const [a, b] of group.pairs) {
      const distance = Math.hypot(a[0], a[1]) + Math.hypot(b[0], b[1]);
      if (distance < focusDistance) {
        focusDistance = distance;
        focusGroup = group.index;
      }
    }
  if (focusGroup >= 0 && focusDistance < 100) motions[focusGroup].fill(0, 0, 4);
  const pieceCenters = new Float32Array(groupIndices.length * 4),
    pieceAngles = new Float32Array(groupIndices.length);
  groupIndices.forEach((group, i) => {
    pieceCenters.set(motions[group].slice(0, 4), i * 4);
    pieceAngles[i] = motions[group][4];
  });
  return {
    positions: new Float64Array(from),
    destination: new Float32Array(to),
    texCoords: new Float32Array(uv),
    lifetime: new Float32Array(lifetime),
    pieceCenters,
    pieceAngles,
    indices: new Uint32Array(indices),
    vertexCount: indices.length
  };
}
