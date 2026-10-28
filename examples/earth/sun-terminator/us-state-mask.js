// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import topology from './assets/us-states-10m.json' with {type: 'json'};

// Census 2017 cartographic state boundaries, redistributed by us-atlas (ISC).
const arcs = topology.arcs.map(arc => {
  let x = 0,
    y = 0;
  return arc.map(([dx, dy]) => {
    x += dx;
    y += dy;
    return [
      x * topology.transform.scale[0] + topology.transform.translate[0],
      y * topology.transform.scale[1] + topology.transform.translate[1]
    ];
  });
});
const ring = indices => {
  const coordinates = [];
  for (const index of indices) {
    const arc = index < 0 ? arcs[~index].slice().reverse() : arcs[index];
    coordinates.push(...(coordinates.length ? arc.slice(1) : arc));
  }
  if (coordinates.length) {
    const first = coordinates[0],
      last = coordinates.at(-1);
    if (first[0] !== last[0] || first[1] !== last[1]) coordinates.push(first);
    while (coordinates.length < 4) coordinates.push(first);
  }
  return coordinates;
};
export const US_STATES = topology.objects.states.geometries
  .filter(g => Number(g.id) <= 56)
  .map(g => ({
    id: g.id,
    name: g.properties.name,
    polygons: (g.type === 'Polygon' ? [g.arcs] : g.arcs).map(polygon => polygon.map(ring))
  }));

export const STATE_MASK_REGIONS = [
  {id: 'lower48', bounds: [-125.5, 24, -66, 50], row: 0, height: 1536},
  {id: 'alaska', bounds: [-190, 50, -129, 72.5], row: 1536, height: 1536},
  {id: 'hawaii', bounds: [-161, 18, -154, 23], row: 3072, height: 1024}
];
const SIZE = 4096;
let cached = null;

/** Separate geographic regions preserve island detail without a huge global mask. */
export function createStateMask() {
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const context = canvas.getContext('2d', {willReadFrequently: true});
  context.fillStyle = 'white';
  for (const [index, region] of STATE_MASK_REGIONS.entries()) {
    const [west, south, east, north] = region.bounds;
    context.save();
    context.beginPath();
    context.rect(0, region.row, SIZE, region.height);
    context.clip();
    context.beginPath();
    for (const state of US_STATES) {
      if ((state.id === '02' ? 1 : state.id === '15' ? 2 : 0) !== index) continue;
      for (const polygon of state.polygons)
        for (const ring of polygon) {
          ring.forEach(([longitude, latitude], index) => {
            const lon = region.id === 'alaska' && longitude > 0 ? longitude - 360 : longitude;
            const x = ((lon - west) / (east - west)) * SIZE;
            const y = region.row + ((north - latitude) / (north - south)) * region.height;
            if (index) context.lineTo(x, y);
            else context.moveTo(x, y);
          });
          context.closePath();
        }
    }
    context.fill('evenodd');
    context.restore();
  }
  const rgba = context.getImageData(0, 0, SIZE, SIZE).data;
  const data = new Uint8Array(SIZE * SIZE);
  for (let i = 0; i < data.length; i++) data[i] = rgba[i * 4 + 3];
  canvas.width = canvas.height = 1;
  cached = {width: SIZE, height: SIZE, data};
  return cached;
}

export const STATE_MASK_SHADER = `
float stateCoverage(float longitude, float latitude) {
  vec4 bounds;
  vec2 rows;
  if (latitude >= 50.0 && (longitude < -129.0 || longitude > 170.0)) {
    if (longitude > 0.0) longitude -= 360.0;
    bounds = vec4(-190.0, 50.0, -129.0, 72.5);
    rows = vec2(1536.0, 1536.0);
  } else if (longitude < -140.0 && latitude < 26.0) {
    bounds = vec4(-161.0, 18.0, -154.0, 23.0);
    rows = vec2(3072.0, 1024.0);
  } else {
    bounds = vec4(-125.5, 24.0, -66.0, 50.0);
    rows = vec2(0.0, 1536.0);
  }
  vec2 uv = vec2((longitude - bounds.x) / (bounds.z - bounds.x), (bounds.w - latitude) / (bounds.w - bounds.y));
  if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) return 0.0;
  uv.y = (rows.x + uv.y * rows.y) / 4096.0;
  return texture(usaMaskTexture, uv).r;
}
`;
