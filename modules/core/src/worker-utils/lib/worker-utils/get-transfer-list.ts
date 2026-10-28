// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// NOTE - there is a copy of this function is both in core and loader-utils
// core does not need all the utils in loader-utils, just this one.

/**
 * Returns an array of Transferrable objects that can be used with postMessage
 * https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage
 * @param object data to be sent via postMessage
 * @param recursive - not for application use
 * @param transfers - not for application use
 * @returns a transfer list that can be passed to postMessage
 */
export function getTransferList(
  object: any,
  recursive: boolean = true,
  transfers?: Set<any>
): Transferable[] {
  // Make sure that items in the transfer list is unique
  const transfersSet = transfers || new Set();

  const seen = new Set<object>();
  function visit(value: any): void {
    if (!value || typeof value !== 'object' || seen.has(value)) return;
    seen.add(value);
    if (isTransferable(value)) transfersSet.add(value);
    else if (ArrayBuffer.isView(value)) {
      if (isTransferable(value.buffer)) transfersSet.add(value.buffer);
    } else if (recursive && value instanceof Map) {
      for (const [key, item] of value) {
        visit(key);
        visit(item);
      }
    } else if (recursive && value instanceof Set) {
      for (const item of value) visit(item);
    } else if (recursive) {
      for (const key of Object.keys(value)) visit(value[key]);
    }
  }
  visit(object);

  // If transfers is defined, is internal recursive call
  // Otherwise it's called by the user
  return transfers === undefined ? Array.from(transfersSet) : [];
}

// https://developer.mozilla.org/en-US/docs/Web/API/Transferable
function isTransferable(object: unknown) {
  if (!object) {
    return false;
  }
  if (object instanceof ArrayBuffer) {
    return true;
  }
  if (typeof MessagePort !== 'undefined' && object instanceof MessagePort) {
    return true;
  }
  if (typeof ImageBitmap !== 'undefined' && object instanceof ImageBitmap) {
    return true;
  }
  // @ts-ignore
  if (typeof OffscreenCanvas !== 'undefined' && object instanceof OffscreenCanvas) {
    return true;
  }
  return false;
}

/**
 * Recursively drop non serializable values like functions and regexps.
 * @param object
 */
export function getTransferListForWriter(object: object | null): object {
  const seen = new Map<object, any>();
  function clone(value: any): any {
    if (typeof value === 'function' || value instanceof RegExp) return {};
    if (!value || typeof value !== 'object') return value;
    if (seen.has(value)) return seen.get(value);
    // Preserve structured-clone built-ins and backing-buffer identity.
    if (
      ArrayBuffer.isView(value) ||
      value instanceof ArrayBuffer ||
      (typeof SharedArrayBuffer !== 'undefined' && value instanceof SharedArrayBuffer) ||
      value instanceof Date ||
      (typeof WebAssembly !== 'undefined' && value instanceof WebAssembly.Module) ||
      isTransferable(value)
    )
      return value;
    const result: any =
      value instanceof Map
        ? new Map()
        : value instanceof Set
          ? new Set()
          : Array.isArray(value)
            ? []
            : {};
    seen.set(value, result);
    if (value instanceof Map) {
      for (const [key, item] of value) result.set(clone(key), clone(item));
    } else if (value instanceof Set) {
      for (const item of value) result.add(clone(item));
    } else {
      for (const key of Object.keys(value)) {
        Object.defineProperty(result, key, {
          value: clone(value[key]),
          enumerable: true,
          writable: true,
          configurable: true
        });
      }
    }
    return result;
  }
  return object === null ? {} : clone(object);
}
