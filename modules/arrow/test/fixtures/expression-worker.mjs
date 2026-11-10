// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {initializeTaskWorker} from '@math.gl/tasks';
import {createArrowExpressionTask} from '@math.gl/arrow/expressions/worker';
import {createTurfArrowFunction} from '@math.gl/geospatial/turf/expressions';
import {distance} from '@math.gl/geospatial/turf';
import {Field, FixedSizeList, Float64, Int32, vectorFromArray} from 'apache-arrow';
const point = new Field('point', new FixedSizeList(2, new Field('xy', new Float64(), true)), true,
  new Map([['ARROW:extension:name', 'geoarrow.point']]));
const double = {
  name: 'double',
  arguments: [new Field('x', new Int32())],
  result: new Field('doubled', new Int32(), true, new Map([['unit', 'count']])),
  evaluate: ([values], {length, activeRows}) => vectorFromArray(Array.from({length}, (_, row) => activeRows[row] && values.isValid(row) ? values.get(row) * 2 : null), new Int32()),
  evaluateScalar: x => x * 2
};
const functions = [double, createTurfArrowFunction({name: 'distance', arguments: [point, point], result: new Field('distance', new Float64(), true), evaluate: distance})];
await initializeTaskWorker(createArrowExpressionTask({functions}));
