// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {DefaultProps} from '@deck.gl/core';
import type {SurfaceMesh} from './types.ts';
import {DayNightBitmapLayer} from './day-night-bitmap-layer.ts';

export class ProjectedBitmapLayer<ExtraPropsT extends {} = {}> extends DayNightBitmapLayer<
  {mesh?: SurfaceMesh; wrapLongitude?: boolean} & ExtraPropsT
> {
  static layerName = 'ProjectedBitmapLayer';
  static defaultProps: DefaultProps = {wrapLongitude: true};
  getShaders() {
    const shaders = super.getShaders();
    return {
      ...shaders,
      fs: this.props.wrapLongitude
        ? shaders.fs.replace(
            'vec2 uv = vTexCoord;',
            'vec2 uv = vec2(fract(vTexCoord.x), vTexCoord.y);'
          )
        : shaders.fs
    };
  }
  _getCoordinateUniforms() {
    // The mesh already carries geographic texture coordinates.
    return {coordinateConversion: 0, bounds: [0, 0, 0, 0]};
  }
}
