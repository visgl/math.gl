// Copyright (c) 2026 Will Cohen
//
// Part of clj-native, under the Apache License v2.0 with LLVM Exceptions.
// See LICENSE for license information.
// SPDX-License-Identifier: Apache-2.0 WITH LLVM-exception
//
// Emscripten heap views, getValue, setValue and the UTF-8 helpers as one
// methods object. A handler spreads it into its `methods`. getModule binds
// late, and the object can exist before init() loads the module.
//
// An offset is a typed-array index: pass ptr / 4 for heap32 and ptr / 8 for
// heapf64. A heap*_set past the end throws RangeError.
// A heap*_get past the end returns a short array.

const moduleOrThrow = (getModule) => {
  const mod = getModule();
  if (!mod) throw new Error('handler-heap: getModule() returned null (called before init?)');
  return mod;
};

// The same checks as graal-wasm/malloc. _malloc takes an i32, so a larger size
// wraps, and a failed _malloc returns 0.
const checkedMalloc = (mod, size) => {
  if (!(size >= 0 && size < 2 ** 31)) {
    throw new RangeError('handler-heap: malloc size out of range: ' + size);
  }
  const ptr = mod._malloc(size);
  if (ptr === 0 && size > 0) throw new Error('handler-heap: malloc of ' + size + ' bytes failed');
  return ptr;
};

export const heapHelpers = (getModule) => {
  const m = () => moduleOrThrow(getModule);

  const out = {
    malloc: async (size) => checkedMalloc(m(), size),
    free: async (ptr) => { m()._free(ptr); return { ok: true }; },

    get_value: async (ptr, type) => m().getValue(ptr, type),
    set_value: async (ptr, value, type) => { m().setValue(ptr, value, type); return { ok: true }; },

    utf8_to_string: async (ptr) => m().UTF8ToString(ptr),
    string_to_utf8: async (str, ptr, maxLength) => {
      m().stringToUTF8(str, ptr, maxLength);
      return { ok: true };
    },
    utf8_byte_length: async (str) => m().lengthBytesUTF8(str),
  };

  for (const name of ['heap8', 'heapu8', 'heap16', 'heapu16', 'heap32', 'heapu32', 'heapf32', 'heapf64']) {
    const prop = name.toUpperCase();
    out[`${name}_get`] = async (offset, length) => {
      // slice() copies into a typed array, which structured clone moves as one
      // block. A subarray() view goes stale after _free.
      return m()[prop].slice(offset, offset + length);
    };
    out[`${name}_set`] = async (offset, values) => {
      m()[prop].set(values, offset);
      return { ok: true };
    };
  }

  return out;
};

// A plain ccall method for a library that needs no marshaling. A handler that
// must allocate out-parameters or copy arrays writes its own ccall in its
// overrides module.
export const ccallMethod = (getModule) => async (fnName, returnType, argTypes, args) =>
  moduleOrThrow(getModule).ccall(fnName, returnType, argTypes, args);
