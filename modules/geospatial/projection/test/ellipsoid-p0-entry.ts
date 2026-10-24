// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original independent and full GeographicLib C++ qualification; no upstream implementation imported.
import {config} from '@math.gl/core';
import {cartesianToSpheroid, spheroidToCartesian} from '@math.gl/core/spheroid';
import {
  createLocalFrameBasis,
  eastNorthUpBasis,
  fixedToLocal,
  localToFixed
} from '@math.gl/core/local-frame';
import {Ellipsoid, EllipsoidGeodesic} from '@math.gl/geospatial';
import {ProjectionTransform} from '@math.gl/geospatial/projection/core';
import {gnomonic} from '@math.gl/geospatial/projection/projections/gnom';
import reference from './fixtures/ellipsoid-p0-reference.json';

export const provenance = reference.provenance;
export const counts = {surfaces: reference.surfaces.length, cpp: reference.cpp.length};
const degrees = Math.PI / 180;
const angularBudget = 1e-9 * degrees;
const error = (a: ArrayLike<number>, b: ArrayLike<number>) =>
  Math.hypot(...Array.from(b, (v, i) => a[i] - v));
const normal = (lon: number, lat: number) => [
  Math.cos(lat * degrees) * Math.cos(lon * degrees),
  Math.cos(lat * degrees) * Math.sin(lon * degrees),
  Math.sin(lat * degrees)
];
const angle = (a: number, b: number) =>
  Math.atan2(Math.sin((a - b) * degrees), Math.cos((a - b) * degrees));
