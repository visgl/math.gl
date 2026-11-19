// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {physicalKey} from './signature';
import type {
  AggregateFunction,
  ArrowFunctionPackage,
  ArrowTableFunction,
  PreparedScalarFunction
} from './types';

/** Traverses packages without changing or spreading the supplied arrays. */
export function* walkArrowFunctions(
  declarations: readonly ArrowFunctionPackage[],
  ancestors = new Set<readonly ArrowFunctionPackage[]>()
): Iterable<ArrowTableFunction | PreparedScalarFunction<unknown> | AggregateFunction<unknown>> {
  if (ancestors.has(declarations)) throw new Error('Cyclic Arrow function package');
  ancestors.add(declarations);
  try {
    for (const entry of declarations) {
      if (Array.isArray(entry)) yield* walkArrowFunctions(entry, ancestors);
      else
        yield entry as
          | ArrowTableFunction
          | PreparedScalarFunction<unknown>
          | AggregateFunction<unknown>;
    }
  } finally {
    ancestors.delete(declarations);
  }
}

/** Builds one private, immutable declaration lookup per compilation. */
export function createFunctionLookup(
  declarations: readonly ArrowFunctionPackage[] = []
): ReadonlyMap<string, ArrowTableFunction> {
  const functions = new Map<string, ArrowTableFunction>();
  for (const declaration of walkArrowFunctions(declarations)) {
    const name = declaration?.name;
    if (typeof name !== 'string' || !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name))
      throw new Error('Invalid Arrow function name');
    if (
      [
        'TRY',
        'COALESCE',
        'array',
        'array_float16',
        'array_float32',
        'array_float64',
        'array_uint8',
        'PACK_UNORM8',
        'EPOCH_MS',
        'LIST_EXTRACT',
        'STRUCT_EXTRACT',
        'cast',
        'in',
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
    if (!('prototypes' in declaration)) continue;
    const previous = functions.get(name);
    const resolver = declaration.resolvePrototype;
    if (resolver !== undefined && typeof resolver !== 'function')
      throw new Error('Arrow function resolvePrototype must be a function');
    if (resolver && previous?.resolvePrototype)
      throw new Error(`Duplicate Arrow function resolver: ${name}`);
    if (!Array.isArray(declaration.prototypes) || (!declaration.prototypes.length && !resolver))
      throw new Error('Arrow functions require one or more prototypes or a resolver');
    const prototypes = [...(previous?.prototypes ?? [])];
    for (const prototype of declaration.prototypes) {
      if (
        !prototype ||
        typeof prototype !== 'object' ||
        !Array.isArray(prototype.arguments) ||
        !prototype.result ||
        typeof prototype.evaluate !== 'function'
      )
        throw new Error('Arrow prototypes require argument fields, a result field and evaluate');
      if (
        prototype.nullHandling !== undefined &&
        !['propagate', 'call'].includes(prototype.nullHandling)
      )
        throw new Error('Unsupported null handling');
      if (prototype.evaluateScalar !== undefined && typeof prototype.evaluateScalar !== 'function')
        throw new Error('Arrow function evaluateScalar must be a function');
      const key = JSON.stringify(
        prototype.arguments.map(field => [
          physicalKey(field.type),
          [...field.metadata].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        ])
      );
      if (
        prototypes.some(
          existing =>
            JSON.stringify(
              existing.arguments.map(field => [
                physicalKey(field.type),
                [...field.metadata].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
              ])
            ) === key
        )
      )
        throw new Error(`Duplicate Arrow function signature: ${name}`);
      prototypes.push(
        Object.freeze({
          ...prototype,
          arguments: Object.freeze([...prototype.arguments])
        })
      );
    }
    functions.set(
      name,
      Object.freeze({
        name,
        prototypes: Object.freeze(prototypes),
        resolvePrototype: resolver ?? previous?.resolvePrototype
      })
    );
  }
  return functions;
}
