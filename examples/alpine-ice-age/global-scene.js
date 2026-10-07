// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import { Deck, OrthographicView, COORDINATE_SYSTEM } from '@deck.gl/core';
import { SimpleMeshLayer } from '@deck.gl/mesh-layers';
import { PathLayer } from '@deck.gl/layers';
import { Geometry } from '@luma.gl/engine';
import {
  ProjectionTransform,
  albersEqualArea,
  equalEarth,
  mollweide,
  robinson,
  equidistantCylindrical,
  mercator,
  sinusoidal,
  millerCylindrical
} from '@math.gl/projection';
import { interpolateField } from './data.js';
import {nearestOSFChapter} from './osf-data.js';
import { projectionWeights } from './projection-transition.js';
import { REGIONAL_VIEWS, regionalCoordinate, inRegion } from './regional-views.js';
export const GLOBAL_VIEWS = {
  globe: 'Globe',
  eqearth: 'Equal Earth',
  moll: 'Mollweide',
  robin: 'Robinson',
  sinu: 'Sinusoidal',
  mill: 'Miller cylindrical',
  eqc: 'Equirectangular',
  merc: 'Mercator',
  ...Object.fromEntries(Object.entries(REGIONAL_VIEWS).map(([id, region]) => [id, region.title]))
};
const R = 6371008.8,
  RAD = Math.PI / 180;
