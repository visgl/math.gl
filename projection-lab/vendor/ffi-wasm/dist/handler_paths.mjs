// Copyright (c) 2026 Will Cohen
//
// Part of clj-native, under the Apache License v2.0 with LLVM Exceptions.
// See LICENSE for license information.
// SPDX-License-Identifier: Apache-2.0 WITH LLVM-exception
//
// Asset-path resolution for wasm-backed handlers. A sibling file, such as a
// database or a .wasm, sits some levels up under resources/ when run from
// source, and in the same directory in a bundled distribution.

import { isNode } from './handler_env.mjs';

// An absolute string passes through. An array of segments, such as
// ['..', '..', 'resources'], or a relative string resolves against `here`.
const resolveCandidate = async (here, candidate) => {
  const { resolve } = await import('node:path');
  if (Array.isArray(candidate)) return resolve(here, ...candidate);
  if (typeof candidate !== 'string') {
    throw new Error('handler-paths: candidate must be a string or array of segments (got ' + typeof candidate + ')');
  }
  return resolve(here, candidate);
};

// Returns {dir, path} for the first candidate directory that holds `name`, or
// throws with every path it probed. Pass the caller's import.meta.url: a
// relative candidate resolves from the caller's directory. Node only.
export const resolveAsset = async (importMetaUrl, name, candidates) => {
  if (!isNode) throw new Error('handler-paths: resolveAsset runs on Node only');
  if (typeof name !== 'string' || name.length === 0) {
    throw new Error('handler-paths: name must be a non-empty string');
  }
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error('handler-paths: candidates must be a non-empty array');
  }
  const { fileURLToPath } = await import('node:url');
  const { dirname, join } = await import('node:path');
  const { existsSync } = await import('node:fs');
  const here = dirname(fileURLToPath(importMetaUrl));
  const tried = [];
  for (const c of candidates) {
    const dir = await resolveCandidate(here, c);
    tried.push(dir);
    const path = join(dir, name);
    if (existsSync(path)) return { dir, path };
  }
  throw new Error('handler-paths: ' + name + ' not found on any candidate: ' + tried.join(', '));
};

// Imports a consumer's emscripten output and returns {factory, locateFile}.
// `factory` is the MODULARIZE default export. Pass `locateFile` to it to find
// the .wasm and any .data pack next to the module. Node probes through
// resolveAsset. A browser resolves against importMetaUrl, which works from any
// directory, a CDN ./dist/ included.
//
// opts:
//   name         asset name
//   candidates   directories for the Node probe
export const loadEmscriptenModule = async (importMetaUrl, opts) => {
  const { name, candidates } = opts ?? {};
  if (typeof name !== 'string') {
    throw new Error('handler-paths: loadEmscriptenModule needs a `name`');
  }
  if (isNode) {
    const { dir, path } = await resolveAsset(importMetaUrl, name, candidates);
    const { pathToFileURL } = await import('node:url');
    const { join } = await import('node:path');
    const imported = await import(pathToFileURL(path).href);
    return { factory: imported.default, locateFile: (n) => join(dir, n) };
  }
  const baseUrl = new URL('./', importMetaUrl).href;
  const imported = await import(baseUrl + name);
  return { factory: imported.default, locateFile: (n) => baseUrl + n };
};
