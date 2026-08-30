// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Order in which Euler rotations are applied. */
export type EulerRotationOrder = 'zyx' | 'yxz' | 'xzy' | 'zxy' | 'yzx' | 'xyz';

/** Structural representation of Euler angles. */
export type EulerLike = {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly order: EulerRotationOrder;
};
