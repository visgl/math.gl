// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Helmert equations directly adapted from proj4js 2.22.0 datumUtils.js. See ../../PROJ4-LICENSE.md. Geocentric equations now delegate to the attributed @math.gl/core/spheroid leaf.
import {spheroidToCartesian, cartesianToSpheroid} from '@math.gl/core/spheroid';
import type {Datum, Ellipsoid} from './crs/types';
import type {ProjectionPoint} from './types';
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

export function geodeticToGeocentricInPlace(point: ProjectionPoint, ellipsoid: Ellipsoid): void {
  if (Math.abs(point.y) > Math.PI / 2) throw new Error('Latitude outside geocentric domain');
  if (!spheroidToCartesian(point, ellipsoid))
    throw new Error('Geocentric coordinate must be finite');
}

/** Projection retains its center error and historical near-axis canonicalization. */
export function geocentricToGeodeticInPlace(point: ProjectionPoint, ellipsoid: Ellipsoid): void {
  const x = point.x,
    y = point.y,
    z = point.z;
  const {semiMajorAxis: a, semiMinorAxis: b, eccentricitySquared: es} = ellipsoid;
  if (x === 0 && y === 0 && z === 0)
    throw new Error('Geodetic coordinates are undefined at the Earth center');
  if (
    es !== 0 &&
    Math.abs(x) < 1e-12 * a &&
    Math.abs(y) < 1e-12 * a &&
    Math.hypot(x, y) < 1e-12 * a
  ) {
    if (!Number.isFinite(Math.hypot(x, y, z))) throw new Error('Geocentric radius must be finite');
    point.x = 0;
    point.y = (Math.sign(z) * Math.PI) / 2;
    point.z = Math.abs(z) - b;
    return;
  }
  if (!cartesianToSpheroid(point, ellipsoid)) {
    if (!Number.isFinite(Math.hypot(x, y, z))) throw new Error('Geocentric radius must be finite');
    throw new Error('Geocentric inverse did not converge');
  }
}

/** Convert rotation units and scale once for the lifetime of a compiled datum stage. */
export function createHelmert(values: readonly number[], inverse: boolean): DatumOperation {
  const dx = values[0],
    dy = values[1],
    dz = values[2];
  const rx = (values[3] || 0) * ARC_SECOND,
    ry = (values[4] || 0) * ARC_SECOND,
    rz = (values[5] || 0) * ARC_SECOND;
  const scale = 1 + (values[6] || 0) / 1e6;
  return inverse
    ? point => {
        const x = (point.x - dx) / scale,
          y = (point.y - dy) / scale,
          z = (point.z - dz) / scale;
        point.x = x + rz * y - ry * z;
        point.y = -rz * x + y + rx * z;
        point.z = ry * x - rx * y + z;
      }
    : point => {
        const x = point.x,
          y = point.y,
          z = point.z;
        point.x = scale * (x - rz * y + ry * z) + dx;
        point.y = scale * (rz * x + y - rx * z) + dy;
        point.z = scale * (-ry * x + rx * y + z) + dz;
      };
}
function shifted(datum: Datum): boolean {
  return Boolean(datum.towgs84?.some(value => value !== 0));
}
type DatumOperation = (point: ProjectionPoint) => void;
/** Resolve identity, grid and Helmert stages once, outside coordinate loops. */
export function createDatumTransform(
  source: Datum,
  destination: Datum
): DatumOperation | undefined {
  // datum=none disables the entire chain, including a shifted opposite endpoint.
  if (!source.towgs84 || !destination.towgs84) return undefined;
  if (source.grids || destination.grids) {
    if (
      source.grids &&
      destination.grids &&
      source.ellipsoid.semiMajorAxis === destination.ellipsoid.semiMajorAxis &&
      source.ellipsoid.eccentricitySquared === destination.ellipsoid.eccentricitySquared &&
      source.grids.length === destination.grids.length &&
      source.grids.every(
        (entry, i) =>
          entry.name === destination.grids[i].name &&
          entry.optional === destination.grids[i].optional &&
          entry.grid === destination.grids[i].grid
      )
    )
      return undefined;
    const middle = createDatumTransform(
      source.grids ? WGS84 : source,
      destination.grids ? WGS84 : destination
    );
    return point => {
      if (source.grids) applyDatumGrids(point, source, false);
      middle?.(point);
      if (destination.grids) applyDatumGrids(point, destination, true);
    };
  }
  if (shifted(source) || shifted(destination)) {
    const first = convertDatum(source, WGS84),
      second = convertDatum(WGS84, destination);
    return point => {
      first?.(point);
      second?.(point);
    };
  }
  return convertDatum(source, destination);
}
function convertDatum(from: Datum, to: Datum): DatumOperation | undefined {
  if (!from.towgs84 || !to.towgs84) return undefined;
  const a = from.ellipsoid,
    b = to.ellipsoid;
  let sameParameters = true;
  for (let i = 0; i < 7; i++)
    if ((from.towgs84[i] || 0) !== (to.towgs84[i] || 0)) sameParameters = false;
  if (
    a.semiMajorAxis === b.semiMajorAxis &&
    Math.abs(a.eccentricitySquared - b.eccentricitySquared) <= 5e-11 &&
    sameParameters
  )
    return undefined;
  const sourceShift = shifted(from) ? createHelmert(from.towgs84, false) : undefined,
    targetShift = shifted(to) ? createHelmert(to.towgs84, true) : undefined;
  return point => {
    geodeticToGeocentricInPlace(point, a);
    sourceShift?.(point);
    targetShift?.(point);
    geocentricToGeodeticInPlace(point, b);
  };
}
/** Original per-instance dispatch informed by proj4js grid list semantics. */
export function applyDatumGrids(point: ProjectionPoint, datum: Datum, inverse: boolean): void {
  for (const reference of datum.grids) {
    if (reference.name === 'null') return;
    if (!reference.grid) {
      if (reference.optional) continue;
      throw new Error('Required datum grid is not registered: ' + reference.name);
    }
    let found = false;
    if (reference.grid.shiftInPlace) found = reference.grid.shiftInPlace(point, inverse);
    else {
      const output = reference.grid.shift(point.x, point.y, inverse);
      if (output) {
        point.x = output[0];
        point.y = output[1];
        found = true;
      }
    }
    if (found) {
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || Math.abs(point.y) > Math.PI / 2)
        throw new Error('Datum grid produced a coordinate outside the geographic domain');
      return;
    }
  }
  throw new Error(
    'No datum grid covers coordinate: ' + datum.grids.map(grid => grid.name).join(',')
  );
}
// Scalar adapters retain the internal tuple API for existing callers.
export function geodeticToGeocentric(coordinate: Coordinate3D, ellipsoid: Ellipsoid): Coordinate3D {
  const point = {x: coordinate[0], y: coordinate[1], z: coordinate[2]};
  geodeticToGeocentricInPlace(point, ellipsoid);
  return [point.x, point.y, point.z];
}
export function geocentricToGeodetic(coordinate: Coordinate3D, ellipsoid: Ellipsoid): Coordinate3D {
  const point = {x: coordinate[0], y: coordinate[1], z: coordinate[2]};
  geocentricToGeodeticInPlace(point, ellipsoid);
  return [point.x, point.y, point.z];
}
