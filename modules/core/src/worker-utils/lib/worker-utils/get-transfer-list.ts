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
  if (object === null) {
    return {};
  }
  const clone = Object.assign({}, object);

  Object.keys(clone).forEach(key => {
    // Typed Arrays and Arrays are passed with no change
    if (
      typeof object[key] === 'object' &&
      !ArrayBuffer.isView(object[key]) &&
      !(object[key] instanceof Array)
    ) {
      clone[key] = getTransferListForWriter(object[key]);
    } else if (typeof clone[key] === 'function' || clone[key] instanceof RegExp) {
      clone[key] = {};
    } else {
      clone[key] = object[key];
    }
  });

  return clone;
}
