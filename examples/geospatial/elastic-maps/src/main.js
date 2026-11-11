// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createCoordinateTooltip} from '../../../common/coordinate-tooltip.js';
import {mountInfoBox} from '../../../common/info-box.js';
import {createMapData} from './map.js';
import {createScene} from './scene.js';
import './style.css';
export function mountElasticMaps(root) {
  root.innerHTML = `<section class="elastic-maps">
    <aside class="elastic-controls">
      <label>Projection <select data-map><option value="I">Elastic I</option><option value="II">Elastic II</option><option value="III">Elastic III</option><option value="sinusoidal">Sinusoidal</option></select></label>
      <label>Transition <select data-route><option value="auto">Direct morph</option><option value="via-globe">Through globe</option></select></label>
      <label class="elastic-check"><input data-grid type="checkbox" checked> Graticule</label>
      <p data-status role="status" hidden></p>
      <p class="elastic-description">Elastic maps: <a href="https://kunimune.blog/2023/12/29/introducing-the-elastic-projections/">Justin Kunimune</a> (public domain). Coastlines: Natural Earth (public domain). Orange: a polygon crossing cuts.</p>
    </aside>
    <div class="elastic-map">
      <canvas aria-label="Elastic world map with coastlines and a polygon crossing cuts"></canvas>
      <div class="elastic-progress" data-progress role="status" hidden>Preparing...</div>
    </div>
  </section>`;
  const disposeInfo = mountInfoBox(root.querySelector('.elastic-controls'), {
    title: 'Elastic maps',
    theme: 'sleek-light'
  });
  const find = s => root.querySelector(s),
    scene = createScene(find('canvas')),
    abort = new AbortController();
  const map = find('.elastic-map');
  const tooltip = createCoordinateTooltip(map);
  const listen = (el, type, fn) => el.addEventListener(type, fn, {signal: abort.signal});
  let request = 0,
    busy = false;
  const update = async () => {
    const id = ++request;
    busy = true;
    map.setAttribute('aria-busy', 'true');
    tooltip.hide();
    find('[data-status]').hidden = true;
    find('[data-status]').textContent = '';
    find('[data-progress]').hidden = false;
    await new Promise(resolve => requestAnimationFrame(resolve));
    if (id !== request) return;
    try {
      const done = await scene.setData(createMapData(find('[data-map]').value), {
        strategy: find('[data-route]').value,
        onTransitionStart: () => {
          // A stale preparation must not hide progress for a newer selection.
          if (id === request) find('[data-progress]').hidden = true;
        }
      });
      if (done && id === request) {
        busy = false;
        map.setAttribute('aria-busy', 'false');
        find('[data-progress]').hidden = true;
      }
    } catch (error) {
      if (id === request) {
        busy = false;
        map.setAttribute('aria-busy', 'false');
        find('[data-progress]').hidden = true;
        find('[data-status]').hidden = false;
        find('[data-status]').textContent = error.message;
      }
    }
  };
  listen(find('[data-map]'), 'change', update);
  listen(find('[data-route]'), 'change', update);
  listen(find('[data-grid]'), 'change', e => {
    tooltip.hide();
    scene.setGrid(e.target.checked);
  });
  listen(find('canvas'), 'pointermove', e => {
    if (busy) return;
    const hit = scene.pick(e);
    if (hit) {
      tooltip.show(
        `${hit.position[0].toFixed(2)}°, ${hit.position[1].toFixed(2)}° · section ${hit.regionId.split('/')[0]}`,
        e
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
    request++;
    abort.abort();
    tooltip.dispose();
    scene.dispose();
    root.replaceChildren();
  };
}
