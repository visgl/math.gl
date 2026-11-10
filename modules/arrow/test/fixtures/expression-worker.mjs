// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {SQRT} from '@math.gl/arrow/math';
import {COLOR_RGB, COLOR_TO_RGBA8} from '@math.gl/arrow/color';
import {initializeTaskWorker} from '@math.gl/tasks';
import {createArrowExpressionTask} from '@math.gl/arrow/expressions/worker';
import {createTurfArrowFunction} from '@math.gl/geospatial/turf/expressions';
import {distance} from '@math.gl/geospatial/turf';
import {Field, FixedSizeList, Float64, Float32, Int32, List, vectorFromArray} from 'apache-arrow';
const point = new Field('point', new FixedSizeList(2, new Field('xy', new Float64(), true)), true,
  new Map([['ARROW:extension:name', 'geoarrow.point']]));
const double = {name: 'double',prototypes:[{arguments: [new Field('x', new Int32())],result: new Field('doubled', new Int32(), true, new Map([['unit', 'count']])),evaluate: ([values], {length, activeRows}) => vectorFromArray(Array.from({length}, (_, row) => activeRows[row] && values.isValid(row) ? values.get(row) * 2 : null), new Int32()),evaluateScalar: x => x * 2}]};
const rgbaType = new FixedSizeList(4, new Field('channel', new Float32(), false));
const color = {name: 'color',prototypes:[{arguments: [new Field('x', new Int32(), true), new Field('bins', new List(new Field('item', new Int32(), false)), false)],result: new Field('rgba', rgbaType, true, new Map([['color-space', 'srgb']])),evaluate: ([values, bins], {length, activeRows}) => vectorFromArray(Array.from({length}, (_, row) => activeRows[row] ? [values.get(row), bins.get(row).get(0), 0, 1] : null), rgbaType)}]};
const functions = [SQRT, COLOR_RGB, COLOR_TO_RGBA8, double, color, createTurfArrowFunction({name: 'distance', arguments: [point, point], result: new Field('distance', new Float64(), true), evaluate: distance})];
await initializeTaskWorker(createArrowExpressionTask({functions}));
