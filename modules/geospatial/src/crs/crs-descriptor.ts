// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getCRSSignature} from './crs-metadata';
import type {CRSMetadata, CRSUnit} from './crs-metadata';
import type {
  CRSBounds,
  CRSConversion,
  CRSConverter,
  CRSDescriptor,
  CRSRenderingScale,
  CRSRenderingScaleCallback
} from './crs-descriptor-types';
import type {CRSCoordinate, CRSOutput} from './crs-descriptor-types';

/** Backend-owned operations and rendering policy for an already prepared target CRS. */
export type CRSDescriptorOptions = Readonly<{
  metadata: CRSMetadata;
  /** Optional opaque caller identity. Defaults to getCRSSignature(metadata). */
  signature?: string;
  renderingBounds: CRSBounds;
  renderingScale: CRSRenderingScale | CRSRenderingScaleCallback;
  /** WGS84 means longitude/latitude degrees and ellipsoidal height metres. */
  converter: Readonly<Record<string, CRSConverter>> & {readonly WGS84: CRSConverter};
}>;

/** Assemble a descriptor without native parsing, projection algorithms or authority lookup.
 * Data is snapshotted; callbacks retain their backend-owned state and lifetime.
 * Shape validation does not establish geodetic correctness or CRS equivalence.
 */
export function createCRSDescriptor(options: CRSDescriptorOptions): CRSDescriptor {
  const source = options.metadata;
  requireValue(
    ['geographic', 'projected', 'geocentric', 'identity'].includes(source.coordinateFrame),
    'coordinateFrame'
  );
  requireValue(
    typeof source.projection === 'string' && Boolean(source.projection.trim()),
    'projection'
  );
  requireValue(typeof source.lossy === 'boolean', 'lossy');
  requireValue(
    typeof source.axis === 'string' &&
      source.axis.length === 3 &&
      /^[ewnsud]+$/.test(source.axis) &&
      /[ew]/.test(source.axis) &&
      /[ns]/.test(source.axis) &&
      /[ud]/.test(source.axis),
    'axis'
  );
  requireValue(
    positive(source.ellipsoid.semiMajorAxis) && positive(source.ellipsoid.semiMinorAxis),
    'ellipsoid'
  );
  requireValue(
    Boolean(source.parameters) &&
      typeof source.parameters === 'object' &&
      !Array.isArray(source.parameters),
    'parameters'
  );
  const parameters = {...source.parameters};
  requireValue(
    Object.values(parameters).every(value => value === undefined || typeof value === 'string'),
    'parameters'
  );
  const areaOfUse = source.areaOfUse && ([...source.areaOfUse] as [number, number, number, number]);
  if (areaOfUse)
    requireValue(
      areaOfUse.length === 4 && areaOfUse.every(Number.isFinite) && areaOfUse[1] <= areaOfUse[3],
      'areaOfUse'
    );
  const metadata: CRSMetadata = {
    coordinateFrame: source.coordinateFrame,
    projection: source.projection,
    parameters: Object.freeze(parameters),
    ellipsoid: Object.freeze({
      semiMajorAxis: source.ellipsoid.semiMajorAxis,
      semiMinorAxis: source.ellipsoid.semiMinorAxis
    }),
    axis: source.axis,
    xUnit: copyUnit(source.xUnit),
    yUnit: copyUnit(source.yUnit),
    zUnit: copyUnit(source.zUnit),
    lossy: source.lossy,
    areaOfUse: areaOfUse && Object.freeze(areaOfUse)
  };
  const signature = options.signature ?? getCRSSignature(metadata);
  requireValue(typeof signature === 'string' && Boolean(signature.trim()), 'signature');
  const bounds = options.renderingBounds;
  requireValue(
    Array.isArray(bounds) &&
      bounds.length === 2 &&
      [...bounds].every(
        row => Array.isArray(row) && row.length === 3 && [...row].every(Number.isFinite)
      ) &&
      bounds[0].every((minimum, i) => minimum <= bounds[1][i]),
    'renderingBounds'
  );
  const renderingBounds: CRSBounds = Object.freeze([
    Object.freeze([...bounds[0]]) as CRSBounds[0],
    Object.freeze([...bounds[1]]) as CRSBounds[1]
  ]);
  const suppliedScale = options.renderingScale;
  const renderingScale =
    typeof suppliedScale === 'function'
      ? (coordinate: CRSCoordinate): CRSRenderingScale | null => {
          const result = suppliedScale(coordinate);
          return result === null ? null : copyScale(result);
        }
      : copyScale(suppliedScale);
  requireValue(Object.prototype.hasOwnProperty.call(options.converter, 'WGS84'), 'converter.WGS84');
  const converter = Object.create(null) as Record<string, CRSConverter> & {WGS84: CRSConverter};
  for (const key of Object.getOwnPropertyNames(options.converter)) {
    const operations = options.converter[key];
    requireValue(Boolean(key.trim()), 'converter key');
    converter[key] = Object.freeze({
      from: bindConversion(operations, 'from'),
      to: bindConversion(operations, 'to'),
      normalize: bindConversion(operations, 'normalize')
    });
  }
  return Object.freeze({
    ...metadata,
    signature,
    renderingBounds,
    renderingScale,
    getRenderingScale: (coordinate: CRSCoordinate) =>
      typeof renderingScale === 'function' ? renderingScale(coordinate) : renderingScale,
    converter: Object.freeze(converter)
  });
}

function bindConversion(owner: CRSConverter, key: keyof CRSConverter): CRSConversion {
  const operation = owner?.[key] as (coordinate: CRSCoordinate, output?: CRSOutput) => CRSOutput;
  requireValue(typeof operation === 'function', `converter.${key}`);
  function convert(coordinate: CRSCoordinate): number[];
  function convert<T extends CRSOutput>(coordinate: CRSCoordinate, output: T): T;
  function convert(coordinate: CRSCoordinate, output?: CRSOutput): CRSOutput {
    // Capture the method and receiver at construction. Never adapt promises into sync conversions.
    const result = operation.call(owner, coordinate, output);
    requireSynchronous(result);
    requireValue(
      output === undefined ? Array.isArray(result) : result === output,
      'converter result: synchronous array or supplied output required'
    );
    return result;
  }
  return convert;
}

function copyUnit(unit: CRSUnit): CRSUnit {
  requireValue(
    typeof unit.name === 'string' &&
      Boolean(unit.name.trim()) &&
      ((positive(unit.metersPerUnit) && unit.degreesPerUnit === undefined) ||
        (positive(unit.degreesPerUnit) && unit.metersPerUnit === undefined)),
    'unit'
  );
  return Object.freeze({
    name: unit.name,
    metersPerUnit: unit.metersPerUnit,
    degreesPerUnit: unit.degreesPerUnit
  });
}

function copyScale(value: CRSRenderingScale): CRSRenderingScale {
  requireSynchronous(value);
  requireValue(
    Array.isArray(value) && value.length === 3 && [...value].every(positive),
    'renderingScale'
  );
  return Object.freeze([...value]) as CRSRenderingScale;
}

function positive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function requireSynchronous(value: unknown): void {
  if (value && typeof (value as {then?: unknown}).then === 'function') {
    // Observe a rejected accidental async result without creating an unhandled rejection.
    // This cannot cancel work already started by a contract-violating backend.
    void Promise.resolve(value).catch(() => undefined);
    throw new TypeError('Invalid CRS descriptor result: synchronous callbacks required');
  }
}

function requireValue(condition: boolean, field: string): asserts condition {
  if (!condition) throw new TypeError(`Invalid CRS descriptor ${field}`);
}
