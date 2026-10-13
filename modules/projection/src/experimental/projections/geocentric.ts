// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {ProjectionPlugin} from '../types';
import {
  geodeticToGeocentric,
  geocentricToGeodetic,
  geodeticToGeocentricInPlace,
  geocentricToGeodeticInPlace
} from '../datum';
export const geocentric: ProjectionPlugin = {
  name: 'geocent',
  aliases: ['Geocentric', 'geocentric', 'Geocent'],
  parameters: [],
  create({semiMajorAxis, semiMinorAxis, eccentricitySquared}) {
    const ellipsoid = {
      semiMajorAxis,
      eccentricitySquared,
      semiMinorAxis: semiMinorAxis ?? semiMajorAxis * Math.sqrt(1 - eccentricitySquared)
    };
    return {
      profile: {
        bounds: [
          [-semiMajorAxis, -semiMajorAxis, -ellipsoid.semiMinorAxis],
          [semiMajorAxis, semiMajorAxis, ellipsoid.semiMinorAxis]
        ],
        longitudeCenter: 0,
        maxLatitude: Math.PI / 2
      },
      forward() {
        throw new Error('Geocentric projection requires the 3D pipeline');
      },
      inverse() {
        throw new Error('Geocentric projection requires the 3D pipeline');
      },
      forwardInPlace: point => geodeticToGeocentricInPlace(point, ellipsoid),
      inverseInPlace: point => geocentricToGeodeticInPlace(point, ellipsoid),
      forward3D: point => geodeticToGeocentric(point, ellipsoid),
      inverse3D: point => geocentricToGeodetic(point, ellipsoid)
    };
  }
};
