// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Run after building proj4. All comparisons use the published entry points.
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {cpus} from 'node:os';
import {Session} from 'node:inspector/promises';
import {parseArgs} from 'node:util';
import proj4 from 'proj4';
import {Proj4Projection} from '@math.gl/proj4';
import {
  TypeScriptProjection,
  mercator,
  universalTransverseMercator,
  lambertConformalConic
} from '@math.gl/proj4/experimental';

const {values} = parseArgs({
  options: {
    points: {type: 'string', default: '50000'},
    samples: {type: 'string', default: '7'},
    output: {type: 'string'},
    allocations: {type: 'boolean', default: false}
  }
});
const points = Number(values.points),
  samples = Number(values.samples);
assert(
  Number.isSafeInteger(points) && points >= 10 && points <= 1e7,
  'points must be 10..10000000'
);
assert(Number.isSafeInteger(samples) && samples >= 3 && samples <= 100, 'samples must be 3..100');
const cases = [
  {name: 'Web Mercator', to: 'EPSG:3857', plugin: mercator, center: [0, 30]},
  {
    name: 'UTM 31N',
    to: '+proj=utm +zone=31 +datum=WGS84',
    plugin: universalTransverseMercator,
    center: [3, 45]
  },
  {
    name: 'Lambert conic',
    to: '+proj=lcc +lat_1=33 +lat_2=45 +lat_0=39 +lon_0=-96 +datum=WGS84',
    plugin: lambertConformalConic,
    center: [-96, 39]
  },
  {
    name: 'Helmert to Mercator',
    from: '+proj=longlat +ellps=clrk66 +towgs84=1,2,3,0.1,0.2,0.3,1',
    to: '+proj=merc +datum=WGS84',
    plugin: mercator,
    center: [0, 30]
  }
];
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const results = [],
  construction = [];
let checksum = 0;
const allocationJobs = [];

