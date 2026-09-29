// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Geocentric and Helmert equations directly adapted from proj4js 2.22.0 datumUtils.js.
// Copyright (c) 2014, proj4js authors. See ../../PROJ4-LICENSE.md.
import type {Datum, Ellipsoid} from './crs/types';
export type Coordinate3D = [number, number, number];
const ARC_SECOND = Math.PI / (180 * 3600);
const WGS84: Datum = {
  ellipsoid: {
    semiMajorAxis: 6378137,
    semiMinorAxis: 6356752.314245179,
    eccentricitySquared: 0.0066943799901413165
  },
  towgs84: [0, 0, 0]
};

export function geodeticToGeocentric(
  [lon, lat, height]: Coordinate3D,
  ellipsoid: Ellipsoid
): Coordinate3D {
  const {semiMajorAxis: a, eccentricitySquared: es} = ellipsoid;
  if (Math.abs(lat) > Math.PI / 2) throw new Error('Latitude outside geocentric domain');
  const sin = Math.sin(lat),
    cos = Math.cos(lat);
  const radius = a / Math.sqrt(1 - es * sin * sin);
  return [
    (radius + height) * cos * Math.cos(lon),
    (radius + height) * cos * Math.sin(lon),
    (radius * (1 - es) + height) * sin
  ];
}

/** Hannover iteration, including explicit polar and undefined-center handling. */
export function geocentricToGeodetic([x, y, z]: Coordinate3D, ellipsoid: Ellipsoid): Coordinate3D {
  const {semiMajorAxis: a, semiMinorAxis: b, eccentricitySquared: es} = ellipsoid;
  const p = Math.hypot(x, y),
    rr = Math.hypot(x, y, z);
  if (rr === 0) throw new Error('Geodetic coordinates are undefined at the Earth center');
  if (p < 1e-12 * a) return [0, (Math.sign(z) * Math.PI) / 2, Math.abs(z) - b];
  const ct = z / rr,
    st = p / rr;
  let rx = 1 / Math.sqrt(1 - es * (2 - es) * st * st);
  let cos = st * (1 - es) * rx,
    sin = ct * rx;
  for (let i = 0; i < 30; i++) {
    const rn = a / Math.sqrt(1 - es * sin * sin);
    const height = p * cos + z * sin - rn * (1 - es * sin * sin);
    const rk = (es * rn) / (rn + height);
    rx = 1 / Math.sqrt(1 - rk * (2 - rk) * st * st);
    const nextCos = st * (1 - rk) * rx,
      nextSin = ct * rx;
    if (Math.abs(nextSin * cos - nextCos * sin) <= 1e-12)
      return [Math.atan2(y, x), Math.atan2(nextSin, Math.abs(nextCos)), height];
    cos = nextCos;
    sin = nextSin;
  }
  throw new Error('Geocentric inverse did not converge');
}
function helmert(point: Coordinate3D, values: readonly number[], inverse: boolean): Coordinate3D {
  let [x, y, z] = point;
  const [dx, dy, dz] = values;
  const rx = (values[3] || 0) * ARC_SECOND,
    ry = (values[4] || 0) * ARC_SECOND,
    rz = (values[5] || 0) * ARC_SECOND;
  const scale = 1 + (values[6] || 0) / 1e6;
  if (inverse) {
    x = (x - dx) / scale;
    y = (y - dy) / scale;
    z = (z - dz) / scale;
    return [x + rz * y - ry * z, -rz * x + y + rx * z, ry * x - rx * y + z];
  }
  return [
    scale * (x - rz * y + ry * z) + dx,
    scale * (rz * x + y - rx * z) + dy,
    scale * (-ry * x + rx * y + z) + dz
  ];
}
function shifted(datum: Datum): boolean {
  return Boolean(datum.towgs84?.some(value => value !== 0));
}
export function transformDatum(
  point: Coordinate3D,
  source: Datum,
  destination: Datum
): Coordinate3D {
  if (shifted(source) || shifted(destination)) {
    return convertDatum(convertDatum(point, source, WGS84), WGS84, destination);
  }
  return convertDatum(point, source, destination);
}
function convertDatum(point: Coordinate3D, from: Datum, to: Datum): Coordinate3D {
  if (!from.towgs84 || !to.towgs84) return point;
  const a = from.ellipsoid,
    b = to.ellipsoid;
  if (
    a.semiMajorAxis === b.semiMajorAxis &&
    Math.abs(a.eccentricitySquared - b.eccentricitySquared) <= 5e-11 &&
    Array.from({length: 7}, (_, i) => (from.towgs84[i] || 0) === (to.towgs84[i] || 0)).every(
      Boolean
    )
  )
    return point;
  let cartesian = geodeticToGeocentric(point, a);
  if (shifted(from)) cartesian = helmert(cartesian, from.towgs84, false);
  if (shifted(to)) cartesian = helmert(cartesian, to.towgs84, true);
  return geocentricToGeodetic(cartesian, b);
}
