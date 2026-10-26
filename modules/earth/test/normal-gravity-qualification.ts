// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {NormalGravity} from '../src/normal-gravity';
import reference from './normal-gravity-reference.json';
export const provenance = reference.provenance;
export function qualifyNormalGravity() {
  const rows: {id: number; mode: string; passed: boolean; budgetUsage: number; error: string}[] =
    [];
  const run = (mode: string, fn: (check: (error: number, budget: number) => void) => void) => {
    let usage = 0,
      error = '';
    try {
      fn((e, b) => {
        usage = Math.max(usage, e / b);
      });
    } catch (e) {
      usage = Infinity;
      error = String(e);
    }
    rows.push({
      id: rows.length,
      mode,
      passed: Number.isFinite(usage) && usage <= 1,
      budgetUsage: usage,
      error
    });
  };
  for (const r of reference.native)
    run('native', check => {
      const model = new NormalGravity(r.model),
        e = r.expected,
        field = model.evaluate(r.latitude, r.longitude, r.height),
        cart = model.evaluateCartesian(e[0], e[1], e[2]);
      const g = r.model.gravitationalParameter / r.model.semiMajorAxis ** 2,
        v = r.model.gravitationalParameter / r.model.semiMajorAxis;
      for (const p of [field, cart]) {
        check(Math.abs(p.potential - e[3]) / Math.max(v, Math.abs(e[3])), 4e-15);
        check(Math.abs(p.gravitationalPotential - e[4]) / v, 4e-15);
        p.acceleration.forEach((x, i) => check(Math.abs(x - e[5 + i]) / g, 3e-13));
        const w2 = r.model.angularVelocity ** 2;
        p.centrifugalAcceleration.forEach((x, i) =>
          check(Math.abs(x - (i === 2 ? 0 : w2 * e[i])) / g, 3e-13)
        );
        p.gravitationalAcceleration.forEach((x, i) =>
          check(Math.abs(x - (e[5 + i] - (i === 2 ? 0 : w2 * e[i]))) / g, 3e-13)
        );
        check(
          Math.abs(p.centrifugalPotential - (e[3] - e[4])) / Math.max(v, Math.abs(e[3])),
          4e-15
        );
        check(
          Math.abs(p.potential - p.gravitationalPotential - p.centrifugalPotential) /
            Math.max(v, Math.abs(p.potential)),
          4e-15
        );
      }
      const phi = (r.latitude * Math.PI) / 180,
        lambda = (r.longitude * Math.PI) / 180;
      const radial = e[5] * Math.cos(lambda) + e[6] * Math.sin(lambda);
      check(
        Math.abs(field.localAcceleration[1] - (-radial * Math.sin(phi) + e[7] * Math.cos(phi))) / g,
        3e-13
      );
      check(
        Math.abs(field.localAcceleration[2] - (radial * Math.cos(phi) + e[7] * Math.sin(phi))) / g,
        3e-13
      );
      check(Math.abs(model.surfaceGravity(r.latitude) - e[8]) / g, 3e-13);
      if (r.height === 0) {
        check(Math.abs(field.potential - model.surfacePotential) / v, 4e-15);
        check(Math.abs(field.localAcceleration[1]) / g, 3e-13);
      }
    });
  for (const r of reference.independent)
    run('independent Decimal', check => {
      const m = new NormalGravity(r.model),
        p = m.evaluateCartesian(...(r.position as [number, number, number])),
        g = r.model.gravitationalParameter / r.model.semiMajorAxis ** 2,
        v = g * r.model.semiMajorAxis;
      check(Math.abs(p.potential - r.expected[0]) / v, 4e-15);
      p.acceleration.forEach((x, i) => check(Math.abs(x - r.expected[i + 1]) / g, 3e-13));
    });
  return rows;
}
