// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {inferCRSRepresentation} from '../../../crs/spatial-reference';
import type {
  CRSInput,
  CRSReference,
  KnownCRSReference,
  SpatialReference
} from '../../../crs/spatial-reference';
import type {CreateProjectionOptions, ProjectionEngineOptions} from '../../types';
import type {ProjectionDescriptor} from '../projection-descriptor';
import type {ProjectionPlugin} from '../types';
import {resolveLocalCRSDefinition} from './normalize';
import {resolveCRSInput} from './spatial-reference';

type Options = ProjectionEngineOptions<ProjectionPlugin | ProjectionDescriptor> &
  CreateProjectionOptions;

/** Capture both endpoints before the first asynchronous lookup. */
export async function prepareEngineOptions<T extends Options>(options: T): Promise<T> {
  const captured = {
    ...options,
    from: capture(options.from ?? 'WGS84'),
    to: capture(options.to ?? 'WGS84')
  };
  const [from, to] = await Promise.all([
    prepareCRSInput(captured.from, captured),
    prepareCRSInput(captured.to, captured)
  ]);
  return {...captured, from, to};
}

/** Local aliases/built-ins and registered readers take precedence over external lookup. */
export async function prepareCRSInput(captured: CRSInput, options: Options): Promise<CRSInput> {
  // Enforce epoch/vertical policy before attempting lookup; metadata must never be dropped.
  const source = resolveCRSInput(captured, options);
  const local = resolveLocalCRSDefinition(source.definition, options);
  // resolveCRSInput above rejects unknown/absent references. Callers already captured the input.
  const reference = (
    typeof captured === 'string' || 'type' in captured
      ? undefined
      : 'crs' in captured
        ? (captured as SpatialReference).crs
        : (captured as CRSReference)
  ) as KnownCRSReference | undefined;
  const representation =
    local === source.definition && reference
      ? reference.representation
      : inferCRSRepresentation(local);
  if (representation !== 'identifier' || options.parsers?.some(p => p.canParse(local))) {
    return captured;
  }
  const result = await options.resolver!.resolve({
    state: 'explicit',
    provenance: reference?.provenance ?? 'unknown',
    definition: local,
    representation
  });
  const definition = resolveCRSInput(result.input, options).definition;
  if (!reference) return definition;
  const metadata = captured as CRSReference | SpatialReference;
  const resolved = {
    ...reference,
    definition,
    representation: inferCRSRepresentation(definition),
    alternatives: [
      {definition: reference.definition, representation: reference.representation},
      ...(reference.alternatives ?? [])
    ]
  };
  return 'crs' in metadata ? {...metadata, crs: resolved} : resolved;
}

function capture(input: CRSInput): CRSInput {
  return typeof input === 'string' ? input : JSON.parse(JSON.stringify(input));
}
