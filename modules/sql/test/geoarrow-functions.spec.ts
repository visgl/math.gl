// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Binary,
  DataType,
  Field,
  LargeBinary,
  Schema,
  Table,
  tableFromIPC,
  tableToIPC,
  vectorFromArray,
  type Vector
} from 'apache-arrow';
import {expect, test} from 'vitest';
import {
  GeoArrowBuilder,
  makeArrowVectorFromGeoArrowColumn,
  makeGeoArrowColumnFromArrowVector,
  materializeGeoArrowRows,
  parseWKB,
  parseWKT,
  writeWKB
} from '@math.gl/core/arrow';
import {compileArrowExpression} from '@math.gl/sql/arrow';
import {createGeoArrowConversionFunctions} from '@math.gl/sql/geoarrow-functions';
import {queryArrowSQL, queryArrowTableInBatches} from '@math.gl/sql/query';

/** Registers a shared conversion package for the fixtures. */
const functions = [createGeoArrowConversionFunctions()];

const extensionName = 'ARROW:extension:name';
const extensionMetadata = 'ARROW:extension:metadata';

/** Creates a geometry table with extension and CRS metadata. */
function geometryTable(vector: Vector, encoding = 'geoarrow.wkb'): Table {
  const metadata = new Map([
    [extensionName, encoding],
    [extensionMetadata, '{"crs":"OGC:CRS84"}']
  ]);
  return new Table(new Schema([new Field('geometry', vector.type, true, metadata)]), {
    geometry: vector
  });
}

/** Serializes text fixtures for the WKB input column. */
function wkb(...values: (string | null)[]) {
  return vectorFromArray(
    values.map(value => (value === null ? null : writeWKB(parseWKT(value)))),
    new Binary()
  );
}

/** Executes a projection with the conversion functions enabled. */
function select(table: Table, expression: string, packages = functions): Table {
  return queryArrowSQL(
    `SELECT ${expression} AS result FROM features`,
    new Map([['features', table]]),
    {
      functions: packages
    }
  );
}

test.each([
  ['POINT (1 2)', 'POINT'],
  ['LINESTRING (1 2, 3 4)', 'LINESTRING'],
  ['POLYGON ((0 0, 4 0, 0 4, 0 0))', 'POLYGON'],
  ['MULTIPOINT ((1 2), (3 4))', 'MULTIPOINT'],
  ['MULTILINESTRING ((1 2, 3 4))', 'MULTILINESTRING'],
  ['MULTIPOLYGON (((0 0, 4 0, 0 4, 0 0)))', 'MULTIPOLYGON']
])('round-trips %s through its specialized encoding and a dense union', (text, family) => {
  const table = geometryTable(wkb(text, null));
  const native = select(table, `GEOARROW_TO_${family}(geometry)`);
  expect(native.schema.fields[0]!.metadata.get(extensionName)).toBe(
    `geoarrow.${family.toLowerCase()}`
  );
  const roundTrip = select(
    table,
    `GEOARROW_TO_WKB(GEOARROW_TO_${family}(GEOARROW_TO_UNION(GEOARROW_TO_${family}(geometry))))`
  );
  const bytes = roundTrip.getChild('result')!;
  expect(parseWKB(bytes.get(0)).geometry).toEqual(parseWKT(text));
  expect(bytes.get(1)).toBeNull();
  expect(roundTrip.schema.fields[0]!.metadata).toEqual(table.schema.fields[0]!.metadata);
});

test('reuses WKB buffers, native coordinates, list offsets and existing union selectors', () => {
  const bytes = wkb('POINT (3 4)', null).slice(1);
  const wkbResult = select(geometryTable(bytes), 'GEOARROW_TO_WKB(geometry)').getChild(
    'result'
  )!;
  expect(wkbResult.data[0]!.values.buffer).toBe(bytes.data[0]!.values.buffer);
  expect(wkbResult.data[0]!.nullBitmap.buffer).toBe(bytes.data[0]!.nullBitmap.buffer);

  const vector = makeArrowVectorFromGeoArrowColumn(
    GeoArrowBuilder.build(
      [parseWKT('LINESTRING (1 2, 3 4)'), null, parseWKT('LINESTRING (5 6, 7 8)')],
      {encoding: 'geoarrow.linestring'}
    )
  ).slice(1);
  const wrapped = select(
    geometryTable(vector, 'geoarrow.linestring'),
    'GEOARROW_TO_UNION(geometry)'
  ).getChild('result')!;
  const [data] = wrapped.data;
  const line = data.children[4]!;
  expect(line.valueOffsets.buffer).toBe(vector.data[0]!.valueOffsets.buffer);
  expect(line.children[0]!.children[0]!.values.buffer).toBe(
    vector.data[0]!.children[0]!.children[0]!.values.buffer
  );
  expect(line.nullBitmap.buffer).toBe(vector.data[0]!.nullBitmap.buffer);
  expect(wrapped.isValid(0)).toBe(false);
  const unwrapped = select(
    geometryTable(wrapped, 'geoarrow.geometry'),
    'GEOARROW_TO_LINESTRING(geometry)'
  ).getChild('result')!;
  expect(unwrapped.data[0]!.valueOffsets.buffer).toBe(line.valueOffsets.buffer);
  expect(unwrapped.data[0]!.nullBitmap.buffer).toBe(line.nullBitmap.buffer);
  const identity = select(
    geometryTable(wrapped, 'geoarrow.geometry'),
    'GEOARROW_TO_UNION(geometry)'
  ).getChild('result')!;
  expect(identity.data[0]!.typeIds.buffer).toBe(data.typeIds.buffer);
  expect(identity.data[0]!.valueOffsets.buffer).toBe(data.valueOffsets.buffer);
});

