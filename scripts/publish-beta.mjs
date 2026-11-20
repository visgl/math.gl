// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

/** Returns the next beta in the current prerelease series. */
export function nextBetaVersion(version) {
  const match = /^(\d+\.\d+\.\d+)-(alpha|beta)\.(\d+)$/.exec(version);
  if (!match) throw new Error(`Expected an alpha or beta version, got ${version}`);
  return `${match[1]}-beta.${match[2] === 'beta' ? Number(match[3]) + 1 : 1}`;
}

/** Promotes a beta to rc.1 or increments an existing release candidate. */
export function nextRcVersion(version) {
  const match = /^(\d+\.\d+\.\d+)-(beta|rc)\.(\d+)$/.exec(version);
  if (!match) throw new Error(`Expected a beta or rc version, got ${version}`);
  return `${match[1]}-rc.${match[2] === 'rc' ? Number(match[3]) + 1 : 1}`;
}

/** Versions or publishes a prepared prerelease through the tag workflow. */
export function publishBeta({
  root,
  dryRun = false,
  prepared = false,
  rc = false,
  run = execFileSync,
  read = readFileSync
}) {
  const git = (...args) => run('git', args, {cwd: root, encoding: 'utf8'}).trim();
  const current = JSON.parse(read(resolve(root, 'lerna.json'), 'utf8')).version;
  if (prepared && rc) throw new Error('--prepared takes the prerelease version from lerna.json');
  const version = prepared ? current : rc ? nextRcVersion(current) : nextBetaVersion(current);
  if (!/^\d+\.\d+\.\d+-(beta|rc)\.\d+$/.test(version)) {
    throw new Error(`Expected a beta or rc version, got ${version}`);
  }
  const tag = `v${version}`;
  const changelog = read(resolve(root, 'CHANGELOG.md'), 'utf8');
  if (!changelog.split('\n').some((line) => line.trim() === `## ${tag}`)) {
    throw new Error(`Add a ## ${tag} entry to CHANGELOG.md before publishing`);
  }
  const versionArgs = [
    'lerna',
    'version',
    version,
    '--force-publish',
    '--exact',
    '--no-commit-hooks',
    '--no-push'
  ];
  if (dryRun) {
    return {
      version,
      versionCommand: prepared ? null : ['npx', ...versionArgs],
      publication: prepared
        ? `Push refs/tags/${tag} for the prepared commit on the permitted release branch`
        : `Atomically push the permitted release branch and refs/tags/${tag} to origin`
    };
  }
  const branch = git('branch', '--show-current');
  if (branch !== 'master' && !/^\d+\.\d+-release$/.test(branch)) {
    throw new Error(`Publish only from master or a major.minor-release branch, got ${branch}`);
  }
  if (git('status', '--porcelain'))
    throw new Error('Commit all working tree changes before publishing');
  if (prepared) {
    const ref = `refs/heads/${branch}`;
    const head = git('rev-parse', 'HEAD');
    if (git('ls-remote', '--exit-code', 'origin', ref) !== `${head}\t${ref}`) {
      throw new Error(`Prepared release must be at the current origin/${branch} tip`);
    }
    if (git('rev-parse', `refs/tags/${tag}^{commit}`) !== head) {
      throw new Error(`Expected the prepared release tag ${tag} at HEAD`);
    }
    run(process.execPath, ['scripts/publish-from-git.mjs', '--check', '--tag', tag], {
      cwd: root,
      stdio: 'inherit'
    });
    run('git', ['push', 'origin', `refs/tags/${tag}`], {cwd: root, stdio: 'inherit'});
    return {version};
  }
  run('npx', versionArgs, {cwd: root, stdio: 'inherit'});
  if (git('status', '--porcelain'))
    throw new Error('Versioning left uncommitted changes; inspect before pushing');
  if (git('describe', '--exact-match', '--tags', 'HEAD') !== tag) {
    throw new Error(`Expected HEAD to be tagged ${tag}`);
  }
  // Push the branch and only this release tag together. The tag starts trusted publishing.
  run('git', ['push', '--atomic', 'origin', `HEAD:refs/heads/${branch}`, `refs/tags/${tag}`], {
    cwd: root,
    stdio: 'inherit'
  });
  return {version};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.some((arg) => !['--dry-run', '--prepared', '--rc'].includes(arg)))
      throw new Error('Usage: yarn publish-beta [--dry-run] [--rc | --prepared]');
    const result = publishBeta({
      root: fileURLToPath(new URL('../', import.meta.url)),
      dryRun: args.includes('--dry-run'),
      prepared: args.includes('--prepared'),
      rc: args.includes('--rc')
    });
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
