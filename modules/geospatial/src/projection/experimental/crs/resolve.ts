// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {createSpatialReference, inferCRSRepresentation} from '../../../crs/spatial-reference';
import type {CRSInput, CRSReference, SpatialReference} from '../../../crs/spatial-reference';
import type {CreateProjectionOptions, ProjectionEngineOptions} from '../../types';
import type {ProjectionDescriptor} from '../projection-descriptor';
import type {ProjectionPlugin} from '../types';
import {resolveLocalCRSDefinition} from './normalize';
import {resolveCRSInput} from './spatial-reference';

type Options = ProjectionEngineOptions<ProjectionPlugin | ProjectionDescriptor> &
  CreateProjectionOptions;

/** Capture both endpoints before the first asynchronous lookup. */
export async function prepareEngineOptions<T extends Options>(options: T): Promise<T> {
  if (!options.resolver) return options;
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
export async function prepareCRSInput(input: CRSInput, options: Options): Promise<CRSInput> {
  if (!options.resolver) return input;
  const captured = capture(input);
  // Enforce epoch/vertical policy before attempting lookup; metadata must never be dropped.
  const source = resolveCRSInput(captured, options);
  const local = resolveLocalCRSDefinition(source.definition, options);
  if (
    inferCRSRepresentation(local) !== 'identifier' ||
    options.parsers?.some(p => p.canParse(local))
  ) {
    return captured;
  }
  const result = await options.resolver.resolve(local);
  const definition = resolveCRSInput(result.input, options).definition;
  if (typeof captured === 'string' || 'type' in captured) return definition;
  const metadata = captured as CRSReference | SpatialReference;
  const ref = 'crs' in metadata ? metadata.crs : metadata;
  if (ref.state !== 'explicit' && ref.state !== 'default') return captured;
  const resolved = {
    ...ref,
    definition,
    representation: inferCRSRepresentation(definition),
    alternatives: [
      {definition: ref.definition, representation: ref.representation},
      ...(ref.alternatives ?? [])
    ]
  };
  return 'crs' in metadata ? createSpatialReference({...metadata, crs: resolved}) : resolved;
}

function capture(input: CRSInput): CRSInput {
  return typeof input === 'string' ? input : JSON.parse(JSON.stringify(input));
}
