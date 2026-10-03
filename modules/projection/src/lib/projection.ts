// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original compatibility wrapper around the math.gl projection engine. Projection kernels retain their proj4js/PROJ port notices and licenses in ../experimental/.
import {ProjectionEngine} from '../experimental/typescript-projection';
import {
  mercator,
  equidistantCylindrical,
  lambertConformalConic,
  albersEqualArea,
  equidistantConic,
  lambertAzimuthalEqualArea,
  stereographic,
  obliqueStereographic,
  azimuthalEquidistant,
  transverseMercator,
  extendedTransverseMercator,
  universalTransverseMercator,
  geocentric,
  bonne,
  cassiniSoldner,
  cylindricalEqualArea,
  eckertVI,
  equalEarth,
  equirectangular,
  geostationary,
  gnomonic,
  gaussSchreiberTransverseMercator,
  krovak,
  millerCylindrical,
  mollweide,
  newZealandMapGrid,
  obliqueMercator,
  orthographic,
  polyconic,
  quadrilateralizedSphericalCube,
  robinson,
  sinusoidal,
  swissObliqueMercator,
  tiltedPerspective,
  vanDerGrinten,
  obliqueTransformation,
  parseNTv2Grid,
  wktCRSParser,
  projJSONCRSParser
} from '../experimental/index';
import {CORE_PARAMETERS} from '../experimental/crs/normalize';
import type {ProjectionPlugin} from '../experimental/types';
import type {DatumGrid, VerticalGridCollection} from '../experimental/grids/types';
import type {ReadonlyCRSDefinition} from '@math.gl/crs';

export type DatumGridOptions = {includeErrorFields?: boolean};

/** Compatibility options with explicit, per-instance vertical grids. */
export type ProjectionOptions = {
  from?: ReadonlyCRSDefinition;
  to?: ReadonlyCRSDefinition;
  enforceAxis?: boolean;
  verticalGrids?: VerticalGridCollection;
};

const aliases: Record<string, ReadonlyCRSDefinition> = Object.create(null);
const grids: Record<string, DatumGrid> = Object.create(null);
let preset: readonly ProjectionPlugin[] | undefined;
function defaultProjections(): readonly ProjectionPlugin[] {
  if (preset) return preset;
  const projections: ProjectionPlugin[] = [
    mercator,
    equidistantCylindrical,
    lambertConformalConic,
    albersEqualArea,
    equidistantConic,
    lambertAzimuthalEqualArea,
    stereographic,
    obliqueStereographic,
    azimuthalEquidistant,
    transverseMercator,
    extendedTransverseMercator,
    universalTransverseMercator,
    geocentric,
    bonne,
    cassiniSoldner,
    cylindricalEqualArea,
    eckertVI,
    equalEarth,
    equirectangular,
    geostationary,
    gnomonic,
    gaussSchreiberTransverseMercator,
    krovak,
    millerCylindrical,
    mollweide,
    newZealandMapGrid,
    obliqueMercator,
    orthographic,
    polyconic,
    quadrilateralizedSphericalCube,
    robinson,
    sinusoidal,
    swissObliqueMercator,
    tiltedPerspective,
    vanDerGrinten
  ];
  const key = (name: string): string => name.toLowerCase().replace(/[\s_-]/g, '');
  const geographic = obliqueTransformation('longlat');
  // The convenience wrapper supplies the catalogue; the configurable engine still
  // requires an explicit child plugin for obliqueTransformation.
  const oblique: ProjectionPlugin = {
    name: geographic.name,
    aliases: geographic.aliases,
    parameters: [...new Set([...geographic.parameters, ...projections.flatMap(p => p.parameters)])],
    flags: [...new Set(projections.flatMap(p => p.flags || []))],
    create(context) {
      const requested = context.parameters['o_proj'];
      if (!requested) throw new Error('Oblique transformation requires +o_proj');
      const child = ['longlat', 'latlong', 'latlon', 'lonlat', 'identity'].includes(key(requested))
        ? 'longlat'
        : projections.find(p =>
            [p.name, ...(p.aliases || [])].some(name => key(name) === key(requested))
          );
      if (!child) throw new Error('Unknown oblique transformation projection: ' + requested);
      const plugin = obliqueTransformation(child);
      const allowed = new Set([...CORE_PARAMETERS, ...plugin.parameters]);
      for (const parameter of Object.keys(context.parameters))
        if (!allowed.has(parameter)) throw new Error('Unsupported PROJ parameter: +' + parameter);
      return plugin.create(context);
    }
  };

  preset = [...projections, oblique];
  return preset;
}

/** Classic wrapper API, executed by the math.gl projection engine with all built-in plugins and readers. */
export class Projection extends ProjectionEngine {
  /** Register aliases for subsequently constructed projections. */
  static defineProjectionAliases(definitions: {[name: string]: ReadonlyCRSDefinition}): void {
    for (const name of Object.keys(definitions)) {
      const definition = definitions[name];
      aliases[name] =
        typeof definition === 'string' ? definition : JSON.parse(JSON.stringify(definition));
    }
  }

  /** Register an owned NTv2 grid snapshot for subsequent projections. */
  static registerDatumGrid(name: string, grid: ArrayBuffer, options?: DatumGridOptions): void {
    grids[name] = parseNTv2Grid(grid, options);
  }

  constructor({
    from = 'WGS84',
    to = 'WGS84',
    enforceAxis = false,
    verticalGrids
  }: ProjectionOptions) {
    super({
      from,
      to,
      enforceAxis,
      verticalGrids,
      projections: defaultProjections(),
      parsers: [wktCRSParser, projJSONCRSParser],
      aliases,
      datumGrids: grids
    });
  }
}
