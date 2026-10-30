// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {execFileSync} from 'node:child_process';
import {appendFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

// Exercise the complete scheduled path when its definitions or shared tooling change.
export function selectProfile(event, paths = []) {
  const full =
    ['schedule', 'workflow_dispatch'].includes(event) ||
    paths.some(
      path =>
        /^(\.github\/|scripts\/ci[.-]|\.nvmrc$|\.yarnrc\.yml$|yarn\.lock$|package\.json$|vitest\.config\.ts$|\.ocularrc\.js$|test\/utils\/)/.test(
          path
        ) ||
        /^modules\/geospatial\/(projection\/)?scripts\//.test(path) ||
        /^modules\/geospatial\/projection\/test\//.test(path) ||
        /^modules\/geospatial\/(projection\/)?test\/(fixtures\/|.*(?:benchmark|workload))/.test(
          path
        )
    );
  // Unknown/empty diffs keep comparisons enabled. Only a strict documentation allowlist skips them.
  const docsOnly =
    paths.length > 0 &&
    paths.every(path => /^(docs\/|dev-docs\/|README\.md$|CHANGELOG\.md$|LICENSE$)/.test(path));
  return {
    full,
    performance: event === 'pull_request' && !docsOnly,
    browsers: full ? ['chromium', 'firefox', 'webkit'] : ['chromium']
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const event = process.env.EVENT_NAME;
  if (!['pull_request', 'push', 'schedule', 'workflow_dispatch'].includes(event)) {
    throw new Error(`Unsupported CI event: ${event}`);
  }
  const paths =
    event === 'pull_request'
      ? execFileSync('git', ['diff', '--name-only', '-z', process.env.BASE_SHA, 'HEAD'], {
          encoding: 'utf8'
        })
          .split('\0')
          .filter(Boolean)
      : [];
  const profile = selectProfile(event, paths);
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `full=${profile.full}\nperformance=${profile.performance}\nbrowsers=${JSON.stringify(profile.browsers)}\n`
  );
  console.log(JSON.stringify(profile));
}
