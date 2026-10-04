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
  create({semiMajorAxis, eccentricitySquared}) {
    const ellipsoid = {
      semiMajorAxis,
      eccentricitySquared,
      semiMinorAxis: semiMajorAxis * Math.sqrt(1 - eccentricitySquared)
    };
    return {
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
