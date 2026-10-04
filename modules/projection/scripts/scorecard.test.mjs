// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original scorecard evidence-integrity, units and missing-data regressions.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {buildScorecard, renderScorecard} from './scorecard.mjs';
function fixture() {
  const dependencies = {
    projectionVersion: '5.0.0-alpha.12',
    proj4: {version: '2.22.0', entrySHA256: 'a'.repeat(64)}
  };
  const metadata = {
    sourceSHA256: 'b'.repeat(64),
    workloadSHA256: 'c'.repeat(64),
    dependencies,
    date: '2026-10-04T19:00:00Z',
    cpu: 'authored test hardware',
    platform: 'test',
    arch: 'test',
    node: 'v24.14.0',
    points: 1000,
    samples: 3,
    minSampleMs: 4,
    distribution: 'regional'
  };
  const implementations = ['math.gl flat', 'math.gl scalar', 'proj4js 2.22.0'];
  const rows = [];
  for (const precision of ['Float32', 'Float64'])
    for (const dimension of [2, 3, 4])
      for (const direction of ['project', 'unproject'])
        rows.push({
          name: 'Web Mercator',
          precision,
          dimension,
          direction,
          distribution: 'regional',
          points: 1000,
          iterations: 2,
          timingLimited: false,
          unstable: false,
          measurements: [1, 2, 4].map(scale => ({
            milliseconds: scale * 2,
            p10: scale * 1.92,
            p90: scale * 2.08,
            aggregateMilliseconds: scale * 4,
            samples: [3.8, 4, 4.2].map(n => n * scale)
          }))
        });
  const cases = [
    {
      id: 'authored-domain',
      bounds: {west: 0, east: 1, south: 0, north: 1},
      points: 3,
      errors: Object.fromEntries(
        ['forward', 'inverse', 'roundtrip', 'flatForward', 'flatInverse', 'flatRoundtrip'].map(
          name => [name, {maximum: 1e-9, input: [0, 0]}]
        )
      )
    }
  ];
  const allocations = [2, 4].flatMap(dimension =>
    implementations.map(implementation => ({
      case: 'Web Mercator',
      dimension,
      implementation,
      points: 10000,
      sampledEstimatedBytesPerPoint: 0,
      sampleCount: 0
    }))
  );
  const startup = ['native-selected', 'native-barrel', 'proj4', 'projection'].flatMap(
    implementation =>
      [0, 1, 2].map(sample => ({
        implementation,
        sample,
        processMilliseconds: 10,
        moduleMilliseconds: 2,
        constructionMicroseconds: 10,
        projectionMicroseconds: 5
      }))
  );
  const memory = implementations.flatMap(implementation =>
    [0, 1, 2].map(sample => ({
      implementation,
      sample,
      ownedCoordinateBytes: 64000,
      ...Object.fromEntries(
        ['before', 'prepared', 'storage', 'steady'].map(stage => [
          stage,
          {
            rss: 10000000,
            heapUsed: 2000000,
            heapTotal: 5000000,
            external: 100000,
            arrayBuffers: 64000
          }
        ])
      )
    }))
  );
  const bundles = Object.fromEntries(
    [
      'core',
      'mercator',
      'utm',
      'operationPipeline',
      'temporalModel',
      'operationCatalog',
      'allNativeExports'
    ].map(name => [name, {minified: 1000, gzip: 200}])
  );
  const manifest = {
    schemaVersion: 1,
    accuracyProfile: {
      inputsSHA256: 'e'.repeat(64),
      domains: [
        {
          id: 'authored-domain',
          bounds: cases[0].bounds,
          forwardTolerance: 1e-5,
          inverseTolerance: 1e-8,
          roundtripTolerance: 1e-8
        }
      ]
    },
    ...metadata,
    bundleMethodology: {
      node: 'v24.14.0',
      format: 'browser ESM',
      target: 'es2020',
      minified: true,
      gzipLevel: 9,
      decoderAndDataIncluded: false
    }
  };
  const node = {
    accuracy: {
      sourceSHA256: metadata.sourceSHA256,
      referenceSHA256: 'd'.repeat(64),
      oracle: 'authored test oracle',
      cases
    },
    throughput: {
      schemaVersion: 2,
      metadata: {...metadata, implementations},
      rows,
      allocations,
      construction: []
    },
    startup: {metadata, results: startup},
    memory: {schemaVersion: 1, metadata, results: memory},
    bundles
  };
  const browserReports = ['chromium', 'firefox', 'webkit'].map(browser => ({
    schemaVersion: 2,
    metadata,
    results: [
      {
        browser,
        version: 'test-1',
        rows,
        independent: {accuracy: cases},
        construction: [],
        cold: ['typescript', 'proj4'].flatMap(backend =>
          [0, 1, 2].map(() => ({
            backend,
            loadMilliseconds: 2,
            firstConstructionMicroseconds: 10,
            firstProjectionMicroseconds: 5
          }))
        )
      }
    ]
  }));
  return JSON.parse(JSON.stringify({manifest, node, browserReports}));
}
test('keeps four environments separate, raw samples, exact byte units and time/iteration normalization', () => {
  const f = fixture();
  f.browserReports[1].metadata.cpu = 'different hardware';
  const card = buildScorecard(f.manifest, f.node, f.browserReports);
  assert.equal(card.complete, true);
  assert.equal(card.environments.length, 4);
  assert.equal(card.environments[2].metadata.cpu, 'different hardware');
  const r = card.environments[0].rows.find(r => r.precision === 'Float64' && r.dimension === 4);
  assert.equal(r.ownedInputBytes, 32000);
  assert.equal(r.millionPointsPerSecond[0], 0.5);
  assert.deepEqual(r.speedupAgainstProj4, [4, 2]);
  assert.deepEqual(r.measurements[0].samples, [3.8, 4, 4.2]);
  assert.equal(card.environments[1].memory.available, false);
  assert.equal(card.environments[0].allocation.rows[0].sampledEstimatedBytesPerPoint, 0);
  assert.match(renderScorecard(card), /unavailable.*, not zero/);
});
test('withholds ratios for quantized, zero and high-variation rows without discarding evidence', () => {
  for (const flag of ['timingLimited', 'unstable']) {
    const f = fixture();
    f.node.throughput.rows[0][flag] = true;
    const r = buildScorecard(f.manifest, f.node, f.browserReports).environments[0].rows[0];
    assert.deepEqual(r.speedupAgainstProj4, [null, null]);
    assert.equal(r.millionPointsPerSecond[0], 0.5);
  }
  const f = fixture();
  f.node.throughput.rows[0].timingLimited = true;
  f.node.throughput.rows[0].measurements[0] = {
    milliseconds: 0,
    p10: 0,
    p90: 0,
    aggregateMilliseconds: 0,
    samples: [0, 0, 0]
  };
  const r = buildScorecard(f.manifest, f.node, f.browserReports).environments[0].rows[0];
  assert.equal(r.millionPointsPerSecond[0], null);
  assert.equal(r.speedupAgainstProj4[0], null);
});
test('requires all three browsers by default and explicitly marks partial publication', () => {
  const f = fixture();
  assert.throws(
    () => buildScorecard(f.manifest, f.node, f.browserReports.slice(0, 2)),
    /Missing browser evidence: webkit/
  );
  const card = buildScorecard(f.manifest, f.node, f.browserReports.slice(0, 2), {
    allowPartial: true
  });
  assert.equal(card.complete, false);
  assert.deepEqual(card.missingEnvironments, ['webkit']);
  assert.match(renderScorecard(card), /Partial evidence/);
});
test('rejects stale source, different work, different measured comparator bytes and duplicate browser results', () => {
  for (const mutate of [
    f => {
      f.browserReports[0].metadata.sourceSHA256 = 'e'.repeat(64);
    },
    f => {
      f.browserReports[0].metadata.workloadSHA256 = 'e'.repeat(64);
    },
    f => {
      f.browserReports[0].metadata.dependencies.proj4.entrySHA256 = 'e'.repeat(64);
    },
    f => {
      f.browserReports.push(f.browserReports[0]);
    }
  ]) {
    const f = fixture();
    mutate(f);
    assert.throws(() => buildScorecard(f.manifest, f.node, f.browserReports));
  }
});
test('rejects incomplete matrices, invented percentiles, incorrect normalization and negative/unsupported metrics', () => {
  for (const mutate of [
    f => {
      f.node.accuracy.cases[0].errors.forward.maximum = 1;
    },
    f => {
      f.browserReports[0].results[0].independent.accuracy[0].errors.inverse.maximum = 1;
    },
    f => {
      f.node.throughput.rows.pop();
    },
    f => {
      f.browserReports[0].results[0].rows.push(f.browserReports[0].results[0].rows[0]);
    },
    f => {
      f.node.throughput.rows[0].measurements[0].milliseconds = 100;
    },
    f => {
      f.node.throughput.rows[0].measurements[0].samples[1] = 30;
    },
    f => {
      f.node.throughput.rows[0].measurements[0].p90 = 2.09;
    },
    f => {
      f.node.throughput.rows[0].measurements[0].aggregateMilliseconds = 4.1;
    },
    f => {
      f.manifest.bundleMethodology.decoderAndDataIncluded = true;
    },
    f => {
      f.node.throughput.allocations[0].sampledEstimatedBytesPerPoint = -1;
    },
    f => {
      f.node.memory.results[0].steady.rss = NaN;
    },
    f => {
      f.node.startup.results[0].sample = 90;
    },
    f => {
      f.node.memory.results[0].ownedCoordinateBytes = 32000;
    },
    f => {
      delete f.node.bundles.core;
    },
    f => {
      delete f.browserReports[0].results[0].independent.accuracy[0].errors.inverse;
    },
    f => {
      f.browserReports[0].results[0].cold.pop();
    }
  ]) {
    const f = fixture();
    mutate(f);
    assert.throws(() => buildScorecard(f.manifest, f.node, f.browserReports));
  }
});
test('escapes report labels and has no inferred browser heap measurement', () => {
  const f = fixture();
  f.node.throughput.metadata.cpu = '<script>|misleading\nmarkup';
  const card = buildScorecard(f.manifest, f.node, f.browserReports),
    markdown = renderScorecard(card);
  assert(markdown.includes('&lt;script&gt;\\|misleading markup'));
  assert(!markdown.includes('<script>'));
  assert.equal(card.environments[1].allocation.available, false);
});
