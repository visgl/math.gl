// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {DefaultProps, TextureSource} from '@deck.gl/core';
import type {Texture} from '@luma.gl/core';
import {BitmapLayer} from '@deck.gl/layers';
import {STATE_MASK_SHADER} from './us-state-mask.ts';
import type {SurfaceMesh} from './types.ts';

export type DayNightProps = {
  nightImage?: string | TextureSource;
  sunDirection?: number[];
  altitude?: number;
  feather?: number;
  usaClip?: number;
  usaMask?: Texture;
};

const solar = {
  name: 'solar',
  fs: `uniform sampler2D nightTexture;
    uniform sampler2D usaMaskTexture;
    layout(std140) uniform solarUniforms {
      vec3 sunDirection;
      float threshold;
      float fadeThreshold;
      float geographic;
      vec4 bounds;
      float usaClip;
    } solar;
    ${STATE_MASK_SHADER}`,
  uniformTypes: {
    sunDirection: 'vec3<f32>',
    threshold: 'f32',
    fadeThreshold: 'f32',
    geographic: 'f32',
    bounds: 'vec4<f32>',
    usaClip: 'f32'
  }
};

/** Blend paired day/night imagery once, without overlapping translucent tile masks. */
export class DayNightBitmapLayer<ExtraPropsT extends {} = {}> extends BitmapLayer<
  DayNightProps & ExtraPropsT
> {
  static layerName = 'DayNightBitmapLayer';
  static defaultProps: DefaultProps = {
    nightImage: {type: 'image', value: null, async: true},
    sunDirection: [1, 0, 0],
    altitude: 0,
    feather: 6,
    usaClip: 0,
    usaMask: {type: 'object', value: null, compare: false}
  };

  getShaders() {
    const shaders = super.getShaders();
    return {
      ...shaders,
      modules: [...shaders.modules, solar],
      inject: {
        ...shaders.inject,
        'fs:DECKGL_FILTER_COLOR': `
          const float SOLAR_PI = 3.141592653589793;
          // BitmapLayer corrects geometry.uv for the image's projection first.
          float longitude = radians(mix(solar.bounds.x, solar.bounds.z, geometry.uv.x));
          float latitude;
          if (solar.geographic > 0.5) {
            latitude = radians(mix(solar.bounds.w, solar.bounds.y, geometry.uv.y));
          } else {
            float south = log(tan(SOLAR_PI * 0.25 + radians(solar.bounds.y) * 0.5));
            float north = log(tan(SOLAR_PI * 0.25 + radians(solar.bounds.w) * 0.5));
            latitude = 2.0 * atan(exp(mix(north, south, geometry.uv.y))) - SOLAR_PI * 0.5;
          }
          vec3 normal = vec3(cos(latitude) * cos(longitude), cos(latitude) * sin(longitude), sin(latitude));
          float light = dot(normal, solar.sunDirection);
          float darkness = 1.0 - smoothstep(solar.fadeThreshold, solar.threshold, light);
          color.rgb = mix(color.rgb, texture(nightTexture, geometry.uv).rgb, darkness);
          if (solar.usaClip > 0.0) {
            float coverage = stateCoverage(degrees(longitude), degrees(latitude));
            float maskAlpha = mix(1.0, coverage, solar.usaClip);
            if (maskAlpha < 0.005) discard;
            color.a *= maskAlpha;
          }
        `
      }
    };
  }

  draw(options) {
    const {sunDirection, altitude, feather, bounds, nightImage, _imageCoordinateSystem} =
      this.props;
    // Never reveal a day-only detail tile over the night overview while its pair loads.
    if (!nightImage) return;
    this.state.model?.shaderInputs.setProps({
      solar: {
        sunDirection,
        threshold: Math.sin((altitude * Math.PI) / 180),
        fadeThreshold: Math.sin(((altitude - feather) * Math.PI) / 180),
        geographic: _imageCoordinateSystem === 'lnglat' ? 1 : 0,
        bounds,
        nightTexture: nightImage,
        usaMaskTexture: this.props.usaMask || nightImage,
        usaClip: this.props.usaClip
      }
    });
    super.draw(options);
  }
}

export class ProjectedBitmapLayer<ExtraPropsT extends {} = {}> extends DayNightBitmapLayer<
  {mesh?: SurfaceMesh; wrapLongitude?: boolean} & ExtraPropsT
> {
  static layerName = 'ProjectedBitmapLayer';
  static defaultProps: DefaultProps = {mesh: null, wrapLongitude: true};
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
    return this.props.mesh as ReturnType<import('@deck.gl/layers').BitmapLayer['_createMesh']>;
  }
  _getCoordinateUniforms() {
    // The mesh already carries geographic texture coordinates.
    return {coordinateConversion: 0, bounds: [0, 0, 0, 0]};
  }
}

const morphUniforms = {
  name: 'surfaceMorph',
  vs: 'layout(std140) uniform surfaceMorphUniforms { float progress; } surfaceMorph;',
  fs: 'layout(std140) uniform surfaceMorphUniforms { float progress; } surfaceMorph;',
  uniformTypes: {progress: 'f32'}
};

/** Upload the adaptive mesh once; animate only the progress uniform. */
export class MorphBitmapLayer extends ProjectedBitmapLayer<{
  progress?: number;
  onDraw?: () => void;
}> {
  static layerName = 'MorphBitmapLayer';
  static defaultProps: DefaultProps = {
    progress: 0,
    onDraw: {type: 'function', value: null, compare: false}
  };
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
    this.props.onDraw?.();
  }
}

const cutRegion = {
  name: 'cutRegion',
  fs: 'layout(std140) uniform cutRegionUniforms { uint parts; } cutRegion;',
  uniformTypes: {parts: 'u32'}
};
/** Keep a coarse inset tile from covering higher-resolution imagery in another cut. */
export class CutBitmapLayer extends ProjectedBitmapLayer<{allowedParts?: number}> {
  static layerName = 'CutBitmapLayer';
  static defaultProps: DefaultProps = {allowedParts: 0xffffffff};
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
