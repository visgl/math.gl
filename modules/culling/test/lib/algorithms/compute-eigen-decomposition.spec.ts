import {test, expect} from 'vitest';

import {Matrix3} from '@math.gl/core';
import {computeEigenDecomposition} from '@math.gl/culling';

test('computeEigenDecomposition#throws without a matrix', () => {
  // @ts-expect-error
  expect(() => computeEigenDecomposition()).toThrow();
});

test('computeEigenDecomposition#computes eigenvalues and eigenvectors', () => {
  // biome-ignore format: preserve the matrix layout
  const a = new Matrix3().setRowMajor(
    4.0, -1.0, 1.0,
    -1.0, 3.0, -2.0,
    1.0, -2.0, 3.0);

  // biome-ignore format: preserve the matrix layout
  // const expectedDiagonal = new Matrix3().setRowMajor(
  //   3.0, 0.0, 0.0,
  //   0.0, 6.0, 0.0,
  //   0.0, 0.0, 1.0);

  const result = computeEigenDecomposition(a);
  expect(result).toBeTruthy();
});

test('computeEigenDecomposition#computes eigenvalues and eigenvectors with result parameters', () => {
  // biome-ignore format: preserve the matrix layout
  const a = new Matrix3().setRowMajor(
    4.0, -1.0, 1.0,
    -1.0, 3.0, -2.0,
    1.0, -2.0, 3.0);

  // biome-ignore format: preserve the matrix layout
  // const expectedDiagonal = new Matrix3().setRowMajor(
  //   3.0, 0.0, 0.0,
  //   0.0, 6.0, 0.0,
  //   0.0, 0.0, 1.0);

  const result = {
    unitary: new Matrix3(),
    diagonal: new Matrix3()
  };

  const decomposition = computeEigenDecomposition(a, result);

  expect(decomposition).toBe(result);
});
