// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {
  getMapLayout,
  createAlbersUsaMap,
  createAirOceanMap,
  createInterruptedSinusoidalMap,
  createInterruptedMollweideMap,
  createInterruptedHomolosineMap,
} from "@math.gl/geospatial/discontinuous";

import hawaiiLand from "./assets/hawaii-land.json" with { type: "json" };

export const DISCONTINUOUS_VIEWS = {
  albersUsa: "Albers USA · Alaska & Hawaii insets",
  interruptedSinusoidal: "Interrupted sinusoidal",
  interruptedMollweide: "Interrupted Mollweide",
  interruptedHomolosine: "Interrupted Goode homolosine",
  airOcean: "AirOcean · gnomonic",
};
const factories = {
  albersUsa: createAlbersUsaMap,
  airOcean: createAirOceanMap,
  interruptedSinusoidal: createInterruptedSinusoidalMap,
  interruptedMollweide: createInterruptedMollweideMap,
  interruptedHomolosine: createInterruptedHomolosineMap,
};
const cache = new Map();

/** Bilinear samples in the example's 360 x 181 periodic, one-degree source grid. */
export function sourceSample([longitude, latitude]) {
  const x = (((longitude + 180) % 360) + 360) % 360;
  const y = Math.max(0, Math.min(180, latitude + 90));
  const west = Math.floor(x),
    south = Math.min(179, Math.floor(y));
  const dx = x - west,
    dy = y - south;
  return {
    indices: [
      south * 360 + west,
      south * 360 + ((west + 1) % 360),
      (south + 1) * 360 + west,
      (south + 1) * 360 + ((west + 1) % 360),
    ],
    weights: [(1 - dx) * (1 - dy), dx * (1 - dy), (1 - dx) * dy, dx * dy],
  };
}
export function sampleField(field, sample) {
  return sample.indices.reduce(
    (sum, index, i) => sum + field[index] * sample.weights[i],
    0,
  );
}

/** Clip source grid cells before triangulation; each emitted triangle belongs to one region. */
export function discontinuousGrid(view, step = 1) {
  const key = `${view}:${step}`;
  if (cache.has(key)) return cache.get(key);
  if (!factories[view]) throw new Error(`Unknown discontinuous view: ${view}`);
  if (!(step > 0 && 180 % step === 0))
    throw new Error("Grid step must divide 180");
  const map = factories[view]();
  const ownership = new Map(),
    vertexIds = new Map();
  const regionsAt = (p) => {
    const key = p.join(",");
    if (!ownership.has(key)) ownership.set(key, map.findRegions(p));
    return ownership.get(key);
  };
  const positions = [],
    sources = [],
    samples = [],
    indices = [],
    regionIds = [];
  const sphere = ([lon, lat]) => {
    const a = (lon * Math.PI) / 180,
      b = (lat * Math.PI) / 180;
    return [Math.cos(a) * Math.cos(b), Math.sin(a) * Math.cos(b), Math.sin(b)];
  };
  const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
  // Conservative half-space rejection also catches cells whose corners all lie
  // outside a region but whose interiors cross it. Do not discard those cells.
  const masks = map.regions.map((region) => {
    const vectors = region.boundary.map(sphere),
      interior = sphere(region.interior);
    return vectors.map((a, i) => {
      const b = vectors[(i + 1) % vectors.length];
      const n = [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
      ];
      return dot(n, interior) < 0 ? n.map((v) => -v) : n;
    });
  });
  for (let lat = -90; lat < 90; lat += step) {
    for (let lon = -180; lon < 180; lon += step) {
      const ring = [
        [lon, lat],
        [lon + step, lat],
        [lon + step, lat + step],
        [lon, lat + step],
      ];
      if (lat === -90) ring.splice(1, 1);
      if (lat + step === 90) ring.splice(2, 1);
      const vectors = ring.map(sphere);
      if (
        !masks.some((normals) =>
          normals.every((n) => vectors.some((v) => dot(n, v) >= -1e-12)),
        )
      )
        continue;
      const common = regionsAt(ring[0]).find((id) =>
        ring.every((p) => regionsAt(p).includes(id)),
      );
      if (common) {
        const corners = ring.map((p) => {
          const key = `${common}:${p.join(",")}`;
          if (!vertexIds.has(key)) {
            vertexIds.set(key, positions.length / 2);
            positions.push(...map.projectPoint(p, common).position);
            sources.push(p);
            samples.push(sourceSample(p));
            regionIds.push(common);
          }
          return vertexIds.get(key);
        });
        for (let i = 1; i < corners.length - 1; i++)
          indices.push(corners[0], corners[i], corners[i + 1]);
        continue;
      }
      const parts = map.projectPolygon([ring], { tolerance: 1e-5 });
      for (const part of parts) {
        let outline = part.coordinates[0],
          source = part.sourceCoordinates[0];
        if (
          outline.length > 1 &&
          outline[0][0] === outline.at(-1)[0] &&
          outline[0][1] === outline.at(-1)[1]
        ) {
          outline = outline.slice(0, -1);
          source = source.slice(0, -1);
        }
        if (outline.length < 3) continue;
        // These are small convex spherical grid fragments, not arbitrary feature polygons.
        // A spherical interior point keeps the fan inside its local panel.
        const sum = source
          .map(sphere)
          .reduce((a, p) => a.map((v, i) => v + p[i]), [0, 0, 0]);
        const center = [
          (Math.atan2(sum[1], sum[0]) * 180) / Math.PI,
          (Math.atan2(sum[2], Math.hypot(sum[0], sum[1])) * 180) / Math.PI,
        ];
        const projected = map.projectPoint(center, part.regionId);
        if (!projected)
          throw new Error("Clipped cell has no region-local center");
        const start = positions.length / 2;
        for (const [p, geographic] of [
          [projected.position, center],
          ...outline.map((p, i) => [p, source[i]]),
        ]) {
          positions.push(...p);
          sources.push(geographic);
          samples.push(sourceSample(geographic));
          regionIds.push(part.regionId);
        }
        for (let i = 0; i < outline.length; i++)
          indices.push(
            start,
            start + i + 1,
            start + ((i + 1) % outline.length) + 1,
          );
      }
    }
  }
  const layout = getMapLayout(map, { tolerance: 1e-5 });
  const lines = [];
  for (let lon = -180; lon <= 180; lon += 30)
    lines.push(
      ...map.projectLine(Array.from({ length: 181 }, (_, i) => [lon, i - 90])),
    );
  for (let lat = -60; lat <= 60; lat += 30)
    lines.push(
      ...map.projectLine(Array.from({ length: 361 }, (_, i) => [i - 180, lat])),
    );
  const result = {
    map,
    positions: new Float32Array(positions),
    indices: new Uint32Array(indices),
    sources,
    samples,
    regionIds,
    lines,
    layout,
    referenceLand: layout.regions.some((region) => region.kind === "inset")
      ? hawaiiLand.geometry.coordinates.flatMap((polygon) =>
          map.projectPolygon(polygon, { tolerance: 1e-5 }),
        )
      : [],
  };
  cache.set(key, result);
  return result;
}
