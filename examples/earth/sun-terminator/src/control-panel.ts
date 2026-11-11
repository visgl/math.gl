// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {applyPanelTheme} from '@deck.gl-community/panels';
import {PROJECTIONS} from './constants.ts';
import {
  BLACK_MARBLE_CREDIT_URL,
  GIBS_CREDIT_URL,
  STATE_CREDIT_URL,
  NIGHT_DATE
} from './constants.ts';
import {BLUE_MARBLE_CREDIT_URL} from '../../../common/blue-marble.js';
import '../../../common/example-panel.css';

let nextInstance = 0;

/** Create the panel and its controls; the renderer owns the event handlers. */
export function createControlPanel(host: HTMLElement) {
  const controls = document.createElement('div');
  controls.className = 'example-panel-content sun-controls';
  controls.id = `sun-controls-${nextInstance++}`;
  controls.innerHTML = `
      <p class="intro">Drag to explore. Scroll to zoom.</p>
      <label><span>View</span><select data-role="view">${PROJECTIONS.map(p => `<option value="${p.id}">${p.label}</option>`).join('')}</select></label>
      <label><span>Date · UTC</span><input data-role="date" type="date" /></label>
      <div class="time-row"><label><span>Time · UTC</span><input data-role="time" type="time" step="60" /></label>
        <button data-role="play" type="button" aria-pressed="false">Play</button></div>
      <label><span>Offset <output data-role="offset-label">+0 h</output></span><input data-role="offset" type="range" min="0" max="24" step="0.05" value="0" aria-label="Time offset in hours" /></label>
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
        <p><a href="${BLUE_MARBLE_CREDIT_URL}">NASA Blue Marble</a> and
        <a href="${BLACK_MARBLE_CREDIT_URL}">Black Marble</a>, via
        <a href="${GIBS_CREDIT_URL}">GIBS</a>.
        Night lights are a fixed ${NIGHT_DATE.slice(0, 4)} composite. Time moves the soft day/night boundary, not the imagery.
        Cut maps load detail independently for each visible piece. Detail follows zoom; the overview covers the poles and remains visible if a tile fails.
        State clipping uses <a href="${STATE_CREDIT_URL}">US Atlas / Census 2017 boundaries</a>.
        H3 shows its twenty icosahedron faces and base-cell grid.</p>
      </details>`;
  // Keep controls independent of the map's widget positioning and lifecycle.
  applyPanelTheme(host, {base: 'sleek-dark', variables: {}});
  host.innerHTML = `<header><button class="sun-panel-toggle" type="button" aria-expanded="true">
    Earth after dark
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
  </button></header>`;
  host.append(controls);
  const panelToggle = host.querySelector<HTMLButtonElement>('.sun-panel-toggle')!;
  panelToggle.setAttribute('aria-controls', controls.id);
  const togglePanel = () => {
    controls.hidden = !controls.hidden;
    panelToggle.setAttribute('aria-expanded', String(!controls.hidden));
  };
  panelToggle.addEventListener('click', togglePanel);
  return {
    element: controls,
    getControl: <K extends keyof ControlElements>(role: K): ControlElements[K] => {
      const element = controls.querySelector<ControlElements[K]>(`[data-role="${role}"]`);
      if (!element) throw new Error(`Missing control: ${role}`);
      return element;
    },
    finalize: () => panelToggle.removeEventListener('click', togglePanel)
  };
}

type ControlElements = {
  date: HTMLInputElement;
  time: HTMLInputElement;
  view: HTMLSelectElement;
  altitude: HTMLSelectElement;
  feather: HTMLSelectElement;
  play: HTMLButtonElement;
  status: HTMLParagraphElement;
  offset: HTMLInputElement;
  'offset-label': HTMLOutputElement;
  speed: HTMLSelectElement;
};
