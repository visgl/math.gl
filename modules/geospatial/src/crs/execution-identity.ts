// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {CRSDescriptor} from './crs-descriptor-types';
import {createCRSProjectionDomain} from './projection-domain';

/** Caller-declared execution provenance, not inferred from CRS metadata or callback code.
 * Change this snapshot whenever any converter's behavior changes. Resource values must
 * identify contents (e.g. checksums or immutable dataset versions), not mutable URLs.
 */
export type CRSExecutionIdentity = Readonly<{
  backend: string;
  version: string;
  /** Selected operation/pipeline and policies applying to all supplied source converters. */
  operation: string;
  parameters?: Readonly<Record<string, string | number | boolean | null>>;
  resources?: Readonly<Record<string, string>>;
  /** Additional caller revision, including callback state or domain sampling policy. */
  revision?: string;
}>;

/** Validate and freeze an execution identity without loading engines or hashing resources. */
export function createCRSExecutionIdentity(identity: CRSExecutionIdentity): CRSExecutionIdentity {
  if (!identity || typeof identity !== 'object') throw new TypeError('Invalid execution identity');
  const backend = nonempty(identity.backend);
  const version = nonempty(identity.version);
  const operation = nonempty(identity.operation);
  const parameters = copyRecord(identity.parameters, false);
  const resources = copyRecord(identity.resources, true) as Readonly<Record<string, string>>;
  return Object.freeze({
    backend,
    version,
    operation,
    parameters,
    resources,
    ...(identity.revision === undefined ? {} : {revision: nonempty(identity.revision)})
  });
}

/** Deterministic opaque execution key, or null when execution identity is unknown.
 * Includes CRS signature, converter names and explicit domain geometry. It is not a CRS
 * equivalence test, cryptographic digest, or complete rendered-mesh cache key. Callers must
 * also key source data, source CRS, direction, attributes, tessellation and view policy.
 * Supplying incomplete provenance can still produce unsafe reuse; function bodies and
 * external resources cannot be inspected here. Recreate descriptors when callbacks change.
 */
export function getCRSExecutionKey(descriptor: CRSDescriptor): string | null {
  if (descriptor.executionIdentity === undefined) return null;
  const identity = createCRSExecutionIdentity(descriptor.executionIdentity);
  const domain =
    descriptor.projectionDomain === undefined
      ? null
      : createCRSProjectionDomain(descriptor.projectionDomain);
  return JSON.stringify([
    'math.gl/crs-execution/v1',
    descriptor.signature,
    identity,
    Object.keys(descriptor.converter).sort(),
    domain
  ]);
}

function nonempty(value: string): string {
  if (typeof value !== 'string' || !value.trim())
    throw new TypeError('Invalid execution identity string');
  return value;
}
function copyRecord(value: CRSExecutionIdentity['parameters'], stringsOnly: boolean) {
  if (value === undefined) return Object.freeze({});
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(value))
  )
    throw new TypeError('Invalid execution identity record');
  const result = Object.create(null) as Record<string, string | number | boolean | null>;
  for (const key of Object.keys(value).sort()) {
    nonempty(key);
    const item = value[key];
    if (stringsOnly) nonempty(item as string);
    else if (
      !(
        item === null ||
        typeof item === 'string' ||
        typeof item === 'boolean' ||
        (typeof item === 'number' && Number.isFinite(item))
      )
    )
      throw new TypeError('Invalid execution parameter');
    // JSON collapses -0 and 0; reject it rather than claiming identical execution.
    if (Object.is(item, -0))
      throw new TypeError('Execution parameters cannot contain negative zero');
    result[key] = item;
  }
  return Object.freeze(result);
}
