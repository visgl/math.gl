// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** JSON-safe sampled projection. Coordinates are longitude/latitude degrees,
 * rows run south to north, columns west to east. Null denotes an undefined node. */
export type ElasticMapData = {
  version: 1;
  name: string;
  /** Normalization radius in the table's output units. */
  radius: number;
  sections: readonly ElasticSection[];
};
export type ElasticSection = {
  id: string;
  /** Closed, straight longitude/latitude boundary in [-180,180] × [-90,90]. */
  boundary: readonly (readonly [number, number])[];
  /** True selects the complement of the boundary within the geographic rectangle. */
  complement?: boolean;
  rows: number;
  columns: number;
  /** Interleaved x,y pairs, row-major. */
  values: readonly (number | null)[];
};

/** Read Justin Kunimune's published Elastic text format. The inverse hint table
 * is validated but not used: picking solves the forward bilinear cells instead. */
export function parseElasticMap(text: string, options: {radius?: number} = {}): ElasticMapData {
  if (typeof text !== 'string' || text.length > 32_000_000)
    throw new Error('Elastic text must be a string under 32 MB');
  const lines = text.trim().split(/\r?\n/);
  let cursor = 0;
  const header = (pattern: RegExp) => {
    const match = pattern.exec(lines[cursor++]?.trim() ?? '');
    if (!match) throw new Error(`Invalid Elastic header at line ${cursor}`);
    return match;
  };
  const count = (s: string, limit: number) => {
    const n = Number(s);
    if (!Number.isInteger(n) || n < 1 || n > limit) throw new Error('Invalid Elastic dimensions');
    return n;
  };
  const numbers = (length: number, nullable = false): (number | null)[] => {
    const values = (lines[cursor++] ?? '').split(',').map(s => {
      const token = s.trim();
      if (nullable && token === 'NaN') return null;
      if (!token || !Number.isFinite(Number(token)))
        throw new Error(`Invalid Elastic number at line ${cursor}`);
      return Number(token);
    });
    if (values.length !== length) throw new Error(`Invalid Elastic row at line ${cursor}`);
    return values;
  };
  const first = header(/^(.+) projection \((\d+) sections\):$/);
  const sections: ElasticSection[] = [];
  for (let i = 0, n = count(first[2], 64); i < n; i++) {
    const id = header(/^section (.+):$/)[1];
    const n = count(header(/^boundary \((\d+) vertices\):$/)[1], 100_000);
    const boundary: [number, number][] = [];
    for (let j = 0; j < n; j++) {
      const [lat, lon] = numbers(2) as number[];
      boundary.push([lon, lat]);
    }
    const size = header(/^projected points \((\d+)x(\d+) points\):$/);
    const rows = count(size[1], 2048),
      columns = count(size[2], 4096);
    if (rows * columns > 1_000_000) throw new Error('Elastic grid is too large');
    const values = [] as (number | null)[];
    for (let j = 0; j < rows; j++) values.push(...numbers(columns * 2, true));
    // Upstream boundary orientation is measured in latitude/longitude order.
    // Its signed-area convention is equivalent to positive lon/lat area.
    let area = 0;
    for (let j = 1; j < boundary.length; j++)
      area += boundary[j - 1][0] * boundary[j][1] - boundary[j][0] * boundary[j - 1][1];
    sections.push({id, boundary, complement: area < 0, rows, columns, values});
  }
  const outline = count(header(/^projected boundary \((\d+) vertices\):$/)[1], 100_000);
  for (let i = 0; i < outline; i++) numbers(2);
  const inverse = header(/^inverse-projected points \((\d+)x(\d+) points\):$/);
  const rows = count(inverse[1], 2048),
    columns = count(inverse[2], 4096);
  numbers(4);
  for (let i = 0; i < rows; i++) numbers(columns * 2, true);
  if (cursor !== lines.length) throw new Error('Unexpected trailing Elastic data');
  return {version: 1, name: first[1], radius: options.radius ?? 6371, sections};
}
