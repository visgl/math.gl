// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createCoordinateTooltip} from '../../../common/coordinate-tooltip.js';
import {mountInfoBox} from '../../../common/info-box.js';
import {createMapData} from './map.js';
import {createProjectedMapScene as createScene} from '../../../common/projected-map-scene.js';
import './style.css';

/** UI and lifecycle. Projection and rendering live in separate modules. */
export function mountQuincuncialStar(root) {
  root.innerHTML = `<section class="quincuncial-star">
    <aside class="qs-controls">
      <label>Projection <select data-map><option value="peirce-quincuncial">Peirce quincuncial</option><option value="berghaus">Berghaus star</option><option value="gingery">Gingery star</option><option value="healpix">HEALPix</option></select></label>
      <label data-lobes-label hidden>Star lobes <select data-lobes><option>3</option><option>4</option><option selected>5</option><option>6</option><option>8</option><option>12</option></select></label>
      <label>Central meridian <output data-center-label>0°</output><input data-center type="range" min="-180" max="180" step="15" value="0" /></label>
      <label class="qs-check"><input type="checkbox" data-grid checked /> Graticule</label>
      <p class="qs-description">Orange: a polygon split at chart boundaries. Coastlines: Natural Earth, public domain.</p>
    </aside>
    <div class="qs-map">
      <canvas aria-label="World map with seam-aware coastlines, points and a split polygon"></canvas>
    </div>
  </section>`;
  const disposeInfo = mountInfoBox(root.querySelector('.qs-controls'), {
    title: 'Quincuncial and star maps',
    theme: 'sleek-light'
  });
  const find = selector => root.querySelector(selector);
  const scene = createScene(find('canvas'));
  const tooltip = createCoordinateTooltip(find('.qs-map'));
  const abort = new AbortController();
  const listen = (element, type, fn) => element.addEventListener(type, fn, {signal: abort.signal});
  const update = () => {
    tooltip.hide();
    find('[data-lobes-label]').hidden = !['berghaus', 'gingery'].includes(find('[data-map]').value);
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
  listen(find('[data-grid]'), 'change', event => {
    tooltip.hide();
    scene.setGrid(event.target.checked);
  });
  listen(find('canvas'), 'pointermove', event => {
    const hit = scene.pick(event);
    if (hit) {
      tooltip.show(
        `${hit.position[0].toFixed(2)}°, ${hit.position[1].toFixed(2)}° · ${hit.regionId}`,
        event
      );
    } else {
      tooltip.hide();
    }
  });
  listen(find('canvas'), 'pointerleave', tooltip.hide);
  listen(find('canvas'), 'pointercancel', tooltip.hide);
  update();
  return () => {
    disposeInfo();
    abort.abort();
    tooltip.dispose();
    scene.dispose();
    root.replaceChildren();
  };
}
