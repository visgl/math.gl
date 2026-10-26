// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
export const merge = arrays => arrays.flat();
// Neumaier compensated summation for spherical signed area.
export class Adder {
  constructor() {
    this.sum = 0;
    this.correction = 0;
  }
  add(x) {
    const t = this.sum + x;
    this.correction += Math.abs(this.sum) >= Math.abs(x) ? this.sum - t + x : x - t + this.sum;
    this.sum = t;
    return this;
  }
  valueOf() {
    return this.sum + this.correction;
  }
}
