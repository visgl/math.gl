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
import globalLand from '../unfolding-polyhedron/data/land.json' with {type: 'json'};
import {geoOrthographic, geoPath} from 'd3-geo';
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
    <aside><h2>View</h2><button class="view-toggle" type="button">View globe</button>
      <label class="unfold-control">Unfold <input id="unfold" type="range" min="0" max="100" value="100" aria-label="Unfold globe into Albers USA map" /></label>
      <h2>Coordinate inspector</h2><div class="readout" role="status" aria-live="polite">Move over the map to inspect coordinates</div><h2>Layers</h2>
      <label><input id="states" type="checkbox" checked /> State boundaries</label>
      <label><input id="grid" type="checkbox" /> Show graticule</label>
      <label><input id="frames" type="checkbox" /> Show inset frames</label>
      <div class="details"><h2>How it works</h2><p>The library clips each feature at the region seams, fits all eight regions to the viewport, and returns inverse candidates in visible draw order.</p>
      <p>Alaska is shown at 35% linear scale. The geographic masks include nearby ocean and land; they are not political borders.</p></div>
      <div class="credit">Insets: Puerto Rico (PR), U.S. Virgin Islands (VI), Guam (GU), Northern Mariana Islands (MP), American Samoa (AS).<br />Boundaries: <a href="https://www.naturalearthdata.com/about/terms-of-use/">Natural Earth</a> 1:10m, public domain.</div>
    </aside>
  </section>
