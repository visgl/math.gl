// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {
  Deck,
  MapView,
  OrthographicView,
  COORDINATE_SYSTEM,
  _GlobeView as GlobeView
} from '@deck.gl/core';
import {PathLayer} from '@deck.gl/layers';
import {h3FacePaths} from './h3-net.js';
import {SharedTileset2D} from '@deck.gl-community/geo-layers';
import {CutTileLayer, createCutTileAdapter, getCutTileMesh} from './cut-tile-layer.js';
import {CutBitmapLayer} from './cut-bitmap-layer.js';
import {isCutMap} from './cut-maps.js';
import {createStateMask} from './us-state-mask.js';
import {
  BoxPanelContainer,
  CustomPanel,
  PanelManager,
  applyPanelTheme,
  PANEL_THEME_SLEEK_DARK
} from '@deck.gl-community/panels';
import {getSunTerminator} from '@math.gl/earth/sun';
import {transferCamera} from './camera.js';
import {createEndpoint, createMorphMesh} from './morph.js';
import {PROJECTIONS, getProjectionMesh} from './projections.js';
import {MorphBitmapLayer} from './morph-bitmap-layer.js';
import {ProjectedBitmapLayer} from './projected-bitmap-layer.js';
import {DayNightBitmapLayer} from './day-night-bitmap-layer.js';
import {loadImageryTile, releaseImageryTile} from './imagery.js';
import DAY_OVERVIEW from './assets/day.jpg';
import NIGHT_OVERVIEW from './assets/night.jpg';

