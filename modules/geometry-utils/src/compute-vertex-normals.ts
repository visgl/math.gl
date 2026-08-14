// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Vector3} from '@math.gl/core';
import {GL} from './constants';
import type {Geometry} from './geometry';
import {getAttributeValues, getPositionAttribute} from './geometry';
import {makePrimitiveIterator} from './primitive-iterator';

/** Computes smooth, area-weighted vertex normals for a triangle geometry. */
export function computeVertexNormals(geometry: Geometry): Float32Array {
  if (
    geometry.mode !== GL.TRIANGLES &&
    geometry.mode !== GL.TRIANGLE_STRIP &&
    geometry.mode !== GL.TRIANGLE_FAN
  ) {
    throw new Error('Triangle geometry is required');
  }

  const position = getPositionAttribute(geometry);
  const positions = getAttributeValues(position);
  const positionSize = position.size || 3;
  if (positionSize < 3) {
    throw new Error('Position attributes must have at least three components');
  }

  const vertexCount = positions.length / positionSize;
  const normals = new Float32Array(vertexCount * 3);
  const vectorA = new Vector3();
  const vectorB = new Vector3();
  const vectorC = new Vector3();
  const edgeCB = new Vector3();
  const edgeAB = new Vector3();

  for (const primitive of makePrimitiveIterator(geometry)) {
    const {i1, i2, i3} = primitive;
    if (i2 === undefined || i3 === undefined) {
      continue;
    }
    vectorA.fromArray(positions, i1 * positionSize);
    vectorB.fromArray(positions, i2 * positionSize);
    vectorC.fromArray(positions, i3 * positionSize);
    const faceNormal = edgeCB
      .subVectors(vectorC, vectorB)
      .cross(edgeAB.subVectors(vectorA, vectorB));

    for (const vertexIndex of [i1, i2, i3]) {
      normals[vertexIndex * 3] += faceNormal.x;
      normals[vertexIndex * 3 + 1] += faceNormal.y;
      normals[vertexIndex * 3 + 2] += faceNormal.z;
    }
  }

  const normal = new Vector3();
  for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++) {
    normal.fromArray(normals, vertexIndex * 3);
    if (normal.magnitudeSquared() > 0) {
      normal.normalize().toArray(normals, vertexIndex * 3);
    }
  }
  return normals;
}
