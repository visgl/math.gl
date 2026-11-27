// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {cliff} from '../../examples/geospatial/terrain-sampling/src/qualification/qualify.mjs';
const raw = process.argv[2];
if (!raw) throw new Error('Usage: node pack.mjs RAW_REFERENCE_DIRECTORY');
const output = new URL('../../examples/geospatial/terrain-sampling/src/qualification/artifacts/', import.meta.url);
mkdirSync(output, {recursive: true});
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = {studyRevision: 'd0767a5ef5f8e6281d39d89a98593589e25ca248', cdtrRevision: '141fe36c084a6954f9bd05594ac809c1fbc8a302', sourceRevision: '7c31b41d48ff7ac20ccd28850d28ad495f60f4ed', cases: []};
for (const name of ['step', 'pacific', 'sierra']) {
  const filename = name === 'sierra' ? 'sierra-nodata-streaming.json' : 'pacific-streaming.json';
  const sourceBytes = name === 'step' ? null : readFileSync(new URL(`../../modules/geospatial/test/terrain/fixtures/${filename}`, import.meta.url));
  const expected = {pacific: 'f414dfdc8545fd552cada4b09f2d19e2900e0367022f4573c802237716f98f79', sierra: '7bca9b77c3e1a51972dc183062e8ce54af9fff8f2e0feb07131abd14127dc09e'};
  if (sourceBytes && hash(sourceBytes) !== expected[name]) throw new Error('Pinned source fixture changed');
  const source = sourceBytes ? JSON.parse(sourceBytes) : {};
  for (const tolerance of name === 'step' ? [0.25, 0.5, 1, 2] : [10, 20, 40]) {
    const f = JSON.parse(readFileSync(`${raw}/${name}-${tolerance}.json`));
    f.heights = source.heights || Array.from({length: 257 * 257}, (_, i) => cliff(i % 257, Math.floor(i / 257)));
    f.domainSegments = name === 'pacific' ? JSON.parse(readFileSync(`${raw}/pacific-domain.json`)) : name === 'sierra' ? f.segments : [[[0, 0, 0], [256, 0, 0]], [[256, 0, 0], [256, 256, 0]], [[256, 256, 0], [0, 256, 0]], [[0, 256, 0], [0, 0, 0]]];
    const bytes = gzipSync(JSON.stringify(f), {level: 9});
    const file = `${name}-${tolerance}.json.gz`;
    writeFileSync(new URL(file, output), bytes);
    const {heights, ...metadata} = source;
    manifest.cases.push({name, tolerance, file, sha256: hash(bytes), sourceFileSha256: sourceBytes ? hash(sourceBytes) : null, source: metadata, versions: f.versions});
  }
}
writeFileSync(new URL('manifest.json', output), JSON.stringify(manifest, null, 2) + '\n');
