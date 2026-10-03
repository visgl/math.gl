// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Authored cases compared with the pinned proj4js 2.22.0 reference. */
export type ProjectionCase = {
  id: string;
  definition: string;
  center: [number, number];
  points?: number[][];
  roundTripTolerance?: number;
};

export const commonProjectionCases: ProjectionCase[] = [
  {
    id: 'tmerc-ellipsoid',
    definition: '+proj=tmerc +lon_0=9 +lat_0=10 +k_0=0.9996 +x_0=500000 +y_0=1234',
    center: [9, 45]
  },
  {
    id: 'etmerc-ellipsoid',
    definition: '+proj=etmerc +lon_0=-69 +lat_0=-10 +k=0.99 +x_0=100 +y_0=200',
    center: [-69, -35]
  },
  {
    id: 'tmerc-approx-ellipsoid',
    definition: '+proj=tmerc +approx +lon_0=9 +k_0=0.9996',
    center: [9, 45]
  },
  {
    id: 'tmerc-approx-sphere',
    definition: '+proj=tmerc +approx +R=6371000 +lon_0=9 +x_0=123 +y_0=456',
    center: [9, -35]
  },
  {
    id: 'etmerc-approx-sphere',
    definition: '+proj=etmerc +approx +R=6371000 +lon_0=9',
    center: [9, 45]
  },
  {id: 'utm-north', definition: '+proj=utm +zone=31 +datum=WGS84', center: [3, 45]},
  {id: 'utm-south', definition: '+proj=utm +zone=56 +south +datum=WGS84', center: [153, -33]},
  {id: 'utm-sphere', definition: '+proj=utm +zone=31 +approx +R=6371000', center: [3, 45]},
  {
    id: 'lcc-north',
    definition: '+proj=lcc +lat_1=33 +lat_2=45 +lat_0=39 +lon_0=-96 +x_0=1000 +y_0=2000 +k_0=0.99',
    center: [-96, 39]
  },
  {
    id: 'lcc-south',
    definition: '+proj=lcc +lat_1=-18 +lat_2=-36 +lat_0=-25 +lon_0=135',
    center: [135, -25]
  },
  {id: 'lcc-tangent', definition: '+proj=lcc +lat_1=45 +lat_0=45', center: [0, 45]},
  {
    id: 'lcc-sphere',
    definition: '+proj=lcc +lat_1=33 +lat_2=45 +lat_0=39 +R=6371000',
    center: [0, 39]
  },
  {
    id: 'lcc-polar-origin',
    definition: '+proj=lcc +lat_1=-60 +lat_2=-80 +lat_0=-90',
    center: [0, -80]
  },
  {
    id: 'aea-north',
    definition: '+proj=aea +lat_1=29.5 +lat_2=45.5 +lat_0=23 +lon_0=-96 +x_0=100 +y_0=-100',
    center: [-96, 35]
  },
  {
    id: 'aea-south',
    definition: '+proj=aea +lat_1=-18 +lat_2=-36 +lat_0=-25 +lon_0=135',
    center: [135, -25]
  },
  {id: 'aea-sphere', definition: '+proj=aea +lat_1=30 +lat_2=60 +R=6371000', center: [0, 40]},
  {id: 'aea-tangent', definition: '+proj=aea +lat_1=40 +lat_2=40 +lat_0=40', center: [0, 40]},
  {
    id: 'eqdc-north',
    definition: '+proj=eqdc +lat_1=20 +lat_2=60 +lat_0=40 +x_0=1500 +y_0=-200',
    center: [0, 40]
  },
  {id: 'eqdc-south', definition: '+proj=eqdc +lat_1=-20 +lat_2=-60 +lat_0=-40', center: [0, -40]},
  {
    id: 'eqdc-sphere',
    definition: '+proj=eqdc +lat_1=20 +lat_2=60 +lat_0=40 +R=6371000',
    center: [0, 40]
  },
  {id: 'eqdc-tangent', definition: '+proj=eqdc +lat_1=40 +lat_0=40', center: [0, 40]},
  ...['laea', 'stere', 'aeqd'].flatMap(name =>
    [0, 45, -45, 90, -90].flatMap(latitude =>
      [false, true].map(sphere => ({
        id: name + '-' + latitude + '-' + (sphere ? 'sphere' : 'ellipsoid'),
        definition:
          '+proj=' +
          name +
          ' +lat_0=' +
          latitude +
          ' +lon_0=15 +x_0=100 +y_0=' +
          (name === 'stere' && latitude === 0 && !sphere ? '0' : '200') +
          (sphere ? ' +R=6371000' : ''),
        center: [15, Math.max(-80, Math.min(80, latitude))] as [number, number]
      }))
    )
  ),
  {
    id: 'stere-true-scale-north',
    definition: '+proj=stere +lat_0=90 +lat_ts=70 +k_0=0.8',
    center: [0, 80]
  },
  {
    id: 'stere-true-scale-south',
    definition: '+proj=stere +lat_0=-90 +lat_ts=-71',
    center: [0, -80]
  },
  {
    id: 'sterea-ellipsoid',
    definition: '+proj=sterea +lat_0=52 +lon_0=5 +k_0=0.9999 +x_0=155000 +y_0=463000',
    center: [5, 52]
  },
  {
    id: 'sterea-sphere',
    definition: '+proj=sterea +lat_0=-30 +lon_0=150 +R=6371000 +k=0.9',
    center: [150, -30]
  }
];
