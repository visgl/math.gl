// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createMapData} from './map.js';
import {createScene} from './scene.js';
import './style.css';

/** UI and lifecycle. Projection and rendering live in separate modules. */
export function mountQuincuncialStar(root) {
  root.innerHTML = `<section class="quincuncial-star">
    <div class="qs-controls">
      <label>Projection <select data-map><option value="peirce-quincuncial">Peirce quincuncial</option><option value="berghaus">Berghaus star</option></select></label>
      <label data-lobes-label hidden>Star lobes <select data-lobes><option>3</option><option>4</option><option selected>5</option><option>6</option><option>8</option><option>12</option></select></label>
      <label>Central meridian <input data-center type="range" min="-180" max="180" step="15" value="0" /><output data-center-label>0°</output></label>
      <label><input type="checkbox" data-grid checked /> Graticule</label>
    </div>
    <canvas aria-label="World map with seam-aware coastlines, points and a split polygon"></canvas>
    <p data-status role="status">Move over the map to inspect coordinates.</p>
    <small>Orange: a polygon split at chart boundaries. Coastlines: Natural Earth, public domain. Equatorial aspect; no hinged animation.</small>
  </section>`;
  const find = selector => root.querySelector(selector);
  const scene = createScene(find('canvas'));
  const abort = new AbortController();
  const listen = (element, type, fn) => element.addEventListener(type, fn, {signal: abort.signal});
  const update = () => {
    find('[data-lobes-label]').hidden = find('[data-map]').value !== 'berghaus';
    find('[data-center-label]').textContent = `${find('[data-center]').value}°`;
    scene.setData(
      createMapData(
        find('[data-map]').value,
        Number(find('[data-lobes]').value),
        Number(find('[data-center]').value)
      )
    );
  };
  for (const selector of ['[data-map]', '[data-lobes]', '[data-center]'])
    listen(find(selector), 'change', update);
  listen(find('[data-grid]'), 'change', event => scene.setGrid(event.target.checked));
  listen(find('canvas'), 'pointermove', event => {
    const hit = scene.pick(event);
    find('[data-status]').textContent = hit
      ? `${hit.position[0].toFixed(2)}°, ${hit.position[1].toFixed(2)}° · ${hit.regionId}`
      : 'Outside the map';
  });
  update();
  return () => {
    abort.abort();
    scene.dispose();
    root.replaceChildren();
  };
}
