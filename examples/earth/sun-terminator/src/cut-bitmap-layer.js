// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {ProjectedBitmapLayer} from './projected-bitmap-layer.js';
const cutRegion = {
  name: 'cutRegion',
  fs: 'layout(std140) uniform cutRegionUniforms { uint parts; } cutRegion;',
  uniformTypes: {parts: 'u32'}
};
/** Keep a coarse inset tile from covering higher-resolution imagery in another cut. */
export class CutBitmapLayer extends ProjectedBitmapLayer {
  static layerName = 'CutBitmapLayer';
  static defaultProps = {allowedParts: 0xffffffff};
  initializeState() {
    super.initializeState();
    this.getAttributeManager().add({
      partIds: {
        size: 1,
        noAlloc: true,
        update: attribute => {
          attribute.value = this.props.mesh.partIds;
        }
      }
    });
  }
  getShaders() {
    const shaders = super.getShaders();
    return {
      ...shaders,
      modules: [...shaders.modules, cutRegion],
      vs: shaders.vs
        .replace(
          'in vec2 texCoords;',
          'in vec2 texCoords;\nin float partIds;\nflat out uint cutPartIndex;'
        )
        .replace(
          '  geometry.worldPosition = positions;',
          '  cutPartIndex = uint(partIds);\n  geometry.worldPosition = positions;'
        ),
      fs: shaders.fs.replace(
        'void main(void) {',
        'void main(void) {\nif ((cutRegion.parts & (1u << cutPartIndex)) == 0u) discard;'
      ),
      inject: {...shaders.inject, 'fs:#decl': 'flat in uint cutPartIndex;'}
    };
  }
  draw(options) {
    this.state.model?.shaderInputs.setProps({cutRegion: {parts: this.props.allowedParts}});
    super.draw(options);
  }
}
