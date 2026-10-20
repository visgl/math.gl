// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original source-sampled temporal component arithmetic; no upstream code or model data copied.
import {inverseDisplacement} from './experimental/deformation-inverse';
import {createSpatialDeformationModel} from './experimental/spatial-deformation';
import type {DeformationModel, DeformationModelOptions} from './experimental/deformation';
import type {ProjectionPoint} from './experimental/types';

/** ENU amplitudes in the component's explicitly declared units. Lon/lat are radians. */
export type DeformationField = {
  sample(longitude: number, latitude: number, output: ProjectionPoint): boolean;
};
export type TemporalFunction =
  | {readonly type: 'velocity'}
  | {readonly type: 'acceleration'; readonly referenceEpoch: number}
  | {readonly type: 'step'; readonly epoch: number}
  | {readonly type: 'exponential'; readonly epoch: number; readonly timeConstantYears: number};
export type TemporalDeformationComponent = {
  readonly id: string;
  readonly field: DeformationField;
  readonly units: 'm/year' | 'm/year^2' | 'm';
  readonly timeFunction: TemporalFunction;
};
export type TemporalDeformationOptions = Omit<DeformationModelOptions, 'grid'> & {
  readonly components: readonly TemporalDeformationComponent[];
};
type Prepared = {sample: DeformationField['sample']; law: TemporalFunction};

/** Difference of right-continuous displacement coefficients, not a trajectory integral. */
function temporalDifference(law: TemporalFunction, source: number, target: number): number {
  const dt = target - source;
  switch (law.type) {
    case 'velocity':
      return dt;
    case 'acceleration':
      return dt * (source - law.referenceEpoch + dt / 2);
    case 'step':
      return Number(target >= law.epoch) - Number(source >= law.epoch);
    case 'exponential': {
      if (target < source) return -temporalDifference(law, target, source);
      if (target <= law.epoch) return 0;
      if (source <= law.epoch) {
        const elapsed = target - law.epoch;
        return Number.isFinite(elapsed) ? -Math.expm1(-elapsed / law.timeConstantYears) : NaN;
      }
      if (!Number.isFinite(source - law.epoch)) return NaN;
      return (
        Math.exp(-(source - law.epoch) / law.timeConstantYears) *
        -Math.expm1(-dt / law.timeConstantYears)
      );
    }
  }
}
function sampleComponents(
  components: readonly Prepared[],
  longitude: number,
  latitude: number,
  output: ProjectionPoint,
  source: number,
  target: number
): boolean {
  let east = 0,
    north = 0,
    up = 0;
  for (let i = 0; i < components.length; i++) {
    const component = components[i],
      weight = temporalDifference(component.law, source, target);
    // All fields must cover the source, even if their interval coefficient is zero.
    if (!Number.isFinite(weight)) throw new Error('Non-finite temporal coefficient');
    output.x = NaN;
    output.y = NaN;
    output.z = NaN;
    const covered = component.sample(longitude, latitude, output);
    if (covered !== true) {
      if (covered !== false) throw new Error('Synchronous boolean temporal coverage required');
      return false;
    }
    if (!Number.isFinite(output.x) || !Number.isFinite(output.y) || !Number.isFinite(output.z))
      throw new Error('Finite temporal component required');
    east += weight * output.x;
    north += weight * output.y;
    up += weight * output.z;
  }
  if (!Number.isFinite(east) || !Number.isFinite(north) || !Number.isFinite(up))
    throw new Error('Non-finite temporal displacement');
  output.x = east;
  output.y = north;
  output.z = up;
  return true;
}
/** Sum time-varying source-position ENU components; inverse solves that same map. */
export function createTemporalDeformationModel(
  options: TemporalDeformationOptions
): DeformationModel {
  if (!Array.isArray(options.components) || !options.components.length)
    throw new Error('Nonempty temporal components required');
  const ids = new Set<string>();
  const components = options.components.map(component => {
    if (
      typeof component.id !== 'string' ||
      !component.id.trim() ||
      ids.has(component.id) ||
      typeof component.field?.sample !== 'function'
    )
      throw new Error('Unique temporal component id and prepared field required');
    ids.add(component.id);
    const law = {...component.timeFunction};
    if (!law || !['velocity', 'acceleration', 'step', 'exponential'].includes(law.type))
      throw new Error('Unsupported temporal function');
    const units =
      law.type === 'velocity' ? 'm/year' : law.type === 'acceleration' ? 'm/year^2' : 'm';
    if (component.units !== units)
      throw new Error('Temporal component units do not match time function');
    if (law.type === 'acceleration' && !Number.isFinite(law.referenceEpoch))
      throw new Error('Finite acceleration referenceEpoch required');
    if ((law.type === 'step' || law.type === 'exponential') && !Number.isFinite(law.epoch))
      throw new Error('Finite event epoch required');
    if (
      law.type === 'exponential' &&
      (!Number.isFinite(law.timeConstantYears) || law.timeConstantYears <= 0)
    )
      throw new Error('Positive finite relaxation time required');
    return {sample: component.field.sample.bind(component.field), law: Object.freeze(law)};
  });
  return createSpatialDeformationModel(
    options,
    (longitude, latitude, output, source, target) =>
      sampleComponents(components, longitude, latitude, output, source, target),
    false,
    inverseDisplacement
  );
}
