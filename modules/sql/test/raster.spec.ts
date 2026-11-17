// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  Binary,
  Field,
  Float64,
  Schema,
  Table,
  RecordBatch,
  Struct,
  makeData,
  vectorFromArray,
  Utf8
} from 'apache-arrow';
import {
  RasterContext,
  createRasterSourceFromData,
  rasterValue,
  rasterSummary,
  rasterBand,
  rasterArithmetic,
  rasterResample,
  rasterClip,
  rasterToWorld,
  worldToRaster,
  rasterFootprint
} from '../src/raster';
import type {NumericRasterData, SyncRasterSource} from '../src/raster';
import {
  createRasterField,
  createRasterVector,
  createRasterFunctions
} from '../src/raster/arrow-raster';
import {compileArrowExpression} from '../src/arrow/compiler';
import {queryArrowSQL} from '../src/arrow/query-arrow-sql';
import {queryArrowTable} from '../src/arrow/query-arrow-table';

/** Small north-up fixture with stable georeferencing. */
function raster(extra: Partial<NumericRasterData> = {}): SyncRasterSource {
  return createRasterSourceFromData({
    width: 2,
    height: 2,
    bandCount: 1,
    dtype: 'float64',
    data: new Float64Array([1, 2, 3, 4]),
    transform: [1, 0, 0, 0, -1, 2],
    crs: 'EPSG:4326',
    pixelRegistration: 'area',
    ...extra
  });
}
/** Builds a table with logical raster metadata retained. */
function table(
  context: RasterContext,
  sources: (SyncRasterSource | null)[] = [raster(), null]
): Table {
  const r = createRasterVector(context, sources),
    x = vectorFromArray(
      sources.map((_, i) => i),
      new Float64()
    );
  const schema = new Schema([createRasterField('r'), new Field('x', new Float64(), false)]);
  return new Table(
    new RecordBatch(
      schema,
      makeData({
        type: new Struct(schema.fields),
        length: sources.length,
        children: [r.data[0]!, x.data[0]!]
      })
    )
  );
}
test('resident adapters preserve mixed/interleaved samples, calibration and mask semantics', () => {
  const input: NumericRasterData = {
    width: 2,
    height: 1,
    bandCount: 2,
    dtype: 'mixed',
    interleaved: false,
    data: [new Float32Array([0.1, 2]), new Uint16Array([10, 20])],
    bands: [
      {index: 3, dtype: 'float32', noData: 0.1, scale: 2, offset: 3},
      {index: 5, dtype: 'uint16', categorical: true}
    ],
    validityMasks: [
      {data: new Uint8Array([1, 0, 0, 0]), band: 1, width: 2, height: 1, pixelStride: 2}
    ]
  };
  const source = createRasterSourceFromData(input);
  expect(rasterValue(source, 0, 0, 0)).toBeNull();
  expect(rasterValue(source, 0, 1, 0)).toBe(2);
  expect(rasterValue(source, 1, 0, 0)).toBe(10);
  expect(rasterValue(source, 1, 1, 0)).toBeNull();
  expect(rasterBand(source, 0).metadata.bands![0]).toMatchObject({index: 3, scale: 2, offset: 3});
  expect(Array.from(input.data[0])).toEqual([Math.fround(0.1), 2]);
  const packed = createRasterSourceFromData({
    width: 2,
    height: 1,
    bandCount: 2,
    dtype: 'uint8',
    interleaved: true,
    data: new Uint8Array([1, 10, 2, 20])
  });
  expect(rasterValue(packed, 1, 1, 0)).toBe(20);
  const planar = createRasterSourceFromData({
    width: 2,
    height: 1,
    bandCount: 2,
    dtype: 'uint8',
    data: new Uint8Array([1, 2, 10, 20])
  });
  expect(rasterValue(planar, 1, 1, 0)).toBe(20);
});
test('spatial conventions, raw statistics and arithmetic are deterministic', () => {
  const a = raster(),
    b = raster({data: new Float64Array([2, 0, NaN, 8])});
  expect(rasterSummary(a, 0)).toEqual({
    count: 4,
    sum: 10,
    mean: 2.5,
    stddev: Math.sqrt(1.25),
    min: 1,
    max: 4
  });
  const ratio = rasterArithmetic(a, b, 'divide');
  expect(rasterValue(ratio, 0, 0, 0)).toBe(0.5);
  expect(rasterValue(ratio, 0, 1, 0)).toBeNull();
  expect(rasterValue(rasterArithmetic(a, 2, 'add'), 0, 0, 0)).toBe(3);
  expect(rasterValue(rasterArithmetic(a, 2, 'subtract'), 0, 0, 0)).toBe(-1);
  expect(rasterValue(rasterArithmetic(a, 2, 'multiply'), 0, 0, 0)).toBe(2);
  expect(rasterSummary(raster({data: new Float64Array([NaN, NaN, NaN, NaN])}), 0)).toEqual({
    count: 0,
    sum: 0,
    mean: null,
    stddev: null,
    min: null,
    max: null
  });
  const skew = raster({transform: [2, 1, 4, 1, -2, 8]});
  const world = rasterToWorld(skew.metadata, 1, 2);
  expect(worldToRaster(skew.metadata, ...world)).toEqual([1, 2]);
  expect(rasterFootprint(a)[0]).toEqual([
    [0, 2],
    [2, 2],
    [2, 0],
    [0, 0],
    [0, 2]
  ]);
  expect(rasterFootprint(raster({pixelRegistration: 'point'}))[0]![0]).toEqual([-0.5, 2.5]);
  expect(() => rasterArithmetic(a, raster({crs: 'EPSG:3857'}), 'add')).toThrow(/CRS/);
  expect(() => rasterArithmetic(a, raster({transform: [2, 0, 0, 0, -2, 2]}), 'add')).toThrow(
    /grid/
  );
});
test('lazy clipping, resampling and cancellation read bounded windows', () => {
  const original = raster();
  let reads = 0;
  const source = {
    metadata: original.metadata,
    readWindow(window) {
      reads++;
      return original.readWindow(window);
    }
  } as SyncRasterSource;
  const resampled = rasterResample(
    source,
    raster({width: 1, height: 1, data: new Float64Array([0]), transform: [1, 0, 0.5, 0, -1, 1.5]}),
    'bilinear'
  );
  expect(reads).toBe(0);
  expect(rasterValue(resampled, 0, 0, 0)).toBe(2.5);
  const categorical = raster({bands: [{index: 0, dtype: 'float64', categorical: true}]});
  expect(rasterValue(rasterResample(categorical, resampled, 'bilinear'), 0, 0, 0)).toBe(4);
  const clipped = rasterClip(source, {
    crs: 'EPSG:4326',
    coordinates: [
      [
        [0, 0],
        [2, 0],
        [2, 2],
        [0, 2],
        [0, 0]
      ],
      [
        [0.1, 1.1],
        [0.9, 1.1],
        [0.9, 1.9],
        [0.1, 1.9],
        [0.1, 1.1]
      ]
    ]
  });
  expect(rasterValue(clipped, 0, 0, 0)).toBeNull();
  expect(rasterValue(clipped, 0, 1, 1)).toBe(4);
  const abort = new AbortController();
  abort.abort();
  expect(() =>
    clipped.readWindow({x: 0, y: 0, width: 1, height: 1, signal: abort.signal})
  ).toThrow();
  expect(() => rasterResample(source, raster({transform: undefined}))).toThrow(/affine/);
  expect(() => source.readWindow({x: 2, y: 0, width: 1, height: 1})).toThrow(/window/);
  expect(rasterValue(source, 0, -1, 0)).toBeNull();
  expect(() => rasterBand(source, 4)).toThrow(/band/);
});
test('SQL functions compose, preserve opaque values and skip inactive raster reads', () => {
  const context = new RasterContext(),
    original = raster();
  let reads = 0;
  const source: SyncRasterSource = {
    metadata: original.metadata,
    readWindow(w) {
      reads++;
      return original.readWindow(w);
    }
  };
  const input = table(context, [source, null, source]);
  const functions = createRasterFunctions(context);
  const run = (expression: string) =>
    compileArrowExpression(expression, {inputSchema: input.schema, functions}).evaluateTable(input);
  expect(Array.from(run('RT_Width(r)'))).toEqual([2, null, 2]);
  expect(Array.from(run('RT_Value(RT_Add(r, 2), 1, 1, 1)'))).toEqual([3, null, 3]);
  const before = reads;
  expect(Array.from(run('x == 0 ? 9 : RT_Value(r, 1, 1, 1)'))).toEqual([9, null, 1]);
  expect(reads - before).toBe(1);
  expect(Array.from(run('RT_Width(x == 0 ? r : null)'))).toEqual([2, null, null]);
  expect(Array.from(run('RT_Width(COALESCE(r, null))'))).toEqual([2, null, 2]);
  const result = queryArrowSQL(
    'SELECT RT_Value(RT_Multiply(r, 2), 1, 2, 2) AS value FROM rasters WHERE x = 0',
    new Map([['rasters', input]]),
    {functions}
  );
  expect(Array.from(result.getChild('value')!)).toEqual([8]);
  const stats = run('RT_SummaryStats(r, 1)').get(0);
  expect(stats.toJSON()).toMatchObject({sum: 10, count: 4});
  const clipped = run('RT_Clip(r, RT_ConvexHull(r))').get(0);
  expect(rasterSummary(context.resolve(clipped), 0).count).toBe(4);
  expect(() => run('r == r')).toThrow(/opaque/);
  expect(() => run('upper(r)')).toThrow(/opaque/);
  expect(() => run('cast(r, "utf8")')).toThrow(/opaque/);
  expect(() => run('x == 0 ? r : "fake"')).toThrow(/RASTER/);
  expect(() => queryArrowTable(input, {orderBy: [{column: 'r'}]})).toThrow(/opaque/);
  expect(() => queryArrowTable(input, {groupBy: ['r']})).toThrow(/opaque/);
  const handle = run('RT_Band(r, 1)').get(0);
  expect(() => new RasterContext().resolve(handle)).toThrow(/Unknown/);
  context.clear();
  expect(() => context.resolve(handle)).toThrow(/Unknown/);
});
test('raster overloads reject physical strings and honor nulls and source failures', () => {
  const context = new RasterContext(),
    input = table(context),
    functions = createRasterFunctions(context);
  expect(() =>
    compileArrowExpression('RT_Width("fake")', {inputSchema: input.schema, functions})
  ).toThrow();
  expect(
    Array.from(
      compileArrowExpression('RT_Width(null)', {
        inputSchema: input.schema,
        functions
      }).evaluateTable(input)
    )
  ).toEqual([null, null]);
  const failing: SyncRasterSource = {
    metadata: raster().metadata,
    readWindow() {
      throw new Error('source failed');
    }
  };
  const bad = table(context, [failing]);
  expect(() =>
    compileArrowExpression('RT_Value(r,1,1,1)', {inputSchema: bad.schema, functions}).evaluateTable(
      bad
    )
  ).toThrow(/source failed/);
  const stringInput = new Table({s: vectorFromArray(['fake'], new Utf8())});
  expect(() =>
    compileArrowExpression('RT_Width(s)', {inputSchema: stringInput.schema, functions})
  ).toThrow();
});

