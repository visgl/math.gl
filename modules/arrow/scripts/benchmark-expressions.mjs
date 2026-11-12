// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {performance} from 'node:perf_hooks';
import {Table, Float64, Utf8, vectorFromArray} from 'apache-arrow';
import {compile} from '@math.gl/expressions';
import {compileArrowExpression} from '../dist/expressions/index.js';

const count = 16384;
const iterations = 30;
const input = new Table({
  value: vectorFromArray(Array.from({length: count}, (_, i) => i % 100), new Float64()),
  text: vectorFromArray(Array.from({length: count}, (_, i) => i % 2 ? 'apple' : 'orange'), new Utf8())
}).batches[0];
let checksum = 0;
for (const [name, expression, column] of [['numeric', 'value * 2 + 1', 'value'], ['utf8', 'text < "m"', 'text']]) {
  const bound = compileArrowExpression(expression, {inputSchema: input.schema});
  const scalar = compile(expression);
  const vector = input.getChild(column);
  const workloads = {
    arrow() {const result = bound.evaluate(input); checksum += Number(result.get(0)); return result;},
    rows() {const result = new Array(count); for (let i = 0; i < count; i++) result[i] = scalar({[column]: vector.get(i)}); checksum += Number(result[0]); return result;}
  };
  workloads.rowsToArrow = () => vectorFromArray(workloads.rows(), bound.outputField.type);
  for (const [engine, run] of Object.entries(workloads)) {
    for (let i = 0; i < 5; i++) run();
    const started = performance.now();
    for (let i = 0; i < iterations; i++) run();
    const duration = performance.now() - started;
    const output = run();
    console.log(JSON.stringify({workload: name, engine, rowsPerSecond: Math.round(count * iterations * 1000 / duration),
      rowObjectsPerBatch: engine !== 'arrow' ? count : 0,
      inputStringDecodesPerBatch: engine !== 'arrow' && name === 'utf8' ? count : 0,
      outputArrowBytes: engine !== 'rows' ? output.byteLength : null}));
  }
}
console.log(JSON.stringify({checksum, note: 'Counts cover explicit row contexts and input string reads, not total allocations; Arrow intermediates are excluded from output bytes.'}));
