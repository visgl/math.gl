// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const surfaceWGSL = `
struct TectonicSurfaceUniforms {
  isWater: f32,
  globeWeight: f32,
  useTexture: f32,
  imageryBlend: f32,
  terrainLowColor: vec3<f32>,
  terrainMidColor: vec3<f32>,
  terrainHighColor: vec3<f32>,
  regionColors: f32,
  iceCoverage: f32,
  iceRetreat: f32,
  iceVolcanism: f32,
  microbialLife: f32,
  vegetation: f32,
  paleoBlend: f32,
  paleoTerrain: f32,
  paleoSizeA: vec2<f32>,
  paleoSizeB: vec2<f32>,
  earlyEarth: f32,
  earlyLava: f32,
  earlyBombardment: f32,
  earlyWater: f32,
  earlySteam: f32,
  earlyRain: f32,
  earlyImpactTime: f32,
  earlyTheia: f32,
  earlyOpacity: f32,
  earlyPulse: f32,
  hdr: f32,
};
@group(3) @binding(auto) var<uniform> tectonicSurface: TectonicSurfaceUniforms;
@group(3) @binding(auto) var terrainTexture: texture_2d<f32>;
@group(3) @binding(auto) var terrainTextureSampler: sampler;
@group(3) @binding(auto) var paleoElevationA: texture_2d<u32>;
@group(3) @binding(auto) var paleoElevationB: texture_2d<u32>;

struct EarlySurface {
  basin: f32,
  rock: f32,
  normal: vec3<f32>,
  emission: vec3<f32>,
};
// Explicit bilinear fetches work without float-linear-filter extensions.
fn paleoHeight(image: texture_2d<u32>, size: vec2<f32>, pixel: vec2<f32>) -> f32 {
  let a = vec2<i32>(clamp(floor(pixel),vec2<f32>(0.0),size-vec2<f32>(1.0)));
  let b = min(a+vec2<i32>(1),vec2<i32>(size)-vec2<i32>(1));
  var f: vec2<f32> = fract(pixel);
  return mix(mix(bitcast<f32>(textureLoad(image,a,0).r),bitcast<f32>(textureLoad(image,vec2<i32>(b.x,a.y),0).r),f.x),
    mix(bitcast<f32>(textureLoad(image,vec2<i32>(a.x,b.y),0).r),bitcast<f32>(textureLoad(image,b,0).r),f.x),f.y);
}
fn tectonicIceHash(p: vec3<f32>) -> f32 {
  return fract(sin(dot(p,vec3<f32>(127.1,311.7,74.7)))*43758.5453);
}
fn tectonicIceNoise(p: vec3<f32>) -> f32 {
  let i = floor(p);
  let fraction = fract(p);
  let f = fraction * fraction * (3.0 - 2.0 * fraction);
  return mix(
    mix(mix(tectonicIceHash(i),tectonicIceHash(i+vec3<f32>(1.0,0,0)),f.x),
        mix(tectonicIceHash(i+vec3<f32>(0.0,1,0)),tectonicIceHash(i+vec3<f32>(1.0,1,0)),f.x),f.y),
    mix(mix(tectonicIceHash(i+vec3<f32>(0.0,0,1)),tectonicIceHash(i+vec3<f32>(1.0,0,1)),f.x),
        mix(tectonicIceHash(i+vec3<f32>(0.0,1,1)),tectonicIceHash(i+vec3<f32>(1.0,1,1)),f.x),f.y),f.z);
}
// Filter detail near the pixel scale to keep ice stable during zooms and morphs.
fn tectonicIceDetail(p: vec3<f32>, frequency: f32) -> f32 {
  let footprint = length(fwidth(p))*frequency;
  return mix(tectonicIceNoise(p*frequency),0.5,smoothstep(0.35,1.2,footprint));
}
fn tectonicReliefNormal(normal: vec3<f32>, position: vec3<f32>, height: f32) -> vec3<f32> {
  let dx = dpdx(position); let dy = dpdy(position);
  let across = cross(dy,normal); let along = cross(normal,dx);
  let determinant = dot(dx,across);
  let gradient = sign(determinant)*(dpdx(height)*across+dpdy(height)*along);
  return normalize(abs(determinant)*normal-gradient+normal*1e-12);
}
fn tectonicSurfaceNormal(normal: vec3<f32>, height: f32, surfacePosition: vec3<f32>) -> vec3<f32> {
  return tectonicReliefNormal(normal,surfacePosition,height);
}

