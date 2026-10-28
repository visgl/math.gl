// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {projectionEngine} from '@math.gl/geospatial/projection';
import {isCutMap, buildCutMesh} from './cut-maps.js';

// Regional projections deliberately use their intended areas instead of extending
// singular or folded formulae across the entire Earth.
export const PROJECTIONS = [
  ['globe', 'Globe'],
  ['map', 'Web Mercator'],
  ['eqearth', 'Equal Earth'],
  ['robin', 'Robinson'],
  ['moll', 'Mollweide'],
  ['sinu', 'Sinusoidal'],
  ['isinu', 'Interrupted sinusoidal · four lobes'],
  ['imoll', 'Interrupted Mollweide · four lobes'],
  ['h3', 'H3 · unfolded icosahedron'],
  ['albers-usa', 'Albers USA · Alaska & Hawaii insets', '', [-180, 15, 180, 75]],
  ['eck6', 'Eckert VI'],
  ['mill', 'Miller cylindrical'],
  ['eqc', 'Equidistant cylindrical'],
  ['equi', 'Equirectangular'],
  ['cea', 'Cylindrical equal area', '+lat_ts=30'],
  ['merc', 'Mercator', '', [-180, -85, 180, 85]],
  ['vandg', 'Van der Grinten', '', [-180, -89, 180, 89]],
  ['bonne', 'Bonne', '+lat_1=45'],
  ['ortho', 'Orthographic', '+lat_0=0', [-89, -89, 89, 89]],
  ['laea', 'Lambert azimuthal equal area', '+lat_0=90', [-180, -80, 180, 90]],
  ['aeqd', 'Azimuthal equidistant', '+lat_0=90', [-180, -80, 180, 90]],
  ['stere', 'Stereographic · northern hemisphere', '+lat_0=90', [-180, 0, 180, 90]],
  ['sterea', 'Oblique stereographic · Europe', '+lat_0=52 +lon_0=5', [-25, 30, 45, 75]],
  ['gnom', 'Gnomonic · central hemisphere', '', [-60, -60, 60, 60]],
  ['geos', 'Geostationary', '+h=35785831', [-81, -81, 81, 81]],
  ['tpers', 'Tilted perspective', '+h=35785831 +tilt=10', [-75, -75, 75, 75]],
  ['qsc', 'Quadrilateralized spherical cube · front face', '', [-45, -35, 45, 35]],
  ['lcc', 'Lambert conformal conic', '+lat_0=40 +lat_1=30 +lat_2=60', [-160, 0, 160, 85]],
  ['aea', 'Albers equal area', '+lat_0=40 +lat_1=30 +lat_2=60', [-160, -30, 160, 85]],
  ['eqdc', 'Equidistant conic', '+lat_0=40 +lat_1=30 +lat_2=60', [-160, -30, 160, 85]],
  ['tmerc', 'Transverse Mercator', '', [-60, -80, 60, 80]],
  ['etmerc', 'Extended transverse Mercator', '', [-60, -80, 60, 80]],
  ['utm', 'UTM · zone 31 north', '+zone=31', [0, 0, 6, 84]],
  ['cass', 'Cassini–Soldner', '', [-45, -80, 45, 80]],
  ['gstmerc', 'Gauss–Schreiber transverse Mercator', '', [-60, -80, 60, 80]],
  ['omerc', 'Oblique Mercator', '+lat_0=40 +lonc=0 +alpha=45 +gamma=45', [-40, 0, 40, 70]],
  ['poly', 'Polyconic', '', [-60, -80, 60, 80]],
  ['somerc', 'Swiss oblique Mercator', '+lat_0=46.95240556 +lon_0=7.43958333', [5, 45, 11, 49]],
  ['krovak', 'Krovak · central Europe', '+lat_0=49.5 +lon_0=24.83333333', [10, 45, 25, 55]],
  ['nzmg', 'New Zealand Map Grid', '+lat_0=-41 +lon_0=173', [165, -48, 180, -33]],
  ['ob_tran', 'Oblique cylindrical', '+o_proj=eqc +o_lat_p=45 +o_lon_p=0']
].map(([id, label, parameters = '', extent = [-180, -90, 180, 90]]) => ({
  id,
  label,
  parameters,
  extent,
  focus: id === 'albers-usa' ? [-96, 38] : null
}));

const cache = new Map();
export function getProjectionMesh(id) {
  if (cache.has(id)) return cache.get(id);
  if (isCutMap(id)) {
    const mesh = buildCutMesh(id);
    if (cache.size >= 4) cache.delete(cache.keys().next().value);
    cache.set(id, mesh);
    return mesh;
  }
  const preset = PROJECTIONS.find(p => p.id === id);
  const projection = projectionEngine.createProjection({
    from: 'WGS84',
    to: `+proj=${id} +datum=WGS84 +units=m ${preset.parameters}`
  });
  const [west, south, east, north] = preset.extent;
  const columns = 360,
    rows = 180;
  const positions = new Float64Array((columns + 1) * (rows + 1) * 3);
  const texCoords = new Float32Array((columns + 1) * (rows + 1) * 2);
  const valid = [];
  for (let y = 0; y <= rows; y++) {
    const lat = south + ((north - south) * y) / rows;
    for (let x = 0; x <= columns; x++) {
      const lon = west + ((east - west) * x) / columns;
      const i = y * (columns + 1) + x;
      texCoords.set([(lon + 180) / 360, (90 - lat) / 180], i * 2);
      try {
        const p = projection.project([lon, lat]);
        valid[i] = p.slice(0, 2).every(v => Number.isFinite(v) && Math.abs(v) < 1e8);
        if (valid[i]) positions.set([p[0] / 100000, p[1] / 100000, 0], i * 3);
      } catch {
        valid[i] = false;
      }
    }
  }
  const indices = [];
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  const edge = (a, b) =>
    Math.hypot(positions[a * 3] - positions[b * 3], positions[a * 3 + 1] - positions[b * 3 + 1]);
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < columns; x++) {
      const a = y * (columns + 1) + x,
        b = a + 1,
        c = a + columns + 1,
        d = c + 1;
      for (const tri of [
        [a, b, c],
        [b, d, c]
      ]) {
        // Exclude horizon failures and discontinuity-spanning triangles.
        if (!tri.every(i => valid[i]) || tri.some((v, i) => edge(v, tri[(i + 1) % 3]) > 20))
          continue;
        indices.push(...tri);
        for (const i of tri) {
          bounds[0] = Math.min(bounds[0], positions[i * 3]);
          bounds[1] = Math.min(bounds[1], positions[i * 3 + 1]);
          bounds[2] = Math.max(bounds[2], positions[i * 3]);
          bounds[3] = Math.max(bounds[3], positions[i * 3 + 1]);
        }
      }
    }
  if (!indices.length) throw new Error(`No visible surface for ${preset.label}`);
  const mesh = {
    positions,
    texCoords,
    indices: new Uint32Array(indices),
    vertexCount: indices.length,
    bounds
  };
  if (cache.size >= 4) cache.delete(cache.keys().next().value);
  cache.set(id, mesh);
  return mesh;
}
