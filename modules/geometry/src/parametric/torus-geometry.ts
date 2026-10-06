// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {assertPositive, type PrimitiveGeometryProps} from '../geometries/geometry-helpers';
import {ParametricGeometry} from './parametric-geometry';
export type TorusGeometryProps = PrimitiveGeometryProps & {
  majorRadius?: number;
  minorRadius?: number;
  majorSegments?: number;
  minorSegments?: number;
  /** Sweep in radians, (0, 2π]. Partial sweeps have open ends. */
  arc?: number;
};
/** Ring torus around Y, with outward analytic normals and separate UV seam rows. */
export class TorusGeometry extends ParametricGeometry {
  constructor(props: TorusGeometryProps = {}) {
    const {
      majorRadius = 1,
      minorRadius = 0.3,
      majorSegments = 48,
      minorSegments = 24,
      arc = Math.PI * 2
    } = props;
    assertPositive(majorRadius, 'majorRadius');
    assertPositive(minorRadius, 'minorRadius');
    if (minorRadius >= majorRadius)
      throw new RangeError('Ring torus requires minorRadius < majorRadius');
    if (!Number.isFinite(arc) || arc <= 0 || arc > Math.PI * 2)
      throw new RangeError('arc must be in (0, 2π]');
    if (majorSegments < 3 || minorSegments < 3)
      throw new RangeError('Torus requires at least three segments per axis');
    super({
      ...props,
      uSegments: majorSegments,
      vSegments: minorSegments,
      periodicU: arc === Math.PI * 2,
      periodicV: true,
      sample: (u, v) => {
        const theta = u * arc,
          phi = v * Math.PI * 2,
          radius = majorRadius + minorRadius * Math.cos(phi);
        return [radius * Math.cos(theta), minorRadius * Math.sin(phi), -radius * Math.sin(theta)];
      },
      normal: (u, v) => [
        Math.cos(v * Math.PI * 2) * Math.cos(u * arc),
        Math.sin(v * Math.PI * 2),
        -Math.cos(v * Math.PI * 2) * Math.sin(u * arc)
      ]
    });
  }
}
