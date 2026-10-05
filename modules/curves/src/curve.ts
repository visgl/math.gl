// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {NumericArray} from '@math.gl/types';

export type CurvePoint = Readonly<ArrayLike<number>>;

/** Parameterized Euclidean curve, with t in [0, 1]. */
export abstract class Curve {
  readonly dimension: number;

  protected constructor(dimension: number) {
    if (dimension !== 2 && dimension !== 3) {
      throw new RangeError('Curve points must have two or three coordinates');
    }
    this.dimension = dimension;
  }

  getPoint(t: number): number[];
  getPoint<T extends NumericArray>(t: number, result: T): T;
  getPoint(t: number, result: NumericArray = new Array(this.dimension)): NumericArray {
    validateParameter(t);
    validateResult(result, this.dimension);
    this.evaluate(t, result, false);
    return result;
  }

  /** Derivative with respect to the normalized curve parameter t. */
  getDerivative(t: number): number[];
  getDerivative<T extends NumericArray>(t: number, result: T): T;
  getDerivative(t: number, result: NumericArray = new Array(this.dimension)): NumericArray {
    validateParameter(t);
    validateResult(result, this.dimension);
    this.evaluate(t, result, true);
    return result;
  }

  /** Unit tangent; returns a zero vector at stationary points. */
  getTangent(t: number): number[];
  getTangent<T extends NumericArray>(t: number, result: T): T;
  getTangent(t: number, result: NumericArray = new Array(this.dimension)): NumericArray {
    this.getDerivative(t, result);
    const length = Math.hypot(result[0], result[1], this.dimension === 3 ? result[2] : 0);
    if (length > 0) {
      for (let i = 0; i < this.dimension; i++) result[i] /= length;
    }
    return result;
  }

  /** Flat coordinates for divisions + 1 evenly spaced parameter samples. */
  getPoints(divisions = 64): Float64Array {
    validateDivisions(divisions);
    const points = new Float64Array((divisions + 1) * this.dimension);
    const point = new Array<number>(this.dimension);
    for (let i = 0; i <= divisions; i++) {
      this.getPoint(i / divisions, point);
      points.set(point, i * this.dimension);
    }
    return points;
  }

  protected abstract evaluate(t: number, result: NumericArray, derivative: boolean): void;
}

/** Copy caller-owned control data so curves and their length tables stay stable. */
export function copyPoints(points: readonly CurvePoint[]): number[][] {
  if (!points.length) throw new RangeError('Invalid number of curve control points');
  const dimension = points[0].length;
  if (dimension !== 2 && dimension !== 3) {
    throw new RangeError('Curve points must have two or three coordinates');
  }
  return points.map(point => {
    if (point.length !== dimension) throw new RangeError('Control point dimensions must match');
    return Array.from(point, value => {
      if (!Number.isFinite(value)) throw new RangeError('Control coordinates must be finite');
      return value;
    });
  });
}

export function validateParameter(t: number): void {
  if (!Number.isFinite(t) || t < 0 || t > 1) {
    throw new RangeError('Curve parameter must be finite and in [0, 1]');
  }
}

export function validateDivisions(divisions: number): void {
  if (!Number.isSafeInteger(divisions) || divisions < 1) {
    throw new RangeError('divisions must be a positive safe integer');
  }
}

function validateResult(result: NumericArray, dimension: number): void {
  if (result.length < dimension) throw new RangeError('Result buffer is too short');
}
