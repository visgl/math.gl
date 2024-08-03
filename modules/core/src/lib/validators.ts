// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {NumericArray} from '@math.gl/types';
import {config} from './common';

export function validateVector(v: NumericArray, length: number): boolean {
  if (v.length !== length) {
    return false;
  }
  // Could be arguments "array" (v.every not availasble)
  for (let i = 0; i < v.length; ++i) {
    if (!Number.isFinite(v[i])) {
      return false;
    }
  }
  return true;
}

export function checkNumber(value: unknown): number {
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid number ${JSON.stringify(value)}`);
  }
  return value as number;
}

export function checkVector<T extends NumericArray>(
  v: T,
  length: number,
  callerName: string = ''
): T {
  if (config.debug && !validateVector(v, length)) {
    throw new Error(`math.gl: ${callerName} some fields set to invalid numbers'`);
  }
  return v;
}

const map: Record<string, boolean> = {};

export function deprecated(method: string, version: string): void {
  if (!map[method]) {
    map[method] = true;
    // eslint-disable-next-line
    console.warn(
      `${method} has been removed in version ${version}, see upgrade guide for more information`
    );
  }
}
