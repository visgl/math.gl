// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {ProjectedBitmapLayer} from './projected-bitmap-layer.js';

const morphUniforms = {
  name: 'surfaceMorph',
  vs: 'layout(std140) uniform surfaceMorphUniforms { float progress; } surfaceMorph;',
  fs: 'layout(std140) uniform surfaceMorphUniforms { float progress; } surfaceMorph;',
  uniformTypes: {progress: 'f32'}
};

/** Upload the adaptive mesh once; animate only the progress uniform. */
export class MorphBitmapLayer extends ProjectedBitmapLayer {
  static layerName = 'MorphBitmapLayer';
  static defaultProps = {progress: 0};
  initializeState() {
    super.initializeState();
    this.getAttributeManager().add({
      destination: {
        size: 3,
        noAlloc: true,
        update: a => {
          a.value = this.props.mesh.destination;
        }
      },
      lifetime: {
        size: 2,
        noAlloc: true,
        update: a => {
          a.value = this.props.mesh.lifetime;
        }
      },
      pieceCenters: {
        size: 4,
        noAlloc: true,
        update: a => {
          a.value = this.props.mesh.pieceCenters;
        }
      },
      pieceAngles: {
        size: 1,
        noAlloc: true,
        update: a => {
          a.value = this.props.mesh.pieceAngles;
        }
      }
    });
  }
  getShaders() {
    const shaders = super.getShaders();
    return {
      ...shaders,
      modules: [...shaders.modules, morphUniforms],
      vs: shaders.vs
        .replace(
          'in vec2 texCoords;',
          'in vec2 texCoords;\nin vec3 destination;\nin vec2 lifetime;\nin vec4 pieceCenters;\nin float pieceAngles;\nout float surfaceVisibility;'
        )
        .replace(
          '  geometry.worldPosition = positions;',
          `
          float t = surfaceMorph.progress;
          float angle = pieceAngles * t;
          mat2 rotation = mat2(cos(angle), sin(angle), -sin(angle), cos(angle));
          vec2 start = rotation * (positions.xy - pieceCenters.xy);
          vec2 xy = mix(start, destination.xy - pieceCenters.zw, t) + mix(pieceCenters.xy, pieceCenters.zw, t);
          vec3 currentPosition = vec3(xy, mix(positions.z, destination.z, t));
          surfaceVisibility = lifetime.x > 0.5 && lifetime.y > 0.5 ? 1.0 :
            lifetime.x > 0.5 ? 1.0 - smoothstep(0.0, 0.35, t) : smoothstep(0.65, 1.0, t);
          geometry.worldPosition = currentPosition;`
        )
        .replace(
          'project_position_to_clipspace(positions, positions64Low,',
          'project_position_to_clipspace(currentPosition, vec3(0.0),'
        ),
      fs: shaders.fs.replace(
        'void main(void) {',
        'void main(void) {\nif (surfaceVisibility < 0.001) discard;'
      ),
      inject: {
        ...shaders.inject,
        'fs:#decl': 'in float surfaceVisibility;',
        'fs:DECKGL_FILTER_COLOR':
          shaders.inject['fs:DECKGL_FILTER_COLOR'] + '\ncolor.a *= surfaceVisibility;'
      }
    };
  }
  draw(options) {
    this.state.model?.shaderInputs.setProps({surfaceMorph: {progress: this.props.progress}});
    super.draw(options);
  }
}
