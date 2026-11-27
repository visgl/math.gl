// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {HeightField, HeightFieldGeometry, TerrainSampleStatus} from '@math.gl/geospatial/terrain';
export {TerrainSampleStatus};
export function createTerrain(diagonal, missing) {
  const size = 9;
  const heights = Float32Array.from({length: size * size}, (_, i) => {
    const x = i % size,
      y = Math.floor(i / size);
    return 18 * Math.sin(x * 0.8) * Math.cos(y * 0.6) + 20;
  });
  if (missing) heights[4 * size + 4] = NaN;
  const field = new HeightField({
    width: size,
    height: size,
    heights,
    columnStep: [10, 0],
    rowStep: [0, 10],
    diagonal,
    heightReference: 'synthetic-local-meters'
  });
  const mesh = new HeightFieldGeometry(field);
  const positions = mesh.attributes.POSITION.value;
  const normals = mesh.attributes.NORMAL.value;
  const triangles = Array.from({length: mesh.indices.value.length / 3}, (_, i) =>
    Array.from(mesh.indices.value.slice(i * 3, i * 3 + 3), index =>
      Array.from(positions.slice(index * 3, index * 3 + 3))
    )
  );
  return {field, triangles, positions, normals};
}
export const project = ([x, y, z]) => [350 + (x - y) * 3.2, 440 - (x + y) * 1.8 - z * 3];
export function sampleLabel(sample) {
  return (
    Object.entries(TerrainSampleStatus).find(([, value]) => value === sample.status)?.[0] ||
    'UNKNOWN'
  );
}
