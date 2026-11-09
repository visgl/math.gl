// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {HeightField} from './height-field';
import {sampleTerrainTriangleHeight} from './sample-triangle-height';
import {createTerrainBoxIndex} from './box-index';
import type {TerrainMixedVertexTile} from './mixed-vertex-halos';
import type {HeightFieldProps} from './types';
export type TerrainMixedSurfaceOptions = {
  maxSamples?: number;
  maxTests?: number;
  maxHeightAdjustment?: number;
};
/** Internal bounded common-lattice tessellation. Coarsest incident coverage owns
 * shared boundary heights; address order breaks ties. Shared validity is the
 * intersection of incident support, with no nodata fallback. */
export function reconcileMixedSurface(
  tiles: readonly TerrainMixedVertexTile[],
  options: TerrainMixedSurfaceOptions = {}
) {
  const limit = options.maxSamples ?? 4_000_000,
    budget = options.maxTests ?? 20_000_000,
    adjustment = options.maxHeightAdjustment ?? 0;
  if (
    ![limit, budget].every(Number.isSafeInteger) ||
    limit < 0 ||
    budget < 0 ||
    Number.isNaN(adjustment) ||
    adjustment < 0
  )
    throw new Error('Invalid mixed surface capacity or adjustment');
  let count = 0,
    tests = 0,
    maxHeightAdjustment = 0,
    sharedSamples = 0;
  const charge = () => {
    if (++tests > budget) throw new Error('Mixed surface work budget exceeded');
  };
  const seen = new Set<string>();
  const sorted = [...tiles].sort(
    (a, b) => b.spacing - a.spacing || a.column - b.column || a.row - b.row
  );
  const sources = sorted.map(t => {
    if (
      ![t.column, t.row, t.spacing].every(Number.isSafeInteger) ||
      t.spacing < 1 ||
      2 ** Math.round(Math.log2(t.spacing)) !== t.spacing
    )
      throw new Error('Invalid mixed surface lattice');
    const key = `${t.spacing}/${t.column}/${t.row}`;
    if (seen.has(key)) throw new Error('Duplicate mixed surface tile');
    seen.add(key);
    const width = (t.field.width - 1) * t.spacing + 1,
      height = (t.field.height - 1) * t.spacing + 1;
    count += width * height;
    if (
      ![width, height, count, t.column + width - 1, t.row + height - 1].every(
        Number.isSafeInteger
      ) ||
      width < 2 ||
      height < 2 ||
      count > limit
    )
      throw new Error('Mixed surface sample capacity or lattice overflow');
    const field = new HeightField(t.field);
    if (field.registration !== 'vertex')
      throw new Error('Mixed surfaces require vertex registration');
    return {...t, field, width, height};
  });
  const first = sources[0];
  const columnStep = first?.field.columnStep.map(v => v / first.spacing) ?? [1, 0],
    rowStep = first?.field.rowStep.map(v => v / first.spacing) ?? [0, 1];
  const origin = first?.field.origin.map(
    (v, i) => v - first.column * columnStep[i] - first.row * rowStep[i]
  ) ?? [0, 0];
  if (!origin.every(Number.isFinite)) throw new Error('Mixed surface frame overflow');
  for (const t of sources)
    for (let axis = 0; axis < 2; axis++) {
      const expected = origin[axis] + t.column * columnStep[axis] + t.row * rowStep[axis];
      const tolerance = Math.min(
        32 *
          Number.EPSILON *
          Math.max(
            1,
            Math.abs(t.field.origin[axis]),
            Math.abs(origin[axis]),
            Math.abs(t.column * columnStep[axis]),
            Math.abs(t.row * rowStep[axis])
          ),
        1e-9 * Math.max(Math.abs(columnStep[axis]), Math.abs(rowStep[axis]))
      );
      if (
        t.field.diagonal !== first.field.diagonal ||
        t.field.heightReference !== first.field.heightReference ||
        t.field.columnStep[axis] / t.spacing !== columnStep[axis] ||
        t.field.rowStep[axis] / t.spacing !== rowStep[axis] ||
        !Number.isFinite(expected) ||
        Math.abs(t.field.origin[axis] - expected) > tolerance
      )
        throw new Error('Mixed surface frames, diagonals or height references differ');
    }
  for (const axis of ['column', 'row'] as const) {
    let min = Infinity,
      max = -Infinity;
    for (const t of sources) {
      min = Math.min(min, t[axis]);
      max = Math.max(max, t[axis] + (axis === 'column' ? t.width : t.height) - 1);
    }
    if (sources.length && !Number.isSafeInteger(max - min))
      throw new Error('Mixed surface lattice span overflow');
  }
  const boxes = sources.map(t => ({
      minX: t.column,
      minY: t.row,
      maxX: t.column + t.width - 1,
      maxY: t.row + t.height - 1
    })),
    index = createTerrainBoxIndex(boxes);
  const neighbors = boxes.map((box, i) =>
    index(box, charge).filter(j => {
      if (
        i !== j &&
        box.minX < boxes[j].maxX &&
        boxes[j].minX < box.maxX &&
        box.minY < boxes[j].maxY &&
        boxes[j].minY < box.maxY
      )
        throw new Error('Overlapping mixed surface interiors');
      return j !== i;
    })
  );
  const fields = sources.map((t, i) => {
    const heights = new Float64Array(t.width * t.height),
      validity = new Uint8Array(heights.length);
    for (let y = 0; y < t.height; y++)
      for (let x = 0; x < t.width; x++) {
        charge();
        const gx = t.column + x,
          gy = t.row + y,
          local = sampleTerrainTriangleHeight(t.field, x / t.spacing, y / t.spacing);
        let owner = i,
          shared = false,
          missing = local === undefined;
        if (x === 0 || y === 0 || x === t.width - 1 || y === t.height - 1)
          for (const j of neighbors[i]) {
            charge();
            const b = boxes[j];
            if (gx >= b.minX && gx <= b.maxX && gy >= b.minY && gy <= b.maxY) {
              shared = true;
              const neighbor = sources[j];
              if (
                sampleTerrainTriangleHeight(
                  neighbor.field,
                  (gx - neighbor.column) / neighbor.spacing,
                  (gy - neighbor.row) / neighbor.spacing
                ) === undefined
              )
                missing = true;
              owner = Math.min(owner, j);
            }
          }
        const source = sources[owner],
          value = missing
            ? undefined
            : owner === i
              ? local
              : sampleTerrainTriangleHeight(
                  source.field,
                  (gx - source.column) / source.spacing,
                  (gy - source.row) / source.spacing
                );
        if (shared) sharedSamples++;
        if (local !== undefined && value !== undefined) {
          const delta = Math.abs(value - local);
          if (!Number.isFinite(delta) || delta > adjustment)
            throw new Error('Mixed surface height adjustment exceeded');
          maxHeightAdjustment = Math.max(maxHeightAdjustment, delta);
        }
        if (value !== undefined) {
          const id = y * t.width + x;
          heights[id] = value;
          validity[id] = 1;
        }
      }
    const props: HeightFieldProps = {
      width: t.width,
      height: t.height,
      heights,
      validity,
      origin: [
        origin[0] + t.column * columnStep[0] + t.row * rowStep[0],
        origin[1] + t.column * columnStep[1] + t.row * rowStep[1]
      ],
      columnStep: [...columnStep] as [number, number],
      rowStep: [...rowStep] as [number, number],
      registration: 'vertex',
      diagonal: t.field.diagonal,
      heightReference: t.field.heightReference
    };
    return {
      column: t.column,
      row: t.row,
      spacing: 1 as const,
      sourceSpacing: t.spacing,
      field: props
    };
  });
  return {
    origin: origin as [number, number],
    columnStep: columnStep as [number, number],
    rowStep: rowStep as [number, number],
    tiles: fields,
    maxHeightAdjustment,
    sharedSamples,
    tests
  };
}
