// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Shared fourth-order differentiation with step/half-step agreement.
 * The caller owns sample semantics and domain checks. Scratch is reused; callers
 * must guard reentry. Failed estimates leave result unchanged.
 */
export class NumericalDerivative {
  readonly result = [0, 0, 0];
  private readonly samples = Array.from({length: 4}, () => [0, 0, 0]);
  private readonly coarse = [0, 0, 0];
  private readonly fine = [0, 0, 0];
  constructor(private readonly sample: (offset: number, output: number[]) => boolean) {}

  evaluate(step: number, referenceScale: number, tolerance = 1e-6): boolean {
    if (!this.difference(step, this.coarse) || !this.difference(step / 2, this.fine)) return false;
    const bound =
      tolerance *
      Math.max(
        referenceScale,
        Math.abs(this.fine[0]),
        Math.abs(this.fine[1]),
        Math.abs(this.fine[2])
      );
    for (let i = 0; i < 3; i++) {
      if (Math.abs(this.coarse[i] - this.fine[i]) > bound) return false;
      this.fine[i] += (this.fine[i] - this.coarse[i]) / 15;
      if (!Number.isFinite(this.fine[i])) return false;
    }
    for (let i = 0; i < 3; i++) this.result[i] = this.fine[i];
    return true;
  }

  private difference(step: number, output: number[]): boolean {
    const [a, b, c, d] = this.samples;
    if (
      !this.sample(-2 * step, a) ||
      !this.sample(-step, b) ||
      !this.sample(step, c) ||
      !this.sample(2 * step, d)
    )
      return false;
    for (let i = 0; i < 3; i++) {
      output[i] = (a[i] - d[i] + 8 * (c[i] - b[i])) / (12 * step);
      if (!Number.isFinite(output[i])) return false;
    }
    return true;
  }
}
