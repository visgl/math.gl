// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {DayNightBitmapLayer} from './day-night-bitmap-layer.js';

export class ProjectedBitmapLayer extends DayNightBitmapLayer {
  static layerName = 'ProjectedBitmapLayer';
  static defaultProps = {mesh: null, wrapLongitude: true};
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
  _createMesh() {
    return this.props.mesh;
  }
  _getCoordinateUniforms() {
    // The mesh already carries geographic texture coordinates.
    return {coordinateConversion: 0, bounds: [0, 0, 0, 0]};
  }
}
