// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {Deck, OrthographicView, _CustomProjectionView as CustomProjectionView} from '@deck.gl/core';
import {PathLayer} from '@deck.gl/layers';
import {mountInfoBox} from '../../../../common/info-box.js';
import {prepareCenteredFrame} from './recipe.mjs';
import '../style.css';
export function mountCenteredObliqueMercator(root) {
  root.innerHTML = `<section class="projection-domains"><div class="projection-map"><canvas></canvas></div><aside><p>math.gl projection interfaces, native or external conversions. Changing center or orientation rebuilds this qualified local patch.</p><label>Renderer<select data-renderer><option value="prepared">Prepared paths</option><option value="deck">deck.gl custom projection</option></select></label><label>Engine<select data-engine><option value="proj4js">proj4js</option><option value="math.gl">math.gl</option></select></label><label>Longitude<input data-lon type="range" min="-180" max="180" value="180"></label><label>Latitude<input data-lat type="range" min="-60" max="60" value="-17"></label><label>Orientation<input data-alpha type="range" min="-80" max="80" value="35"></label><button data-fiji>Fiji / geographic seam</button> <button data-repeat>Repeat same request</button><p>Orange is a declared processing patch, not an inferred validity domain. Hover paths to inspect target coordinates.</p><output data-status aria-live="polite"></output></aside></section>`;
  const disposeInfo = mountInfoBox(root.querySelector('aside'), {
    title: 'Centered oblique Mercator',
    theme: 'sleek-dark',
    width: 280
  });
  const preparedView = new OrthographicView({id: 'omerc', flipY: false});
  const createDeck = props =>
    new Deck({
      parent: root.querySelector('.projection-map'),
      canvas: root.querySelector('canvas'),

      controller: true,
      onError: error => {
        root.dataset.error = String(error);
        root.querySelector('[data-status]').textContent = String(error);
      },
      getTooltip: ({object}) =>
        object
          ? 'Qualified local processing chart; source longitude is continuous across ±180°'
          : null,
      ...props
    });
  let deck;
  let renderer;
  let frame,
    revision = 0;
  let request = 0;
  async function update() {
    const generation = ++request;
    delete root.dataset.ready;
    try {
      const value = name => Number(root.querySelector(`[data-${name}]`).value),
        start = performance.now();
      frame = prepareCenteredFrame(
        {
          center: [value('lon'), value('lat')],
          alpha: value('alpha'),
          backend: root.querySelector('[data-engine]').value
        },
        frame
      );
      if (!frame.reused) revision++;
      const native = root.querySelector('[data-renderer]').value === 'deck';
      const center = [value('lon'), value('lat'), 0];
      const view = native
        ? new CustomProjectionView({
            id: 'omerc',
            crs: frame.descriptor,
            orthographic: true
          })
        : preparedView;
      if (native) await view.initialize();
      if (generation !== request) return;
      const path = native ? d => d : d => d.map(p => p.map(v => v / 10000));
      const props = {
        views: view,
        initialViewState: native
          ? {center, zoom: Math.log2(40075016.6855 / (512 * 10000))}
          : {target: [0, 0, 0], zoom: 0},
        layers: [
          new PathLayer({
            id: native ? 'omerc-patch-wgs84' : 'omerc-patch',
            data: [native ? frame.sourcePatch : frame.patch],
            getPath: path,
            getColor: [255, 170, 70],
            getWidth: 3,
            widthUnits: 'pixels',
            coordinateSystem: native ? 'lnglat' : 'cartesian',
            pickable: true
          }),
          new PathLayer({
            id: native ? 'omerc-graticule-wgs84' : 'omerc-graticule',
            data: native ? frame.sourceGraticule : frame.graticule,
            getPath: path,
            getColor: [100, 200, 225],
            getWidth: 1,
            widthUnits: 'pixels',
            coordinateSystem: native ? 'lnglat' : 'cartesian'
          })
        ]
      };
      if (renderer !== native) {
        deck?.finalize();
        deck = createDeck(props);
        renderer = native;
      } else {
        deck.setProps(props);
      }
      root.querySelector('[data-status]').textContent =
        `${frame.reused ? 'Reused' : 'Rebuilt'} revision ${revision}; ${(performance.now() - start).toFixed(1)} ms preparation + submission. Center ${value('lon')}°, ${value('lat')}°; orientation ${value('alpha')}°. Full definition and backend enter the execution key. No global domain or continuous-frame guarantee.`;
      root.dataset.ready = 'true';
      root.dataset.revision = String(revision);
      delete root.dataset.error;
    } catch (error) {
      if (generation !== request) return;
      root.dataset.error = String(error);
      root.querySelector('[data-status]').textContent = String(error);
    }
  }
  const listeners = [];
  for (const control of root.querySelectorAll('input,select')) {
    control.addEventListener('input', update);
    listeners.push([control, 'input', update]);
  }
  const repeat = root.querySelector('[data-repeat]'),
    fiji = root.querySelector('[data-fiji]');
  const reset = () => {
    root.querySelector('[data-lon]').value = '180';
    root.querySelector('[data-lat]').value = '-17';
    root.querySelector('[data-alpha]').value = '35';
    update();
  };
  repeat.addEventListener('click', update);
  fiji.addEventListener('click', reset);
  update();
  return async () => {
    request++;
    for (const [node, event, fn] of listeners) node.removeEventListener(event, fn);
    repeat.removeEventListener('click', update);
    fiji.removeEventListener('click', reset);
    deck?.finalize();
    disposeInfo();
    root.replaceChildren();
  };
}
