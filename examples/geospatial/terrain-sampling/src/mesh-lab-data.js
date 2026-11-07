// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import reference from './assets/n43-reference.json';

/** Pinned GDAL DTED samples and labeled analytical stress surfaces. */
export function getMeshLabData(name) {
  if (name === 'dem')
    return {
      width: 9,
      height: 9,
      heights: Float64Array.from(
        {length: 81},
        (_, i) => reference.heights[(5 + Math.floor(i / 9)) * 33 + 5 + (i % 9)]
      ),
      description: `DTED crop, ${reference.source}. Samples interpreted as vertices.`
    };
  const width = 33,
    height = 33;
  return {
    width,
    height,
    heights: Float64Array.from({length: width * height}, (_, i) => {
      const x = ((i % width) - 16) / 8,
        y = (Math.floor(i / width) - 16) / 8;
      if (name === 'holes' && x * x + y * y < 0.2) return NaN;
      if (name === 'coast') return Math.max(0, 20 * x + 4 * Math.sin(3 * y));
      return 40 * Math.exp(-(x * x + y * y)) + 8 * Math.sin(x * 3) * Math.cos(y * 2);
    }),
    description:
      name === 'coast'
        ? 'Analytical coastal shelf stress surface.'
        : name === 'holes'
          ? 'Analytical mountainous stress surface with a missing center.'
          : 'Analytical mountainous stress surface.'
  };
}

/** Exhaustive demo-only nodal oracle, independent of the public error rasterizer. */
export function getMeshLabErrors(field, mesh) {
  const errors = [];
  for (let y = 0; y < field.height; y++)
    for (let x = 0; x < field.width; x++) {
      const height = field.getHeight(x, y);
      if (height === undefined) continue;
      let error;
      for (let t = 0; t < mesh.indices.length; t += 3) {
        const ids = [mesh.indices[t], mesh.indices[t + 1], mesh.indices[t + 2]];
        const [a, b, c] = ids.map(i => [
          mesh.gridCoordinates[2 * i],
          mesh.gridCoordinates[2 * i + 1]
        ]);
        const det = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
        const u = ((b[1] - c[1]) * (x - c[0]) + (c[0] - b[0]) * (y - c[1])) / det;
        const v = ((c[1] - a[1]) * (x - c[0]) + (a[0] - c[0]) * (y - c[1])) / det;
        if (Math.min(u, v, 1 - u - v) >= -1e-12) {
          const z =
            u * mesh.positions[3 * ids[0] + 2] +
            v * mesh.positions[3 * ids[1] + 2] +
            (1 - u - v) * mesh.positions[3 * ids[2] + 2] +
            mesh.origin[2];
          error = Math.max(error ?? 0, Math.abs(z - height));
        }
      }
      errors.push({x, y, error});
    }
  return errors;
}
