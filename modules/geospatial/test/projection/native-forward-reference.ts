// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import polePrecision from './fixtures/pole-precision-reference.json';

// PROJ's pole-conditioned Mollweide iteration exceeds the existing 20 µm
// ceiling. Use independent 80-digit forward values in every qualification
// harness, while retaining the original native coordinates for inverse tests.
export function nativeForwardExpectation(
  definition: string,
  row: {input: number[]; forward: number[]}
): number[] {
  if (!definition.startsWith('+proj=moll ')) return row.forward;
  const precise = polePrecision.cases.find(
    p =>
      p.definition === definition &&
      p.input[0] === row.input[0] &&
      p.input[1] === row.input[1] &&
      !('inverseOnly' in p)
  );
  if (!precise) throw new Error('Missing independent Mollweide forward: ' + row.input);
  return precise.forward;
}