test('empty rasters, native subwindows and missing data retain their contracts', () => {
  const empty = raster({width: 0, height: 0, data: new Float64Array()});
  expect(rasterFootprint(empty)).toEqual([]);
  expect(rasterSummary(empty, 0).count).toBe(0);
  expect(empty.readWindow({x: 0, y: 0, width: 0, height: 0}).width).toBe(0);
  const outside = rasterClip(raster(), {
    crs: 'EPSG:4326',
    coordinates: [
      [
        [10, 10],
        [11, 10],
        [11, 11],
        [10, 11],
        [10, 10]
      ]
    ]
  });
  expect(outside.metadata.width).toBe(0);
  expect(rasterSummary(outside, 0).count).toBe(0);
  const clip = rasterClip(raster(), {
    crs: 'EPSG:4326',
    coordinates: [
      [
        [1, 0],
        [2, 0],
        [2, 1],
        [1, 1],
        [1, 0]
      ]
    ]
  });
  expect(clip.metadata).toMatchObject({width: 1, height: 1, transform: [1, 0, 1, 0, -1, 1]});
  expect(rasterValue(clip, 0, 0, 0)).toBe(4);
  const source = raster({noData: 2});
  const window = source.readWindow({x: 1, y: 0, width: 1, height: 1});
  expect(window.transform).toEqual([1, 0, 1, 0, -1, 2]);
  expect((window.data as Float64Array[])[0]![0]).toBe(2);
  expect(rasterValue(createRasterSourceFromData(window), 0, 0, 0)).toBeNull();
  expect(
    rasterValue(raster({noData: 1, bands: [{index: 0, dtype: 'float64', noData: null}]}), 0, 0, 0)
  ).toBe(1);
  expect(() => source.readWindow({x: 0, y: 0, width: 1, height: 1, bands: [0, 0]})).toThrow(/band/);
  expect(() =>
    createRasterSourceFromData({
      width: 2,
      height: 2,
      bandCount: 1,
      dtype: 'uint8',
      data: new Uint8Array(1)
    })
  ).toThrow(/size/);
  expect(() =>
    createRasterSourceFromData({
      width: 1,
      height: 1,
      bandCount: 1,
      dtype: 'mixed',
      data: new Uint8Array(1)
    })
  ).toThrow(/Mixed/);
  expect(() => rasterClip(source, {crs: 'EPSG:4326', coordinates: [[[0, 0]]]})).toThrow(/closed/);
  expect(() => rasterResample(source, source, 'invalid' as 'nearest')).toThrow(/method/);
  expect(
    rasterValue(
      rasterResample(
        raster({noData: 1}),
        raster({
          width: 1,
          height: 1,
          data: new Float64Array(1),
          transform: [1, 0, 0.5, 0, -1, 1.5]
        }),
        'bilinear'
      ),
      0,
      0,
      0
    )
  ).toBeNull();
});
test('SQL metadata accessors, struct extraction, multiple batches and cancellation', () => {
  const context = new RasterContext(),
    input = table(context),
    functions = createRasterFunctions(context);
  const run = (expression: string) =>
    compileArrowExpression(expression, {inputSchema: input.schema, functions})
      .evaluateTable(input)
      .get(0);
  const cases: Record<string, number | string | null> = {
    RT_Width: 2,
    RT_Height: 2,
    RT_NumBands: 1,
    RT_SRID: 4326,
    RT_ScaleX: 1,
    RT_ScaleY: -1,
    RT_SkewX: 0,
    RT_SkewY: 0,
    RT_UpperLeftX: 0,
    RT_UpperLeftY: 2
  };
  for (const [name, value] of Object.entries(cases)) expect(run(`${name}(r)`)).toBe(value);
  expect(run('RT_BandPixelType(r,1)')).toBe('float64');
  expect(run('RT_BandNoDataValue(r,1)')).toBeNull();
  expect(run('RT_RasterToWorldCoordX(r,2,2)')).toBe(1);
  expect(run('RT_RasterToWorldCoordY(r,2,2)')).toBe(1);
  expect(run('RT_WorldToRasterCoordX(r,1.2,0.7)')).toBe(2);
  expect(run('RT_WorldToRasterCoordY(r,1.2,0.7)')).toBe(2);
  expect(run('STRUCT_EXTRACT(RT_SummaryStats(r,1),"mean")')).toBe(2.5);
  expect(run('RT_Value(RT_Resample(r,r,"nearest"),1,2,1)')).toBe(2);
  expect(run('RT_Value(RT_Resample(r,r),1,2,1)')).toBe(2);
  expect(run('RT_Value(RT_Subtract(r,r),1,2,1)')).toBe(0);
  expect(run('RT_Value(RT_Divide(r,r),1,2,1)')).toBe(1);
  expect(run('RT_Width(null == null ? null : r)')).toBe(2);
  for (const expression of ['in(r,"a")', 'concat(r,"x")', 'COALESCE(r,"fake")'])
    expect(() => run(expression)).toThrow(/opaque|RASTER/);
  const compiled = compileArrowExpression('RT_Width(r)', {inputSchema: input.schema, functions});
  expect(
    Array.from(
      compiled.evaluateTable(new Table(input.schema, [...input.batches, ...input.batches]))
    )
  ).toEqual([2, null, 2, null]);
  const abort = new AbortController();
  let received: AbortSignal | undefined;
  const source: SyncRasterSource = {
    metadata: raster().metadata,
    readWindow(w) {
      received = w.signal;
      abort.abort();
      w.signal?.throwIfAborted();
      return raster().readWindow(w);
    }
  };
  const cancellable = table(context, [source]);
  expect(() =>
    compileArrowExpression('RT_Value(r,1,1,1)', {
      inputSchema: cancellable.schema,
      functions
    }).evaluateTable(cancellable, {signal: abort.signal})
  ).toThrow();
  expect(received).toBe(abort.signal);
});

