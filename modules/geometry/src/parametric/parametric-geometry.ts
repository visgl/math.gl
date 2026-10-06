// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {Geometry} from '../lib/geometry';
import {assertSegments, type PrimitiveGeometryProps} from '../geometries/geometry-helpers';

export type SurfaceSampler = (u: number, v: number) => Readonly<ArrayLike<number>>;
export type ParametricGeometryProps = PrimitiveGeometryProps & {
  /** Samples the normalized [0,1]² parameter domain. */
  sample: SurfaceSampler;
  /** Optional analytic normals; otherwise estimated from neighboring samples. */
  normal?: SurfaceSampler;
  uSegments?: number;
  vSegments?: number;
  /** Closed axes duplicate their first position/normal at UV 1. */
  periodicU?: boolean;
  periodicV?: boolean;
};

/** Indexed surface grid. Front faces and normals follow ∂P/∂u × ∂P/∂v. */
export class ParametricGeometry extends Geometry {
  constructor(props: ParametricGeometryProps) {
    const {
      sample,
      normal,
      uSegments = 32,
      vSegments = 32,
      periodicU = false,
      periodicV = false
    } = props;
    assertSegments(uSegments, 'uSegments');
    assertSegments(vSegments, 'vSegments');
    const count = (uSegments + 1) * (vSegments + 1);
    const indexCount = uSegments * vSegments * 6;
    if (!Number.isSafeInteger(indexCount) || indexCount > 0xffffffff)
      throw new RangeError('Surface exceeds 32-bit index-buffer length');
    if (!Number.isSafeInteger(count) || count > 0xffffffff)
      throw new RangeError('Surface exceeds 32-bit indexing');
    const positions = new Float32Array(count * 3),
      normals = new Float32Array(count * 3),
      uvs = new Float32Array(count * 2);
    const canonical = (value: number, periodic: boolean) =>
      periodic ? ((value % 1) + 1) % 1 : Math.max(0, Math.min(1, value));
    const evaluate = (u: number, v: number) =>
      readVector(sample(canonical(u, periodicU), canonical(v, periodicV)));
    // A small finite-difference step estimates smooth-surface normals independently
    // of tessellation density. Open boundaries use one-sided differences.
    const step = 1e-5;
    let row = 0;
    for (let j = 0; j <= vSegments; j++)
      for (let i = 0; i <= uSegments; i++, row++) {
        const u = i / uSegments,
          v = j / vSegments;
        const sampleU = canonical(u, periodicU),
          sampleV = canonical(v, periodicV);
        positions.set(evaluate(sampleU, sampleV), row * 3);
        let n: number[];
        if (normal) n = readVector(normal(sampleU, sampleV));
        else {
          const left = evaluate(sampleU - step, sampleV),
            right = evaluate(sampleU + step, sampleV);
          const below = evaluate(sampleU, sampleV - step),
            above = evaluate(sampleU, sampleV + step);
          const du = normalized(right.map((value, axis) => value - left[axis]));
          const dv = normalized(above.map((value, axis) => value - below[axis]));
          n = [
            du[1] * dv[2] - du[2] * dv[1],
            du[2] * dv[0] - du[0] * dv[2],
            du[0] * dv[1] - du[1] * dv[0]
          ];
        }
        normals.set(normalized(n), row * 3);
        uvs.set([u, v], row * 2);
      }
    for (const value of positions)
      if (!Number.isFinite(value))
        throw new RangeError('Positions must be representable as Float32');
    const indices = count > 0xffff ? new Uint32Array(indexCount) : new Uint16Array(indexCount);
    const stride = uSegments + 1;
    let cursor = 0;
    for (let j = 0; j < vSegments; j++)
      for (let i = 0; i < uSegments; i++) {
        const a = j * stride + i,
          b = a + 1,
          c = a + stride,
          d = c + 1;
        indices[cursor++] = a;
        indices[cursor++] = b;
        indices[cursor++] = d;
        indices[cursor++] = a;
        indices[cursor++] = d;
        indices[cursor++] = c;
      }
    super({
      id: props.id,
      topology: 'triangle-list',
      indices,
      attributes: {
        POSITION: {size: 3, value: positions},
        NORMAL: {size: 3, value: normals},
        TEXCOORD_0: {size: 2, value: uvs},
        ...props.attributes
      }
    });
  }
}
function readVector(value: Readonly<ArrayLike<number>>): number[] {
  if (!value || value.length !== 3 || !Array.from(value).every(Number.isFinite))
    throw new RangeError('Surface samples and normals must be finite triples');
  return Array.from(value);
}
export function normalized(vector: number[]): number[] {
  const scale = Math.max(...vector.map(Math.abs));
  if (!scale) return [0, 0, 0];
  const scaled = vector.map(value => value / scale),
    length = Math.hypot(...scaled);
  return scaled.map(value => (value === 0 ? 0 : value / length));
}
