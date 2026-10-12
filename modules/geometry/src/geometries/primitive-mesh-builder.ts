// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GeometryProps} from '../lib/geometry';
import {assertSegments, makeIndices, type PrimitiveGeometryProps} from './geometry-helpers';
export const FULL_CIRCLE = Math.PI * 2;
export type Vector = [number, number, number];
export type Vertex = {position: Vector; normal: Vector; textureCoordinates: [number, number]};
export function radial(angle: number, direction = 1): Vector {
  return [Math.cos(angle) * direction, 0, -Math.sin(angle) * direction];
}
export function vertex(
  radius: number,
  height: number,
  angle: number,
  normal: Vector,
  textureCoordinates?: [number, number]
): Vertex {
  return {
    position: [radius * Math.cos(angle), height, -radius * Math.sin(angle)],
    normal,
    textureCoordinates: textureCoordinates ?? [(Math.cos(angle) + 1) / 2, (Math.sin(angle) + 1) / 2]
  };
}
export function validateArc(segments: number, startAngle: number, sweepAngle: number): void {
  assertSegments(segments, 'segments', 3);
  if (!Number.isFinite(startAngle)) throw new Error('startAngle must be finite');
  if (!Number.isFinite(sweepAngle) || sweepAngle <= 0 || sweepAngle > FULL_CIRCLE)
    throw new Error('sweepAngle must be positive and at most 2π');
}
export class PrimitiveMeshBuilder {
  private positions: number[] = [];
  private normals: number[] = [];
  private textureCoordinates: number[] = [];
  private indices: number[] = [];
  private addVertex(current: Vertex): number {
    const index = this.positions.length / 3;
    this.positions.push(...current.position);
    this.normals.push(...current.normal);
    this.textureCoordinates.push(...current.textureCoordinates);
    return index;
  }
  private addTriangle(first: Vertex, second: Vertex, third: Vertex, indices: number[]): void {
    const firstEdge = second.position.map((value, index) => value - first.position[index]);
    const secondEdge = third.position.map((value, index) => value - first.position[index]);
    const cross = [
      firstEdge[1] * secondEdge[2] - firstEdge[2] * secondEdge[1],
      firstEdge[2] * secondEdge[0] - firstEdge[0] * secondEdge[2],
      firstEdge[0] * secondEdge[1] - firstEdge[1] * secondEdge[0]
    ];
    const orientation = cross.reduce(
      (sum, value, index) =>
        sum + value * (first.normal[index] + second.normal[index] + third.normal[index]),
      0
    );
    this.indices.push(...(orientation < 0 ? [indices[0], indices[2], indices[1]] : indices));
  }
  triangle(first: Vertex, second: Vertex, third: Vertex): void {
    this.addTriangle(first, second, third, [
      this.addVertex(first),
      this.addVertex(second),
      this.addVertex(third)
    ]);
  }
  quad(first: Vertex, second: Vertex, third: Vertex, fourth: Vertex): void {
    const indices = [first, second, third, fourth].map(current => this.addVertex(current));
    this.addTriangle(first, second, third, indices.slice(0, 3));
    this.addTriangle(first, third, fourth, [indices[0], indices[2], indices[3]]);
  }
  getProps(props: PrimitiveGeometryProps): GeometryProps {
    return {
      id: props.id,
      topology: 'triangle-list',
      indices: makeIndices(this.positions.length / 3, this.indices),
      attributes: {
        POSITION: {size: 3, value: new Float32Array(this.positions)},
        NORMAL: {size: 3, value: new Float32Array(this.normals)},
        TEXCOORD_0: {size: 2, value: new Float32Array(this.textureCoordinates)},
        ...props.attributes
      }
    };
  }
}
