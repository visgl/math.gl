// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {WebMercatorViewport} from '@deck.gl/core';
import {projectionEngine} from '@math.gl/geospatial/projection';
import {MapEngine, prepareProjectionSurface} from '@math.gl/geospatial/maps';
import {PROJECTIONS} from './constants.ts';
const maps = new Map<string, MapEngine>();
const lobes = [-180, -100, -20, 80, 180];
export const isCutMap = (id: string) => ['isinu', 'imoll', 'albers-usa', 'h3'].includes(id);
export function getMap(id: string): MapEngine {
  if (!maps.has(id)) {
    const pieces = lobes
      .slice(0, -1)
      .map((left, i) => [left, (left + lobes[i + 1]) / 2, lobes[i + 1]] as const);
    maps.set(
      id,
      id === 'h3'
        ? new MapEngine(
            {version: 1, id, radius: 63.78137, definition: {type: 'h3'}},
            {presets: [h3MapPreset, albersUsaMapPreset, interruptedMapPreset]}
          )
        : new MapEngine(
            {
              version: 1,
              id,
              radius: id === 'albers-usa' ? 100 : 63.78137,
              definition:
                id === 'albers-usa'
                  ? {type: 'albers-usa'}
                  : {
                      type: 'interrupted',
                      projection: id === 'isinu' ? 'sinusoidal' : 'mollweide',
                      lobes: {north: pieces, south: pieces}
                    }
            },
            {presets: [h3MapPreset, albersUsaMapPreset, interruptedMapPreset]}
          )
    );
  }
  return maps.get(id)!;
}
export function projectCutMap(id: string, lon: number, lat: number, sector = lon) {
  const map = getMap(id);
  const interrupted = id === 'isinu' || id === 'imoll';
  // Only exact cut banks need sector ownership; ordinary samples use the
  // engine's compiled point path once.
  const onBank =
    interrupted && (Math.abs(lat) >= 89.99999 || lobes.some(edge => Math.abs(lon - edge) < 1e-8));
  const preferred = onBank
    ? map.findRegions([sector, Math.max(-89.99999, Math.min(89.99999, lat))])[0]
    : undefined;
  const point = map.projectSurfacePoint([lon, lat], preferred);
  return point
    ? Object.assign([...point.position, 0], {
        part: ['isinu', 'imoll'].includes(id)
          ? (() => {
              const bank = lobes.slice(1).findIndex(edge => sector < edge);
              return bank < 0 ? lobes.length - 2 : bank;
            })()
          : map.regions.findIndex(r => r.id === point.regionId)
      })
    : null;
}
export const cutPart = (id: string, lon: number, lat: number, sector = lon) =>
  projectCutMap(id, lon, lat, sector)?.part ?? -1;
export const unprojectCutMap = (id: string, p: number[]) =>
  getMap(id).unprojectPoint([p[0], p[1]]).at(-1)?.position ?? null;
