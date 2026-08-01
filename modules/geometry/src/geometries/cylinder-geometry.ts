// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {TruncatedConeGeometry, type TruncatedConeGeometryProps} from './truncated-cone-geometry';

export type CylinderGeometryProps = Omit<
  TruncatedConeGeometryProps,
  'topRadius' | 'bottomRadius' | 'topCap' | 'bottomCap' | 'verticalAxis'
> & {
  radiusTop?: number;
  radiusBottom?: number;
};

/** Tessellates the closed, Y-aligned glTF cylinder shape, including tapered cylinders. */
export class CylinderGeometry extends TruncatedConeGeometry {
  constructor(props: CylinderGeometryProps = {}) {
    const {height = 2, radiusTop = 0.5, radiusBottom = 0.5} = props;
    super({
      ...props,
      height,
      topRadius: radiusTop,
      bottomRadius: radiusBottom,
      topCap: true,
      bottomCap: true,
      verticalAxis: 'y'
    });
  }
}

export type ConeGeometryProps = Omit<TruncatedConeGeometryProps, 'topRadius' | 'bottomRadius'> & {
  radius?: number;
};

/** Convenience closed cone with its point at +Y. */
export class ConeGeometry extends TruncatedConeGeometry {
  constructor(props: ConeGeometryProps = {}) {
    const {radius = 0.5, topCap = false, bottomCap = true} = props;
    super({...props, topRadius: 0, bottomRadius: radius, topCap, bottomCap});
  }
}
