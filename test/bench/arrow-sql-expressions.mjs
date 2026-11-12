// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {cpus} from 'node:os';
import {Table, makeVector} from 'apache-arrow';
import {compile, BASIC_MATH_FUNCTION_LIBRARY} from '@math.gl/expressions';
import {parseSQLExpression} from '@math.gl/expressions/sql';
import {compileArrowExpression} from '@math.gl/expressions/arrow';
import {SIN, COS, SQRT} from '@math.gl/expressions/math';

const quick = process.argv.includes('--quick');
const batchRows = quick ? 1024 : 16384;
const rows = 4 * batchRows;
const samples = quick ? 3 : 7;
const warmups = quick ? 1 : 3;
const functions = [SIN, COS, SQRT];

function fixture(errorEvery = 0) {
  let table = new Table({x: makeVector(new Float64Array(0)), y: makeVector(new Float64Array(0))});
  for (let batch = 0; batch < 4; batch++) {
    const x = new Float64Array(batchRows), y = new Float64Array(batchRows);
    for (let row = 0; row < batchRows; row++) {
      const index = batch * batchRows + row;
      x[row] = 1 + (index % 100) / 10;
      if (errorEvery && index % errorEvery === 0) x[row] = -x[row];
      y[row] = (index % 200) / 20;
    }
    const chunk = new Table({x: makeVector(x), y: makeVector(y)});
    table = batch === 0 ? chunk : table.concat(chunk);
  }
  return table;
}

function workload(name, execute, describeResult) {
  return {name, execute, describeResult, wall: [], cpu: [], result: undefined};
}

function summarize(workload) {
  const percentile = (values, fraction) => values.toSorted((a, b) => a - b)[Math.ceil(values.length * fraction) - 1];
  const p50Milliseconds = percentile(workload.wall, 0.5);
  return {
    name: workload.name,
    p50Milliseconds,
    p95Milliseconds: percentile(workload.wall, 0.95),
    p50CpuMilliseconds: percentile(workload.cpu, 0.5),
    rowsPerSecond: rows * 1000 / p50Milliseconds,
    ...workload.describeResult(workload.result)
  };
}

function arrow(name, table, sql, expectedValue, expectedNulls, failingRows = 0) {
  const compiled = compileArrowExpression(parseSQLExpression(sql), {inputSchema: table.schema, functions});
  return workload(name, () => compiled.evaluateTable(table), vector => {
    assert.equal(vector.length, rows);
    assert.equal(vector.nullCount, expectedNulls);
    const x = table.getChild('x'), y = table.getChild('y');
    for (let row = 0; row < rows; row++) assert.equal(vector.get(row), expectedValue(x.get(row), y.get(row)), `Unexpected value at row ${row}`);
    return {failingRows, resultChunks: vector.data.length, retainedOutputBytes: vector.data.reduce((total, data) => total + data.values.byteLength + data.nullBitmap.byteLength, 0)};
  });
}

const input = fixture();
const composition = 'SIN(x) + COS(y) * 2';
const workloads = [arrow('Arrow numeric composition', input, composition, (x, y) => Math.sin(x) + Math.cos(y) * 2, 0)];
const rowEvaluator = compile('sin(x) + cos(y) * 2', {libraries: [BASIC_MATH_FUNCTION_LIBRARY]});
const x = input.getChild('x'), y = input.getChild('y');
const decodedRows = Array.from({length: rows}, (_, index) => ({x: x.get(index), y: y.get(index)}));
workloads.push(workload('JavaScript evaluator over predecoded rows', () => Float64Array.from(decodedRows, rowEvaluator), result => {
  assert.equal(result[0], Math.sin(1) + 2);
  return {decodedRowObjects: rows, retainedOutputBytes: result.byteLength};
}));
for (const [label, every] of [['mostly valid', 1024], ['frequent errors', 4]]) {
  const table = fixture(every);
  const failures = Math.ceil(rows / every);
  workloads.push(arrow(`TRY null recovery: ${label}`, table, 'TRY(SQRT(x))', x => x < 0 ? null : Math.sqrt(x), failures, failures));
  workloads.push(arrow(`TRY fallback: ${label}`, table, 'TRY(SQRT(x), 0)', x => x < 0 ? 0 : Math.sqrt(x), 0, failures));
}

for (let sample = -warmups; sample < samples; sample++) {
  // Interleave workloads so a background load change does not affect just one case.
  for (let index = 0; index < workloads.length; index++) {
    const work = workloads[(index + sample + warmups) % workloads.length];
    const cpuStart = process.cpuUsage();
    const wallStart = performance.now();
    work.result = work.execute();
    const wall = performance.now() - wallStart;
    const cpu = process.cpuUsage(cpuStart);
    if (sample >= 0) {
      work.wall.push(wall);
      work.cpu.push((cpu.user + cpu.system) / 1000);
    }
  }
}

console.log(JSON.stringify({
  environment: {node: process.version, platform: process.platform, arch: process.arch, cpu: cpus()[0]?.model},
  rows, batches: 4, samples, warmups,
  workloads: workloads.map(summarize),
  scope: 'Execution only, excluding parsing, binding, decoding the baseline rows, and worker transfer. Retained output buffers do not measure total allocations, temporary masks, or garbage collection.'
}, null, 2));
