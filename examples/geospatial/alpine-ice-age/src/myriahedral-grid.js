// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Tessellate convex spherical panels independently, retaining geographic samples.
 * Interpolating unit vectors and normalizing stays inside each panel's great-circle
 * edges. A shared fan center avoids the longitude seam and polar singularities.
 */
export function* myriahedralGridSteps(map, step, output, sourceSample) {
  const { positions, sources, samples, indices, regionIds } = output;
  const rad = Math.PI / 180;
  const sphere = ([lon, lat]) => [
    Math.cos(lon * rad) * Math.cos(lat * rad),
    Math.sin(lon * rad) * Math.cos(lat * rad),
    Math.sin(lat * rad),
  ];
  const angle = (a, b) =>
    Math.acos(
      Math.max(
        -1,
        Math.min(
          1,
          a.reduce((sum, v, i) => sum + v * b[i], 0),
        ),
      ),
    );
  for (const region of map.regions) {
    const center = sphere(region.interior);
    const boundary = region.boundary.map(sphere);
    for (let edge = 0; edge < boundary.length; edge++) {
      const a = boundary[edge],
        b = boundary[(edge + 1) % boundary.length];
      // The extra factor bounds sampling density under radial normalization.
      const count = Math.max(
        1,
        Math.ceil(
          (1.1 * Math.max(angle(center, a), angle(center, b), angle(a, b))) /
            (step * rad),
        ),
      );
      const rows = [];
      for (let i = 0; i <= count; i++) {
        yield;
        const row = [];
        for (let j = 0; j <= count - i; j++) {
          const v = center.map(
            (x, k) =>
              x * (1 - (i + j) / count) +
              (a[k] * i) / count +
              (b[k] * j) / count,
          );
          const geographic = [
            Math.atan2(v[1], v[0]) / rad,
            Math.atan2(v[2], Math.hypot(v[0], v[1])) / rad,
          ];
          const projected = map.projectPoint(geographic, region.id);
          if (!projected)
            throw new Error("Panel sample lies outside its region");
          row.push(sources.length);
          positions.push(...projected.position);
          sources.push(geographic);
          samples.push(sourceSample(geographic));
          regionIds.push(region.id);
        }
        rows.push(row);
      }
      for (let i = 0; i < count; i++) {
        for (let j = 0; j < count - i; j++) {
          indices.push(rows[i][j], rows[i + 1][j], rows[i][j + 1]);
          if (j < count - i - 1)
            indices.push(rows[i + 1][j], rows[i + 1][j + 1], rows[i][j + 1]);
        }
      }
    }
  }
}
