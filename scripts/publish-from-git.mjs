// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
import {readFileSync, readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const writeLog = (message) => process.stdout.write(`${message}\n`);
const registry = 'https://registry.npmjs.org';
export const retryablePublishError = (text) =>
  /TLOG_CREATE_ENTRY_ERROR|ECONNRESET|ETIMEDOUT|EAI_AGAIN|E50[0234]/.test(text);

export function validateRelease({tag, version, versions, changelog}) {
  if (!/^v\d+\.\d+\.\d+(?:-(?:alpha|beta|rc)\.\d+)?$/.test(tag))
    throw new Error('Expected an explicit release tag');
  if (tag !== `v${version}` || versions.some((v) => v !== version))
    throw new Error('Release tag and workspace versions differ');
  if (!changelog.split('\n').some((line) => line.trim() === `## ${tag}`))
    throw new Error('Release notes missing');
}

// A recovery build may differ from the tag only in the publishing implementation.
export function validateRecoveryFiles(files) {
  const allowed = new Set([
    '.github/workflows/release.yml',
    '.github/workflows/test.yml',
    'package.json',
    'yarn.lock',
    'scripts/publish-from-git.mjs',
    'scripts/publish-from-git.test.mjs',
    'scripts/check-publishing-stack.mjs',
    'dev-docs/releases.md',
    '.yarn/patches/sigstore-npm-5.0.0-conflict-recovery.patch'
  ]);
  const unsafe = files.filter((file) => !allowed.has(file));
  if (unsafe.length) throw new Error(`Recovery changes release sources: ${unsafe.join(', ')}`);
}

export async function ensureRelease({request, repository, tag, notes}) {
  const path = `/repos/${repository}/releases/tags/${encodeURIComponent(tag)}`;
  const existing = await request(path);
  if (existing.status === 200) return;
  if (existing.status !== 404) throw new Error(`GitHub release lookup failed: ${existing.status}`);
  const created = await request(`/repos/${repository}/releases`, {
    method: 'POST',
    body: JSON.stringify({tag_name: tag, name: tag, body: notes, prerelease: tag.includes('-')})
  });
  // Another runner may have created the same release between GET and POST.
  if (created.status === 422 && (await request(path)).status === 200) return;
  if (created.status !== 201) throw new Error(`GitHub release creation failed: ${created.status}`);
}

export async function publishRemaining({
  readState,
  publish,
  wait,
  attempts = 3,
  polls = 60,
  log = writeLog
}) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const state = await readState();
    if (state.every((p) => p.exists)) break;
    const result = publish();
    if (result.status === 0) break;
    if (!retryablePublishError(result.output))
      throw new Error('Non-retryable publishing failure; inspect publisher output');
    if (attempt === attempts)
      throw new Error('Publishing retries exhausted; rerun the same tag after investigating');
    log(`Retryable publish failure; checking registry before attempt ${attempt + 1}`);
    await wait(30000);
  }
  for (let poll = 0; poll < polls; poll++) {
    const state = await readState();
    const pending = state.filter((p) => !p.exists || !p.tagged || p.provenance === false);
    if (!pending.length) return;
    log(`Waiting for npm versions/dist-tags/provenance: ${pending.map((p) => p.name).join(', ')}`);
    if (poll + 1 < polls) await wait(15000);
  }
  throw new Error('npm verification incomplete; do not bump versions or move the tag');
}

function git(...args) {
  return execFileSync('git', args, {cwd: root, encoding: 'utf8'}).trim();
}