function scalarRunner(operation, dimension) {
  // Reuse the input array even for scalar APIs; only unavoidable outputs are allocated.
  const point = Array(dimension).fill(0);
  return buffer => {
    for (let offset = 0; offset < buffer.length; offset += dimension) {
      for (let j = 0; j < dimension; j++) point[j] = buffer[offset + j];
      const output = operation(point);
      for (let j = 0; j < dimension; j++) buffer[offset + j] = output[j];
    }
  };
}
function verify(actual, reference, direction, dimension, isFloat32, datum) {
  for (let i = 0; i < actual.length; i++) {
    assert(Number.isFinite(actual[i]), 'Non-finite output');
    // 3D computed height is compared with proj4's enforced-axis API.
    // Float32 storage can round almost-identical doubles to adjacent representable values.
    const base = i % dimension === 2 ? 1e-4 : direction === 'forward' ? 2e-5 : 1e-8;
    const tolerance = Math.max(base, isFloat32 ? Math.abs(reference[i]) * 2e-7 : 0);
    // 2D Helmert inverse has no original height; both backends use zero as specified.
    assert(
      Math.abs(actual[i] - reference[i]) <= tolerance,
      `Parity failure at ${i}: ${actual[i]} vs ${reference[i]} (${direction}, datum=${datum})`
    );
  }
}
for (const fixture of cases) {
  const from = fixture.from || 'WGS84';
  const enforceAxis = Boolean(fixture.from); // Needed only for the computed-height datum comparison.
  const options = {from, to: fixture.to, enforceAxis};
  const factories = {
    native: () => new TypeScriptProjection({...options, projections: [fixture.plugin]}),
    proj4: () => proj4(from, fixture.to),
    wrapper: () => new Proj4Projection(options)
  };
  const instances = {};
  for (const [name, create] of Object.entries(factories)) {
    const start = performance.now();
    instances[name] = create();
    const firstMicroseconds = (performance.now() - start) * 1000;
    const durations = [];
    for (let sample = 0; sample < samples; sample++) {
      const start = performance.now();
      for (let i = 0; i < 100; i++) create();
      durations.push((performance.now() - start) * 10);
    }
    construction.push({
      case: fixture.name,
      implementation: name,
      firstMicroseconds,
      medianMicroseconds: median(durations)
    });
  }
  for (const ArrayType of [Float64Array, Float32Array])
    for (const dimension of [2, 3]) {
      const geographic = new ArrayType(points * dimension);
      for (let i = 0; i < points; i++) {
        geographic[i * dimension] = fixture.center[0] + ((i * 37) % 1000) / 500 - 1;
        geographic[i * dimension + 1] = fixture.center[1] + ((i * 71) % 1000) / 500 - 1;
        if (dimension === 3) geographic[i * dimension + 2] = (i % 3000) - 100;
      }
      for (const direction of ['forward', 'inverse']) {
        const input = geographic.slice();
        if (direction === 'inverse')
          scalarRunner(point => instances.proj4.forward(point, enforceAxis), dimension)(input);
        const method = direction === 'forward' ? 'project' : 'unproject';
        const runners = {
          'native batch': buffer => instances.native[method + 'Flat'](buffer, dimension),
          'native scalar': scalarRunner(instances.native[method], dimension),
          'proj4 import': scalarRunner(
            point => instances.proj4[direction](point, enforceAxis),
            dimension
          ),
          'proj4 wrapper': scalarRunner(instances.wrapper[method], dimension)
        };
        const buffer = input.slice(),
          reference = input.slice();
        runners['proj4 import'](reference);
        for (const run of Object.values(runners)) {
          buffer.set(input);
          run(buffer);
          verify(
            buffer,
            reference,
            direction,
            dimension,
            ArrayType === Float32Array,
            Boolean(fixture.from)
          );
          for (let i = 0; i < 3; i++) {
            buffer.set(input);
            run(buffer);
          }
        }
        const timings = Object.fromEntries(Object.keys(runners).map(name => [name, []]));
        const entries = Object.entries(runners);
        for (let sample = 0; sample < samples; sample++) {
          // Rotate order so no implementation always runs first/last.
          for (let j = 0; j < entries.length; j++) {
            const [name, run] = entries[(sample + j) % entries.length];
            buffer.set(input); // Reset outside the timed region for all implementations.
            const start = performance.now();
            run(buffer);
            timings[name].push(performance.now() - start);
            checksum += buffer[(sample * dimension) % buffer.length];
          }
        }
        for (const [name, times] of Object.entries(timings)) {
          results.push({
            case: fixture.name,
            array: ArrayType.name,
            dimension,
            direction,
            implementation: name,
            medianMilliseconds: median(times),
            millionPointsPerSecond: points / median(times) / 1000,
            samplesMilliseconds: times
          });
        }
        if (dimension === 2 && ArrayType === Float64Array && direction === 'forward') {
          for (const [name, run] of entries)
            allocationJobs.push({fixture: fixture.name, name, run, input, buffer});
        }
      }
    }
}
const allocations = [];
if (values.allocations) {
  const session = new Session();
  session.connect();
  try {
    for (const {fixture, name, run, input, buffer} of allocationJobs) {
      await session.post('HeapProfiler.startSampling', {
        samplingInterval: 4096,
        includeObjectsCollectedByMajorGC: true,
        includeObjectsCollectedByMinorGC: true
      });
      for (let i = 0; i < 10; i++) {
        buffer.set(input);
        run(buffer);
      }
      const {profile} = await session.post('HeapProfiler.stopSampling');
      let bytes = 0;
      const sum = node => {
        bytes += node.selfSize;
        for (const child of node.children) sum(child);
      };
      sum(profile.head);
      allocations.push({
        case: fixture,
        implementation: name,
        points: points * 10,
        sampledEstimatedBytesPerPoint: bytes / (points * 10),
        sampleCount: profile.samples.length
      });
    }
  } finally {
    session.disconnect();
  }
}
assert(Number.isFinite(checksum));
const report = {
  metadata: {
    date: new Date().toISOString(),
    node: process.version,
    v8: process.versions.v8,
    platform: process.platform,
    arch: process.arch,
    cpu: cpus()[0]?.model,
    proj4: proj4.version,
    points,
    samples
  },
  methodology:
    'Median of warmed full-buffer transforms; reset excluded; preconstructed converters; reused scalar input arrays; default axes except Helmert cases, which enforce axes for computed height; all outputs parity-checked before timing. First construction is after imports, not process startup. Allocation estimates sample all JS allocations including collected objects, not exact counts or retained heap; profiling is separate from timing. No timing CI threshold.',
  construction,
  results,
  allocations,
  checksum
};
console.table(
  results.map(({samplesMilliseconds, medianMilliseconds, ...row}) => ({
    ...row,
    millionPointsPerSecond: +row.millionPointsPerSecond.toFixed(2)
  }))
);
console.table(construction);
if (values.allocations) console.table(allocations);
if (values.output) writeFileSync(values.output, JSON.stringify(report, null, 2) + '\n');
