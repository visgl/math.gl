// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Access properties of nested containers using dot-path notation.
 * Returns `undefined` if any container is not valid, instead of throwing.
 */
export function get(
  container: Record<string, unknown>,
  compositeKey: string,
): unknown {
  let value: unknown = container;

  for (const key of getKeys(compositeKey)) {
    value = isObject(value) ? value[key] : undefined;
  }

  return value;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

const keyMap: Record<string, string[]> = {};

function getKeys(compositeKey: string): string[] {
  let keyList = keyMap[compositeKey];
  if (!keyList) {
    keyList = compositeKey.split(".");
    keyMap[compositeKey] = keyList;
  }
  return keyList;
}
