// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {h3Face, projectH3, unprojectH3, h3Regions, buildH3Mesh} from './h3-net.js';
import {WebMercatorViewport} from '@deck.gl/core';
import {geoAlbersUsa, geoAlbers, geoConicEqualArea} from 'd3-geo';
import {projectionEngine} from '@math.gl/geospatial/projection';
import {interruptedPoint, LOBES} from './cuts.js';

const insetBounds = [
  [-42.5, -23.4, -21.4, -12],
  [-21.4, -23.4, -11.5, -16.6]
];
const inInset = (x, y) =>
  insetBounds.some(([w, south, e, n]) => x >= w && x <= e && y >= south && y <= n);
const usa = geoAlbersUsa().scale(100).translate([0, 0]);
const usaParts = [
  {projection: geoAlbers().scale(100).translate([0, 0]), bounds: [-45.5, -23.8, 45.5, 23.8]},
  {
    projection: geoConicEqualArea()
      .rotate([154, 0])
      .center([-2, 58.5])
      .parallels([55, 65])
      .scale(35)
      .translate([-30.7, 20.1]),
    bounds: [-42.5, -23.4, -21.4, -12]
  },
  {
    projection: geoConicEqualArea()
      .rotate([157, 0])
      .center([-3, 19.9])
      .parallels([8, 18])
      .scale(100)
      .translate([-20.5, 21.2]),
    bounds: [-21.4, -23.4, -11.5, -16.6]
  }
];

function usaRegion(lon, lat) {
  for (let part = 0; part < usaParts.length; part++) {
    const p = usaParts[part].projection([lon, lat]);
    const [west, south, east, north] = usaParts[part].bounds;
    if (p && p[0] >= west && p[0] <= east && -p[1] >= south && -p[1] <= north) return {part, p};
  }
  return null;
}
const mollweide = LOBES.slice(0, -1).map((left, i) =>
  projectionEngine.createProjection({
    from: 'WGS84',
    to: `+proj=moll +datum=WGS84 +lon_0=${(left + LOBES[i + 1]) / 2}`
  })
);
export const isCutMap = id => ['isinu', 'imoll', 'albers-usa', 'h3'].includes(id);
const lobe = lon => {
  const i = LOBES.findIndex((left, i) => i < 4 && lon < LOBES[i + 1]);
  return i < 0 ? 3 : i;
};
export function cutPart(id, lon, lat, sector = lon) {
  if (id === 'h3') return h3Face(lon, lat);
  if (id === 'albers-usa') return usaRegion(lon, lat)?.part ?? -1;
  return lobe(sector);
}
export function projectCutMap(id, lon, lat, sector = lon) {
  if (id === 'h3') return projectH3(lon, lat);
  if (id === 'albers-usa') {
    const region = usaRegion(lon, lat);
    if (!region || (region.part === 0 && inInset(region.p[0], -region.p[1]))) return null;
    return Object.assign([region.p[0], -region.p[1], 0], {part: region.part});
  }
  if (id === 'isinu') return interruptedPoint(lon, lat, sector);
  const i = lobe(sector),
    center = (LOBES[i] + LOBES[i + 1]) / 2;
  const p = mollweide[i].project([lon, lat]);
  return [
    p[0] / 100000 + (((center * Math.PI) / 180) * 63.78137 * Math.SQRT2 * 2) / Math.PI,
    p[1] / 100000,
    0
  ];
}
export function unprojectCutMap(id, p) {
  if (id === 'h3') return unprojectH3(p);
  if (id === 'albers-usa') return usa.invert([p[0], -p[1]]);
  const candidates = LOBES.slice(0, -1).map((left, i) => {
    const center = (left + LOBES[i + 1]) / 2;
    let point;
    if (id === 'isinu') {
      const lat = ((p[1] / 63.78137) * 180) / Math.PI;
      point = [
        center +
          (((p[0] / 63.78137) * 180) / Math.PI - center) /
            Math.max(1e-6, Math.cos((lat * Math.PI) / 180)),
        lat
      ];
    } else {
      try {
        point = mollweide[i].unproject([
          (p[0] - (((center * Math.PI) / 180) * 63.78137 * Math.SQRT2 * 2) / Math.PI) * 100000,
          p[1] * 100000
        ]);
      } catch {
        return {point: null, error: Infinity};
      }
    }
    point[0] = Math.max(left, Math.min(LOBES[i + 1], point[0]));
    const projected = projectCutMap(id, point[0], point[1], center);
    return {point: point.slice(0, 2), error: Math.hypot(projected[0] - p[0], projected[1] - p[1])};
  });
  candidates.sort((a, b) => a.error - b.error);
  return candidates[0].point;
}

