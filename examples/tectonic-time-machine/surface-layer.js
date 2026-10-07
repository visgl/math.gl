// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original deck.gl material adapter. Imports luma.gl waterMaterial; no upstream shader code is copied.
import {SolidPolygonLayer} from '@deck.gl/layers';
import {waterMaterial} from '@luma.gl/shadertools';
const block = `layout(std140) uniform tectonicSurfaceUniforms {
  float isWater;
  float globeWeight;
  float useTexture;
  float regionColors;
  float iceCoverage;
} tectonicSurface;`;
const surface = {
  name: 'tectonicSurface',
  vs: block,
  fs: block + '\nuniform sampler2D terrainTexture;',
  uniformTypes: {isWater: 'f32', globeWeight: 'f32', useTexture: 'f32', regionColors: 'f32', iceCoverage: 'f32'}
};
const LIGHTS = [
  {type: 'ambient', color: [170, 196, 222], intensity: 0.65},
  {type: 'directional', direction: [-0.5, -0.55, -1], color: [255, 244, 224], intensity: 1.25}
];
export class SurfaceLayer extends SolidPolygonLayer {
  static layerName = 'TectonicSurfaceLayer';
  static defaultProps = {
    image: {type: 'image', value: null, async: true},
    getIceLatitude: {type: 'accessor', value: 0},
    getSurfaceNormal: {type: 'accessor', value: [0, 0, 1]},
    getReferencePosition: {type: 'accessor', value: [1, 0, 0]},
    surfaceType: 'land',
    globeWeight: 1,
    regionColors: false,
    iceCoverage: 0
  };
  initializeState(context) {
    super.initializeState(context);
    this.getAttributeManager().add({
      iceLatitudes: {size: 1, stepMode: 'dynamic', accessor: 'getIceLatitude'},
      surfaceNormals: {size: 3, stepMode: 'dynamic', accessor: 'getSurfaceNormal'},
      referencePositions: {size: 3, stepMode: 'dynamic', accessor: 'getReferencePosition'}
    });
    this.setState({
      fallbackTexture: context.device.createTexture({
        width: 1,
        height: 1,
        data: new Uint8Array([147, 156, 105, 255]),
        format: 'rgba8unorm'
      })
    });
  }
  getShaders(type) {
    const shaders = super.getShaders(type);
    return {
      ...shaders,
      modules: [...shaders.modules, waterMaterial, surface],
      inject: {
        'vs:#decl': `in vec3 surfaceNormals; in vec3 referencePositions; in float iceLatitudes;
        out vec3 surfaceNormal; out vec3 referencePosition; out vec3 surfacePosition; out float iceLatitude;`,
        'vs:DECKGL_FILTER_GL_POSITION': `iceLatitude=iceLatitudes;surfaceNormal=surfaceNormals;
        referencePosition=referencePositions;surfacePosition=geometry.worldPosition;`,
        'fs:#decl': `in vec3 surfaceNormal;in vec3 referencePosition;in vec3 surfacePosition;in float iceLatitude;`,
        'fs:DECKGL_FILTER_COLOR': `
        vec3 reference=normalize(referencePosition);
        vec2 uv=vec2(atan(reference.y,reference.x)/6.28318530718+.5,
          .5-asin(clamp(reference.z,-1.,1.))/3.14159265359);
        vec3 normal=mix(vec3(0.,0.,1.),surfaceNormal,tectonicSurface.globeWeight);
        normal=normalize(normal+vec3(0.,0.,.00001));
        vec3 light=normalize(vec3(.5,.55,1.));
        float diffuse=.52+.58*max(dot(normal,light),0.);
        if(tectonicSurface.isWater>.5){
          vec4 water=water_getColorMapped(surfacePosition+vec3(0.,0.,4.),
            surfacePosition,reference,normal,uv);
          vec3 mapSea=vec3(.025,.14,.23);
          color.rgb=mix(mapSea,water.rgb,.35+.65*tectonicSurface.globeWeight);color.a=1.;
        }else{
          vec3 terrain=texture(terrainTexture,uv).rgb;
          // Raster and coastline geometry differ slightly: fill blue raster fringes with coastal earth.
          float waterPixel=smoothstep(.025,.09,terrain.b-max(terrain.r,terrain.g));
          terrain=mix(terrain,vec3(.36,.39,.24),waterPixel);
          vec3 naturalColor=mix(vec3(.36,.42,.28),terrain,tectonicSurface.useTexture);
          color.rgb=mix(naturalColor,color.rgb,tectonicSurface.regionColors)*diffuse;
          float rim=pow(1.-max(normal.z,0.),4.)*tectonicSurface.globeWeight;
          color.rgb=mix(color.rgb,vec3(.24,.5,.66),rim*.22);
        }
        // Latitude follows the rendered world, not a plate's present-day reference position.
        // The ice is an illustrative material overlay, not a climate-model reconstruction.
        float latitude=abs(iceLatitude);
        float edge=1.08-1.16*tectonicSurface.iceCoverage;
        float ice=smoothstep(edge-.06,edge+.06,latitude)*smoothstep(0.,.08,tectonicSurface.iceCoverage);
        float frost=.5+.5*sin(reference.x*67.+sin(reference.y*53.)+reference.z*41.);
        vec3 iceColor=mix(vec3(.64,.82,.91),vec3(.94,.98,1.),frost*.25+.65)*diffuse;
        // Keep coastlines and plate colors readable beneath a translucent ice glaze.
        float glaze=mix(.62,.78,tectonicSurface.isWater);
        color.rgb=mix(color.rgb,iceColor,ice*glaze);

      `
      }
    };
  }
  draw(params) {
    const {image, surfaceType, globeWeight, regionColors, iceCoverage} = this.props;
    this.setShaderModuleProps({
      tectonicSurface: {
        isWater: surfaceType === 'ocean' ? 1 : 0,
        globeWeight,
        iceCoverage,
        useTexture: image ? 1 : 0,
        regionColors: regionColors ? 1 : 0,
        terrainTexture: image || this.state.fallbackTexture
      },
      waterMaterial: {
        time: performance.now() / 1000,
        opacity: 1,
        baseColor: [0.025, 0.15, 0.27],
        fresnelColor: [0.45, 0.7, 0.85],
        fresnelPower: 4,
        specularIntensity: 1.1,
        normalStrength: 0.2,
        coordinateScale: [42, 21],
        waveAAmplitude: 0.016,
        waveBAmplitude: 0.01,
        waveAFrequency: 5,
        waveBFrequency: 8
      },
      lighting: {lights: LIGHTS}
    });
    super.draw(params);
  }
  finalizeState(context) {
    this.state.fallbackTexture?.destroy();
    super.finalizeState(context);
  }
}