const plugins = {
  eqearth: equalEarth,
  moll: mollweide,
  robin: robinson,
  sinu: sinusoidal,
  mill: millerCylindrical,
  eqc: equidistantCylindrical,
  merc: mercator,
  albersNorthAmerica: albersEqualArea,
  albersEurope: albersEqualArea
};
const engines = Object.fromEntries(
  Object.entries(plugins).map(([id, plugin]) => [
    id,
    new ProjectionTransform({
      from: `+proj=longlat +R=${R}`,
      to: `${REGIONAL_VIEWS[id]?.definition || `+proj=${id}`} +R=${R} +units=m`,
      projections: [plugin]
    })
  ])
);
const grids = new Map();
function grid(view) {
  if (grids.has(view)) return grids.get(view);
  const positions = new Float64Array(361 * 181 * 2);
  for (let y = 0; y <= 180; y++)
    for (let x = 0; x <= 360; x++) {
      const i = (y * 361 + x) * 2;
      positions.set(regionalCoordinate(view, x - 180, y - 90), i);
    }
  if (view !== 'globe') engines[view].projectFlatSync(positions, 2);
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  if (view !== 'globe')
    for (let i = 0; i < positions.length; i += 2) {
      const vertex = i / 2;
      if (!inRegion(view, vertex % 361 - 180, Math.floor(vertex / 361) - 90)) continue;
      minX = Math.min(minX, positions[i]);
      maxX = Math.max(maxX, positions[i]);
      minY = Math.min(minY, positions[i + 1]);
      maxY = Math.max(maxY, positions[i + 1]);
    }
  const centerX = view === 'globe' ? 0 : (minX + maxX) / 2,
    centerY = view === 'globe' ? 0 : (minY + maxY) / 2;
  maxX = view === 'globe' ? 0 : (maxX - minX) / 2;
  maxY = view === 'globe' ? 0 : (maxY - minY) / 2;
  if (view !== 'globe')
    for (let i = 0; i < positions.length; i += 2) {
      positions[i] -= centerX;
      positions[i + 1] -= centerY;
    }
  const indices = new Uint32Array(360 * 180 * 6);
  let k = 0;
  for (let y = 0; y < 180; y++)
    for (let x = 0; x < 360; x++) {
      const i = y * 361 + x;
      if (!inRegion(view, x - 180, y - 90) || !inRegion(view, x - 179, y - 89)) continue;
      indices.set([i, i + 1, i + 361, i + 1, i + 362, i + 361], k);
      k += 6;
    }
  const result = { positions, indices: indices.slice(0, k), maxX, maxY, centerX, centerY };
  grids.set(view, result);
  return result;
}
function color(bed, ice, showIce, ghost) {
  let c =
    bed < 0
      ? [
          20 + Math.min(22, Math.max(0, (bed + 5000) / 200)),
          57 + Math.max(0, (bed + 5000) / 200),
          80 + Math.max(0, (bed + 5000) / 250)
        ]
      : bed < 700
        ? [87, 112, 93]
        : bed < 2000
          ? [134, 136, 111]
          : [177, 174, 154];
  if (showIce && ice > 1) {
    const amount = Math.min(1, ice / 120) * (ghost ? 0.82 : 1),
      thick = Math.min(1, ice / 1500),
      gray = c.reduce((a, b) => a + b, 0) / 3;
    c = c.map((v, i) => {
      const base = gray * 0.8 + v * 0.2,
        iceColor = [160 + 75 * thick, 205 + 35 * thick, 224 + 21 * thick][i];
      return base * (1 - amount) + iceColor * amount;
    });
  }
  return c;
}
export function createGlobalScene(canvas, onError) {
  let current,
    options,
    longitude = -25,
    latitude = 35,
    dragging,
    weights,
    transition,
    animationFrame;
  const duration = 1200;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const deck = new Deck({
    canvas,
    views: new OrthographicView({ flipY: false, near: -10000, far: 10000 }),
    initialViewState: { target: [0, 0, 0], zoom: 0, minZoom: -1, maxZoom: 4 },
    controller: { dragPan: true, scrollZoom: true },
    getCursor: () => (dragging ? 'grabbing' : 'grab'),
    onError
  });
  function sampleTransition(now) {
    if (!transition) return;
    const fraction = (now - transition.start) / duration;
    weights = projectionWeights(transition.from, transition.target, fraction);
    if (fraction >= 1) transition = null;
  }
  function animate(now) {
    animationFrame = null;
    sampleTransition(now);
    draw(current, options);
    if (transition) animationFrame = requestAnimationFrame(animate);
  }
  function render(model, opts) {
    const now = performance.now();
    sampleTransition(now);
    const viewChanged = options?.view !== opts.view;
    const regionalSwitch = viewChanged && (REGIONAL_VIEWS[opts.view] || Object.keys(weights || {}).some((id) => REGIONAL_VIEWS[id]));
    if (!weights || reducedMotion.matches || regionalSwitch) {
      weights = { [opts.view]: 1 };
      transition = null;
    } else if (viewChanged) {
      transition = { from: { ...weights }, target: opts.view, start: now };
    }
    current = model;
    options = opts;
    if (viewChanged)
      deck.setProps({ initialViewState: { target: [0, 0, 0], zoom: 0, minZoom: -1, maxZoom: 4 } });
    draw(model, opts);
    if (transition && !animationFrame) animationFrame = requestAnimationFrame(animate);
  }
  function draw(model, opts) {
    const { view, age, showIce, ghost, labels } = opts;
    const g = grid(view),
      size = 361 * 181;
    const ice = model.footprints
      ? model.ice.subarray(model.manifest.ages.indexOf(nearestOSFChapter(age).age) * model.count,
          (model.manifest.ages.indexOf(nearestOSFChapter(age).age) + 1) * model.count)
      : interpolateField(model.ice, model.count, model.manifest.ages, age),
      bed = interpolateField(model.bed, model.count, model.manifest.ages, age);
    const positions = new Float32Array(size * 3),
      normals = new Float32Array(size * 3),
      colors = new Float32Array(size * 3);
    const width = canvas.clientWidth || 900,
      height = canvas.clientHeight || 570;
    const globeScale = Math.min(width, height) * 0.42;
    const endpoints = Object.entries(weights).map(([id, weight]) => {
      const mesh = grid(id);
      const scale =
        id === 'globe'
          ? globeScale
          : Math.min((width * 0.46) / mesh.maxX, (height * 0.43) / mesh.maxY);
      return { id, weight, mesh, scale };
    });
    const globeWeight = weights.globe || 0;
    const tilt = latitude * RAD;
    function point(lon, lat) {
      const a = (lon - longitude) * RAD,
        b = lat * RAD;
      const x = Math.cos(b) * Math.sin(a),
        y = Math.sin(b),
        z = Math.cos(b) * Math.cos(a);
      return [x, y * Math.cos(tilt) - z * Math.sin(tilt), y * Math.sin(tilt) + z * Math.cos(tilt)];
    }
    // Every endpoint shares vertex identities, including the longitude seam.
    // Ice, graticules and text follow the same weighted geographical positions.
    function blendedPoint(lon, lat, lift = 0) {
      const result = [0, 0, 0];
      for (const endpoint of endpoints) {
        let p;
        if (endpoint.id === 'globe') p = point(lon, lat).map((v) => v * (endpoint.scale + lift));
        else {
          p = engines[endpoint.id].projectSync(regionalCoordinate(endpoint.id, lon, lat));
          p = [
            (p[0] - endpoint.mesh.centerX) * endpoint.scale,
            (p[1] - endpoint.mesh.centerY) * endpoint.scale,
            lift
          ];
        }
        for (let axis = 0; axis < 3; axis++) result[axis] += p[axis] * endpoint.weight;
      }
      return result;
    }
    for (let y = 0; y <= 180; y++)
      for (let x = 0; x <= 360; x++) {
        const i = y * 361 + x,
          j = y * 360 + (x % 360),
          c = color(bed[j], model.footprints ? ice[j] * 1500 : ice[j], showIce, ghost);
        const sphere = point(x - 180, y - 90);
        for (const endpoint of endpoints) {
          const p =
            endpoint.id === 'globe'
              ? sphere.map((v) => v * endpoint.scale)
              : [
                  endpoint.mesh.positions[i * 2] * endpoint.scale,
                  endpoint.mesh.positions[i * 2 + 1] * endpoint.scale,
                  0
                ];
          for (let axis = 0; axis < 3; axis++) positions[i * 3 + axis] += p[axis] * endpoint.weight;
        }
        const normal = sphere.map(
          (v, axis) => v * globeWeight + (axis === 2 ? 1 - globeWeight : 0)
        );
        const length = Math.hypot(...normal) || 1;
        normals.set(
          normal.map((v) => v / length),
          i * 3
        );
        const shade = 1 - globeWeight * 0.3 * (1 - Math.max(0, sphere[2]));
        colors.set(
          c.map((v) => (v / 255) * shade),
          i * 3
        );
      }
    const mesh = new Geometry({
      topology: 'triangle-list',
      indices: g.indices,
      attributes: {
        positions: { size: 3, value: positions },
        normals: { size: 3, value: normals },
        colors: { size: 3, value: colors }
      }
    });
    const lines = [];
    if (labels) {
      const [west, south, east, north] = REGIONAL_VIEWS[view]?.bounds || [-180, -85, 180, 85];
      for (let lon = Math.ceil(west / 30) * 30; lon <= east; lon += 30) {
        const path = [];
        for (let lat = south; lat <= north; lat += 1) path.push(blendedPoint(lon, lat, 0.6));
        lines.push({ path, opacity: 1 });
      }
      for (let lat = Math.ceil(south / 30) * 30; lat <= Math.min(north, 60); lat += 30) {
        const path = [];
        for (let lon = west; lon <= east; lon += 1) path.push(blendedPoint(lon, lat, 0.6));
        lines.push({ path, opacity: 1 });
      }
    }
    deck.setProps({
      controller: { dragPan: view !== 'globe', scrollZoom: true },
      layers: [
        new SimpleMeshLayer({
          id: 'global-ice',
          coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
          data: [{}],
          mesh,
          getPosition: [0, 0, 0],
          getColor: [255, 255, 255],
          material: { unlit: true }
        }),
        new PathLayer({
          id: 'global-graticule',
          coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
          data: lines,
          getPath: (d) => d.path,
          getColor: (d) => [181, 211, 224, 60 * d.opacity],
          getWidth: 1,
          widthUnits: 'pixels',
          parameters: { depthWriteEnabled: false }
        })
      ]
    });
  }
  function down(e) {
    if (options?.view === 'globe' && !transition) {
      dragging = [e.clientX, e.clientY, longitude, latitude];
      canvas.setPointerCapture(e.pointerId);
    }
  }
  function move(e) {
    if (dragging) {
      longitude = dragging[2] - (e.clientX - dragging[0]) * 0.35;
      latitude = Math.max(-85, Math.min(85, dragging[3] + (e.clientY - dragging[1]) * 0.35));
      render(current, options);
    }
  }
  function up() {
    dragging = null;
  }
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  const resize = new ResizeObserver(() => {
    if (current) render(current, options);
  });
  resize.observe(canvas);
  return {
    render,
    finalize() {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      transition = null;
      resize.disconnect();
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
      deck.finalize();
    }
  };
}