fn fissureCoverage(contour: f32, halfWidth: f32) -> f32 {
  // Filter each signed contour before combining them. A derivative of the
  // absolute distance can cancel when a pixel quad straddles the centerline.
  let pixel = max(fwidth(contour),0.0001);
  let distance = abs(contour);
  let coverage = clamp((halfWidth+0.5*pixel-distance)/pixel,0.0,1.0)
    -clamp((0.5*pixel-halfWidth-distance)/pixel,0.0,1.0);
  return coverage*(1.0-smoothstep(1.0,5.0,pixel/halfWidth));
}

fn crustFlow(p: vec3<f32>) -> vec3<f32> {
  let warp = vec3<f32>(tectonicIceNoise(p*5.0),tectonicIceNoise((p.yzx+vec3<f32>(1.7))*5.0),
           tectonicIceNoise((p.zxy-vec3<f32>(2.1))*5.0))-vec3<f32>(0.5);
  return p+0.19*warp;
}

fn crustPhase(flow: vec3<f32>) -> f32 {
  return dot(flow,vec3<f32>(105.0,-54.0,65.0))+9.0*tectonicIceNoise(flow*17.0);
}

fn earlyEarthSurface(p: vec3<f32>,heat: f32) -> EarlySurface {
  let flow = crustFlow(p);
  let basin = 0.76*tectonicIceNoise(flow*5.0)+0.24*tectonicIceNoise(flow*12.0);

  // Two intersecting contours create connected branches and wider junctions.
  let primary = tectonicIceNoise(flow*13.0)-0.5;
  let secondary = tectonicIceNoise((flow.yzx+vec3<f32>(3.1))*21.0)-0.5;
  let resolved = 1.0-smoothstep(0.009,0.026,length(fwidth(p)));

  let width = mix(0.012,0.034,tectonicIceDetail(flow,8.0));
  let seam = resolved*max(fissureCoverage(primary,width*0.68),
           fissureCoverage(secondary,width*0.45));
  let junction = (1.0-smoothstep(0.026,0.099,length(vec2<f32>(primary,secondary))))
    *smoothstep(0.46,0.62,basin);
  let lake = smoothstep(0.63,0.75,basin);
  let pools = max(lake,junction);
  let molten = max(max(lake,resolved*junction),seam*smoothstep(0.31,0.47,basin));

  // Warp aligned folds by the same slow flow that bends the crust rafts.
  let phase = crustPhase(flow);
  let fold = 0.5+0.5*sin(phase);
  let folds = fold*fold;
  let reliefDetail = 1.0-smoothstep(0.45,2.4,fwidth(phase));
  let rock = clamp(0.13+0.30*basin+0.57*mix(0.375,folds,reliefDetail),0.0,1.0);
  // Sample the phase gradient in sphere space so neighboring pixels do not
  // share a quantized screen-space normal across each derivative quad.
  let axis = select(vec3<f32>(0.0,1.0,0.0),vec3<f32>(0.0,0.0,1.0),abs(p.z)<0.9);
  let tangent = normalize(cross(axis,p));
  let bitangent = cross(p,tangent);
  let stepSize=0.0015;
  let phaseGradient = vec2<f32>(
    crustPhase(crustFlow(normalize(p+stepSize*tangent)))
      -crustPhase(crustFlow(normalize(p-stepSize*tangent))),
    crustPhase(crustFlow(normalize(p+stepSize*bitangent)))
      -crustPhase(crustFlow(normalize(p-stepSize*bitangent)))
  )/(2.0*stepSize);
  let slope = 0.017*reliefDetail*(1.0-0.85*pools)*fold*cos(phase);
  let crustNormal = normalize(p-slope*(phaseGradient.x*tangent+phaseGradient.y*bitangent));
  let seamCore = resolved*max(fissureCoverage(primary,width*0.24),
               fissureCoverage(secondary,width*0.16))
    *smoothstep(0.36,0.52,basin);
  let margins = mix(vec3<f32>(0.19,0.006,0.001),vec3<f32>(1.05,0.22,0.012),molten);
  return EarlySurface(basin, rock, crustNormal, heat*(molten*margins+seamCore*vec3<f32>(6.0,3.2,0.95)));
}

