// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original example rendering adapter. All map transformations use the math.gl engine.
import {Deck, OrthographicView, COORDINATE_SYSTEM} from '@deck.gl/core';
import {PathLayer} from '@deck.gl/layers';
import {_TimelineWidget as TimelineWidget} from '@deck.gl/widgets';
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
import {cutPolygonByMercatorBounds, cutPolylineByMercatorBounds} from '@math.gl/polygon';
import {
  historicalRotation,
  futureRotation,
  futureRotations,
  rotateToLonLat,
  REGIONS,
  timeLabel
} from './math.js';
import {snowballCoverage, glaciationPlaybackSpeed} from './timeline.js';
import {SurfaceLayer} from './surface-layer.js';
import {loadTerrain} from './terrain.js';
import {makeMesh, blendWeights, transformMesh, binaryMesh, worldToGeographic} from './geometry.js';
const RADIUS = 6371008.8,
  DURATION = 1200;
export const VIEWS = {
  globe: 'Globe',
  eqearth: 'Equal Earth',
  moll: 'Mollweide',
  robin: 'Robinson',
  sinu: 'Sinusoidal',
  mill: 'Miller cylindrical',
  eqc: 'Equirectangular',
  merc: 'Mercator'
};
const plugins = {
  eqearth: equalEarth,
  moll: mollweide,
  robin: robinson,
  eqc: equidistantCylindrical,
  merc: mercator,
  sinu: sinusoidal,
  mill: millerCylindrical
};
const engines = Object.fromEntries(
  Object.entries(plugins).map(([key, plugin]) => [
    key,
    new ProjectionTransform({
      from: `+proj=longlat +R=${RADIUS} +no_defs`,
      to: `+proj=${key} +R=${RADIUS} +units=m +no_defs`,
      projections: [plugin]
    })
  ])
);
const earth = [];
for (let lon = -180; lon < 180; lon += 5)
  for (let lat = -90; lat < 90; lat += 5)
    earth.push({
      positions: [lon, lat, lon + 5, lat, lon + 5, lat + 5, lon, lat + 5, lon, lat],
      holeIndices: [],
      color: [23, 54, 71]
    });
const graticule = [];
for (let lat = -60; lat <= 60; lat += 30)
  graticule.push(Array.from({length: 181}, (_, i) => [-180 + i * 2, lat]).flat());
for (let lon = -180; lon < 180; lon += 30)
  graticule.push(Array.from({length: 91}, (_, i) => [lon, -90 + i * 2]).flat());
