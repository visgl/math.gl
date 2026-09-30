// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import proj4Metadata from 'proj4/package.json';

export type BenchmarkOptions = {
  points: number;
  precision: 'Float32' | 'Float64';
  dimension: 2 | 3 | 4;
  direction: 'project' | 'unproject';
};
export type BenchmarkMeasurement = {milliseconds: number; samples: number[]};
export type BenchmarkRow = {
  name: string;
  measurements: BenchmarkMeasurement[];
};
export const IMPLEMENTATIONS = [
  'math.gl flat',
  'math.gl scalar',
  `proj4js ${proj4Metadata.version}`
];
export const SAMPLE_COUNT = 7;
export type BenchmarkScenario = {
  name: string;
  from?: string;
  to: string;
  longitude: number;
  latitude: number;
};
export const SCENARIOS: readonly BenchmarkScenario[] = [
  {name: 'Web Mercator', to: 'EPSG:3857', longitude: 12, latitude: 55},
  {name: 'Ellipsoidal Mercator', to: '+proj=merc +datum=WGS84', longitude: 12, latitude: 55},
  {name: 'UTM 31N', to: 'EPSG:32631', longitude: 3, latitude: 45},
  {name: 'UTM 56S', to: 'EPSG:32756', longitude: 151, latitude: -34},
  {
    name: 'Lambert conformal conic',
    to: '+proj=lcc +lat_1=33 +lat_2=45 +lat_0=39 +lon_0=-96 +datum=WGS84',
    longitude: -96,
    latitude: 39
  },
  {
    name: 'Albers equal area',
    to: '+proj=aea +lat_1=29.5 +lat_2=45.5 +lat_0=23 +lon_0=-96 +x_0=0 +y_0=0 +datum=WGS84',
    longitude: -96,
    latitude: 39
  },
  {
    name: 'Lambert azimuthal equal area',
    to: '+proj=laea +lat_0=45 +lon_0=15 +x_0=0 +y_0=0 +datum=WGS84',
    longitude: 12,
    latitude: 48
  },
  {
    name: 'Polar stereographic',
    to: '+proj=stere +lat_0=90 +lat_ts=70 +lon_0=0 +datum=WGS84',
    longitude: 12,
    latitude: 80
  },
  {name: 'Equal Earth', to: '+proj=eqearth +datum=WGS84', longitude: 12, latitude: 45},
  {name: 'Mollweide', to: '+proj=moll +datum=WGS84', longitude: 12, latitude: 45},
  {
    name: 'Three-parameter datum shift',
    from: '+proj=longlat +ellps=clrk66 +towgs84=1,2,3',
    to: '+proj=merc +datum=WGS84',
    longitude: 12,
    latitude: 45
  },
  {
    name: 'Seven-parameter datum shift',
    from: '+proj=longlat +ellps=clrk66 +towgs84=1,2,3,0.1,0.2,0.3,1',
    to: '+proj=merc +datum=WGS84',
    longitude: 12,
    latitude: 45
  }
];
