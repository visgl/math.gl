// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original source-matched evidence consolidation; never pools environments or invents missing measurements.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync} from 'node:fs';
import {resolve, dirname, basename} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
import {codeFingerprint, benchmarkFingerprint} from './benchmark-metadata.mjs';
const HASH = /^[a-f0-9]{64}$/;
const ERROR_KEYS = [
  'forward',
  'inverse',
  'roundtrip',
  'flatForward',
  'flatInverse',
  'flatRoundtrip'
];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const finite = (n, label) =>
  assert(
    typeof n === 'number' && Number.isFinite(n) && n >= 0,
    label + ' must be finite/nonnegative'
  );
const positive = (n, label) => {
  finite(n, label);
  assert(Number.isSafeInteger(n) && n > 0, label + ' must be a positive integer');
};
const median = values => {
  const sorted = values.slice().sort((a, b) => a - b),
    middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const quantile = (values, fraction) => {
  const sorted = values.slice().sort((a, b) => a - b);
  const index = (sorted.length - 1) * fraction,
    low = Math.floor(index);
  return sorted[low] + (sorted[Math.ceil(index)] - sorted[low]) * (index - low);
};
const close = (actual, expected, label) =>
  assert(Math.abs(actual - expected) <= Math.max(1e-8, expected * 1e-10), label);
const key = r => JSON.stringify([r.name, r.precision, r.dimension, r.direction, r.distribution]);
function identity(actual, expected) {
  assert.deepEqual(actual, expected, 'Measured dependency identity mismatch');
  assert(HASH.test(actual?.proj4?.entrySHA256), 'Installed proj4 entry hash required');
  assert(/^\d+\.\d+\.\d+$/.test(actual.proj4.version), 'Exact comparator version required');
  assert(
    typeof actual.projectionVersion === 'string' && actual.projectionVersion,
    'Projection package version required'
  );
}
function metadata(actual, manifest, workload = false) {
  assert.equal(actual?.sourceSHA256, manifest.sourceSHA256, 'Source fingerprint mismatch');
  identity(actual.dependencies, manifest.dependencies);
  if (workload)
    assert.equal(actual.workloadSHA256, manifest.workloadSHA256, 'Workload fingerprint mismatch');
  for (const field of ['date', 'cpu', 'platform', 'arch'])
    assert(
      typeof actual[field] === 'string' && actual[field],
      'Environment ' + field + ' required'
    );
  assert(Number.isFinite(Date.parse(actual.date)), 'Valid collection date required');
  positive(actual.samples, 'Sample count');
  assert(actual.samples >= 3, 'At least three samples required');
}
function accuracy(rows, expected) {
  assert(
    Array.isArray(rows) && rows.length === expected.length,
    'Complete independent accuracy inventory required'
  );
  const seen = new Set();
  for (const row of rows) {
    assert(!seen.has(row.id), 'Duplicate accuracy domain');
    seen.add(row.id);
    const reference = expected.find(r => r.id === row.id);
    assert(reference, 'Unknown accuracy domain');
    assert.deepEqual(row.bounds, reference.bounds, 'Accuracy domain changed');
    assert.equal(row.points, reference.points, 'Accuracy sample count changed');
    positive(row.points, 'Accuracy points');
    assert.deepEqual(
      Object.keys(row.errors).sort(),
      ERROR_KEYS.slice().sort(),
      'Complete error metrics required'
    );
    for (const field of ERROR_KEYS) {
      const m = row.errors[field];
      finite(m.maximum, 'Accuracy error');
      assert(
        Array.isArray(m.input) && m.input.length === 2 && m.input.every(Number.isFinite),
        'Worst input required'
      );
    }
  }
  return rows;
}
function throughput(rows, meta) {
  assert(Array.isArray(rows) && rows.length, 'Throughput rows required');
  const seen = new Set(),
    scenarios = new Map();
  for (const row of rows) {
    assert(typeof row.name === 'string' && row.name, 'Scenario name required');
    assert(
      ['Float32', 'Float64'].includes(row.precision) &&
        [2, 3, 4].includes(row.dimension) &&
        ['project', 'unproject'].includes(row.direction),
      'Unsupported benchmark layout'
    );
    assert.equal(row.distribution, meta.distribution, 'Distribution differs within report');
    assert.equal(row.points, meta.points, 'Point count differs within report');
    positive(row.points, 'Points');
    positive(row.iterations, 'Iterations');
    assert(!seen.has(key(row)), 'Duplicate throughput row');
    seen.add(key(row));
    scenarios.set(row.name, (scenarios.get(row.name) || 0) + 1);
    assert(
      typeof row.timingLimited === 'boolean' && typeof row.unstable === 'boolean',
      'Timing/variation flags required'
    );
    finite(meta.minSampleMs, 'Minimum sample window');
    assert(
      Array.isArray(row.measurements) && row.measurements.length === 3,
      'Exactly three benchmark implementations required'
    );
    for (const m of row.measurements) {
      for (const field of ['milliseconds', 'p10', 'p90', 'aggregateMilliseconds'])
        finite(m[field], 'Duration ' + field);
      assert(
        m.p10 <= m.milliseconds + 1e-8 && m.milliseconds <= m.p90 + 1e-8,
        'Invalid percentile order'
      );
      assert(Array.isArray(m.samples) && m.samples.length === meta.samples, 'Raw samples required');
      m.samples.forEach(n => finite(n, 'Raw sample'));
      const observed = median(m.samples);
      close(
        m.milliseconds,
        observed / row.iterations,
        'Median does not match raw samples/iterations'
      );
      close(m.aggregateMilliseconds, observed, 'Aggregate median does not match raw samples');
      close(m.p10, quantile(m.samples, 0.1) / row.iterations, 'p10 does not match raw samples');
      close(m.p90, quantile(m.samples, 0.9) / row.iterations, 'p90 does not match raw samples');
    }
  }
  assert(
    [...scenarios.values()].every(n => n === 12),
    'Complete precision/dimension/direction matrix required'
  );
  for (const row of rows) {
    const limited =
      meta.minSampleMs === 0 ||
      row.measurements.some(
        m => m.aggregateMilliseconds < meta.minSampleMs || m.aggregateMilliseconds === 0
      );
    const variable = row.measurements.some(m => m.p90 - m.p10 > m.milliseconds * 0.25);
    assert(!limited || row.timingLimited, 'Understated timing limitation');
    assert(!variable || row.unstable, 'Understated variation');
  }
  return rows.map(row => ({
    ...row,
    ownedInputBytes: row.points * row.dimension * (row.precision === 'Float64' ? 8 : 4),
    millionPointsPerSecond: row.measurements.map(m =>
      m.milliseconds > 0 ? row.points / m.milliseconds / 1000 : null
    ),
    speedupAgainstProj4: row.measurements
      .slice(0, 2)
      .map(m =>
        !row.timingLimited &&
        !row.unstable &&
        m.milliseconds > 0 &&
        row.measurements[2].milliseconds > 0
          ? row.measurements[2].milliseconds / m.milliseconds
          : null
      )
  }));
}
/** Data-only consolidation. Every raw input remains independently attributable. */
export function buildScorecard(manifest, node, browserReports, {allowPartial = false} = {}) {
  assert.equal(manifest.schemaVersion, 1, 'Unsupported manifest');
  assert(
    HASH.test(manifest.sourceSHA256) && HASH.test(manifest.workloadSHA256),
    'Pinned source/workload hashes required'
  );
  assert(HASH.test(node.accuracy.referenceSHA256), 'Independent reference hash required');
  assert.equal(node.accuracy.sourceSHA256, manifest.sourceSHA256, 'Accuracy source mismatch');
  metadata(node.throughput.metadata, manifest, true);
  metadata(node.startup.metadata, manifest);
  metadata(node.memory.metadata, manifest);
  assert.equal(node.throughput.schemaVersion, 2, 'Unsupported throughput report');
  assert.equal(node.memory.schemaVersion, 1, 'Unsupported memory report');
  for (const report of [node.throughput, node.startup, node.memory])
    assert(
      typeof report.metadata.node === 'string' && report.metadata.node,
      'Node version required'
    );
  const bundle = manifest.bundleMethodology;
  assert(
    bundle?.format === 'browser ESM' &&
      bundle.target === 'es2020' &&
      bundle.minified === true &&
      bundle.gzipLevel === 9 &&
      bundle.decoderAndDataIncluded === false &&
      typeof bundle.node === 'string' &&
      bundle.node,
    'Unsupported bundle methodology'
  );
  const implementations = [
    'math.gl flat',
    'math.gl scalar',
    'proj4js ' + manifest.dependencies.proj4.version
  ];
  assert.deepEqual(
    node.throughput.metadata.implementations,
    implementations,
    'Comparator column mismatch'
  );
  const nodeRows = throughput(node.throughput.rows, node.throughput.metadata);
  const expectedKeys = nodeRows.map(key).sort();
  const nodeAccuracy = accuracy(node.accuracy.cases, node.accuracy.cases);
  assert(
    HASH.test(manifest.accuracyProfile?.inputsSHA256),
    'Reviewed accuracy profile hash required'
  );
  const domains = manifest.accuracyProfile.domains;
  assert(
    Array.isArray(domains) && domains.length === nodeAccuracy.length,
    'Complete reviewed domain inventory required'
  );
  assert.equal(new Set(domains.map(d => d.id)).size, domains.length, 'Duplicate reviewed domain');
  const qualifyAccuracy = rows => {
    for (const row of rows) {
      const domain = domains.find(d => d.id === row.id);
      assert(domain, 'Unreviewed accuracy domain');
      assert.deepEqual(row.bounds, domain.bounds, 'Reviewed domain bounds differ');
      for (const field of ERROR_KEYS) {
        const limit = field.toLowerCase().includes('roundtrip')
          ? domain.roundtripTolerance
          : field.toLowerCase().includes('inverse')
            ? domain.inverseTolerance
            : domain.forwardTolerance;
        finite(limit, 'Reviewed accuracy allowance');
        assert(
          row.errors[field].maximum <= limit,
          'Accuracy exceeds reviewed allowance: ' + row.id + ' ' + field
        );
      }
    }
    return rows;
  };
  qualifyAccuracy(nodeAccuracy);

  assert(
    Array.isArray(node.throughput.allocations) && node.throughput.allocations.length,
    'Node allocation sampling required'
  );
  const allocationKeys = new Set();
  for (const row of node.throughput.allocations) {
    assert(implementations.includes(row.implementation), 'Unknown allocation implementation');
    assert(
      nodeRows.some(r => r.name === row.case),
      'Unknown allocation scenario'
    );
    assert([2, 4].includes(row.dimension), 'Unsupported allocation layout');
    finite(row.sampledEstimatedBytesPerPoint, 'Allocation estimate');
    finite(row.sampleCount, 'Allocation samples');
    assert(Number.isSafeInteger(row.sampleCount), 'Allocation sample count must be integral');
    positive(row.points, 'Allocation points');
    const k = JSON.stringify([row.case, row.dimension, row.implementation]);
    assert(!allocationKeys.has(k), 'Duplicate allocation row');
    allocationKeys.add(k);
  }
  assert.equal(
    allocationKeys.size,
    new Set(nodeRows.map(r => r.name)).size * 6,
    'Complete Node allocation matrix required'
  );
  const startupNames = ['native-selected', 'native-barrel', 'proj4', 'projection'];
  assert(
    Array.isArray(node.startup.results) &&
      node.startup.results.length === startupNames.length * node.startup.metadata.samples,
    'Complete cold startup samples required'
  );
  const startupKeys = new Set();
  for (const r of node.startup.results) {
    assert(startupNames.includes(r.implementation), 'Unknown startup implementation');
    assert(
      Number.isInteger(r.sample) && r.sample >= 0 && r.sample < node.startup.metadata.samples,
      'Startup sample index'
    );
    const k = r.implementation + ':' + r.sample;
    assert(!startupKeys.has(k), 'Duplicate startup sample');
    startupKeys.add(k);
    for (const f of [
      'processMilliseconds',
      'moduleMilliseconds',
      'constructionMicroseconds',
      'projectionMicroseconds'
    ])
      finite(r[f], 'Startup ' + f);
  }
  assert(
    Array.isArray(node.memory.results) &&
      node.memory.results.length === implementations.length * node.memory.metadata.samples,
    'Complete isolated memory samples required'
  );
  const memoryKeys = new Set();
  for (const r of node.memory.results) {
    assert(implementations.includes(r.implementation), 'Unknown memory implementation');
    assert(
      Number.isInteger(r.sample) && r.sample >= 0 && r.sample < node.memory.metadata.samples,
      'Memory sample index'
    );
    const k = r.implementation + ':' + r.sample;
    assert(!memoryKeys.has(k), 'Duplicate memory sample');
    memoryKeys.add(k);
    assert.equal(
      r.ownedCoordinateBytes,
      node.memory.metadata.points * 4 * 8 * 2,
      'Owned memory buffer size mismatch'
    );
    for (const stage of ['before', 'prepared', 'storage', 'steady'])
      for (const f of ['rss', 'heapUsed', 'heapTotal', 'external', 'arrayBuffers'])
        finite(r[stage]?.[f], 'Memory ' + stage + '.' + f);
  }
  for (const required of [
    'core',
    'mercator',
    'utm',
    'operationPipeline',
    'temporalModel',
    'operationCatalog',
    'allNativeExports'
  ])
    assert(node.bundles[required], 'Missing bundle profile ' + required);
  for (const metrics of Object.values(node.bundles))
    for (const f of ['minified', 'gzip']) positive(metrics[f], 'Bundle bytes');
  const environments = [
    {
      runtime: 'node',
      version: node.throughput.metadata.node,
      metadata: node.throughput.metadata,
      accuracy: nodeAccuracy,
      rows: nodeRows,
      construction: node.throughput.construction,
      cold: node.startup,
      allocation: {
        available: true,
        methodology: node.throughput.methodology,
        rows: node.throughput.allocations
      },
      memory: {
        available: true,
        methodology: node.memory.methodology,
        metadata: node.memory.metadata,
        results: node.memory.results
      }
    }
  ];
  const browsers = new Set();
  for (const report of browserReports) {
    assert.equal(report.schemaVersion, 2, 'Unsupported browser report');
    metadata(report.metadata, manifest, true);
    assert(Array.isArray(report.results) && report.results.length, 'Browser results required');
    for (const result of report.results) {
      assert(['chromium', 'firefox', 'webkit'].includes(result.browser), 'Unknown browser');
      assert(!browsers.has(result.browser), 'Duplicate browser environment');
      browsers.add(result.browser);
      assert(typeof result.version === 'string' && result.version, 'Browser version required');
      const rows = throughput(result.rows, report.metadata);
      assert.deepEqual(rows.map(key).sort(), expectedKeys, 'Browser workload inventory differs');
      assert(
        Array.isArray(result.cold) && result.cold.length === report.metadata.samples * 2,
        'Complete browser cold samples required'
      );
      for (const backend of ['typescript', 'proj4'])
        assert.equal(
          result.cold.filter(r => r.backend === backend).length,
          report.metadata.samples,
          'Cold backend inventory'
        );
      for (const r of result.cold)
        for (const f of [
          'loadMilliseconds',
          'firstConstructionMicroseconds',
          'firstProjectionMicroseconds'
        ])
          finite(r[f], 'Browser startup ' + f);
      environments.push({
        runtime: result.browser,
        version: result.version,
        metadata: report.metadata,
        accuracy: qualifyAccuracy(accuracy(result.independent?.accuracy, nodeAccuracy)),
        rows,
        construction: result.construction,
        cold: result.cold,
        allocation: {
          available: false,
          reason: 'No comparable cross-browser collected-object heap sampling API used.'
        },
        memory: {
          available: false,
          reason:
            'Portable browser process/JS heap measurements are unavailable; owned input byte counts are exact and are not a working-set estimate.'
        }
      });
    }
  }
  const missing = ['chromium', 'firefox', 'webkit'].filter(name => !browsers.has(name));
  assert(allowPartial || !missing.length, 'Missing browser evidence: ' + missing.join(', '));
  return {
    schemaVersion: 1,
    complete: !missing.length,
    missingEnvironments: missing,
    sourceSHA256: manifest.sourceSHA256,
    workloadSHA256: manifest.workloadSHA256,
    dependencies: manifest.dependencies,
    implementations,
    accuracyProfile: manifest.accuracyProfile,
    accuracyReference: {
      sha256: node.accuracy.referenceSHA256,
      oracle: node.accuracy.oracle,
      methodology: node.accuracy.methodology
    },
    bundleMethodology: manifest.bundleMethodology,
    bundles: node.bundles,
    environments,
    limitations: [
      'No pooled environments or overall SOTA ranking.',
      'Observed domain samples are not global accuracy guarantees.',
      'Throughput excludes preparation and buffer resets; startup is separate.',
      'Timing-limited or unstable rows have no advertised speedup.',
      'Heap sampling estimates allocations; zero estimates do not prove zero allocation.',
      'Memory checkpoints are retained state/RSS, not peak memory.',
      'Browser owned input bytes are a storage lower bound, not JS heap or total working set.'
    ]
  };
}
const escape = value =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('|', '\\|')
    .replaceAll('\n', ' ');
const number = n => (Number.isFinite(n) ? (n === 0 ? '0' : n.toPrecision(3)) : '—');
export function renderScorecard(report) {
  let out =
    '# Projection scorecard\n\n' +
    (report.complete
      ? 'Complete Node / Chromium / Firefox / WebKit evidence.'
      : '**Partial evidence: ' +
        escape(report.missingEnvironments.join(', ')) +
        ' missing. No complete scorecard claim.**') +
    '\n\nComparator: **proj4js ' +
    escape(report.dependencies.proj4.version) +
    '**; math.gl ' +
    escape(report.dependencies.projectionVersion) +
    '. Each environment retains its own hardware, version, date and sampling settings. Results are observed measurements, with no overall SOTA ranking.\n\n';
  if (report.environments.some(e => e.metadata.samples === 3))
    out +=
      'This snapshot includes three-sample diagnostic timings. Use the full measurement profile for performance decisions; short runs can show substantial variation.\n\n';
  out +=
    'Source fingerprint: `' +
    report.sourceSHA256 +
    '`. Workload fingerprint: `' +
    report.workloadSHA256 +
    '`.\n\n';
  out +=
    'Full measurements and raw samples: [machine-readable snapshot](https://github.com/visgl/math.gl/blob/master/modules/projection/test/fixtures/qualification/scorecard.json). Collection commit: `' +
    escape(report.provenance?.nodeGitCommit || 'not supplied') +
    '`. See [publication provenance](https://github.com/visgl/math.gl/blob/master/modules/projection/test/fixtures/qualification/README.md) for the generating CI run and raw artifacts.\n\n';
  out +=
    '## Accuracy\n\nThe independent ' +
    escape(report.accuracyReference.oracle) +
    ' corpus covers ' +
    report.environments[0].accuracy.length +
    ' domains / ' +
    report.environments[0].accuracy.reduce((n, r) => n + r.points, 0) +
    ' points. Worst observed errors include scalar and Float64 bulk paths. See [accuracy domains](./accuracy-domains.md) for geographic bounds, allowances and oracle limits.\n\n| Environment | Maximum forward component error (m) | Maximum inverse component error (degrees) |\n| --- | --- | --- |\n';
  for (const env of report.environments)
    out +=
      '| ' +
      escape(env.runtime) +
      ' | ' +
      number(
        Math.max(
          ...env.accuracy.flatMap(r => [r.errors.forward.maximum, r.errors.flatForward.maximum])
        )
      ) +
      ' | ' +
      number(
        Math.max(
          ...env.accuracy.flatMap(r => [r.errors.inverse.maximum, r.errors.flatInverse.maximum])
        )
      ) +
      ' |\n';
  out +=
    '\n## Prepared throughput\n\nSelected Float64 XYZM forward cases, in **million points/second**. All precisions, XY/XYZ/XYZM, directions and scenarios, raw samples, p10/p90 and iteration counts are retained in the machine-readable scorecard. A dagger marks timer-limited or high-variation rows; their ratios are withheld. No environment is pooled with another.\n\n';
  const cases = [
    'Web Mercator',
    'UTM 31N',
    'Lambert conformal conic',
    'Seven-parameter datum shift',
    'NTv2 horizontal grid'
  ];
  for (const env of report.environments) {
    out +=
      '### ' +
      escape(env.runtime) +
      ' ' +
      escape(env.version) +
      '\n\n' +
      escape(env.metadata.cpu) +
      '; ' +
      escape(env.metadata.platform) +
      '/' +
      escape(env.metadata.arch) +
      '; ' +
      escape(env.metadata.date) +
      '. ' +
      env.metadata.points +
      ' points, ' +
      env.metadata.samples +
      ' samples, minimum aggregate window ' +
      env.metadata.minSampleMs +
      ' ms.\n\n| Case | math.gl flat | math.gl scalar | proj4js ' +
      escape(report.dependencies.proj4.version) +
      ' |\n| --- | --- | --- | --- |\n';
    for (const name of cases) {
      const r = env.rows.find(
        r =>
          r.name === name &&
          r.precision === 'Float64' &&
          r.dimension === 4 &&
          r.direction === 'project'
      );
      if (!r) continue;
      out +=
        '| ' +
        escape(name) +
        (r.timingLimited || r.unstable ? ' †' : '') +
        ' | ' +
        r.millionPointsPerSecond
          .map(
            (n, i) =>
              number(n) +
              ' M' +
              (i < 2 && r.speedupAgainstProj4[i] !== null
                ? ' (' + number(r.speedupAgainstProj4[i]) + '×)'
                : '')
          )
          .join(' | ') +
        ' |\n';
    }
    out += '\n';
  }
  out +=
    '## Cold startup\n\nNode uses a fresh process per sample; browser samples use fresh contexts and minified bundles. Module times include their respective import/fetch/parse/evaluate paths. OS disk caches are not flushed. Node math.gl imports core plus Mercator; the browser imports the convenience Projection bundle. Node and browser cold paths are different experiments.\n\n| Environment | math.gl module median (ms) | proj4js module median (ms) |\n| --- | --- | --- |\n';
  for (const env of report.environments) {
    const samples = env.runtime === 'node' ? env.cold.results : env.cold;
    const get = backend =>
      samples
        .filter(r =>
          env.runtime === 'node' ? r.implementation === backend : r.backend === backend
        )
        .map(r => (env.runtime === 'node' ? r.moduleMilliseconds : r.loadMilliseconds));
    out +=
      '| ' +
      escape(env.runtime) +
      ' | ' +
      number(median(get(env.runtime === 'node' ? 'native-selected' : 'typescript'))) +
      ' | ' +
      number(median(get('proj4'))) +
      ' |\n';
  }
  const env = report.environments[0];
  out +=
    '\n## Allocation and memory\n\nNode heap sampling includes collected objects and reports estimated bytes per point; its 4 KiB sampling interval cannot prove zero allocation. Isolated Node memory samples force GC twice at each of four checkpoints: before imports, after preparation, after allocating two live Float64 XYZM buffers, and after ten Web Mercator batches. The buffers occupy ' +
    env.memory.metadata.points * 4 * 8 * 2 +
    ' bytes in each sample. Retained heap/RSS is distinct from temporary allocation and peak working set.\n\n| Implementation | Web Mercator XYZM sampled bytes/point | Steady heapUsed median (bytes) | Steady RSS median (bytes) |\n| --- | --- | --- | --- |\n';
  for (const impl of report.implementations) {
    const allocation = env.allocation.rows.find(
      r => r.case === 'Web Mercator' && r.dimension === 4 && r.implementation === impl
    );
    const samples = env.memory.results.filter(r => r.implementation === impl);
    out +=
      '| ' +
      escape(impl) +
      ' | ' +
      number(allocation?.sampledEstimatedBytesPerPoint) +
      ' | ' +
      number(median(samples.map(r => r.steady.heapUsed))) +
      ' | ' +
      number(median(samples.map(r => r.steady.rss))) +
      ' |\n';
  }
  out +=
    '\nBrowser JS heap/allocation values are **unavailable**, not zero. Each throughput row records exact input-buffer bytes only; this excludes adaptive copies, output/result objects, libraries and the rest of an application.\n\n## Bundle costs\n\n' +
    '**math.gl ' +
    escape(report.dependencies.projectionVersion) +
    '**, from the source-matched snapshot above. For current import choices and split-bundle measurements, see [imports, plugins and loading](./projection-engine.md#tree-shaking-and-bundle-size).\n\n' +
    escape(report.bundleMethodology.format) +
    ', ' +
    escape(report.bundleMethodology.target) +
    ', minified, gzip level ' +
    report.bundleMethodology.gzipLevel +
    '; Node ' +
    escape(report.bundleMethodology.node) +
    '. Selective modules exclude model data and external TIFF decoders.\n\n| Retained entry | Minified bytes | Gzip bytes |\n| --- | --- | --- |\n';
  for (const [name, bytes] of Object.entries(report.bundles))
    out += '| ' + escape(name) + ' | ' + bytes.minified + ' | ' + bytes.gzip + ' |\n';
  out +=
    '\n## Interpret and reproduce\n\n' +
    report.limitations.map(s => '- ' + s).join('\n') +
    '\n\nSee [measurement commands and provenance](./scorecard-methodology.md), [live browser benchmarks](./benchmarks.md#live-benchmarks) and [worker crossover measurements](./acceleration.md).\n';
  return out;
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const {values} = parseArgs({
    options: {
      node: {type: 'string'},
      'browser-report': {type: 'string', multiple: true},
      output: {type: 'string'},
      markdown: {type: 'string'},
      'allow-partial': {type: 'boolean', default: false}
    }
  });
  assert(values.node && values.output, '--node and --output required');
  const directory = resolve(values.node),
    manifest = JSON.parse(readFileSync(resolve(directory, 'manifest.json'), 'utf8')),
    node = {},
    inputs = [];
  const profileBytes = readFileSync(
    new URL('../test/fixtures/accuracy-cases.json', import.meta.url)
  );
  assert.equal(
    manifest.accuracyProfile?.inputsSHA256,
    hash(profileBytes),
    'Accuracy profile is stale'
  );
  assert.deepEqual(
    manifest.accuracyProfile.domains,
    JSON.parse(profileBytes).cases.map(
      ({id, bounds, forwardTolerance, inverseTolerance, roundtripTolerance}) => ({
        id,
        bounds,
        forwardTolerance,
        inverseTolerance,
        roundtripTolerance
      })
    ),
    'Reviewed accuracy allowances changed'
  );
  const packageMetadata = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
  assert.equal(
    manifest.dependencies.proj4.version,
    packageMetadata.devDependencies.proj4,
    'Comparator pin differs'
  );
  assert.equal(
    manifest.dependencies.projectionVersion,
    packageMetadata.version,
    'Projection version differs'
  );
  assert.equal(manifest.sourceSHA256, codeFingerprint(), 'Manifest is stale for this checkout');
  assert.equal(manifest.workloadSHA256, benchmarkFingerprint(), 'Manifest workload is stale');
  for (const name of ['accuracy', 'throughput', 'startup', 'memory', 'bundles']) {
    const entry = manifest.reports[name];
    assert(entry && HASH.test(entry.sha256), 'Pinned report entry required');
    const path = resolve(directory, entry.file);
    assert.equal(dirname(path), directory, 'Report paths must stay in input directory');
    const bytes = readFileSync(path);
    assert.equal(hash(bytes), entry.sha256, 'Raw report hash mismatch: ' + name);
    node[name] = JSON.parse(bytes);
    inputs.push({kind: name, file: basename(path), sha256: entry.sha256});
  }
  assert.equal(
    node.accuracy.referenceSHA256,
    hash(readFileSync(new URL('../test/fixtures/accuracy-reference.json', import.meta.url))),
    'Independent accuracy reference is stale'
  );
  const browserReports = (values['browser-report'] || []).map(path => {
    const bytes = readFileSync(resolve(path));
    inputs.push({kind: 'browser', file: basename(path), sha256: hash(bytes)});
    return JSON.parse(bytes);
  });
  const report = {
    ...buildScorecard(manifest, node, browserReports, {allowPartial: values['allow-partial']}),
    provenance: {
      nodeGitCommit: manifest.gitCommit,
      inputReports: inputs,
      generatorSHA256: hash(readFileSync(fileURLToPath(import.meta.url)))
    }
  };
  writeFileSync(values.output, JSON.stringify(report, null, 2) + '\n');
  if (values.markdown) writeFileSync(values.markdown, renderScorecard(report));
  console.log(
    (report.complete ? 'Complete' : 'Partial') +
      ' scorecard: ' +
      report.environments.length +
      ' separate environments, ' +
      report.environments.reduce((n, e) => n + e.rows.length, 0) +
      ' throughput rows'
  );
}