@diagnostic(off, derivative_uniformity)
fn shadeTectonicSurface(
  baseColor: vec4<f32>, surfaceNormal: vec3<f32>, referencePosition: vec3<f32>,
  geographicPosition: vec3<f32>, surfacePosition: vec3<f32>, iceLatitude: f32
) -> vec4<f32> {
  var color = baseColor;

  let reference = normalize(referencePosition);
  let uv = vec2<f32>(atan2(reference.y,reference.x)/6.28318530718+0.5,
    0.5-asin(clamp(reference.z,-1.0,1.0))/3.14159265359);
  var normal: vec3<f32> = mix(vec3<f32>(0.0,0.0,1.0),surfaceNormal,tectonicSurface.globeWeight);
  normal=normalize(normal+vec3<f32>(0.0,0.0,0.00001));
  let light = normalize(vec3<f32>(0.5,0.55,1.0));
  var diffuse: f32 = 0.52+0.58*max(dot(normal,light),0.0);
  if(tectonicSurface.earlyEarth>0.5) {
    let p = normalize(geographicPosition);
    let crust = earlyEarthSurface(p,tectonicSurface.earlyLava);
    let broad = crust.basin;
    let rock = crust.rock;
    var relief: f32 = 0.0;
    let crustNormal = crust.normal;
    var emission = crust.emission;
    // Localized strikes, molten pools and cooling crater rings. The age-based
    // clock is deterministic: scrubbing reproduces a pose, Stop freezes it.
    for(var i: i32 = 0;i<4;i+=1) {
      let id = floor(tectonicSurface.earlyImpactTime)-f32(i);
      let elapsed = fract(tectonicSurface.earlyImpactTime)+f32(i);
      let z = 2.0*tectonicIceHash(vec3<f32>(id,7.0,11.0))-1.0;
      let angle = 6.2831853*tectonicIceHash(vec3<f32>(id,19.0,3.0));
      let site = vec3<f32>(sqrt(max(0.0,1.0-z*z))*cos(angle),sqrt(max(0.0,1.0-z*z))*sin(angle),z);
      let distance = length(p-site);
      let core = 1.0-smoothstep(0.025,0.085,distance);
      let ring = exp(-pow((distance-0.045-0.07*elapsed)/0.014,2.0));
      let intensity = tectonicSurface.earlyBombardment;
      relief-=intensity*0.002*core*exp(-elapsed*0.4);
      emission+=intensity*(core*exp(-elapsed*9.0)*vec3<f32>(7.0,2.5,0.35)
        +core*exp(-elapsed*0.85)*vec3<f32>(1.7,0.18,0.004)
        +ring*exp(-elapsed*2.0)*vec3<f32>(1.4,0.3,0.012));
    }
    let sun = normalize(vec3<f32>(0.16,-0.84,0.52));
    let solarAngle = dot(p,sun);
    let day = mix(1.0,smoothstep(-0.035,0.025,solarAngle),tectonicSurface.globeWeight);
    let rockyNormal = normalize(crustNormal+tectonicReliefNormal(p,p,relief)-p);
    let illumination = mix(0.9,0.008+day*(0.13+2.4*max(dot(rockyNormal,sun),0.0)),tectonicSurface.globeWeight);
    let basalt = mix(vec3<f32>(0.018,0.032,0.052),vec3<f32>(0.22,0.34,0.45),rock);
    let floodLevel = mix(0.65,0.43,smoothstep(0.0,0.3,tectonicSurface.earlyLava));
    let seaLevel = mix(0.20,floodLevel,tectonicSurface.earlyWater);
    let sea = tectonicSurface.earlyWater*(1.0-smoothstep(seaLevel-0.07,seaLevel+0.07,broad));
    let oceanColor = water_getColorMapped(surfacePosition+vec3<f32>(0.0,0.0,4.0),
      surfacePosition,p,normal,uv).rgb*(0.06+0.94*day);
    // Synthetic tidal shallows carry muted ochre/teal microbial mats.
    let shore = 1.0-smoothstep(0.025,0.085,abs(broad-seaLevel));
    let mats = shore*tectonicSurface.microbialLife*smoothstep(0.3,0.65,rock);
    let microbial = mix(vec3<f32>(0.18,0.12,0.045),vec3<f32>(0.07,0.23,0.19),rock);
    var ground = mix(basalt*illumination,oceanColor,sea);
    ground=mix(ground,microbial*illumination,mats*0.8);
    // Preserve radiance above display white on the extended-range canvas.
    // Theia briefly lights the entire globe, including its unlit hemisphere.
    let radiance = (ground+emission*(1.0-0.8*sea))*tectonicSurface.earlyPulse
      +tectonicSurface.earlyTheia*vec3<f32>(18.0,12.0,4.0);
    color=vec4<f32>(select(vec3<f32>(1.0)-exp(-radiance),radiance,tectonicSurface.hdr>0.5),color.a);
    let rim = pow(1.0-max(normal.z,0.0),5.0)*tectonicSurface.globeWeight;
    color=vec4<f32>(color.rgb+vec3<f32>(0.12,0.19,0.29)*rim*smoothstep(-0.08,0.55,solarAngle),color.a);
    // Drifting steam in geographic sphere space, with falling rain streaks.
    let drift = p+vec3<f32>(0.0,tectonicSurface.earlyImpactTime*0.035,0.0);
    let cloud = tectonicIceDetail(drift,7.0);
    let vapor = tectonicSurface.earlySteam*(0.35+0.5*cloud);
    let steamColor = vec3<f32>(0.57,0.60,0.63)*(0.015+0.985*day);
    color=vec4<f32>(mix(color.rgb,steamColor,vapor),color.a);
    let rainUV = vec2<f32>(atan2(p.y,p.x)*85.0,asin(clamp(p.z,-1.0,1.0))*30.0);
    let lane = step(0.94,fract(sin(floor(rainUV.x)*127.1)*43758.5));
    let streak = pow(max(0.0,sin(rainUV.y+tectonicSurface.earlyImpactTime*25.0)),18.0);
    color=vec4<f32>(color.rgb+vec3<f32>(0.22,0.30,0.36)*lane*streak*tectonicSurface.earlyRain*(0.015+0.985*day),color.a);
    color=vec4<f32>(color.rgb,tectonicSurface.earlyOpacity);
  }else if(tectonicSurface.isWater>0.5){
    let water = water_getColorMapped(surfacePosition+vec3<f32>(0.0,0.0,4.0),
      surfacePosition,reference,normal,uv);
    let mapSea = vec3<f32>(0.025,0.14,0.23);
    color = vec4<f32>(mix(mapSea, water.rgb, 0.35 + 0.65 * tectonicSurface.globeWeight), 1.0);
  }else{
    var terrain: vec3<f32> = textureSampleLevel(terrainTexture,terrainTextureSampler,uv,0.0).rgb;
    // Raster and coastline geometry differ slightly: fill blue raster fringes with coastal earth.
    let waterPixel = smoothstep(0.025,0.09,terrain.b-max(terrain.r,terrain.g));
    terrain=mix(terrain,tectonicSurface.terrainLowColor,waterPixel);
    var naturalColor: vec3<f32> = mix(tectonicSurface.terrainLowColor,terrain,tectonicSurface.useTexture);
    // The same fine substrate remains visible through every greening stage.
    let substrate = 0.65*tectonicIceDetail(reference,55.0)+0.35*tectonicIceDetail(reference,145.0);
    let microRelief = (substrate-0.5)*0.00035;
    let groundNormal = tectonicSurfaceNormal(normal,microRelief,surfacePosition);
    diffuse=0.45+0.65*max(dot(groundNormal,light),0.0);
    if(tectonicSurface.paleoTerrain>0.5) {
      let pixel = vec2<f32>(degrees(atan2(reference.y,reference.x))+180.0,
        90.0-degrees(asin(clamp(reference.z,-1.0,1.0))));
      // Missing source edges stay missing; never clamp/extrapolate a pole or seam.
      let size = min(tectonicSurface.paleoSizeA,tectonicSurface.paleoSizeB);
      if(any(pixel < vec2<f32>(0.0)) || any(pixel > size-vec2<f32>(1.0))) { discard; }
      let height = mix(paleoHeight(paleoElevationA,tectonicSurface.paleoSizeA,pixel),
        paleoHeight(paleoElevationB,tectonicSurface.paleoSizeB,pixel),tectonicSurface.paleoBlend);
      // Hypsometric colors and exaggerated hill shading from source elevation.
      naturalColor=mix(tectonicSurface.terrainLowColor,tectonicSurface.terrainMidColor,smoothstep(0.0,1800.0,height));
      naturalColor=mix(naturalColor,tectonicSurface.terrainHighColor,smoothstep(1800.0,5000.0,height));
      let reliefNormal = tectonicSurfaceNormal(normal,height/6371008.8*8.0+microRelief,surfacePosition);
      diffuse=0.45+0.65*max(dot(reliefNormal,light),0.0);
      // Blend the complete material, including lighting, before the source changes.
      naturalColor=mix(naturalColor,terrain,tectonicSurface.imageryBlend);
      diffuse=mix(diffuse,0.45+0.65*max(dot(groundNormal,light),0.0),tectonicSurface.imageryBlend);
      if(height<0.0) { discard; }
    }
    let luminance = dot(naturalColor,vec3<f32>(0.2126,0.7152,0.0722));
    let bareEarth = luminance*vec3<f32>(1.14,0.98,0.81);
    // Continuous color grading keeps texture/relief, with gentle regional variation.
    // The spatial modulation vanishes smoothly at both ends; no texture switch.
    let habitat = tectonicIceDetail(reference,11.0);
    let growth = tectonicSurface.vegetation;
    let greening = growth+0.45*growth*(1.0-growth)*(2.0*habitat-1.0);
    naturalColor=mix(bareEarth,naturalColor,greening)*(0.88+0.24*substrate);
    color=vec4<f32>(mix(naturalColor,color.rgb,tectonicSurface.regionColors)*diffuse,color.a);
    let rim = pow(1.0-max(normal.z,0.0),4.0)*tectonicSurface.globeWeight;
    color=vec4<f32>(mix(color.rgb,vec3<f32>(0.24,0.5,0.66),rim*0.22),color.a);
  }
  // Latitude follows the rendered world, not a plate's present-day reference position.
  // The ice is an illustrative material overlay, not a climate-model reconstruction.
  if(tectonicSurface.iceCoverage>0.0) {
    // Land detail stays attached to each plate; ocean detail stays in geographic space.
    let drift = tectonicIceDetail(reference,7.0);
    let edgeDrift = tectonicIceDetail(normalize(geographicPosition),7.0);
    let grain = tectonicIceDetail(reference,120.0);
    let field = tectonicIceDetail(reference,90.0);
    let edge = 1.08-1.16*tectonicSurface.iceCoverage;
    let latitude = abs(iceLatitude)+(edgeDrift-0.5)*0.07;
    let ice = smoothstep(edge-0.045,edge+0.045,latitude)*smoothstep(0.0,0.08,tectonicSurface.iceCoverage);
    // Original illustrative relief, not elevation data or reconstructed ice thickness.
    // Smooth sea ice contrasts with ridges and shaded valleys on land.
    let land = 1.0-tectonicSurface.isWater;
    let ridge = 1.0-abs(2.0*field-1.0);
    let hills = tectonicIceDetail(reference,14.0);
    let terrainDetail = dot(textureSampleLevel(terrainTexture,terrainTextureSampler,uv,0.0).rgb,vec3<f32>(0.2126,0.7152,0.0722));
    var relief: f32 = land*(0.0007*ridge*ridge+0.0006*hills+0.00045*terrainDetail*tectonicSurface.useTexture)
      +mix(0.00004,0.00015,land)*grain;
    let iceNormal = tectonicSurfaceNormal(normal,relief,surfacePosition);
    let iceLight = normalize(vec3<f32>(-0.5,0.55,1.0));
    let illumination = 0.30+0.70*max(dot(iceNormal,iceLight),0.0);
    let seaIce = mix(vec3<f32>(0.69,0.78,0.83),vec3<f32>(0.84,0.89,0.92),0.35+0.5*drift);
    let landIce = mix(vec3<f32>(0.81,0.87,0.91),vec3<f32>(0.96,0.98,1.0),0.45+0.35*hills);
    var iceColor: vec3<f32> = mix(seaIce,landIce,land)*illumination;
    iceColor*=1.0-land*0.13*(1.0-ridge)*(1.0-hills);
    let sheen = pow(max(dot(reflect(-iceLight,iceNormal),vec3<f32>(0.0,0.0,1.0)),0.0),18.0)*0.035;
    iceColor+=vec3<f32>(sheen);
    let rim = pow(1.0-max(normal.z,0.0),5.0)*tectonicSurface.globeWeight;
    iceColor=mix(iceColor,vec3<f32>(0.73,0.82,0.89),rim*0.24);
    // Original cinematic meltwater and sparse volcanic windows, not mapped sites.
    let cracks = 1.0-smoothstep(0.015,0.055,abs(field-0.5));
    let meltEdge = (1.0-smoothstep(0.02,0.13,abs(latitude-edge)))*tectonicSurface.iceRetreat;
    let pools = smoothstep(0.62,0.8,hills)*tectonicSurface.iceRetreat;
    iceColor=mix(iceColor,vec3<f32>(0.025,0.24,0.33)*illumination,
      min(0.8,meltEdge+cracks*pools*0.7));
    let vents = land*smoothstep(0.78,0.9,tectonicIceDetail(reference,18.0))*cracks;
    iceColor+=vec3<f32>(1.0,0.19,0.015)*vents*tectonicSurface.iceVolcanism;
    // Full ice replaces the base material; relief/albedo preserve continent silhouettes.
    color=vec4<f32>(mix(color.rgb,iceColor,ice),color.a);
  }


  return color;
}
`;

// SurfaceLayer uses filled, unextruded polygons. Reuse deck.gl's projection and
// picking and omit its unused wireframe input to stay within eight vertex buffers.
export function addSurfaceVaryings(source) {
  return source
    .replace('  @location(4) lineColors: vec4<f32>,\n', '')
    .replace(/let colors = select\([\s\S]*?\);/, 'let colors = attributes.fillColors;')
    .replace(
      'struct Attributes {',
      `struct Attributes {
  @location(6) surfaceNormals: vec3<f32>,
  @location(7) referencePositions: vec3<f32>,
  @location(8) geographicPositions: vec3<f32>,
  @location(9) iceLatitudes: f32,`
    )
    .replace(
      'struct Varyings {',
      `struct Varyings {
  @location(2) surfaceNormal: vec3<f32>,
  @location(3) referencePosition: vec3<f32>,
  @location(4) geographicPosition: vec3<f32>,
  @location(5) surfacePosition: vec3<f32>,
  @location(6) iceLatitude: f32,`
    )
    .replace(
      'return outp;',
      `outp.surfaceNormal = attributes.surfaceNormals;
  outp.referencePosition = attributes.referencePositions;
  outp.geographicPosition = attributes.geographicPositions;
  outp.surfacePosition = geometry.worldPosition;
  outp.iceLatitude = attributes.iceLatitudes;
  return outp;`
    )
    .replace(
      '  DECKGL_FILTER_COLOR(&fragColor',
      `  fragColor = shadeTectonicSurface(
    fragColor, inp.surfaceNormal, inp.referencePosition, inp.geographicPosition,
    inp.surfacePosition, inp.iceLatitude
  );
  DECKGL_FILTER_COLOR(&fragColor`
    );
}
