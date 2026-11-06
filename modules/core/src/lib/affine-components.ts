// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Extract a proper rotation and signed scale from finite, nonsingular, shear-free TRS. */
export function affineComponents(matrix: ArrayLike<number>) {
  if (
    matrix.length !== 16 ||
    Array.from(matrix).some(x => !Number.isFinite(x)) ||
    matrix[3] !== 0 ||
    matrix[7] !== 0 ||
    matrix[11] !== 0 ||
    matrix[15] !== 1
  ) {
    throw new RangeError('Expected a finite affine matrix');
  }
  const scale = [
    Math.hypot(matrix[0], matrix[1], matrix[2]),
    Math.hypot(matrix[4], matrix[5], matrix[6]),
    Math.hypot(matrix[8], matrix[9], matrix[10])
  ];
  if (scale.some(x => x === 0 || !Number.isFinite(x))) throw new RangeError('Singular transform');
  const rotation = Array.from(
    {length: 9},
    (_, i) => matrix[Math.floor(i / 3) * 4 + (i % 3)] / scale[Math.floor(i / 3)]
  );
  for (const [a, b] of [
    [0, 3],
    [0, 6],
    [3, 6]
  ]) {
    if (
      Math.abs(
        rotation[a] * rotation[b] +
          rotation[a + 1] * rotation[b + 1] +
          rotation[a + 2] * rotation[b + 2]
      ) > 1e-7
    ) {
      throw new RangeError('Sheared transforms do not have a TRS decomposition');
    }
  }
  const determinant =
    rotation[0] * (rotation[4] * rotation[8] - rotation[5] * rotation[7]) -
    rotation[3] * (rotation[1] * rotation[8] - rotation[2] * rotation[7]) +
    rotation[6] * (rotation[1] * rotation[5] - rotation[2] * rotation[4]);
  if (determinant < 0) {
    scale[0] = -scale[0];
    for (let i = 0; i < 3; i++) rotation[i] = -rotation[i];
  }
  return {rotation, scale, translation: [matrix[12], matrix[13], matrix[14]]};
}
