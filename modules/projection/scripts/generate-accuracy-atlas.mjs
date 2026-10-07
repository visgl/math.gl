// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original maintained projection domain scorecard from independent oracle samples.
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {bundleRuntime} from './benchmark-runtime.mjs';
const root = fileURLToPath(new URL('../../../', import.meta.url));
const fixtures = new URL('../test/fixtures/', import.meta.url);
const inputs = JSON.parse(readFileSync(new URL('accuracy-cases.json', fixtures)));
const inventory = JSON.parse(readFileSync(new URL('parity-inventory.json', fixtures)));
const named = new Set(inputs.cases.map(row => /\+proj=(\w+)/.exec(row.definition)[1]));
assert.deepEqual(
  [...named, 'geocent'].sort(),
  inventory.projections
    .map(row => row.id)
    .filter(name => name !== 'gauss')
    .sort()
);
const temporary = mkdtempSync(join(tmpdir(), 'math-gl-atlas-'));
try {
  const outfile = join(temporary, 'runtime.mjs');
  await bundleRuntime(root, 'modules/projection/test/accuracy-workload.ts', outfile);
  const {qualifyAccuracy} = await import(pathToFileURL(outfile).href);
  const measurements = qualifyAccuracy();
  const rows = measurements.map((row, i) => {
    const {definition, oracleNotes, forwardTolerance, inverseTolerance} = inputs.cases[i];
    return {...row, definition, oracleNotes, forwardTolerance, inverseTolerance};
  });
  const report = {
    oracle: 'pyproj 3.7.2 / PROJ 9.5.1',
    upstreamComparison: 'proj4js 2.22.0',
    scope:
      'Observed maxima at exact stored sampled inputs; configured test ceilings are regression gates, not mathematical global bounds.',
    cases: rows
  };
  writeFileSync(
    new URL('qualification/accuracy-domains.json', fixtures),
    JSON.stringify(report, null, 2) + '\n'
  );
  const fmt = x => x.toExponential(2);
  const table = rows
    .map(row => {
      const b = row.bounds;
      return `| ${row.id} | ${b.west}…${b.east} / ${b.south}…${b.north} | ${row.points} | ${fmt(row.errors.forward.maximum)} / ${fmt(row.forwardTolerance)} | ${fmt(row.errors.inverse.maximum)} / ${fmt(row.inverseTolerance)} |`;
    })
    .join('\n');
  const document = `# Projection accuracy domains\n\nEvery named algorithm has independent forward and inverse references. This scorecard expands seeded scalar and Float64 XYZM qualification to **42 configurations, 11,160 points and 36 horizontal algorithms**. Geocentric conversion is covered separately by the three-dimensional PROJ corpus and the [nearest-normal qualification](./ellipsoid-qualification.md).\n\nEach rectangle below belongs to the exact parameter configuration in the [machine-readable report](https://github.com/visgl/math.gl/blob/master/modules/projection/test/fixtures/qualification/accuracy-domains.json). It is a tested region, not an inferred global validity domain. Regional formulae, approximate transverse Mercator, map seams, antipodes, projection knots and perspective visibility boundaries need their own qualified regions. The report retains the worst observed coordinate as well as every test ceiling. No rejected samples are silently removed.\n\nForward maxima and ceilings are metres; inverse values are degrees. The identity geographic profile uses degrees in both directions. Ceilings are regression gates over these samples, not mathematical bounds at unsampled coordinates. Both directions start from independent PROJ values; roundtrip agreement is an additional check. The oracle remains pinned to pyproj 3.7.2 / PROJ 9.5.1 with networking disabled. The latest proj4js npm reference was rechecked on October 4, 2026: 2.22.0.\n\n| Configuration | Longitude / latitude rectangle (degrees) | Points | Forward observed / ceiling | Inverse observed / ceiling |\n| --- | --- | --- | --- | --- |\n${table}\n\nThe polar ellipsoidal azimuthal-equidistant path now integrates the meridional radius with bounded Gauss-Legendre quadrature and inverts the same integral with safeguarded Newton updates. It replaces the old truncated series; the two polar profiles enforce a 10 micrometre PROJ comparison ceiling across the tested domain. This does not certify arbitrary eccentricities.\n\nVan der Grinten uses rationalized expressions to avoid subtracting nearly equal terms. At the retained near-equator regression, an original 80-digit Decimal evaluation matches math.gl within 10 nanometres, while the pinned PROJ oracle differs by 20.864 micrometres. Its 30 micrometre comparison ceiling records that oracle limitation. The independent Decimal check is a separate strict regression.\n\nTo enforce an application-qualified rectangle in both directions, use the optional [ProjectionAnalysis](./api-reference/projection-analysis.md) interface. Its domain is explicit; it does not automatically certify an algorithm or select a datum operation.\n\nRegenerate with the pinned oracle environment, then run:\n\n\`\`\`sh\npython modules/projection/scripts/generate-accuracy-reference.py\nnode modules/projection/scripts/check-accuracy-reference.mjs\nnode modules/projection/scripts/generate-accuracy-atlas.mjs\n\`\`\`\n`;
  writeFileSync(
    new URL('../../../docs/modules/projection/accuracy-domains.md', import.meta.url),
    document
  );
  console.log(
    'Accuracy atlas qualified:',
    rows.length,
    'configurations;',
    named.size + 1,
    'named algorithms including geocent.'
  );
} finally {
  rmSync(temporary, {recursive: true, force: true});
}