/** Mount the shared standalone/website example; return cleanup. */
export function mountSunTerminator(root) {
  root.innerHTML = `
    <canvas aria-label="Interactive solar terminator map"></canvas>
    <aside class="sun-panel" aria-label="Solar terminator controls"></aside>`;
  const controls = document.createElement('div');
  controls.className = 'sun-controls';
  controls.innerHTML = `
      <p class="intro">Drag to explore. Scroll to zoom.</p>
      <label><span>View</span><select data-role="view">${PROJECTIONS.map(p => `<option value="${p.id}">${p.label}</option>`).join('')}</select></label>
      <label><span>Date · UTC</span><input data-role="date" type="date" /></label>
      <div class="time-row"><label><span>Time · UTC</span><input data-role="time" type="time" step="60" /></label>
        <button data-role="play" type="button" aria-pressed="false">Play</button></div>
      <label><span>Offset</span><input data-role="offset" type="range" min="0" max="24" step="0.05" value="0" aria-label="Time offset in hours" /><output data-role="offset-label">+0 h</output></label>
      <label><span>Speed</span><select data-role="speed"><option value="1">1 hour / second</option><option value="3" selected>3 hours / second</option><option value="6">6 hours / second</option></select></label>
      <label><span>Darkness</span><select data-role="altitude">
        <option value="0">Sunset · 0°</option><option value="-6">Civil · −6°</option>
        <option value="-12">Nautical · −12°</option><option value="-18">Astronomical · −18°</option>
      </select></label>
      <label><span>Feather</span><select data-role="feather">
        <option value="3">Narrow · 3°</option><option value="6" selected>Soft · 6°</option><option value="12">Wide · 12°</option>
      </select></label>
      <p data-role="status" role="status">Loading world overview…</p>
      <details class="credits"><summary>Imagery &amp; time</summary>
        <p><a href="https://science.nasa.gov/earth/earth-observatory/blue-marble/">NASA Blue Marble</a> and
        <a href="https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps/">Black Marble</a>, via
        <a href="https://nasa-gibs.github.io/gibs-api-docs/">GIBS</a>.
        Night lights are a fixed 2016 composite. Time moves the soft day/night boundary, not the imagery.
        Cut maps load detail independently for each visible piece. Detail follows zoom; the overview covers the poles and remains visible if a tile fails.
        State clipping uses <a href="https://github.com/topojson/us-atlas">US Atlas / Census 2017 boundaries</a>.
        H3 shows its twenty icosahedron faces and base-cell grid.</p>
      </details>`;
  const host = root.querySelector('.sun-panel');
  applyPanelTheme(host, PANEL_THEME_SLEEK_DARK);
  const manager = new PanelManager({parentElement: host});
  manager.setProps({
    components: [
      new BoxPanelContainer({
        id: 'sun-infobox',
        _container: host,
        title: 'Earth after dark',
        widthPx: 300,
        resizable: false,
        collapsible: true,
        panel: new CustomPanel({
          id: 'sun-controls',
          title: 'Earth after dark',
          theme: 'sleek-dark',
          onRenderHTML: element => {
            element.append(controls);
          }
        })
      })
    ]
  });
  const control = role => controls.querySelector(`[data-role="${role}"]`);
  const date = control('date');
  const time = control('time');
  const view = control('view');
  const altitude = control('altitude');
  const feather = control('feather');
  const play = control('play');
  const status = control('status');
  const offset = control('offset');
  const offsetLabel = control('offset-label');
  const speed = control('speed');
  let timestamp = Math.floor(Date.now() / 60000) * 60000;
  let anchorTime = timestamp;
  let playing = false;
  let frame = 0;
  let previous = 0;
  let disposed = false;
  let failedTiles = false;
  let overviewReady = false;
  let activeView = 'globe';
  let mesh = null;
  let morph = null;
  let morphFrame = 0;
  let queuedView = null;
  let usaMask = null;
  let h3GridPaths = null;
  let h3GridLoading = false;
  const imageryTiles = new SharedTileset2D({
    adapter: createCutTileAdapter(
      viewport => (viewport.id === `earth-${activeView}` ? activeView : null),
      {pixelRatio: window.devicePixelRatio || 1}
    ),
    getTileData: loadImageryTile,
    minZoom: 0,
    maxZoom: 8,
    tileSize: 256,
    maxRequests: 6,
    maxCacheSize: 256,
    debounceTime: 100,
    refinementStrategy: 'best-available',
    onTileUnload: releaseImageryTile
  });
  function ensureUsaMask() {
    if (usaMask) return;
    const {width, height, data} = createStateMask();
    usaMask = deck.device.createTexture({
      id: 'us-state-coverage',
      width,
      height,
      format: 'r8unorm',
      data,
      sampler: {
        minFilter: 'linear',
        magFilter: 'linear',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge'
      }
    });
  }
  // Keep decoded source pixels owned by the example. GPU textures belong to
  // individual layers and must never be borrowed from a layer being finalized.
  const dayOverview = new Image();
  const nightOverview = new Image();
  dayOverview.src = DAY_OVERVIEW;
  nightOverview.src = NIGHT_OVERVIEW;
  let overviewDecoded = false;
  const panController = {
    dragMode: 'pan',
    dragRotate: false,
    touchRotate: false,
    keyboard: {rotateSpeedX: 0, rotateSpeedY: 0}
  };
  function finishTransition() {
    cancelAnimationFrame(morphFrame);
    morphFrame = 0;
    morph = null;
    queuedView = null;
  }
  const syncTime = () => {
    const iso = new Date(timestamp).toISOString();
    date.value = iso.slice(0, 10);
    time.value = iso.slice(11, 16);
    const hours = (timestamp - anchorTime) / 3600000;
    offset.value = String(hours);
    offsetLabel.value = '+' + hours.toFixed(1) + ' h';
  };
  syncTime();
  const initialSun = getSunTerminator(timestamp).sunDirection;
  const initialLongitude =
    (((Math.atan2(initialSun[1], initialSun[0]) * 180) / Math.PI + 85 + 540) % 360) - 180;
  const deck = new Deck({
    canvas: root.querySelector('canvas'),
    parent: root,
    views: new GlobeView({id: 'earth-globe', controller: panController, resolution: 2}),
    initialViewState: {longitude: initialLongitude, latitude: 25, zoom: 2, minZoom: -1, maxZoom: 7},
    onViewStateChange: ({viewState}) => {
      return {...viewState, bearing: 0, pitch: 0};
    },
    onAfterRender: () => {
      if (!overviewReady && deck.props.layers[0]?.isLoaded) {
        overviewReady = true;
        if (!disposed && !failedTiles)
          status.textContent = 'World overview ready · zoom for detail';
      }
    },
    onError: error => {
      if (!disposed) status.textContent = `Imagery error: ${error.message}`;
    }
  });
  Promise.all([dayOverview.decode(), nightOverview.decode()])
    .then(() => {
      if (!disposed) {
        overviewDecoded = true;
        render();
      }
    })
    .catch(() => {});
  function render() {
    const {sunDirection} = getSunTerminator(timestamp);
    const shading = {
      sunDirection,
      altitude: Number(altitude.value),
      feather: Number(feather.value),
      pickable: false,
      usaMask,
      usaClip: activeView === 'albers-usa' ? 1 : 0,
      // Opaque, front-facing paired images avoid holes and depth interference between meshes.
      parameters: {cullMode: 'back', depthCompare: 'always', depthWriteEnabled: false}
    };
    if (morph) {
      deck.setProps({
        layers: [
          new MorphBitmapLayer({
            id: 'earth-morph',
            mesh: morph.surface,
            progress: morph.progress,
            coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
            image: overviewDecoded ? dayOverview : DAY_OVERVIEW,
            nightImage: overviewDecoded ? nightOverview : NIGHT_OVERVIEW,
            bounds: [-180, -90, 180, 90],
            _imageCoordinateSystem: 'lnglat',
            ...shading,
            usaClip:
              morph.source === 'albers-usa'
                ? 1 - morph.progress
                : morph.target === 'albers-usa'
                  ? morph.progress
                  : 0,
            parameters: {depthCompare: 'less-equal', depthWriteEnabled: true, cullMode: 'back'}
          })
        ]
      });
      return;
    }
    deck.setProps({
      layers: [
        mesh
          ? new ProjectedBitmapLayer({
              id: `projected-${activeView}`,
              mesh,
              coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
              image: overviewDecoded ? dayOverview : DAY_OVERVIEW,
              nightImage: overviewDecoded ? nightOverview : NIGHT_OVERVIEW,
              bounds: [-180, -90, 180, 90],
              _imageCoordinateSystem: 'lnglat',
              ...shading,
              parameters: {depthCompare: 'always', depthWriteEnabled: false, cullMode: 'none'}
            })
          : new DayNightBitmapLayer({
              // Rebuild mesh and texture projection when switching MapView/GlobeView.
              id: `earth-overview-${activeView}`,
              image: overviewDecoded ? dayOverview : DAY_OVERVIEW,
              nightImage: overviewDecoded ? nightOverview : NIGHT_OVERVIEW,
              bounds: [-180, -90, 180, 90],
              _imageCoordinateSystem: 'lnglat',
              ...shading
            }),
        (!mesh || isCutMap(activeView)) &&
          new CutTileLayer({
            data: imageryTiles,
            id: `earth-detail-${activeView}`,
            getTileData: loadImageryTile,
            minZoom: 0,
            maxZoom: 8,
            tileSize: 256,
            zoomOffset: 0,
            maxRequests: 4,
            maxCacheSize: 128,
            debounceTime: 150,
            refinementStrategy: 'best-available',
            onTileError: () => {
              failedTiles = true;
              if (!disposed)
                status.textContent = 'Some detail tiles unavailable · overview retained';
            },
            onViewportLoad: tiles => {
              if (!disposed && overviewReady && !failedTiles) {
                status.textContent = tiles.length
                  ? 'Detail ready · NASA 2016 night lights'
                  : 'World overview ready · zoom for detail';
              }
            },
            updateTriggers: {
              renderSubLayers: [timestamp, shading.altitude, shading.feather, activeView]
            },
            renderSubLayers: props => {
              if (!props.data) return null;
              const {west, south, east, north} = props.tile.bbox;
              if (isCutMap(activeView)) {
                const tileMesh = getCutTileMesh(activeView, props.tile, props.data);
                if (!tileMesh.vertexCount) return null;
                return new CutBitmapLayer(props, {
                  id: `${props.id}-${activeView}`,
                  data: null,
                  mesh: tileMesh,
                  coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
                  image: props.data.day,
                  nightImage: props.data.night,
                  bounds: [west, south, east, north],
                  _imageCoordinateSystem: 'cartesian',
                  wrapLongitude: false,
                  ...shading,
                  parameters: {depthCompare: 'always', depthWriteEnabled: false, cullMode: 'none'}
                });
              }
              return new DayNightBitmapLayer(props, {
                id: `${props.id}-${activeView}`,
                data: null,
                image: props.data.day,
                nightImage: props.data.night,
                bounds: [west, south, east, north],
                _imageCoordinateSystem: 'cartesian',
                ...shading
              });
            }
          }),
        activeView === 'h3' &&
          new PathLayer({
            id: 'h3-face-outline',
            data: h3FacePaths,
            getPath: path => path,
            coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
            getColor: [180, 210, 230, 160],
            getWidth: 1,
            widthUnits: 'pixels',
            pickable: false,
            parameters: {depthCompare: 'always', depthWriteEnabled: false}
          }),
        activeView === 'h3' &&
          h3GridPaths &&
          new PathLayer({
            id: 'h3-cell-grid',
            data: h3GridPaths,
            getPath: path => path,
            coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
            getColor: [180, 210, 230, 90],
            getWidth: 0.7,
            widthUnits: 'pixels',
            pickable: false,
            parameters: {depthCompare: 'always', depthWriteEnabled: false}
          })
      ]
    });
  }
  function changeTime() {
    const next = Date.parse(`${date.value}T${time.value}:00Z`);
    if (Number.isFinite(next)) {
      timestamp = next;
      anchorTime = next;
      syncTime();
      render();
    }
  }
  function changeView() {
    const next = view.value;
    if (morph) {
      queuedView = next;
      return;
    }
    if (next === activeView) return;
    if (next === 'h3' && !h3GridLoading) {
      h3GridLoading = true;
      import('./h3-grid.js')
        .then(({getH3GridPaths}) => {
          if (!disposed) {
            h3GridPaths = getH3GridPaths();
            render();
          }
        })
        .catch(error => {
          if (!disposed) status.textContent = 'H3 grid unavailable: ' + error.message;
        });
    }
    const sourceView = activeView;
    const sourceViewport = deck.getViewports()[0];
    let nextMesh;
    try {
      if (next === 'albers-usa') ensureUsaMask();
      nextMesh = next === 'globe' || next === 'map' ? null : getProjectionMesh(next);
    } catch (error) {
      view.value = activeView;
      status.textContent = error.message;
      return;
    }
    const targetView =
      next === 'globe'
        ? new GlobeView({id: 'earth-globe', controller: panController, resolution: 2})
        : next === 'map'
          ? new MapView({id: 'earth-map', controller: panController, repeat: true})
          : new OrthographicView({id: `earth-${next}`, controller: panController, flipY: false});
    let transfer;
    try {
      transfer = transferCamera(sourceView, sourceViewport, next, targetView);
    } catch (error) {
      view.value = activeView;
      status.textContent = error.message;
      return;
    }
    activeView = next;
    mesh = nextMesh;
    const targetCamera = {...transfer.camera, bearing: 0, pitch: 0};
    const finish = () => {
      morph = null;
      deck.setProps({views: targetView, initialViewState: targetCamera});
      render();
      const queued = queuedView;
      queuedView = null;
      if (queued && queued !== activeView) {
        view.value = queued;
        changeView();
      }
    };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish();
    } else {
      const targetViewport = targetView.makeViewport({
        width: root.clientWidth,
        height: root.clientHeight,
        viewState: targetCamera
      });
      const surface = createMorphMesh(
        createEndpoint(sourceView, sourceViewport),
        createEndpoint(next, targetViewport)
      );
      morph = {surface, progress: 0, source: sourceView, target: next};
      deck.setProps({
        views: new OrthographicView({id: 'earth-morph', controller: false, flipY: false}),
        initialViewState: {target: [0, 0, 0], zoom: 0}
      });
      const started = performance.now();
      const tick = now => {
        if (disposed || !morph) return;
        const t = Math.min(1, (now - started) / 1500);
        morph.progress = t * t * t * (t * (t * 6 - 15) + 10);
        render();
        if (t < 1) morphFrame = requestAnimationFrame(tick);
        else finish();
      };
      morphFrame = requestAnimationFrame(tick);
    }
    controls.querySelector('.intro').textContent =
      next === 'globe'
        ? 'Drag to turn the globe. Scroll to zoom.'
        : 'Drag to pan. Scroll to zoom. North stays up.';
    status.textContent = transfer.clamped
      ? 'Center adjusted to projection coverage'
      : mesh
        ? 'Overview ready · loading cut detail'
        : 'World overview ready · zoom for detail';
    render();
  }
  function animate(now) {
    if (!playing || disposed) return;
    if (previous && now - previous >= 33) {
      const elapsed = timestamp - anchorTime + (now - previous) * Number(speed.value) * 3600;
      timestamp = anchorTime + (elapsed % 86400000);
      syncTime();
      render();
      previous = now;
    } else if (!previous) previous = now;
    frame = requestAnimationFrame(animate);
  }
  function togglePlay() {
    playing = !playing;
    play.textContent = playing ? 'Pause' : 'Play';
    play.setAttribute('aria-pressed', String(playing));
    previous = 0;
    if (playing) frame = requestAnimationFrame(animate);
    else cancelAnimationFrame(frame);
  }
  function scrubTime() {
    timestamp = anchorTime + Number(offset.value) * 3600000;
    syncTime();
    render();
  }
  offset.addEventListener('input', scrubTime);
  date.addEventListener('change', changeTime);
  time.addEventListener('change', changeTime);
  view.addEventListener('change', changeView);
  altitude.addEventListener('change', render);
  feather.addEventListener('change', render);
  play.addEventListener('click', togglePlay);
  render();
  return () => {
    disposed = true;
    finishTransition();
    cancelAnimationFrame(frame);
    offset.removeEventListener('input', scrubTime);
    date.removeEventListener('change', changeTime);
    time.removeEventListener('change', changeTime);
    view.removeEventListener('change', changeView);
    altitude.removeEventListener('change', render);
    feather.removeEventListener('change', render);
    play.removeEventListener('click', togglePlay);
    deck.finalize();
    imageryTiles.finalize();
    usaMask?.destroy();
    manager.finalize();
    root.replaceChildren();
  };
}
