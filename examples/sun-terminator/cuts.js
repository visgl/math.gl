// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
export const LOBES = [-180, -100, -20, 80, 180];
export function interruptedPoint(lon, lat, sectorLongitude = lon) {
  const found = LOBES.findIndex((edge, i) => i < 4 && sectorLongitude < LOBES[i + 1]);
  const index = found < 0 ? 3 : found;
  const center = (LOBES[index] + LOBES[index + 1]) / 2;
  return [
    (((center + (lon - center) * Math.cos((lat * Math.PI) / 180)) * Math.PI) / 180) * 63.78137,
    ((lat * Math.PI) / 180) * 63.78137,
    0
  ];
}
