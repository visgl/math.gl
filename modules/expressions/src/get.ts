// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Access properties of nested containers using dot-path notation.
 *
 * @param container - Object from which to read a value.
 * @param compositeKey - Dot-separated property path.
 * @returns The nested value, or `undefined` when the path cannot be resolved.
 */
export function get(container: Record<string, unknown>, compositeKey: string): unknown {
  let value: unknown = container;

  for (const key of getKeys(compositeKey)) {
    value = isObject(value) ? value[key] : undefined;
  }

  return value;
}

/** Tests whether a value can be used for property access. */
function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

const keyMap: Record<string, string[]> = {};

/** Returns a cached list of property names for a dot-separated path. */
function getKeys(compositeKey: string): string[] {
  let keyList = keyMap[compositeKey];
  if (!keyList) {
    keyList = compositeKey.split('.');
    keyMap[compositeKey] = keyList;
  }
  return keyList;
}
