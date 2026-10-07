// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original matched sphere/ellipsoid workload with analytic normal anchors and reusable scalar outputs.
import {config} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import {ProjectionTransform} from '@math.gl/projection/core';
import {geocentric} from '@math.gl/projection/projections/geocent';
export {measureWorkload} from './benchmark-workload';
export const shapes = [
  {id: 'WGS84', a: 6378137, b: 6356752.314245179},
  {id: 'Sphere', a: 6371000, b: 6371000},
  {id: 'Flattened spheroid', a: 10, b: 5}
];
type Shape = (typeof shapes)[number];
/** Independent support-point construction from a known unit normal, outside timing. */
function cartesian(longitude: number, latitude: number, height: number, shape: Shape) {
  const lon = (longitude * Math.PI) / 180,
    lat = (latitude * Math.PI) / 180;
  const nx = Math.cos(lat) * Math.cos(lon),
    ny = Math.cos(lat) * Math.sin(lon),
    nz = Math.sin(lat);
  const gamma = Math.hypot(shape.a * nx, shape.a * ny, shape.b * nz);
  return [
    (shape.a * shape.a * nx) / gamma + height * nx,
    (shape.a * shape.a * ny) / gamma + height * ny,
    (shape.b * shape.b * nz) / gamma + height * nz
  ];
}
export function source(shape: Shape, polar: boolean, inverse: boolean, points: number) {
  const buffer = new Float64Array(points * 4),
    expected = new Float64Array(points * 4);
  for (let record = 0; record < points; record++) {
    const longitude = -179 + ((record * 37) % 358),
      latitude = polar ? (record % 2 ? -1 : 1) * 89.999999 : -80 + ((record * 17) % 160);
    const height = shape.a * [-0.0001, 0, 0.001, 6][record % 4];
    const llh = [longitude, latitude, height],
      xyz = cartesian(...(llh as [number, number, number]), shape);
    buffer.set(inverse ? xyz : llh, record * 4);
    expected.set(inverse ? llh : xyz, record * 4);
    buffer[record * 4 + 3] = expected[record * 4 + 3] = record + 0.25;
  }
  return {buffer, expected};
}
export function runners(shape: Shape, inverse: boolean) {
  config._cartographicRadians = false;
  const ellipsoid = Ellipsoid.fromSpheroid({semiMajorAxis: shape.a, semiMinorAxis: shape.b});
  const axes = `+a=${shape.a} +b=${shape.b}`;
  const engine = new ProjectionTransform({
    from: '+proj=longlat ' + axes,
    to: '+proj=geocent ' + axes,
    projections: [geocentric]
  });
  const input = [0, 0, 0, 0],
    output = [0, 0, 0, 0];
  const geometry = (buffer: Float64Array) => {
    for (let offset = 0; offset < buffer.length; offset += 4) {
      for (let axis = 0; axis < 3; axis++) input[axis] = buffer[offset + axis];
      const result = inverse
        ? ellipsoid.cartesianToCartographic(input, output)
        : ellipsoid.cartographicToCartesian(input, output);
      if (!result) throw new Error('Benchmark point outside geometry profile');
      for (let axis = 0; axis < 3; axis++) buffer[offset + axis] = result[axis];
    }
  };
  const scalar = (buffer: Float64Array) => {
    for (let offset = 0; offset < buffer.length; offset += 4) {
      for (let axis = 0; axis < 4; axis++) input[axis] = buffer[offset + axis];
      (inverse ? engine.unprojectTo : engine.projectTo)(input, output);
      for (let axis = 0; axis < 4; axis++) buffer[offset + axis] = output[axis];
    }
  };
  const flat = (buffer: Float64Array) => {
    (inverse ? engine.unprojectFlat : engine.projectFlat)(buffer, 4);
  };
  return [geometry, scalar, flat];
}

/** Complete public construction, including owned geometry snapshots/CRS parsing. */
export function factories(shape: Shape) {
  return [
    () => Ellipsoid.fromSpheroid({semiMajorAxis: shape.a, semiMinorAxis: shape.b}),
    () =>
      new ProjectionTransform({
        from: `+proj=longlat +a=${shape.a} +b=${shape.b}`,
        to: `+proj=geocent +a=${shape.a} +b=${shape.b}`,
        projections: [geocentric]
      })
  ];
}
