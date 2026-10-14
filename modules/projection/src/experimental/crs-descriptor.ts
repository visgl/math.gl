// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {CRSMetadata, CRSUnit} from '@math.gl/crs';
import {normalizeCRS} from './crs/normalize';
import {createRenderingScale} from './crs-rendering-scale';
import {validateScalarOutput, writeScalarOutput} from './scalar-output';
import type {ProjectionTransform} from './typescript-projection';
import {getCRSSignature, linearUnits} from '@math.gl/crs/metadata';
import type {TypeScriptCRSInput} from './crs/spatial-reference';
import type {CRSNormalizationOptions, NormalizedCRS} from './crs/types';
import type {
  CRSBounds,
  CRSConversion,
  CRSConverter,
  CRSDescriptor,
  GetCRSOptions,
  ProjectionRenderingProfile
} from './types';
import type {
  CreateProjectionOptions,
  PreparedProjection,
  ProjectionCoordinate,
  ProjectionOutput
} from '../types';

const ANGULAR_UNITS: Readonly<Record<string, number>> = {
  degrees: Math.PI / 180,
  radians: 1,
  gradians: Math.PI / 200
};

const LINEAR_UNITS: Readonly<Record<string, number>> = {
  ...Object.fromEntries(Object.values(linearUnits).map(unit => [unit.name, unit.metersPerUnit]))
};

/** Shared descriptor assembly; algorithms stay in the supplied engine's registrations. */
export async function resolveCRSDescriptor(
  engine: {createProjectionAsync(options: CreateProjectionOptions): Promise<ProjectionTransform>},
  definition: TypeScriptCRSInput,
  normalization: CRSNormalizationOptions & Pick<CreateProjectionOptions, 'enforceAxis'>,
  options: GetCRSOptions = {},
  useDefinitionSignature = false
): Promise<CRSDescriptor> {
  // Lazy imports yield control. Capture caller-owned JSON metadata before loading so
  // descriptor metadata and compiled conversions describe the same definition.
  const input: TypeScriptCRSInput =
    typeof definition === 'string' ? definition : JSON.parse(JSON.stringify(definition));
  const conventions = {
    enforceAxis: normalization.enforceAxis,
    mode: normalization.mode,
    ...options,
    converters: options.converters && [...options.converters]
  };
  const crs = normalizeCRS(input, {...normalization, ...conventions});
  const projection = await engine.createProjectionAsync({
    ...conventions,
    from: 'WGS84',
    to: input
  });
  const axis = crs.storedAxis || (conventions.enforceAxis ? crs.axis : 'enu');
  const horizontalUnit = getUnit(
    crs.kind === 'geographic' ? crs.angularUnit : crs.toMeter,
    crs.kind === 'geographic'
  );
  const heightUnit = getUnit(crs.verticalUnit, false);
  // Component names describe storage, not east/north/up. Axis enforcement can put
  // height first; geocentric XYZ always share the same linear coordinate unit.
  const units = [...axis].map(direction =>
    crs.kind !== 'geocentric' && /[ud]/.test(direction) ? heightUnit : horizontalUnit
  );
  const profile = projection.targetProfile!;
  const center = ((profile.longitudeCenter + crs.primeMeridian) * 180) / Math.PI;
  const bounds = adaptBounds(profile, crs, axis);
  const normalizeWGS84 = createNormalization(
    center,
    (profile.maxLatitude * 180) / Math.PI,
    profile.normalize,
    crs.primeMeridian
  );
  const renderingScale = createRenderingScale(crs, projection, axis, center);
  const sources = [...new Set(['WGS84', ...(conventions.converters || [])])];
  if (sources.some(source => typeof source !== 'string' || !source.trim()))
    throw new Error('Converter source CRS must be a nonempty string');
  const entries = await Promise.all(
    sources.map(async source => {
      if (source === 'WGS84') return [source, createConverter(projection, normalizeWGS84)] as const;
      // Direct CRS-pair conversions retain each source's datum and axis conventions.
      const [pair, geographic] = await Promise.all([
        engine.createProjectionAsync({...conventions, from: source, to: input}),
        engine.createProjectionAsync({...conventions, from: 'WGS84', to: source})
      ]);
      return [
        source,
        createConverter(pair, createSourceNormalization(geographic, normalizeWGS84))
      ] as const;
    })
  );
  const converter = Object.assign(Object.create(null), Object.fromEntries(entries));
  const metadata: CRSMetadata = {
    coordinateFrame: crs.kind,
    projection: crs.projection,
    parameters: crs.parameters,
    ellipsoid: {
      semiMajorAxis: crs.ellipsoid.semiMajorAxis,
      semiMinorAxis: crs.ellipsoid.semiMinorAxis
    },
    axis,
    xUnit: units[0],
    yUnit: units[1],
    zUnit: units[2],
    areaOfUse: crs.areaOfUse,
    lossy: crs.lossy
  };
  return {
    ...metadata,
    // Exact caller identity is sufficient under default execution conventions.
    // Additional source converters do not change the target CRS.
    signature:
      useDefinitionSignature && typeof input === 'string' && !conventions.enforceAxis && !crs.lossy
        ? input
        : getCRSSignature(metadata),
    renderingBounds: bounds,
    renderingScale,
    getRenderingScale: coordinate =>
      typeof renderingScale === 'function' ? renderingScale(coordinate) : renderingScale,
    converter
  };
}

