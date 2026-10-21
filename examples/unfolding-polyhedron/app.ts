// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';
import {createSolid, edgeKey, type Solid} from './polyhedra';
import {createCutLayout, type CutMode} from './cut-layout';
import {createRenderer} from './renderer';

const canvas = document.querySelector('canvas')!;
const renderer = createRenderer(canvas, document.querySelector('#imagery-status')!);
const earth = document.querySelector<HTMLInputElement>('#earth')!;
const edges = document.querySelector<HTMLInputElement>('#edges')!;
const slider = document.querySelector<HTMLInputElement>('#unfold')!;
const amount = document.querySelector<HTMLOutputElement>('#amount')!;
const play = document.querySelector<HTMLButtonElement>('#play')!;
const solid = document.querySelector<HTMLSelectElement>('#solid')!;
const cuts = document.querySelector<HTMLSelectElement>('#cuts')!;
const cutSummary = document.querySelector<HTMLElement>('#cut-summary')!;
const subdivision = document.querySelector<HTMLSelectElement>('#subdivision')!;
const summary = document.querySelector<HTMLElement>('#summary')!;
const notice = document.querySelector<HTMLElement>('#notice')!;
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
  document.querySelector<HTMLButtonElement>('#recut')!.disabled = preset;
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
solid.addEventListener('change', () => {
  subdivision.disabled = solid.value !== 'icosahedron';
  earth.disabled = solid.value !== 'icosahedron';
  if (solid.value !== 'icosahedron') cuts.value = 'legacy';
  subdivision.value = '0';
  seed = 1;
  rebuild();
});
cuts.addEventListener('change', rebuild);
subdivision.addEventListener('change', () => {
  seed = 1;
  rebuild();
});
document.querySelector('#recut')!.addEventListener('click', () => {
  seed++;
  rebuild();
});
describe();
function setUnfold(value: number) {
  unfolding = value;
  slider.value = String(value * 100);
  amount.value = `${Math.round(value * 100)}%`;
}
slider.addEventListener('input', () => {
  playing = false;
  play.textContent = 'Play';
  setUnfold(Number(slider.value) / 100);
});
play.addEventListener('click', () => {
  playing = !playing;
  if (unfolding >= 1) direction = -1;
  if (unfolding <= 0) direction = 1;
  play.textContent = playing ? 'Pause' : 'Play';
});
document.querySelector('#flat')!.addEventListener('click', () => {
  yaw = 0;
  pitch = 0;
  playing = false;
  play.textContent = 'Play';
  setUnfold(1);
});
document.querySelector('#reset')!.addEventListener('click', () => {
  yaw = -0.3;
  pitch = 0.65;
});
canvas.addEventListener('pointerdown', e => {
  drag = {x: e.clientX, y: e.clientY};
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', e => {
  if (!drag) return;
  yaw += (e.clientX - drag.x) * 0.008;
  pitch = Math.max(-1.5, Math.min(1.5, pitch + (e.clientY - drag.y) * 0.008));
  drag = {x: e.clientX, y: e.clientY};
});
canvas.addEventListener('pointerup', () => {
  drag = null;
});
canvas.addEventListener('pointercancel', () => {
  drag = null;
});
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
    const positions = faces.map(face =>
      face.points.map(p => [
        (2 * (p[0] - (minX + maxX) / 2) * scale) / width,
        (2 * (p[1] - (minY + maxY) / 2) * scale) / height,
        -p[2] / (depth + 1)
      ])
    );
    renderer.draw(layout.mesh, positions, hinges, earth.checked && !earth.disabled, edges.checked);
  }
  requestAnimationFrame(render);
}
requestAnimationFrame(render);