</main>`;

const svg = app.querySelector('svg');
const readout = app.querySelector('.readout');
const viewToggle = app.querySelector('.view-toggle');
const unfold = app.querySelector('#unfold');
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
let globeLandCache;
let amount = 1;
let frameId = 0;
const radians = Math.PI / 180;
const centerLongitude = -96 * radians;
const centerLatitude = 38 * radians;
function globePoint([longitude, latitude], width, height) {
  const lon = longitude * radians - centerLongitude;
  const lat = latitude * radians;
  const east = Math.cos(lat) * Math.sin(lon);
  const north = Math.cos(centerLatitude) * Math.sin(lat) - Math.sin(centerLatitude) * Math.cos(lat) * Math.cos(lon);
  const front = Math.sin(centerLatitude) * Math.sin(lat) + Math.cos(centerLatitude) * Math.cos(lat) * Math.cos(lon);
  const radius = Math.min(width, height) * 0.41;
  return [width / 2 + east * radius, height / 2 - north * radius, front];
}
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
  if (amount < 1) {
    const radius = Math.min(width, height) * 0.41;
    svg.append(element('circle', {cx: width / 2, cy: height / 2, r: radius,
      class: 'globe-disc', opacity: (1 - amount).toFixed(3)}));
    if (!globeLandCache || globeLandCache.width !== width || globeLandCache.height !== height) {
      const projection = geoOrthographic().rotate([96, -38]).translate([width / 2, height / 2]).scale(radius).clipAngle(90);
      const projectPath = geoPath(projection);
      globeLandCache = {width, height, paths: globalLand.map(coordinates =>
        projectPath({type: 'Polygon', coordinates})).filter(Boolean)};
    }
    const world = element('g', {opacity: (1 - amount).toFixed(3), class: 'world-land'});
    for (const d of globeLandCache.paths) world.append(element('path', {d}));
    svg.append(world);
  }
  for (const region of fitted.regions) {
    const group = element('g', {'data-region': region.id});
    const mixed = (flat, source) => {
      const [x, y] = fitted.project(flat);
      if (amount === 1) return [x, y];
      const globe = globePoint(source, width, height);
      return [globe[0] * (1 - amount) + x * amount,
        globe[1] * (1 - amount) + y * amount];
    };
    const mixedPath = (flatRings, sourceRings, close) => flatRings.map((ring, ringIndex) =>
      ring.map((flat, i) => {
        const [x, y] = mixed(flat, sourceRings[ringIndex][i]);
        return `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`;
      }).join('') + (close ? 'Z' : '')).join('');
    if (region.kind === 'inset' && region.frame) {
      const [left, top, right, bottom] = region.frame;
      const clip = element('clipPath', {id: `inset-clip-${region.id}`});
      clip.append(element('rect', {x: left, y: top, width: right - left, height: bottom - top}));
      definitions.append(clip);
    }
    for (const part of features.filter(part => part.regionId === region.id)) {
      const source = part.sourceCoordinates[0];
      const meanFront = source.reduce((sum, point) => sum + globePoint(point, width, height)[2], 0) / source.length;
      const shape = element('path', {
        d: mixedPath(part.coordinates, part.sourceCoordinates, true),
        class: `state ${options[0].checked ? '' : 'no-borders'}`,
        'data-state': part.state,
        opacity: meanFront >= 0 ? 1 : amount.toFixed(3)
      });
      group.append(shape);
    }
    if (options[1].checked) {
      const grid = element('g', region.kind === 'inset' && region.frame
        ? {'clip-path': `url(#inset-clip-${region.id})`} : {});
      grid.setAttribute('opacity', amount.toFixed(3));
      for (const line of graticule.filter(line => line.regionId === region.id))
        grid.append(element('path', {d: mixedPath([line.coordinates], [line.sourceCoordinates], false), class: 'graticule'}));
      group.append(grid);
    }
    if (region.kind === 'inset') {
      const [left, top, right, bottom] = region.frame || region.bounds;
      const visibility = Math.max(0, (amount - 0.65) / 0.35);
      if (options[2].checked) group.append(element('rect', {x: left, y: top,
        width: right - left, height: bottom - top, class: 'frame', opacity: visibility.toFixed(3)}));
      const text = shortLabels[region.id] || region.label;
      const fontSize = Math.max(7, Math.min(13, (right - left - 8) / (text.length * 0.62)));
      const label = element('text', {x: left + 4, y: top + fontSize + 3,
        'font-size': fontSize.toFixed(1), opacity: visibility.toFixed(3), class: 'inset-label'});
      label.textContent = text;
      group.append(label);
    }
    svg.append(group);
  }
}
function setAmount(value) {
  amount = Math.max(0, Math.min(1, value));
  unfold.value = String(Math.round(amount * 100));
  viewToggle.textContent = amount > 0.5 ? 'View globe' : 'Unfold map';
  draw();
}
function animateTo(target) {
  cancelAnimationFrame(frameId);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setAmount(target);
    return;
  }
  const start = performance.now();
  const from = amount;
  const tick = now => {
    const t = Math.min(1, (now - start) / 1100);
    const eased = t * t * (3 - 2 * t);
    setAmount(from + (target - from) * eased);
    if (t < 1) frameId = requestAnimationFrame(tick);
  };
  frameId = requestAnimationFrame(tick);
}
viewToggle.addEventListener('click', () => animateTo(amount > 0.5 ? 0 : 1));
unfold.addEventListener('input', () => {
  cancelAnimationFrame(frameId);
  setAmount(Number(unfold.value) / 100);
});
svg.addEventListener('pointermove', event => {
  const bounds = svg.getBoundingClientRect();
  const pixel = [(event.clientX - bounds.left) * fitted.width / bounds.width,
    (event.clientY - bounds.top) * fitted.height / bounds.height];
  if (amount > 0.001 && amount < 0.999) {
    readout.textContent = 'Unfolding between globe and map';
    return;
  }
  let hit;
  if (amount < 0.001) {
    const radius = Math.min(fitted.width, fitted.height) * 0.41;
    const east = (pixel[0] - fitted.width / 2) / radius;
    const north = (fitted.height / 2 - pixel[1]) / radius;
    const length2 = east * east + north * north;
    if (length2 <= 1) {
      const front = Math.sqrt(1 - length2);
      const lat = Math.asin(north * Math.cos(centerLatitude) + front * Math.sin(centerLatitude));
      const lon = centerLongitude + Math.atan2(east,
        front * Math.cos(centerLatitude) - north * Math.sin(centerLatitude));
      hit = {regionId: 'globe', position: [lon / radians, lat / radians]};
    }
  } else hit = pickMapLayout(map, fitted, pixel)[0];
  const state = event.target.closest?.('[data-state]')?.getAttribute('data-state');
  const regionLabel = hit && (fitted.regions.find(region => region.id === hit.regionId)?.label || 'Globe');
  readout.textContent = hit
    ? `${state && state !== regionLabel ? `${state} · ` : ''}${regionLabel || hit.regionId} · ${Math.abs(hit.position[1]).toFixed(2)}° ${hit.position[1] < 0 ? 'S' : 'N'}, ${Math.abs(hit.position[0]).toFixed(2)}° ${hit.position[0] < 0 ? 'W' : 'E'}`
    : 'Outside the map';
});
svg.addEventListener('pointerleave', () => readout.textContent = 'Move over the map to inspect coordinates');
options.forEach(option => option.addEventListener('change', draw));
const resize = new ResizeObserver(draw);
resize.observe(svg);
return () => {cancelAnimationFrame(frameId); resize.disconnect();};
}
