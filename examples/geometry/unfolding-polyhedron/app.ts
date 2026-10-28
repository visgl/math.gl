// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {mountInfoBox} from '../../common/info-box.js';

import {createSolid, edgeKey, type Solid} from './polyhedra';
import {createCutLayout, type CutMode} from './cut-layout';
import {createUnfoldingScene} from './scene';
import {markup} from './view';
import {pickSurface} from './picking';

/** Mount one independent instance; cleanup releases listeners, animation and GPU resources. */
export function mountUnfolding(
  root: HTMLElement,
  view = markup,
  options: {
    buildLayout?: (
      level: number,
      seed: number,
      mode: string
    ) => Omit<ReturnType<typeof createCutLayout>, 'cutLandKm' | 'baselineLandKm'> & {
      cutLandKm?: number;
      baselineLandKm?: number;
      description?: string;
      canRecut?: boolean;
    };
    landTexture?: HTMLCanvasElement;
    northUp?: boolean;
  } = {}
) {
  root.innerHTML = view;
  const selectors = root.querySelector<HTMLElement>('.selectors')!;
  const playback = root.querySelector<HTMLElement>('footer .controls')!;
  const disposeSelectors = mountInfoBox(selectors, {title: 'Geometry and cuts', theme: 'sleek-dark'});
  const disposePlayback = mountInfoBox(playback, {title: 'Unfolding', theme: 'sleek-dark'});
  const abort = new AbortController();
  let frame = 0;
  function listen<K extends keyof HTMLElementEventMap>(
    element: HTMLElement,
    type: K,
    listener: (event: HTMLElementEventMap[K]) => void
  ) {
    element.addEventListener(type, listener as EventListener, {signal: abort.signal});
  }
  const canvas = root.querySelector('canvas')!;
  const tooltip = document.createElement('div');
  tooltip.className = 'coordinate-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.hidden = true;
  canvas.parentElement!.append(tooltip);
  let pointer: {x: number; y: number} | null = null;
  let positions: number[][][] = [];
  let hoverDirty = false;
  function updateTooltip() {
    tooltip.hidden = true;
    if (!pointer || drag) return;
    const bounds = canvas.getBoundingClientRect();
    const x = (pointer.x - bounds.left) / bounds.width;
    const y = (pointer.y - bounds.top) / bounds.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    const hit = pickSurface(layout.mesh, positions, x * 2 - 1, 1 - y * 2);
    if (!hit) return;
    tooltip.textContent = `Lon ${hit.longitude.toFixed(3)}° · Lat ${hit.latitude.toFixed(3)}° · Panel ${hit.face + 1}`;
    tooltip.hidden = false;
    const parent = canvas.parentElement!.getBoundingClientRect();
    tooltip.style.left = `${Math.max(0, Math.min(pointer.x - parent.left + 14, parent.width - tooltip.offsetWidth))}px`;
    tooltip.style.top = `${pointer.y - parent.top - tooltip.offsetHeight - 12}px`;
  }
  const scene = createUnfoldingScene(canvas, {
    landTexture: options.landTexture,
    stableFraming: options.northUp,
    onImageryStatus: message => {
      root.querySelector('#imagery-status')!.textContent = message;
    }
  });
  const earth = root.querySelector<HTMLInputElement>('#earth')!;
  const edges = root.querySelector<HTMLInputElement>('#edges')!;
  const slider = root.querySelector<HTMLInputElement>('#unfold')!;
  const amount = root.querySelector<HTMLOutputElement>('#amount')!;
  const play = root.querySelector<HTMLButtonElement>('#play')!;
  const solid = root.querySelector<HTMLSelectElement>('#solid')!;
  const cuts = root.querySelector<HTMLSelectElement>('#cuts')!;
  const cutSummary = root.querySelector<HTMLElement>('#cut-summary')!;
  const subdivision = root.querySelector<HTMLSelectElement>('#subdivision')!;
  const summary = root.querySelector<HTMLElement>('#summary')!;
  const notice = root.querySelector<HTMLElement>('#notice')!;
  const surface = root.querySelector<HTMLSelectElement>('#surface');
  const build = () =>
    options.buildLayout
      ? options.buildLayout(Number(subdivision.value), seed, cuts.value)
      : createCutLayout(
          createSolid(solid.value as Solid, Number(subdivision.value)),
          seed,
          cuts.value as CutMode
        );
  let seed = 1,
    layout = build();
  let hinges = new Set<string>();
  let yaw = options.northUp ? 0 : -0.3,
    pitch = options.northUp ? 0 : 0.65,
    unfolding = 0,
    playing = false,
    direction = 1,
    lastTime = 0;
  let drag: {x: number; y: number} | null = null;
  function describe() {
    const preset = cuts.value === 'dymaxion';
    solid.disabled = preset;
    subdivision.disabled = preset || solid.value !== 'icosahedron';
    cuts.disabled = solid.value !== 'icosahedron';
    root.querySelector<HTMLButtonElement>('#recut')!.disabled =
      preset || ('canRecut' in layout && layout.canRecut === false);
    cutSummary.textContent = options.buildLayout
      ? `${layout.cutLandKm === undefined ? '' : `Estimated land crossed by cuts: ${Math.round(layout.cutLandKm).toLocaleString()} km. `}${'description' in layout ? layout.description : ''}`
      : `Estimated land crossed by cuts: ${Math.round(layout.cutLandKm!).toLocaleString()} km · comparison strategy on this mesh: ${Math.round(layout.baselineLandKm!).toLocaleString()} km. ${preset ? 'AirOcean 24-panel topology; spherical texture mapping, not the Fuller projection.' : 'Ocean preference minimizes sampled land cuts; it cannot guarantee unbroken continents.'}`;
    hinges = new Set(layout.edges.filter(e => e.hinge).map(e => edgeKey(e.a, e.b)));
    summary.textContent = `${layout.mesh.faces.length.toLocaleString()} panels · ${hinges.size.toLocaleString()} hinges · ${(layout.edges.length - hinges.size).toLocaleString()} cut edges · layout ${seed}`;
    notice.textContent = layout.overlaps
      ? `Flat net: ${layout.overlaps.toLocaleString()} overlapping face pairs. Try another cut layout. Motion collisions are not checked.`
      : 'Flat net: no face overlaps detected. Motion collisions are not checked.';
  }
  function rebuild() {
    layout = build();
    describe();
  }
  listen(solid, 'change', () => {
    subdivision.disabled = solid.value !== 'icosahedron';
    earth.disabled = solid.value !== 'icosahedron';
    if (solid.value !== 'icosahedron') cuts.value = 'legacy';
    subdivision.value = '0';
    seed = 1;
    rebuild();
  });
  listen(cuts, 'change', rebuild);
  listen(subdivision, 'change', () => {
    seed = 1;
    rebuild();
  });
  listen(root.querySelector('#recut')!, 'click', () => {
    seed++;
    rebuild();
  });
  describe();
  function setUnfold(value: number) {
    unfolding = value;
    slider.value = String(value * 100);
    amount.value = `${Math.round(value * 100)}%`;
  }
  listen(slider, 'input', () => {
    playing = false;
    play.textContent = 'Play';
    setUnfold(Number(slider.value) / 100);
  });
  listen(play, 'click', () => {
    playing = !playing;
    if (unfolding >= 1) direction = -1;
    if (unfolding <= 0) direction = 1;
    play.textContent = playing ? 'Pause' : 'Play';
  });
  listen(root.querySelector('#flat')!, 'click', () => {
    yaw = 0;
    pitch = 0;
    playing = false;
    play.textContent = 'Play';
    setUnfold(1);
  });
  listen(root.querySelector('#reset')!, 'click', () => {
    yaw = options.northUp ? 0 : -0.3;
    pitch = options.northUp ? 0 : 0.65;
  });
  listen(canvas, 'pointerdown', e => {
    drag = {x: e.clientX, y: e.clientY};
    tooltip.hidden = true;
    canvas.setPointerCapture(e.pointerId);
  });
  listen(canvas, 'pointermove', e => {
    pointer = e.pointerType === 'touch' ? null : {x: e.clientX, y: e.clientY};
    hoverDirty = true;
    if (!drag) return;
    yaw += (e.clientX - drag.x) * 0.008;
    pitch = Math.max(-1.5, Math.min(1.5, pitch + (e.clientY - drag.y) * 0.008));
    drag = {x: e.clientX, y: e.clientY};
  });
  listen(canvas, 'pointerup', () => {
    drag = null;
    hoverDirty = true;
  });
  listen(canvas, 'pointercancel', () => {
    drag = null;
    pointer = null;
    tooltip.hidden = true;
  });
  listen(canvas, 'pointerleave', () => {
    pointer = null;
    tooltip.hidden = true;
  });
  listen(canvas, 'lostpointercapture', () => {
    drag = null;
    hoverDirty = true;
  });
  window.addEventListener(
    'scroll',
    () => {
      pointer = null;
      tooltip.hidden = true;
    },
    {capture: true, signal: abort.signal}
  );
  let previous = '';
  function render(time: number) {
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    if (playing) {
      setUnfold(Math.max(0, Math.min(1, unfolding + (direction * dt) / 5)));
      if (unfolding === 0 || unfolding === 1) direction *= -1;
    }
    const {width, height} = canvas.getBoundingClientRect(),
      dpr = Math.min(devicePixelRatio, 2);
    const key = [
      solid.value,
      cuts.value,
      subdivision.value,
      seed,
      unfolding,
      yaw,
      pitch,
      width,
      height,
      dpr,
      earth.checked,
      edges.checked,
      scene.ready,
      surface?.value
    ].join(':');
    if (key !== previous) {
      previous = key;
      const surfaceStatus = root.querySelector<HTMLElement>('#surface-status');
      if (surfaceStatus) {
        surfaceStatus.hidden = surface?.value !== 'land';
        root.querySelector<HTMLElement>('#imagery-status')!.hidden = surface?.value === 'land';
      }
      positions = scene.draw(layout, hinges, {
        unfolding,
        yaw,
        pitch,
        rotationZ: cuts.value === 'dymaxion' ? Math.PI / 2 : 0,
        earth: earth.checked && !earth.disabled,
        edges: edges.checked,
        land: surface?.value === 'land'
      });
      hoverDirty = true;
    }
    if (hoverDirty) {
      updateTooltip();
      hoverDirty = false;
    }
    frame = requestAnimationFrame(render);
  }
  frame = requestAnimationFrame(render);

  return () => {
    disposeSelectors();
    disposePlayback();
    abort.abort();
    cancelAnimationFrame(frame);
    scene.dispose();
    root.replaceChildren();
  };
}
