// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original descriptor/cache implementation, following loaders.gl's distinction
// between lightweight metadata and cached runtime implementations.
import type {ProjectionPlugin} from './types';

export type ProjectionLoader = {
  readonly name: string;
  readonly aliases?: readonly string[];
  preload(): Promise<ProjectionPlugin>;
};
type LoadedProjection = {
  load: () => Promise<ProjectionPlugin>;
  pending?: Promise<ProjectionPlugin>;
  implementation?: ProjectionPlugin;
};
// CJS entry points are separately bundled. Share a weak, identity-keyed cache
// across them without conflating descriptors that have the same projection name.
const CACHE_KEY = Symbol.for('@math.gl/proj4/projection-implementations');
function cache(): WeakMap<ProjectionLoader, LoadedProjection> {
  const scope = globalThis as typeof globalThis & {
    [CACHE_KEY]?: WeakMap<ProjectionLoader, LoadedProjection>;
  };
  scope[CACHE_KEY] ||= new WeakMap();
  return scope[CACHE_KEY];
}

/** Return an eager or previously loaded implementation without starting an import. */
export function getLoadedProjection(
  projection: ProjectionPlugin | ProjectionLoader
): ProjectionPlugin | undefined {
  return 'create' in projection ? projection : cache().get(projection)?.implementation;
}

/** Resolve and cache an implementation; concurrent requests share the same import. */
export function preloadProjection(
  projection: ProjectionPlugin | ProjectionLoader
): Promise<ProjectionPlugin> {
  if ('create' in projection) return Promise.resolve(projection);
  let state = cache().get(projection);
  if (!state) {
    state = {load: () => projection.preload()};
    cache().set(projection, state);
  }
  if (state.implementation) return Promise.resolve(state.implementation);
  const entry = state;
  entry.pending ||= Promise.resolve()
    .then(entry.load)
    .then(plugin => {
      const key = (value: string) => value.toLowerCase().replace(/[\s_-]/g, '');
      const supported = new Set([plugin.name, ...(plugin.aliases || [])].map(key));
      if (
        typeof plugin.create !== 'function' ||
        ![projection.name, ...(projection.aliases || [])].every(name => supported.has(key(name)))
      )
        throw new Error('Loaded projection does not match descriptor: ' + projection.name);
      entry.implementation = plugin;
      return plugin;
    })
    .catch(error => {
      entry.pending = undefined;
      throw error;
    });
  return entry.pending;
}

/** Create a lightweight descriptor whose preload() populates the shared cache. */
export function createProjectionLoader(
  metadata: Pick<ProjectionPlugin, 'name' | 'aliases'>,
  load: () => Promise<ProjectionPlugin>
): ProjectionLoader {
  const descriptor: ProjectionLoader = Object.freeze({
    name: metadata.name,
    aliases: metadata.aliases && Object.freeze([...metadata.aliases]),
    preload: () => preloadProjection(descriptor)
  });
  cache().set(descriptor, {load});
  return descriptor;
}
