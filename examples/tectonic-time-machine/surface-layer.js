// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original deck.gl material adapter. Imports luma.gl waterMaterial; no upstream shader code is copied.
import {SolidPolygonLayer} from '@deck.gl/layers';
import {waterMaterial} from '@luma.gl/shadertools';
import {thermalPulse} from './planetary-history.js';
const block = `layout(std140) uniform tectonicSurfaceUniforms {
  float isWater;
  float globeWeight;
  float useTexture;
  float imageryBlend;
  vec3 terrainLowColor;
  vec3 terrainMidColor;
  vec3 terrainHighColor;
  float regionColors;
  float iceCoverage;
  float iceRetreat;
  float iceVolcanism;
  float microbialLife;
  float vegetation;
  float paleoBlend;
  float paleoTerrain;
  vec2 paleoSizeA;
  vec2 paleoSizeB;
  float earlyEarth;
  float earlyLava;
  float earlyBombardment;
  float earlyWater;
  float earlySteam;
  float earlyRain;
  float earlyImpactTime;
  float earlyTheia;
  float earlyOpacity;
  float earlyPulse;
} tectonicSurface;`;
const surface = {
  name: 'tectonicSurface',
  vs: block,
  fs: block + '\nuniform sampler2D terrainTexture; uniform sampler2D paleoElevationA; uniform sampler2D paleoElevationB;',
  uniformTypes: {isWater: 'f32', globeWeight: 'f32', useTexture: 'f32', imageryBlend: 'f32', terrainLowColor: 'vec3<f32>', terrainMidColor: 'vec3<f32>', terrainHighColor: 'vec3<f32>', regionColors: 'f32', iceCoverage: 'f32', iceRetreat: 'f32', iceVolcanism: 'f32', microbialLife: 'f32', vegetation: 'f32', paleoBlend: 'f32', paleoTerrain: 'f32', paleoSizeA: 'vec2<f32>', paleoSizeB: 'vec2<f32>', earlyEarth: 'f32', earlyLava: 'f32', earlyBombardment: 'f32', earlyWater: 'f32', earlySteam: 'f32', earlyRain: 'f32', earlyImpactTime: 'f32', earlyTheia: 'f32', earlyOpacity: 'f32', earlyPulse: 'f32'}
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
    earlyEarth: false,
    earlyLava: 0,
    earlyBombardment: 0,
    earlyWater: 0,
    earlySteam: 0,
    earlyRain: 0,
    earlyImpactTime: 0,
    earlyTheia: 0,
    earlyOpacity: 1,
    textureWeight: 1,
    imageryBlend: 0,
    terrainLowColor: [.28,.38,.19],
    terrainMidColor: [.59,.48,.32],
    terrainHighColor: [.73,.70,.63],
    surfaceType: 'land',
    globeWeight: 1,
    regionColors: false,
    vegetation: 1,
    iceRetreat: 0,
    iceVolcanism: 0,
    microbialLife: 0,
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
        if(tectonicSurface.earlyEarth>.5) {
          // Original procedural art. Sphere-space noise follows camera rotation and
          // every projection; neither these lakes nor impact sites are observations.
          vec3 p=normalize(geographicPosition);
          float broad=.7*tectonicIceDetail(p,5.)+.3*tectonicIceDetail(p,13.);
          float rock=.6*tectonicIceDetail(p,22.)+.3*tectonicIceDetail(p,65.)+.1*tectonicIceDetail(p,160.);
          float relief=.003*rock;
          float lakes=smoothstep(.59,.73,broad);
          float cracks=1.-smoothstep(.007,.022,abs(tectonicIceDetail(p,40.)-.5));
          float lava=tectonicSurface.earlyLava*(lakes+.1*cracks*lakes);
          float flow=.65+.35*tectonicIceDetail(p+vec3(0.,0.,tectonicSurface.earlyImpactTime*.008),85.);
          vec3 emission=lava*mix(vec3(.7,.025,.001),vec3(4.,1.4,.12),lakes*flow);
          emission+=tectonicSurface.earlyLava*smoothstep(.52,.64,broad)*vec3(.14,.016,.001);
          // Localized strikes, molten pools and cooling crater rings. The age-based
          // clock is deterministic: scrubbing reproduces a pose, Stop freezes it.
          for(int i=0;i<4;i++) {
            float id=floor(tectonicSurface.earlyImpactTime)-float(i);
            float elapsed=fract(tectonicSurface.earlyImpactTime)+float(i);
            float z=2.*tectonicIceHash(vec3(id,7.,11.))-1.;
            float angle=6.2831853*tectonicIceHash(vec3(id,19.,3.));
            vec3 site=vec3(sqrt(max(0.,1.-z*z))*cos(angle),sqrt(max(0.,1.-z*z))*sin(angle),z);
            float distance=length(p-site);
            float core=1.-smoothstep(.025,.085,distance);
            float ring=exp(-pow((distance-.045-.07*elapsed)/.014,2.));
            float intensity=tectonicSurface.earlyBombardment;
            relief-=intensity*.002*core*exp(-elapsed*.4);
            emission+=intensity*(core*exp(-elapsed*9.)*vec3(7.,2.5,.35)
              +core*exp(-elapsed*.85)*vec3(1.7,.18,.004)
              +ring*exp(-elapsed*2.)*vec3(1.4,.3,.012));
          }
          vec3 rockyNormal=tectonicSurfaceNormal(normal,relief);
          float illumination=.18+.95*max(dot(rockyNormal,light),0.);
          vec3 basalt=mix(vec3(.027,.025,.024),vec3(.14,.125,.11),rock);
          float seaLevel=mix(.20,.65,tectonicSurface.earlyWater);
          float sea=tectonicSurface.earlyWater*(1.-smoothstep(seaLevel-.07,seaLevel+.07,broad));
          vec3 oceanColor=water_getColorMapped(surfacePosition+vec3(0.,0.,4.),
            surfacePosition,p,normal,uv).rgb;
          // Synthetic tidal shallows carry muted ochre/teal microbial mats.
          float shore=1.-smoothstep(.025,.085,abs(broad-seaLevel));
          float mats=shore*tectonicSurface.microbialLife*smoothstep(.3,.65,rock);
          vec3 microbial=mix(vec3(.18,.12,.045),vec3(.07,.23,.19),rock);
          vec3 ground=mix(basalt*illumination,oceanColor,sea);
          ground=mix(ground,microbial*illumination,mats*.8);
          // Linear emissive radiance above display white, mapped back to SDR.
          // Theia briefly lights the entire globe, including its unlit hemisphere.
          vec3 radiance=(ground+emission*(1.-.8*sea))*tectonicSurface.earlyPulse
            +tectonicSurface.earlyTheia*vec3(18.,12.,4.);
          color.rgb=vec3(1.)-exp(-radiance);
          float rim=pow(1.-max(normal.z,0.),5.)*tectonicSurface.globeWeight;
          color.rgb+=vec3(.055,.025,.012)*rim;
          // Drifting steam in geographic sphere space, with falling rain streaks.
          vec3 drift=p+vec3(0.,tectonicSurface.earlyImpactTime*.035,0.);
          float cloud=tectonicIceDetail(drift,7.);
          float vapor=tectonicSurface.earlySteam*(.35+.5*cloud);
          vec3 steamColor=vec3(.57,.60,.63)*(.5+.5*max(dot(normal,light),0.));
          color.rgb=mix(color.rgb,steamColor,vapor);
          vec2 rainUV=vec2(atan(p.y,p.x)*85.,asin(clamp(p.z,-1.,1.))*30.);
          float lane=step(.94,fract(sin(floor(rainUV.x)*127.1)*43758.5));
          float streak=pow(max(0.,sin(rainUV.y+tectonicSurface.earlyImpactTime*25.)),18.);
          color.rgb+=vec3(.22,.30,.36)*lane*streak*tectonicSurface.earlyRain;
          color.a=tectonicSurface.earlyOpacity;
        }else if(tectonicSurface.isWater>.5){
          vec4 water=water_getColorMapped(surfacePosition+vec3(0.,0.,4.),
            surfacePosition,reference,normal,uv);
          vec3 mapSea=vec3(.025,.14,.23);
          color.rgb=mix(mapSea,water.rgb,.35+.65*tectonicSurface.globeWeight);color.a=1.;
        }else{
          vec3 terrain=texture(terrainTexture,uv).rgb;
          // Raster and coastline geometry differ slightly: fill blue raster fringes with coastal earth.
          float waterPixel=smoothstep(.025,.09,terrain.b-max(terrain.r,terrain.g));
          terrain=mix(terrain,tectonicSurface.terrainLowColor,waterPixel);
          vec3 naturalColor=mix(tectonicSurface.terrainLowColor,terrain,tectonicSurface.useTexture);
          // The same fine substrate remains visible through every greening stage.
          float substrate=.65*tectonicIceDetail(reference,55.)+.35*tectonicIceDetail(reference,145.);
          float microRelief=(substrate-.5)*.00035;
          vec3 groundNormal=tectonicSurfaceNormal(normal,microRelief);
          diffuse=.45+.65*max(dot(groundNormal,light),0.);
          if(tectonicSurface.paleoTerrain>.5) {
            vec2 pixel=vec2(degrees(atan(reference.y,reference.x))+180.,
              90.-degrees(asin(clamp(reference.z,-1.,1.))));
            // Missing source edges stay missing; never clamp/extrapolate a pole or seam.
            vec2 size=min(tectonicSurface.paleoSizeA,tectonicSurface.paleoSizeB);
            if(any(lessThan(pixel,vec2(0.))) || any(greaterThan(pixel,size-1.))) discard;
            float height=mix(paleoHeight(paleoElevationA,tectonicSurface.paleoSizeA,pixel),
              paleoHeight(paleoElevationB,tectonicSurface.paleoSizeB,pixel),tectonicSurface.paleoBlend);
            // Hypsometric colors and exaggerated hill shading from source elevation.
            naturalColor=mix(tectonicSurface.terrainLowColor,tectonicSurface.terrainMidColor,smoothstep(0.,1800.,height));
            naturalColor=mix(naturalColor,tectonicSurface.terrainHighColor,smoothstep(1800.,5000.,height));
            vec3 reliefNormal=tectonicSurfaceNormal(normal,height/6371008.8*8.+microRelief);
            diffuse=.45+.65*max(dot(reliefNormal,light),0.);
            // Blend the complete material, including lighting, before the source changes.
            naturalColor=mix(naturalColor,terrain,tectonicSurface.imageryBlend);
            diffuse=mix(diffuse,.45+.65*max(dot(groundNormal,light),0.),tectonicSurface.imageryBlend);
            if(height<0.) discard;
          }
          float luminance=dot(naturalColor,vec3(.2126,.7152,.0722));
          vec3 bareEarth=luminance*vec3(1.14,.98,.81);
          // Continuous color grading keeps texture/relief, with gentle regional variation.
          // The spatial modulation vanishes smoothly at both ends; no texture switch.
          float habitat=tectonicIceDetail(reference,11.);
          float growth=tectonicSurface.vegetation;
          float greening=growth+.45*growth*(1.-growth)*(2.*habitat-1.);
          naturalColor=mix(bareEarth,naturalColor,greening)*(.88+.24*substrate);
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
          // Original cinematic meltwater and sparse volcanic windows, not mapped sites.
          float cracks=1.-smoothstep(.015,.055,abs(field-.5));
          float meltEdge=(1.-smoothstep(.02,.13,abs(latitude-edge)))*tectonicSurface.iceRetreat;
          float pools=smoothstep(.62,.8,hills)*tectonicSurface.iceRetreat;
          iceColor=mix(iceColor,vec3(.025,.24,.33)*illumination,
            min(.8,meltEdge+cracks*pools*.7));
          float vents=land*smoothstep(.78,.9,tectonicIceDetail(reference,18.))*cracks;
          iceColor+=vec3(1.,.19,.015)*vents*tectonicSurface.iceVolcanism;
          // Full ice replaces the base material; relief/albedo preserve continent silhouettes.
          color.rgb=mix(color.rgb,iceColor,ice);
        }

      `
      }
    };
  }
  draw(params) {
    const {image, textureWeight, imageryBlend, terrainLowColor, terrainMidColor, terrainHighColor, surfaceType, globeWeight, regionColors, iceCoverage, iceRetreat, iceVolcanism, microbialLife, vegetation, paleoFrameA, paleoFrameB, paleoBlend, earlyEarth, earlyLava, earlyBombardment, earlyWater, earlySteam, earlyRain, earlyImpactTime, earlyTheia, earlyOpacity} = this.props;
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
        iceCoverage, iceRetreat, iceVolcanism, microbialLife,
        vegetation,
        paleoTerrain: paleoFrameA && paleoFrameB ? 1 : 0,
        paleoBlend,
        earlyEarth: earlyEarth ? 1 : 0,
        earlyPulse: earlyEarth && earlyLava > .01 ? thermalPulse(performance.now()/1000) : 1,
        earlyLava, earlyBombardment, earlyWater, earlySteam, earlyRain, earlyImpactTime, earlyTheia, earlyOpacity,
        paleoSizeA: paleoFrameA?.size || UNIT_SIZE,
        paleoSizeB: paleoFrameB?.size || UNIT_SIZE,
        paleoElevationA: textures.get(paleoFrameA) || this.state.elevationFallback,
        paleoElevationB: textures.get(paleoFrameB) || this.state.elevationFallback,
        useTexture: image ? textureWeight : 0,
        imageryBlend: image ? imageryBlend : 0,
        terrainLowColor, terrainMidColor, terrainHighColor,
        regionColors: regionColors ? 1 : 0,
        terrainTexture: image || this.state.fallbackTexture
      },
      waterMaterial: {
        time: earlyEarth ? earlyImpactTime : performance.now() / 1000,
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
