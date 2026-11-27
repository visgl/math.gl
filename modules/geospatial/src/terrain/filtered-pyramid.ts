// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type TerrainFilteredLevel = {
  width: number;
  height: number;
  /** Mean of valid original samples, or zero when validCounts is zero. */
  heights: Float64Array;
  validCounts: Uint32Array;
  /** Original sample count represented, including missing samples. */
  sampleCounts: Uint32Array;
};

/** Box-filter a cell raster into a weighted pyramid. Odd edges retain their true
 * source counts. Missing data is excluded from means but remains visible in counts.
 * These averages are not conservative collision bounds or vertex-registered meshes.
 */
export function createTerrainFilteredPyramid(
  input: {
    width: number;
    height: number;
    heights: Float32Array | Float64Array;
    validity?: Uint8Array;
  },
  options: {maxSamples?: number} = {}
): TerrainFilteredLevel[] {
  const {width, height, heights, validity} = input;
  const count = width * height;
  const limit = options.maxSamples ?? 4_000_000;
  if (
    !Number.isSafeInteger(width) ||
    width < 1 ||
    !Number.isSafeInteger(height) ||
    height < 1 ||
    !Number.isSafeInteger(count) ||
    count > 0xffffffff ||
    !Number.isSafeInteger(limit) ||
    limit < count ||
    !(heights instanceof Float32Array || heights instanceof Float64Array) ||
    heights.length !== count ||
    (validity !== undefined && (!(validity instanceof Uint8Array) || validity.length !== count))
  )
    throw new Error('Invalid terrain filtered pyramid input or capacity');
  const base: TerrainFilteredLevel = {
    width,
    height,
    heights: new Float64Array(count),
    validCounts: new Uint32Array(count),
    sampleCounts: new Uint32Array(count).fill(1)
  };
  for (let i = 0; i < count; i++)
    if ((!validity || validity[i] !== 0) && Number.isFinite(heights[i])) {
      base.heights[i] = heights[i];
      base.validCounts[i] = 1;
    }
  const levels = [base];
  let source = base;
  while (source.width > 1 || source.height > 1) {
    const w = Math.ceil(source.width / 2),
      h = Math.ceil(source.height / 2);
    const next: TerrainFilteredLevel = {
      width: w,
      height: h,
      heights: new Float64Array(w * h),
      validCounts: new Uint32Array(w * h),
      sampleCounts: new Uint32Array(w * h)
    };
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const out = y * w + x;
        for (let dy = 0; dy < 2; dy++)
          for (let dx = 0; dx < 2; dx++) {
            const sx = x * 2 + dx,
              sy = y * 2 + dy;
            if (sx >= source.width || sy >= source.height) continue;
            const index = sy * source.width + sx;
            const n = source.validCounts[index],
              old = next.validCounts[out];
            next.sampleCounts[out] += source.sampleCounts[index];
            if (n) {
              const total = old + n,
                a = next.heights[out],
                b = source.heights[index];
              // Convex combination avoids overflow when values have opposite signs.
              next.heights[out] = old ? a * (old / total) + b * (n / total) : b;
              next.validCounts[out] = total;
            }
          }
      }
    levels.push(next);
    source = next;
  }
  return levels;
}
