// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original CLI contract smoke with independent constant-offset arithmetic, no external model.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, writeFileSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root = fileURLToPath(new URL('../../../', import.meta.url));
const directory = mkdtempSync(join(tmpdir(), 'math-gl-application-deformation-'));
try {
  const model = join(directory, 'model.mjs'),
    reference = join(directory, 'reference.json'),
    output = join(directory, 'report.json');
  writeFileSync(
    model,
    `export function createModel(){return {
    forward(point,source,target){point.x+=(target-source)*.01;},
    inverse(point,source,target){point.x-=(target-source)*.01;}
  };}`
  );
  const fixture = {
    schemaVersion: 1,
    distanceUnit: 'm',
    velocityUnit: 'm/year',
    epochRange: [2000, 2030],
    forwardToleranceMeters: 1e-10,
    inverseToleranceMeters: 1e-10,
    provenance: {
      authority: 'authored CLI smoke',
      version: '1',
      reference: 'independent constant arithmetic',
      license: 'MIT',
      modelRevision: 'constant-v1'
    },
    cases: [
      {
        id: 'constant-x',
        sourceEpoch: 2010,
        targetEpoch: 2020,
        input: [10, 2, 3],
        forward: [10.1, 2, 3],
        inverseInput: [11, 4, 5],
        inverse: [10.9, 4, 5]
      }
    ]
  };
  const run = () =>
    execFileSync(
      process.execPath,
      [
        join(root, 'modules/projection/scripts/qualify-deformation-stress.mjs'),
        '--model',
        model,
        '--reference',
        reference,
        '--output',
        output
      ],
      {cwd: root, stdio: 'pipe'}
    );
  writeFileSync(reference, JSON.stringify(fixture));
  run();
  const report = JSON.parse(readFileSync(output, 'utf8'));
  assert.equal(report.profile, 'application-provided');
  assert.equal(report.rows[0].results[0].id, 'constant-x');
  assert.equal(report.rows[0].maximumInverseError, 0);
  assert.match(report.referenceSHA256, /^[a-f0-9]{64}$/);
  assert.match(report.modelEntrySHA256, /^[a-f0-9]{64}$/);
  for (const invalid of [
    {...fixture, provenance: {}},
    {...fixture, distanceUnit: 'ft'},
    {...fixture, cases: [{...fixture.cases[0], sourceEpoch: 1900}]},
    {...fixture, cases: [{...fixture.cases[0], inverse: [0, 0, 0]}]}
  ]) {
    writeFileSync(reference, JSON.stringify(invalid));
    assert.throws(run, 'Malformed provenance/units/epochs or mismatched inverse must fail');
  }
  // Authored application-like metadata/assets; no external geodetic model data.
  const assetPath = join(directory, 'authored-model.txt');
  writeFileSync(assetPath, 'authored constant-x amplitude 0.01');
  const metadata = {
    horizontalCRS: 'app:horizontal',
    verticalCRS: 'app:height',
    referenceFrame: 'app:frame',
    frameKind: 'dynamic',
    frameEpoch: 2010
  };
  const operation = {
    id: 'authored:model',
    sourceCRS: 'app:source',
    targetCRS: 'app:target',
    sourceMetadata: metadata,
    targetMetadata: metadata,
    area: [-10, -10, 10, 10],
    coverage: [
      [2, -10, 10, 10],
      [-10, -10, -2, 10]
    ],
    epochRange: [2000, 2030],
    accuracyMeters: null,
    models: [
      {id: 'authored', revision: '1', license: 'MIT', termsReference: 'math.gl authored fixture'}
    ],
    provenance: fixture.provenance
  };
  const scoped = {
    ...fixture,
    operation,
    assets: [
      {
        id: 'authored',
        revision: '1',
        kind: 'model',
        path: 'authored-model.txt',
        sha256: createHash('sha256').update(readFileSync(assetPath)).digest('hex')
      }
    ],
    cases: fixture.cases.map(row => ({
      ...row,
      sourceCRS: 'app:source',
      targetCRS: 'app:target',
      sourceMetadata: metadata,
      targetMetadata: metadata,
      area: [3, 0, 3, 0]
    }))
  };
  writeFileSync(reference, JSON.stringify(scoped));
  run();
  assert.equal(JSON.parse(readFileSync(output, 'utf8')).modelAssets[0].revision, '1');
  for (const invalid of [
    {...scoped, assets: []},
    {...scoped, assets: [{...scoped.assets[0], sha256: '0'.repeat(64)}]},
    {...scoped, cases: [{...scoped.cases[0], area: [0, 0, 0, 0]}]},
    {...scoped, cases: [{...scoped.cases[0], sourceMetadata: {...metadata, frameEpoch: 2000}}]},
    {...scoped, operation: {...operation, models: [{...operation.models[0], license: ''}]}}
  ]) {
    writeFileSync(reference, JSON.stringify(invalid));
    assert.throws(run, 'Unreviewed assets/coverage/frame metadata must fail');
  }
  console.log(
    'Application-owned deformation factory/reference qualification and rejection checks passed'
  );
} finally {
  rmSync(directory, {recursive: true, force: true});
}
