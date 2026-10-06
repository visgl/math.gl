// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {PrimitiveGeometryProps} from '../geometries/geometry-helpers';
import {ParametricGeometry, normalized} from './parametric-geometry';
export type LatheGeometryProps = PrimitiveGeometryProps & {
  /** Ordered [radius, height] profile, with nonnegative radii. */
  points: readonly (readonly [number, number])[];
  segments?: number;
  phiStart?: number;
  phiLength?: number;
};
/** Revolves a piecewise-linear profile around Y; smooth profile normals, no end caps. */
export class LatheGeometry extends ParametricGeometry {
  constructor(props: LatheGeometryProps) {
    const {points, segments = 48, phiStart = 0, phiLength = Math.PI * 2} = props;
    if (
      !points ||
      points.length < 2 ||
      points.some(p => p.length !== 2 || !p.every(Number.isFinite) || p[0] < 0)
    )
      throw new RangeError('Lathe needs at least two finite [nonnegative radius, height] points');
    if (
      !Number.isFinite(phiStart) ||
      !Number.isFinite(phiLength) ||
      phiLength <= 0 ||
      phiLength > Math.PI * 2
    )
      throw new RangeError('Invalid lathe angular sweep');
    if (segments < 3) throw new RangeError('Lathe requires at least three angular segments');
    const profile = points.map(p => [...p]);
    const edgeNormals = profile.slice(1).map((p, i) => {
      const dr = p[0] - profile[i][0],
        dy = p[1] - profile[i][1];
      if (dr === 0 && dy === 0) throw new RangeError('Consecutive profile points must differ');
      return normalized([dy, -dr, 0]);
    });
    const profileNormals = profile.map((_, i) => {
      const before = edgeNormals[Math.max(0, i - 1)],
        after = edgeNormals[Math.min(i, edgeNormals.length - 1)];
      return normalized(before.map((value, axis) => value + after[axis]));
    });
    const section = (v: number) => {
      const coordinate = v * (profile.length - 1),
        i = Math.min(profile.length - 2, Math.floor(coordinate));
      return {i, t: coordinate - i};
    };
    super({
      ...props,
      uSegments: segments,
      vSegments: profile.length - 1,
      periodicU: phiLength === Math.PI * 2,
      sample: (u, v) => {
        const {i, t} = section(v),
          radius = profile[i][0] * (1 - t) + profile[i + 1][0] * t,
          height = profile[i][1] * (1 - t) + profile[i + 1][1] * t,
          theta = phiStart + u * phiLength;
        return [radius * Math.cos(theta), height, -radius * Math.sin(theta)];
      },
      normal: (u, v) => {
        const {i, t} = section(v),
          n = profileNormals[i].map(
            (value, axis) => value * (1 - t) + profileNormals[i + 1][axis] * t
          ),
          theta = phiStart + u * phiLength;
        return [n[0] * Math.cos(theta), n[1], -n[0] * Math.sin(theta)];
      }
    });
  }
}
