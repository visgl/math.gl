// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original convenience API over projection descriptors. Deferred kernels retain
// their proj4js/PROJ port notices and licenses.
import {TypeScriptProjection} from './typescript-projection';
import type {TypeScriptProjectionOptions} from './typescript-projection';
import {createProjectionDescriptor, preloadProjection} from './projection-descriptor';
import type {ProjectionDescriptor} from './projection-descriptor';
import type {ProjectionPlugin} from './types';
import {CORE_PARAMETERS, normalizeCRS} from './crs/normalize';
import {lazyObliqueTransformation} from './lazy-projections/ob_tran';
import {lazyAlbersEqualArea} from './lazy-projections/aea';
import {lazyAzimuthalEquidistant} from './lazy-projections/aeqd';
import {lazyBonne} from './lazy-projections/bonne';
import {lazyCassiniSoldner} from './lazy-projections/cass';
import {lazyCylindricalEqualArea} from './lazy-projections/cea';
import {lazyEckertVI} from './lazy-projections/eck6';
import {lazyEquidistantCylindrical} from './lazy-projections/eqc';
import {lazyEquidistantConic} from './lazy-projections/eqdc';
import {lazyEqualEarth} from './lazy-projections/eqearth';
import {lazyEquirectangular} from './lazy-projections/equi';
import {lazyExtendedTransverseMercator} from './lazy-projections/etmerc';
import {lazyGeocentric} from './lazy-projections/geocent';
import {lazyGeostationary} from './lazy-projections/geos';
import {lazyGnomonic} from './lazy-projections/gnom';
import {lazyGaussSchreiberTransverseMercator} from './lazy-projections/gstmerc';
import {lazyKrovak} from './lazy-projections/krovak';
import {lazyLambertAzimuthalEqualArea} from './lazy-projections/laea';
import {lazyLambertConformalConic} from './lazy-projections/lcc';
import {lazyMercator} from './lazy-projections/merc';
import {lazyMillerCylindrical} from './lazy-projections/mill';
import {lazyMollweide} from './lazy-projections/moll';
import {lazyNewZealandMapGrid} from './lazy-projections/nzmg';
import {lazyObliqueMercator} from './lazy-projections/omerc';
import {lazyOrthographic} from './lazy-projections/ortho';
import {lazyPolyconic} from './lazy-projections/poly';
import {lazyQuadrilateralizedSphericalCube} from './lazy-projections/qsc';
import {lazyRobinson} from './lazy-projections/robin';
import {lazySinusoidal} from './lazy-projections/sinu';
import {lazySwissObliqueMercator} from './lazy-projections/somerc';
import {lazyStereographic} from './lazy-projections/stere';
import {lazyObliqueStereographic} from './lazy-projections/sterea';
import {lazyTransverseMercator} from './lazy-projections/tmerc';
import {lazyTiltedPerspective} from './lazy-projections/tpers';
import {lazyUniversalTransverseMercator} from './lazy-projections/utm';
import {lazyVanDerGrinten} from './lazy-projections/vandg';

export type LazyProjectionOptions = Omit<
  TypeScriptProjectionOptions<ProjectionDescriptor>,
  'projections'
>;
const catalogue: readonly ProjectionDescriptor[] = [
  lazyAlbersEqualArea,
  lazyAzimuthalEquidistant,
  lazyBonne,
  lazyCassiniSoldner,
  lazyCylindricalEqualArea,
  lazyEckertVI,
  lazyEquidistantCylindrical,
  lazyEquidistantConic,
  lazyEqualEarth,
  lazyEquirectangular,
  lazyExtendedTransverseMercator,
  lazyGeocentric,
  lazyGeostationary,
  lazyGnomonic,
  lazyGaussSchreiberTransverseMercator,
  lazyKrovak,
  lazyLambertAzimuthalEqualArea,
  lazyLambertConformalConic,
  lazyMercator,
  lazyMillerCylindrical,
  lazyMollweide,
  lazyNewZealandMapGrid,
  lazyObliqueMercator,
  lazyOrthographic,
  lazyPolyconic,
  lazyQuadrilateralizedSphericalCube,
  lazyRobinson,
  lazySinusoidal,
  lazySwissObliqueMercator,
  lazyStereographic,
  lazyObliqueStereographic,
  lazyTransverseMercator,
  lazyTiltedPerspective,
  lazyUniversalTransverseMercator,
  lazyVanDerGrinten
];
const key = (name: string) => name.toLowerCase().replace(/[\s_-]/g, '');

/** All built-in projection descriptors, with algorithms imported only on use. */
export class LazyProjection extends TypeScriptProjection<ProjectionDescriptor> {
  constructor(options: LazyProjectionOptions = {}) {
    super({...options, projections: configuredProjections(options)});
  }
  /** Resolve this catalogue into an ordinary synchronous engine instance. */
  static override async create(options: LazyProjectionOptions = {}): Promise<TypeScriptProjection> {
    return TypeScriptProjection.create({...options, projections: configuredProjections(options)});
  }
}

function configuredProjections(options: LazyProjectionOptions): ProjectionDescriptor[] {
  const children = new Map<string, ProjectionDescriptor>();
  for (const definition of [options.from ?? 'WGS84', options.to ?? 'WGS84']) {
    const crs = normalizeCRS(definition, options);
    if (key(crs.projection) !== 'obtran') continue;
    const requested = crs.parameters['o_proj'];
    if (!requested) throw new Error('Oblique transformation requires +o_proj');
    const name = key(requested);
    if (children.has(name)) continue;
    const child = ['longlat', 'latlong', 'latlon', 'lonlat', 'identity'].includes(name)
      ? 'longlat'
      : catalogue.find(p => [p.name, ...(p.aliases || [])].some(alias => key(alias) === name));
    if (!child) throw new Error('Unknown oblique transformation projection: ' + requested);
    children.set(name, lazyObliqueTransformation(child));
  }
  const projections = [...catalogue];
  if (children.size) {
    projections.push(
      createProjectionDescriptor({name: 'ob_tran'}, async () => {
        const plugins = new Map<string, ProjectionPlugin>();
        await Promise.all(
          [...children].map(async ([name, descriptor]) => {
            plugins.set(name, await preloadProjection(descriptor));
          })
        );
        return {
          name: 'ob_tran',
          parameters: [...new Set([...plugins.values()].flatMap(p => p.parameters))],
          flags: [...new Set([...plugins.values()].flatMap(p => p.flags || []))],
          create(context) {
            const plugin = plugins.get(key(context.parameters['o_proj'] || ''));
            if (!plugin) throw new Error('Unregistered oblique transformation child');
            const allowed = new Set([...CORE_PARAMETERS, ...plugin.parameters]);
            for (const parameter of Object.keys(context.parameters)) {
              if (!allowed.has(parameter))
                throw new Error('Unsupported PROJ parameter: +' + parameter);
            }
            return plugin.create(context);
          }
        };
      })
    );
  }
  return projections;
}
