// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import * as arrow from 'apache-arrow';
import {compileArrowExpression, compileArrowPredicate} from '../src/expressions/index.ts';
import {parseUTF8Number, compareUTF8} from '../src/utf8/index.ts';
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
  const expressionBatch = makeTable().batches[0].slice(1, 3);
  assert.deepEqual([...compileArrowExpression('score + 1', {inputSchema: expressionBatch.schema}).evaluate(expressionBatch)], [21, 31]);
  assert.deepEqual([...compileArrowPredicate({op: '=', args: [{property: 'name'}, 'gamma']}, {inputSchema: expressionBatch.schema}).evaluate(expressionBatch)], [null, true]);

  // The documented Dictionary<Utf8> usage works on each supported Arrow runtime.
  const encodedNumbers = arrow.vectorFromArray(['12.5', '7', '12.5', null], new arrow.Dictionary(new arrow.Utf8(), new arrow.Int8()));
  const numberData = encodedNumbers.slice(1).data[0];
  const dictionaryData = numberData.dictionary.data[0];
  const firstIndex = numberData.values[0];
  const secondIndex = numberData.values[1];
  assert.equal(parseUTF8Number(dictionaryData.values, dictionaryData.valueOffsets[firstIndex], dictionaryData.valueOffsets[firstIndex + 1]), 7);
  assert.equal(parseUTF8Number(dictionaryData.values, dictionaryData.valueOffsets[secondIndex], dictionaryData.valueOffsets[secondIndex + 1]), 12.5);
  assert.equal(compareUTF8(dictionaryData.values, dictionaryData.valueOffsets[firstIndex], dictionaryData.valueOffsets[firstIndex + 1], dictionaryData.values, dictionaryData.valueOffsets[secondIndex], dictionaryData.valueOffsets[secondIndex + 1]), 1);
  assert.equal(numberData.getValid(2), false);

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
  for (const mode of ['dense', 'sparse']) {
    const fields = [new arrow.Field('integer', new arrow.Int32()), new arrow.Field('text', new arrow.Utf8())];
    const type = mode === 'dense' ? new arrow.DenseUnion([4, 9], fields) : new arrow.SparseUnion([4, 9], fields);
    const integer = arrow.vectorFromArray(mode === 'dense' ? [7] : [7, null, null], new arrow.Int32());
    const text = arrow.vectorFromArray(mode === 'dense' ? ['hello', null] : [null, 'hello', null], new arrow.Utf8());
    const vector = new arrow.Vector([new arrow.Data(type, 0, 3, 0, {
      [arrow.BufferType.TYPE]: new Int8Array([4, 9, 9]),
      [arrow.BufferType.OFFSET]: mode === 'dense' ? new Int32Array([0, 0, 1]) : undefined
    }, [integer.data[0], text.data[0]])]);
    const unionTable = new arrow.Table({mixed: vector});
    const snapshot = new IndexedArrowTable(unionTable, [2, 1, 0, 1]).materializeArrowTable();
    assert.deepEqual(Array.from(snapshot.getChild('mixed')), [null, 'hello', 7, 'hello']);
    assert.deepEqual(Array.from(hydrateArrowTable(structuredClone(dehydrateArrowTable(unionTable))).getChild('mixed')), [7, 'hello', null]);
  }
  const buffer = Buffer.from([1, 2, 3]);
  const bufferData = new arrow.Data(new arrow.Uint8(), 0, 3, 0, {[arrow.BufferType.DATA]: buffer});
  const bufferVector = new arrow.Vector([bufferData]);
  const bufferCopy = splitArrowBuffers(bufferVector, {copy: 'all'});
  bufferCopy.data[0].values[0] = 99;
  assert.equal(buffer[0], 1);
  assert.notEqual(bufferCopy.data[0].values.buffer, buffer.buffer);
  assert.equal(bufferCopy.data[0].values.buffer.byteLength, 3);
  const bufferTable = new arrow.Table({value: bufferVector});
  const bufferPayload = dehydrateArrowTable(bufferTable, {copy: 'all'});
  const bufferValues = bufferPayload.batches[0].children[0].buffers[arrow.BufferType.DATA];
  const bufferClone = structuredClone(bufferPayload, {transfer: [bufferValues.buffer]});
  assert.deepEqual(Array.from(hydrateArrowTable(bufferClone).getChild('value').toArray()), [1, 2, 3]);
  assert.equal(buffer.byteLength, 3);
  const optionalTypes = {...arrow};
  if (optionalTypes.Utf8View) {
    const values = ['long value '.repeat(8), null, 'short'];
    const view = arrow.vectorFromArray(values, new optionalTypes.Utf8View());
    const viewTable = new arrow.Table({value: view});
    const copied = splitArrowBuffers(viewTable, {copy: 'all'});
    assert.deepEqual(copied.getChild('value').toArray(), values);
    assert.deepEqual(new IndexedArrowTable(viewTable, [2, 0, 1]).materializeArrowTable().getChild('value').toArray(), [values[2], values[0], values[1]]);
    assert.notEqual(copied.getChild('value').data[0].variadicBuffers[0].buffer, view.data[0].variadicBuffers[0].buffer);
    assert.deepEqual(hydrateArrowTable(structuredClone(dehydrateArrowTable(viewTable))).getChild('value').toArray(), values);
  }
  if (optionalTypes.LargeList) {
    const vector = arrow.vectorFromArray([[1, 2], null], new optionalTypes.LargeList(new arrow.Field('value', new arrow.Int32())));
    const large = new arrow.Table({value: vector});
    assert.deepEqual(readRows(hydrateArrowTable(structuredClone(dehydrateArrowTable(large)))), readRows(large));
    assert.deepEqual(readRows(new IndexedArrowTable(large, [1, 0]).materializeArrowTable()), readRows(large).reverse());
  }
  return serializeArrowTableToIPC(table).data;
}

/** Checks standard IPC interchange with bytes produced by any supported runtime. */
export function checkArrowIPC(bytes) {
  assert.deepEqual(readRows(deserializeArrowTableFromIPC(bytes)), readRows(makeTable()));
}