test('statistics structs compose with null branches and raster masks remain lazy', () => {
  const context = new RasterContext(),
    input = table(context),
    functions = createRasterFunctions(context);
  const run = (expression: string) =>
    compileArrowExpression(expression, {inputSchema: input.schema, functions}).evaluateTable(input);
  expect(run('x == 0 ? RT_SummaryStats(r,1) : null').get(0).mean).toBe(2.5);
  expect(run('COALESCE(RT_SummaryStats(r,1), null)').get(0).mean).toBe(2.5);
  expect(run('TRY(RT_SummaryStats(r,1), null)').get(1)).toBeNull();
  let registered = 0;
  const register = context.register.bind(context);
  context.register = source => {
    registered++;
    return register(source);
  };
  expect(Array.from(run('x == 1 ? RT_Band(r,1) : null'))).toEqual([null, null]);
  expect(registered).toBe(0);
  const empty = rasterClip(raster(), {crs: 'EPSG:4326', coordinates: []});
  expect(rasterSummary(empty, 0).count).toBe(0);
  const first = {
    type: 'GeographicCRS',
    coordinate_system: {axis: [{name: 'Longitude', unit: 'degree'}]}
  };
  const second = {
    coordinate_system: {axis: [{unit: 'degree', name: 'Longitude'}]},
    type: 'GeographicCRS'
  };
  expect(
    rasterValue(rasterArithmetic(raster({crs: first}), raster({crs: second}), 'add'), 0, 0, 0)
  ).toBe(2);
  expect(() => run('RT_Clip(r,RT_ConvexHull(r),"EPSG:3857")')).toThrow(/CRS/);
});

