// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {NumericArray} from '@math.gl/types';
import {Curve, copyPoints, type CurvePoint} from './curve';

/** Cubic curve with endpoint derivatives (not unit tangent directions). */
export class HermiteCurve extends Curve {
  private readonly data: number[][];

  constructor(
    start: CurvePoint,
    end: CurvePoint,
    startTangent: CurvePoint,
    endTangent: CurvePoint
  ) {
    const data = copyPoints([start, end, startTangent, endTangent]);
    super(data[0].length);
    this.data = data;
  }

  protected evaluate(t: number, result: NumericArray, derivative: boolean): void {
    const t2 = t * t;
    const h0 = derivative ? 6 * t2 - 6 * t : (1 + 2 * t) * (1 - t) ** 2;
    const h1 = derivative ? -6 * t2 + 6 * t : t2 * (3 - 2 * t);
    const h2 = derivative ? 3 * t2 - 4 * t + 1 : t * (1 - t) ** 2;
    const h3 = derivative ? 3 * t2 - 2 * t : t2 * (t - 1);
    for (let i = 0; i < this.dimension; i++) {
      result[i] =
        h0 * this.data[0][i] + h1 * this.data[1][i] + h2 * this.data[2][i] + h3 * this.data[3][i];
    }
  }
}
