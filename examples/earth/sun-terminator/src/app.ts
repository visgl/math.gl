// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {Deck, MapView, OrthographicView, _GlobeView as GlobeView} from '@deck.gl/core';
import {PathLayer} from '@deck.gl/layers';
import {SharedTileset2D} from '@deck.gl-community/geo-layers';
import {CutTileLayer, createCutTileAdapter, getCutTileMesh} from './cut-tile-layer.ts';
import {CutBitmapLayer} from './cut-bitmap-layer.ts';
import {isCutMap, getMap} from './view-adapter.ts';
import {createStateMask} from './us-state-mask.ts';
import {createControlPanel} from './control-panel.ts';
import {getSunTerminator} from '@math.gl/earth/sun';
import {transferCamera} from './view-adapter.ts';
import {createEndpoint, getMorphProgress} from './view-adapter.ts';
import {prepareMapTransitionMeshAsync} from '@math.gl/geospatial/maps';
import {getProjectionMesh} from './view-adapter.ts';
import {MorphBitmapLayer} from './morph-bitmap-layer.ts';
import {ProjectedBitmapLayer} from './projected-bitmap-layer.ts';
import {DayNightBitmapLayer} from './day-night-bitmap-layer.ts';
import {loadImageryTile, releaseImageryTile} from './imagery.ts';
import {BLUE_MARBLE_OVERVIEW_URL as DAY_OVERVIEW} from '../../../common/blue-marble.js';
import NIGHT_OVERVIEW from '../assets/night.jpg';
import {NIGHT_DATE} from './constants.ts';