test('all raster arithmetic overloads propagate untyped and typed null operands', () => {
  const context = new RasterContext(),
    input = table(context),
    functions = createRasterFunctions(context);
  const typedNulls = queryArrowSQL(
    'SELECT r, NULL AS missing FROM input',
    new Map([['input', input]])
  );
  expect(
    Array.from(
      compileArrowExpression('RT_Add(r, missing)', {
        inputSchema: typedNulls.schema,
        functions
      }).evaluateTable(typedNulls)
    )
  ).toEqual([null, null]);
  for (const op of ['Add', 'Subtract', 'Multiply', 'Divide'])
    for (const args of ['r,null', 'null,r', 'null,2', 'null,null']) {
      const compiled = compileArrowExpression(`RT_${op}(${args})`, {
        inputSchema: input.schema,
        functions
      });
      expect(Array.from(compiled.evaluateTable(input))).toEqual([null, null]);
      expect(compiled.outputField.metadata.get('ARROW:extension:name')).toBe('math.gl.raster');
    }
});

test('resident window accounting uses selected sample widths plus validity masks', async () => {
  const {rasterWindowByteLength} = await import('../src/raster/source');
  const bytes: NumericRasterData = {
    width: 1,
    height: 1,
    bandCount: 4,
    dtype: 'uint8',
    data: new Uint8Array(4),
    interleaved: true
  };
  expect(rasterWindowByteLength(bytes, 8_000_000, [0, 1, 2, 3])).toBe(64_000_000);
  const mixed: NumericRasterData = {
    width: 1,
    height: 1,
    bandCount: 2,
    dtype: 'mixed',
    data: [new Uint8Array(1), new Float64Array(1)],
    bands: [
      {index: 0, dtype: 'uint8'},
      {index: 1, dtype: 'float64'}
    ]
  };
  expect(rasterWindowByteLength(mixed, 10, [0])).toBe(20);
  expect(rasterWindowByteLength(mixed, 10, [1])).toBe(90);
  expect(rasterWindowByteLength(mixed, 10, [0, 1])).toBe(110);
});

