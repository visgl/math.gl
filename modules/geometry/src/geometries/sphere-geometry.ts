// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Geometry} from '../lib/geometry';
import {assertPositive, assertSegments, type PrimitiveGeometryProps} from './geometry-helpers';
import {makeSurfaceOfRevolution, type ProfileRing} from './surface-of-revolution';

export type SphereGeometryProps = PrimitiveGeometryProps & {
  radius?: number;
  nlat?: number;
  nlong?: number;
};

/** Tessellates the glTF sphere shape. */
export class SphereGeometry extends Geometry {
  constructor(props: SphereGeometryProps = {}) {
    const {radius = 0.5, nlat = 10, nlong = 10} = props;
    assertPositive(radius, 'radius');
    assertSegments(nlat, 'nlat', 2);
    assertSegments(nlong, 'nlong', 3);
    const rings: ProfileRing[] = [];
    for (let latitude = 0; latitude <= nlat; latitude++) {
      const angle = -Math.PI / 2 + (latitude / nlat) * Math.PI;
      const normalRadius = Math.cos(angle);
      const normalY = Math.sin(angle);
      rings.push({radius: radius * normalRadius, y: radius * normalY, normalRadius, normalY});
    }
    const mesh = makeSurfaceOfRevolution(rings, nlong);
    super({
      id: props.id,
      topology: 'triangle-list',
      indices: mesh.indexArray,
      attributes: {
        POSITION: {size: 3, value: new Float32Array(mesh.positions)},
        NORMAL: {size: 3, value: new Float32Array(mesh.normals)},
        TEXCOORD_0: {size: 2, value: new Float32Array(mesh.texCoords)},
        ...props.attributes
      }
    });
  }
}
