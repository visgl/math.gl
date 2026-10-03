// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original explicit vertical-grid stage, following PROJ geoid-height conventions.
// No proj4js or PROJ implementation code is copied.
import {unsupportedStage} from './crs/types';
import type {VerticalGridCollection} from './grids/types';

/** Compile an ordered list; null explicitly supplies a zero-offset fallback. */
export function compileVerticalGrid(
  names: string | undefined,
  grids: VerticalGridCollection = {}
): ((longitude: number, latitude: number) => number) | undefined {
  if (names === undefined) return undefined;
  const entries: (((longitude: number, latitude: number) => number | undefined) | null)[] = [];
  for (const entry of names.split(',')) {
    const optional = entry.startsWith('@');
    const name = optional ? entry.slice(1) : entry;
    if (!name || /\s/.test(name)) throw new Error('Invalid vertical grid name');
    if (name === 'null') {
      entries.push(null);
      break;
    }
    const grid = Object.prototype.hasOwnProperty.call(grids, name) ? grids[name] : undefined;
    if (grid) {
      if (typeof grid.getOffset !== 'function') throw new Error('Invalid vertical grid: ' + name);
      entries.push(grid.getOffset.bind(grid));
    } else if (!optional) unsupportedStage('Required vertical grid is not registered: ' + name);
  }
  return (longitude, latitude) => {
    for (const sample of entries) {
      if (!sample) return 0;
      const offset = sample(longitude, latitude);
      if (offset === undefined) continue;
      if (!Number.isFinite(offset)) throw new Error('Vertical grid returned a non-finite offset');
      return offset;
    }
    throw new Error('No vertical grid covers this coordinate');
  };
}
