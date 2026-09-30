// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
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
  'TypeScript in place',
  'TypeScript scalar',
  'Classic wrapper',
  'proj4js direct'
];
export const SAMPLE_COUNT = 7;
export const SCENARIOS = [
  {name: 'Web Mercator', to: 'EPSG:3857', longitude: 12, latitude: 55},
  {name: 'UTM 31N', to: 'EPSG:32631', longitude: 3, latitude: 45},
  {
    name: 'Lambert conformal conic',
    to: '+proj=lcc +lat_1=33 +lat_2=45 +lat_0=39 +lon_0=-96 +datum=WGS84',
    longitude: -96,
    latitude: 39
  }
];
