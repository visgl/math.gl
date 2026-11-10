// math.gl
// SPDX-License-Identifier: ISC
// SPDX-FileCopyrightText: Copyright 2017-2024 Mike Bostock
// AirOcean topology/rotation adapted from d3-geo-polygon, ISC license.
// Copyright 2017-2024 Mike Bostock. See AIR-OCEAN-LICENSE.txt.
// Arrangement implementation credited upstream to Jason Davies, Enrico Spinielli,
// and Philippe Riviere. Hinge geometry and rendering are independent of Nico's code.

import {Matrix4} from '@math.gl/core';
import {add, cross, dot, scale, type Vector as Vec3} from './math';
const subtract = (a: Vec3, b: Vec3) => add(a, scale(b, -1));
const center = (points: Vec3[]) => scale(points.reduce(add, [0, 0, 0]), 1 / points.length);
type Polyhedron = {vertices: Vec3[]; faces: number[][]};

/** The 24-piece AirOcean net: 20 icosahedron faces, with three faces split.
 * Added vertices stay in the original planar facets, preserving a true flat net.
 * This supplies the cut arrangement, not the Gray-Fuller geographic projection.
 */
export function airOceanMesh(): {mesh: Polyhedron; joins: number[][]} {
  const latitude = Math.atan(0.5);
  const vertices: Vec3[] = [
    [0, 0, 1],
    [0, 0, -1]
  ];
  for (let i = 0; i < 10; i++) {
    const lon = (i * Math.PI) / 5,
      lat = i % 2 ? latitude : -latitude;
    vertices.push([Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)]);
  }
  const faces = [
    [0, 3, 11],
    [0, 5, 3],
    [0, 7, 5],
    [0, 9, 7],
    [0, 11, 9],
    [2, 11, 3],
    [3, 4, 2],
    [4, 3, 5],
    [5, 6, 4],
    [6, 5, 7],
    [7, 8, 6],
    [8, 7, 9],
    [9, 10, 8],
    [10, 9, 11],
    [11, 2, 10],
    [1, 2, 4],
    [1, 4, 6],
    [1, 6, 8],
    [1, 8, 10],
    [1, 10, 2]
  ];
  vertices.push(center(faces[15].map(i => vertices[i]))); // 12: facet centroid
  vertices.push(center([vertices[2], vertices[10]])); // 13: shared edge midpoint
  faces[15] = [12, 2, 4];
  faces.push([1, 12, 4], [1, 2, 12]); // 20,21
  faces[14] = [11, 13, 10];
  faces.push([11, 2, 13]); // 22
  faces[19] = [1, 13, 2];
  faces.push([13, 1, 10]); // 23
  // Invert the geographic-to-polyhedron Euler rotation from the AirOcean preset.
  const radians = Math.PI / 180;
  const rotation = new Matrix4()
    .rotateZ(83.65929 * radians)
    .rotateY(25.44458 * radians)
    .rotateX(87.45184 * radians);
  const geographicVertices = vertices.map(v => Array.from(rotation.transformAsPoint(v)) as Vec3);
  for (const f of faces) {
    if (
      dot(
        cross(
          subtract(geographicVertices[f[1]], geographicVertices[f[0]]),
          subtract(geographicVertices[f[2]], geographicVertices[f[0]])
        ),
        geographicVertices[f[0]]
      ) < 0
    )
      f.reverse();
  }
  const parents = [
    -1, 0, 1, 11, 13, 6, 7, 1, 7, 8, 9, 10, 11, 12, 13, 6, 8, 10, 17, 21, 16, 15, 19, 19
  ];
  return {
    mesh: {vertices: geographicVertices, faces},
    joins: parents.flatMap((parent, face) => (parent < 0 ? [] : [[parent, face]]))
  };
}