function buildUsaMesh() {
  // D3's Albers USA component projections and inset clip rectangles, at scale 100.
  // Tessellate in projected space so inset borders are straight, shared cuts.
  const parts = usaParts;
  const positions = [],
    texCoords = [];
  for (const [
    part,
    {
      projection,
      bounds: [west, south, east, north]
    }
  ] of parts.entries()) {
    const axis = (min, max, cuts) => {
      const limits = [min, ...cuts.filter(v => v > min && v < max), max].sort((a, b) => a - b);
      const nodes = [min];
      for (let i = 1; i < limits.length; i++) {
        const a = limits[i - 1],
          b = limits[i],
          count = Math.ceil((b - a) / 0.25);
        for (let j = 1; j <= count; j++) nodes.push(a + ((b - a) * j) / count);
      }
      return nodes;
    };
    const xs = axis(
      west,
      east,
      insetBounds.flatMap(b => [b[0], b[2]])
    );
    const ys = axis(
      south,
      north,
      insetBounds.flatMap(b => [b[1], b[3]])
    );
    for (let y = 0; y < ys.length - 1; y++)
      for (let x = 0; x < xs.length - 1; x++) {
        const left = xs[x],
          right = xs[x + 1],
          bottom = ys[y],
          top = ys[y + 1];
        if (part === 0 && inInset((left + right) / 2, (bottom + top) / 2)) continue;
        for (const triangle of [
          [
            [left, bottom],
            [right, bottom],
            [left, top]
          ],
          [
            [right, bottom],
            [right, top],
            [left, top]
          ]
        ]) {
          const geographic = triangle.map(([x, y]) => projection.invert([x, -y]));
          if (
            Math.max(...geographic.map(p => p[0])) - Math.min(...geographic.map(p => p[0])) >
            180
          ) {
            for (const p of geographic) if (p[0] < 0) p[0] += 360;
          }
          triangle.forEach((p, i) => {
            positions.push(p[0], p[1], 0);
            texCoords.push((geographic[i][0] + 180) / 360, (90 - geographic[i][1]) / 180);
          });
        }
      }
  }
  return {
    positions: new Float64Array(positions),
    texCoords: new Float32Array(texCoords),
    indices: Uint32Array.from({length: positions.length / 3}, (_, i) => i),
    vertexCount: positions.length / 3,
    bounds: [-45.5, -23.8, 45.5, 23.8]
  };
}

export function buildCutMesh(id) {
  if (id === 'h3') return buildH3Mesh();
  if (id === 'albers-usa') return buildUsaMesh();
  const regions =
    id === 'albers-usa'
      ? [
          [-130, 20, -60, 55],
          [-180, 50, -129, 73],
          [170, 50, 180, 55],
          [-162, 18, -154, 24]
        ]
      : LOBES.slice(0, -1).map((left, i) => [left, -90, LOBES[i + 1], 90]);
  const positions = [],
    texCoords = [];
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  const step = id === 'albers-usa' ? 0.25 : 1;
  for (const [west, south, east, north] of regions) {
    for (let lat = south; lat < north; lat += step)
      for (let lon = west; lon < east; lon += step) {
        for (const triangle of [
          [
            [lon, lat],
            [lon + step, lat],
            [lon, lat + step]
          ],
          [
            [lon + step, lat],
            [lon + step, lat + step],
            [lon, lat + step]
          ]
        ]) {
          const sector = lon + step / 2;
          const p = triangle.map(([x, y]) => projectCutMap(id, x, y, sector));
          const parts = triangle.map(([x, y]) => cutPart(id, x, y, sector));
          if (!p.every(v => v?.every(Number.isFinite)) || !parts.every(v => v === parts[0]))
            continue;
          if (p.some((v, i) => Math.hypot(v[0] - p[(i + 1) % 3][0], v[1] - p[(i + 1) % 3][1]) > 20))
            continue;
          p.forEach((v, i) => {
            positions.push(...v);
            texCoords.push((triangle[i][0] + 180) / 360, (90 - triangle[i][1]) / 180);
            bounds[0] = Math.min(bounds[0], v[0]);
            bounds[1] = Math.min(bounds[1], v[1]);
            bounds[2] = Math.max(bounds[2], v[0]);
            bounds[3] = Math.max(bounds[3], v[1]);
          });
        }
      }
  }
  return {
    positions: new Float64Array(positions),
    texCoords: new Float32Array(texCoords),
    indices: Uint32Array.from({length: positions.length / 3}, (_, i) => i),
    vertexCount: positions.length / 3,
    bounds
  };
}