/** Mount the shared standalone/website example; return cleanup. */
export function mountSunTerminator(root: HTMLDivElement) {
  root.innerHTML = `
    <div class="sun-view"><canvas aria-label="Interactive solar terminator map"></canvas></div>
    <aside class="example-panel sun-panel" aria-label="Solar terminator controls"></aside>`;
  const host = root.querySelector<HTMLElement>('.sun-panel')!;
  const {
    element: controls,
    getControl: control,
    finalize: finalizeControls
  } = createControlPanel(host);
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
  let preparing = false;
  const transitionAbort = new AbortController();
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
    usaMask = device.createTexture({
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
  // Own overview textures at renderer scope so a new morph layer draws immediately.
  // Layer finalization must not destroy textures still used by the next projection.
  const dayOverview = new Image();
  const nightOverview = new Image();
  // Remote overview pixels must remain usable as WebGL textures.
  dayOverview.crossOrigin = 'anonymous';
  dayOverview.src = DAY_OVERVIEW;
  nightOverview.src = NIGHT_OVERVIEW;
  let overviewDecoded = false;
  let dayTexture = null;
  let nightTexture = null;
  const panController = {
    dragMode: 'pan' as const,
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
  const getPanelWidth = () => (root.clientWidth < 600 ? 0 : host.getBoundingClientRect().width);
  let panelWidth = getPanelWidth();
  function createView(id) {
    const props = {id: `earth-${id}`, controller: panController, padding: {left: panelWidth}};
    return id === 'globe'
      ? new GlobeView({...props, resolution: 180})
      : id === 'map'
        ? new MapView({...props, repeat: true})
        : new OrthographicView({...props, flipY: false});
  }
  const initialSun = getSunTerminator(timestamp).sunDirection;
  const initialLongitude =
    (((Math.atan2(initialSun[1], initialSun[0]) * 180) / Math.PI + 85 + 540) % 360) - 180;
  let device: import('@luma.gl/core').Device;
  const deck = new Deck<GlobeView | MapView | OrthographicView>({
    onDeviceInitialized: value => {
      device = value;
    },
    canvas: root.querySelector('canvas'),
    parent: root.querySelector('.sun-view'),
    views: createView('globe'),
    initialViewState: {longitude: initialLongitude, latitude: 25, zoom: 2, minZoom: -1, maxZoom: 7},
    onViewStateChange: ({viewState, oldViewState}) => {
      return {...(preparing ? oldViewState : viewState), bearing: 0, pitch: 0};
    },
    onLoad: () => {
      if (overviewDecoded) render();
    },
    onAfterRender: () => {
      if (!overviewReady && (deck.props.layers[0] as import('@deck.gl/core').Layer)?.isLoaded) {
        overviewReady = true;
        if (!disposed && !failedTiles)
          status.textContent = 'World overview ready · zoom for detail';
      }
    },
    onError: error => {
      if (!disposed) status.textContent = `Imagery error: ${error.message}`;
    }
  });
  // Measure the actual overlay width so responsive panels offset every projection equally.
  const panelObserver = new ResizeObserver(() => {
    const width = getPanelWidth();
    if (width === panelWidth || disposed) return;
    panelWidth = width;
    if (!morph) deck.setProps({views: createView(activeView)});
  });
  panelObserver.observe(host);
  panelObserver.observe(root);
  Promise.all([dayOverview.decode(), nightOverview.decode()])
    .then(() => {
      if (!disposed) {
        overviewDecoded = true;
        render();
      }
    })
    .catch(() => {});
  function render() {
    if (overviewDecoded && device && !dayTexture) {
      const createOverviewTexture = (image: HTMLImageElement, id: string) => {
        const texture = device.createTexture({
          id,
          data: image,
          width: image.naturalWidth,
          height: image.naturalHeight,
          mipLevels: device.getMipLevelCount(image.width, image.height),
          sampler: {
            minFilter: 'linear',
            magFilter: 'linear',
            mipmapFilter: 'linear',
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge'
          }
        });
        texture.generateMipmapsWebGL();
        return texture;
      };
      dayTexture = createOverviewTexture(dayOverview, 'day-overview');
      nightTexture = createOverviewTexture(nightOverview, 'night-overview');
    }
    const {sunDirection} = getSunTerminator(timestamp);
    const shading = {
      sunDirection,
      altitude: Number(altitude.value),
      feather: Number(feather.value),
      pickable: false,
      usaMask,
      usaClip: activeView === 'albers-usa' ? 1 : 0,
      // Opaque, front-facing paired images avoid holes and depth interference between meshes.
      parameters: {cullMode: 'back', depthCompare: 'always', depthWriteEnabled: false} as const
    };
    if (morph) {
      deck.setProps({
        layers: [
          new MorphBitmapLayer({
            id: 'earth-morph',
            mesh: morph.surface,
            progress: morph.progress,
            // Start time after the first actual draw, including shader warmup.
            onDraw: () => {
              if (morph && morph.started === null) morph.started = performance.now();
            },
            coordinateSystem: 'cartesian',
            image: dayTexture || DAY_OVERVIEW,
            nightImage: nightTexture || NIGHT_OVERVIEW,
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
              coordinateSystem: 'cartesian',
              image: dayTexture || DAY_OVERVIEW,
              nightImage: nightTexture || NIGHT_OVERVIEW,
              bounds: [-180, -90, 180, 90],
              _imageCoordinateSystem: 'lnglat',
              ...shading,
              parameters: {depthCompare: 'always', depthWriteEnabled: false, cullMode: 'none'}
            })
          : new DayNightBitmapLayer({
              // Rebuild mesh and texture projection when switching MapView/GlobeView.
              id: `earth-overview-${activeView}`,
              image: dayTexture || DAY_OVERVIEW,
              nightImage: nightTexture || NIGHT_OVERVIEW,
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
            maxRequests: 6,
            maxCacheSize: 256,
            debounceTime: 100,
            refinementStrategy: 'best-available',
            onTileError: () => {
              failedTiles = true;
              if (!disposed)
                status.textContent = 'Some detail tiles unavailable · overview retained';
            },
            onViewportLoad: tiles => {
              if (!disposed && overviewReady && !failedTiles) {
                status.textContent = tiles.length
                  ? `Detail ready · NASA ${NIGHT_DATE.slice(0, 4)} night lights`
                  : 'World overview ready · zoom for detail';
              }
            },
            updateTriggers: {
              renderSubLayers: [timestamp, shading.altitude, shading.feather, activeView]
            },
            renderSubLayers: props => {
              if (!props.data) return null;
              const {west, south, east, north} = props.tile.bbox as {
                west: number;
                south: number;
                east: number;
                north: number;
              };
              const {data: _tileData, ...layerProps} = props;
              if (isCutMap(activeView)) {
                const tileMesh = getCutTileMesh(activeView, props.tile, props.data);
                if (!tileMesh.vertexCount) return null;
                return new CutBitmapLayer(layerProps, {
                  id: `${props.id}-${activeView}`,
                  mesh: tileMesh,
                  coordinateSystem: 'cartesian',
                  image: props.data.day,
                  nightImage: props.data.night,
                  bounds: [west, south, east, north],
                  _imageCoordinateSystem: 'cartesian',
                  wrapLongitude: false,
                  ...shading,
                  parameters: {depthCompare: 'always', depthWriteEnabled: false, cullMode: 'none'}
                });
              }
              return new DayNightBitmapLayer(layerProps, {
                id: `${props.id}-${activeView}`,
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
            data: getMap('h3')
              .getLayout()
              .regions.flatMap(r => r.outlines.map(ring => ring.map(p => [...p, 0]))),
            getPath: path => path,
            coordinateSystem: 'cartesian',
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
            coordinateSystem: 'cartesian',
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
  async function changeView() {
    const next = view.value;
    if (morph || preparing) {
      queuedView = next;
      return;
    }
    if (next === activeView) return;
    if (next === 'h3' && !h3GridLoading) {
      h3GridLoading = true;
      import('./h3-grid.ts')
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
    const targetView = createView(next);
    let transfer;
    try {
      transfer = transferCamera(sourceView, sourceViewport, next, targetView);
    } catch (error) {
      view.value = activeView;
      status.textContent = error.message;
      return;
    }
    const targetCamera = {...transfer.camera, bearing: 0, pitch: 0};
    const animated =
      dayTexture && nightTexture && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    let surface;
    if (animated) {
      preparing = true;
      status.textContent = 'Preparing projection transition…';
      try {
        const targetViewport = targetView.makeViewport({
          width: root.clientWidth,
          height: root.clientHeight,
          viewState: targetCamera
        });
        surface = await prepareMapTransitionMeshAsync(
          createEndpoint(sourceView, sourceViewport),
          createEndpoint(next, targetViewport),
          {signal: transitionAbort.signal}
        );
      } catch (error) {
        queuedView = null;
        if (!disposed) {
          view.value = activeView;
          status.textContent = error.message;
        }
        return;
      } finally {
        preparing = false;
      }
      if (disposed) return;
    }
    activeView = next;
    mesh = nextMesh;
    const finish = () => {
      morph = null;
      deck.setProps({views: createView(next), initialViewState: targetCamera});
      render();
      const queued = queuedView;
      queuedView = null;
      if (queued && queued !== activeView) {
        view.value = queued;
        changeView();
      }
    };
    if (!animated) {
      finish();
    } else {
      morph = {
        surface,
        progress: 0,
        elapsed: 0,
        previousFrame: null,
        started: null,
        source: sourceView,
        target: next
      };
      deck.setProps({
        // Morph vertices already include endpoint padding in their screen positions.
        views: new OrthographicView({id: 'earth-morph', controller: false, flipY: false}),
        initialViewState: {target: [0, 0, 0], zoom: 0}
      });
      const tick = now => {
        if (disposed || !morph) return;
        if (morph.started !== null) {
          // Bound dropped-frame advances so a slow GPU or host task cannot
          // consume the entire visible transition between two draws.
          morph.elapsed += Math.min(100, Math.max(0, now - (morph.previousFrame ?? morph.started)));
          morph.previousFrame = now;
        }
        morph.progress = getMorphProgress(morph.elapsed);
        render();
        if (morph.progress < 1) morphFrame = requestAnimationFrame(tick);
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
    transitionAbort.abort();
    finishTransition();
    cancelAnimationFrame(frame);
    offset.removeEventListener('input', scrubTime);
    date.removeEventListener('change', changeTime);
    time.removeEventListener('change', changeTime);
    view.removeEventListener('change', changeView);
    altitude.removeEventListener('change', render);
    feather.removeEventListener('change', render);
    play.removeEventListener('click', togglePlay);
    panelObserver.disconnect();
    deck.finalize();
    imageryTiles.finalize();
    usaMask?.destroy();
    dayTexture?.destroy();
    nightTexture?.destroy();
    finalizeControls();
    root.replaceChildren();
  };
}
