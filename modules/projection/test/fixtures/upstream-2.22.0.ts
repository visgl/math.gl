// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// SPDX-FileComment: Adapted from proj4js 2.22.0 test/testData.js. See ../../PROJ4-LICENSE.md.

export const upstreamFixtureSource = {
  url: 'https://github.com/proj4js/proj4js/blob/v2.22.0/test/testData.js',
  sha256: 'd39e13b963eece8774cf8fa07290e85a7b3454a2579188865f46c1838fca1136',
  version: '2.22.0'
};

export const upstreamFixtures = [
  {
    id: 'upstream-line-1316',
    sourceLine: 1316,
    to: '+proj=aeqd +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
    ll: [0, 0],
    xy: [0, 0],
    xyToleranceMeters: 0.02,
    llToleranceDegrees: 0.000002
  },
  {
    id: 'upstream-line-1320',
    sourceLine: 1320,
    to: '+proj=aeqd +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
    ll: [2, 0],
    xy: [222638.98158654713, 0],
    xyToleranceMeters: 0.02,
    llToleranceDegrees: 0.000002
  },
  {
    id: 'upstream-line-1324',
    sourceLine: 1324,
    to: '+proj=aeqd +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
    ll: [89, 0],
    xy: [9907434.680601347, 0],
    xyToleranceMeters: 0.02,
    llToleranceDegrees: 0.000002
  },
  {
    id: 'upstream-line-1328',
    sourceLine: 1328,
    to: '+proj=aeqd +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
    ll: [0, -52],
    xy: [0, -5763343.550010418],
    xyToleranceMeters: 0.02,
    llToleranceDegrees: 0.000002
  },
  {
    id: 'upstream-line-1332',
    sourceLine: 1332,
    to: '+proj=aeqd +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
    ll: [145, 0],
    xy: [16141326.16502467, 0],
    xyToleranceMeters: 0.02,
    llToleranceDegrees: 0.000002
  },
  {
    id: 'upstream-line-1336',
    sourceLine: 1336,
    to: '+proj=aeqd +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
    ll: [-145, 0],
    xy: [-16141326.16502467, 0],
    xyToleranceMeters: 0.02,
    llToleranceDegrees: 0.000002
  },
  {
    id: 'upstream-line-1340',
    sourceLine: 1340,
    to: '+proj=aeqd +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
    ll: [91, 0],
    xy: [10130073.6622, 0],
    xyToleranceMeters: 0.02,
    llToleranceDegrees: 0.000002
  },
  {
    id: 'upstream-line-1344',
    sourceLine: 1344,
    to: '+proj=aeqd +lat_0=83.6625 +lon_0=-29.8333 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
    ll: [150.1667, 87.38418697931058],
    xy: [0, 1000000],
    xyToleranceMeters: 0.02,
    llToleranceDegrees: 0.000002
  },
  {
    id: 'upstream-line-1348',
    sourceLine: 1348,
    to: '+proj=aeqd +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +a=6371000 +b=6371000 +units=m +no_defs',
    ll: [91, 0],
    xy: [10118738.32, 0],
    xyToleranceMeters: 0.02,
    llToleranceDegrees: 0.000002
  },
  {
    id: 'upstream-line-1352',
    sourceLine: 1352,
    to: '+proj=aeqd +lat_0=51.5 +lon_0=0 +datum=WGS84 +units=m +no_defs',
    ll: [0, 0],
    xy: [6.98993153946237e-10, -5707712.25167047],
    xyToleranceMeters: 0.02,
    llToleranceDegrees: 0.000002
  },
  {
    id: 'upstream-line-1356',
    sourceLine: 1356,
    to: '+proj=aeqd +lat_0=51.5 +lon_0=0 +datum=WGS84 +units=m +no_defs',
    ll: [2, 48],
    xy: [149325.62485355, -387277.841415147],
    xyToleranceMeters: 0.02,
    llToleranceDegrees: 0.000002
  },
  {
    id: 'upstream-line-1360',
    sourceLine: 1360,
    to: '+proj=aeqd +lat_0=51.5 +lon_0=0 +x_0=100000 +y_0=200000 +datum=WGS84 +units=m +no_defs',
    ll: [2, 48],
    xy: [249325.62485355, -187277.841415147],
    xyToleranceMeters: 0.02,
    llToleranceDegrees: 0.000002
  },
  {
    id: 'upstream-line-1364',
    sourceLine: 1364,
    to: '+proj=aeqd +lat_0=51.5 +datum=WGS84 +units=m +no_defs',
    ll: [2, 48],
    xy: [149325.62485313, -387277.84141508],
    xyToleranceMeters: 0.02,
    llToleranceDegrees: 0.000002
  },
  {
    id: 'upstream-line-1369',
    sourceLine: 1369,
    to: '+proj=merc +a=6378137 +b=6378137 +units=m +no_defs',
    ll: [10, 45],
    xy: [1113194.90793274, 5621521.48619207],
    xyToleranceMeters: 0.02,
    llToleranceDegrees: 0.000002
  },
  {
    id: 'upstream-line-1373',
    sourceLine: 1373,
    to: '+proj=lcc +lat_1=33 +lat_2=45 +lat_0=39 +datum=WGS84 +units=m +no_defs',
    ll: [-100, 40],
    xy: [-6880442.7134478, 4330863.47097279],
    xyToleranceMeters: 0.02,
    llToleranceDegrees: 0.000002
  },
  {
    id: 'upstream-line-1377',
    sourceLine: 1377,
    to: '+proj=laea +lat_0=2 +lon_0=1 +x_0=0 +y_0=0 +a=6371000 +b=6371000  +units=m +no_defs',
    ll: [1, 2],
    xy: [0, 0],
    xyToleranceMeters: 0.02,
    llToleranceDegrees: 0.000002
  },
  {
    id: 'upstream-line-1381',
    sourceLine: 1381,
    to: '+proj=laea +lat_0=1 +lon_0=1 +x_0=0 +y_0=0 +a=6371000 +b=6371000  +units=m +no_defs',
    ll: [1, 1],
    xy: [0, 0],
    xyToleranceMeters: 0.02,
    llToleranceDegrees: 0.000002
  },
  {
    id: 'upstream-line-1385',
    sourceLine: 1385,
    to: '+proj=laea +lat_0=1 +lon_0=1 +x_0=0 +y_0=0 +a=6371000 +b=6371000  +units=m +no_defs',
    ll: [2, 1],
    xy: [111176.58, 16.93],
    xyToleranceMeters: 0.02,
    llToleranceDegrees: 0.000002
  },
  {
    id: 'upstream-line-1389',
    sourceLine: 1389,
    to: '+proj=laea +lat_0=1 +lon_0=1 +x_0=0 +y_0=0 +a=6371000 +b=6371000  +units=m +no_defs',
    ll: [1, 2],
    xy: [0, 111193.52],
    xyToleranceMeters: 0.02,
    llToleranceDegrees: 0.000002
  },
  {
    id: 'upstream-line-1393',
    sourceLine: 1393,
    to: '+proj=laea +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +a=6371000 +b=6371000 +units=m +no_defs',
    ll: [19, 0],
    xy: [2103036.59, 0],
    xyToleranceMeters: 0.02,
    llToleranceDegrees: 0.000002
  },
  {
    id: 'upstream-line-1401',
    sourceLine: 1401,
    to: '+proj=stere +lat_0=-90 +lon_0=0 +x_0=0 +y_0=0 +a=3396000 +b=3396000 +units=m +no_defs',
    ll: [0, -72.5],
    xy: [0, 1045388.79],
    xyToleranceMeters: 0.02,
    llToleranceDegrees: 0.000002
  },
  {
    id: 'upstream-line-1405',
    sourceLine: 1405,
    to: '+proj=stere',
    ll: [0, -72.5],
    xy: [0, -9334375.897187851],
    xyToleranceMeters: 0.02,
    llToleranceDegrees: 0.000002
  },
  {
    id: 'upstream-line-2612',
    sourceLine: 2612,
    to: '+proj=lcc +lat_1=38.43333333333333 +lat_2=37.06666666666667 +lat_0=36.5 +lon_0=-120.5 +x_0=2000000 +y_0=500000 +datum=NAD83 +units=m +no_defs',
    ll: [-122.4194, 37.7749],
    xy: [1830924.1853487208, 643223.5248556901],
    xyToleranceMeters: 0.02,
    llToleranceDegrees: 0.000002
  },
  {
    id: 'upstream-line-2638',
    sourceLine: 2638,
    to: '+proj=merc +ellps=plessis +lon_0=0 +x_0=0 +y_0=0 +units=m +no_defs',
    ll: [10, 50],
    xy: [1112913.211791464, 6413002.836941121],
    xyToleranceMeters: 0.02,
    llToleranceDegrees: 0.000002
  }
];
