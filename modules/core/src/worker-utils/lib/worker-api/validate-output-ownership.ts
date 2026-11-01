// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Reject unknown output ownership modes before dispatch or processing. */
export function validateOutputOwnership(ownership: unknown): void {
  if (ownership !== undefined && ownership !== 'copy' && ownership !== 'transfer') {
    throw new Error('Invalid worker output ownership');
  }
}
