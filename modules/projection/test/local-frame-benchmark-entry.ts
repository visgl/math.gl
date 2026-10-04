// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original analytic normal/support-point workload; no upstream implementation or model data.
import {Ellipsoid} from '@math.gl/geospatial';
import {createDeformationModel} from '@math.gl/projection/deformation';
import {ProjectionPipeline} from '@math.gl/projection/pipeline';
export {measureWorkload} from './benchmark-workload';
export const shapes = [
  {id: 'WGS84', a: 6378137, b: 6356752.314245179},
  {id: 'Sphere', a: 6371000, b: 6371000},
  {id: 'Flattened spheroid', a: 10, b: 5}
];
type Shape = (typeof shapes)[number];
function model(shape: Shape) {
  return createDeformationModel({
    epochRange: [2000, 2030],
    ellipsoid: {semiMajorAxis: shape.a, flattening: 1 - shape.b / shape.a},
    grid: {
      sample: (_longitude, _latitude, out) => {
        out.x = 0.01;
        out.y = 0.02;
        out.z = 0.03;
        return true;
      }
    }
  });
}
/** Independent unit-normal support point; distinct normal conventions at height. */
export function source(shape: Shape, polar: boolean, points: number) {
  const buffer = new Float64Array(points * 4),
    expected = new Float64Array(points * 4),
    geometryExpected = new Float64Array(points * 4);
  for (let record = 0; record < points; record++) {
    const lon = polar && record % 3 === 0 ? 0 : ((-179 + ((record * 37) % 358)) * Math.PI) / 180;
    const lat =
      ((polar
        ? (record % 2 ? -1 : 1) * (record % 3 ? 89.999999 : 90)
        : -80 + ((record * 17) % 160)) *
        Math.PI) /
      180;
    const nx = Math.cos(lat) * Math.cos(lon),
      ny = Math.cos(lat) * Math.sin(lon),
      nz = Math.sin(lat);
    const gamma = Math.hypot(shape.a * nx, shape.a * ny, shape.b * nz);
    const height = record % 2 ? shape.a * 0.1 : 0;
    const x = (shape.a * shape.a * nx) / gamma + height * nx;
    const y = (shape.a * shape.a * ny) / gamma + height * ny;
    const z = (shape.b * shape.b * nz) / gamma + height * nz;
    const offset = record * 4;
    buffer.set([x, y, z, record + 0.25], offset);
    // Local velocities [0.01,0.02,0.03] m/year, integrated over ten years.
    const radial = 0.3 * Math.cos(lat) - 0.2 * Math.sin(lat);
    expected.set(
      [
        x + radial * Math.cos(lon) - 0.1 * Math.sin(lon),
        y + radial * Math.sin(lon) + 0.1 * Math.cos(lon),
        z + 0.3 * Math.sin(lat) + 0.2 * Math.cos(lat),
        record + 0.25
      ],
      offset
    );
    const gradient = [x / (shape.a * shape.a), y / (shape.a * shape.a), z / (shape.b * shape.b)];
    const length = Math.hypot(...gradient);
    const up = gradient.map(v => v / length);
    const east =
      Math.abs(x) <= 1e-14 && Math.abs(y) <= 1e-14
        ? [0, 1, 0]
        : [-y / Math.hypot(x, y), x / Math.hypot(x, y), 0];
    if (Math.abs(x) <= 1e-14 && Math.abs(y) <= 1e-14) {
      up[0] = 0;
      up[1] = 0;
      up[2] = Math.sign(z);
    }
    const north = [-up[2] * east[1], up[2] * east[0], up[0] * east[1] - up[1] * east[0]];
    geometryExpected.set(
      [
        x + 0.1 * east[0] + 0.2 * north[0] + 0.3 * up[0],
        y + 0.1 * east[1] + 0.2 * north[1] + 0.3 * up[1],
        z + 0.1 * east[2] + 0.2 * north[2] + 0.3 * up[2],
        record + 0.25
      ],
      offset
    );
  }
  return {buffer, expected, geometryExpected};
}
export function runners(shape: Shape, ned: boolean) {
  const ellipsoid = Ellipsoid.fromSpheroid({semiMajorAxis: shape.a, semiMinorAxis: shape.b});
  const deformation = model(shape);
  const pipeline = new ProjectionPipeline({
    input: {space: 'geocentric', units: ['m', 'm', 'm']},
    steps: [{type: 'deformation', model: deformation, sourceEpoch: 2010, targetEpoch: 2020}]
  });
  const input = [0, 0, 0, 0],
    output = [0, 0, 0, 0],
    matrix = new Array<number>(16).fill(0);
  const point = {x: 0, y: 0, z: 0};
  const geometry = (buffer: Float64Array) => {
    for (let offset = 0; offset < buffer.length; offset += 4) {
      for (let i = 0; i < 3; i++) input[i] = buffer[offset + i];
      if (ned) ellipsoid.localFrameToFixedFrame('north', 'east', 'down', input, matrix);
      else ellipsoid.eastNorthUpToFixedFrame(input, matrix);
      const a = ned ? 0.2 : 0.1,
        b = ned ? 0.1 : 0.2,
        c = ned ? -0.3 : 0.3;
      for (let i = 0; i < 3; i++)
        buffer[offset + i] = input[i] + a * matrix[i] + b * matrix[i + 4] + c * matrix[i + 8];
    }
  };
  const direct = (buffer: Float64Array) => {
    for (let offset = 0; offset < buffer.length; offset += 4) {
      point.x = buffer[offset];
      point.y = buffer[offset + 1];
      point.z = buffer[offset + 2];
      deformation.forward(point, 2010, 2020);
      buffer[offset] = point.x;
      buffer[offset + 1] = point.y;
      buffer[offset + 2] = point.z;
    }
  };
  const scalar = (buffer: Float64Array) => {
    for (let offset = 0; offset < buffer.length; offset += 4) {
      for (let i = 0; i < 4; i++) input[i] = buffer[offset + i];
      pipeline.projectTo(input, output);
      for (let i = 0; i < 4; i++) buffer[offset + i] = output[i];
    }
  };
  const flat = (buffer: Float64Array) => {
    pipeline.projectFlat(buffer, 4);
  };
  return [geometry, direct, scalar, flat];
}
export function factories(shape: Shape) {
  return [
    () => Ellipsoid.fromSpheroid({semiMajorAxis: shape.a, semiMinorAxis: shape.b}),
    () => model(shape)
  ];
}
