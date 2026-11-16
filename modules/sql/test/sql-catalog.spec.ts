// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {tableFromArrays, Schema, Field, Struct, Int32} from 'apache-arrow';
import {SQLCatalog, type SQLTableDefinition} from '@math.gl/sql';

const trips = tableFromArrays({
  id: new Int32Array([1, 2]),
  speed: new Int32Array([10, 20])
});
const zones = tableFromArrays({id: new Int32Array([2]), name: ['north']});
const rows = (table: ReturnType<typeof tableFromArrays>) =>
  table.toArray().map(row => row.toJSON());

test('catalog definitions support loader and renderer adapters with data as default namespace', () => {
  const definitions: SQLTableDefinition[] = [
    {name: 'trips', source: trips, description: 'Loaded trips'},
    {schema: 'lookup', name: 'zones', source: zones}
  ];
  const catalog = new SQLCatalog({
    tables: definitions,
    primaryTable: 'trips'
  });
  expect(catalog.listSchemas()).toEqual(['data', 'lookup']);
  expect(rows(catalog.query('SELECT speed WHERE speed > 10'))).toEqual([{speed: 20}]);
  expect(rows(catalog.query('SELECT name FROM lookup.zones'))).toEqual([{name: 'north'}]);
  expect(
    rows(catalog.query('SELECT t.id, z.name FROM data.trips t JOIN lookup.zones z ON t.id = z.id'))
  ).toEqual([{id: 2, 'z.name': 'north'}]);
  expect(catalog.describeTable('trips')).toMatchObject({
    schema: 'data',
    description: 'Loaded trips',
    primary: true,
    external: false,
    numRows: 2,
    arrowSchema: trips.schema
  });
  definitions[0]!.name = 'changed';
  expect(catalog.describeTable('trips').name).toBe('trips');
});

test('literal dotted names, quoted schemas, case and duplicate registration remain unambiguous', () => {
  const catalog = new SQLCatalog({tables: {'a.b': trips, Trips: zones}});
  catalog.registerTable({schema: 'a', name: 'b', source: zones});
  catalog.registerTable({schema: 'a.b', name: 'q"r', source: trips});
  expect(catalog.query('SELECT * FROM "a.b"').numRows).toBe(2);
  expect(catalog.query('SELECT * FROM a.b').numRows).toBe(1);
  expect(catalog.query('SELECT * FROM "a.b"."q""r"').numRows).toBe(2);
  expect(() => catalog.query('SELECT * FROM trips')).toThrow('Unknown SQL table');
  expect(() => catalog.registerTable({name: 'Trips', source: trips})).toThrow('already registered');
  catalog.registerTable({name: 'Trips', source: trips}, {replace: true});
  expect(catalog.query('SELECT * FROM Trips').numRows).toBe(2);
  expect(() => catalog.registerSchema(' ')).toThrow('non-empty');
  expect(() => catalog.listTables({schema: 'missing'})).toThrow('Unknown SQL schema');
});

test('primary lifecycle and constant SELECT semantics', () => {
  const catalog = new SQLCatalog({tables: new Map([['trips', trips]])});
  expect(rows(catalog.query('SELECT 1 AS one'))).toEqual([{one: 1}]);
  expect(rows(catalog.query('SELECT COUNT(*) AS n'))).toEqual([{n: 1n}]);
  expect(() => catalog.query('SELECT speed')).toThrow('require a primary table');
  expect(() => catalog.query('SELECT *')).toThrow('requires a primary table');
  expect(() => catalog.query('SELECT ""')).toThrow();
  catalog.setPrimaryTable('trips');
  expect(catalog.query('SELECT 1 AS one').numRows).toBe(2);
  expect(() => catalog.setPrimaryTable('unknown')).toThrow('Unknown SQL table');
  catalog.setPrimaryTable();
  expect(catalog.query('SELECT 1 AS one').numRows).toBe(1);
  catalog.setPrimaryTable('trips');
  expect(catalog.removeTable('trips')).toBe(true);
  expect(catalog.query('SELECT 1 AS one').numRows).toBe(1);
  expect(catalog.removeTable('trips')).toBe(false);
});

test('schema discovery has stable types and never materializes external data', async () => {
  const read = vi.fn(async () => trips);
  const getSchema = vi.fn(async () => trips.schema);
  const catalog = new SQLCatalog({tables: {remote: {read, getSchema}}});
  catalog.registerSchema('empty');
  expect(rows(catalog.query('SHOW SCHEMAS'))).toEqual([
    {schema_name: 'data'},
    {schema_name: 'empty'}
  ]);
  const empty = catalog.query('SHOW TABLES FROM empty');
  const populated = catalog.query('SHOW TABLES');
  expect(empty.schema.toString()).toBe(populated.schema.toString());
  expect(rows(populated)).toEqual([{schema_name: 'data', table_name: 'remote'}]);
  expect(catalog.describeTable('remote').arrowSchema).toBeUndefined();
  expect(getSchema).not.toHaveBeenCalled();
  expect(() => catalog.query('DESCRIBE remote')).toThrow('Schema unavailable');
  expect((await catalog.queryAsync('DESCRIBE data.remote')).numRows).toBe(2);
  expect(getSchema).toHaveBeenCalledOnce();
  expect(read).not.toHaveBeenCalled();
  expect(() => catalog.query('SHOW TABLES garbage')).toThrow();
  expect(() => catalog.query('SHOW UNKNOWN')).toThrow();
});

