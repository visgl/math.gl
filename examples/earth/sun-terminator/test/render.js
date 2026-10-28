// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {Deck, MapView, _GlobeView as GlobeView} from '@deck.gl/core';
import {getSunTerminator} from '@math.gl/earth/sun';
import {DayNightBitmapLayer} from '../day-night-bitmap-layer.js';

// Deterministic GPU fixture: identify missing coverage and measure the feather's RGB blend.
const args = new URLSearchParams(location.search);
const mode = args.get('view') || 'globe';
const longitude = Number(args.get('longitude') || 70);
const latitude = Number(args.get('latitude') || 10);
const altitude = Number(args.get('altitude') || 0);
const feather = Number(args.get('feather') || 6);
const geographic = args.get('geographic') !== 'false';
const RAD = Math.PI / 180;
const sunDirection = getSunTerminator(Date.UTC(2026, 5, 21, 12)).sunDirection;
const texture = color => {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 4;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 4, 4);
  return canvas;
};
const canvas = document.createElement('canvas');
document.body.append(canvas);
let resolve;
window.renderResult = new Promise(done => {
  resolve = done;
});
const maxLatitude = geographic ? 90 : 85.0511287798066;
const layer = new DayNightBitmapLayer({
  id: 'test-earth',
  image: texture('rgb(40,100,200)'),
  nightImage: texture('rgb(10,20,40)'),
  bounds: [-180, -maxLatitude, 180, maxLatitude],
  _imageCoordinateSystem: geographic ? 'lnglat' : 'cartesian',
  sunDirection,
  altitude,
  feather,
  parameters: {cullMode: 'back', depthCompare: 'always', depthWriteEnabled: false}
});
const deck = new Deck({
  canvas,
  parent: document.body,
  views: mode === 'globe' ? new GlobeView({resolution: 2}) : new MapView(),
  initialViewState: {
    longitude,
    latitude,
    zoom: mode === 'globe' ? 2 + Math.log2(Math.cos(latitude * RAD)) : 1
  },
  layers: [layer],
  onAfterRender: () => {
    if (!resolve || !layer.isLoaded || deck.width < 100 || deck.height < 100) return;
    const gl = canvas.getContext('webgl2');
    const pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
    gl.readPixels(
      0,
      0,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      pixels
    );
    const viewport = deck.getViewports()[0];
    const samples = [];
    for (let lon = -175; lon < 180; lon += 5) {
      for (let lat = -80; lat <= 80; lat += 10) {
        const l = lon * RAD,
          p = lat * RAD;
        const front =
          Math.cos(p) * Math.cos(latitude * RAD) * Math.cos(l - longitude * RAD) +
          Math.sin(p) * Math.sin(latitude * RAD);
        if (mode === 'globe' && front < 0.6) continue;
        const [x, y] = viewport.project([lon, lat]);
        if (x < 4 || x > viewport.width - 4 || y < 4 || y > viewport.height - 4) continue;
        // Compare with the center of the actual raster pixel, not the nearby projected vertex.
        const [pixelLon, pixelLat] = viewport.unproject([Math.floor(x) + 0.5, Math.floor(y) + 0.5]);
        const pl = pixelLon * RAD,
          pp = pixelLat * RAD;
        const light = [
          Math.cos(pp) * Math.cos(pl),
          Math.cos(pp) * Math.sin(pl),
          Math.sin(pp)
        ].reduce((sum, n, i) => sum + n * sunDirection[i], 0);
        const start = Math.sin((altitude - feather) * RAD),
          end = Math.sin(altitude * RAD);
        const t = Math.max(0, Math.min(1, (light - start) / (end - start)));
        const darkness = 1 - t * t * (3 - 2 * t);
        const offset =
          ((gl.drawingBufferHeight - 1 - Math.floor(y)) * gl.drawingBufferWidth + Math.floor(x)) *
          4;
        samples.push({lon, lat, darkness, rgb: Array.from(pixels.slice(offset, offset + 3))});
      }
    }
    resolve(samples);
    resolve = null;
  }
});
