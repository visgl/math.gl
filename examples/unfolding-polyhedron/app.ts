// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';
import {createSolid, edgeKey, type Solid} from './polyhedra';
import {createCutLayout, type CutMode} from './cut-layout';
import {createRenderer} from './renderer';
import {markup} from './view';
import {pickSurface} from './picking';

/** Mount one independent instance; cleanup releases listeners, animation and GPU resources. */
export function mountUnfolding(root: HTMLElement) {
  root.innerHTML = markup;
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
  const renderer = createRenderer(canvas, root.querySelector('#imagery-status')!);
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
  let seed = 1,
    layout = createCutLayout(createSolid('icosahedron', 2), seed, 'ocean');
  let hinges = new Set<string>();
  let yaw = -0.3,
    pitch = 0.65,
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
    root.querySelector<HTMLButtonElement>('#recut')!.disabled = preset;
    cutSummary.textContent = `Estimated land crossed by cuts: ${Math.round(layout.cutLandKm).toLocaleString()} km · original strategy on this mesh: ${Math.round(layout.baselineLandKm).toLocaleString()} km. ${preset ? 'AirOcean 24-panel topology; spherical texture mapping, not the Fuller projection.' : 'Ocean preference minimizes sampled land cuts; it cannot guarantee unbroken continents.'}`;
    hinges = new Set(layout.edges.filter(e => e.hinge).map(e => edgeKey(e.a, e.b)));
    summary.textContent = `${layout.mesh.faces.length.toLocaleString()} panels · ${hinges.size.toLocaleString()} hinges · ${(layout.edges.length - hinges.size).toLocaleString()} cut edges · layout ${seed}`;
    notice.textContent = layout.overlaps
      ? `Flat net: ${layout.overlaps.toLocaleString()} overlapping face pairs. Try another cut layout. Motion collisions are not checked.`
      : 'Flat net: no face overlaps detected. Motion collisions are not checked.';
  }
  function rebuild() {
    layout = createCutLayout(
      createSolid(solid.value as Solid, Number(subdivision.value)),
      seed,
      cuts.value as CutMode
    );
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
    yaw = -0.3;
    pitch = 0.65;
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
      renderer.ready
    ].join(':');
    if (key !== previous) {
      previous = key;
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }
      const view = new Matrix4()
        .rotateX(pitch)
        .rotateY(yaw)
        .rotateZ(cuts.value === 'dymaxion' ? Math.PI / 2 : 0);
      const faces = layout.evaluate(unfolding).map((face, i) => {
        const points = face.map(p => Array.from(view.transformAsPoint(p)));
        return {i, points, depth: points.reduce((s, p) => s + p[2], 0) / points.length};
      });
      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
      for (const face of faces)
        for (const p of face.points) {
          minX = Math.min(minX, p[0]);
          maxX = Math.max(maxX, p[0]);
          minY = Math.min(minY, p[1]);
          maxY = Math.max(maxY, p[1]);
        }
      const scale = Math.min(
        (width - 50) / Math.max(maxX - minX, 2.5),
        (height - 40) / Math.max(maxY - minY, 2.5)
      );
      const depth = Math.max(1, ...faces.flatMap(face => face.points.map(p => Math.abs(p[2]))));
      positions = faces.map(face =>
        face.points.map(p => [
          (2 * (p[0] - (minX + maxX) / 2) * scale) / width,
          (2 * (p[1] - (minY + maxY) / 2) * scale) / height,
          -p[2] / (depth + 1)
        ])
      );
      hoverDirty = true;
      renderer.draw(
        layout.mesh,
        positions,
        hinges,
        earth.checked && !earth.disabled,
        edges.checked
      );
    }
    if (hoverDirty) {
      updateTooltip();
      hoverDirty = false;
    }
    frame = requestAnimationFrame(render);
  }
  frame = requestAnimationFrame(render);

  return () => {
    abort.abort();
    cancelAnimationFrame(frame);
    renderer.dispose();
    root.replaceChildren();
  };
}
