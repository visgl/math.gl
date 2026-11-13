// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {
  Deck,
  OrbitView,
  COORDINATE_SYSTEM,
  AmbientLight,
  DirectionalLight,
  LightingEffect
} from '@deck.gl/core';
import {SimpleMeshLayer} from '@deck.gl/mesh-layers';
import {mountInfoBox} from '../../../common/info-box.js';
import {createGlobeMesh, getExaggeration} from './mesh';
import {
  selectRefinement,
  createRefinementSource,
  sampleCoarsePosition,
  mapLatitude,
  geographicLatitude,
  normalizeLongitude
} from './refinement';
import elevationUrl from '../assets/etopo1.bin?url';

/** Mount a global relief globe with no water surface obscuring the seafloor. */
export function mountBathymetry(root) {
  root.innerHTML = `<canvas data-role="globe" aria-label="Interactive three dimensional ocean floor globe"></canvas>
  <aside><h1>The ocean, uncovered</h1><p>Explore Earth's hidden ridges, trenches and continental shelves.</p>
  <label>Destination <select data-role="destination"><option value="pacific">Pacific Ocean</option><option value="atlantic">Mid-Atlantic Ridge</option><option value="indian">Indian Ocean</option><option value="americas">The Americas</option></select></label>
  <label>Globe → map <input data-role="morph" type="range" min="0" max="1" step="0.01" value="0"></label>
  <label>Map projection <select data-role="projection"><option value="equirectangular">Equirectangular</option><option value="mercator">Mercator</option></select></label>
  <label>Maximum exaggeration <input data-role="exaggeration" type="range" min="1" max="100" value="100"></label>
  <output data-role="scale"></output>
  <label>Zoom <input data-role="zoom" type="range" min="0" max="4" step="0.05" value="0"></label>
  <label><input data-role="wireframe" type="checkbox" style="width:auto"> Show mesh</label>
  <p data-role="detail" role="status">Global overview · zoom in for refinement</p>
  <p data-role="status" role="status">Loading global relief…</p>
  <div class="legend"></div><div class="legend-labels"><span>−11 km</span><span>−6 km</span><span>0 m</span></div>
  <p>Drag to rotate · scroll to zoom. Depth and height fade from 100× to true scale as you zoom in. Colors always show real elevation.</p>
  <p class="credits">NOAA NGDC <a href="https://coastwatch.pfeg.noaa.gov/erddap/info/etopo180/index.html" target="_blank" rel="noreferrer">ETOPO1</a> · Amante & Eakins (2009). Global 0.5° overview; zoom loads finer <a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md" target="_blank" rel="noreferrer">Mapzen / Tilezen terrain tiles</a> from AWS. Ocean source: ETOPO1 (1′); finer display samples are not new seabed measurements. Refined patch edges match the coarse mesh. Polar caps retain the overview. Spherical display, heights relative to mean sea level.</p></aside>`;
  const disposePanel = mountInfoBox(root.querySelector('aside'), {
    title: 'Bathymetry',
    width: 300
  });
  const controls = role => root.querySelector(`[data-role="${role}"]`);
  const abort = new AbortController();
  let heights, frame, lastScale, lastMorph, lastProjection, mesh, detailMesh, detail;
  let detailVersion = 0,
    renderedVersion = -1,
    detailTimer,
    detailAbort,
    desiredKey;
  let globeRotation = 160,
    globeTilt = 12;
  const loadRefinement = createRefinementSource();
  let state = {
    target: [0, 0, 0],
    rotationX: 12,
    rotationOrbit: 160,
    zoom: 0,
    minZoom: 0,
    maxZoom: 4
  };
  const deck = new Deck({
    canvas: root.querySelector('canvas'),
    parent: root,
    views: new OrbitView({controller: true, orbitAxis: 'Z', orthographic: true, fovy: 2}),
    viewState: state,
    effects: [
      new LightingEffect({
        ambient: new AmbientLight({intensity: 1.2}),
        sun: new DirectionalLight({direction: [-3, -4, -2], intensity: 1.7})
      })
    ],
    onViewStateChange: ({viewState}) => {
      state = viewState;
      deck.setProps({viewState: state});
      if (Number(controls('morph').value) === 0) {
        globeRotation = -normalizeLongitude(-state.rotationOrbit);
        globeTilt = state.rotationX;
      }
      schedule();
      queueRefinement();
    }
  });
  function render() {
    frame = null;
    const scale = getExaggeration(state.zoom, Number(controls('exaggeration').value));
    controls('scale').textContent = `${scale.toFixed(1)}× vertical exaggeration`;
    controls('zoom').value = state.zoom;
    if (!heights) return;
    const morph = Number(controls('morph').value),
      projection = controls('projection').value;
    if (
      scale !== lastScale ||
      morph !== lastMorph ||
      projection !== lastProjection ||
      renderedVersion !== detailVersion
    ) {
      mesh = createGlobeMesh(heights, scale, 721, 361, mesh, {
        morph,
        projection,
        cutout: detail?.bounds
      });
      if (detail)
        detailMesh = createGlobeMesh(detail.heights, scale, detail.size, detail.size, detailMesh, {
          morph,
          projection,
          bounds: detail.bounds,
          boundary: (lon, lat) => sampleCoarsePosition(mesh, lon, lat)
        });
      lastScale = scale;
      lastMorph = morph;
      lastProjection = projection;
      renderedVersion = detailVersion;
    }
    deck.setProps({
      layers: [mesh, detail ? detailMesh : null].filter(Boolean).map(
        (geometry, index) =>
          new SimpleMeshLayer({
            id: `bathymetry-${index}`,
            data: [{}],
            mesh: geometry,
            coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
            getPosition: [0, 0, 0],
            getColor: [255, 255, 255],
            wireframe: controls('wireframe').checked,
            material: {
              ambient: 0.6,
              diffuse: 0.8,
              shininess: 12,
              specularColor: [20, 30, 40]
            }
          })
      )
    });
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(render);
  }
  controls('exaggeration').oninput = schedule;
  controls('wireframe').onchange = schedule;
  controls('zoom').oninput = event => {
    state = {...state, zoom: Number(event.target.value)};
    deck.setProps({viewState: state});
    schedule();
    queueRefinement();
  };
  controls('destination').onchange = event => {
    const rotations = {
      pacific: 160,
      atlantic: 30,
      indian: -80,
      americas: 100
    };
    globeRotation = rotations[event.target.value];
    globeTilt = 12;
    controls('morph').value = 0;
    state = {
      ...state,
      target: [0, 0, 0],
      rotationOrbit: globeRotation,
      rotationX: 12,
      zoom: 0
    };
    deck.setProps({viewState: state});
    schedule();
    queueRefinement();
  };
  controls('projection').onchange = () => {
    const t = Number(controls('morph').value);
    if (t > 0) {
      const latitude = geographicLatitude(state.target[2] / t, lastProjection);
      state = {
        ...state,
        target: [
          state.target[0],
          state.target[1],
          mapLatitude(latitude, controls('projection').value) * t
        ]
      };
      deck.setProps({viewState: state});
    }
    schedule();
    queueRefinement();
  };
  controls('morph').oninput = () => {
    const t = Number(controls('morph').value);
    state = {
      ...state,
      rotationOrbit: globeRotation * (1 - t),
      rotationX: globeTilt * (1 - t),
      target: [
        -globeRotation * t,
        -180 * t,
        mapLatitude(globeTilt, controls('projection').value) * t
      ]
    };
    deck.setProps({viewState: state});
    schedule();
    queueRefinement();
  };
  function queueRefinement() {
    clearTimeout(detailTimer);
    detailTimer = setTimeout(refine, 250);
  }
  async function refine() {
    const flat = Number(controls('morph').value) > 0.5;
    const request = selectRefinement(
      flat ? state.target[0] : -state.rotationOrbit,
      flat ? geographicLatitude(state.target[2], controls('projection').value) : state.rotationX,
      state.zoom
    );
    if (!request) {
      desiredKey = undefined;
      detailAbort?.abort();
      detail = undefined;
      detailMesh = undefined;
      detailVersion++;
      controls('detail').textContent = 'Global overview · 30′ samples · zoom in for refinement';
      schedule();
      return;
    }
    if (request.key === desiredKey) return;
    desiredKey = request.key;
    detailAbort?.abort();
    const controller = new AbortController();
    detailAbort = controller;
    controls('detail').textContent = `Loading finer relief · source zoom ${request.zoom}…`;
    try {
      const result = await loadRefinement(request, controller.signal);
      if (controller.signal.aborted || abort.signal.aborted) return;
      detail = result;
      detailMesh = undefined;
      detailVersion++;
      const spacing = (60 * (result.bounds[2] - result.bounds[0])) / (result.size - 1);
      controls('detail').textContent =
        `Refined ${result.bounds[2] - result.bounds[0]}° region · ${spacing.toFixed(2)}′ mesh samples · source zoom ${result.zoom}`;
      schedule();
    } catch (error) {
      if (!controller.signal.aborted && !abort.signal.aborted) {
        desiredKey = undefined;
        controls('detail').textContent =
          `Refinement unavailable; retaining loaded relief (${error.message})`;
      }
    }
  }
  fetch(elevationUrl, {signal: abort.signal})
    .then(async response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = await response.arrayBuffer();
      if (abort.signal.aborted) return;
      if (buffer.byteLength !== 721 * 361 * 2) throw new Error('Unexpected elevation data size');
      const view = new DataView(buffer);
      heights = Int16Array.from({length: 721 * 361}, (_, i) => view.getInt16(i * 2, true));
      controls('status').textContent = 'Global relief · 260,281 elevation nodes · 0.5° spacing';
      schedule();
    })
    .catch(error => {
      if (!abort.signal.aborted)
        controls('status').textContent = `Unable to load relief: ${error.message}`;
    });
  schedule();
  return () => {
    abort.abort();
    detailAbort?.abort();
    clearTimeout(detailTimer);
    cancelAnimationFrame(frame);
    deck.finalize();
    disposePanel();
    root.replaceChildren();
  };
}
