// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import fs from 'node:fs';
import crypto from 'node:crypto';
import {basename} from 'node:path';
const files = process.argv.slice(2);
if (!files.length)
  throw new Error('Supply raw terrain worker-tail or direct-edit JSON reports');
const report = files.map(file => {
  const raw = fs.readFileSync(file);
  const data = JSON.parse(raw);
  if (Array.isArray(data))
    return {
      rawFile: basename(file),
      rawSha256: crypto.createHash('sha256').update(raw).digest('hex'),
      results: data
    };
  const results = data.results.map(r => {
    const {samples, memoryAfter, ...rest} = r;
    const result = {
      ...rest,
      commits: samples.length,
      edits: samples.reduce((n, s) => n + s.edits, 0),
      memoryAfter: {
        ...memoryAfter,
        gc: {
          count: memoryAfter.gc.length,
          totalMs: memoryAfter.gc.reduce((n, g) => n + g.duration, 0),
          maxMs: Math.max(0, ...memoryAfter.gc.map(g => g.duration))
        }
      }
    };
    // Attribute each run's actual p99 event, not differences of independent quantiles.
    const events = samples
      .flatMap((sample, requestIndex) =>
        sample.editToAckMs.map((ack, editIndex) => ({sample, requestIndex, editIndex, ack}))
      )
      .sort((a, b) => a.ack - b.ack);
    const witness = events[Math.ceil(events.length * 0.99) - 1];
    const sample = witness.sample;
    result.p99Witness = {
      requestIndex: witness.requestIndex,
      editIndex: witness.editIndex,
      editToAckMs: witness.ack,
      queueMs: sample.queueMs[witness.editIndex],
      inboundMs: sample.inboundMs,
      processMs: sample.processMs,
      outboundMs: sample.outboundMs,
      remainderMs: sample.requestMs - sample.inboundMs - sample.processMs - sample.outboundMs
    };
    if (sample.workerStartMs !== undefined)
      result.p99Witness.overlappingWorkerGcMs = memoryAfter.gc.reduce(
        (sum, gc) =>
          sum +
          Math.max(
            0,
            Math.min(sample.workerEndMs, gc.start + gc.duration) -
              Math.max(sample.workerStartMs, gc.start)
          ),
        0
      );
    if (memoryAfter.allocationProfile) {
      const frames = new Map();
      let sampledBytes = 0;
      /** Attribute sampled bytes to compact stacks without retaining the full inspector tree. */
      function walk(node, parents = []) {
        const frame = node.callFrame;
        const label = frame.functionName || `anonymous:${frame.lineNumber + 1}`;
        const key = [...parents, label].slice(-5).join(' > ');
        sampledBytes += node.selfSize;
        frames.set(key, (frames.get(key) || 0) + node.selfSize);
        for (const c of node.children) walk(c, [...parents, label]);
      }
      walk(memoryAfter.allocationProfile.head);
      result.allocation = {
        sampledBytes,
        bytesPerEdit: sampledBytes / result.edits,
        topStacks: [...frames]
          .filter(x => x[1])
          .sort((a, b) => b[1] - a[1])
          .slice(0, 12)
          .map(([stack, bytes]) => ({stack, bytes}))
      };
      result.cpu = memoryAfter.cpuProfile.nodes
        .filter(n => n.hitCount)
        .sort((a, b) => b.hitCount - a.hitCount)
        .slice(0, 12)
        .map(n => ({
          function: n.callFrame.functionName || `anonymous:${n.callFrame.lineNumber + 1}`,
          samples: n.hitCount
        }));
      delete result.memoryAfter.allocationProfile;
      delete result.memoryAfter.cpuProfile;
    }
    return result;
  });
  return {
    ...data,
    rawFile: basename(file),
    rawSha256: crypto.createHash('sha256').update(raw).digest('hex'),
    results
  };
});
// Keep one trial per line so checked-in summaries remain compact and diffable.
console.log('[\n' + report.map(({results, ...metadata}) =>
  JSON.stringify(metadata, null, 2).slice(0, -2) + ',\n  "results": [\n' +
  results.map(result => '    ' + JSON.stringify(result)).join(',\n') + '\n  ]\n}'
).join(',\n') + '\n]');
