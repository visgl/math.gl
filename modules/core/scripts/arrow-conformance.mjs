// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import * as arrow from 'apache-arrow';
import {
  IndexedArrowTable,
  IndexedArrowVector,
  MappedArrowTable,
  validateArrowTableSchema,
  renameArrowColumns,
  splitArrowBuffers,
  dehydrateArrowTable,
  hydrateArrowTable,
  serializeArrowTableToIPC,
  deserializeArrowTableFromIPC
} from '../src/arrow/index.ts';

/** Builds a nullable, nested, dictionary-encoded fixture for each Arrow runtime. */
function makeTable() {
  const columns = {
    name: arrow.vectorFromArray(['alpha', null, 'gamma']),
    score: arrow.vectorFromArray([10, 20, 30], new arrow.Int32()),
    points: arrow.vectorFromArray([[1, 2], null, [3]], new arrow.List(new arrow.Field('value', new arrow.Int32())))
  };
  const fields = Object.entries(columns).map(([name, vector]) => new arrow.Field(name, vector.type, true, new Map([['field', name]])));
  return new arrow.Table(new arrow.Schema(fields, new Map([['source', 'conformance']])), columns);
}

/** Returns canonical row values, excluding runtime-specific Arrow type prototypes. */
function readRows(table) {
  return JSON.parse(JSON.stringify(table.toArray()));
}

/** Exercises the generic Arrow APIs against one independently bundled runtime. */
export function checkArrowConformance() {
  const table = makeTable();
  assert.equal(validateArrowTableSchema(table, table.schema), table);
  const selected = new IndexedArrowTable(table, [2, 0, 2]);
  assert.deepEqual(selected.getChild('score').toArray(), [30, 10, 30]);
  assert.deepEqual(new IndexedArrowVector(table.getChild('score'), [1, 0]).toArray(), [20, 10]);
  assert.equal(selected.materializeArrowTable().numRows, 3);
  assert.equal(new MappedArrowTable(table, new Map([['last', 2]])).getByKey('last').score, 30);
  const target = new arrow.Schema([new arrow.Field('value', new arrow.Int32(), true)]);
  const renamed = renameArrowColumns(table, table.schema, target, {score: 'value'});
  assert.deepEqual(Array.from(renamed.getChild('value').toArray()), [10, 20, 30]);
  assert.deepEqual(renamed.schema.metadata, table.schema.metadata);
  const combined = table.concat(table.slice(1));
  const payload = dehydrateArrowTable(combined, {copy: 'all'});
  const hydrated = hydrateArrowTable(structuredClone(payload));
  assert.deepEqual(readRows(hydrated), readRows(combined));
  assert.deepEqual(hydrated.schema.metadata, table.schema.metadata);
  assert.deepEqual(hydrated.schema.fields[0].metadata, table.schema.fields[0].metadata);
  const sliced = table.slice(1, 3);
  assert.deepEqual(readRows(hydrateArrowTable(structuredClone(dehydrateArrowTable(sliced)))), readRows(sliced));
  for (const value of [sliced, sliced.batches[0], sliced.getChild('score'), sliced.getChild('score').data[0]]) {
    assert.notEqual(splitArrowBuffers(value, {copy: 'all'}), value);
  }
  const owned = dehydrateArrowTable(table, {copy: 'all'});
  const values = owned.batches[0].children[1].buffers[arrow.BufferType.DATA];
  const transferred = structuredClone(owned, {transfer: [owned.schema.buffer, values.buffer]});
  assert.equal(values.byteLength, 0);
  assert.deepEqual(Array.from(hydrateArrowTable(transferred).getChild('score').toArray()), [10, 20, 30]);
  assert.deepEqual(Array.from(table.getChild('score').toArray()), [10, 20, 30]);
  return serializeArrowTableToIPC(table).data;
}

/** Checks standard IPC interchange with bytes produced by any supported runtime. */
export function checkArrowIPC(bytes) {
  assert.deepEqual(readRows(deserializeArrowTableFromIPC(bytes)), readRows(makeTable()));
}
