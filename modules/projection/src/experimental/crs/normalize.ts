// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {inferCRSRepresentation} from '@math.gl/crs/spatial-reference';
import {parsePROJString} from '@math.gl/crs/proj-string';
import {applySpatialReference, resolveCRSInput} from './spatial-reference';
import type {TypeScriptCRSInput} from './spatial-reference';
import {DEGREES_TO_RADIANS, numberParameter} from '../parameters';
import type {ProjectionParameters} from '../types';
import datums from './datum-table';
import ellipsoids from './ellipsoid-table';
import primeMeridians from './primemeridian-table';
import unitTable from './units-table';
import {TypeScriptCRSError, unsupportedStage} from './types';
import type {CRSNormalizationOptions, Ellipsoid, NormalizedCRS, ParsedCRS} from './types';

const ALIASES: Readonly<Record<string, string>> = {
  WGS84: '+proj=longlat +datum=WGS84',
  'EPSG:4326': '+proj=longlat +datum=WGS84',
  'EPSG:4269': '+proj=longlat +datum=NAD83',
  'EPSG:4978': '+proj=geocent +datum=WGS84',
  'EPSG:4979': '+proj=longlat +datum=WGS84',
  'EPSG:3857': '+proj=merc +a=6378137 +b=6378137 +nadgrids=@null +units=m',
  'EPSG:3785': 'EPSG:3857',
  GOOGLE: 'EPSG:3857',
  'EPSG:900913': 'EPSG:3857',
  'EPSG:102113': 'EPSG:3857'
};
export const CORE_PARAMETERS = [
  'proj',
  'datum',
  'ellps',
  'a',
  'b',
  'rf',
  'f',
  'R',
  'units',
  'to_meter',
  'vunits',
  'vto_meter',
  'no_defs',
  'type',
  'title',
  'towgs84',
  'nadgrids',
  'geoidgrids',
  'axis',
  'pm',
  'over',
  'lon_wrap'
];
export const CORE_FLAGS = ['no_defs', 'over'];
const own = (object: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(object, key);
const keyOf = (value: string): string => value.toLowerCase().replace(/[\s_-]/g, '');
function lookup<T>(table: Record<string, T>, name: string): T | undefined {
  const key = Object.keys(table).find(key => keyOf(key) === keyOf(name));
  return key === undefined ? undefined : table[key];
}

/** PROJ decimal, radians (r), and DMS angles; normalized output is decimal degrees. */
export function parseAngle(text: string): number {
  if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text)) {
    const value = Number(text);
    if (Number.isFinite(value)) return value;
  }
  if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?r$/i.test(text)) {
    const value = Number(text.slice(0, -1)) / DEGREES_TO_RADIANS;
    if (Number.isFinite(value)) return value;
  }
  const dms =
    /^([+-]?)(\d+(?:\.\d*)?)(?:d(?:(\d+(?:\.\d*)?)'(?:(\d+(?:\.\d*)?)")?)?)?([NSEW])?$/i.exec(text);
  if (dms && (/d/i.test(text) || dms[5])) {
    const minutes = Number(dms[3] || 0),
      seconds = Number(dms[4] || 0);
    if (minutes < 60 && seconds < 60) {
      const sign = dms[1] === '-' ? -1 : 1;
      const direction = /[SW]/i.test(dms[5] || '') ? -1 : 1;
      const value = sign * direction * (Number(dms[2]) + minutes / 60 + seconds / 3600);
      if (Number.isFinite(value)) return value;
    }
  }
  throw new Error('Invalid angular parameter: ' + text);
}

export function normalizeCRS(
  input: TypeScriptCRSInput,
  options: CRSNormalizationOptions = {}
): NormalizedCRS {
  const resolved = resolveCRSInput(input, options);
  let definition = resolved.definition;
  const aliases = options.aliases || {};
  const visited = new Set<string>();
  while (typeof definition === 'string' && (own(aliases, definition) || own(ALIASES, definition))) {
    if (visited.has(definition)) throw new Error('Circular CRS alias: ' + definition);
    visited.add(definition);
    definition = own(aliases, definition) ? aliases[definition] : ALIASES[definition];
  }
  if (typeof definition === 'string') {
    const utm = /^EPSG:(326|327)(\d{2})$/.exec(definition);
    if (utm && Number(utm[2]) >= 1 && Number(utm[2]) <= 60) {
      definition =
        '+proj=utm +datum=WGS84 +zone=' + Number(utm[2]) + (utm[1] === '327' ? ' +south' : '');
    }
    if (definition === 'EPSG:5041' || definition === 'EPSG:5042') {
      definition =
        '+proj=stere +datum=WGS84 +lat_0=' +
        (definition === 'EPSG:5041' ? 90 : -90) +
        ' +k_0=0.994 +x_0=2000000 +y_0=2000000';
    }
  }
  let parsed: ParsedCRS;
  if (inferCRSRepresentation(definition) === 'proj-string' && typeof definition === 'string') {
    const parameters: Record<string, string | undefined> = Object.create(null);
    for (const parameter of parsePROJString(definition).parameters) {
      if (own(parameters, parameter.name))
        throw new Error('Duplicate PROJ parameter: +' + parameter.name);
      parameters[parameter.name] = parameter.value;
    }
    parsed = {parameters};
  } else {
    const parser = options.parsers?.find(candidate => candidate.canParse(definition));
    if (!parser) {
      const serialized = ['wkt', 'projjson'].includes(inferCRSRepresentation(definition));
      throw new TypeScriptCRSError(
        serialized ? 'missing-parser' : 'unknown-syntax',
        'Unsupported CRS definition; register a WKT or PROJJSON parser for structured definitions'
      );
    }
    parsed = parser.parse(definition, options);
  }
  const parameters = {...parsed.parameters};
  for (const name of [
    'lon_0',
    'lat_0',
    'lat_1',
    'lat_2',
    'lat_ts',
    'lon_wrap',
    'lon_1',
    'lon_2',
    'lonc',
    'alpha',
    'gamma',
    'tilt',
    'azi',
    'o_alpha',
    'o_lon_c',
    'o_lat_c',
    'o_lon_p',
    'o_lat_p',
    'o_lon_1',
    'o_lat_1',
    'o_lon_2',
    'o_lat_2'
  ]) {
    if (parameters[name] !== undefined) parameters[name] = String(parseAngle(parameters[name]));
  }
  const suppliedName = parameters['proj'];
  const lowerName = suppliedName?.toLowerCase();
  const name =
    lowerName === 'geocentric'
      ? 'geocent'
      : ['longlat', 'latlong', 'latlon', 'lonlat', 'identity', 'geocent'].includes(lowerName)
        ? lowerName
        : suppliedName;
  if (!name) throw new Error('CRS requires +proj');
  const kind = ['longlat', 'latlong', 'latlon', 'lonlat'].includes(name)
    ? 'geographic'
    : name === 'geocent'
      ? 'geocentric'
      : name === 'identity'
        ? 'identity'
        : 'projected';
  const datumName = parameters['datum'];
  const datum = datumName && datumName !== 'none' ? lookup(datums, datumName) : undefined;
  if (datumName && datumName !== 'none' && !datum) unsupportedStage('Unknown datum: ' + datumName);
  const ellipsoid = getEllipsoid(parameters, datum?.ellipse);
  const grids = parameters['nadgrids'] ?? datum?.nadgrids;
  const gridReferences =
    grids === undefined
      ? undefined
      : grids.split(',').map(entry => {
          const optional = entry.startsWith('@');
          const name = optional ? entry.slice(1) : entry;
          if (!name || /\s/.test(name)) throw new Error('Invalid datum grid name');
          return Object.freeze({name, optional});
        });
  const rawShift = parameters['towgs84'] ?? datum?.towgs84;
  let shift: readonly number[] | undefined;
  if (rawShift !== undefined) {
    shift = rawShift.split(',').map(value => numberParameter({value}, 'value', NaN));
    if (
      ![3, 7].includes(shift.length) ||
      shift.some(value => !Number.isFinite(value)) ||
      (shift.length === 7 && shift[6] <= -1e6)
    ) {
      throw new Error('+towgs84 requires three or seven finite values and positive scale');
    }
  }
  if (datumName === 'none') shift = undefined;
  if (gridReferences && datumName !== 'none') shift = [0, 0, 0];
  const datumEllipsoid =
    grids === '@null' || grids === 'null' ? getEllipsoid({ellps: 'WGS84'}) : ellipsoid;
  const axis = parameters['axis'] || 'enu';
  if (axis.length !== 3 || !/[ew]/.test(axis) || !/[ns]/.test(axis) || !/[ud]/.test(axis))
    throw new Error('Invalid axis: ' + axis);
  const angularUnit = parsed.angularUnit ?? DEGREES_TO_RADIANS;
  if (
    kind === 'geographic' &&
    ((parameters['units'] && parameters['units'] !== 'degrees') || own(parameters, 'to_meter'))
  )
    throw new Error('Geographic coordinates must use angular units');
  if (kind !== 'geographic' && parameters['units'] === 'degrees')
    throw new Error('Linear coordinates require linear units');
  const toMeter = unitFactor(parameters, 'units', 'to_meter');
  const verticalUnit = parsed.verticalUnit ?? unitFactor(parameters, 'vunits', 'vto_meter');
  if (!(verticalUnit > 0) || !Number.isFinite(verticalUnit))
    throw new Error('Invalid vertical unit');
  if (!(angularUnit > 0) || !Number.isFinite(angularUnit)) throw new Error('Invalid angular unit');
  const pm = parameters['pm'];
  const primeMeridian =
    pm === undefined ? 0 : (lookup(primeMeridians, pm) ?? parseAngle(pm)) * DEGREES_TO_RADIANS;
  return applySpatialReference(
    Object.freeze({
      kind,
      projection: name,
      parameters: Object.freeze(parameters),
      ellipsoid,
      datum: Object.freeze({
        ellipsoid: datumEllipsoid,
        towgs84: shift && Object.freeze(shift),
        grids:
          datumName === 'none' || grids === '@null' || grids === 'null'
            ? undefined
            : gridReferences && Object.freeze(gridReferences)
      }),
      angularUnit,
      toMeter,
      verticalUnit,
      primeMeridian,
      axis,
      longitudeWrap:
        parameters['lon_wrap'] === undefined
          ? undefined
          : Number(parameters['lon_wrap']) * DEGREES_TO_RADIANS,
      lossy: Boolean(parsed.lossy || resolved.lossy)
    }),
    resolved.spatialReference
  );
}
function unitFactor(parameters: ProjectionParameters, unitKey: string, factorKey: string): number {
  const unit = parameters[unitKey];
  const table: Record<string, {to_meter: number}> = unitTable;
  if (unitKey === 'vunits' && unit === 'degrees') throw new Error('Height requires linear units');
  if (unit && !['m', 'degrees'].includes(unit) && !own(table, unit))
    throw new Error('Unsupported units: ' + unit);
  const factor = numberParameter(
    parameters,
    factorKey,
    unit && table[unit] ? table[unit].to_meter : 1
  );
  if (!(factor > 0)) throw new Error('+' + factorKey + ' must be positive');
  return factor;
}
function getEllipsoid(parameters: ProjectionParameters, datumEllipsoid?: string): Ellipsoid {
  const name = datumEllipsoid || parameters['ellps'] || 'WGS84';
  const definition = lookup(ellipsoids, name);
  if (!definition) throw new Error('Unsupported ellipsoid: ' + name);
  const a = numberParameter(parameters, 'a', definition.a);
  const f = numberParameter(parameters, 'f', NaN);
  const rf = numberParameter(
    parameters,
    'rf',
    Number.isNaN(f) ? definition.rf || 0 : f === 0 ? 0 : 1 / f
  );
  const b = numberParameter(
    parameters,
    'b',
    rf
      ? a * (1 - 1 / rf)
      : own(parameters, 'f') || own(parameters, 'rf') || own(parameters, 'a')
        ? a
        : definition.b || a
  );
  const radius = numberParameter(parameters, 'R', 0);
  if (
    a <= 0 ||
    b <= 0 ||
    b > a ||
    rf < 0 ||
    (rf > 0 && rf <= 1) ||
    (own(parameters, 'R') && radius <= 0) ||
    (!Number.isNaN(f) && (f < 0 || f >= 1))
  )
    throw new Error('Invalid ellipsoid dimensions');
  return Object.freeze({
    semiMajorAxis: radius || a,
    semiMinorAxis: radius || b,
    eccentricitySquared: radius ? 0 : 1 - (b / a) ** 2
  });
}
