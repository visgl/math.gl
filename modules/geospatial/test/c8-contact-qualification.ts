// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independent Decimal line/quadric controls over exact stored binary64 geometry.
import {Vector3} from '@math.gl/core';
import {Ellipsoid, EllipsoidTangentPlane} from '@math.gl/geospatial';
import {exactNormalIntersection} from '../src/ellipsoid-helpers/tangent-plane-numerics';
import type {C8Row} from './c8-qualification';
import reference from './c8-contact-reference.json';
export const contactProvenance = reference.provenance;
export function qualifyContacts(): C8Row[] {
  const planes = reference.planes.map(
    p =>
      new EllipsoidTangentPlane(p.origin, new Ellipsoid(...(p.radii as [number, number, number])))
  );
  return reference.rows.map((r, index) => {
    const p = reference.planes[r.plane],
      radius = Math.max(...p.radii);
    const row: C8Row = {
      id: String(index),
      family: 'Decimal silhouette lines',
      passed: true,
      budgetUsage: 0,
      checks: []
    };
    const check = (name: string, value: ArrayLike<number> | undefined) => {
      let error = 0;
      if (r.expected === null) error = value === undefined ? 0 : Infinity;
      else if (value === undefined) error = Infinity;
      else
        for (let i = 0; i < 3; i++)
          error = Math.max(
            error,
            Number.isFinite(value[i]) ? Math.abs(value[i] - r.expected[i]) / radius : Infinity
          );
      row.checks.push({name, error, budget: 2e-12});
      row.budgetUsage = Math.max(row.budgetUsage, error / 2e-12);
      row.passed &&= error <= 2e-12;
    };
    try {
      check(
        'exact binary64 line geometry',
        exactNormalIntersection(p.radii, p.anchor, p.east, p.north, p.normal, r.local)
      );
      // Axial geometry is exact across runtimes. Off-axis public controls stay
      // away from the ill-conditioned one-ulp silhouette of a rounded basis;
      // their exact-line kernel controls above still cover that boundary.
      if (r.public) {
        const out = new Vector3(7, 8, 9);
        check(
          'public normal lift',
          planes[r.plane].projectPointOntoEllipsoid(r.local, 'normal', out)
        );
        if (r.expected === null && (out[0] !== 7 || out[1] !== 8 || out[2] !== 9))
          throw new Error('Miss mutated caller output');
      }
    } catch (error) {
      row.passed = false;
      row.error = String(error);
      row.budgetUsage = Infinity;
    }
    return row;
  });
}