export const buildCutMesh = (id: string) => prepareMapSurface(getMap(id));
export function getCutRegions(id: string) {
  const map = getMap(id);
  return map.getLayout().regions.map(region => ({
    id: region.id,
    index: map.regions.findIndex(r => r.id === region.id),
    bounds: region.bounds,
    longitudeOrigin: map.regions.find(r => r.id === region.id)!.interior[0],
    unproject: (p: number[]) => map.unprojectPoint([p[0], p[1]], region.id)[0]?.position ?? null
  }));
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

function transform(id) {
  const preset = PROJECTIONS.find(p => p.id === id);
  return projectionEngine.createProjection({
    from: 'WGS84',
    to: `+proj=${id} +datum=WGS84 +units=m ${preset.parameters}`
  });
}

/** Geographic focus at the viewport center, including interrupted map lobes. */
export function geographicCenter(id, viewport) {
  if (id === 'globe' || id === 'map')
    return [((((viewport.longitude + 180) % 360) + 360) % 360) - 180, viewport.latitude];
  // The camera target sits at the padded center, beyond any overlaid controls.
  const {left = 0, right = 0, top = 0, bottom = 0} = viewport.padding || {};
  const p = viewport.unproject([
    (viewport.width + left - right) / 2,
    (viewport.height + top - bottom) / 2
  ]);
  if (isCutMap(id)) return unprojectCutMap(id, p);
  return transform(id)
    .unproject([p[0] * 100000, p[1] * 100000])
    .slice(0, 2);
}

function scaleAt(id, viewport, focus) {
  const project = createEndpoint(id, viewport);
  const center = project(focus[0], focus[1], focus[0]);
  if (!center) return NaN;
  const extent =
    id === 'map' ? [-180, -85.051129, 180, 85.051129] : PROJECTIONS.find(p => p.id === id).extent;
  // Use an inward derivative at a coverage edge; clamped probes have zero scale.
  const values = [
    [focus[0] + 0.01 > extent[2] ? -0.01 : 0.01, 0],
    [0, focus[1] + 0.01 > extent[3] ? -0.01 : 0.01]
  ]
    .map(([dx, dy]) => {
      const point = project(focus[0] + dx, focus[1] + dy, focus[0]);
      return point
        ? Math.hypot(
            point.position[0] - center.position[0],
            point.position[1] - center.position[1]
          ) / 0.01
        : NaN;
    })
    .filter(v => Number.isFinite(v) && v > 0);
  return values.length === 2 ? Math.sqrt(values[0] * values[1]) : values[0];
}

/** Match geographic focus and local apparent scale, not incompatible zoom numbers. */
export function transferCamera(sourceId, sourceViewport, targetId, targetView) {
  let focus;
  try {
    focus = geographicCenter(sourceId, sourceViewport);
  } catch {
    focus = null;
  }
  const sourceInvalid = !focus?.every(Number.isFinite);
  const preset = PROJECTIONS.find(p => p.id === targetId);
  const extent = targetId === 'map' ? [-180, -85.051129, 180, 85.051129] : preset.extent;
  if (sourceInvalid) focus = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
  const originalFocus = focus;
  focus = [
    Math.max(extent[0], Math.min(extent[2], focus[0])),
    Math.max(extent[1], Math.min(extent[3], focus[1]))
  ];
  const native = targetId === 'globe' || targetId === 'map';
  let target = null;
  if (!native) {
    const projection = isCutMap(targetId) ? null : transform(targetId);
    const edgeFocus = focus;
    // Perspective horizons can exclude points inside the rectangular extent.
    // Move only out-of-domain centers inward until a valid point is reached.
    for (let step = 0; step <= 20; step++) {
      const t = step / 20;
      const preferred = preset.focus || [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
      focus = edgeFocus.map((v, i) => v + (preferred[i] - v) * t);
      try {
        target = projection
          ? projection
              .project(focus)
              .slice(0, 2)
              .map(v => v / 100000)
              .concat(0)
          : projectCutMap(targetId, focus[0], focus[1]);
        if (target?.every(Number.isFinite)) break;
      } catch {
        target = null;
      }
    }
    if (!target?.every(Number.isFinite))
      throw new Error('This location is outside the projection domain');
  }
  const camera = native
    ? {longitude: focus[0], latitude: focus[1], zoom: 0, minZoom: -1, maxZoom: 7}
    : {target, zoom: 0, minZoom: -4, maxZoom: 12};
  const viewport = () =>
    targetView.makeViewport({
      width: sourceViewport.width,
      height: sourceViewport.height,
      viewState: camera
    });
  const desired = sourceInvalid ? NaN : scaleAt(sourceId, sourceViewport, originalFocus);
  // Globe camera scale is latitude dependent; measure the actual target viewport.
  for (let i = 0; i < 3; i++) {
    const current = scaleAt(targetId, viewport(), focus);
    if (!(desired > 0 && current > 0)) break;
    camera.zoom = Math.max(
      camera.minZoom,
      Math.min(camera.maxZoom, camera.zoom + Math.log2(desired / current))
    );
  }
  const clamped = sourceInvalid || focus.some((v, i) => Math.abs(v - originalFocus[i]) > 1e-6);
  if (targetId === 'albers-usa' && clamped) {
    camera.target = [0, 0, 0];
    camera.zoom = Math.log2(
      Math.min(sourceViewport.width / 91, sourceViewport.height / 47.6) * 0.85
    );
  }
  if (
    clamped &&
    !native &&
    (sourceInvalid || (extent[2] - extent[0] < 40 && extent[3] - extent[1] < 30))
  ) {
    const [left, bottom, right, top] = getProjectionMesh(targetId).bounds;
    camera.target = [(left + right) / 2, (bottom + top) / 2, 0];
    camera.zoom = Math.log2(
      Math.min(sourceViewport.width / (right - left), sourceViewport.height / (top - bottom)) * 0.8
    );
  } else if (sourceInvalid && native) camera.zoom = 2;
  return {camera, clamped};
}

/** A queued rAF timestamp can precede CPU mesh preparation; never extrapolate. */
export function getMorphProgress(elapsed, duration = 1500) {
  const t = Math.max(0, Math.min(1, elapsed / duration));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

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
  const project = (lon, lat, sector = lon) => {
    const extent = id === 'map' ? [-180, -85.051129, 180, 85.051129] : preset.extent;
    const inside = lon >= extent[0] && lon <= extent[2] && lat >= extent[1] && lat <= extent[3];
    const clampedLon = Math.max(extent[0], Math.min(extent[2], lon));
    const clampedLat = Math.max(extent[1], Math.min(extent[3], lat));
    try {
      const coordinate: number[] & {part?: number} = native
        ? [
            id === 'map'
              ? clampedLon + 360 * Math.round((viewport.longitude - sector) / 360)
              : clampedLon,
            clampedLat,
            0
          ]
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
        seam: id === 'map' ? Math.round((viewport.longitude - sector) / 360) : 0,
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
  const endpoint = (lon, lat, sector = lon) => {
    const key = `${lon},${lat},${id === 'map' ? Math.round((viewport.longitude - sector) / 360) : ['isinu', 'imoll'].includes(id) ? cutPart(id, lon, lat, sector) : ''}`;
    if (!cache.has(key)) cache.set(key, project(lon, lat, sector));
    return cache.get(key);
  };
  if (id === 'map') {
    endpoint.worldWidth = 512 * viewport.scale;
    const count = Math.ceil(viewport.width / endpoint.worldWidth / 2);
    endpoint.wrapCopies = Array.from({length: count * 2 + 1}, (_, i) => i - count).filter(
      copy => Math.abs(copy * endpoint.worldWidth) < (viewport.width + endpoint.worldWidth) / 2
    );
  }
  endpoint.maxEdgeLength = 20;
  endpoint.width = viewport.width;
  endpoint.height = viewport.height;
  return endpoint;
}

const meshes = new Map();
export function getProjectionMesh(id: string) {
  if (!meshes.has(id)) {
    const preset = PROJECTIONS.find(p => p.id === id)!;
    const projection = isCutMap(id) ? null : transform(id);
    const mesh = isCutMap(id)
      ? prepareMapSurface(getMap(id))
      : prepareProjectionSurface(projection, {
          extent: preset.extent as [number, number, number, number],
          scale: 1 / 100000,
          maxAngularStep: [
            (preset.extent[2] - preset.extent[0]) / 360,
            (preset.extent[3] - preset.extent[1]) / 180
          ],
          maxEdgeLength: 20
        });
    if (!mesh.vertexCount) throw new Error(`No visible surface for ${preset.label}`);
    if (meshes.size >= 4) meshes.delete(meshes.keys().next().value);
    meshes.set(id, mesh);
  }
  return meshes.get(id);
}

import {h3MapPreset, albersUsaMapPreset, interruptedMapPreset} from '@math.gl/geospatial/maps';

import {prepareMapSurface} from '@math.gl/geospatial/maps';
