// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Independently queried JPL Horizons astrometric ICRF positions, light-time corrected.
// https://ssd.jpl.nasa.gov/api/horizons.api
// Observer: geodetic latitude 37.8, longitude -122.4, elevation 0 km.
// QUANTITIES=1,20; angular units degrees; distance AU; UT dates.
export const PLANET_REFERENCE = [
  {
    name: 'Mercury',
    date: '2024-01-01T00:00:00Z',
    rightAscension: 261.435804125,
    declination: -20.134257872,
    distanceAU: 0.77754669313953
  },
  {
    name: 'Mercury',
    date: '2024-01-02T00:00:00Z',
    rightAscension: 261.326170183,
    declination: -20.193621665,
    distanceAU: 0.79706014565768
  },
  {
    name: 'Venus',
    date: '2024-01-01T00:00:00Z',
    rightAscension: 240.608510138,
    declination: -18.704295543,
    distanceAU: 1.18191946842439
  },
  {
    name: 'Venus',
    date: '2024-01-02T00:00:00Z',
    rightAscension: 241.8632097,
    declination: -18.966704191,
    distanceAU: 1.18819157116563
  },
  {
    name: 'Mars',
    date: '2024-01-01T00:00:00Z',
    rightAscension: 266.694712103,
    declination: -23.952704888,
    distanceAU: 2.42380711623751
  },
  {
    name: 'Mars',
    date: '2024-01-02T00:00:00Z',
    rightAscension: 267.50602986,
    declination: -23.977357178,
    distanceAU: 2.42075492742796
  },
  {
    name: 'Jupiter',
    date: '2024-01-01T00:00:00Z',
    rightAscension: 33.36182272,
    declination: 12.150862678,
    distanceAU: 4.48147968722723
  },
  {
    name: 'Jupiter',
    date: '2024-01-02T00:00:00Z',
    rightAscension: 33.36476706,
    declination: 12.157306483,
    distanceAU: 4.49610675946268
  },
  {
    name: 'Io',
    date: '2024-01-01T00:00:00Z',
    rightAscension: 33.340029686,
    declination: 12.141300685,
    distanceAU: 4.47931856197634
  },
  {
    name: 'Io',
    date: '2024-01-02T00:00:00Z',
    rightAscension: 33.395366197,
    declination: 12.169409593,
    distanceAU: 4.49733062182719
  },
  {
    name: 'Europa',
    date: '2024-01-01T00:00:00Z',
    rightAscension: 33.31175402,
    declination: 12.134361427,
    distanceAU: 4.48345218436377
  },
  {
    name: 'Europa',
    date: '2024-01-02T00:00:00Z',
    rightAscension: 33.39621492,
    declination: 12.171568481,
    distanceAU: 4.49976416311974
  },
  {
    name: 'Ganymede',
    date: '2024-01-01T00:00:00Z',
    rightAscension: 33.285174824,
    declination: 12.120028612,
    distanceAU: 4.47816414648294
  },
  {
    name: 'Ganymede',
    date: '2024-01-02T00:00:00Z',
    rightAscension: 33.283867999,
    declination: 12.129398268,
    distanceAU: 4.49886914908344
  },
  {
    name: 'Callisto',
    date: '2024-01-01T00:00:00Z',
    rightAscension: 33.490724202,
    declination: 12.192833231,
    distanceAU: 4.47422240269959
  },
  {
    name: 'Callisto',
    date: '2024-01-02T00:00:00Z',
    rightAscension: 33.453172517,
    declination: 12.182353596,
    distanceAU: 4.48557422471857
  }
];
