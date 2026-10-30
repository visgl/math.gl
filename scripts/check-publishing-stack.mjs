// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

function packageFile(entry, name) {
  for (let dir = dirname(entry); dir !== dirname(dir); dir = dirname(dir)) {
    const path = resolve(dir, 'package.json');
    if (existsSync(path) && JSON.parse(readFileSync(path)).name === name) return path;
  }
  throw new Error(`Cannot locate package metadata for ${name}`);
}

export function checkPublishingStack() {
  const require = createRequire(import.meta.url);
  const lernaPath = packageFile(require.resolve('lerna'), 'lerna');
  const lerna = JSON.parse(readFileSync(lernaPath));
  assert.equal(lerna.version, '10.1.1');
  const lernaRequire = createRequire(lernaPath);
  const publishPath = packageFile(lernaRequire.resolve('libnpmpublish'), 'libnpmpublish');
  const publishing = JSON.parse(readFileSync(publishPath));
  assert.equal(publishing.version, '12.0.1');
  const publishRequire = createRequire(publishPath);
  const sigstorePath = publishRequire.resolve('sigstore');
  const sigstoreConfig = publishRequire(resolve(dirname(sigstorePath), 'config.js'));
  // Build the real high-level attestation path; no signing or network calls occur.
  const builder = sigstoreConfig.createBundleBuilder('dsseEnvelope', {
    identityToken: 'offline-stack-check'
  });
  const client = builder.witnesses.find((witness) => witness.tlogV1)?.tlogV1;
  assert.equal(
    client?.fetchOnConflict,
    true,
    'The actual publishing stack must recover Rekor conflicts'
  );
  return {lernaCli: resolve(dirname(lernaPath), lerna.bin.lerna), client, sigstorePath};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  checkPublishingStack();
  process.stdout.write(
    'Pinned publisher and provenance-preserving Rekor conflict recovery verified\n'
  );
}
