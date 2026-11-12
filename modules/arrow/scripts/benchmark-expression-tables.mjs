// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {performance} from 'node:perf_hooks';
import {Table, Float64, Utf8, vectorFromArray} from 'apache-arrow';
import {compile} from '@math.gl/expressions';
import {TaskRunner} from '@math.gl/tasks';
import {splitArrowBuffers} from '@math.gl/arrow';
import {compileArrowExpression} from '@math.gl/expressions/arrow';
import {createArrowExpressionTask, prepareArrowExpressionInput, hydrateArrowExpressionResult} from '@math.gl/expressions/arrow/worker';

const task = createArrowExpressionTask({worker: {url: new URL(import.meta.resolve('@math.gl/expressions/arrow/worker-entry.js')), capabilities: {atomic: true, streaming: false}}});
const runner = new TaskRunner();
const iterations = 5;
let checksum = 0;
try {
  for (const rows of [16384, 262144]) {
    const batches = Array.from({length: 4}, () => new Table({
      value: vectorFromArray(Array.from({length: rows / 4}, (_, i) => i % 100), new Float64()),
      text: vectorFromArray(Array.from({length: rows / 4}, (_, i) => i % 2 ? 'éclair' : 'apple'), new Utf8())
    }).batches[0]);
    const table = new Table(batches);
    for (const [workload, expression, column] of [['numeric', 'value * 2 + 1', 'value'], ['utf8', 'text < "m"', 'text']]) {
      const compiled = compileArrowExpression(expression, {inputSchema: table.schema});
      const scalar = compile(expression); const input = table.getChild(column);
      const started = performance.now();
      const handle = await runner.initializeTask(task, {expression}, {execution: 'worker'});
      const initializedMs = performance.now() - started;
      try {
        const coldStarted = performance.now();
        const cold = hydrateArrowExpressionResult(await handle.runTask(prepareArrowExpressionInput(table)));
        checksum += cold.vector.length;
        const coldRoundTripMs = performance.now() - coldStarted;
        for (const mode of ['table', 'decoded-rows-to-arrow', 'worker-copy', 'worker-transfer-owned-copy']) {
          let preparationMs = 0;
          let output;
          const run = async () => {
            if (mode === 'table') return compiled.evaluateTable(table);
            if (mode === 'decoded-rows-to-arrow') {
              const values = Array.from({length: rows}, (_, i) => scalar({[column]: input.get(i)}));
              return vectorFromArray(values, compiled.outputField.type);
            }
            const prepareStarted = performance.now();
            // The transfer benchmark includes preparing an owned copy, preserving the reusable fixture.
            const owned = mode === 'worker-copy' ? table : splitArrowBuffers(table, {copy: 'all'});
            const payload = prepareArrowExpressionInput(owned);
            preparationMs += performance.now() - prepareStarted;
            return hydrateArrowExpressionResult(await handle.runTask(payload, {inputOwnership: mode === 'worker-copy' ? 'copy' : 'transfer'})).vector;
          };
          for (let warmup = 0; warmup < 2; warmup++) await run();
          preparationMs = 0;
          const begin = performance.now();
          for (let iteration = 0; iteration < iterations; iteration++) {output = await run(); checksum += output.length;}
          const elapsed = performance.now() - begin;
          console.log(JSON.stringify({workload, rows, batches: batches.length, mode, iterations,
            rowsPerSecond: Math.round(rows * iterations * 1000 / elapsed), millisecondsPerTable: elapsed / iterations,
            preparationMillisecondsPerTable: preparationMs / iterations, initializedMs, coldRoundTripMs,
            rowObjectsPerTable: mode === 'decoded-rows-to-arrow' ? rows : 0,
            inputStringDecodesPerTable: mode === 'decoded-rows-to-arrow' && workload === 'utf8' ? rows : 0,
            outputArrowBytes: output.byteLength, outputChunks: output.data.length}));
        }
      } finally {await handle.close();}
    }
  }
} finally {await runner.close();}
console.log(JSON.stringify({checksum, note: 'Worker timings include preparation, input ownership handling, dispatch, execution, output transfer and hydration. Transfer mode includes an owned input copy. Allocation counts cover known row contexts/string decodes, not total allocations. Four batches, same Node/Arrow version at both ends; no parallel execution.'}));
