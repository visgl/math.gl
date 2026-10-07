// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {Deck, _GlobeView as GlobeView} from '@deck.gl/core';
import {BitmapLayer} from '@deck.gl/layers';
import {parsePGM} from '@math.gl/geoid';

import {BLUE_MARBLE_TILES, BLUE_MARBLE_CREDIT_URL} from '../common/blue-marble.js';

let nextInstance = 0;
/** Mounts an EGM96 height field and returns its cleanup function. */
export function mountGeoidGlobe(root, {lowUrl, hiUrl}) {
  const id = `geoid-globe-${nextInstance++}`;
  root.innerHTML = `<canvas data-role="globe" aria-label="Interactive geoid globe"></canvas>
    <aside><h1>Earth’s geoid</h1><p>Drag to rotate. Scroll to zoom. Hover for geoid height.</p>
    <label for="${id}-resolution">EGM96 grid</label>
    <select id="${id}-resolution" data-role="resolution"><option value="low">Low · 1° preview</option><option value="hi">High · 15′ grid</option></select>
    <label for="${id}-interpolation">Interpolation</label>
    <select id="${id}-interpolation" data-role="interpolation"><option value="cubic">Cubic</option><option value="bilinear">Bilinear</option></select>
    <p data-role="status" role="status">Loading EGM96…</p><div class="legend"></div>
    <div class="legend-labels"><span>−110 m</span><span>0 m</span><span>+110 m</span></div>
    <p>Geoid height N above the WGS84 ellipsoid. Ellipsoidal height h = orthometric height H + N.</p>
    <p class="credits"><a href="${BLUE_MARBLE_CREDIT_URL}">NASA Blue Marble</a>. NGA EGM96 data, via <a href="https://geographiclib.sourceforge.io/C++/doc/geoid.html">GeographicLib</a>. Colors show geoid undulation, not terrain elevation.</p></aside>`;
  const resolution = root.querySelector('[data-role="resolution"]');
  const interpolation = root.querySelector('[data-role="interpolation"]');
  const status = root.querySelector('[data-role="status"]');
  const abort = new AbortController();
  const cache = new Map();
  let geoid;
  let request = 0;
  const deck = new Deck({
    canvas: root.querySelector('canvas'),
    parent: root,
    views: new GlobeView({controller: true, resolution: 2}),
    initialViewState: {
      longitude: 30,
      latitude: 15,
      zoom: 1.5,
      minZoom: -1,
      maxZoom: 6
    },
    getTooltip: ({coordinate}) => {
      if (!geoid || !coordinate) return null;
      const [longitude, latitude] = coordinate;
      return {
        text: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°\nGeoid height N: ${geoid.getHeight(latitude, longitude).toFixed(2)} m`,
        style: {backgroundColor: '#0d2035', color: '#fff'}
      };
    }
  });
  async function update() {
    const token = ++request;
    status.textContent = 'Loading EGM96…';
    try {
      const key = resolution.value;
      let bytes = cache.get(key);
      if (!bytes) {
        const response = await fetch(key === 'hi' ? hiUrl : lowUrl, {
          signal: abort.signal
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        bytes = new Uint8Array(await response.arrayBuffer());
        cache.set(key, bytes);
      }
      if (token !== request || abort.signal.aborted) return;
      geoid = parsePGM(bytes, {cubic: interpolation.value === 'cubic'});
      const width = key === 'hi' ? 1440 : 360;
      const height = key === 'hi' ? 721 : 181;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      const image = context.createImageData(width, height);
      const blue = [37, 99, 235];
      const neutral = [238, 242, 245];
      const red = [220, 38, 38];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const n = geoid.getHeight(90 - (y * 180) / (height - 1), -180 + (x * 360) / (width - 1));
          const t = Math.min(Math.abs(n) / 110, 1);
          const end = n < 0 ? blue : red;
          const offset = (y * width + x) * 4;
          for (let channel = 0; channel < 3; channel++)
            image.data[offset + channel] = Math.round(
              neutral[channel] + t * (end[channel] - neutral[channel])
            );
          image.data[offset + 3] = 255;
        }
      }
      context.putImageData(image, 0, 0);
      deck.setProps({
        layers: [
          ...BLUE_MARBLE_TILES.map(
            (tile, index) =>
              new BitmapLayer({
                id: `blue-marble-${index}`,
                ...tile,
                pickable: false
              })
          ),
          new BitmapLayer({
            id: 'geoid-field',
            opacity: 0.65,
            image: canvas,
            bounds: [-180, -90, 180, 90],
            pickable: true
          })
        ]
      });
      status.textContent = `EGM96 · ${key === 'hi' ? '15′' : '1° preview'} · ${interpolation.value}`;
    } catch (error) {
      if (token === request && !abort.signal.aborted)
        status.textContent = `Unable to load EGM96: ${error.message}`;
    }
  }
  resolution.addEventListener('change', update);
  interpolation.addEventListener('change', update);
  update();
  return () => {
    request++;
    abort.abort();
    resolution.removeEventListener('change', update);
    interpolation.removeEventListener('change', update);
    deck.finalize();
  };
}
