// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {STATE_MASK_SHADER} from './us-state-mask.js';
import {BitmapLayer} from '@deck.gl/layers';

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
export class DayNightBitmapLayer extends BitmapLayer {
  static layerName = 'DayNightBitmapLayer';
  static defaultProps = {
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
