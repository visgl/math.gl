// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Broad display chapters, not dates of synchronous regional glacier boundaries.
export function glacialPhase(age) {
  if (age > 115) return 'Last interglacial';
  if (age > 70) return 'Early glacial cycle';
  if (age > 26.5) return 'Ice-sheet fluctuations';
  if (age >= 19) return 'Last glacial maximum';
  if (age >= 11.7) return 'Glacial retreat';
  return 'Holocene';
}
