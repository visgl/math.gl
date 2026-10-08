// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original full-catalogue factory for the math.gl projection engine. Projection kernels retain their proj4js/PROJ port notices and licenses in ../experimental/.
import {ConfigurableProjectionEngine} from '../experimental/projection-engine';
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
  wktCRSParser,
  projJSONCRSParser
} from '../experimental/index';
import {CORE_PARAMETERS} from '../experimental/crs/normalize';
import type {ProjectionPlugin} from '../experimental/types';

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
  // The full engine supplies the catalogue; the configurable engine still
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
export class FullProjectionEngine extends ConfigurableProjectionEngine implements ProjectionEngine {
  constructor(options: ProjectionEngineOptions = {}) {
    super({
      ...options,
      projections: options.projections ?? defaultProjections(),
      parsers: options.parsers ?? compatibilityParsers,
      datumCatalogs: options.datumCatalogs ?? [datumCatalog]
    });
  }
}

export const projectionEngine = new FullProjectionEngine();
