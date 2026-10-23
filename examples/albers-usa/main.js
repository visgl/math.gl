// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {
  createAlbersUsaMap,
  fitMapLayout,
  getMapLayout,
  pickMapLayout
} from '@math.gl/geospatial/discontinuous';
import states from './assets/us-states.json' with {type: 'json'};
import './style.css';

const map = createAlbersUsaMap({includeTerritories: true});
const layout = getMapLayout(map);
export function mountAlbers(app) {
app.classList.add('albers-usa');
app.innerHTML = `<main class="shell">
  <header><div class="eyebrow">math.gl / projection lab</div><h1>Albers USA</h1>
  <p>Eight independently projected regions. Explore the seams and insets.</p></header>
  <section class="workspace" aria-label="Interactive Albers USA map">
    <div class="map-wrap"><svg role="img" aria-label="U.S. states and territories in an Albers projection with seven insets"></svg></div>
    <aside><h2>Coordinate inspector</h2><div class="readout" role="status" aria-live="polite">Move over the map to inspect coordinates</div><h2>Layers</h2>
      <label><input id="states" type="checkbox" checked /> State boundaries</label>
      <label><input id="grid" type="checkbox" checked /> Graticule</label>
      <label><input id="frames" type="checkbox" checked /> Inset frames</label>
      <div class="details"><h2>How it works</h2><p>The library clips each feature at the region seams, fits all eight regions to the viewport, and returns inverse candidates in visible draw order.</p>
      <p>Alaska is shown at 35% linear scale. The geographic masks include nearby ocean and land; they are not political borders.</p></div>
      <div class="credit">Insets: Puerto Rico (PR), U.S. Virgin Islands (VI), Guam (GU), Northern Mariana Islands (MP), American Samoa (AS).<br />Boundaries: <a href="https://www.naturalearthdata.com/about/terms-of-use/">Natural Earth</a> 1:10m, public domain.</div>
    </aside>
  </section>
</main>`;

const svg = app.querySelector('svg');
const readout = app.querySelector('.readout');
const options = ['states', 'grid', 'frames'].map(id => app.querySelector(`#${id}`));
const namespace = 'http://www.w3.org/2000/svg';
const element = (name, attributes = {}) => {
  const node = document.createElementNS(namespace, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  return node;
};
const ringsOf = geometry => geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
const features = states.flatMap(state => ringsOf(state.geometry).flatMap(rings => {
  try {
    return map.projectPolygon(rings, {maxAngularStep: 1, tolerance: 0.0005})
      .map(part => ({...part, state: state.name, code: state.code}));
  } catch (error) {
    throw new Error(`Cannot project ${state.name}: ${error.message}`);
  }
}));
const meridians = Array.from({length: 13}, (_, i) => -180 + i * 10)
  .flatMap(lon => map.projectLine(Array.from({length: 145}, (_, j) => [lon, 10 + j * 0.5])));
const parallels = Array.from({length: 7}, (_, i) => 20 + i * 10)
  .flatMap(lat => map.projectLine(Array.from({length: 361}, (_, j) => [-180 + j, lat])));
const graticule = [...meridians, ...parallels];
const shortLabels = {
  puertoRico: 'PR', virginIslands: 'VI', guam: 'GU',
  northernMariana: 'MP', americanSamoa: 'AS'
};
let fitted;
const path = (rings, project) => rings.map(ring => ring.map((point, i) => {
  const [x, y] = project(point);
  return `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`;
}).join('') + 'Z').join('');
const linePath = (line, project) => line.map((point, i) => {
  const [x, y] = project(point);
  return `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`;
}).join('');
function draw() {
  const width = Math.max(320, svg.clientWidth);
  const height = Math.max(300, svg.clientHeight);
  fitted = fitMapLayout(layout, {
    width, height,
    padding: {left: width * 0.035, right: width * 0.035, top: 24, bottom: 36}
  });
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.replaceChildren();
  const definitions = element('defs');
  svg.append(definitions);
  for (const region of fitted.regions) {
    const group = element('g', {'data-region': region.id});
    if (region.kind === 'inset' && region.frame) {
      const [left, top, right, bottom] = region.frame;
      const clip = element('clipPath', {id: `inset-clip-${region.id}`});
      clip.append(element('rect', {x: left, y: top, width: right - left, height: bottom - top}));
      definitions.append(clip);
    }
    for (const part of features.filter(part => part.regionId === region.id)) {
      const shape = element('path', {
        d: path(part.coordinates, fitted.project),
        class: `state ${options[0].checked ? '' : 'no-borders'}`,
        'data-state': part.state
      });
      group.append(shape);
    }
    if (options[1].checked) {
      const grid = element('g', region.kind === 'inset' && region.frame
        ? {'clip-path': `url(#inset-clip-${region.id})`} : {});
      for (const line of graticule.filter(line => line.regionId === region.id))
        grid.append(element('path', {d: linePath(line.coordinates, fitted.project), class: 'graticule'}));
      group.append(grid);
    }
    if (region.kind === 'inset' && options[2].checked) {
      const [left, top, right, bottom] = region.frame || region.bounds;
      group.append(element('rect', {x: left, y: top, width: right - left, height: bottom - top, class: 'frame'}));
      const label = element('text', {x: left + 4, y: top + 14, class: 'inset-label'});
      label.textContent = shortLabels[region.id] || region.label;
      group.append(label);
    }
    svg.append(group);
  }
}
svg.addEventListener('pointermove', event => {
  const bounds = svg.getBoundingClientRect();
  const pixel = [(event.clientX - bounds.left) * fitted.width / bounds.width,
    (event.clientY - bounds.top) * fitted.height / bounds.height];
  const hit = pickMapLayout(map, fitted, pixel)[0];
  const state = event.target.closest?.('[data-state]')?.getAttribute('data-state');
  const regionLabel = hit && fitted.regions.find(region => region.id === hit.regionId)?.label;
  readout.textContent = hit
    ? `${state && state !== regionLabel ? `${state} · ` : ''}${regionLabel || hit.regionId} · ${Math.abs(hit.position[1]).toFixed(2)}° ${hit.position[1] < 0 ? 'S' : 'N'}, ${Math.abs(hit.position[0]).toFixed(2)}° ${hit.position[0] < 0 ? 'W' : 'E'}`
    : 'Outside the map';
});
svg.addEventListener('pointerleave', () => readout.textContent = 'Move over the map to inspect coordinates');
options.forEach(option => option.addEventListener('change', draw));
const resize = new ResizeObserver(draw);
resize.observe(svg);
return () => resize.disconnect();
}
