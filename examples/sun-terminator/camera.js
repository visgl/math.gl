// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {projectionEngine} from '@math.gl/geospatial/projection';
import {PROJECTIONS, getProjectionMesh} from './projections.js';
import {isCutMap, projectCutMap, unprojectCutMap} from './cut-maps.js';
import {createEndpoint} from './morph.js';

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
    return [((viewport.longitude + 540) % 360) - 180, viewport.latitude];
  const p = viewport.unproject([viewport.width / 2, viewport.height / 2]);
  if (isCutMap(id)) return unprojectCutMap(id, p);
  return transform(id)
    .unproject([p[0] * 100000, p[1] * 100000])
    .slice(0, 2);
}

function scaleAt(id, viewport, focus) {
  const project = createEndpoint(id, viewport);
  const center = project(...focus, focus[0]);
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
          : projectCutMap(targetId, ...focus);
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
