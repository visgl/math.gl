// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original rigid celestial-frame and state-vector algebra with caller-supplied rotation rates.

import {JulianDate} from './julian-date';

/** Cartesian state expressed in the source frame of a transform. */
export type CartesianState = {
  /** Three source-frame position components in a consistent distance unit. */
  position: readonly number[];
  /** Three source-frame velocity components in that distance unit per second. */
  velocity: readonly number[];
};

/** Cartesian state expressed in the target frame of a transform. */
export type TransformedState = {
  /** Three target-frame position components in the input distance unit. */
  position: number[];
  /** Three target-frame velocity components in the input distance unit per second. */
  velocity: number[];
};

/** Identifies the frames, epoch, and optional derivative of a rotation snapshot. */
export type CelestialFrameTransformOptions = {
  /** Name of the source frame. */
  from: string;
  /** Name of the target frame. */
  to: string;
  /** Instant at which this rotation and derivative apply. */
  epoch: JulianDate;
  /** Column-major rotation derivative per second, in the same source/target bases. */
  rotationRate?: ArrayLike<number>;
};

/** Rotation-only frame snapshot about a common origin. No ephemeris, body model or
 * frame equivalence is inferred. Epoch and scales belong to the model constructing it.
 */
export class CelestialFrameTransform {
  /** Name of the source frame. */
  readonly from: string;
  /** Name of the target frame. */
  readonly to: string;
  /** Instant at which this rotation and derivative apply. */
  readonly epoch: JulianDate;
  /** Stored column-major rotation from source to target. */
  private readonly matrix: readonly number[];
  /** Stored column-major rotation derivative per second, when supplied. */
  private readonly rate?: readonly number[];