test('streams batches with independent geometry families and dimensions under one IPC schema', async () => {
  const input = geometryTable(wkb('POINT Z (1 2 3)', 'LINESTRING M (3 4 5, 6 7 8)', null));
  let pulled = 0;
  /** Supplies a batch only when the stream advances. */
  function* source() {
    for (let row = 0; row < input.numRows; row++) {
      pulled++;
      yield input.slice(row, row + 1).batches[0]!;
    }
  }
  const output = [];
  for await (const batch of queryArrowTableInBatches(source(), input.schema, {
    select: [{expression: 'GEOARROW_TO_UNION(geometry)', as: 'result'}],
    functions
  })) {
    expect(pulled).toBe(output.length + 1);
    output.push(batch);
  }
  const schema = output[0]!.schema;
  expect(DataType.isDenseUnion(schema.fields[0]!.type)).toBe(true);
  expect(output.map(batch => batch.schema.toString())).toEqual([
    schema.toString(),
    schema.toString(),
    schema.toString()
  ]);
  const ipc = tableFromIPC(tableToIPC(new Table(schema, output)));
  const restored = makeGeoArrowColumnFromArrowVector(ipc.getChild('result')!, {
    field: ipc.schema.fields[0]
  });
  expect(materializeGeoArrowRows(restored)).toEqual([
    parseWKT('POINT Z (1 2 3)'),
    parseWKT('LINESTRING M (3 4 5, 6 7 8)'),
    null
  ]);
});

test('masks invalid input without decoding it and builds typed empty unions', () => {
  const bytes = vectorFromArray(
    [new Uint8Array([0]), writeWKB(parseWKT('POINT (1 2)'))],
    new Binary()
  );
  const table = geometryTable(bytes);
  const expression = compileArrowExpression('GEOARROW_TO_UNION(geometry)', {
    inputSchema: table.schema,
    functions
  });
  const partial = expression.evaluateTable(table, {
    activeRows: Uint8Array.of(0, 1)
  });
  expect(partial.isValid(0)).toBe(false);
  expect(partial.isValid(1)).toBe(true);
  const masked = expression.evaluateTable(table, {
    activeRows: Uint8Array.of(0, 0)
  });
  expect(masked.isValid(0)).toBe(false);
  expect(masked.isValid(1)).toBe(false);
  const empty = expression.evaluateTable(new Table(table.schema, []));
  expect(empty.length).toBe(0);
  expect(empty.type.toString()).toBe(partial.type.toString());
});

test('supports explicit XYZ dimensions, LargeBinary, and single-to-multi promotion', () => {
  const point = parseWKT('POINT Z (1 2 3)');
  const bytes = vectorFromArray([writeWKB(point)], new LargeBinary());
  const input = geometryTable(bytes);
  const output = select(input, 'GEOARROW_TO_WKB(GEOARROW_TO_MULTIPOINT(geometry))', [
    createGeoArrowConversionFunctions({dimension: 'xyz'})
  ]);
  expect(parseWKB(output.getChild('result')!.get(0)).geometry).toEqual(
    parseWKT('MULTIPOINT Z ((1 2 3))')
  );
  const narrowed = select(input, 'GEOARROW_TO_WKB(geometry)').getChild('result')!;
  expect(DataType.isBinary(narrowed.type)).toBe(true);
  expect(narrowed.data[0]!.values.buffer).toBe(bytes.data[0]!.values.buffer);
  expect(() => select(input, 'GEOARROW_TO_POLYGON(geometry)')).toThrow(
    /cannot be represented/i
  );
});
