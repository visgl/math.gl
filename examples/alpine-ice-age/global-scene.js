// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import { Deck, OrthographicView, COORDINATE_SYSTEM } from '@deck.gl/core';
import { SimpleMeshLayer } from '@deck.gl/mesh-layers';
import { PathLayer } from '@deck.gl/layers';
import { Geometry } from '@luma.gl/engine';
import {
  ProjectionTransform,
  equalEarth,
  mollweide,
  robinson,
  equidistantCylindrical,
  mercator,
  sinusoidal,
  millerCylindrical
} from '@math.gl/projection';
import { interpolateField } from './data.js';
export const GLOBAL_VIEWS = {
  globe: 'Globe',
  eqearth: 'Equal Earth',
  moll: 'Mollweide',
  robin: 'Robinson',
  sinu: 'Sinusoidal',
  mill: 'Miller cylindrical',
  eqc: 'Equirectangular',
  merc: 'Mercator'
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
  merc: mercator
};
const engines = Object.fromEntries(
  Object.entries(plugins).map(([id, plugin]) => [
    id,
    new ProjectionTransform({
      from: `+proj=longlat +R=${R}`,
      to: `+proj=${id} +R=${R} +units=m`,
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
      positions[i] = x - 180;
      positions[i + 1] = view === 'merc' ? Math.max(-85, Math.min(85, y - 90)) : y - 90;
    }
  if (view !== 'globe') engines[view].projectFlatSync(positions, 2);
  let maxX = 0,
    maxY = 0;
  if (view !== 'globe')
    for (let i = 0; i < positions.length; i += 2) {
      maxX = Math.max(maxX, Math.abs(positions[i]));
      maxY = Math.max(maxY, Math.abs(positions[i + 1]));
    }
  const indices = new Uint32Array(360 * 180 * 6);
  let k = 0;
  for (let y = 0; y < 180; y++)
    for (let x = 0; x < 360; x++) {
      const i = y * 361 + x;
      indices.set([i, i + 1, i + 361, i + 1, i + 362, i + 361], k);
      k += 6;
    }
  const result = { positions, indices, maxX, maxY };
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
    latitude = 18,
    dragging;
  const deck = new Deck({
    canvas,
    views: new OrthographicView({ flipY: false, near: -10000, far: 10000 }),
    initialViewState: { target: [0, 0, 0], zoom: 0, minZoom: -1, maxZoom: 4 },
    controller: { dragPan: true, scrollZoom: true },
    getCursor: () => (dragging ? 'grabbing' : 'grab'),
    onError
  });
  function render(model, opts) {
    const viewChanged = options?.view !== opts.view;
    current = model;
    options = opts;
    const { view, age, showIce, ghost, labels } = opts;
    const g = grid(view),
      size = 361 * 181;
    const ice = interpolateField(model.ice, model.count, model.manifest.ages, age),
      bed = interpolateField(model.bed, model.count, model.manifest.ages, age);
    const positions = new Float32Array(size * 3),
      normals = new Float32Array(size * 3),
      colors = new Float32Array(size * 3);
    const width = canvas.clientWidth || 900,
      height = canvas.clientHeight || 570;
    const scale =
      view === 'globe'
        ? Math.min(width, height) * 0.42
        : Math.min((width * 0.46) / g.maxX, (height * 0.43) / g.maxY);
    const tilt = latitude * RAD;
    function point(lon, lat) {
      const a = (lon - longitude) * RAD,
        b = lat * RAD;
      const x = Math.cos(b) * Math.sin(a),
        y = Math.sin(b),
        z = Math.cos(b) * Math.cos(a);
      return [x, y * Math.cos(tilt) - z * Math.sin(tilt), y * Math.sin(tilt) + z * Math.cos(tilt)];
    }
    for (let y = 0; y <= 180; y++)
      for (let x = 0; x <= 360; x++) {
        const i = y * 361 + x,
          j = y * 360 + (x % 360),
          c = color(bed[j], ice[j], showIce, ghost);
        if (view === 'globe') {
          const p = point(x - 180, y - 90);
          positions.set(
            p.map((v) => v * scale),
            i * 3
          );
          normals.set(p, i * 3);
        } else {
          positions.set([g.positions[i * 2] * scale, g.positions[i * 2 + 1] * scale, 0], i * 3);
          normals.set([0, 0, 1], i * 3);
        }
        const shade = view === 'globe' ? 0.7 + 0.3 * Math.max(0, normals[i * 3 + 2]) : 1;
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
      for (let lon = -180; lon <= 180; lon += 30) {
        const path = [];
        for (let lat = -85; lat <= 85; lat += 1)
          path.push(
            view === 'globe' ? point(lon, lat).map((v) => v * (scale + 0.6)) : project(lon, lat)
          );
        lines.push({ path });
      }
      for (let lat = -60; lat <= 60; lat += 30) {
        const path = [];
        for (let lon = -180; lon <= 180; lon += 1)
          path.push(
            view === 'globe' ? point(lon, lat).map((v) => v * (scale + 0.6)) : project(lon, lat)
          );
        lines.push({ path });
      }
    }
    function project(lon, lat) {
      const p = engines[view].projectSync([lon, lat]);
      return [p[0] * scale, p[1] * scale, 0.6];
    }
    deck.setProps({
      ...(viewChanged
        ? { initialViewState: { target: [0, 0, 0], zoom: 0, minZoom: -1, maxZoom: 4 } }
        : {}),
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
          getColor: [181, 211, 224, 60],
          getWidth: 1,
          widthUnits: 'pixels',
          parameters: { depthWriteEnabled: false }
        })
      ]
    });
  }
  function down(e) {
    if (options?.view === 'globe') {
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
      resize.disconnect();
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
      deck.finalize();
    }
  };
}
