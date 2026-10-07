// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original compatibility wrapper around the math.gl projection engine. Projection kernels retain their proj4js/PROJ port notices and licenses in ../experimental/.
import {ProjectionTransform} from '../experimental/typescript-projection';
import {CustomProjectionEngine} from '../experimental/projection-engine';
import type {ProjectionEngine, ProjectionEngineOptions} from '../types';
import {datumCatalog} from '../datums';
import {getDatumDefinitions} from '../experimental/crs/datum-catalog';
import type {CRSParser} from '../experimental/crs/types';
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

// The compatibility wrapper historically accepts an unrecognized structured datum
// label as ellipsoid-only metadata. Engine parsers retain the stricter registration rule.
function compatibilityParser(parser: CRSParser): CRSParser {
  return {
    ...parser,
    parse(definition, options) {
      const parsed = parser.parse(definition, options);
      const datum = parsed.parameters['datum'];
      const key = (name: string) => name.toLowerCase().replace(/[\s_-]/g, '');
      if (
        datum &&
        !Object.keys(getDatumDefinitions(options)).some(name => key(name) === key(datum))
      ) {
        const parameters = {...parsed.parameters};
        delete parameters['datum'];
        return {...parsed, parameters};
      }
      return parsed;
    }
  };
}
const compatibilityParsers = [wktCRSParser, projJSONCRSParser].map(compatibilityParser);

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

/** Default engine with all built-in plugins, compatibility readers and named datums. */
export class CRSProjectionEngine extends CustomProjectionEngine implements ProjectionEngine {
  constructor(options: ProjectionEngineOptions = {}) {
    super({
      projections: defaultProjections(),
      parsers: compatibilityParsers,
      datumCatalogs: [datumCatalog],
      ...options
    });
  }
}

export const projectionEngine = new CRSProjectionEngine();

/** Classic wrapper for a single CRS pair. */
export class Projection extends ProjectionTransform {
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
      parsers: compatibilityParsers,
      aliases,
      datumGrids: grids,
      datumCatalogs: [datumCatalog]
    });
  }
}
