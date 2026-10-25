// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {EllipsoidGeodesic} from '../src/ellipsoid-geodesic';
import {EllipsoidRhumb} from '../src/ellipsoid-rhumb';
import {GeodesicLineBuffer, RhumbLineBuffer} from '../src/geodesic-buffer';
export function prepare(count: number) {
  const axes = {semiMajorAxis: 6378137, semiMinorAxis: 6356752.314245179};
  const geodesic = new EllipsoidGeodesic(axes).line(30, 20, 40),
    rhumb = new EllipsoidRhumb(axes).line(30, 20, 40);
  const distances = Float64Array.from({length: count}, (_, i) => (i / count - 0.5) * 1000000);
  return [
    [geodesic, new GeodesicLineBuffer(geodesic, count), 'geodesic'],
    [rhumb, new RhumbLineBuffer(rhumb, count), 'rhumb']
  ].map(([line, buffer, name]) => {
    const l = line as typeof geodesic,
      b = buffer as GeodesicLineBuffer,
      out = new Float64Array(count * b.stride),
      baseline = new Float64Array(out.length);
    const scalar = () => {
      for (let i = 0; i < count; i++) {
        const r = l.position(distances[i]) as unknown as Record<string, number>;
        for (let field = 0; field < b.stride; field++)
          baseline[i * b.stride + field] = r[b.fields[field]];
      }
    };
    const packed = () => {
      b.positions(distances, out);
    };
    return {
      name,
      scalar,
      packed,
      qualify: () => {
        scalar();
        packed();
        return out.every((v, i) => v === baseline[i]);
      }
    };
  });
}