function releaseContext(tag) {
  const version = JSON.parse(readFileSync(resolve(root, 'lerna.json'))).version;
  const packages = readdirSync(resolve(root, 'modules'))
    .map((dir) => ({
      dir,
      ...JSON.parse(readFileSync(resolve(root, 'modules', dir, 'package.json')))
    }))
    .filter((p) => !p.private);
  if (!packages.length) throw new Error('No publishable workspaces found');
  for (const p of packages)
    if (p.publishConfig?.provenance === false) throw new Error(`Provenance disabled for ${p.name}`);
  const changelog = readFileSync(resolve(root, 'CHANGELOG.md'), 'utf8');
  validateRelease({tag, version, versions: packages.map((p) => p.version), changelog});
  git('merge-base', '--is-ancestor', `${tag}^{commit}`, 'HEAD');
  validateRecoveryFiles(git('diff', '--name-only', tag, 'HEAD').split('\n').filter(Boolean));
  const oldPackage = JSON.parse(git('show', `${tag}:package.json`));
  const currentPackage = JSON.parse(readFileSync(resolve(root, 'package.json')));
  // Root manifest differences must be limited to the dedicated publisher dependency/patch.
  for (const p of [oldPackage, currentPackage]) {
    delete p.devDependencies?.lerna;
    delete p.resolutions?.['sigstore@npm:^5.0.0'];
    if (!Object.keys(p.resolutions || {}).length) delete p.resolutions;
  }
  assert.deepEqual(
    currentPackage,
    oldPackage,
    'Recovery modifies unrelated root package configuration'
  );
  const notes = changelog.split(`## ${tag}\n`)[1].split('\n## ')[0].trim();
  return {version, packages, notes};
}

async function main() {
  const args = process.argv.slice(2);
  const tagIndex = args.indexOf('--tag');
  const tag =
    tagIndex >= 0 ? args[tagIndex + 1] : git('describe', '--exact-match', '--tags', 'HEAD');
  const known = args.filter((_, i) => i !== tagIndex + 1 || tagIndex < 0);
  if (known.some((a) => !['--tag', '--check'].includes(a)))
    throw new Error('Usage: publish-from-git.mjs [--tag vX.Y.Z] [--check]');
  const {packages, notes} = releaseContext(tag);
  if (args.includes('--check')) {
    writeLog(`Release source check passed: ${tag}`);
    return;
  }
  if (!process.env.GITHUB_ACTIONS || !process.env.ACTIONS_ID_TOKEN_REQUEST_URL)
    throw new Error('Use GitHub Actions trusted publishing');
  if (process.env.NPM_CONFIG_PROVENANCE === 'false')
    throw new Error('Provenance must remain enabled');
  const {checkPublishingStack} = await import('./check-publishing-stack.mjs');
  const {lernaCli} = checkPublishingStack();
  const repository = 'visgl/math.gl';
  if (process.env.GITHUB_REPOSITORY !== repository)
    throw new Error('Unexpected publishing repository');
  const request = (path, options = {}) =>
    fetch(`https://api.github.com${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json'
      }
    });
  await ensureRelease({request, repository, tag, notes});
  const distTag = tag.includes('-') ? 'beta' : 'latest';
  const readState = async () =>
    Promise.all(
      packages.map(async (p) => {
        const url = `${registry}/${p.name}?release_verification=${Date.now()}`;
        const response = await fetch(url, {headers: {'Cache-Control': 'no-cache'}});
        if (response.status === 404)
          return {name: p.name, exists: false, tagged: false, provenance: false};
        if (!response.ok) throw new Error(`npm lookup failed for ${p.name}: ${response.status}`);
        const data = await response.json();
        return {
          name: p.name,
          exists: !!data.versions?.[p.version],
          tagged: data['dist-tags']?.[distTag] === p.version,
          provenance: !!data.versions?.[p.version]?.dist?.attestations?.provenance
        };
      })
    );
  await publishRemaining({
    readState,
    wait: (ms) => new Promise((r) => setTimeout(r, ms)),
    publish: () => {
      const result = spawnSync(
        process.execPath,
        [
          lernaCli,
          'publish',
          'from-package',
          '--yes',
          '--dist-tag',
          distTag,
          '--concurrency',
          '1',
          '--no-commit-hooks'
        ],
        {
          cwd: root,
          encoding: 'utf8',
          maxBuffer: 32 * 1024 * 1024,
          env: {
            ...process.env,
            NPM_CONFIG_PROVENANCE: 'true',
            npm_config_provenance: 'true',
            NPM_CONFIG_PREFER_ONLINE: 'true'
          }
        }
      );
      const output = `${result.stdout || ''}${result.stderr || ''}`;
      process.stdout.write(output);
      if (result.error) throw result.error;
      return {status: result.status, output};
    }
  });
  writeLog(`Verified all ${packages.length} packages at ${tag} with npm dist-tag ${distTag}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
