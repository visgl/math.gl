// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ExpressionFunction, ExpressionFunctionLibrary} from './function-libraries';

const FUNCTION_NAME_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const DISALLOWED_FUNCTION_NAMES = new Set(['__proto__', 'prototype', 'constructor']);

/**
 * Options for registering functions with an {@link ExpressionFunctionRegistry}.
 */
export type FunctionRegistrationOptions = {
  /**
   * Replace an existing function with the same name.
   *
   * @defaultValue false
   */
  replace?: boolean;
};

/**
 * An isolated collection of named functions available to expression evaluators.
 *
 * @remarks
 * Registries are instance scoped. Registering a function does not affect other
 * registries or evaluators that do not receive the registry.
 *
 * Function names must be valid JavaScript-style identifiers so they can be
 * called directly from JSEP expressions.
 *
 * @example
 * ```ts
 * const registry = new ExpressionFunctionRegistry()
 *   .registerFunction('double', (value) => value * 2)
 *   .registerFunctions(BASIC_MATH_FUNCTION_LIBRARY);
 *
 * const evaluate = compile('double(round(value))', {registry});
 * evaluate({value: 2.4});
 * ```
 */
export class ExpressionFunctionRegistry {
  private readonly functions = Object.create(null) as ExpressionFunctionLibrary;

  /**
   * Creates a function registry.
   *
   * @param functionTables - Function tables to register in order.
   * @throws If a table contains an invalid or duplicate function name.
   */
  constructor(functionTables: readonly ExpressionFunctionLibrary[] = []) {
    for (const functionTable of functionTables) {
      this.registerFunctions(functionTable);
    }
  }

  /**
   * Registers one named function.
   *
   * @param name - Identifier used to call the function from an expression.
   * @param fn - JavaScript function invoked with evaluated expression arguments.
   * @param options - Duplicate registration behavior.
   * @returns This registry.
   * @throws If the name is invalid, the value is not a function, or the name is
   * already registered and replacement was not requested.
   */
  registerFunction(
    name: string,
    fn: ExpressionFunction,
    options: FunctionRegistrationOptions = {}
  ): this {
    validateFunction(name, fn);
    if (this.hasFunction(name) && !options.replace) {
      throw new Error(`Expression function "${name}" is already registered.`);
    }
    this.functions[name] = fn;
    return this;
  }

  /**
   * Registers all entries in a function table.
   *
   * @param functionTable - Map from expression identifiers to JavaScript functions.
   * @param options - Duplicate registration behavior.
   * @returns This registry.
   * @throws If any entry is invalid or conflicts with an existing registration.
   *
   * @remarks
   * Validation is atomic: no entries are registered when any entry is invalid.
   */
  registerFunctions(
    functionTable: ExpressionFunctionLibrary,
    options: FunctionRegistrationOptions = {}
  ): this {
    const entries = Object.entries(functionTable);
    const names = new Set<string>();

    for (const [name, fn] of entries) {
      validateFunction(name, fn);
      if (names.has(name) || (this.hasFunction(name) && !options.replace)) {
        throw new Error(`Expression function "${name}" is already registered.`);
      }
      names.add(name);
    }

    for (const [name, fn] of entries) {
      this.functions[name] = fn;
    }
    return this;
  }

  /**
   * Removes a registered function.
   *
   * @param name - Function name to remove.
   * @returns `true` when a function was removed.
   */
  unregisterFunction(name: string): boolean {
    if (!this.hasFunction(name)) {
      return false;
    }
    return delete this.functions[name];
  }

  /**
   * Tests whether a function is registered.
   *
   * @param name - Function name to inspect.
   * @returns `true` when the registry contains the name.
   */
  hasFunction(name: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.functions, name);
  }

  /**
   * Returns a registered function.
   *
   * @param name - Function name to retrieve.
   * @returns The registered function, or `undefined`.
   */
  getFunction(name: string): ExpressionFunction | undefined {
    return this.functions[name];
  }

  /**
   * Returns an immutable snapshot of all registered functions.
   *
   * @returns A frozen function table.
   */
  getFunctionTable(): Readonly<ExpressionFunctionLibrary> {
    return Object.freeze({...this.functions});
  }
}

/** Validates one registry entry. */
function validateFunction(name: string, fn: ExpressionFunction): void {
  if (!FUNCTION_NAME_PATTERN.test(name) || DISALLOWED_FUNCTION_NAMES.has(name)) {
    throw new Error(`Invalid expression function name "${name}".`);
  }
  if (typeof fn !== 'function') {
    throw new TypeError(`Expression function "${name}" must be a function.`);
  }
}
