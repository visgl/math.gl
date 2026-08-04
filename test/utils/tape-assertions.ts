// math.gl, MIT license

import type {Test} from 'test/utils/vitest-tape';
import {equals, withEpsilon} from '@math.gl/core';

function isEqual(a: any, b: any): boolean {
  if (a && a.equals) {
    return a.equals(b);
  }
  if (b && b.equals) {
    return b.equals(a);
  }
  return equals(a, b);
}

// FOR TAPE TESTING
// Use tape assert to compares using a.equals(b)
// Usage test(..., t => { tapeEquals(t, a, b, ...); });
export function tapeEquals(t: Test, a: any, b: any, msg?: string, extra?: any): void {
  t.ok(isEqual(a, b), msg || 'should be equal');
}

export function tapeNotEquals(t: Test, a: any, b: any, msg?: string, extra?: any): void {
  t.ok(!isEqual(a, b), msg || 'should not be equal');
}

// eslint-disable-next-line max-params
export function tapeEqualsEpsilon(
  t: Test,
  a: any,
  b: any,
  epsilon: number,
  msg?: string,
  extra?: any
): void {
  return withEpsilon(epsilon, () => tapeEquals(t, a, b, msg, extra));
}
