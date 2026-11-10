// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ArrowTableFunction} from './types';

/** Builds one private, immutable declaration lookup per compilation. */
export function createFunctionLookup(
  declarations: readonly ArrowTableFunction[] = []
): ReadonlyMap<string, ArrowTableFunction> {
  const functions = new Map<string, ArrowTableFunction>();
  for (const declaration of declarations) {
    const name = declaration?.name;
    if (typeof name !== 'string' || !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name))
      throw new Error('Invalid Arrow function name');
    if (
      [
        'cast',
        'isNull',
        'isNotNull',
        'parseNumber',
        'parseBigInt',
        'parseBoolean',
        'toFloat64',
        'toInt32',
        'toInt64'
      ].includes(name)
    )
      throw new Error(`Reserved Arrow function: ${name}`);
    if (functions.has(name)) throw new Error(`Duplicate Arrow function: ${name}`);
    if (
      !Array.isArray(declaration.arguments) ||
      !declaration.result ||
      typeof declaration.evaluate !== 'function'
    )
      throw new Error('Arrow functions require argument fields, a result field and evaluate');
    if (
      declaration.nullHandling !== undefined &&
      !['propagate', 'call'].includes(declaration.nullHandling)
    )
      throw new Error('Unsupported null handling');
    if (
      declaration.evaluateScalar !== undefined &&
      typeof declaration.evaluateScalar !== 'function'
    )
      throw new Error('Arrow function evaluateScalar must be a function');
    functions.set(
      name,
      Object.freeze({...declaration, arguments: Object.freeze([...declaration.arguments])})
    );
  }
  return functions;
}
