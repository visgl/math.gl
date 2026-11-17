// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Expression} from '../expressions/index';
import {bindSQLParameter, type SQLParameters} from './sql-parameters';

/** Opaque immutable handle for validated, detached parameter values. */
export type SQLParameterSnapshot = Readonly<{kind: 'sql-parameter-snapshot'}>;
/** Private storage prevents consumers from mutating snapshot buffers. */
const snapshots = new WeakMap<SQLParameterSnapshot, ReadonlyMap<string, Expression>>();

/** Prepares values once, sharing unchanged entries with an optional previous snapshot. */
export function prepareSQLParameters(
  parameters: SQLParameters,
  options: {previous?: SQLParameterSnapshot} = {}
): SQLParameterSnapshot {
  const previous = options.previous && storage(options.previous);
  const entries = new Map<string, Expression>();
  for (const name of Object.keys(parameters)) {
    const expression = bindSQLParameter(name, {parameters});
    const old = previous?.get(name);
    entries.set(name, old && equalValue(old, expression) ? old : expression);
  }
  if (
    options.previous &&
    previous?.size === entries.size &&
    [...entries].every(([name, value]) => previous.get(name) === value)
  )
    return options.previous;
  const snapshot = Object.freeze({kind: 'sql-parameter-snapshot' as const});
  snapshots.set(snapshot, entries);
  return snapshot;
}

/** Compares all values, or only the names used by one query. Missing differs from present. */
export function areSQLParametersEqual(
  a: SQLParameterSnapshot,
  b: SQLParameterSnapshot,
  options: {names?: readonly string[]} = {}
): boolean {
  const left = storage(a);
  const right = storage(b);
  if (a === b) return true;
  if (!options.names && left.size !== right.size) return false;
  return (options.names ?? [...left.keys()]).every(
    name => left.has(name) === right.has(name) && equalValue(left.get(name), right.get(name))
  );
}

/** Returns a detached AST for binding while retaining exclusive ownership of cached buffers. */
export function snapshotParameter(snapshot: SQLParameterSnapshot, name: string): Expression {
  const expression = storage(snapshot).get(name);
  if (!expression) throw new Error(`SQL parameter ":${name}" requires a value`);
  return structuredClone(expression);
}

/** Validates opaque handles, including handles accidentally serialized across a worker boundary. */
function storage(snapshot: SQLParameterSnapshot): ReadonlyMap<string, Expression> {
  const values = snapshots.get(snapshot);
  if (!values) throw new Error('Invalid SQL parameter snapshot');
  return values;
}

/** Compares detached scalar/array AST contents and physical storage types. */
function equalValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || a.constructor !== b.constructor)
    return false;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  const left = Object.keys(a);
  const right = Object.keys(b);
  return (
    left.length === right.length &&
    left.every(key => Object.prototype.hasOwnProperty.call(b, key) && equalValue(a[key], b[key]))
  );
}

/** Lists case-sensitive placeholders in first-use order, excluding quotes, comments and casts. */
export function getSQLParameterNames(sql: string): readonly string[] {
  const names = new Set<string>();
  const tokens =
    /'(?:''|[^'])*'|"(?:""|[^"])*"|--[^\r\n]*|\/\*[\s\S]*?\*\/|::|:([A-Za-z_][A-Za-z0-9_]*)/g;
  for (const match of sql.matchAll(tokens)) if (match[1]) names.add(match[1]);
  return Object.freeze([...names]);
}
