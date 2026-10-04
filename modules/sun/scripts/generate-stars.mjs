// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const revision = 'abffb3b7223ae37e879b0a3ff5b49ad06aed5576';
const digest = '28cb835cbd2d72ced9ef9d20d9b5d92f05f649dfd39a509b1cf82dbd3c5f2fb9';
const input = readFileSync(process.argv[2]);
if (createHash('sha256').update(input).digest('hex') !== digest) {
  throw new Error('Unexpected BSC5 input: use the pinned source documented in stars.md');
}
const stars = JSON.parse(input).filter(s => s.Vmag !== undefined && s.RAh !== undefined && s.DEd !== undefined)
  .sort((a, b) => Number(a.Vmag) - Number(b.Vmag) || Number(a.HR) - Number(b.HR)).slice(0, 7000);
const radians = Math.PI / 180;
const number = (s, key, scale = 1) => s[key] === undefined ? null : Number(s[key]) * scale;
const round = n => Number(n.toFixed(10));
const rows = stars.map(s => [Number(s.HR),
  round((Number(s.RAh) + Number(s.RAm) / 60 + Number(s.RAs) / 3600) * 15 * radians),
  round((s['DE-'] === '-' ? -1 : 1) * (Number(s.DEd) + Number(s.DEm) / 60 + Number(s.DEs) / 3600) * radians),
  Number(s.Vmag), number(s, 'B-V'), number(s, 'pmRA', 1000), number(s, 'pmDE', 1000),
  number(s, 'Parallax', 1000), number(s, 'RadVel'), `${s.n_Parallax === 'D' ? 'D' : ''}|${s.n_RadVel || ''}`, s.Name || '']);
const output = `// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileCopyrightText: Copyright (c) 2016 Bretton Wade
// SPDX-FileComment: Generated BSC5 subset; retain LICENSE-BRIGHT-STARS.
// Source: https://github.com/brettonw/YaleBrightStarCatalog/tree/${revision}
// Input SHA-256: ${digest}
// Regenerate with modules/sun/scripts/generate-stars.mjs; do not edit.
import type {StarCatalogRow} from '../star-types';

export const STAR_CATALOG_DATA: readonly StarCatalogRow[] = [
${rows.map(r => `  ${JSON.stringify(r)}`).join(',\n')}
];
`;
const target = new URL('../src/data/bright-stars.ts', import.meta.url);
const biome = fileURLToPath(new URL('../../../node_modules/@biomejs/biome/bin/biome', import.meta.url));
const formatted = execFileSync(process.execPath, [biome, 'format', '--stdin-file-path=' + fileURLToPath(target)], {input: output, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024});
if (process.argv.includes('--check')) {
  if (readFileSync(target, 'utf8') !== formatted) throw new Error('Generated star catalog differs');
} else writeFileSync(target, formatted);