export function mountScene(
  canvas,
  root,
  timelineContainer,
  onError,
  onTimeChange,
  onPlayingChange,
  onAppearanceStatus
) {
  let mode = 'globe',
    longitude = 0,
    optionLongitude = 0,
    latitude = 15,
    model = null,
    scenario = 'atlantic',
    grid = false,
    glaciations = true,
    regionColors = false,
    terrainImage = null;
  let targets = futureRotations(scenario),
    lastTime = -300,
    lastRender = 0;
  let weights = {globe: 1},
    transition = null,
    animation = 0;
  let land = null,
    paths = [],
    geometryTime = NaN,
    geometryLongitude = NaN,
    counts = {active: 0, unresolved: 0};
  const rotations = new Map(),
    future = new Map(),
    ocean = makeMesh(earth);
  const scales = {},
    widget = new TimelineWidget({
      id: 'tectonic-playback',
      _container: timelineContainer,
      timeRange: [-500, 300],
      time: -300,
      playing: false,
      step: 1,
      playInterval: 50,
      formatLabel: timeLabel,
      onTimeChange,
      onPlayingChange
    });
  const deck = new Deck({
    canvas,
    parent: root,
    views: new OrthographicView({
      id: 'tectonics',
      controller: {dragPan: false},
      flipY: false,
      near: -10000,
      far: 10000
    }),
    initialViewState: {target: [0, 0, 0], zoom: 0, minZoom: -2, maxZoom: 10},
    widgets: [widget],
    _animate: true,
    onError,
    getCursor: () => (mode === 'globe' ? 'grab' : 'move')
  });
  function configure() {
    const width = root.clientWidth || 800,
      height = root.clientHeight || 550;
    const radius = Math.min(width, height) * 0.39;
    for (const key of Object.keys(engines)) {
      const spanX =
        key === 'moll'
          ? 4 * Math.SQRT2
          : key === 'robin'
            ? 2 * 0.8487 * Math.PI
            : key === 'eqearth'
              ? 5.42
              : 2 * Math.PI;
      const spanY =
        key === 'merc'
          ? 2 * Math.PI
          : key === 'mill'
            ? 4.607
            : key === 'eqearth'
              ? 2.64
              : key === 'moll'
                ? 2 * Math.SQRT2
                : Math.PI;
      scales[key] = Math.min((width * 0.92) / spanX, (height * 0.8) / spanY) / radius / RADIUS;
    }
    deck.setProps({
      width,
      height,
      views: new OrthographicView({
        id: 'tectonics',
        controller: {dragPan: mode !== 'globe'},
        flipY: false,
        near: -10000,
        far: 10000
      }),
      initialViewState: {
        target: [0, 0, 0],
        zoom: Math.log2(radius),
        minZoom: Math.log2(radius) - 2,
        maxZoom: Math.log2(radius) + 5
      }
    });
  }
  function currentWeights(now) {
    if (!transition) return weights;
    weights = blendWeights(transition.from, transition.to, (now - transition.start) / DURATION);
    if (now - transition.start >= DURATION) {
      weights = {[transition.to]: 1};
      transition = null;
    }
    return weights;
  }
  function rebuild(time) {
    const age = Math.max(0, -time),
      parts = [];
    let unresolved = 0,
      active = 0;
    if (model) {
      for (const pid of model.pids) {
        let entry = rotations.get(pid);
        if (!entry) {
          entry = {q: new Float64Array(4), valid: false};
          rotations.set(pid, entry);
        }
        entry.valid = historicalRotation(model.rotations, pid, age, entry.q, model.source.maxAge);
      }
      for (const [region, target] of Object.entries(targets)) {
        let q = future.get(region);
        if (!q) {
          q = new Float64Array(4);
          future.set(region, q);
        }
        futureRotation(target, time, q);
      }
      for (const f of model.features) {
        if (age > f.beginAge || age < f.endAge) continue;
        const entry = rotations.get(f.pid);
        if (time < 0 && !entry.valid) {
          unresolved++;
          continue;
        }
        const q = time > 0 ? future.get(f.region) : entry.q;
        for (let i = 0, j = 0; i < f.xyz.length; i += 3, j += 2) {
          rotateToLonLat(q, f.xyz, i, f.positions, j);
          f.positions[j] -= longitude;
        }
        for (const part of cutPolygonByMercatorBounds(f.positions, f.holes, {maxLatitude: 90}))
          parts.push({...part, color: REGIONS[f.region].color, rotation: q, longitude});
        active++;
      }
    }
    land = makeMesh(parts);
    geometryTime = time;
    geometryLongitude = longitude;
    return {active, unresolved};
  }
  function render(time, force = false) {
    lastTime = time;
    if (model && !model.hasTime(time)) return counts;
    const now = performance.now();
    if (!force && now - lastRender < 50) return;
    lastRender = now;
    currentWeights(now);
    if (time !== geometryTime || longitude !== geometryLongitude || !land) counts = rebuild(time);
    transformMesh(ocean, weights, engines, scales, latitude, true, longitude);
    transformMesh(land, weights, engines, scales, latitude);
    paths = [];
    if (grid)
      for (const line of graticule) {
        const shifted = line.map((n, i) => (i % 2 ? n : n - longitude));
        for (const p of cutPolylineByMercatorBounds(shifted, {maxLatitude: 90})) {
          const mesh = {
            coordinates: new Float64Array(p),
            projected: new Float64Array(p.length),
            positions: new Float64Array((p.length / 2) * 3)
          };
          paths.push(transformMesh(mesh, weights, engines, scales, latitude));
        }
      }
    // External triangle indices were generated in geographic cells, before any projection.
    // They remain identical at all interpolation endpoints, including the globe's back face.
    const common = {
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      _normalize: false,
      filled: true,
      extruded: false,
      pickable: false,
      material: false
    };
    deck.setProps({
      layers: [
        new SurfaceLayer({
          ...common,
          id: 'tectonic-ocean',
          iceCoverage: glaciations ? snowballCoverage(time) : 0,
          data: binaryMesh(ocean),
          surfaceType: 'ocean',
          globeWeight: weights.globe || 0
        }),
        new SurfaceLayer({
          ...common,
          id: 'tectonic-land',
          iceCoverage: glaciations ? snowballCoverage(time) : 0,
          data: binaryMesh(land),
          image: terrainImage,
          regionColors,
          globeWeight: weights.globe || 0
        }),
        new PathLayer({
          id: 'tectonic-grid',
          data: paths,
          getPath: p => p,
          coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
          getColor: [120, 160, 181, 90],
          widthUnits: 'pixels',
          getWidth: 0.6,
          widthMinPixels: 0.6,
          pickable: false
        })
      ]
    });
    return counts;
  }
  function animate() {
    render(lastTime, true);
    animation = transition ? requestAnimationFrame(animate) : 0;
  }
  const tooltip = document.createElement('div');
  tooltip.className = 'tectonic-coordinate-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.hidden = true;
  root.appendChild(tooltip);
  const coordinateScratch = new Float64Array(2),
    pointerScratch = [0, 0, 0];
  const hideTooltip = () => {
    tooltip.hidden = true;
  };
  function showCoordinates(e) {
    if (transition || e.pointerType === 'touch') return hideTooltip();
    const rect = canvas.getBoundingClientRect(),
      x = e.clientX - rect.left,
      y = e.clientY - rect.top;
    pointerScratch[0] = x;
    pointerScratch[1] = y;
    const world = deck.getViewports()[0]?.unproject(pointerScratch);
    if (
      !world ||
      !worldToGeographic(
        world[0],
        world[1],
        mode,
        engines[mode],
        scales[mode],
        latitude,
        longitude,
        coordinateScratch
      )
    )
      return hideTooltip();
    const [lon, lat] = coordinateScratch;
    tooltip.textContent = `${Math.abs(lon).toFixed(2)}° ${lon < 0 ? 'W' : 'E'} · ${Math.abs(lat).toFixed(2)}° ${lat < 0 ? 'S' : 'N'}`;
    tooltip.style.left = `${Math.max(6, Math.min(rect.width - 180, x + 14))}px`;
    tooltip.style.top = `${Math.max(6, Math.min(rect.height - 35, y + 14))}px`;
    tooltip.hidden = false;
  }
  let dragging = null;
  const down = e => {
    hideTooltip();
    if (mode === 'globe') {
      dragging = [e.clientX, e.clientY];
      canvas.setPointerCapture(e.pointerId);
    }
  };
  const move = e => {
    if (!dragging) return showCoordinates(e);
    hideTooltip();
    longitude -= (e.clientX - dragging[0]) * 0.3;
    latitude = Math.max(-80, Math.min(80, latitude + (e.clientY - dragging[1]) * 0.3));
    dragging[0] = e.clientX;
    dragging[1] = e.clientY;
    render(lastTime, true);
  };
  const up = () => {
    dragging = null;
  };
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('pointerleave', hideTooltip);
  configure();
  render(lastTime, true);
  const appearanceAbort = new AbortController();
  loadTerrain(appearanceAbort.signal)
    .then(image => {
      if (appearanceAbort.signal.aborted) {
        image.close();
        return;
      }
      terrainImage = image;
      onAppearanceStatus?.('Modern NASA terrain · carried with the plates');
      render(lastTime, true);
    })
    .catch(error => {
      console.warn('Terrain load failed', error);
      if (!appearanceAbort.signal.aborted)
        onAppearanceStatus?.('Terrain imagery unavailable · showing shaded land');
    });
  return {
    setModel(value) {
      model = value;
      rotations.clear();
      geometryTime = NaN;
      render(lastTime, true);
    },
    setPlayback({time, playing, ready, speed, maxAge}) {
      widget.setProps({time, playing, step: glaciationPlaybackSpeed(time, speed, glaciations) / 20, timeRange: [-maxAge, 300]});
      timelineContainer.inert = !ready;
      timelineContainer.setAttribute('aria-busy', String(!ready));
    },
    setOptions(options) {
      if (mode !== options.view) {
        hideTooltip();
        const now = performance.now();
        currentWeights(now);
        mode = options.view;
        transition = {from: {...weights}, to: mode, start: now};
        configure();
        if (!animation) animation = requestAnimationFrame(animate);
      }
      if (optionLongitude !== Number(options.longitude)) {
        optionLongitude = Number(options.longitude);
        longitude = optionLongitude;
        geometryLongitude = NaN;
      }
      if (scenario !== options.scenario) {
        hideTooltip();
        scenario = options.scenario;
        targets = futureRotations(scenario);
        geometryTime = NaN;
      }
      grid = options.grid;
      glaciations = options.glaciations ?? true;
      regionColors = options.regionColors;
      return render(lastTime, true);
    },
    render,
    resize() {
      configure();
      render(lastTime, true);
    },
    dispose() {
      cancelAnimationFrame(animation);
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
      canvas.removeEventListener('pointerleave', hideTooltip);
      tooltip.remove();
      appearanceAbort.abort();
      deck.finalize();
      terrainImage?.close();
    }
  };
}
