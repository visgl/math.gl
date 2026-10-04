// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original demo; optional deck.gl CDN runtime is MIT.
import {writeFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';

const output = process.argv[2];
if (!output) throw new Error('Usage: node modules/sun/scripts/create-stars-demo.mjs /absolute/path/stars.html');
const entry = fileURLToPath(new URL('../dist/stars.js', import.meta.url));
const script = `import {STAR_CATALOG_INFO, getStarPositions, getStarLayerData, createMilkyWayBackground} from ${JSON.stringify(entry)};
const canvas = document.getElementById('sky'), slider = document.getElementById('epoch');
const context = canvas.getContext('2d');
const observer = {latitude: 37.8, longitude: -122.4, elevation: 0};
const timestamp = Date.parse('2026-10-04T06:00:00Z');
let globe;
if (window.deck) globe = new deck.Deck({parent: document.getElementById('globe'),
  views: new deck._GlobeView({id: 'globe', farZMultiplier: 8}), initialViewState: {latitude: 37.8, longitude: -122.4, zoom: -1}, controller: true});
function render() {
  const started = performance.now(), epochYear = 2000 + Number(slider.value);
  const model = document.getElementById('model').value;
  const stars = getStarPositions(epochYear, {model});
  const milky = createMilkyWayBackground(epochYear);
  const width = canvas.width = 1000, height = canvas.height = 500;
  const image = context.createImageData(width, height);
  for (let y = 0; y < height; y += 4) for (let x = 0; x < width; x += 4) {
    const ra = (x + 2) / width * 2 * Math.PI, dec = (0.5 - (y + 2) / height) * Math.PI;
    const sample = milky.sample([Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec)]);
    for (let dy = 0; dy < 4 && y + dy < height; dy++) for (let dx = 0; dx < 4 && x + dx < width; dx++) {
      const offset = ((y + dy) * width + x + dx) * 4;
      for (let c = 0; c < 3; c++) image.data[offset + c] = 3 + 75 * sample.intensity * sample.color[c];
      image.data[offset + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  const points = getStarLayerData(stars, {coordinates: 'equatorial', radiusScale: 5});
  for (const point of points) {
    const star = point.source;
    context.fillStyle = 'rgba(' + point.color.slice(0, 3).join(',') + ',' + point.color[3] / 255 + ')';
    context.beginPath();context.arc(star.rightAscension / (2 * Math.PI) * width,
      (0.5 - star.declination / Math.PI) * height, point.radiusPixels, 0, 2 * Math.PI);context.fill();
  }
  if (globe) {
    const data = getStarLayerData(stars, {observer, timestamp, coordinates: 'globe', clipHorizon: true});
    globe.setProps({layers: [new deck.SolidPolygonLayer({id: 'earth', data: [[[-180,90],[0,90],[180,90],[180,-90],[0,-90],[-180,-90]]],
      getPolygon: d => d, getFillColor: [24,50,90]}),
      new deck.ScatterplotLayer({id: 'stars', data, getPosition: d => d.position,
        getFillColor: d => d.color, getRadius: d => d.radiusPixels, radiusUnits: 'pixels', billboard: true, pickable: true})]});
  }
  document.getElementById('readout').textContent = 'Julian epoch ' + epochYear.toLocaleString() +
    ' • ' + stars.length.toLocaleString() + ' catalog sources • ' + stars.filter(s => s.motionModel === 'angular').length.toLocaleString() +
    ' angular-only • computed in ' + Math.round(performance.now() - started) + ' ms';
}
let timer;slider.oninput = () => {clearTimeout(timer);timer = setTimeout(render, 80);};
document.getElementById('model').onchange = render;render();
`;
const bundle = await build({stdin: {contents: script, resolveDir: process.cwd(), loader: 'js'}, bundle: true,
  write: false, format: 'iife', platform: 'browser', minify: true});
await writeFile(output, `<!doctype html>
<!-- SPDX-License-Identifier: MIT -->
<!-- Catalog copyright (c) 2016 Bretton Wade; full MIT notice follows. -->
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>math.gl bright stars</title>
<style>body{margin:0;background:#080d17;color:#e6ebf2;font:16px system-ui}header{padding:22px}h1{margin:0 0 12px;font-size:26px}p{max-width:1100px;line-height:1.5}input{width:55%;vertical-align:middle}select{padding:6px;background:#182236;color:white}main{display:grid;grid-template-columns:2fr 1fr;gap:12px;padding:0 20px}.panel{min-width:0}canvas{width:100%;background:#030408}#globe{position:relative;height:500px}h2{font-size:17px;font-weight:500}footer{padding:20px;color:#abb8ce;font-size:13px}@media(max-width:800px){main{grid-template-columns:1fr}}</style>
<header><h1>7,000 stars through time</h1><p>Measured bright-star foreground with a procedural Milky Way band. Explore a million years in either direction. Missing stellar distances use angular motion; this illustrates assumptions rather than predicting the future sky.</p>
<label>Elapsed Julian years <input id="epoch" type="range" min="-1000000" max="1000000" step="10000" value="0"></label>
<select id="model"><option value="rectilinear">Straight-line motion</option><option value="galactic">Illustrative Galactic orbits</option></select><p id="readout"></p></header>
<main><section class="panel"><h2>Equatorial sky · RA 0–24h · north at top</h2><canvas id="sky"></canvas></section><section class="panel"><h2>deck.gl GlobeView · San Francisco horizon</h2><div id="globe"></div></section></main>
<footer>Yale Bright Star Catalog (1991), MIT export by Bretton Wade. Background is procedural. Viewer orientation stays fixed at 2026-10-04 06:00 UTC. Globe panel requires network access for deck.gl.</footer>
<script src="https://unpkg.com/deck.gl@9.1.9/dist.min.js"></script><script>${bundle.outputFiles[0].text}</script>
</html>`);
// Preserve the complete redistributed data license in generated standalone artifacts.
const {readFile} = await import('node:fs/promises');
const license = await readFile(new URL('../LICENSE-BRIGHT-STARS', import.meta.url), 'utf8');
const html = await readFile(output, 'utf8');
await writeFile(output, html + '\n<!--\n' + license + '\n-->\n');