const shapes = new Map<string, Ellipsoid>();
function ellipsoid(radii: number[]) {
  const key = radii.join('/');
  if (!shapes.has(key)) shapes.set(key, new Ellipsoid(...(radii as [number, number, number])));
  return shapes.get(key)!;
}
export function surfaceRow(index: number) {
  const row = reference.surfaces[index];
  const shape = ellipsoid(row.radii),
    radius = Math.max(...row.radii);
  const source = [...row.xyz],
    out = [7, 8, 9, 42],
    aliased = [...source, 42];
  const success = Boolean(shape.scaleToGeodeticSurface(source, out));
  const aliasSuccess = Boolean(shape.scaleToGeodeticSurface(aliased, aliased));
  const inverse = [7, 8, 9];
  const inverseSuccess = Boolean(shape.cartesianToCartographic(source, inverse));
  const foot = success ? error(out.slice(0, 3), row.reference.footpoint) / radius : Infinity;
  const normalError = inverseSuccess
    ? error(normal(inverse[0], inverse[1]), row.reference.normal)
    : Infinity;
  const height = inverseSuccess
    ? Math.abs(inverse[2] - row.reference.height) / (2e-12 * radius)
    : Infinity;
  const surface = success
    ? Math.abs(Math.hypot(...row.radii.map((r, i) => out[i] / r)) - 1)
    : Infinity;
  const ownership =
    source.every((v, i) => v === row.xyz[i]) &&
    out[3] === 42 &&
    aliased[3] === 42 &&
    aliasSuccess &&
    out.slice(0, 3).every((v, i) => v === aliased[i]);
  return {
    id: 'surface/' + index,
    family: 'nearest/inverse',
    budgetUsage: Math.max(foot / 2e-12, normalError / angularBudget, height, surface / 2e-12),
    ownership,
    footpointOverRadius: foot,
    normalRadians: normalError,
    heightBudgetUsage: height
  };
}
const engines = new Map<string, EllipsoidGeodesic>();
export function cppRow(index: number) {
  const row = reference.cpp[index],
    [a, b] = row.radii,
    p = row.input,
    e = row.expected;
  if (row.mode === 'Q') {
    const actual = ellipsoid(row.radii).cartographicToCartesian(p);
    const radius = Math.max(...row.radii);
    return {
      id: 'cpp/' + index,
      family: 'C++ triaxial forward',
      budgetUsage: actual ? error(actual, row.mathematicalXYZ!) / (5e-14 * radius) : Infinity,
      ownership: true,
      comparatorFailure: e === null,
      comparatorErrorOverRadius: e ? error(e, row.mathematicalXYZ!) / radius : null
    };
  }
  if (row.mode === 'T') {
    const source = reference.surfaces[(row as {surfaceIndex: number}).surfaceIndex];
    const actual = ellipsoid(source.radii).scaleToGeodeticSurface(source.xyz);
    // Decimal, not a failed or ill-conditioned binary64 C++ solve, remains the
    // accuracy gate. Retain the C++ discrepancy as independently inspectable evidence.
    return {
      id: 'cpp/' + index,
      family: 'C++ triaxial',
      budgetUsage: actual
        ? error(actual, source.reference.footpoint) / Math.max(...source.radii) / 2e-12
        : Infinity,
      ownership: true,
      comparatorFailure: e === null,
      comparatorFootpointOverRadius: e
        ? error(e.slice(0, 3), source.reference.footpoint) / Math.max(...source.radii)
        : null
    };
  }
  if (!e) return {id: 'cpp/' + index, family: row.mode, budgetUsage: Infinity, ownership: true};
  if (row.backend === 'S' || row.backend === 'E') {
    const key = [a, b].join('/');
    if (!engines.has(key))
      engines.set(key, new EllipsoidGeodesic({semiMajorAxis: a, semiMinorAxis: b}));
    const solver = engines.get(key)!;
    const options = {unrollLongitude: row.mode === 'U' || row.mode === 'V'};
    const results =
      row.mode === 'I'
        ? [solver.inverse(p[0], p[1], p[2], p[3])]
        : [
            row.mode === 'A' || row.mode === 'V'
              ? solver.arcDirect(p[0], p[1], p[2], p[3], options)
              : solver.direct(p[0], p[1], p[2], p[3], options),
            row.mode === 'A' || row.mode === 'V'
              ? solver.line(p[0], p[1], p[2], options).arcPosition(p[3])
              : solver.line(p[0], p[1], p[2], options).position(p[3])
          ];
    let usage = 0;
    for (const v of results)
      usage = Math.max(
        usage,
        Math.abs(v.lat2 - e[0]) / 2e-11,
        Math.abs(
          (options.unrollLongitude ? (v.lon2 - e[1]) * degrees : angle(v.lon2, e[1])) *
            Math.cos(e[0] * degrees)
        ) / 5e-14,
        Math.abs(angle(v.azi1, e[2]) * e[5]) / (5e-14 * a),
        Math.abs(angle(v.azi2, e[3]) * e[5]) / (5e-14 * a),
        Math.abs(v.s12 - e[4]) / (5e-14 * a),
        Math.abs(v.m12 - e[5]) / (5e-14 * a),
        Math.abs(v.M12 - e[6]) / 5e-14,
        Math.abs(v.M21 - e[7]) / 5e-14,
        Math.abs(v.a12 - e[8]) / 2e-11
      );
    const diagnostic =
      row.backend === 'E' && (row as {profile?: string}).profile === 'many-circuits';
    return {
      id: 'cpp/' + index,
      family: diagnostic
        ? 'beyond four circuits: Exact comparison'
        : row.backend === 'E'
          ? 'C++ Exact geodesics'
          : 'C++ series geodesics',
      budgetUsage: usage,
      qualified: !diagnostic,
      diagnosticBudgetUsage: diagnostic ? usage : undefined,
      ownership: true
    };
  }
  const shape = {semiMajorAxis: a, semiMinorAxis: b, eccentricitySquared: 1 - (b / a) ** 2};
  if (row.mode === 'F') {
    const point = {x: p[0] * degrees, y: p[1] * degrees, z: p[2]},
      out = {x: 7, y: 8, z: 9};
    const ok = spheroidToCartesian(point, shape, out);
    const geo = ellipsoid([a, a, b]).cartographicToCartesian(p);
    return {
      id: 'cpp/' + index,
      family: 'C++ ECEF forward',
      budgetUsage:
        ok && geo
          ? Math.max(
              error([out.x, out.y, out.z], row.mathematicalRadiansXYZ!),
              error(geo, row.mathematicalXYZ!)
            ) /
            (5e-14 * a)
          : Infinity,
      comparatorErrorOverRadius: error(e, row.mathematicalXYZ!) / a,
      ownership: point.x === p[0] * degrees && point.y === p[1] * degrees && point.z === p[2]
    };
  }
  if (row.mode === 'R') {
    const point = {x: p[0], y: p[1], z: p[2]},
      out = {x: 7, y: 8, z: 9};
    const ok = cartesianToSpheroid(point, shape, out),
      geo = ellipsoid([a, a, b]).cartesianToCartographic(p);
    const usages =
      ok && geo
        ? [
            error(normal(out.x / degrees, out.y / degrees), row.mathematicalInverse!.normal) /
              angularBudget,
            error(normal(geo[0], geo[1]), row.mathematicalInverse!.normal) / angularBudget,
            Math.abs(out.z - row.mathematicalInverse!.height) / (2e-12 * a),
            Math.abs(geo[2] - row.mathematicalInverse!.height) / (2e-12 * a)
          ]
        : [Infinity];
    return {
      id: 'cpp/' + index,
      family: 'C++ ECEF reverse',
      budgetUsage: Math.max(...usages),
      comparatorNormalError: error(normal(e[0], e[1]), row.mathematicalInverse!.normal),
      ownership: point.x === p[0] && point.y === p[1] && point.z === p[2]
    };
  }
  if (row.mode === 'L') {
    const basis = createLocalFrameBasis();
    eastNorthUpBasis(p[0] * degrees, p[1] * degrees, basis);
    const delta = {x: e[6] - e[3], y: e[7] - e[4], z: e[8] - e[5]},
      local = {x: 0, y: 0, z: 0};
    const ok = fixedToLocal(delta, basis, local),
      fixed = {x: 0, y: 0, z: 0};
    const reverse = localToFixed({x: e[0], y: e[1], z: e[2]}, basis, fixed);
    return {
      id: 'cpp/' + index,
      family: 'C++ LocalCartesian',
      budgetUsage:
        ok && reverse
          ? Math.max(
              error([local.x, local.y, local.z], e.slice(0, 3)),
              error([fixed.x, fixed.y, fixed.z], [delta.x, delta.y, delta.z])
            ) /
            (5e-14 * a)
          : Infinity,
      ownership: true
    };
  }
  if (b > a) {
    let rejected = false;
    try {
      new ProjectionTransform({
        from: `+proj=longlat +a=${a} +b=${b}`,
        to: `+proj=gnom +a=${a} +b=${b}`,
        projections: [gnomonic]
      });
    } catch {
      rejected = true;
    }
    return {
      id: 'cpp/' + index,
      family: 'intentional prolate CRS rejection',
      budgetUsage: rejected ? 0 : Infinity,
      ownership: true
    };
  }
  const projection = new ProjectionTransform({
    from: `+proj=longlat +a=${a} +b=${b}`,
    to: `+proj=gnom +a=${a} +b=${b} +lon_0=${p[0]} +lat_0=${p[1]}`,
    projections: [gnomonic]
  });
  const out = [7, 8];
  try {
    if (row.mode === 'G') {
      projection.projectTo([p[2], p[3]], out);
      return {
        id: 'cpp/' + index,
        family: 'C++ gnomonic forward',
        budgetUsage: error(out, e.slice(0, 2)) / ((1e-5 * a) / 6378137),
        ownership: true
      };
    }
    projection.unprojectTo([p[2], p[3]], out);
    return {
      id: 'cpp/' + index,
      family: 'C++ gnomonic inverse',
      budgetUsage: Math.max(Math.abs(out[0] - e[0]), Math.abs(out[1] - e[1])) / 1e-8,
      ownership: true
    };
  } catch {
    return {id: 'cpp/' + index, family: 'C++ gnomonic', budgetUsage: Infinity, ownership: true};
  }
}
export function qualifyP0() {
  const previous = config._cartographicRadians;
  config._cartographicRadians = false;
  try {
    return [
      ...reference.surfaces.map((_, i) => surfaceRow(i)),
      ...reference.cpp.map((_, i) => cppRow(i))
    ];
  } finally {
    config._cartographicRadians = previous;
  }
}
