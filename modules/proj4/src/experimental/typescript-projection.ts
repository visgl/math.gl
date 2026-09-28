// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {parsePROJString} from '@math.gl/crs';
import {DEGREES_TO_RADIANS, numberParameter} from './parameters';
import type {ProjectionImplementation, ProjectionParameters, ProjectionPlugin} from './types';

export type TypeScriptProjectionOptions = {
  /** Built-in alias, user alias or a supported PROJ string. Defaults to WGS84. */
  from?: string;
  to?: string;
  /** Only these projection implementations are available to this instance. */
  projections?: readonly ProjectionPlugin[];
  /** Instance-local aliases; these do not affect Proj4Projection or other instances. */
  aliases?: Readonly<Record<string, string>>;
};

const ALIASES: Readonly<Record<string, string>> = {
  WGS84: '+proj=longlat +datum=WGS84',
  'EPSG:4326': '+proj=longlat +datum=WGS84',
  'EPSG:3857': '+proj=merc +a=6378137 +b=6378137 +units=m'
};
const CORE_PARAMETERS = [
  'proj',
  'datum',
  'ellps',
  'a',
  'b',
  'rf',
  'R',
  'units',
  'to_meter',
  'no_defs',
  'type'
];
const UNITS: Readonly<Record<string, number>> = {m: 1, km: 1000, ft: 0.3048, 'us-ft': 1200 / 3937};
const GEOGRAPHIC_NAMES = ['longlat', 'latlong', 'latlon', 'lonlat'];

type CompiledCRS = {
  geographic: boolean;
  toMeter: number;
  implementation?: ProjectionImplementation;
};

/** Experimental, independent 2D projection engine. Datum transformations are not supported. */
export class TypeScriptProjection {
  private readonly from: CompiledCRS;
  private readonly to: CompiledCRS;

  constructor({
    from = 'WGS84',
    to = 'WGS84',
    projections = [],
    aliases = {}
  }: TypeScriptProjectionOptions = {}) {
    const plugins = new Map<string, ProjectionPlugin>();
    for (const plugin of projections) {
      if (!plugin.name || GEOGRAPHIC_NAMES.includes(plugin.name) || plugins.has(plugin.name)) {
        throw new Error(`Duplicate or reserved projection plugin: ${plugin.name}`);
      }
      plugins.set(plugin.name, plugin);
    }
    this.from = compileCRS(from, plugins, aliases);
    this.to = compileCRS(to, plugins, aliases);
    this.project = this.project.bind(this);
    this.unproject = this.unproject.bind(this);
  }

  /** Transform x/y, returning a new array and preserving any trailing ordinates. */
  project(coordinate: readonly number[]): number[] {
    return transform(coordinate, this.from, this.to);
  }

  /** Transform in the opposite direction. */
  unproject(coordinate: readonly number[]): number[] {
    return transform(coordinate, this.to, this.from);
  }
}

