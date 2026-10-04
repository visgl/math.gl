// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Reference: https://cgg.mff.cuni.cz/projects/SkylightModelling/
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, readFileSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readCoefficients, sampleSunlight} from './sample-sunlight.mjs';

// No automatic downloads: supply the unmodified, published reference ZIP explicitly.
const archive = process.argv[2];
if (!archive)
  throw new Error('Usage: node modules/sun/scripts/generate-sunlight.mjs <reference.zip>');
const digest = createHash('sha256').update(readFileSync(archive)).digest('hex');
if (digest !== '743e81a7fcbed06408490a303dcf1315083d7988a11fc69608e66f6e5417f9de') {
  throw new Error('Expected the published Hošek-Wilkie 1.4a archive (SHA-256 mismatch)');
}
const moduleRoot = fileURLToPath(new URL('../', import.meta.url));
const temporary = mkdtempSync(join(tmpdir(), 'math-gl-sun-'));
try {
  execFileSync('unzip', ['-q', resolve(archive), '-d', temporary]);
  const source = join(temporary, 'HosekWilkie_SkylightModel_C_Source.1.4a');
  const coefficients = readCoefficients(
    readFileSync(join(source, 'ArHosekSkyModelData_Spectral.h'), 'utf8')
  );
  const data = Array.from({length: 10}, (_, i) =>
    Array.from({length: 91}, (_, altitude) => sampleSunlight(coefficients, altitude, i + 1, 32))
  );
  const notice = readFileSync(join(moduleRoot, 'LICENSE-HOSEK-WILKIE'), 'utf8');
  const header =
    '// SPDX-License-Identifier: BSD-3-Clause\n' +
    '// SPDX-FileCopyrightText: 2012-2013 Lukas Hosek and Alexander Wilkie\n' +
    '// Generated from Hošek-Wilkie 1.4a; do not edit. See scripts/generate-sunlight.mjs.\n' +
    '// Source: https://cgg.mff.cuni.cz/projects/SkylightModelling/\n' +
    '/*\n' +
    notice +
    '*/\n';
  const rows = data.map(
    table => '[\n' + table.map(row => '  ' + JSON.stringify(row)).join(',\n') + '\n]'
  );
  writeFileSync(
    join(moduleRoot, 'src/data/sunlight.ts'),
    header +
      '// [direct R,G,B, diffuse R,G,B], turbidity 1–10, altitude 0–90° at 1° steps.\n' +
      'export const SUNLIGHT_DATA = [\n' +
      rows.join(',\n') +
      '\n];\n'
  );
  const cases = [
    [0, 1],
    [1, 3],
    [30, 3],
    [90, 10],
    [0.5, 2.5],
    [5.5, 4.5],
    [25.5, 6.5],
    [65.5, 9.5]
  ];
  const fixtures = cases.map(([altitude, turbidity]) => ({
    altitude,
    turbidity,
    irradiance: sampleSunlight(coefficients, altitude, turbidity, 64)
  }));
  writeFileSync(
    join(moduleRoot, 'test/data/sunlight-reference.ts'),
    header +
      '// Independent 64x128 sky quadrature (runtime table uses 32x64).\n' +
      'export const SUNLIGHT_REFERENCE = ' +
      JSON.stringify(fixtures, null, 2) +
      ';\n'
  );
  execFileSync(join(moduleRoot, '../../node_modules/.bin/biome'), [
    'format',
    '--write',
    join(moduleRoot, 'src/data/sunlight.ts'),
    join(moduleRoot, 'test/data/sunlight-reference.ts')
  ]);
} finally {
  rmSync(temporary, {recursive: true, force: true});
}
