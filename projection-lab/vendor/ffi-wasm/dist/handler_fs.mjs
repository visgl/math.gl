// Copyright (c) 2026 Will Cohen
//
// Part of clj-native, under the Apache License v2.0 with LLVM Exceptions.
// See LICENSE for license information.
// SPDX-License-Identifier: Apache-2.0 WITH LLVM-exception
//
// MEMFS staging for wasm-backed handlers. A worker's emscripten MEMFS cannot
// see host paths, and the consumer must copy file bytes into it first. A
// repeat stageFiles call is safe.

const ensureUint8 = (value, name) => {
  if (value instanceof Uint8Array) return value;
  // A bare ArrayBuffer, as from fetch().arrayBuffer(), has no .buffer and
  // misses the typed-array arm below.
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (value && typeof value.byteLength === 'number' && typeof value.buffer !== 'undefined') {
    return new Uint8Array(value.buffer, value.byteOffset ?? 0, value.byteLength);
  }
  if (Array.isArray(value)) return new Uint8Array(value);
  throw new Error('stageFiles: ' + name + ' is not Uint8Array or coercible (got ' + typeof value + ')');
};

export const stageFiles = (module, files, memfsDir) => {
  if (!module || !module.FS) {
    throw new Error('stageFiles: module.FS not available');
  }
  if (typeof memfsDir !== 'string' || memfsDir.length === 0) {
    throw new Error('stageFiles: memfsDir must be a non-empty string');
  }
  if (!files || typeof files !== 'object') {
    throw new Error('stageFiles: files must be an object map of name -> bytes');
  }
  module.FS.mkdirTree(memfsDir);
  const trimmed = memfsDir.endsWith('/') ? memfsDir.slice(0, -1) : memfsDir;
  const out = {};
  for (const name of Object.keys(files)) {
    const u8 = ensureUint8(files[name], name);
    const path = trimmed + '/' + name;
    module.FS.writeFile(path, u8);
    out[name] = path;
  }
  return out;
};
