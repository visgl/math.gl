// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {mountInfoBox} from '../../common/info-box.js';
import {createMapData} from './map.js';
import {createScene} from './scene.js';
import './style.css';
export function mountElasticMaps(root) {
  root.innerHTML = `<section class="elastic-maps">
    <canvas aria-label="Elastic world map with coastlines and a polygon crossing cuts"></canvas>
    <div class="elastic-controls"><label>Projection <select data-map><option value="I">Elastic I</option><option value="II">Elastic II</option><option value="III">Elastic III</option><option value="sinusoidal">Sinusoidal</option></select></label>
    <label>Transition <select data-route><option value="auto">Direct morph</option><option value="via-globe">Through globe</option></select></label>
    <label><input data-grid type="checkbox" checked> Graticule</label></div>
    <p data-status role="status">Move over the map to inspect coordinates.</p>
    <footer>Elastic maps: <a href="https://kunimune.blog/2023/12/29/introducing-the-elastic-projections/">Justin Kunimune</a> (public domain). Coastlines: Natural Earth (public domain). Orange: a polygon crossing cuts.</footer>
  </section>`;
  const disposeInfo = mountInfoBox(root.querySelector('.elastic-controls'), {title: "Elastic maps", theme: 'sleek-light'});
  const find = s => root.querySelector(s),
    scene = createScene(find('canvas')),
    abort = new AbortController();
  const listen = (el, type, fn) => el.addEventListener(type, fn, {signal: abort.signal});
  let request = 0,
    busy = false;
  const update = async () => {
    const id = ++request;
    busy = true;
    find('[data-status]').textContent = 'Preparing and animating transition…';
    await new Promise(resolve => requestAnimationFrame(resolve));
    if (id !== request) return;
    try {
      const done = await scene.setData(createMapData(find('[data-map]').value), {
        strategy: find('[data-route]').value
      });
      if (done && id === request) {
        busy = false;
        find('[data-status]').textContent = 'Move over the map to inspect coordinates.';
      }
    } catch (error) {
      if (id === request) {
        busy = false;
        find('[data-status]').textContent = error.message;
      }
    }
  };
  listen(find('[data-map]'), 'change', update);
  listen(find('[data-route]'), 'change', update);
  listen(find('[data-grid]'), 'change', e => scene.setGrid(e.target.checked));
  listen(find('canvas'), 'pointermove', e => {
    if (busy) return;
    const hit = scene.pick(e);
    find('[data-status]').textContent = hit
      ? `${hit.position[0].toFixed(2)}°, ${hit.position[1].toFixed(2)}° · section ${hit.regionId.split('/')[0]}`
      : 'Outside the map';
  });
  update();
  return () => {
    disposeInfo();
    request++;
    abort.abort();
    scene.dispose();
    root.replaceChildren();
  };
}