function createConverter(projection: PreparedProjection, normalize: CRSConversion): CRSConverter {
  return {
    from: createConversion(
      projection.project.bind(projection),
      projection.projectTo.bind(projection)
    ),
    to: createConversion(
      projection.unproject.bind(projection),
      projection.unprojectTo.bind(projection)
    ),
    normalize
  };
}

/** Express destination-specific geographic normalization back in the source CRS. */
function createSourceNormalization(
  geographic: PreparedProjection,
  normalizeWGS84: CRSConversion
): CRSConversion {
  function normalize(coordinate: ProjectionCoordinate): number[];
  function normalize<T extends ProjectionOutput>(coordinate: ProjectionCoordinate, output: T): T;
  function normalize(
    coordinate: ProjectionCoordinate,
    output?: ProjectionOutput
  ): ProjectionOutput {
    const wgs84 = geographic.unproject(Array.from(coordinate));
    normalizeWGS84(wgs84, wgs84);
    return output === undefined ? geographic.project(wgs84) : geographic.projectTo(wgs84, output);
  }
  return normalize;
}

/** Keep the engine's output sizing and validation while supporting both storage conventions. */
function createConversion(
  allocate: PreparedProjection['project'],
  write: PreparedProjection['projectTo']
): CRSConversion {
  function convert(coordinate: ProjectionCoordinate): number[];
  function convert<T extends ProjectionOutput>(coordinate: ProjectionCoordinate, output: T): T;
  function convert(coordinate: ProjectionCoordinate, output?: ProjectionOutput): ProjectionOutput {
    return output === undefined
      ? allocate(Array.isArray(coordinate) ? coordinate : Array.from(coordinate))
      : write(coordinate, output);
  }
  return convert;
}

function createNormalization(
  center: number,
  maxLatitude: number,
  normalizeDomain?: ProjectionRenderingProfile['normalize'],
  primeMeridian = 0
): CRSConversion {
  function normalize(coordinate: ProjectionCoordinate): number[];
  function normalize<T extends ProjectionOutput>(coordinate: ProjectionCoordinate, output: T): T;
  function normalize(
    coordinate: ProjectionCoordinate,
    output?: ProjectionOutput
  ): ProjectionOutput {
    const result = output ?? new Array<number>(coordinate.length);
    validateScalarOutput(coordinate, result, coordinate.length);
    const longitude = coordinate[0],
      latitude = coordinate[1],
      altitude = coordinate[2] ?? 0;
    if (
      coordinate.length < 2 ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(altitude)
    )
      throw new Error('Normalization requires finite longitude, latitude and altitude');
    const offset = longitude - center;
    if (!Number.isFinite(offset)) throw new Error('Longitude exceeds normalization range');
    const wrapped = Math.abs(offset) <= 180 ? offset : ((((offset + 180) % 360) + 360) % 360) - 180;
    const point = {
      x: center + wrapped,
      y: Math.max(-maxLatitude, Math.min(maxLatitude, latitude)),
      z: altitude
    };
    if (normalizeDomain) {
      // Projection profiles use their native meridian and radians, while this
      // converter accepts WGS84 degrees relative to Greenwich.
      point.x = (point.x * Math.PI) / 180 - primeMeridian;
      point.y = (point.y * Math.PI) / 180;
      normalizeDomain(point);
      const offset = ((point.x + primeMeridian) * 180) / Math.PI - center;
      point.x =
        center + (Math.abs(offset) <= 180 ? offset : ((((offset + 180) % 360) + 360) % 360) - 180);
      point.y = (point.y * 180) / Math.PI;
    }
    return writeScalarOutput(coordinate, result, point, coordinate.length);
  }
  return normalize;
}

/** Convert projection-owned native envelopes into the CRS's stored units and axis order. */
function adaptBounds(
  profile: ProjectionRenderingProfile,
  crs: NormalizedCRS,
  axis: string
): CRSBounds {
  const horizontalUnit = crs.kind === 'geographic' ? crs.angularUnit : crs.toMeter;
  const units = [
    horizontalUnit,
    horizontalUnit,
    crs.kind === 'geocentric' ? crs.toMeter : crs.verticalUnit
  ];
  const bounds = profile.bounds;
  const limits = [...axis].map(direction => {
    const index = /[ew]/.test(direction) ? 0 : /[ns]/.test(direction) ? 1 : 2;
    const minimum = bounds[0][index] / units[index];
    const maximum = bounds[1][index] / units[index];
    return /[wsd]/.test(direction) ? [-maximum, -minimum] : [minimum, maximum];
  });
  return [
    [limits[0][0], limits[1][0]] as readonly [number, number],
    [limits[0][1], limits[1][1]] as readonly [number, number]
  ];
}

/** Canonical unit labels are metadata; numeric factors remain in the compiled transform. */
function getUnit(factor: number, angular: boolean): CRSUnit {
  const units = angular ? ANGULAR_UNITS : LINEAR_UNITS;
  const name = Object.keys(units).find(candidate => units[candidate] === factor) || 'custom';
  return angular ? {name} : {name, metersPerUnit: factor};
}
