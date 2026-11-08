// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as arrow from 'apache-arrow';
import {
  dehydrateArrowTable,
  hydrateArrowTable,
  serializeArrowTableToIPC,
  deserializeArrowTableFromIPC,
  type DehydratedArrowTable
} from '@math.gl/core/arrow';

/** Builds a small nullable, nested, dictionary-encoded table with metadata. */
function createTransportTable(): arrow.Table {
  const columns = {
    name: arrow.vectorFromArray(['alpha', null, 'gamma'], new arrow.Utf8()),
    enabled: arrow.vectorFromArray([true, null, false], new arrow.Bool()),
    category: arrow.vectorFromArray(
      ['first', 'second', 'first'],
      new arrow.Dictionary(new arrow.Utf8(), new arrow.Int8(), 42, true)
    ),
    points: arrow.vectorFromArray(
      [[1, 2], null, [3]],
      new arrow.List(new arrow.Field('value', new arrow.Int32()))
    ),
    detail: arrow.vectorFromArray(
      [{count: 1}, null, {count: 3}],
      new arrow.Struct([new arrow.Field('count', new arrow.Int32())])
    )
  };
  const fields = Object.entries(columns).map(
    ([name, column]) => new arrow.Field(name, column.type, true, new Map([['field', name]]))
  );
  const schema = new arrow.Schema(fields, new Map([['source', 'transport test']]));
  return new arrow.Table(schema, columns);
}

test('Arrow transport round trips cloned nested and dictionary buffers across batches', () => {
  const source = createTransportTable();
  const table = source.concat(source.slice(1));
  const payload = dehydrateArrowTable(table);
  expect(payload.schema).toBeInstanceOf(Uint8Array);
  const hydrated = hydrateArrowTable(structuredClone(payload));
  expect(hydrated).toBeInstanceOf(arrow.Table);
  expect(hydrated.batches).toHaveLength(table.batches.length);
  expect(JSON.parse(JSON.stringify(hydrated.toArray()))).toEqual(
    JSON.parse(JSON.stringify(table.toArray()))
  );
  expect(hydrated.schema.metadata).toEqual(table.schema.metadata);
  expect(hydrated.schema.fields.map(field => field.metadata)).toEqual(
    table.schema.fields.map(field => field.metadata)
  );
  expect((hydrated.schema.fields[2]!.type as arrow.Dictionary).id).toBe(42);
  expect((hydrated.schema.fields[2]!.type as arrow.Dictionary).isOrdered).toBe(true);
});

test('Arrow transport preserves sliced bitmap offsets and does not mutate source buffers', () => {
  const table = createTransportTable().slice(1, 3);
  const hydrated = hydrateArrowTable(structuredClone(dehydrateArrowTable(table, {copy: 'all'})));
  expect(JSON.parse(JSON.stringify(hydrated.toArray()))).toEqual(
    JSON.parse(JSON.stringify(table.toArray()))
  );
  expect(hydrated.getChild('enabled')!.toArray()).toEqual(table.getChild('enabled')!.toArray());
  expect(table.numRows).toBe(2);
});

test('Arrow transport can transfer all owned buffers without detaching the source', () => {
  const table = arrow.tableFromArrays({value: new Float64Array([1, 2, 3])});
  const payload = dehydrateArrowTable(table, {copy: 'all'});
  const values = payload.batches[0]!.children[0]!.buffers[arrow.BufferType.DATA]!;
  const cloned = structuredClone(payload, {
    transfer: [payload.schema.buffer as ArrayBuffer, values.buffer as ArrayBuffer]
  });
  expect(values.byteLength).toBe(0);
  expect(Array.from(hydrateArrowTable(cloned).getChild('value')!.toArray())).toEqual([1, 2, 3]);
  expect(Array.from(table.getChild('value')!.toArray())).toEqual([1, 2, 3]);
});

test('Arrow transport no-copy payload aliases complete source buffers', () => {
  const values = new Float64Array([1, 2]);
  const table = arrow.tableFromArrays({value: values});
  const payload = dehydrateArrowTable(table, {copy: 'none'});
  expect(payload.batches[0]!.children[0]!.buffers[arrow.BufferType.DATA]).toBe(
    table.getChild('value')!.data[0]!.values
  );
  const hydrated = hydrateArrowTable(payload);
  expect(hydrated.getChild('value')!.data[0]!.values).toBe(
    table.getChild('value')!.data[0]!.values
  );
});

test('Arrow transport preserves empty schemas, nested type parameters, timezone, and unions', () => {
  const fields = [
    new arrow.Field('time', new arrow.TimestampNanosecond('UTC'), false),
    new arrow.Field('decimal', new arrow.Decimal(2, 20, 128)),
    new arrow.Field(
      'fixed',
      new arrow.FixedSizeList(2, new arrow.Field('value', new arrow.Float32(), false))
    ),
    new arrow.Field(
      'union',
      new arrow.DenseUnion(
        [4, 9],
        [new arrow.Field('text', new arrow.Utf8()), new arrow.Field('integer', new arrow.Int32())]
      )
    ),
    new arrow.Field(
      'map',
      new arrow.Map_(
        new arrow.Field(
          'entries',
          new arrow.Struct([
            new arrow.Field('key', new arrow.Utf8(), false),
            new arrow.Field('value', new arrow.Int32())
          ]),
          false
        ),
        true
      )
    )
  ];
  const schema = new arrow.Schema(
    fields,
    new Map([['empty', 'yes']]),
    undefined,
    arrow.MetadataVersion.V4
  );
  const table = new arrow.Table(schema, []);
  const hydrated = hydrateArrowTable(structuredClone(dehydrateArrowTable(table)));
  expect(hydrated.numRows).toBe(0);
  expect(hydrated.schema.toString()).toBe(table.schema.toString());
  expect(hydrated.schema.metadataVersion).toBe(arrow.MetadataVersion.V4);
  expect((hydrated.schema.fields[0]!.type as arrow.Timestamp).timezone).toBe('UTC');
  expect(Array.from((hydrated.schema.fields[3]!.type as arrow.DenseUnion).typeIds)).toEqual([4, 9]);
  expect(hydrated.schema.metadata).toEqual(schema.metadata);
});

test('Arrow transport rejects unsupported protocol revisions', () => {
  const payload = dehydrateArrowTable(createTransportTable());
  expect(() =>
    hydrateArrowTable({...payload, version: 2} as unknown as DehydratedArrowTable)
  ).toThrow(/Unsupported/);
});

test('Arrow IPC accepts envelopes, typed arrays, and ArrayBuffers', () => {
  const table = createTransportTable();
  const payload = serializeArrowTableToIPC(table);
  for (const input of [payload, payload.data, payload.data.slice().buffer as ArrayBuffer]) {
    const hydrated = deserializeArrowTableFromIPC(input);
    expect(JSON.parse(JSON.stringify(hydrated.toArray()))).toEqual(
      JSON.parse(JSON.stringify(table.toArray()))
    );
    expect(hydrated.schema.metadata).toEqual(table.schema.metadata);
  }
});
