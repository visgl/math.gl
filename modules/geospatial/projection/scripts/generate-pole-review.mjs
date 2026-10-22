// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original rendering of the complete retained-finding review and independent precision measurements.
import {readFileSync, writeFileSync} from 'node:fs';
const read = name => JSON.parse(readFileSync(new URL('../test/fixtures/' + name, import.meta.url)));
const review = read('pole-audit-review.json');
const findings = read('pole-audit-findings.json');
const precision = read('pole-precision-qualification.json');
const grouped = new Map();
for (const row of precision.cases) {
  const name = /\+proj=(\w+)/.exec(row.definition)[1];
  if (!grouped.has(name)) grouped.set(name, {count: 0, before: {forward: 0, inverseLatitude: 0}, after: {forward: 0, inverseLatitude: 0}, native: {forward: 0, inverseLatitude: 0}});
  const group = grouped.get(name);
  group.count++;
  for (const engine of ['before', 'after', 'native'])
    for (const metric of ['forward', 'inverseLatitude'])
      group[engine][metric] = Math.max(group[engine][metric], row.results[engine][metric] || 0);
}
const numeric = value => value.toExponential(3);
const measurements = [...grouped].map(([name, g]) => `| ${name} | ${g.count} | ${numeric(g.before.forward)} / ${numeric(g.after.forward)} / ${numeric(g.native.forward)} | ${numeric(g.before.inverseLatitude)} / ${numeric(g.after.inverseLatitude)} / ${numeric(g.native.inverseLatitude)} |`).join('\n');
const table = review.cases.map(row => {
  const current = findings.cases.find(c => c.id === row.id);
  if (!current) throw new Error('Missing reviewed configuration: ' + row.id);
  return `| \`${row.id}\` | ${row.originalFindings.length} → ${current.mismatches.length} | ${row.accuracyFix ? 'Yes' : 'No new formula change'} | ${row.category} | ${row.reason} |`;
}).join('\n');
const remaining = findings.cases.filter(c => c.mismatches.length).length;
const fixed = review.cases.filter(c => c.accuracyFix).length;
const document = `# Review of all 49 retained PROJ findings

Every configuration with a finding at revision \`${review.sourceCommit}\` is listed below. The review found real accuracy gaps in **seven kernels**: LAEA, stereographic, oblique stereographic, spherical AEQD, QSC, Mollweide and polyconic. **${fixed} of the 49 configurations receive a numerical fix.** Some have both a fixed math.gl error and a separate retained oracle/domain difference.

The unchanged native PROJ audit still has **${remaining} configurations with discrepancies** over 144 configurations / 5,579 probes. This is a discrepancy count, not an unfixed-bug count. Every retained configuration has a reviewed disposition; none is promoted into an accuracy pass. The baseline gate still rejects new coordinates, changed rejection policies and worsened measured errors. Updated ceilings record the reviewed formula corrections; the independent precision gates prevent a blanket relaxation.

## Independent numerical evidence

The offline generator evaluates original equations with **mpmath 1.3.0 at 80 decimal digits**, alongside **pyproj 3.7.2 / PROJ 9.5.1**. Runtime packages and CI need neither tool. No package dependency is added. Native raw-operation controls omit the engine-only \`datum=none\` policy and specify WGS84 axes explicitly where needed; each oracle operation is recorded. All inverse expectations start from the **exact stored binary64 x/y**, independently of math.gl; forward inputs are the stored geographic controls. Native coordinates remain in the fixtures and reports. The generator and review/source hashes are checked in CI.

The ${precision.cases.length} precision controls include exact and near poles in both hemispheres, ordinary controls, the original retained numerical probes, and the existing native Mollweide controls. Some inputs repeat to preserve their provenance. The old runtime is measured from \`${precision.baselineCommit}\`. Values below are maxima over these controls, not global error bounds. Forward errors are metres; inverse errors are latitude degrees. Additional tests check physical longitude contribution, Float64 XYZM preservation, all four equatorial QSC face centres and polyconic/orthographic reprojection residuals.

| Method | Controls | Forward: before / after / PROJ | Inverse latitude: before / after / PROJ |
| --- | --- | --- | --- |
${measurements}

For the pole-conditioned Mollweide controls, the ordinary native-reference test now checks the unchanged forward tolerance against the **tighter independent 80-digit expectation**. It retains the original PROJ coordinates for independent inverse testing and the audit. The separate precision tests enforce a 0.2 micrometre forward ceiling; no native tolerance is widened to make an oracle artifact pass.

## Corrections made

- **LAEA:** evaluate the authalic pole complement without subtracting nearly equal integrals; retain its cosine; invert the exact authalic integral with bounded Newton steps instead of the truncated inverse series. Use the same stable latitude in rendering bounds.
- **Stereographic, oblique stereographic and spherical AEQD:** recover inverse latitude with a full Cartesian rotation and \`atan2\`, retaining the horizontal components that \`asin\` discards near a pole.
- **QSC:** evaluate face-centre distances with half angles, preserve sine components in the inverse, and use \`atan2\` for spherical/geodetic latitude. Independent analytic axis tests cover all four equatorial faces; the precision corpus covers both polar faces.
- **Mollweide:** solve a stable pole-complement equation, retain small latitude offsets even when \`sin(latitude)\` rounds to one, use exact mathematical constants, and reject inverses outside the map ellipse. Only the exact pole collapses to zero relative easting.
- **Polyconic:** use the polar tangent-plane inverse limit to remove centimetre-scale residuals, share meridional-radius quadrature to remove the old truncated meridian series, and tighten bounded inverse convergence. Native forward coordinates that PROJ cannot invert must still reproject within a millimetre in our evidence tests.

These corrections are original math.gl arithmetic around the existing attributed ports. Existing proj4js/PROJ SPDX credits and packaged licenses remain; no additional upstream implementation is copied in this review.

## Why the other discrepancies remain

**Native inverse quirks.** [Albers' native inverse](https://github.com/OSGeo/PROJ/blob/9.5.1/src/projections/aea.cpp) uses a fixed authalic pole cutoff that snaps the retained ±89.99° controls to ±90°. [CEA](https://github.com/OSGeo/PROJ/blob/9.5.1/src/projections/cea.cpp) and [LAEA](https://github.com/OSGeo/PROJ/blob/9.5.1/src/projections/laea.cpp) combine rounded authalic values with an inverse series. Equal Earth also returns pole latitudes several microdegrees short. Mollweide's pole iteration leaves a nonzero easting at exact poles. [Robinson's native inverse](https://github.com/OSGeo/PROJ/blob/9.5.1/src/projections/robin.cpp) has interval/knot discrepancies at the retained 5° knots. We retain exact-pole/knot mathematics rather than reproduce those artifacts; their original native outputs remain inspectable.

**Rounded boundaries.** At the opposite-pole LAEA disk edge and the equatorial orthographic limb, a tiny change in projected coordinates can produce a large inverse angular change. In some stored northings the pole offset is below one ulp. No algorithm can reconstruct information absent from the input. Tests retain bounded ulp acceptance and forward residuals, with no uniform inverse-angle guarantee at these boundaries.

**Native inverse failures.** PROJ rejects some of its own near-pole polyconic and visible orthographic forward values. The review tests verify the geographic controls and forward residuals for math.gl's accepted inverses. This is separate from the polyconic residual bug fixed above.

**Intentional singularity/visibility policy.** Mercator poles and stereographic antipodes have infinite projected radius; a finite value from floating-point \`pi/2\` is not the mathematical limit. The AEQD antipode has no unique azimuth, so math.gl rejects it rather than assign a longitude-dependent ring convention. [Native spherical GEOS](https://github.com/OSGeo/PROJ/blob/9.5.1/src/projections/geos.cpp) omits the visibility inequality enforced by its ellipsoidal branch. The retained sphere probes lie behind the horizon: their native inverses move by more than ten latitude degrees to the visible intersection. An independent satellite dot-product test verifies our rejection.

**QSC selected face.** [PROJ's QSC documentation](https://proj.org/en/stable/operations/projections/qsc.html) defines a projection onto one selected cube side. The original retained inverse findings are at its opposite pole, outside the selected square. That raw extension remains ill-conditioned; no new rejection is introduced. New own-face forward differences are the independently verified correction to native cosine cancellation, not an accuracy regression.

## Configuration-by-configuration disposition

“Findings” counts coordinate/direction disagreements before and after this review; one configuration may have more disagreements after a mathematically verified correction. The complete original probes, definitions, dispositions and fix identifiers are in \`pole-audit-review.json\`; measured current differences are in \`pole-audit-findings.json\`.

| Configuration | Findings before → after | Accuracy fix | Disposition | Evidence and decision |
| --- | --- | --- | --- | --- |
${table}

## Regeneration

Use a separate pinned oracle environment with networking disabled by the scripts:

\`\`\`sh
python modules/geospatial/projection/scripts/generate-pole-precision.py
node modules/geospatial/projection/scripts/audit-pole-precision.mjs
node modules/geospatial/projection/scripts/audit-pole-boundaries.mjs modules/geospatial/projection/test/fixtures/pole-audit-findings.json
node modules/geospatial/projection/scripts/generate-pole-review.mjs
node modules/geospatial/projection/scripts/check-native-reference.mjs
\`\`\`

Changing a review disposition or numerical baseline requires reviewing the independent evidence, not merely regenerating the file. The ordinary PROJ corpus, all 49 review evidence tests, and the high-precision forward/inverse gates remain separate checks.
`;
writeFileSync(new URL('../../../../docs/modules/geospatial/projection/pole-findings-review.md', import.meta.url), document);
console.log('Documented all', review.cases.length, 'original findings;', fixed, 'configurations receive accuracy fixes;', remaining, 'retain classified differences.');
