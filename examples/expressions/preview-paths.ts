// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Preserve supplied longitude extents for closed cell boundaries; unwrap open
 * paths along the short longitude interval, then repeat
 * the path on every world copy that intersects the visible [-180,180] map.
 * The canvas clips the copies; each seam retains both visible halves.
 */
export function longitudeCopies(
  coordinates: readonly (readonly [number, number])[]
): [number, number][][] {
  if (!coordinates.length || !coordinates.every(p => p.every(Number.isFinite))) return [];
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  const closed = coordinates.length > 2 && first[0] === last[0] && first[1] === last[1];
  const path: [number, number][] = [];
  for (const [longitude, latitude] of coordinates) {
    const normalized = ((((longitude + 180) % 360) + 360) % 360) - 180;
    const previous = path[path.length - 1]?.[0] ?? normalized;
    path.push([
      closed ? longitude : normalized + 360 * Math.round((previous - normalized) / 360),
      latitude
    ]);
  }
  let min = Infinity,
    max = -Infinity;
  for (const [x] of path) {
    min = Math.min(min, x);
    max = Math.max(max, x);
  }
  const copies: [number, number][][] = [];
  for (let k = Math.ceil((-180 - max) / 360); k <= Math.floor((180 - min) / 360); k++)
    copies.push(path.map(([x, y]) => [x + 360 * k, y]));
  return copies;
}
