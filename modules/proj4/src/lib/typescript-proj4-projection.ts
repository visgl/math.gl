// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original compatibility wrapper around the TypeScript engine. Projection kernels
// retain their proj4js/PROJ port notices and licenses in ../experimental/.
import {TypeScriptProjection} from '../experimental/typescript-projection';
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
import type {DatumGrid} from '../experimental/grids/types';
import type {Proj4CRSDefinition} from './proj4-crs';
import type {Proj4ProjectionOptions, Proj4DatumGridOptions} from './proj4-projection';

const aliases: Record<string, Proj4CRSDefinition> = Object.create(null);
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

/** Classic wrapper API, executed by the TypeScript engine with all built-in plugins and readers. */
export class Projection extends TypeScriptProjection {
  /** Register aliases for subsequently constructed TypeScript wrappers. */
  static defineProjectionAliases(definitions: {[name: string]: Proj4CRSDefinition}): void {
    for (const name of Object.keys(definitions)) {
      const definition = definitions[name];
      aliases[name] =
        typeof definition === 'string' ? definition : JSON.parse(JSON.stringify(definition));
    }
  }

  /** Register an owned NTv2 grid snapshot for subsequent TypeScript wrappers. */
  static registerDatumGrid(name: string, grid: ArrayBuffer, options?: Proj4DatumGridOptions): void {
    grids[name] = parseNTv2Grid(grid, options);
  }

  constructor({from = 'WGS84', to = 'WGS84', enforceAxis = false}: Proj4ProjectionOptions) {
    super({
      from,
      to,
      enforceAxis,
      projections: defaultProjections(),
      parsers: [wktCRSParser, projJSONCRSParser],
      aliases,
      datumGrids: grids
    });
  }
}

/** @deprecated Use Projection from @math.gl/proj4 instead. */
export const Proj4Projection = Projection;
/** @deprecated Use Projection from @math.gl/proj4 instead. */
export type Proj4Projection = Projection;
