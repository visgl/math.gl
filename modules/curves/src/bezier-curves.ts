// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {NumericArray} from '@math.gl/types';
import {Curve, copyPoints, type CurvePoint} from './curve';

abstract class BezierCurve extends Curve {
  private readonly points: number[][];

  protected constructor(points: readonly CurvePoint[]) {
    const copied = copyPoints(points);
    super(copied[0].length);
    this.points = copied;
  }

  protected evaluate(t: number, result: NumericArray, derivative: boolean): void {
    const degree = this.points.length - 1;
    // Scalar de Casteljau evaluation avoids temporary vectors and preserves endpoints.
    for (let i = 0; i < this.dimension; i++) {
      let a = this.points[0][i];
      let b = this.points[1][i];
      let c = degree >= 2 ? this.points[2][i] : 0;
      const d = degree === 3 ? this.points[3][i] : 0;
      let order = degree;
      if (derivative) {
        a = degree * (b - a);
        b = degree * (c - b);
        c = degree * (d - c);
        order--;
      }
      if (order === 3) {
        a = (1 - t) * a + t * b;
        b = (1 - t) * b + t * c;
        c = (1 - t) * c + t * d;
      }
      if (order >= 2) {
        a = (1 - t) * a + t * b;
        b = (1 - t) * b + t * c;
      }
      result[i] = order >= 1 ? (1 - t) * a + t * b : a;
    }
  }
}

export class LineCurve extends BezierCurve {
  constructor(start: CurvePoint, end: CurvePoint) {
    super([start, end]);
  }
}

export class QuadraticBezierCurve extends BezierCurve {
  constructor(start: CurvePoint, control: CurvePoint, end: CurvePoint) {
    super([start, control, end]);
  }
}

export class CubicBezierCurve extends BezierCurve {
  constructor(start: CurvePoint, control1: CurvePoint, control2: CurvePoint, end: CurvePoint) {
    super([start, control1, control2, end]);
  }
}
