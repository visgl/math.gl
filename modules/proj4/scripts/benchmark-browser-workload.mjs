// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original workload shared across browser engines, comparing with the proj4 import.
export function measure(modules, {points, samples}) {
  const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
  const timings = [],
    construction = [];
  let checksum = 0;
  for (const [name, to, lon, lat] of [
    ['Mercator', 'EPSG:3857', 12, 55],
    ['UTM', 'EPSG:32631', 3, 45]
  ]) {
    const converters = {};
    for (const [backend, api] of Object.entries(modules)) {
      converters[backend] = api.create(to);
      const times = [];
      for (let sample = 0; sample < samples; sample++) {
        const start = performance.now();
        for (let i = 0; i < 100; i++) api.create(to);
        times.push((performance.now() - start) * 10);
      }
      construction.push({
        name,
        backend,
        medianMicroseconds: median(times),
        samplesMicroseconds: times
      });
    }
    for (const ArrayType of [Float32Array, Float64Array])
      for (const dimension of [2, 4])
        for (const direction of ['project', 'unproject']) {
          const source = new ArrayType(points * dimension),
            buffer = new ArrayType(source.length);
          for (let i = 0; i < points; i++) {
            const p = [lon + (i % 100) / 100, lat + (i % 71) / 100];
            const xy = direction === 'unproject' ? converters.proj4.project(p) : p;
            source[i * dimension] = xy[0];
            source[i * dimension + 1] = xy[1];
            if (dimension === 4) {
              source[i * dimension + 2] = 123;
              source[i * dimension + 3] = 7;
            }
          }
          const runners = {};
          for (const [backend, converter] of Object.entries(converters)) {
            const input = new Array(dimension);
            runners[backend + '-scalar'] = () => {
              for (let offset = 0; offset < buffer.length; offset += dimension) {
                for (let j = 0; j < dimension; j++) input[j] = buffer[offset + j];
                const output = converter[direction](input);
                for (let j = 0; j < dimension; j++) buffer[offset + j] = output[j];
              }
            };
          }
          runners['native-batch'] = () => converters.native[direction + 'Flat'](buffer, dimension);
          buffer.set(source);
          runners['proj4-scalar']();
          const reference = buffer.slice();
          for (const [backend, run] of Object.entries(runners)) {
            buffer.set(source);
            run();
            for (let i = 0; i < buffer.length; i++) {
              const tolerance = Math.max(
                direction === 'project' ? 2e-5 : 1e-8,
                ArrayType === Float32Array ? Math.abs(reference[i]) * 2e-7 : 0
              );
              if (!Number.isFinite(buffer[i]) || Math.abs(buffer[i] - reference[i]) > tolerance)
                throw new Error('Parity failure: ' + backend + ' / ' + i);
            }
            for (let warmup = 0; warmup < 3; warmup++) {
              buffer.set(source);
              run();
            }
          }
          const rows = Object.entries(runners),
            times = Object.fromEntries(rows.map(([key]) => [key, []]));
          for (let sample = 0; sample < samples; sample++)
            for (let j = 0; j < rows.length; j++) {
              const [backend, run] = rows[(sample + j) % rows.length];
              buffer.set(source);
              const start = performance.now();
              run();
              times[backend].push(performance.now() - start);
              checksum += buffer[0];
            }
          for (const [backend, values] of Object.entries(times))
            timings.push({
              name,
              backend,
              array: ArrayType.name,
              dimension,
              direction,
              medianMilliseconds: median(values),
              samplesMilliseconds: values
            });
        }
  }
  if (!Number.isFinite(checksum)) throw new Error('Invalid benchmark checksum');
  return {construction, timings, checksum};
}
