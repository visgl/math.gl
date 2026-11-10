// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const GIBS_WMTS_URL = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best';
export const TILE_MATRIX_SET = 'GoogleMapsCompatible_Level8';
export const DAY_LAYER = 'BlueMarble_ShadedRelief_Bathymetry';
export const NIGHT_LAYER = 'VIIRS_Black_Marble';
export const NIGHT_DATE = '2016-01-01';
export const DAY_TILES = `${GIBS_WMTS_URL}/${DAY_LAYER}/default/${TILE_MATRIX_SET}/{z}/{y}/{x}.jpeg`;
export const NIGHT_TILES = `${GIBS_WMTS_URL}/${NIGHT_LAYER}/default/${NIGHT_DATE}/${TILE_MATRIX_SET}/{z}/{y}/{x}.png`;
export const BLACK_MARBLE_CREDIT_URL =
  'https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps/';
export const GIBS_CREDIT_URL = 'https://nasa-gibs.github.io/gibs-api-docs/';
export const STATE_CREDIT_URL = 'https://github.com/topojson/us-atlas';

// Regional projections deliberately use their intended areas instead of extending
// singular or folded formulae across the entire Earth.
type ProjectionPreset = [
  id: string,
  label: string,
  parameters?: string,
  extent?: [number, number, number, number]
];
export const PROJECTIONS = (
  [
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
  ] as ProjectionPreset[]
).map(([id, label, parameters = '', extent = [-180, -90, 180, 90]]) => ({
  id,
  label,
  parameters,
  extent,
  focus: id === 'albers-usa' ? [-96, 38] : null
}));
