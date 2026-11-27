// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const paths = process.argv.slice(2);
assert.ok(paths.length, 'Provide one or more raw browser benchmark reports');
const reports = paths.map(path => {
  const raw = readFileSync(path);
  const {results, ...metadata} = JSON.parse(raw);
  return {
    ...metadata,
    rawSha256: createHash('sha256').update(raw).digest('hex'),
    results: results.map(({samples, ...trial}) => ({
      ...trial,
      // Attribute the actual p99 edit, not differences between independent percentiles.
      p99Event: [...samples].sort((a, b) => a.editToAckMs - b.editToAckMs)[
        Math.ceil(samples.length * 0.99) - 1
      ]
    }))
  };
});
// Keep each trial on one line so checked-in evidence remains reviewable.
console.log(
  '[\n' +
    reports
      .map(
        ({results, ...metadata}) =>
          JSON.stringify(metadata, null, 2).slice(0, -2) +
          ',\n  "results": [\n' +
          results.map(trial => '    ' + JSON.stringify(trial)).join(',\n') +
          '\n  ]\n}'
      )
      .join(',\n') +
    '\n]'
);
