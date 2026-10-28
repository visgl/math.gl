// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original exact-input Decimal/analytic C8 matrix; native LocalCartesian controls share the documented pole/domain limits.
import {Vector3, Matrix4, config} from '@math.gl/core';
import {Ellipsoid, LocalReferenceFrame, EllipsoidTangentPlane} from '@math.gl/geospatial';
import type {LocalFrameAxis} from '@math.gl/core';
import reference from './c8-reference.json';
export const provenance = reference.provenance;
export const ANGULAR_BUDGET = (1e-9 * Math.PI) / 180;
export const AXIS_NORMALIZED_BUDGET = 2e-12;
export type C8Row = {
  id: string;
  family: string;
  passed: boolean;
  budgetUsage: number;
  checks: {name: string; error: number; budget: number}[];
  error?: string;
};
const axes: readonly (readonly [LocalFrameAxis, LocalFrameAxis, LocalFrameAxis])[] = [
  ['east', 'north', 'up'],
  ['north', 'east', 'down'],
  ['west', 'up', 'north']
];
function columns(basis: readonly number[], selected: readonly LocalFrameAxis[]): number[] {
  return selected.flatMap(axis => {
    const index = ['east', 'north', 'up'].indexOf(
      ({west: 'east', south: 'north', down: 'up'} as Record<string, string>)[axis] || axis
    );
    const sign = ['west', 'south', 'down'].includes(axis) ? -1 : 1;
    return basis.slice(3 * index, 3 * index + 3).map(v => v * sign);
  });
}
function rotate(basis: readonly number[], value: readonly number[]): number[] {
  return [0, 1, 2].map(
    i => basis[i] * value[0] + basis[i + 3] * value[1] + basis[i + 6] * value[2]
  );
}
function transpose(basis: readonly number[], value: readonly number[]): number[] {
  return [0, 1, 2].map(
    i => basis[3 * i] * value[0] + basis[3 * i + 1] * value[1] + basis[3 * i + 2] * value[2]
  );
}
function rotation(pose: ArrayLike<number>): number[] {
  return [pose[0], pose[1], pose[2], pose[4], pose[5], pose[6], pose[8], pose[9], pose[10]];
}
function quaternionRotation(q: ArrayLike<number>): number[] {
  const [x, y, z, w] = Array.from(q);
  return [
    1 - 2 * (y * y + z * z),
    2 * (x * y + z * w),
    2 * (x * z - y * w),
    2 * (x * y - z * w),
    1 - 2 * (x * x + z * z),
    2 * (y * z + x * w),
    2 * (x * z + y * w),
    2 * (y * z - x * w),
    1 - 2 * (x * x + y * y)
  ];
}
function attitude(h: number, p: number, r: number): number[] {
  const sh = Math.sin(-h),
    ch = Math.cos(-h),
    sp = Math.sin(-p),
    cp = Math.cos(-p),
    sr = Math.sin(r),
    cr = Math.cos(r);
  return [
    ch * cp,
    sh * cp,
    -sp,
    ch * sp * sr - sh * cr,
    sh * sp * sr + ch * cr,
    cp * sr,
    ch * sp * cr + sh * sr,
    sh * sp * cr - ch * sr,
    cp * cr
  ];
}
function compose(basis: readonly number[], local: readonly number[]): number[] {
  return [0, 1, 2].flatMap(i => rotate(basis, local.slice(3 * i, 3 * i + 3)));
}
export function qualifyC8(includeRegressions = true): C8Row[] {
  const rows: C8Row[] = [];
  const run = (
    family: string,
    id: string,
    evaluate: (
      check: (
        name: string,
        actual: ArrayLike<number>,
        expected: readonly number[],
        budget: number
      ) => void
    ) => void
  ) => {
    const row: C8Row = {id, family, passed: true, budgetUsage: 0, checks: []};
    const check = (
      name: string,
      actual: ArrayLike<number>,
      expected: readonly number[],
      budget: number
    ) => {
      let error = actual?.length === expected.length ? 0 : Infinity;
      for (let i = 0; i < expected.length; i++)
        error = Math.max(
          error,
          Number.isFinite(actual?.[i]) ? Math.abs(actual[i] - expected[i]) : Infinity
        );
      row.checks.push({name, error, budget});
      row.budgetUsage = Math.max(row.budgetUsage, error === 0 ? 0 : error / budget);
      row.passed &&= error <= budget;
    };
    try {
      evaluate(check);
    } catch (error) {
      row.passed = false;
      row.error = String(error);
      row.budgetUsage = Infinity;
    }
    rows.push(row);
  };
  reference.frames.forEach((r, index) => {
    const radius = Math.max(...r.radii),
      expected = r.basis;
    axes.forEach(selected =>
      run('Decimal frames/poses', `${index}/${selected.join('-')}`, check => {
        const basis = columns(expected, selected),
          ellipsoid = new Ellipsoid(...(r.radii as [number, number, number]));
        const previous = config._cartographicRadians;
        try {
          for (const radians of [false, true]) {
            config._cartographicRadians = radians;
            const origin = r.origin.slice(),
              options = {
                ellipsoid,
                axes: [...selected] as [LocalFrameAxis, LocalFrameAxis, LocalFrameAxis]
              };
            const frame = new LocalReferenceFrame(origin, options);
            origin.fill(0);
            options.axes.reverse();
            const matrix = frame.localToFixedMatrix;
            check('basis', rotation(matrix), basis, ANGULAR_BUDGET);
            check(
              'origin',
              Array.from(matrix)
                .slice(12, 15)
                .map(x => x / radius),
              r.origin.map(x => x / radius),
              AXIS_NORMALIZED_BUDGET
            );
            const local = r.local,
              forward = rotate(basis, local).map((x, i) => (x + r.origin[i]) / radius);
            check(
              'local point',
              Array.from(frame.localToFixedPoint(local)).map(x => x / radius),
              forward,
              AXIS_NORMALIZED_BUDGET
            );
            check(
              'local vector',
              Array.from(frame.localToFixedVector(local)).map(x => x / radius),
              rotate(basis, local).map(x => x / radius),
              AXIS_NORMALIZED_BUDGET
            );
            check(
              'fixed point',
              Array.from(frame.fixedToLocalPoint(r.forward)).map(x => x / radius),
              transpose(
                basis,
                r.forward.map((x, i) => x - r.origin[i])
              ).map(x => x / radius),
              AXIS_NORMALIZED_BUDGET
            );
            check(
              'independent exact-input inverse',
              Array.from(frame.fixedToLocalPoint(r.forward)).map(x => x / radius),
              transpose(basis, rotate(expected, r.inverse)).map(x => x / radius),
              AXIS_NORMALIZED_BUDGET
            );
            check(
              'fixed vector',
              Array.from(frame.fixedToLocalVector(r.vector)).map(x => x / radius),
              transpose(basis, r.vector).map(x => x / radius),
              AXIS_NORMALIZED_BUDGET
            );
            const alias = new Vector3(...(local as [number, number, number]));
            frame.localToFixedPoint(alias, alias);
            check(
              'alias safe',
              Array.from(alias).map(x => x / radius),
              forward,
              AXIS_NORMALIZED_BUDGET
            );
            frame.localToFixedMatrix.fill(0);
            frame.fixedToLocalMatrix.fill(0);
            check('matrix ownership', rotation(frame.localToFixedMatrix), basis, ANGULAR_BUDGET);
            for (const pose of r.poses) {
              const localRotation = [0, 1, 2].flatMap(i =>
                transpose(expected, pose.rotation.slice(3 * i, 3 * i + 3))
              );
              const wanted = compose(basis, localRotation),
                hpr = {heading: pose.angles[0], pitch: pose.angles[1], roll: pose.angles[2]};
              const matrix = frame.headingPitchRollToFixedFrame(hpr);
              check('Decimal pose', rotation(matrix), wanted, ANGULAR_BUDGET);
              check(
                'quaternion physical rotation',
                quaternionRotation(frame.headingPitchRollQuaternion(hpr)),
                wanted,
                ANGULAR_BUDGET
              );
              const independent = new Matrix4([
                wanted[0],
                wanted[1],
                wanted[2],
                0,
                wanted[3],
                wanted[4],
                wanted[5],
                0,
                wanted[6],
                wanted[7],
                wanted[8],
                0,
                0,
                0,
                0,
                1
              ]);
              const extracted = frame.fixedFrameToHeadingPitchRoll(independent);
              check(
                'independent extraction reconstruction',
                compose(basis, attitude(extracted.heading, extracted.pitch, extracted.roll)),
                wanted,
                ANGULAR_BUDGET
              );
            }
            check(
              'velocity physical rotation',
              quaternionRotation(frame.velocityQuaternion(r.velocity)!),
              r.velocityRotation,
              ANGULAR_BUDGET
            );
          }
        } finally {
          config._cartographicRadians = previous;
        }
      })
    );
  });
  reference.planes.forEach((r, index) =>
    run('Decimal tangent planes', String(index), check => {
      const radius = Math.max(...r.radii),
        plane = new EllipsoidTangentPlane(
          r.origin,
          new Ellipsoid(...(r.radii as [number, number, number]))
        );
      check(
        'surface anchor',
        Array.from(plane.origin).map(x => x / radius),
        r.footpoint.map(x => x / radius),
        AXIS_NORMALIZED_BUDGET
      );
      check('basis', [...plane.xAxis, ...plane.yAxis, ...plane.zAxis], r.basis, ANGULAR_BUDGET);
      check(
        'normal projection',
        Array.from(plane.projectPointToNearestOnPlane(r.tangent)).map(x => x / radius),
        r.local.map(x => x / radius),
        AXIS_NORMALIZED_BUDGET
      );
      check(
        'radial inverse',
        Array.from(plane.projectPointOntoEllipsoid(r.local, 'radial')!).map(x => x / radius),
        r.radial.map(x => x / radius),
        AXIS_NORMALIZED_BUDGET
      );
      check(
        'normal inverse',
        Array.from(plane.projectPointOntoEllipsoid(r.local, 'normal')!).map(x => x / radius),
        r.normal.map(x => x / radius),
        AXIS_NORMALIZED_BUDGET
      );
      const batch = plane.projectPointsFlat(
        new Float64Array([...r.tangent, ...r.normal]),
        'normal'
      );
      check(
        'packed normal',
        Array.from(batch.positions).map(x => x / radius),
        [...r.local, ...r.local].map(x => x / radius),
        AXIS_NORMALIZED_BUDGET
      );
      check('packed validity', batch.valid, [1, 1], 0);
    })
  );
  reference.nativeLocal.forEach((r, index) =>
    run('C++ LocalCartesian', String(index), check => {
      const frame = new LocalReferenceFrame(r.expected.slice(3, 6), {
        ellipsoid: new Ellipsoid(...(r.radii as [number, number, number]))
      });
      check(
        'native forward',
        Array.from(frame.fixedToLocalPoint(r.expected.slice(6, 9))).map(x => x / r.radii[0]),
        r.expected.slice(0, 3).map(x => x / r.radii[0]),
        5e-14
      );
    })
  );
  if (includeRegressions) {
    run('analytic boundary fixes', 'finite radial lift', check => {
      for (const radius of [1e-60, 1, 1e60]) {
        const plane = new EllipsoidTangentPlane(
          [radius, 0, 0],
          new Ellipsoid(radius, radius, radius)
        );
        const result = plane.projectPointOntoEllipsoid([1e308, 0], 'radial')!;
        check(
          'radial',
          Array.from(result).map(x => x / radius),
          [radius / 1e308, 1, 0],
          AXIS_NORMALIZED_BUDGET
        );
      }
    });
    run('analytic boundary fixes', 'spherical contact', check => {
      const plane = new EllipsoidTangentPlane([10, 0, 0], new Ellipsoid(10, 10, 10)),
        out = new Vector3(7, 8, 9);
      check(
        'outside',
        [Number(plane.projectPointOntoEllipsoid([10 + 2 ** -49, 0], 'normal', out) === undefined)],
        [1],
        0
      );
      check('failure atomic', out, [7, 8, 9], 0);
      const y = 10 - 2 ** -49;
      check(
        'grazing',
        [plane.projectPointOntoEllipsoid([y, 0], 'normal')![0]],
        [Math.sqrt((10 - y) * (10 + y))],
        1e-13
      );
    });
    run('analytic boundary fixes', 'intermediate overflow', check => {
      const e = new Ellipsoid(1, 1, 1),
        frame = new LocalReferenceFrame(e.cartographicToCartesian([-160, -70, 0]), {ellipsoid: e});
      const m = rotation(frame.localToFixedMatrix),
        v = [-1, -0.8, 0.8],
        scale = 1.6e308;
      check(
        'finite rotation',
        Array.from(frame.localToFixedVector(v.map(x => x * scale))).map(x => x / scale),
        rotate(m, v),
        ANGULAR_BUDGET
      );
    });
  }
  return rows;
}
