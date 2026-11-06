// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import { REGIONAL_VIEWS } from "./regional-views.js";

export const canCenterMap = (view) =>
  typeof view === "string" &&
  !REGIONAL_VIEWS[view] &&
  view !== "albersUsa" &&
  !view.startsWith("myriahedral:");
export const wrapLongitude = (value) =>
  ((((value + 180) % 360) + 360) % 360) - 180;
export const mapLongitudeOffset = (view, longitude) =>
  canCenterMap(view) ? longitude : 0;
export const geographicSource = (source, offset) => [
  source[0] + offset,
  source[1],
];

/** Rotate the periodic source field, keeping triangles on their original side of each cut. */
export function sampleLongitudeRow(field, x, y, offset) {
  const column = (((x + offset) % 360) + 360) % 360;
  const west = Math.floor(column),
    fraction = column - west;
  return (
    field[y * 360 + west] * (1 - fraction) +
    field[y * 360 + ((west + 1) % 360)] * fraction
  );
}

const graticules = new WeakMap();
/** Reproject true 30-degree meridians into each chart when its central meridian moves. */
export function centeredGraticules(map, lines, offset) {
  if (offset === 0) return lines;
  const previous = graticules.get(map);
  if (previous?.offset === offset) return previous.lines;
  const shifted = lines.filter((line) => line.meridian === undefined);
  for (let lon = -180; lon <= 180; lon += 30) {
    const relative = wrapLongitude(lon - offset);
    shifted.push(
      ...map.projectLine(
        Array.from({ length: 181 }, (_, i) => [relative, i - 90]),
      ),
    );
  }
  graticules.set(map, { offset, lines: shifted });
  return shifted;
}
