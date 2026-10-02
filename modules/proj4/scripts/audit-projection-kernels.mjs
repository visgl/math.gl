// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Seeded differential stress audit; agreement with upstream is not an accuracy guarantee.
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
const {values} = parseArgs({options: {output: {type: 'string'}}});
const root = fileURLToPath(new URL('../../../', import.meta.url));
const require = createRequire(root + '/package.json'),
  proj4 = require('proj4');
const {build, transform} = require('esbuild');
const native = await import(root + '/modules/proj4/dist/experimental/index.js');
const extra = await build({
  stdin: {
    contents:
      "export {default as ortho} from 'proj4/lib/projections/ortho.js'; export {default as gstmerc} from 'proj4/lib/projections/gstmerc.js'; export {default as equi} from 'proj4/lib/projections/equi.js';",
    resolveDir: root
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false
});
for (const p of Object.values(
  await import(
    'data:text/javascript;base64,' + Buffer.from(extra.outputFiles[0].text).toString('base64')
  )
))
  proj4.Proj.projections.add(p);
async function fixtures(name) {
  const {code} = await transform(
    fs.readFileSync(root + '/modules/proj4/test/fixtures/' + name + '.ts', 'utf8'),
    {loader: 'ts', format: 'esm'}
  );
  return Object.values(
    await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'))
  )[0];
}
const cases = [
  ...(await fixtures('common-projections')),
  ...(await fixtures('catalogue-projections')),
  {id: 'merc-sphere', definition: 'EPSG:3857', center: [0, 0]},
  {id: 'merc-ellipsoid', definition: '+proj=merc +datum=none', center: [0, 0]},
  {id: 'eqc', definition: '+proj=eqc +lat_ts=30', center: [0, 0]}
];
const plugins = Object.values(native).filter(
  v => v && typeof v === 'object' && typeof v.create === 'function'
);
let seed = 0x7a11deed;
const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32;
const attempt = f => {
  try {
    const v = f();
    return v && Number.isFinite(v[0]) && Number.isFinite(v[1]) ? {value: v} : {error: 'non-finite'};
  } catch (e) {
    return {error: String(e?.message || e)};
  }
};
const error = (a, b, angular = false) =>
  Math.max(
    angular ? Math.abs(((((a[0] - b[0] + 180) % 360) + 360) % 360) - 180) : Math.abs(a[0] - b[0]),
    Math.abs(a[1] - b[1])
  );
const rows = [];
for (const fixture of cases) {
  let to = fixture.definition;
  if (to.startsWith('+')) {
    to = to.replace(/\s*\+(?:x_0|y_0|datum)=[^\s]+/g, '') + ' +x_0=0 +y_0=0 +datum=none';
    for (const key of ['lon_0', 'lat_0'])
      if (!to.includes('+' + key + '=') && !/^krovak/.test(fixture.id) && !to.includes('+proj=utm'))
        to += ' +' + key + '=0';
  }
  if (to.includes('+proj=utm')) to = to.replace(/\s*\+(?:x_0|y_0)=[^\s]+/g, '');
  const n = new native.ProjectionEngine({
    from: '+proj=longlat +datum=none',
    to: fixture.definition.includes('+lat_0=') ? to : to.replace(/\s*\+lat_0=[^\s]+/g, ''),
    projections: plugins
  });
  const p = proj4('+proj=longlat +datum=none', to);
  for (const region of ['nearby', 'global']) {
    const counts = {
      tested: 0,
      bothFinite: 0,
      forwardMismatch: 0,
      inverseMismatch: 0,
      nativeRejectsFinite: 0,
      referenceRejects: 0,
      sharedRoundtripFailures: 0
    };
    const examples = {};
    let maxForward = 0,
      maxInverse = 0;
    const sample = (key, row) => {
      examples[key] ||= [];
      if (examples[key].length < 2) examples[key].push(row);
    };
    for (let i = 0; i < 256; i++) {
      const point =
        region === 'nearby'
          ? [
              fixture.center[0] + 10 * (random() - 0.5),
              Math.max(-89.999, Math.min(89.999, fixture.center[1] + 10 * (random() - 0.5)))
            ]
          : [360 * random() - 180, 178 * random() - 89];
      point[0] = ((((point[0] + 180) % 360) + 360) % 360) - 180;
      counts.tested++;
      const pf = attempt(() => p.forward(point.slice())),
        nf = attempt(() => n.project(point));
      if (pf.error) {
        counts.referenceRejects++;
        continue;
      }
      if (nf.error) {
        counts.nativeRejectsFinite++;
        sample('nativeRejectsFinite', {point, error: nf.error, reference: pf.value});
        continue;
      }
      counts.bothFinite++;
      const df = error(nf.value, pf.value);
      maxForward = Math.max(maxForward, df);
      if (df > 1e-5) {
        counts.forwardMismatch++;
        sample('forwardMismatch', {point, native: nf.value, reference: pf.value, delta: df});
      }
      if (fixture.id.startsWith('equi')) continue; // Upstream equi inverse omits its return.
      const pi = attempt(() => p.inverse(pf.value.slice())),
        ni = attempt(() => n.unproject(pf.value));
      if (pi.value && ni.value) {
        const di = error(ni.value, pi.value, true);
        maxInverse = Math.max(maxInverse, di);
        if (di > 1e-8) {
          counts.inverseMismatch++;
          sample('inverseMismatch', {point, native: ni.value, reference: pi.value, delta: di});
        }
        if (error(pi.value, point, true) > 1e-6 && error(ni.value, point, true) > 1e-6)
          counts.sharedRoundtripFailures++;
      } else if (pi.value && ni.error) {
        counts.inverseMismatch++;
        sample('inverseMismatch', {point, error: ni.error, reference: pi.value});
      }
    }
    rows.push({id: fixture.id, definition: to, region, counts, maxForward, maxInverse, examples});
  }
}
const totals = {};
for (const region of ['nearby', 'global']) {
  totals[region] = {};
  for (const r of rows.filter(r => r.region === region))
    for (const [k, v] of Object.entries(r.counts)) totals[region][k] = (totals[region][k] || 0) + v;
}
if (values.output)
  fs.writeFileSync(
    values.output,
    JSON.stringify({seed: '0x7a11deed', cases: cases.length, totals, rows}, null, 2)
  );
console.log(totals);
console.table(
  rows
    .filter(
      r => r.counts.forwardMismatch || r.counts.inverseMismatch || r.counts.nativeRejectsFinite
    )
    .map(r => ({
      id: r.id,
      region: r.region,
      ...r.counts,
      maxForward: r.maxForward,
      maxInverse: r.maxInverse
    }))
);
