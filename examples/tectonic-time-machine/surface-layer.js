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
  float vegetation;
  float paleoBlend;
  float paleoTerrain;
  vec2 paleoSizeA;
  vec2 paleoSizeB;
} tectonicSurface;`;
const surface = {
  name: 'tectonicSurface',
  vs: block,
  fs: block + '\nuniform sampler2D terrainTexture; uniform sampler2D paleoElevationA; uniform sampler2D paleoElevationB;',
  uniformTypes: {isWater: 'f32', globeWeight: 'f32', useTexture: 'f32', regionColors: 'f32', iceCoverage: 'f32', vegetation: 'f32', paleoBlend: 'f32', paleoTerrain: 'f32', paleoSizeA: 'vec2<f32>', paleoSizeB: 'vec2<f32>'}
};
const UNIT_SIZE = new Float32Array([1, 1]);
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
    getGeographicPosition: {type: 'accessor', value: [1, 0, 0]},
    paleoFrameA: {type: 'object', value: null},
    paleoFrameB: {type: 'object', value: null},
    paleoBlend: 0,
    surfaceType: 'land',
    globeWeight: 1,
    regionColors: false,
    vegetation: 1,
    iceCoverage: 0
  };
  initializeState(context) {
    super.initializeState(context);
    this.getAttributeManager().add({
      iceLatitudes: {size: 1, stepMode: 'dynamic', accessor: 'getIceLatitude'},
      surfaceNormals: {size: 3, stepMode: 'dynamic', accessor: 'getSurfaceNormal'},
      referencePositions: {size: 3, stepMode: 'dynamic', accessor: 'getReferencePosition'},
      geographicPositions: {size: 3, stepMode: 'dynamic', accessor: 'getGeographicPosition'}
    });
    this.setState({
      elevationTextures: new Map(),
      elevationFrames: [null, null],
      elevationFallback: context.device.createTexture({width: 1, height: 1,
        data: new Float32Array(1), format: 'r32float',
        sampler: {minFilter: 'nearest', magFilter: 'nearest'}}),
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
        'vs:#decl': `in vec3 surfaceNormals; in vec3 referencePositions; in vec3 geographicPositions; in float iceLatitudes;
        out vec3 surfaceNormal; out vec3 referencePosition; out vec3 geographicPosition; out vec3 surfacePosition; out float iceLatitude;`,
        'vs:DECKGL_FILTER_GL_POSITION': `iceLatitude=iceLatitudes;surfaceNormal=surfaceNormals;
        referencePosition=referencePositions;geographicPosition=geographicPositions;surfacePosition=geometry.worldPosition;`,
        'fs:#decl': `in vec3 surfaceNormal;in vec3 referencePosition;in vec3 geographicPosition;in vec3 surfacePosition;in float iceLatitude;
        // Explicit bilinear fetches work without float-linear-filter extensions.
        float paleoHeight(sampler2D image,vec2 size,vec2 pixel) {
          ivec2 a=ivec2(clamp(floor(pixel),vec2(0.),size-1.));
          ivec2 b=min(a+ivec2(1),ivec2(size)-1);
          vec2 f=fract(pixel);
          return mix(mix(texelFetch(image,a,0).r,texelFetch(image,ivec2(b.x,a.y),0).r,f.x),
            mix(texelFetch(image,ivec2(a.x,b.y),0).r,texelFetch(image,b,0).r,f.x),f.y);
        }
        float tectonicIceHash(vec3 p) {
          return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);
        }
        float tectonicIceNoise(vec3 p) {
          vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
          return mix(
            mix(mix(tectonicIceHash(i),tectonicIceHash(i+vec3(1,0,0)),f.x),
                mix(tectonicIceHash(i+vec3(0,1,0)),tectonicIceHash(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(tectonicIceHash(i+vec3(0,0,1)),tectonicIceHash(i+vec3(1,0,1)),f.x),
                mix(tectonicIceHash(i+vec3(0,1,1)),tectonicIceHash(i+vec3(1,1,1)),f.x),f.y),f.z);
        }
        // Filter detail near the pixel scale to keep ice stable during zooms and morphs.
        float tectonicIceDetail(vec3 p,float frequency) {
          float footprint=length(fwidth(p))*frequency;
          return mix(tectonicIceNoise(p*frequency),.5,smoothstep(.35,1.2,footprint));
        }
        vec3 tectonicSurfaceNormal(vec3 normal,float height) {
          vec3 dx=dFdx(surfacePosition),dy=dFdy(surfacePosition);
          vec3 across=cross(dy,normal),along=cross(normal,dx);
          float determinant=dot(dx,across);
          vec3 gradient=sign(determinant)*(dFdx(height)*across+dFdy(height)*along);
          return normalize(abs(determinant)*normal-gradient+normal*1e-12);
        }`,
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
          if(tectonicSurface.paleoTerrain>.5) {
            vec2 pixel=vec2(degrees(atan(reference.y,reference.x))+180.,
              90.-degrees(asin(clamp(reference.z,-1.,1.))));
            // Missing source edges stay missing; never clamp/extrapolate a pole or seam.
            vec2 size=min(tectonicSurface.paleoSizeA,tectonicSurface.paleoSizeB);
            if(any(lessThan(pixel,vec2(0.))) || any(greaterThan(pixel,size-1.))) discard;
            float height=mix(paleoHeight(paleoElevationA,tectonicSurface.paleoSizeA,pixel),
              paleoHeight(paleoElevationB,tectonicSurface.paleoSizeB,pixel),tectonicSurface.paleoBlend);
            // Hypsometric colors and exaggerated hill shading from source elevation.
            naturalColor=mix(vec3(.28,.38,.19),vec3(.59,.48,.32),smoothstep(0.,1800.,height));
            naturalColor=mix(naturalColor,vec3(.73,.70,.63),smoothstep(1800.,5000.,height));
            vec3 reliefNormal=tectonicSurfaceNormal(normal,height/6371008.8*8.);
            diffuse=.45+.65*max(dot(reliefNormal,light),0.);
            if(height<0.) discard;
          }
          float luminance=dot(naturalColor,vec3(.2126,.7152,.0722));
          vec3 bareEarth=luminance*vec3(1.14,.98,.81);
          naturalColor=mix(bareEarth,naturalColor,tectonicSurface.vegetation);
          color.rgb=mix(naturalColor,color.rgb,tectonicSurface.regionColors)*diffuse;
          float rim=pow(1.-max(normal.z,0.),4.)*tectonicSurface.globeWeight;
          color.rgb=mix(color.rgb,vec3(.24,.5,.66),rim*.22);
        }
        // Latitude follows the rendered world, not a plate's present-day reference position.
        // The ice is an illustrative material overlay, not a climate-model reconstruction.
        if(tectonicSurface.iceCoverage>0.) {
          // Land detail stays attached to each plate; ocean detail stays in geographic space.
          float drift=tectonicIceDetail(reference,7.);
          float edgeDrift=tectonicIceDetail(normalize(geographicPosition),7.);
          float grain=tectonicIceDetail(reference,120.);
          float field=tectonicIceDetail(reference,90.);
          float edge=1.08-1.16*tectonicSurface.iceCoverage;
          float latitude=abs(iceLatitude)+(edgeDrift-.5)*.07;
          float ice=smoothstep(edge-.045,edge+.045,latitude)*smoothstep(0.,.08,tectonicSurface.iceCoverage);
          // Original illustrative relief, not elevation data or reconstructed ice thickness.
          // Smooth sea ice contrasts with ridges and shaded valleys on land.
          float land=1.-tectonicSurface.isWater;
          float ridge=1.-abs(2.*field-1.);
          float hills=tectonicIceDetail(reference,14.);
          float terrainDetail=dot(texture(terrainTexture,uv).rgb,vec3(.2126,.7152,.0722));
          float relief=land*(.0007*ridge*ridge+.0006*hills+.00045*terrainDetail*tectonicSurface.useTexture)
            +mix(.00004,.00015,land)*grain;
          vec3 iceNormal=tectonicSurfaceNormal(normal,relief);
          vec3 iceLight=normalize(vec3(-.5,.55,1.));
          float illumination=.30+.70*max(dot(iceNormal,iceLight),0.);
          vec3 seaIce=mix(vec3(.69,.78,.83),vec3(.84,.89,.92),.35+.5*drift);
          vec3 landIce=mix(vec3(.81,.87,.91),vec3(.96,.98,1.),.45+.35*hills);
          vec3 iceColor=mix(seaIce,landIce,land)*illumination;
          iceColor*=1.-land*.13*(1.-ridge)*(1.-hills);
          float sheen=pow(max(dot(reflect(-iceLight,iceNormal),vec3(0.,0.,1.)),0.),18.)*.035;
          iceColor+=vec3(sheen);
          float rim=pow(1.-max(normal.z,0.),5.)*tectonicSurface.globeWeight;
          iceColor=mix(iceColor,vec3(.73,.82,.89),rim*.24);
          // Full ice replaces the base material; relief/albedo preserve continent silhouettes.
          color.rgb=mix(color.rgb,iceColor,ice);
        }

      `
      }
    };
  }
  draw(params) {
    const {image, surfaceType, globeWeight, regionColors, iceCoverage, vegetation, paleoFrameA, paleoFrameB, paleoBlend} = this.props;
    const textures = this.state.elevationTextures;
    const frames = this.state.elevationFrames;
    frames[0] = paleoFrameA; frames[1] = paleoFrameB;
    for (const frame of frames) {
      if (frame && !textures.has(frame)) textures.set(frame, this.context.device.createTexture({
        width: frame.width, height: frame.height, data: frame.elevation, format: 'r32float',
        sampler: {minFilter: 'nearest', magFilter: 'nearest'}
      }));
    }
    for (const [frame, texture] of textures) {
      if (frame !== paleoFrameA && frame !== paleoFrameB) {texture.destroy(); textures.delete(frame);}
    }
    this.setShaderModuleProps({
      tectonicSurface: {
        isWater: surfaceType === 'ocean' ? 1 : 0,
        globeWeight,
        iceCoverage,
        vegetation,
        paleoTerrain: paleoFrameA && paleoFrameB ? 1 : 0,
        paleoBlend,
        paleoSizeA: paleoFrameA?.size || UNIT_SIZE,
        paleoSizeB: paleoFrameB?.size || UNIT_SIZE,
        paleoElevationA: textures.get(paleoFrameA) || this.state.elevationFallback,
        paleoElevationB: textures.get(paleoFrameB) || this.state.elevationFallback,
        useTexture: image && !paleoFrameA ? 1 : 0,
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
    this.state.elevationFallback?.destroy();
    for (const texture of this.state.elevationTextures.values()) texture.destroy();
    super.finalizeState(context);
  }
}