test('external sources read once per query and only when referenced', async () => {
  const read = vi.fn(async () => trips);
  const unused = vi.fn(async () => zones);
  const catalog = new SQLCatalog({
    tables: {remote: {read}, unused: {read: unused}}
  });
  expect(() => catalog.query('SELECT * FROM remote')).toThrow('queryAsync');
  expect(
    (await catalog.queryAsync('SELECT a.id FROM remote a JOIN remote b ON a.id = b.id')).numRows
  ).toBe(2);
  expect(read).toHaveBeenCalledOnce();
  expect(
    (await catalog.queryAsync('SELECT id FROM remote UNION ALL SELECT id FROM remote')).numRows
  ).toBe(4);
  expect(read).toHaveBeenCalledTimes(2);
  expect(unused).not.toHaveBeenCalled();
  expect((await catalog.queryAsync('SHOW TABLES')).numRows).toBe(2);
});

test('query captures all definitions before the first asynchronous read', async () => {
  const catalog = new SQLCatalog();
  catalog.registerTable({
    name: 'a',
    source: {
      async read() {
        catalog.registerTable({name: 'b', source: trips}, {replace: true});
        return trips;
      }
    }
  });
  catalog.registerTable({name: 'b', source: zones});
  expect((await catalog.queryAsync('SELECT a.id FROM a JOIN b ON a.id = b.id')).numRows).toBe(1);
  expect(catalog.describeTable('b').numRows).toBe(2);
});

test('declared schemas are enforced and source errors retain their cause', async () => {
  const failure = new Error('offline');
  const catalog = new SQLCatalog({
    tables: [
      {
        name: 'wrong',
        arrowSchema: zones.schema,
        source: {read: async () => trips}
      },
      {
        name: 'failed',
        source: {
          read: async () => {
            throw failure;
          }
        }
      },
      {
        name: 'badSchema',
        source: {
          read: async () => trips,
          getSchema: async () => {
            throw failure;
          }
        }
      },
      {name: 'invalid', source: {read: async () => null as never}}
    ]
  });
  await expect(catalog.queryAsync('SELECT * FROM wrong')).rejects.toThrow('data.wrong');
  await expect(catalog.queryAsync('SELECT * FROM failed')).rejects.toMatchObject({cause: failure});
  await expect(catalog.describeTableAsync('badSchema')).rejects.toMatchObject({
    cause: failure
  });
  await expect(catalog.queryAsync('SELECT * FROM invalid')).rejects.toThrow('Arrow Table');
  expect(() => catalog.registerTable({name: 'invalid2', source: {} as never})).toThrow('requires');
  expect(() =>
    catalog.registerTable({
      name: 'invalid3',
      source: trips,
      arrowSchema: zones.schema
    })
  ).toThrow('Unexpected Arrow schema');
});

test('cancellation prevents loading and is checked after materialization', async () => {
  const controller = new AbortController();
  const read = vi.fn(async () => {
    controller.abort();
    return trips;
  });
  const catalog = new SQLCatalog({tables: {remote: {read}}});
  await expect(
    catalog.queryAsync('SELECT * FROM remote', {signal: controller.signal})
  ).rejects.toThrow();
  expect(read).toHaveBeenCalledOnce();
  await expect(
    catalog.queryAsync('SELECT * FROM remote', {signal: controller.signal})
  ).rejects.toThrow();
  expect(read).toHaveBeenCalledOnce();
  expect(() => catalog.query('SHOW TABLES', {signal: controller.signal})).toThrow();
});

test('nested Arrow types survive metadata inspection and notifications unsubscribe', async () => {
  const schema = new Schema([
    new Field('nested', new Struct([new Field('id', new Int32(), true)]), true)
  ]);
  const catalog = new SQLCatalog({defaultSchema: 'custom'});
  const listener = vi.fn();
  const unsubscribe = catalog.subscribe(listener);
  catalog.registerTable({
    name: 'nested',
    arrowSchema: schema,
    source: {read: async () => trips}
  });
  expect((await catalog.describeTableAsync('nested')).arrowSchema).toBe(schema);
  catalog.setPrimaryTable('nested');
  catalog.registerSchema('empty');
  catalog.registerSchema('empty');
  expect(listener).toHaveBeenCalledTimes(3);
  unsubscribe();
  catalog.removeTable('nested');
  expect(listener).toHaveBeenCalledTimes(3);
  expect(catalog.listSchemas()).toEqual(['data', 'custom', 'empty']);
});