test('clip accepts matching EPSG encodings and preserves empty source band representation', () => {
  const crs = {type: 'GeographicCRS', id: {authority: 'EPSG', code: 4326}};
  for (const definition of ['epsg:4326', crs]) {
    const context = new RasterContext(),
      input = table(context, [raster({crs: definition})]),
      functions = createRasterFunctions(context);
    const result = compileArrowExpression('RT_Clip(r,RT_ConvexHull(r),"EPSG:4326")', {
      inputSchema: input.schema,
      functions
    }).evaluateTable(input);
    expect(rasterSummary(context.resolve(result.get(0)), 0).count).toBe(4);
    expect(() =>
      compileArrowExpression('RT_Clip(r,RT_ConvexHull(r),"EPSG:3857")', {
        inputSchema: input.schema,
        functions
      }).evaluateTable(input)
    ).toThrow(/CRS/);
  }
  const context = new RasterContext(),
    base = table(context, [raster()]);
  const hull = compileArrowExpression('RT_ConvexHull(r)', {
    inputSchema: base.schema,
    functions: createRasterFunctions(context)
  }).evaluateTable(base);
  const geometryField = new Field(
    'polygon',
    new Binary(),
    true,
    new Map([
      ['ARROW:extension:name', 'geoarrow.wkb'],
      ['ARROW:extension:metadata', JSON.stringify({crs})]
    ])
  );
  const schema = new Schema([createRasterField('r'), geometryField]);
  const withGeometry = new Table(
    new RecordBatch(
      schema,
      makeData({
        type: new Struct(schema.fields),
        length: 1,
        children: [base.getChild('r')!.data[0]!, hull.data[0]!]
      })
    )
  );
  const matching = compileArrowExpression('RT_Clip(r,polygon,"epsg:4326")', {
    inputSchema: schema,
    functions: createRasterFunctions(context, {geometryField})
  }).evaluateTable(withGeometry);
  expect(rasterSummary(context.resolve(matching.get(0)), 0).count).toBe(4);
  const source = raster({
    dtype: 'uint16',
    data: new Uint16Array([1, 2, 3, 4]),
    noData: 99,
    bands: [{index: 3, dtype: 'uint16', noData: 9, scale: 2, offset: 3}]
  });
  const empty = rasterClip(source, {crs: 'EPSG:4326', coordinates: []});
  const miss = rasterClip(source, {
    crs: 'EPSG:4326',
    coordinates: [
      [
        [10, 10],
        [11, 10],
        [11, 11],
        [10, 11],
        [10, 10]
      ]
    ]
  });
  expect(empty.metadata.dtype).toBe(miss.metadata.dtype);
  expect(empty.metadata.bands).toEqual(miss.metadata.bands);
  expect(empty.metadata.noData).toBe(99);
  const data = empty.readWindow({x: 0, y: 0, width: 0, height: 0});
  expect(data.data[0]).toBeInstanceOf(Uint16Array);
  expect(data.bands![0]).toMatchObject({index: 3, dtype: 'uint16', noData: 9, scale: 2, offset: 3});
});