/** Projected pieces of a cut map, including their independent geographic inverse. */
export function getCutRegions(id) {
  if (id === 'h3') return h3Regions();
  if (id === 'albers-usa')
    return usaParts.map((part, index) => ({
      id: ['lower48', 'alaska', 'hawaii'][index],
      index,
      bounds: part.bounds,
      longitudeOrigin: [-96, -160, -157][index],
      unproject: ([x, y]) => part.projection.invert([x, -y])
    }));
  if (id === 'isinu' || id === 'imoll')
    return LOBES.slice(0, -1).map((left, index) => {
      const right = LOBES[index + 1],
        center = (left + right) / 2;
      const xScale =
        ((63.78137 * Math.PI) / 180) * (id === 'imoll' ? (Math.SQRT2 * 2) / Math.PI : 1);
      const height = id === 'imoll' ? 90.20047848073676 : (Math.PI / 2) * 63.78137;
      return {
        id: 'lobe-' + index,
        index,
        bounds: [left * xScale, -height, right * xScale, height],
        unproject: ([x, y]) => {
          let p;
          if (id === 'isinu') {
            const lat = ((y / 63.78137) * 180) / Math.PI;
            p = [
              center + (x / xScale - center) / Math.max(1e-6, Math.cos((lat * Math.PI) / 180)),
              lat
            ];
          } else p = mollweide[index].unproject([(x - center * xScale) * 100000, y * 100000]);
          return [Math.max(left, Math.min(right, p[0])), p[1]];
        }
      };
    });
  return [];
}

/**
 * Geographic tile-sampling viewports for the visible portions of each cut.
 * Pixel density follows each piece's on-screen size, including inset scaling.
 */
export function getCutViewports(id, viewport, {pixelRatio = 1, oversample = 2} = {}) {
  const corners = [
    [0, 0],
    [viewport.width, 0],
    [0, viewport.height],
    [viewport.width, viewport.height]
  ].map(p => viewport.unproject(p));
  const visible = [
    Math.min(...corners.map(p => p[0])),
    Math.min(...corners.map(p => p[1])),
    Math.max(...corners.map(p => p[0])),
    Math.max(...corners.map(p => p[1]))
  ];
  const viewports = [];
  for (const region of getCutRegions(id)) {
    const bounds = [
      Math.max(visible[0], region.bounds[0]),
      Math.max(visible[1], region.bounds[1]),
      Math.min(visible[2], region.bounds[2]),
      Math.min(visible[3], region.bounds[3])
    ];
    if (bounds[0] >= bounds[2] || bounds[1] >= bounds[3]) continue;
    const points = [];
    for (let y = 0; y <= 8; y++)
      for (let x = 0; x <= 8; x++) {
        try {
          const p = region.unproject([
            bounds[0] + ((bounds[2] - bounds[0]) * x) / 8,
            bounds[1] + ((bounds[3] - bounds[1]) * y) / 8
          ]);
          if (p?.every(Number.isFinite))
            points.push([
              region.longitudeOrigin !== undefined
                ? region.longitudeOrigin + ((p[0] - region.longitudeOrigin + 540) % 360) - 180
                : p[0],
              Math.max(-85.051129, Math.min(85.051129, p[1]))
            ]);
        } catch {}
      }
    if (!points.length) continue;
    const geographic = [
      Math.min(...points.map(p => p[0])),
      Math.min(...points.map(p => p[1])),
      Math.max(...points.map(p => p[0])),
      Math.max(...points.map(p => p[1]))
    ];
    const a = viewport.project([bounds[0], bounds[1], 0]),
      b = viewport.project([bounds[2], bounds[3], 0]);
    const width = Math.max(1, Math.abs(b[0] - a[0]) * pixelRatio * oversample);
    const height = Math.max(1, Math.abs(b[1] - a[1]) * pixelRatio * oversample);
    if (geographic[2] - geographic[0] < 1e-6 || geographic[3] - geographic[1] < 1e-6) continue;
    const fitted = new WebMercatorViewport({
      id: 'sample-' + id + '-' + region.id,
      width,
      height
    }).fitBounds(
      [
        [geographic[0], geographic[1]],
        [geographic[2], geographic[3]]
      ],
      {maxZoom: 12}
    );
    const sampling = new WebMercatorViewport({
      id: 'sample-' + id + '-' + region.id,
      width,
      height,
      longitude: fitted.longitude,
      latitude: fitted.latitude,
      zoom: fitted.zoom
    });
    viewports.push(sampling);
  }
  return viewports;
}
