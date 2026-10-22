// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original reproducible cross-implementation discrepancy measurements; not a global accuracy proof.
import {build} from 'esbuild';
import {createHash} from 'node:crypto';
import {mkdtempSync, readFileSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
const temporary = mkdtempSync(join(tmpdir(), 'mathgl-geodesic-qualification-'));
try {
  const outfile = join(temporary, 'runtime.mjs');
  await build({entryPoints: [fileURLToPath(new URL('../../src/ellipsoid-geodesic.ts', import.meta.url))],
    outfile, bundle: true, platform: 'node', format: 'esm'});
  const {EllipsoidGeodesic} = await import(pathToFileURL(outfile).href);
  const bytes = readFileSync(new URL('../../test/ellipsoid/geodesic-qualification.json', import.meta.url));
  const reference = JSON.parse(bytes);
  const maxima = {s12Metres: 0, m12Metres: 0, scale: 0, latitudeDegrees: 0,
    physicalLongitudeRadians: 0, transverseBearingMetres: 0};
  const angle = (a, b) => (((a - b + 540) % 360) - 180) * Math.PI / 180;
  for (const row of reference.cases) {
    const [a, b] = row.axes;
    const solver = new EllipsoidGeodesic({semiMajorAxis: a, semiMinorAxis: b});
    const actual = row.mode === 'I' ? solver.inverse(...row.input) : solver.direct(...row.input);
    const expected = row.expected;
    const earth = 6378137 / a;
    maxima.s12Metres = Math.max(maxima.s12Metres, Math.abs(actual.s12 - expected.s12) * earth);
    maxima.m12Metres = Math.max(maxima.m12Metres, Math.abs(actual.m12 - expected.m12) * earth);
    maxima.scale = Math.max(maxima.scale, Math.abs(actual.M12 - expected.M12), Math.abs(actual.M21 - expected.M21));
    maxima.latitudeDegrees = Math.max(maxima.latitudeDegrees, Math.abs(actual.lat2 - expected.lat2));
    maxima.physicalLongitudeRadians = Math.max(maxima.physicalLongitudeRadians,
      Math.abs(angle(actual.lon2, expected.lon2) * Math.cos(expected.lat2 * Math.PI / 180)));
    maxima.transverseBearingMetres = Math.max(maxima.transverseBearingMetres,
      ...['azi1', 'azi2'].map(k => Math.abs(angle(actual[k], expected[k]) * expected.m12) * earth));
  }
  const report = {oracle: reference.oracle, controls: reference.cases.length,
    fixtureSHA256: createHash('sha256').update(bytes).digest('hex'),
    normalizationRadius: 6378137, maxima};
  const text = JSON.stringify(report, null, 2) + '\n';
  if (process.argv[2]) writeFileSync(process.argv[2], text);
  else console.log(text);
} finally {
  rmSync(temporary, {recursive: true, force: true});
}
