// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Authored differential cases using proj4js 2.22.0 as the compatibility reference.
export type CatalogueCase = {
  id: string;
  definition: string;
  center: [number, number];
  tolerance?: number;
};
export const catalogueProjectionCases: CatalogueCase[] = [
  ...['cea', 'eck6', 'eqearth', 'equi', 'mill', 'moll', 'robin', 'sinu', 'vandg'].flatMap(name =>
    [false, true].map(sphere => ({
      id: name + '-' + (sphere ? 'sphere' : 'ellipsoid'),
      definition:
        '+proj=' +
        name +
        ' +lon_0=10' +
        (name === 'cea' ? ' +lat_ts=30' : '') +
        (sphere ? ' +R=6371000' : ''),
      center: [30, 40] as [number, number],
      tolerance: name === 'robin' ? 2e-5 : 1e-7
    }))
  ),
  ...['cass', 'poly', 'gstmerc', 'gnom', 'ortho'].flatMap(name =>
    [false, true].map(sphere => ({
      id: name + '-' + (sphere ? 'sphere' : 'ellipsoid'),
      definition: '+proj=' + name + ' +lon_0=10 +lat_0=40' + (sphere ? ' +R=6371000' : ''),
      center: [10, 40] as [number, number],
      tolerance: name === 'cass' ? 1e-6 : 1e-7
    }))
  ),
  {id: 'bonne-ellipsoid', definition: '+proj=bonne +lat_1=45 +lon_0=10', center: [10, 40]},
  {id: 'bonne-sphere', definition: '+proj=bonne +lat_1=45 +lon_0=10 +R=6371000', center: [10, 40]},
  {id: 'krovak', definition: '+proj=krovak +ellps=bessel', center: [15, 50]},
  {id: 'krovak-czech', definition: '+proj=krovak +ellps=bessel +czech', center: [15, 50]},
  ...[1, 2].map(iterations => ({
    id: 'nzmg-' + iterations,
    definition: '+proj=nzmg +ellps=intl +lon_0=173 +lat_0=-41 +iterations=' + iterations,
    center: [173, -41] as [number, number],
    tolerance: 1e-7
  })),
  {
    id: 'omerc-alpha',
    definition:
      '+proj=omerc +lat_0=4 +lonc=115 +alpha=53.31582047222222 +gamma=53.13010236111111 +k=0.99984',
    center: [115, 5]
  },
  {
    id: 'omerc-no-offset',
    definition: '+proj=omerc +lat_0=4 +lonc=115 +alpha=53 +no_off',
    center: [115, 5]
  },
  {
    id: 'omerc-no-rotation',
    definition: '+proj=omerc +lat_0=4 +lonc=115 +alpha=53 +no_rot',
    center: [115, 5]
  },
  {
    id: 'omerc-two-point',
    definition: '+proj=omerc +lat_0=4 +lon_1=110 +lat_1=5 +lon_2=120 +lat_2=10',
    center: [115, 5]
  },
  {
    id: 'somerc',
    definition:
      '+proj=somerc +ellps=bessel +lat_0=46.95240555555556 +lon_0=7.43958333333333 +k_0=1',
    center: [7.44, 46.95]
  },
  ...['x', 'y'].flatMap(sweep =>
    [false, true].map(sphere => ({
      id: 'geos-' + sweep + '-' + sphere,
      definition: '+proj=geos +lon_0=0 +h=35785831 +sweep=' + sweep + (sphere ? ' +R=6371000' : ''),
      center: [20, 20] as [number, number]
    }))
  ),
  ...[0, 20].map(tilt => ({
    id: 'tpers-' + tilt,
    definition: '+proj=tpers +lon_0=10 +lat_0=40 +h=1000000 +azi=45 +tilt=' + tilt,
    center: [10, 40] as [number, number]
  })),
  ...[
    [0, 0],
    [90, 0],
    [-90, 0],
    [180, 0],
    [0, 90],
    [0, -90]
  ].map(([lon, lat], index) => ({
    id: 'qsc-' + index,
    definition: '+proj=qsc +lon_0=' + lon + ' +lat_0=' + lat,
    center: [lon === 180 ? 178 : lon, Math.max(-88, Math.min(88, lat))] as [number, number]
  }))
];
