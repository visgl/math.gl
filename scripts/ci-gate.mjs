// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {pathToFileURL} from 'node:url';

export function checkResults(needs, event) {
  const failures = [];
  for (const name of [
    'plan',
    'build',
    'checks',
    'examples',
    'coverage',
    'website',
    'node-tests',
    'projection-browsers'
  ]) {
    if (needs[name]?.result !== 'success')
      failures.push(`${name}: ${needs[name]?.result ?? 'missing'}`);
  }
  const full = needs.plan?.outputs?.full;
  if (!['true', 'false'].includes(full)) failures.push('Missing qualification profile');
  if (['schedule', 'workflow_dispatch'].includes(event) && full !== 'true')
    failures.push('Full qualification required');
  for (const [name, expected] of [
    ['scorecard', full === 'true' ? 'success' : 'skipped'],
    ['projection-performance', event === 'pull_request' ? 'success' : 'skipped']
  ]) {
    if (needs[name]?.result !== expected)
      failures.push(`${name}: expected ${expected}, got ${needs[name]?.result ?? 'missing'}`);
  }
  return failures;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const failures = checkResults(JSON.parse(process.env.NEEDS), process.env.EVENT_NAME);
  if (failures.length) throw new Error(failures.join('\n'));
  console.log('All required checks passed');
}
