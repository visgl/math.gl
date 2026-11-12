// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {mountInfoBox} from '../../../common/info-box.js';
import {PROJECTIONS} from './constants.ts';
import {
  BLACK_MARBLE_CREDIT_URL,
  GIBS_CREDIT_URL,
  STATE_CREDIT_URL,
  NIGHT_DATE
} from './constants.ts';
import {BLUE_MARBLE_CREDIT_URL} from '../../../common/blue-marble.js';

/** Create the panel and its controls; the renderer owns the event handlers. */
export function createControlPanel(host: HTMLElement) {
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
        <p><a href="${BLUE_MARBLE_CREDIT_URL}">NASA Blue Marble</a> and
        <a href="${BLACK_MARBLE_CREDIT_URL}">Black Marble</a>, via
        <a href="${GIBS_CREDIT_URL}">GIBS</a>.
        Night lights are a fixed ${NIGHT_DATE.slice(0, 4)} composite. Time moves the soft day/night boundary, not the imagery.
        Cut maps load detail independently for each visible piece. Detail follows zoom; the overview covers the poles and remains visible if a tile fails.
        State clipping uses <a href="${STATE_CREDIT_URL}">US Atlas / Census 2017 boundaries</a>.
        H3 shows its twenty icosahedron faces and base-cell grid.</p>
      </details>`;
  host.append(controls);
  const finalize = mountInfoBox(host, {title: 'Earth after dark', width: 300});
  return {
    element: controls,
    getControl: <K extends keyof ControlElements>(role: K): ControlElements[K] => {
      const element = controls.querySelector<ControlElements[K]>(`[data-role="${role}"]`);
      if (!element) throw new Error(`Missing control: ${role}`);
      return element;
    },
    finalize
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
