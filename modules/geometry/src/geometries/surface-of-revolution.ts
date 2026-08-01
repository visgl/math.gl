// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {makeIndices, type MeshData} from './geometry-helpers';

export type ProfileRing = {radius: number; y: number; normalRadius: number; normalY: number};

export function makeSurfaceOfRevolution(
  rings: ProfileRing[],
  nradial: number
): MeshData & {indexArray: Uint16Array | Uint32Array} {
  const positions: number[] = [];
  const normals: number[] = [];
  const texCoords: number[] = [];
  const indices: number[] = [];
  const stride = nradial + 1;
  for (let ringIndex = 0; ringIndex < rings.length; ringIndex++) {
    const ring = rings[ringIndex];
    for (let radial = 0; radial <= nradial; radial++) {
      const u = radial / nradial;
      const angle = u * Math.PI * 2;
      const sin = Math.sin(angle);
      const cos = Math.cos(angle);
      positions.push(sin * ring.radius, ring.y, cos * ring.radius);
      normals.push(sin * ring.normalRadius, ring.normalY, cos * ring.normalRadius);
      texCoords.push(u, ringIndex / (rings.length - 1));
    }
  }
  for (let ring = 0; ring < rings.length - 1; ring++) {
    for (let radial = 0; radial < nradial; radial++) {
      const a = ring * stride + radial;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, b, d, a, d, c);
    }
  }
  return {
    ...{positions, normals, texCoords, indices},
    indexArray: makeIndices(positions.length / 3, indices)
  };
}
