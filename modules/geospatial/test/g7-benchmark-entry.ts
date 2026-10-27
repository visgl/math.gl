// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original shared equal-output G7/C8 workload, independent of historical/candidate implementation sources.
import {
  EllipsoidGeodesic,
  EllipsoidRhumb,
  Ellipsoid,
  LocalReferenceFrame,
  EllipsoidTangentPlane
} from '@math.gl/geospatial';
import {Vector2, Vector3, Matrix4, Quaternion} from '@math.gl/core';
import workload from './g7-workload.json';
import reference from './g7-reference.json';
import c8 from './c8-reference.json';
export {qualifyC8} from './c8-qualification';
export const nativeProvenance = reference.provenance;
export const nativeOperations = ['gi', 'gd', 'gl', 'ri', 'rd', 'rl', 'gs', 'rs'] as const;
export type Operation = (typeof nativeOperations)[number];
export const operationLabels: Record<Operation, string> = {
  gi: 'geodesic inverse',
  gd: 'geodesic direct (line setup included)',
  gl: 'geodesic reused line',
  ri: 'rhumb inverse',
  rd: 'rhumb direct (line setup included)',
  rl: 'rhumb reused line',
  gs: 'geodesic solver setup',
  rs: 'rhumb solver setup'
};
export function inputs(op: Operation) {
  return workload[op === 'gi' || op === 'ri' ? 'inverse' : 'direct'];
}
export type Job = {
  id: string;
  phase: string;
  nativeOp?: Operation;
  run: (points: number) => void;
  checksum: () => number;
  errors: number[];
};
const fields: Record<Operation, string[]> = {
  gi: ['s12', 'azi1', 'azi2', 'm12', 'M12', 'M21', 'a12'],
  gd: ['lat2', 'lon2', 'azi2', 's12', 'm12', 'M12', 'M21', 'a12'],
  gl: ['lat2', 'lon2', 'azi2', 's12', 'm12', 'M12', 'M21', 'a12'],
  ri: ['s12', 'azi12'],
  rd: ['lat2', 'lon2'],
  rl: ['lat2', 'lon2'],
  gs: ['area'],
  rs: ['area']
};
function budget(op: Operation, field: string, a: number): number {
  if (field === 'area') return 2e-12;
  if (['s12', 'm12'].includes(field)) return 4e-13 * a;
  if (['M12', 'M21'].includes(field)) return 4e-13;
  return op[0] === 'g' && ['azi1', 'azi2', 'a12'].includes(field) ? 1e-9 : 2e-10;
}
/** Validate each output from the actual optional native executable before timing. */
export function nativeOutputErrors(
  op: Operation,
  actual: readonly (readonly number[])[]
): number[] {
  const cases = inputs(op),
    names = fields[op];
  if (actual.length !== cases.length || actual.some(row => row.length !== names.length))
    throw new Error('Native output shape mismatch: ' + op);
  return actual.map((row, i) =>
    Math.max(
      ...row.map((value, j) =>
        Number.isFinite(value)
          ? Math.abs(value - reference.operations[op][i][j]) /
            budget(op, names[j], cases[i].axes[0])
          : Infinity
      )
    )
  );
}
export function prepareJobs(): Job[] {
  const jobs: Job[] = [];
  for (const op of nativeOperations) {
    const cases = inputs(op),
      names = fields[op],
      output = new Float64Array(cases.length * names.length);
    const prepared = cases.map(({axes, input: p}) => {
      const parameters = {semiMajorAxis: axes[0], semiMinorAxis: axes[1]};
      const solver =
        op[0] === 'g' ? new EllipsoidGeodesic(parameters) : new EllipsoidRhumb(parameters);
      const line =
        op === 'gl' || op === 'rl'
          ? solver.line(p[0], p[1], p[2], {unrollLongitude: true})
          : undefined;
      return () => {
        if (op === 'gs')
          return {area: new EllipsoidGeodesic(parameters).surfaceArea / axes[0] / axes[0]};
        if (op === 'rs')
          return {area: new EllipsoidRhumb(parameters).surfaceArea / axes[0] / axes[0]};
        if (op === 'gi' || op === 'ri') return solver.inverse(p[0], p[1], p[2], p[3]);
        if (op === 'gl' || op === 'rl') return line!.position(p[3]);
        return solver.direct(p[0], p[1], p[2], p[3], {unrollLongitude: true});
      };
    });
    const errors = cases.map((row, i) => {
      const value = prepared[i]() as unknown as Record<string, number>;
      return Math.max(
        ...names.map(
          (name, j) =>
            Math.abs(value[name] - reference.operations[op][i][j]) / budget(op, name, row.axes[0])
        )
      );
    });
    const run = (points: number) => {
      for (let i = 0; i < points; i++) {
        const index = i % cases.length,
          value = prepared[index]() as unknown as Record<string, number>;
        for (let j = 0; j < names.length; j++) output[index * names.length + j] = value[names[j]];
      }
    };
    jobs.push({
      id: operationLabels[op],
      phase: op.endsWith('s') ? 'setup' : 'operation',
      nativeOp: op,
      run,
      checksum: () => output.reduce((a, b) => a + b, 0),
      errors
    });
  }
  const ellipsoid = Ellipsoid.WGS84;
  const frameControl = c8.frames[28],
    planeControl = c8.planes[8];
  const origin = frameControl.origin;
  const frame = new LocalReferenceFrame(origin),
    plane = new EllipsoidTangentPlane(planeControl.origin, ellipsoid);
  const v = new Vector3(frameControl.local),
    out = new Vector3(),
    p = new Vector2(planeControl.local),
    pout = new Vector2(),
    matrix = new Matrix4(),
    q = new Quaternion();
  const angles = frameControl.poses[1].angles;
  const pose = {heading: angles[0], pitch: angles[1], roll: angles[2]};
  const encoded = new Vector3(frameControl.forward),
    fixedVector = new Vector3(frameControl.vector),
    tangent = new Vector3(planeControl.tangent);
  const pr = frameControl.poses[1].rotation;
  const fixedPose = new Matrix4([
    pr[0],
    pr[1],
    pr[2],
    0,
    pr[3],
    pr[4],
    pr[5],
    0,
    pr[6],
    pr[7],
    pr[8],
    0,
    0,
    0,
    0,
    1
  ]);
  let escaped: unknown;
  const add = (id: string, phase: string, call: () => unknown, checksum: () => number) =>
    jobs.push({
      id,
      phase,
      run: points => {
        for (let i = 0; i < points; i++) escaped = call();
      },
      checksum: () => {
        if (!escaped) throw new Error('Unobserved operation');
        return checksum();
      },
      errors: []
    });
  add(
    'frame construction',
    'setup',
    () => new LocalReferenceFrame(origin),
    () => (escaped as LocalReferenceFrame).localToFixedMatrix[0]
  );
  add(
    'frame local point / reusable result',
    'operation',
    () => frame.localToFixedPoint(v, out),
    () => out[0]
  );
  add(
    'frame local point / allocated result',
    'operation',
    () => frame.localToFixedPoint(v),
    () => (escaped as Vector3)[0]
  );
  add(
    'frame fixed point / reusable result',
    'operation',
    () => frame.fixedToLocalPoint(encoded, out),
    () => out[0]
  );
  add(
    'frame fixed vector / reusable result',
    'operation',
    () => frame.fixedToLocalVector(fixedVector, out),
    () => out[0]
  );
  add(
    'pose composition / reusable result',
    'operation',
    () => frame.headingPitchRollToFixedFrame(pose, matrix),
    () => matrix[0]
  );
  add(
    'pose quaternion / reusable result',
    'operation',
    () => frame.headingPitchRollQuaternion(pose, q),
    () => q[0]
  );
  add(
    'pose extraction',
    'operation',
    () => frame.fixedFrameToHeadingPitchRoll(fixedPose),
    () => (escaped as typeof pose).heading
  );
  add(
    'velocity quaternion / reusable result',
    'operation',
    () => frame.velocityQuaternion(frameControl.velocity, q),
    () => q[0]
  );
  add(
    'tangent normal projection / reusable result',
    'operation',
    () => plane.projectPointToNearestOnPlane(tangent, pout),
    () => pout[0]
  );
  add(
    'tangent radial lift / reusable result',
    'operation',
    () => plane.projectPointOntoEllipsoid(p, 'radial', out),
    () => out[0]
  );
  add(
    'tangent normal lift / reusable result',
    'operation',
    () => plane.projectPointOntoEllipsoid(p, 'normal', out),
    () => out[0]
  );
  return jobs;
}
