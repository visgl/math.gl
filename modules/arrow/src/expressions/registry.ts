// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ArrowFunction} from './types';

/** Isolated registry of typed Arrow functions. Registration never changes global state. */
export class ArrowFunctionRegistry {
  private readonly functions = new Map<string, ArrowFunction>();

  /** Registers one uniquely named function. */
  registerFunction(name: string, declaration: ArrowFunction): this {
    if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name)) throw new Error('Invalid Arrow function name');
    if (
      [
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
    if (this.functions.has(name)) throw new Error(`Duplicate Arrow function: ${name}`);
    if (
      !Array.isArray(declaration.arguments) ||
      (declaration.scalar !== undefined && typeof declaration.scalar !== 'function') ||
      (typeof declaration.scalar !== 'function' && typeof declaration.kernel !== 'function') ||
      !declaration.result
    )
      throw new Error(
        'Arrow functions require argument fields, a result field and a scalar implementation or vector kernel'
      );
    if (
      declaration.nullHandling !== undefined &&
      !['propagate', 'call'].includes(declaration.nullHandling)
    )
      throw new Error('Unsupported null handling');
    if (declaration.kernel !== undefined && typeof declaration.kernel !== 'function')
      throw new Error('Arrow function kernel must be a function');
    this.functions.set(
      name,
      Object.freeze({...declaration, arguments: Object.freeze([...declaration.arguments])})
    );
    return this;
  }

  /** Returns a registered declaration, or undefined. */
  getFunction(name: string): ArrowFunction | undefined {
    return this.functions.get(name);
  }
}
