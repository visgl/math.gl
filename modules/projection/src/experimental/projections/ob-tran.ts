// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2014 Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf (proj4js)
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Rotation equations directly ported from proj4js 2.22.0 lib/projections/ob_tran.js. See ../../../PROJ4-LICENSE.md. Modified to use an explicitly supplied plugin instead of proj4js's global registry.
import type {ProjectionPlugin, ProjectionParameters} from '../types';
import {createProjection, projectionOperation} from '../mutable-projection';
import {numberParameter, wrapLongitude} from '../parameters';
import {TypeScriptCRSError} from '../crs/types';

const rotationParameters = [
  'o_proj',
  'o_alpha',
  'o_lon_c',
  'o_lat_c',
  'o_lon_p',
  'o_lat_p',
  'o_lon_1',
  'o_lat_1',
  'o_lon_2',
  'o_lat_2'
];
const normalizedName = (name: string): string => name.toLowerCase().replace(/[ _-]/g, '');
const has = (parameters: ProjectionParameters, name: string): boolean =>
  Object.prototype.hasOwnProperty.call(parameters, name);
const radians = (parameters: ProjectionParameters, name: string): number =>
  (numberParameter(parameters, name, 0) * Math.PI) / 180;
function rotation(parameters: ProjectionParameters): {lamp: number; phip: number} {
  const sets = [
    ['o_alpha', 'o_lon_c', 'o_lat_c'],
    ['o_lat_p', 'o_lon_p'],
    ['o_lon_1', 'o_lat_1', 'o_lon_2', 'o_lat_2']
  ];
  const selected = sets.find(set => set.some(name => has(parameters, name)));
  if (!selected) throw new Error('Oblique transformation requires a rotation parameter set');
  for (const name of selected) {
    if (!has(parameters, name)) throw new Error('Oblique transformation requires ' + name);
    if (name.includes('lat') && Math.abs(radians(parameters, name)) > Math.PI / 2)
      throw new Error('Invalid rotation latitude: ' + name);
  }
  if (selected === sets[0]) {
    const alpha = radians(parameters, 'o_alpha'),
      lamc = radians(parameters, 'o_lon_c'),
      phic = radians(parameters, 'o_lat_c');
    if (Math.abs(phic) >= Math.PI / 2 - 1e-10)
      throw new Error('Rotation center must be away from the poles');
    return {
      lamp: lamc + Math.atan2(-Math.cos(alpha), -Math.sin(alpha) * Math.sin(phic)),
      phip: Math.asin(Math.cos(phic) * Math.sin(alpha))
    };
  }
  if (selected === sets[1])
    return {lamp: radians(parameters, 'o_lon_p'), phip: radians(parameters, 'o_lat_p')};
  const lam1 = radians(parameters, 'o_lon_1'),
    phi1 = radians(parameters, 'o_lat_1'),
    lam2 = radians(parameters, 'o_lon_2'),
    phi2 = radians(parameters, 'o_lat_2');
  if (
    Math.abs(phi1) >= Math.PI / 2 - 1e-10 ||
    Math.abs(phi2) >= Math.PI / 2 - 1e-10 ||
    Math.abs(phi1) < 1e-10 ||
    Math.abs(phi1 - phi2) < 1e-10
  )
    throw new Error('Invalid new-equator reference points');
  const lamp = Math.atan2(
    Math.cos(phi1) * Math.sin(phi2) * Math.cos(lam1) -
      Math.sin(phi1) * Math.cos(phi2) * Math.cos(lam2),
    Math.sin(phi1) * Math.cos(phi2) * Math.sin(lam2) -
      Math.cos(phi1) * Math.sin(phi2) * Math.sin(lam1)
  );
  return {lamp, phip: Math.atan(-Math.cos(lamp - lam1) / Math.tan(phi1))};
}
/** Explicit dependency: register obliqueTransformation(mollweide), or use 'longlat' for rotated degrees. */
export function obliqueTransformation(wrapped: ProjectionPlugin | 'longlat'): ProjectionPlugin {
  const geographic = wrapped === 'longlat';
  if (!geographic && ['obtran', 'geocent'].includes(normalizedName(wrapped.name)))
    throw new Error('Cannot wrap a composite or geocentric projection');
  return {
    name: 'ob_tran',
    aliases: ['General Oblique Transformation', 'General_Oblique_Transformation'],
    parameters: [...rotationParameters, 'lon_0', ...(geographic ? [] : wrapped.parameters)],
    flags: geographic ? [] : wrapped.flags,
    create(context) {
      const {parameters} = context;
      const requested = parameters['o_proj'];
      const accepted = geographic
        ? ['longlat', 'latlong', 'lonlat', 'latlon', 'identity']
        : [wrapped.name, ...(wrapped.aliases || [])];
      if (requested && !accepted.map(normalizedName).includes(normalizedName(requested)))
        throw new TypeScriptCRSError(
          'missing-plugin',
          'Oblique transformation dependency does not match +o_proj=' + requested
        );
      const {lamp, phip} = rotation(parameters);
      const cphip = Math.cos(phip),
        sphip = Math.sin(phip),
        oblique = Math.abs(phip) > 1e-10;
      const longitudeOrigin = radians(parameters, 'lon_0');
      const over = has(parameters, 'over');
      const innerParameters: Record<string, string | undefined> = {
        ...parameters,
        proj: geographic ? 'longlat' : requested || wrapped.name,
        lon_0: '0'
      };
      for (const name of rotationParameters) delete innerParameters[name];
      const inner = geographic
        ? createProjection(
            point => {
              point.x *= 180 / Math.PI;
              point.y *= 180 / Math.PI;
            },
            point => {
              point.x *= Math.PI / 180;
              point.y *= Math.PI / 180;
            }
          )
        : wrapped.create({...context, parameters: Object.freeze(innerParameters)});
      const forward = projectionOperation(inner, false),
        inverse = projectionOperation(inner, true);
      const asin = (value: number): number => Math.asin(Math.max(-1, Math.min(1, value)));
      return createProjection(
        point => {
          const longitude = point.x,
            latitude = point.y;
          const lam = over
            ? longitude - longitudeOrigin
            : wrapLongitude(longitude - longitudeOrigin);
          const coslam = Math.cos(lam),
            sinphi = Math.sin(latitude),
            cosphi = Math.cos(latitude);
          const lon = wrapLongitude(
            Math.atan2(
              cosphi * Math.sin(lam),
              oblique ? sphip * cosphi * coslam + cphip * sinphi : sinphi
            ) + lamp
          );
          const lat = asin(oblique ? sphip * sinphi - cphip * cosphi * coslam : -cosphi * coslam);
          point.x = lon;
          point.y = lat;
          forward(point);
        },
        point => {
          inverse(point);
          const innerLongitude = point.x,
            latitude = point.y;
          const lam = innerLongitude - lamp,
            coslam = Math.cos(lam),
            sinphi = Math.sin(latitude),
            cosphi = Math.cos(latitude);
          const lon = Math.atan2(
            cosphi * Math.sin(lam),
            oblique ? sphip * cosphi * coslam - cphip * sinphi : -sinphi
          );
          const lat = asin(oblique ? sphip * sinphi + cphip * cosphi * coslam : cosphi * coslam);
          point.x = wrapLongitude(lon + longitudeOrigin);
          point.y = lat;
        }
      );
    }
  };
}
