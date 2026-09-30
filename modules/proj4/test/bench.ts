// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// @ts-expect-error tsconfig configuration issue?
import type {Bench} from '@probe.gl/bench';
import proj4 from 'proj4';
import {Proj4Projection} from '../src/classic';
import {
  TypeScriptProjection,
  mercator,
  universalTransverseMercator,
  lambertConformalConic
} from '../src/experimental';

/** Both browser and Node suites. Timings include the identical buffer reset in every case. */
export function proj4Bench(suite: Bench): Bench {
  const points = 10000;
  for (const [to, plugin, longitude, latitude] of [
    ['EPSG:3857', mercator, 0, 30],
    ['EPSG:32631', universalTransverseMercator, 3, 45],
    [
      '+proj=lcc +lat_1=33 +lat_2=45 +lat_0=39 +lon_0=-96 +datum=WGS84',
      lambertConformalConic,
      -96,
      39
    ]
  ] as const) {
    const native = new TypeScriptProjection({to, projections: [plugin]});
    const reference = proj4('WGS84', to);
    const wrapper = new Proj4Projection({to});
    for (const ArrayType of [Float32Array, Float64Array]) {
      const source = new ArrayType(points * 2);
      for (let i = 0; i < points; i++) {
        source[i * 2] = longitude + (i % 100) / 100;
        source[i * 2 + 1] = latitude + (i % 71) / 100;
      }
      const buffer = source.slice();
      const input = [0, 0];
      const scalar = (project: (coordinate: number[]) => number[]) => () => {
        buffer.set(source);
        for (let offset = 0; offset < buffer.length; offset += 2) {
          input[0] = buffer[offset];
          input[1] = buffer[offset + 1];
          const output = project(input);
          buffer[offset] = output[0];
          buffer[offset + 1] = output[1];
        }
        return buffer;
      };
      suite
        .group(`Proj4 ${to} ${ArrayType.name} (${points} points, reset included)`)
        .add('TypeScript batch in place', () => {
          buffer.set(source);
          return native.projectFlat(buffer);
        })
        .add('TypeScript scalar', scalar(native.project))
        .add('proj4 import', scalar(reference.forward))
        .add('Classic proj4 wrapper', scalar(wrapper.project));
    }
  }
  return suite;
}