  /** Copies and validates the column-major source-to-target rotation and its options. */
  constructor(rotation: ArrayLike<number>, options: CelestialFrameTransformOptions) {
    if (!(options.epoch instanceof JulianDate))
      throw new RangeError('A frame snapshot requires an explicit Julian epoch');
    const m = finiteArray(rotation, 9);
    const rate = options.rotationRate ? finiteArray(options.rotationRate, 9) : undefined;
    if (
      !options.from ||
      !options.to ||
      typeof options.from !== 'string' ||
      typeof options.to !== 'string'
    ) {
      throw new RangeError('Frames must have explicit nonempty names');
    }
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        let dot = 0;
        let derivative = 0;
        for (let k = 0; k < 3; k++) {
          dot += m[i * 3 + k] * m[j * 3 + k];
          if (rate) derivative += rate[i * 3 + k] * m[j * 3 + k] + m[i * 3 + k] * rate[j * 3 + k];
        }
        if (
          !Number.isFinite(dot) ||
          Math.abs(dot - (i === j ? 1 : 0)) > 1e-10 ||
          !Number.isFinite(derivative) ||
          // Inverse composition can cancel rates down to machine roundoff.
          // Keep an absolute floor as well as a relative check (rates are per second).
          (rate && Math.abs(derivative) > 64 * Number.EPSILON * Math.max(1, ...rate.map(Math.abs)))
        ) {
          throw new RangeError('Expected orthonormal rotation and a compatible derivative');
        }
      }
    }
    const determinant =
      m[0] * (m[4] * m[8] - m[5] * m[7]) -
      m[3] * (m[1] * m[8] - m[2] * m[7]) +
      m[6] * (m[1] * m[5] - m[2] * m[4]);
    if (Math.abs(determinant - 1) > 1e-10) throw new RangeError('Rotation must be right-handed');
    this.epoch = options.epoch;
    this.from = options.from;
    this.to = options.to;
    this.matrix = Object.freeze(m);
    this.rate = rate ? Object.freeze(rate) : undefined;
    Object.freeze(this);
  }

  /** Returns a copy of the column-major source-to-target rotation. */
  get rotation(): number[] {
    return this.matrix.slice();
  }
  /** Returns a copy of the rotation derivative per second, when supplied. */
  get rotationRate(): number[] | undefined {
    return this.rate?.slice();
  }

  /** Rotates three source-frame coordinates into the target frame in the same distance unit. */
  transformPosition(position: ArrayLike<number>): number[] {
    return multiplyVector(this.matrix, finiteArray(position, 3));
  }

  /** v_target = R v_source + dR/dt p_source. Positions retain their distance unit;
   * velocity must use that same unit per second. This is not just vector rotation.
   */
  transformState(state: CartesianState): TransformedState {
    if (!this.rate)
      throw new RangeError(
        'State transformation requires an explicit rotation derivative, including explicit zero for a static frame'
      );
    const position = finiteArray(state.position, 3);
    const velocity = finiteArray(state.velocity, 3);
    const rotated = multiplyVector(this.matrix, velocity);
    const motion = multiplyVector(this.rate, position);
    const outputVelocity = rotated.map((value, i) => value + motion[i]);
    if (!outputVelocity.every(Number.isFinite))
      throw new RangeError('State transformation overflow');
    return {position: multiplyVector(this.matrix, position), velocity: outputVelocity};
  }

  /** Returns the reverse frame transform at the same epoch. */
  inverse(): CelestialFrameTransform {
    // For a differentiable orthogonal R, inverse=transpose and its derivative=transpose(dR/dt).
    return new CelestialFrameTransform(transpose(this.matrix), {
      from: this.to,
      to: this.from,
      epoch: this.epoch,
      rotationRate: this.rate ? transpose(this.rate) : undefined
    });
  }

  /** Apply this transform, then next; both snapshots must describe the same instant. */
  then(next: CelestialFrameTransform): CelestialFrameTransform {
    if (this.to !== next.from) throw new RangeError('Frame chain does not match');
    if (this.epoch.secondsDifference(next.epoch) !== 0)
      throw new RangeError('Frame epochs must match');
    if (!this.rate || !next.rate) {
      return new CelestialFrameTransform(multiplyMatrix(next.matrix, this.matrix), {
        from: this.from,
        to: next.to,
        epoch: this.epoch
      });
    }
    const leftRate = multiplyMatrix(next.rate, this.matrix);
    const rightRate = multiplyMatrix(next.matrix, this.rate);
    return new CelestialFrameTransform(multiplyMatrix(next.matrix, this.matrix), {
      from: this.from,
      to: next.to,
      epoch: this.epoch,
      rotationRate: leftRate.map((value, i) => value + rightRate[i])
    });
  }
}

/** Copies an array-like value after checking its size and finite components. */
function finiteArray(input: ArrayLike<number>, size: number): number[] {
  if (input.length !== size) throw new RangeError('Unexpected coordinate/matrix length');
  const output = Array.from(input);
  if (!output.every(Number.isFinite)) throw new RangeError('Expected finite coordinates/matrix');
  return output;
}
/** Applies a column-major three-by-three matrix to a Cartesian vector. */
function multiplyVector(m: readonly number[], v: readonly number[]): number[] {
  const result = [0, 1, 2].map(row => m[row] * v[0] + m[row + 3] * v[1] + m[row + 6] * v[2]);
  if (!result.every(Number.isFinite)) throw new RangeError('Coordinate transformation overflow');
  return result;
}
/** Multiplies two column-major three-by-three matrices in the given order. */
function multiplyMatrix(a: readonly number[], b: readonly number[]): number[] {
  const output = new Array<number>(9);
  for (let column = 0; column < 3; column++) {
    for (let row = 0; row < 3; row++) {
      output[column * 3 + row] =
        a[row] * b[column * 3] + a[row + 3] * b[column * 3 + 1] + a[row + 6] * b[column * 3 + 2];
    }
  }
  return output;
}
/** Transposes a column-major three-by-three matrix. */
function transpose(m: readonly number[]): number[] {
  return [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
}
