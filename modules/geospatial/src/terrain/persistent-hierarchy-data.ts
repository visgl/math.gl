// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
export type TerrainHierarchyBlock = {
  /** Linear node offset in this level. Buffers pack two values and two counts per node. */
  offset: number;
  count: number;
  values: Float64Array;
  counts: Uint32Array;
};
export type TerrainPersistentLevel = {
  width: number;
  height: number;
  blockSize: number;
  nodesPerBlock: number;
  blocks: readonly TerrainHierarchyBlock[];
};
export type TerrainHierarchyUpdateStats = {
  copiedBlocks: number;
  copiedBytes: number;
  updatedNodes: Uint32Array;
};
export function getTerrainHierarchyNode(
  level: TerrainPersistentLevel,
  column: number,
  row: number
): {values: readonly [number, number]; counts: readonly [number, number]} {
  if (
    !Number.isSafeInteger(level.width) ||
    level.width < 1 ||
    !Number.isSafeInteger(level.height) ||
    level.height < 1 ||
    !Number.isSafeInteger(level.nodesPerBlock) ||
    level.nodesPerBlock < 1 ||
    !Array.isArray(level.blocks)
  )
    throw new Error('Invalid persistent hierarchy level');
  if (
    !Number.isSafeInteger(column) ||
    !Number.isSafeInteger(row) ||
    column < 0 ||
    row < 0 ||
    column >= level.width ||
    row >= level.height
  )
    throw new Error('Invalid persistent hierarchy node');
  const id = row * level.width + column,
    block = level.blocks[Math.floor(id / level.nodesPerBlock)],
    i = block ? 2 * (id - block.offset) : -1;
  const expectedOffset = Math.floor(id / level.nodesPerBlock) * level.nodesPerBlock;
  if (
    !block ||
    block.offset !== expectedOffset ||
    block.count !== Math.min(level.nodesPerBlock, level.width * level.height - expectedOffset) ||
    !(block.values instanceof Float64Array) ||
    !(block.counts instanceof Uint32Array) ||
    block.values.length !== 2 * block.count ||
    block.counts.length !== 2 * block.count
  )
    throw new Error('Invalid persistent hierarchy block');
  return {
    values: [block.values[i], block.values[i + 1]],
    counts: [block.counts[i], block.counts[i + 1]]
  };
}
export function packTerrainHierarchyLevel(
  width: number,
  height: number,
  blockSize: number,
  values: Float64Array,
  counts: Uint32Array,
  nodesPerBlock: number
): TerrainPersistentLevel {
  if (
    values.length !== 2 * width * height ||
    counts.length !== values.length ||
    !values.every(Number.isFinite)
  )
    throw new Error('Invalid persistent hierarchy buffers');
  const blocks: TerrainHierarchyBlock[] = [];
  for (let offset = 0; offset < width * height; offset += nodesPerBlock) {
    const count = Math.min(nodesPerBlock, width * height - offset);
    blocks.push({
      offset,
      count,
      values: values.slice(2 * offset, 2 * (offset + count)),
      counts: counts.slice(2 * offset, 2 * (offset + count))
    });
  }
  return {width, height, blockSize, nodesPerBlock, blocks};
}
export function persistentHierarchyOptions(
  options: {nodesPerBlock?: number; maxSamples?: number; maxTests?: number},
  count: number
) {
  const nodesPerBlock = options.nodesPerBlock ?? 256,
    maxSamples = options.maxSamples ?? 4_000_000,
    maxTests = options.maxTests ?? 10_000_000;
  if (
    ![nodesPerBlock, maxSamples, maxTests, count].every(Number.isSafeInteger) ||
    nodesPerBlock < 1 ||
    maxSamples < 0 ||
    maxTests < 0 ||
    count < 1 ||
    count > maxSamples
  )
    throw new Error('Invalid persistent terrain hierarchy capacity');
  let tests = 0;
  return {
    nodesPerBlock,
    maxSamples,
    charge: () => {
      if (++tests > maxTests) throw new Error('Persistent hierarchy work budget exceeded');
    }
  };
}
export function updatePersistentHierarchy(
  previous: readonly TerrainPersistentLevel[],
  ids: Set<number>,
  mode: 'bounds' | 'gradient',
  base: (
    x: number,
    y: number
  ) => {values: readonly [number, number]; counts: readonly [number, number]},
  charge: () => void
): {levels: TerrainPersistentLevel[]; stats: TerrainHierarchyUpdateStats} {
  const levels = previous.slice(),
    updatedNodes: number[] = [];
  let copiedBlocks = 0,
    copiedBytes = 0;
  for (let l = 0; l < levels.length; l++) {
    updatedNodes.push(ids.size);
    if (!ids.size) continue;
    const old = levels[l],
      blocks = old.blocks.slice(),
      cloned = new Set<number>(),
      parents = new Set<number>();
    const node = (level: TerrainPersistentLevel, x: number, y: number) =>
      getTerrainHierarchyNode(level, x, y);
    for (const id of ids) {
      charge();
      const x = id % old.width,
        y = Math.floor(id / old.width);
      let value: {values: readonly [number, number]; counts: readonly [number, number]};
      if (l === 0) value = base(x, y);
      else {
        const child = levels[l - 1];
        let a = mode === 'bounds' ? Infinity : 0,
          b = mode === 'bounds' ? -Infinity : 0,
          c = 0,
          d = 0;
        for (let dy = 0; dy < 2; dy++)
          for (let dx = 0; dx < 2; dx++) {
            const cx = x * 2 + dx,
              cy = y * 2 + dy;
            if (cx >= child.width || cy >= child.height) continue;
            const v = node(child, cx, cy),
              n = v.counts[0];
            d += v.counts[1];
            if (n) {
              if (mode === 'bounds') {
                a = Math.min(a, v.values[0]);
                b = Math.max(b, v.values[1]);
              } else {
                const total = c + n;
                a = c ? a * (c / total) + v.values[0] * (n / total) : v.values[0];
                b = c ? b * (c / total) + v.values[1] * (n / total) : v.values[1];
              }
              c += n;
            }
          }
        if (c && (!Number.isFinite(a) || !Number.isFinite(b)))
          throw new Error('Persistent hierarchy arithmetic overflow');
        value = {values: c ? [a, b] : [0, 0], counts: [c, d]};
      }
      const blockId = Math.floor(id / old.nodesPerBlock);
      if (!cloned.has(blockId)) {
        const source = blocks[blockId];
        blocks[blockId] = {...source, values: source.values.slice(), counts: source.counts.slice()};
        cloned.add(blockId);
        copiedBlocks++;
        copiedBytes += blocks[blockId].values.byteLength + blocks[blockId].counts.byteLength;
      }
      const block = blocks[blockId],
        i = 2 * (id - block.offset);
      block.values[i] = value.values[0];
      block.values[i + 1] = value.values[1];
      block.counts[i] = value.counts[0];
      block.counts[i + 1] = value.counts[1];
      parents.add(Math.floor(y / 2) * Math.ceil(old.width / 2) + Math.floor(x / 2));
    }
    levels[l] = {...old, blocks};
    ids = parents;
  }
  return {levels, stats: {copiedBlocks, copiedBytes, updatedNodes: Uint32Array.from(updatedNodes)}};
}
