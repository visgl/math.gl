// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {createSpatialReference, inferCRSRepresentation} from './spatial-reference';
import type {
  CRSInput,
  CRSReference,
  ReadonlyCRSDefinition,
  SpatialReference
} from './spatial-reference';

/** An application-owned catalogue. Null means a miss; errors stop resolution. */
export type CRSDefinitionProvider = Readonly<{
  id: string;
  /** Catalogue/database revision, for diagnostics. Create a new resolver when it changes. */
  version?: string;
  resolve(identifier: string): ReadonlyCRSDefinition | null | Promise<ReadonlyCRSDefinition | null>;
}>;

export type CRSLookup = Readonly<{identifier: string; provider: string; version?: string}>;
export type CRSResolution = Readonly<{
  /** Resolved input, retaining source storage conventions and original references. */
  input: CRSInput;
  lookups: readonly CRSLookup[];
}>;
export type CRSResolverOptions = Readonly<{
  providers: readonly CRSDefinitionProvider[];
  /** Maximum cached top-level identifier requests, including pending requests. Default 128. */
  maxCacheSize?: number;
  /** Maximum provider alias hops. Default 16. */
  maxDepth?: number;
}>;
export interface CRSResolver {
  resolve(input: CRSInput): Promise<CRSResolution>;
  /** Evict cached successes and pending requests; already returned promises still complete. */
  clear(): void;
}

export class CRSResolutionError extends Error {
  constructor(
    readonly reason: 'not-found' | 'cycle' | 'limit' | 'invalid-result',
    readonly identifier: string
  ) {
    super(`CRS resolution ${reason}: ${identifier}`);
    this.name = 'CRSResolutionError';
  }
}

/** Snapshot a local catalogue without registering it globally. Exact keys are significant. */
export function createCRSDictionaryProvider(
  definitions: Readonly<Record<string, ReadonlyCRSDefinition>>,
  options: {id?: string; version?: string} = {}
): CRSDefinitionProvider {
  const entries = new Map(
    Object.entries(definitions).map(([key, value]) => [key, snapshot(value)])
  );
  return Object.freeze({
    id: options.id ?? 'dictionary',
    version: options.version,
    resolve: (identifier: string) => entries.get(identifier) ?? null
  });
}

/** Resolve definitions only. No bundled authority database, network access or coordinate execution. */
export function createCRSResolver(options: CRSResolverOptions): CRSResolver {
  const {maxCacheSize = 128, maxDepth = 16} = options;
  if (
    !Number.isSafeInteger(maxCacheSize) ||
    maxCacheSize < 0 ||
    !Number.isSafeInteger(maxDepth) ||
    maxDepth < 1
  ) {
    throw new RangeError('Invalid CRS resolver cache size or alias depth');
  }
  const providers = options.providers.map(provider => {
    if (!provider.id.trim() || typeof provider.resolve !== 'function') {
      throw new TypeError('A CRS provider needs an id and resolve method');
    }
    return {id: provider.id, version: provider.version, resolve: provider.resolve.bind(provider)};
  });
  if (new Set(providers.map(provider => provider.id)).size !== providers.length) {
    throw new Error('CRS provider ids must be unique');
  }
  type DefinitionResult = {definition: ReadonlyCRSDefinition; lookups: readonly CRSLookup[]};
  const cache = new Map<string, Promise<DefinitionResult>>();

  async function lookup(
    identifier: string,
    visited = new Set<string>()
  ): Promise<DefinitionResult> {
    if (visited.has(identifier)) throw new CRSResolutionError('cycle', identifier);
    if (visited.size >= maxDepth) throw new CRSResolutionError('limit', identifier);
    visited.add(identifier);
    for (const provider of providers) {
      const supplied = await provider.resolve(identifier);
      if (supplied === null) continue;
      if (
        !(typeof supplied === 'string' && supplied.trim()) &&
        !(
          supplied &&
          typeof supplied === 'object' &&
          !Array.isArray(supplied) &&
          typeof supplied.type === 'string'
        )
      ) {
        throw new CRSResolutionError('invalid-result', identifier);
      }
      const definition = snapshot(supplied);
      const entry = Object.freeze({identifier, provider: provider.id, version: provider.version});
      if (typeof definition === 'string' && inferCRSRepresentation(definition) === 'identifier') {
        const next = await lookup(definition, visited);
        return {definition: next.definition, lookups: Object.freeze([entry, ...next.lookups])};
      }
      return {definition, lookups: Object.freeze([entry])};
    }
    throw new CRSResolutionError('not-found', identifier);
  }

  function resolveDefinition(definition: ReadonlyCRSDefinition): Promise<DefinitionResult> {
    if (typeof definition !== 'string' || inferCRSRepresentation(definition) !== 'identifier') {
      return Promise.resolve({definition, lookups: Object.freeze([])});
    }
    const existing = cache.get(definition);
    if (existing) {
      cache.delete(definition);
      cache.set(definition, existing);
      return existing;
    }
    const pending = lookup(definition).catch(error => {
      if (cache.get(definition) === pending) cache.delete(definition);
      throw error;
    });
    if (maxCacheSize) {
      cache.set(definition, pending);
      if (cache.size > maxCacheSize) cache.delete(cache.keys().next().value!);
    }
    return pending;
  }

  return Object.freeze({
    clear: () => cache.clear(),
    async resolve(input: CRSInput): Promise<CRSResolution> {
      // Snapshot before awaiting a provider; metadata must not change during preparation.
      const captured = snapshot(input);
      const lookups: CRSLookup[] = [];
      async function reference(ref: CRSReference): Promise<CRSReference> {
        if (ref.state !== 'explicit' && ref.state !== 'default') return ref;
        const result = await resolveDefinition(ref.definition);
        lookups.push(...result.lookups);
        if (!result.lookups.length) return ref;
        return {
          ...ref,
          definition: result.definition,
          representation: inferCRSRepresentation(result.definition),
          alternatives: [
            {definition: ref.definition, representation: ref.representation},
            ...(ref.alternatives ?? [])
          ]
        };
      }
      let resolved: CRSInput;
      if (typeof captured === 'string' || 'type' in captured) {
        const result = await resolveDefinition(captured);
        lookups.push(...result.lookups);
        resolved = result.definition;
      } else {
        const metadata = captured as CRSReference | SpatialReference;
        resolved =
          'crs' in metadata
            ? createSpatialReference({
                ...metadata,
                crs: await reference(metadata.crs),
                vertical: metadata.vertical ? await reference(metadata.vertical) : undefined
              })
            : snapshot(await reference(metadata));
      }
      return Object.freeze({input: resolved, lookups: Object.freeze(lookups)});
    }
  });
}

function snapshot<T>(value: T): T {
  if (Array.isArray(value)) return Object.freeze(value.map(item => snapshot(item))) as T;
  if (value && typeof value === 'object') {
    return Object.freeze(
      Object.fromEntries(Object.entries(value).map(([key, item]) => [key, snapshot(item)]))
    ) as T;
  }
  return value;
}