function compileCRS(
  definition: string,
  plugins: ReadonlyMap<string, ProjectionPlugin>,
  aliases: Readonly<Record<string, string>>
): CompiledCRS {
  const visited = new Set<string>();
  while (
    Object.prototype.hasOwnProperty.call(aliases, definition) ||
    Object.prototype.hasOwnProperty.call(ALIASES, definition)
  ) {
    if (visited.has(definition)) throw new Error(`Circular CRS alias: ${definition}`);
    visited.add(definition);
    definition = Object.prototype.hasOwnProperty.call(aliases, definition)
      ? aliases[definition]
      : ALIASES[definition];
  }
  const utm = /^EPSG:(326|327)(\d{2})$/.exec(definition);
  if (utm && Number(utm[2]) >= 1 && Number(utm[2]) <= 60) {
    definition =
      '+proj=utm +datum=WGS84 +zone=' + Number(utm[2]) + (utm[1] === '327' ? ' +south' : '');
  }
  if (definition === 'EPSG:5041' || definition === 'EPSG:5042') {
    definition =
      '+proj=stere +datum=WGS84 +lat_0=' +
      (definition === 'EPSG:5041' ? '90' : '-90') +
      ' +lon_0=0 +k_0=0.994 +x_0=2000000 +y_0=2000000';
  }
  if (typeof definition !== 'string' || !/^\s*\+?proj=/.test(definition)) {
    throw new Error(
      `Unsupported CRS definition: ${definition}. Expected an alias or PROJ string starting with +proj=`
    );
  }
  const parameters: Record<string, string | undefined> = Object.create(null);
  for (const parameter of parsePROJString(definition).parameters) {
    if (Object.prototype.hasOwnProperty.call(parameters, parameter.name)) {
      throw new Error(`Duplicate PROJ parameter: +${parameter.name}`);
    }
    parameters[parameter.name] = parameter.value;
  }
  const name = parameters['proj'];
  const geographic = GEOGRAPHIC_NAMES.includes(name);
  const plugin = plugins.get(name);
  if (!geographic && !plugin) throw new Error(`Projection plugin is not registered: ${name}`);
  const allowed = new Set([...CORE_PARAMETERS, ...(geographic ? [] : plugin.parameters)]);
  for (const key of Object.keys(parameters)) {
    if (!allowed.has(key)) throw new Error(`Unsupported PROJ parameter: +${key}`);
    if (
      key !== 'no_defs' &&
      !plugin?.flags?.includes(key) &&
      (parameters[key] === undefined || parameters[key] === '')
    ) {
      throw new Error(`PROJ parameter requires a value: +${key}`);
    }
  }
  if (parameters['type'] !== undefined && parameters['type'] !== 'crs') {
    throw new Error('Only +type=crs is supported');
  }
  if (parameters['datum'] !== undefined && !['WGS84', 'none'].includes(parameters['datum'])) {
    throw new Error(`Unsupported datum: ${parameters['datum']}. Datum shifts are not implemented`);
  }
  const geometry = getEllipsoid(parameters);
  const units = parameters['units'];
  let toMeter = 1;
  if (geographic) {
    if (
      (units !== undefined && units !== 'degrees') ||
      Object.prototype.hasOwnProperty.call(parameters, 'to_meter')
    ) {
      throw new Error('Geographic coordinates must use degrees');
    }
  } else {
    if (units !== undefined && !Object.prototype.hasOwnProperty.call(UNITS, units))
      throw new Error(`Unsupported units: ${units}`);
    toMeter = numberParameter(parameters, 'to_meter', units === undefined ? 1 : UNITS[units]);
    if (toMeter <= 0) throw new Error('+to_meter must be positive');
  }
  return {
    geographic,
    toMeter,
    implementation: geographic
      ? undefined
      : plugin.create({...geometry, parameters: Object.freeze(parameters)})
  };
}

function getEllipsoid(parameters: ProjectionParameters): {
  semiMajorAxis: number;
  eccentricitySquared: number;
} {
  const ellipsoid = parameters['ellps'];
  if (ellipsoid !== undefined && ellipsoid !== 'WGS84' && ellipsoid !== 'sphere') {
    throw new Error(`Unsupported ellipsoid: ${ellipsoid}`);
  }
  const a = numberParameter(parameters, 'a', ellipsoid === 'sphere' ? 6370997 : 6378137);
  const rf = numberParameter(parameters, 'rf', ellipsoid === 'sphere' ? 0 : 298.257223563);
  const b = numberParameter(parameters, 'b', rf === 0 ? a : a * (1 - 1 / rf));
  const radius = numberParameter(parameters, 'R', 0);
  if (
    a <= 0 ||
    b <= 0 ||
    b > a ||
    rf < 0 ||
    (rf > 0 && rf <= 1) ||
    (Object.prototype.hasOwnProperty.call(parameters, 'R') && radius <= 0)
  ) {
    throw new Error('Invalid ellipsoid dimensions');
  }
  // Non-WGS84 ellipsoids require an explicit opt-out of datum transformations.
  if (
    !radius &&
    a !== b &&
    (a !== 6378137 || Math.abs(b - 6356752.314245179) > 1e-6) &&
    parameters['datum'] !== 'none'
  ) {
    throw new Error('Custom ellipsoids require +datum=none; datum shifts are not implemented');
  }
  return {
    semiMajorAxis: radius || a,
    eccentricitySquared: radius ? 0 : 1 - (b / a) ** 2
  };
}

function transform(coordinate: readonly number[], from: CompiledCRS, to: CompiledCRS): number[] {
  if (coordinate.length < 2 || !Number.isFinite(coordinate[0]) || !Number.isFinite(coordinate[1])) {
    throw new Error('Coordinates must contain finite x and y values');
  }
  const [longitude, latitude] = from.geographic
    ? [coordinate[0] * DEGREES_TO_RADIANS, coordinate[1] * DEGREES_TO_RADIANS]
    : from.implementation.inverse(coordinate[0] * from.toMeter, coordinate[1] * from.toMeter);
  if (
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    Math.abs(latitude) > Math.PI / 2
  ) {
    throw new Error('Coordinate is outside the geographic domain');
  }
  const [x, y] = to.geographic
    ? [longitude / DEGREES_TO_RADIANS, latitude / DEGREES_TO_RADIANS]
    : to.implementation.forward(longitude, latitude).map(value => value / to.toMeter);
  if (!Number.isFinite(x) || !Number.isFinite(y))
    throw new Error('Projection produced non-finite coordinates');
  return [x, y, ...coordinate.slice(2)];
}
