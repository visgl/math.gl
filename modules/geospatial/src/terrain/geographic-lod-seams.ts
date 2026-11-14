// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getGeographicTileBounds, type GeographicTile} from '../geographic-tiles';
import type {TerrainLodSeam} from './lod-stitch';

type Side = {tile: number; start: number; end: number};
type Line = {before: Side[]; after: Side[]};

/**
 * Find positive-length mixed-level seams in a nonoverlapping equal-angle resident cut.
 * Seam indices address the cut in input order. Mesh columns must run west to east and
 * rows north to south. For wrapped seams, mesh X must be longitude in degrees with
 * the same scale on both sides. The coarser tile owns each span.
 */
export function discoverGeographicTerrainLodSeams(
  cut: readonly GeographicTile[]
): TerrainLodSeam[] {
  const vertical = new Map<number, Line>();
  const horizontal = new Map<number, Line>();
  const world = 2 ** 30;
  const addresses = new Set<string>();
  const key = (level: number, x: number, y: number) => `${level}/${x}/${y}`;

  for (const tile of cut) {
    getGeographicTileBounds(tile);
    const address = key(tile.level, tile.x, tile.y);
    if (addresses.has(address)) throw new Error('Duplicate geographic terrain tile');
    addresses.add(address);
  }

  function add(lines: Map<number, Line>, line: number, side: keyof Line, span: Side) {
    let group = lines.get(line);
    if (!group) {
      group = {before: [], after: []};
      lines.set(line, group);
    }
    group[side].push(span);
  }

  cut.forEach(({level, x, y}, tile) => {
    for (let parent = level - 1; parent >= 0; parent--) {
      const scale = 2 ** (level - parent);
      if (addresses.has(key(parent, Math.floor(x / scale), Math.floor(y / scale))))
        throw new Error('Overlapping geographic terrain tiles');
    }
    const size = 2 ** (30 - level);
    const west = x * size;
    const north = y * size;
    const east = west + size;
    const south = north + size;
    add(vertical, west, 'after', {tile, start: north, end: south});
    add(vertical, east % world, 'before', {tile, start: north, end: south});
    if (north !== 0) add(horizontal, north, 'after', {tile, start: west, end: east});
    if (south !== world) add(horizontal, south, 'before', {tile, start: west, end: east});
  });

  const seams: TerrainLodSeam[] = [];
  function match(lines: Map<number, Line>, column: boolean) {
    const beforeEdge = column ? 'maxColumn' : 'maxRow';
    const afterEdge = column ? 'minColumn' : 'minRow';
    const byStart = (a: Side, b: Side) => a.start - b.start;
    for (const [line, {before, after}] of lines) {
      before.sort(byStart);
      after.sort(byStart);
      let i = 0;
      let j = 0;
      while (i < before.length && j < after.length) {
        const left = before[i];
        const right = after[j];
        const start = Math.max(left.start, right.start);
        const end = Math.min(left.end, right.end);
        const leftLevel = cut[left.tile].level;
        const rightLevel = cut[right.tile].level;
        if (end > start && leftLevel !== rightLevel) {
          const leftOwns = leftLevel < rightLevel;
          const coarse = leftOwns ? left : right;
          seams.push({
            a: coarse.tile,
            edgeA: leftOwns ? beforeEdge : afterEdge,
            b: leftOwns ? right.tile : left.tile,
            edgeB: leftOwns ? afterEdge : beforeEdge,
            ...(column && line === 0 ? {offsetBX: leftOwns ? 360 : -360} : {}),
            options: {
              rangeA: [
                (start - coarse.start) / (coarse.end - coarse.start),
                (end - coarse.start) / (coarse.end - coarse.start)
              ]
            }
          });
        }
        if (left.end <= right.end) i++;
        if (right.end <= left.end) j++;
      }
    }
  }
  match(vertical, true);
  match(horizontal, false);
  const edges = ['minColumn', 'maxColumn', 'minRow', 'maxRow'];
  return seams.sort(
    (a, b) =>
      cut[a.a].level - cut[b.a].level ||
      cut[a.a].y - cut[b.a].y ||
      cut[a.a].x - cut[b.a].x ||
      edges.indexOf(a.edgeA) - edges.indexOf(b.edgeA) ||
      a.options!.rangeA![0] - b.options!.rangeA![0]
  );
}
