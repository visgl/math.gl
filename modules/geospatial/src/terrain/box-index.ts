// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
export type TerrainBox = {minX: number; minY: number; maxX: number; maxY: number};
const overlaps = (a: TerrainBox, b: TerrainBox) =>
  a.minX <= b.maxX && b.minX <= a.maxX && a.minY <= b.maxY && b.minY <= a.maxY;
type Node = TerrainBox & {left?: Node; right?: Node; ids?: number[]};
/** Internal static broad phase. Exact predicates remain authoritative. */
export function createTerrainBoxIndex(boxes: readonly TerrainBox[]) {
  const build = (ids: number[]): Node => {
    const box = {minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity};
    for (const id of ids) {
      const b = boxes[id];
      box.minX = Math.min(box.minX, b.minX);
      box.minY = Math.min(box.minY, b.minY);
      box.maxX = Math.max(box.maxX, b.maxX);
      box.maxY = Math.max(box.maxY, b.maxY);
    }
    if (ids.length <= 8) return {...box, ids};
    const axis = box.maxX - box.minX >= box.maxY - box.minY ? 'X' : 'Y';
    ids.sort(
      (a, b) =>
        boxes[a][`min${axis}`] / 2 +
          boxes[a][`max${axis}`] / 2 -
          (boxes[b][`min${axis}`] / 2 + boxes[b][`max${axis}`] / 2) || a - b
    );
    const mid = ids.length >>> 1;
    return {...box, left: build(ids.slice(0, mid)), right: build(ids.slice(mid))};
  };
  const root = build(boxes.map((_, i) => i));
  return (query: TerrainBox, charge: () => void): number[] => {
    const found: number[] = [],
      stack = [root];
    while (stack.length) {
      charge();
      const node = stack.pop()!;
      if (!overlaps(node, query)) continue;
      if (node.ids) {
        for (const id of node.ids) {
          charge();
          if (overlaps(boxes[id], query)) found.push(id);
        }
      } else stack.push(node.right!, node.left!);
    }
    return found.sort((a, b) => a - b);
  };
}
