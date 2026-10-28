"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["4699"],{44941(t,i,o){o.d(i,{A:()=>a});var e=o(53439),n=o(23459),l=o(24067),r=o(26839);class a{constructor(t){this.indexStarts=[0],this.vertexStarts=[0],this.vertexCount=0,this.instanceCount=0;let{attributes:i={}}=t;this.typedArrayManager=n.A,this.attributes={},this._attributeDefs=i,this.opts=t,this.updateGeometry(t)}updateGeometry(t){Object.assign(this.opts,t);let{data:i,buffers:o={},getGeometry:e,geometryBuffer:n,positionFormat:r,dataChanged:a,normalize:g=!0}=this.opts;if(this.data=i,this.getGeometry=e,this.positionSize=n&&n.size||("XY"===r?2:3),this.buffers=o,this.normalize=g,n&&((0,l.A)(i.startIndices),this.getGeometry=this.getGeometryFromBuffer(n),g||(o.vertexPositions=n)),this.geometryBuffer=o.vertexPositions,Array.isArray(a))for(let t of a)this._rebuildGeometry(t);else this._rebuildGeometry()}updatePartialGeometry({startRow:t,endRow:i}){this._rebuildGeometry({startRow:t,endRow:i})}getGeometryFromBuffer(t){let i=t.value||t;return ArrayBuffer.isView(i)?(0,e.I)(i,{size:this.positionSize,offset:t.offset,stride:t.stride,startIndices:this.data.startIndices}):null}_allocate(t,i){let{attributes:o,buffers:e,_attributeDefs:n,typedArrayManager:l}=this;for(let r in n)if(r in e)l.release(o[r]),o[r]=null;else{let e=n[r];e.copy=i,o[r]=l.allocate(o[r],t,e)}}_forEachGeometry(t,i,o){let{data:n,getGeometry:l}=this,{iterable:r,objectInfo:a}=(0,e.X)(n,i,o);for(let i of r)a.index++,t(l?l(i,a):null,a.index)}_rebuildGeometry(t){if(!this.data)return;let{indexStarts:i,vertexStarts:o,instanceCount:e}=this,{data:n,geometryBuffer:l}=this,{startRow:a=0,endRow:g=1/0}=t||{},s={};if(t||(i=[0],o=[0]),this.normalize||!l)this._forEachGeometry((t,i)=>{let e=t&&this.normalizeGeometry(t);s[i]=e,o[i+1]=o[i]+(e?this.getGeometrySize(e):0)},a,g),e=o[o.length-1];else if(e=(o=n.startIndices)[n.length]||0,ArrayBuffer.isView(l))e=e||l.length/this.positionSize;else if(l instanceof r.h){let t=4*this.positionSize;e=e||l.byteLength/t}else if(l.buffer){let t=l.stride||4*this.positionSize;e=e||l.buffer.byteLength/t}else if(l.value){let t=l.value,i=l.stride/t.BYTES_PER_ELEMENT||this.positionSize;e=e||t.length/i}this._allocate(e,!!t),this.indexStarts=i,this.vertexStarts=o,this.instanceCount=e;let h={};this._forEachGeometry((t,n)=>{let l=s[n]||t;h.vertexStart=o[n],h.indexStart=i[n],h.geometrySize=(n<o.length-1?o[n+1]:e)-o[n],h.geometryIndex=n,this.updateGeometryAttributes(l,h)},a,g),this.vertexCount=i[i.length-1]}}},98881(t,i,o){o.d(i,{$n:()=>r});Uint32Array.BYTES_PER_ELEMENT,n("colors");let e=n("floatColors");function n(t){return`\
layout(std140) uniform ${t}Uniforms {
  float useByteColors;
} ${t};

vec3 ${t}_normalize(vec3 inputColor) {
  return ${t}.useByteColors > 0.5 ? inputColor / 255.0 : inputColor;
}

vec4 ${t}_normalize(vec4 inputColor) {
  return ${t}.useByteColors > 0.5 ? inputColor / 255.0 : inputColor;
}

vec4 ${t}_premultiplyAlpha(vec4 inputColor) {
  return vec4(inputColor.rgb * inputColor.a, inputColor.a);
}

vec4 ${t}_unpremultiplyAlpha(vec4 inputColor) {
  return inputColor.a > 0.0 ? vec4(inputColor.rgb / inputColor.a, inputColor.a) : vec4(0.0);
}

vec4 ${t}_premultiply_alpha(vec4 inputColor) {
  return ${t}_premultiplyAlpha(inputColor);
}

vec4 ${t}_unpremultiply_alpha(vec4 inputColor) {
  return ${t}_unpremultiplyAlpha(inputColor);
}
`}function l(t){return`\
struct ${t}Uniforms {
  useByteColors: f32
};

@group(0) @binding(auto) var<uniform> ${t} : ${t}Uniforms;

fn ${t}_normalize(inputColor: vec3<f32>) -> vec3<f32> {
  return select(inputColor, inputColor / 255.0, ${t}.useByteColors > 0.5);
}

fn ${t}_normalize4(inputColor: vec4<f32>) -> vec4<f32> {
  return select(inputColor, inputColor / 255.0, ${t}.useByteColors > 0.5);
}

fn ${t}_premultiplyAlpha(inputColor: vec4<f32>) -> vec4<f32> {
  return vec4<f32>(inputColor.rgb * inputColor.a, inputColor.a);
}

fn ${t}_unpremultiplyAlpha(inputColor: vec4<f32>) -> vec4<f32> {
  return select(
    vec4<f32>(0.0),
    vec4<f32>(inputColor.rgb / inputColor.a, inputColor.a),
    inputColor.a > 0.0
  );
}

fn ${t}_premultiply_alpha(inputColor: vec4<f32>) -> vec4<f32> {
  return ${t}_premultiplyAlpha(inputColor);
}

fn ${t}_unpremultiply_alpha(inputColor: vec4<f32>) -> vec4<f32> {
  return ${t}_unpremultiplyAlpha(inputColor);
}
`}l("colors");let r={name:"floatColors",props:{},uniforms:{},vs:e,fs:e,source:l("floatColors"),uniformTypes:{useByteColors:"f32"},defaultUniforms:{useByteColors:!0}}},66925(t,i,o){o.d(i,{x:()=>a});var e=o(29651);let n=`\
precision highp int;

// #if (defined(SHADER_TYPE_FRAGMENT) && defined(LIGHTING_FRAGMENT)) || (defined(SHADER_TYPE_VERTEX) && defined(LIGHTING_VERTEX))
struct AmbientLight {
  vec3 color;
};

struct PointLight {
  vec3 color;
  vec3 position;
  vec3 attenuation; // 2nd order x:Constant-y:Linear-z:Exponential
};

struct SpotLight {
  vec3 color;
  vec3 position;
  vec3 direction;
  vec3 attenuation;
  vec2 coneCos;
};

struct DirectionalLight {
  vec3 color;
  vec3 direction;
};

struct UniformLight {
  vec3 color;
  vec3 position;
  vec3 direction;
  vec3 attenuation;
  vec2 coneCos;
};

layout(std140) uniform lightingUniforms {
  int enabled;
  int directionalLightCount;
  int pointLightCount;
  int spotLightCount;
  vec3 ambientColor;
  UniformLight lights[5];
} lighting;

PointLight lighting_getPointLight(int index) {
  UniformLight light = lighting.lights[index];
  return PointLight(light.color, light.position, light.attenuation);
}

SpotLight lighting_getSpotLight(int index) {
  UniformLight light = lighting.lights[lighting.pointLightCount + index];
  return SpotLight(light.color, light.position, light.direction, light.attenuation, light.coneCos);
}

DirectionalLight lighting_getDirectionalLight(int index) {
  UniformLight light =
    lighting.lights[lighting.pointLightCount + lighting.spotLightCount + index];
  return DirectionalLight(light.color, light.direction);
}

float getPointLightAttenuation(PointLight pointLight, float distance) {
  return pointLight.attenuation.x
       + pointLight.attenuation.y * distance
       + pointLight.attenuation.z * distance * distance;
}

float getSpotLightAttenuation(SpotLight spotLight, vec3 positionWorldspace) {
  vec3 light_direction = normalize(positionWorldspace - spotLight.position);
  float coneFactor = smoothstep(
    spotLight.coneCos.y,
    spotLight.coneCos.x,
    dot(normalize(spotLight.direction), light_direction)
  );
  float distanceAttenuation = getPointLightAttenuation(
    PointLight(spotLight.color, spotLight.position, spotLight.attenuation),
    distance(spotLight.position, positionWorldspace)
  );
  return distanceAttenuation / max(coneFactor, 0.0001);
}

// #endif
`,l=`\
// #if (defined(SHADER_TYPE_FRAGMENT) && defined(LIGHTING_FRAGMENT)) || (defined(SHADER_TYPE_VERTEX) && defined(LIGHTING_VERTEX))
const MAX_LIGHTS: i32 = 5;

struct AmbientLight {
  color: vec3<f32>,
};

struct PointLight {
  color: vec3<f32>,
  position: vec3<f32>,
  attenuation: vec3<f32>, // 2nd order x:Constant-y:Linear-z:Exponential
};

struct SpotLight {
  color: vec3<f32>,
  position: vec3<f32>,
  direction: vec3<f32>,
  attenuation: vec3<f32>,
  coneCos: vec2<f32>,
};

struct DirectionalLight {
  color: vec3<f32>,
  direction: vec3<f32>,
};

struct UniformLight {
  color: vec3<f32>,
  position: vec3<f32>,
  direction: vec3<f32>,
  attenuation: vec3<f32>,
  coneCos: vec2<f32>,
};

struct lightingUniforms {
  enabled: i32,
  directionalLightCount: i32,
  pointLightCount: i32,
  spotLightCount: i32,
  ambientColor: vec3<f32>,
  lights: array<UniformLight, 5>,
};

@group(2) @binding(auto) var<uniform> lighting : lightingUniforms;

fn lighting_getPointLight(index: i32) -> PointLight {
  let light = lighting.lights[index];
  return PointLight(light.color, light.position, light.attenuation);
}

fn lighting_getSpotLight(index: i32) -> SpotLight {
  let light = lighting.lights[lighting.pointLightCount + index];
  return SpotLight(light.color, light.position, light.direction, light.attenuation, light.coneCos);
}

fn lighting_getDirectionalLight(index: i32) -> DirectionalLight {
  let light = lighting.lights[lighting.pointLightCount + lighting.spotLightCount + index];
  return DirectionalLight(light.color, light.direction);
}

fn getPointLightAttenuation(pointLight: PointLight, distance: f32) -> f32 {
  return pointLight.attenuation.x
       + pointLight.attenuation.y * distance
       + pointLight.attenuation.z * distance * distance;
}

fn getSpotLightAttenuation(spotLight: SpotLight, positionWorldspace: vec3<f32>) -> f32 {
  let lightDirection = normalize(positionWorldspace - spotLight.position);
  let coneFactor = smoothstep(
    spotLight.coneCos.y,
    spotLight.coneCos.x,
    dot(normalize(spotLight.direction), lightDirection)
  );
  let distanceAttenuation = getPointLightAttenuation(
    PointLight(spotLight.color, spotLight.position, spotLight.attenuation),
    distance(spotLight.position, positionWorldspace)
  );
  return distanceAttenuation / max(coneFactor, 0.0001);
}
`;var r=o(55611);let a={props:{},uniforms:{},name:"lighting",defines:{},uniformTypes:{enabled:"i32",directionalLightCount:"i32",pointLightCount:"i32",spotLightCount:"i32",ambientColor:"vec3<f32>",lights:[{color:"vec3<f32>",position:"vec3<f32>",direction:"vec3<f32>",attenuation:"vec3<f32>",coneCos:"vec2<f32>"},5]},defaultUniforms:s(),bindingLayout:[{name:"lighting",group:2}],firstBindingSlot:0,source:l,vs:n,fs:n,getUniforms:function(t,i={}){if(!(t=t?{...t}:t))return s();t.lights&&(t={...t,...function(t){let i={pointLights:[],spotLights:[],directionalLights:[]};for(let o of t||[])switch(o.type){case"ambient":i.ambientLight=o;break;case"directional":i.directionalLights?.push(o);break;case"point":i.pointLights?.push(o);break;case"spot":i.spotLights?.push(o)}return i}(t.lights),lights:void 0});let{useByteColors:o,ambientLight:n,pointLights:l,spotLights:r,directionalLights:a}=t||{};if(!(n||l&&l.length>0||r&&r.length>0||a&&a.length>0))return{...s(),enabled:0};let c={...s(),...function({useByteColors:t,ambientLight:i,pointLights:o=[],spotLights:n=[],directionalLights:l=[]}){let r=h(),a=0,s=0,c=0,p=0;for(let i of o){if(a>=5)break;r[a]={...r[a],color:g(i,t),position:i.position,attenuation:i.attenuation||[1,0,0]},a++,s++}for(let i of n){var u;if(a>=5)break;r[a]={...r[a],color:g(i,t),position:i.position,direction:i.direction,attenuation:i.attenuation||[1,0,0],coneCos:[Math.cos((u=i).innerConeAngle??0),Math.cos(u.outerConeAngle??Math.PI/4)]},a++,c++}for(let i of l){if(a>=5)break;r[a]={...r[a],color:g(i,t),direction:i.direction},a++,p++}return o.length+n.length+l.length>5&&e.R.warn("MAX_LIGHTS exceeded, truncating to 5")(),{ambientColor:g(i,t),directionalLightCount:p,pointLightCount:s,spotLightCount:c,lights:r}}({useByteColors:o,ambientLight:n,pointLights:l,spotLights:r,directionalLights:a})};return void 0!==t.enabled&&(c.enabled=+!!t.enabled),c}};function g(t={},i){let{color:o=[0,0,0],intensity:e=1}=t;return(0,r.sC)(o,(0,r.eS)(i,!0)).map(t=>t*e)}function s(){return{enabled:1,directionalLightCount:0,pointLightCount:0,spotLightCount:0,ambientColor:[.1,.1,.1],lights:h()}}function h(){return Array.from({length:5},()=>({color:[1,1,1],position:[1,1,2],direction:[1,1,1],attenuation:[1,0,0],coneCos:[1,0]}))}},38846(t,i,o){o.d(i,{X:()=>e,l:()=>n});let e=`\
layout(std140) uniform phongMaterialUniforms {
  uniform bool unlit;
  uniform float ambient;
  uniform float diffuse;
  uniform float shininess;
  uniform vec3  specularColor;
} material;
`,n=`\
layout(std140) uniform phongMaterialUniforms {
  uniform bool unlit;
  uniform float ambient;
  uniform float diffuse;
  uniform float shininess;
  uniform vec3  specularColor;
} material;

vec3 lighting_getLightColor(vec3 surfaceColor, vec3 light_direction, vec3 view_direction, vec3 normal_worldspace, vec3 color) {
  vec3 halfway_direction = normalize(light_direction + view_direction);
  float lambertian = dot(light_direction, normal_worldspace);
  float specular = 0.0;
  if (lambertian > 0.0) {
    float specular_angle = max(dot(normal_worldspace, halfway_direction), 0.0);
    specular = pow(specular_angle, material.shininess);
  }
  lambertian = max(lambertian, 0.0);
  return (lambertian * material.diffuse * surfaceColor + specular * floatColors_normalize(material.specularColor)) * color;
}

vec3 lighting_getLightColor(vec3 surfaceColor, vec3 cameraPosition, vec3 position_worldspace, vec3 normal_worldspace) {
  vec3 lightColor = surfaceColor;

  if (material.unlit) {
    return surfaceColor;
  }

  if (lighting.enabled == 0) {
    return lightColor;
  }

  vec3 view_direction = normalize(cameraPosition - position_worldspace);
  lightColor = material.ambient * surfaceColor * lighting.ambientColor;

  for (int i = 0; i < lighting.pointLightCount; i++) {
    PointLight pointLight = lighting_getPointLight(i);
    vec3 light_position_worldspace = pointLight.position;
    vec3 light_direction = normalize(light_position_worldspace - position_worldspace);
    float light_attenuation = getPointLightAttenuation(pointLight, distance(light_position_worldspace, position_worldspace));
    lightColor += lighting_getLightColor(surfaceColor, light_direction, view_direction, normal_worldspace, pointLight.color / light_attenuation);
  }

  for (int i = 0; i < lighting.spotLightCount; i++) {
    SpotLight spotLight = lighting_getSpotLight(i);
    vec3 light_position_worldspace = spotLight.position;
    vec3 light_direction = normalize(light_position_worldspace - position_worldspace);
    float light_attenuation = getSpotLightAttenuation(spotLight, position_worldspace);
    lightColor += lighting_getLightColor(surfaceColor, light_direction, view_direction, normal_worldspace, spotLight.color / light_attenuation);
  }

  for (int i = 0; i < lighting.directionalLightCount; i++) {
    DirectionalLight directionalLight = lighting_getDirectionalLight(i);
    lightColor += lighting_getLightColor(surfaceColor, -directionalLight.direction, view_direction, normal_worldspace, directionalLight.color);
  }
  
  return lightColor;
}
`},79439(t,i,o){o.d(i,{X:()=>e});let e=`\
struct phongMaterialUniforms {
  unlit: u32,
  ambient: f32,
  diffuse: f32,
  shininess: f32,
  specularColor: vec3<f32>,
};

@group(3) @binding(auto) var<uniform> phongMaterial : phongMaterialUniforms;

fn lighting_getLightColor(surfaceColor: vec3<f32>, light_direction: vec3<f32>, view_direction: vec3<f32>, normal_worldspace: vec3<f32>, color: vec3<f32>) -> vec3<f32> {
  let halfway_direction: vec3<f32> = normalize(light_direction + view_direction);
  var lambertian: f32 = dot(light_direction, normal_worldspace);
  var specular: f32 = 0.0;
  if (lambertian > 0.0) {
    let specular_angle = max(dot(normal_worldspace, halfway_direction), 0.0);
    specular = pow(specular_angle, phongMaterial.shininess);
  }
  lambertian = max(lambertian, 0.0);
  return (
    lambertian * phongMaterial.diffuse * surfaceColor +
    specular * floatColors_normalize(phongMaterial.specularColor)
  ) * color;
}

fn lighting_getLightColor2(surfaceColor: vec3<f32>, cameraPosition: vec3<f32>, position_worldspace: vec3<f32>, normal_worldspace: vec3<f32>) -> vec3<f32> {
  var lightColor: vec3<f32> = surfaceColor;

  if (phongMaterial.unlit != 0u) {
    return surfaceColor;
  }

  if (lighting.enabled == 0) {
    return lightColor;
  }

  let view_direction: vec3<f32> = normalize(cameraPosition - position_worldspace);
  lightColor = phongMaterial.ambient * surfaceColor * lighting.ambientColor;

  for (var i: i32 = 0; i < lighting.pointLightCount; i++) {
    let pointLight: PointLight = lighting_getPointLight(i);
    let light_position_worldspace: vec3<f32> = pointLight.position;
    let light_direction: vec3<f32> = normalize(light_position_worldspace - position_worldspace);
    let light_attenuation = getPointLightAttenuation(
      pointLight,
      distance(light_position_worldspace, position_worldspace)
    );
    lightColor += lighting_getLightColor(
      surfaceColor,
      light_direction,
      view_direction,
      normal_worldspace,
      pointLight.color / light_attenuation
    );
  }

  for (var i: i32 = 0; i < lighting.spotLightCount; i++) {
    let spotLight: SpotLight = lighting_getSpotLight(i);
    let light_position_worldspace: vec3<f32> = spotLight.position;
    let light_direction: vec3<f32> = normalize(light_position_worldspace - position_worldspace);
    let light_attenuation = getSpotLightAttenuation(spotLight, position_worldspace);
    lightColor += lighting_getLightColor(
      surfaceColor,
      light_direction,
      view_direction,
      normal_worldspace,
      spotLight.color / light_attenuation
    );
  }

  for (var i: i32 = 0; i < lighting.directionalLightCount; i++) {
    let directionalLight: DirectionalLight = lighting_getDirectionalLight(i);
    lightColor += lighting_getLightColor(surfaceColor, -directionalLight.direction, view_direction, normal_worldspace, directionalLight.color);
  }  
  
  return lightColor;
}

fn lighting_getSpecularLightColor(cameraPosition: vec3<f32>, position_worldspace: vec3<f32>, normal_worldspace: vec3<f32>) -> vec3<f32>{
  var lightColor = vec3<f32>(0, 0, 0);
  let surfaceColor = vec3<f32>(0, 0, 0);

  if (lighting.enabled != 0) {
    let view_direction = normalize(cameraPosition - position_worldspace);

    for (var i: i32 = 0; i < lighting.pointLightCount; i++) {
      let pointLight: PointLight = lighting_getPointLight(i);
      let light_position_worldspace: vec3<f32> = pointLight.position;
      let light_direction: vec3<f32> = normalize(light_position_worldspace - position_worldspace);
      let light_attenuation = getPointLightAttenuation(
        pointLight,
        distance(light_position_worldspace, position_worldspace)
      );
      lightColor += lighting_getLightColor(
        surfaceColor,
        light_direction,
        view_direction,
        normal_worldspace,
        pointLight.color / light_attenuation
      );
    }

    for (var i: i32 = 0; i < lighting.spotLightCount; i++) {
      let spotLight: SpotLight = lighting_getSpotLight(i);
      let light_position_worldspace: vec3<f32> = spotLight.position;
      let light_direction: vec3<f32> = normalize(light_position_worldspace - position_worldspace);
      let light_attenuation = getSpotLightAttenuation(spotLight, position_worldspace);
      lightColor += lighting_getLightColor(
        surfaceColor,
        light_direction,
        view_direction,
        normal_worldspace,
        spotLight.color / light_attenuation
      );
    }

    for (var i: i32 = 0; i < lighting.directionalLightCount; i++) {
        let directionalLight: DirectionalLight = lighting_getDirectionalLight(i);
        lightColor += lighting_getLightColor(surfaceColor, -directionalLight.direction, view_direction, normal_worldspace, directionalLight.color);
    }
  }
  return lightColor;
}
`},76046(t,i,o){function e(t,i,o,n,l=[]){let r,a;if(8&o)r=(n[3]-t[1])/(i[1]-t[1]),a=3;else if(4&o)r=(n[1]-t[1])/(i[1]-t[1]),a=1;else if(2&o)r=(n[2]-t[0])/(i[0]-t[0]),a=2;else{if(!(1&o))return null;r=(n[0]-t[0])/(i[0]-t[0]),a=0}for(let o=0;o<t.length;o++)l[o]=(1&a)===o?n[a]:r*(i[o]-t[o])+t[o];return l}function n(t,i){let o=0;return t[0]<i[0]?o|=1:t[0]>i[2]&&(o|=2),t[1]<i[1]?o|=4:t[1]>i[3]&&(o|=8),o}o.d(i,{w:()=>a,M:()=>r});var l=o(76520);function r(t,i){let o,r,{size:a=2,broken:g=!1,gridResolution:h=10,gridOffset:c=[0,0],startIndex:p=0,endIndex:u=t.length}=i||{},f=(u-p)/a,d=[],_=[d],L=(0,l.ah)(t,0,a,p),C=s(L,h,c,[]),v=[];(0,l.VC)(d,L);for(let i=1;i<f;i++){for(r=n(o=(0,l.ah)(t,i,a,p,o),C);r;){var m,y,w;e(L,o,r,C,v);let t=n(v,C);t&&(e(L,v,t,C,v),r=t),(0,l.VC)(d,v),(0,l.C)(L,v),m=C,y=h,8&(w=r)?(m[1]+=y,m[3]+=y):4&w?(m[1]-=y,m[3]-=y):2&w?(m[0]+=y,m[2]+=y):1&w&&(m[0]-=y,m[2]-=y),g&&d.length>a&&(d=[],_.push(d),(0,l.VC)(d,L)),r=n(o,C)}(0,l.VC)(d,o),(0,l.C)(L,o)}return g?_:_[0]}function a(t,i=null,o){if(!t.length)return[];let{size:e=2,gridResolution:l=10,gridOffset:r=[0,0],edgeTypes:c=!1}=o||{},p=[],u=[{pos:t,types:c?Array(t.length/e).fill(1):null,holes:i||[]}],f=[[],[]],d=[];for(;u.length;){let{pos:t,types:i,holes:o}=u.shift();(function(t,i,o,e){let n=1/0,l=-1/0,r=1/0,a=-1/0;for(let e=0;e<o;e+=i){let i=t[e],o=t[e+1];n=i<n?i:n,l=i>l?i:l,r=o<r?o:r,a=o>a?o:a}e[0][0]=n,e[0][1]=r,e[1][0]=l,e[1][1]=a})(t,e,o[0]||t.length,f),d=s(f[0],l,r,d);let a=n(f[1],d);if(a){let n=g(t,i,e,0,o[0]||t.length,d,a),l={pos:n[0].pos,types:n[0].types,holes:[]},r={pos:n[1].pos,types:n[1].types,holes:[]};u.push(l,r);for(let s=0;s<o.length;s++)(n=g(t,i,e,o[s],o[s+1]||t.length,d,a))[0]&&(l.holes.push(l.pos.length),l.pos=h(l.pos,n[0].pos),c&&(l.types=h(l.types,n[0].types))),n[1]&&(r.holes.push(r.pos.length),r.pos=h(r.pos,n[1].pos),c&&(r.types=h(r.types,n[1].types)))}else{let e={positions:t};c&&(e.edgeTypes=i),o.length&&(e.holeIndices=o),p.push(e)}}return p}function g(t,i,o,n,r,a,g){let s,h,c,p=(r-n)/o,u=[],f=[],d=[],_=[],L=[],C=(0,l.ah)(t,p-1,o,n),v=Math.sign(8&g?C[1]-a[3]:C[0]-a[2]),m=i&&i[p-1],y=0,w=0;for(let r=0;r<p;r++)s=(0,l.ah)(t,r,o,n,s),h=Math.sign(8&g?s[1]-a[3]:s[0]-a[2]),c=i&&i[n/o+r],h&&v&&v!==h&&(e(C,s,g,a,L),(0,l.VC)(u,L)&&d.push(m),(0,l.VC)(f,L)&&_.push(m)),h<=0?((0,l.VC)(u,s)&&d.push(c),y-=h):d.length&&(d[d.length-1]=0),h>=0?((0,l.VC)(f,s)&&_.push(c),w+=h):_.length&&(_[_.length-1]=0),(0,l.C)(C,s),v=h,m=c;return[y?{pos:u,types:i&&d}:null,w?{pos:f,types:i&&_}:null]}function s(t,i,o,e){let n=Math.floor((t[0]-o[0])/i)*i+o[0],l=Math.floor((t[1]-o[1])/i)*i+o[1];return e[0]=n,e[1]=l,e[2]=n+i,e[3]=l+i,e}function h(t,i){for(let o=0;o<i.length;o++)t.push(i[o]);return t}},6423(t,i,o){o.d(i,{E:()=>r,I:()=>l});var e=o(76046),n=o(76520);function l(t,i){let{size:o=2,startIndex:n=0,endIndex:l=t.length,normalize:r=!0}=i||{},s=t.slice(n,l);a(s,o,0,l-n);let h=(0,e.M)(s,{size:o,broken:!0,gridResolution:360,gridOffset:[-180,-180]});if(r)for(let t of h)g(t,o);return h}function r(t,i=null,o){let{size:l=2,normalize:s=!0,edgeTypes:h=!1}=o||{};i=i||[];let c=[],p=[],u=0,f=0;for(let e=0;e<=i.length;e++){let r=i[e]||t.length,g=f,s=function(t,i,o,e){let n=-1,l=-1;for(let r=o+1;r<e;r+=i){let i=Math.abs(t[r]);i>n&&(n=i,l=r-1)}return l}(t,l,u,r);for(let i=s;i<r;i++)c[f++]=t[i];for(let i=u;i<s;i++)c[f++]=t[i];a(c,l,g,f),function(t,i,o,e,l=85.051129){let r=t[o],a=t[e-i];if(Math.abs(r-a)>180){let e=(0,n.ah)(t,0,i,o);e[0]+=360*Math.round((a-r)/360),(0,n.VC)(t,e),e[1]=Math.sign(e[1])*l,(0,n.VC)(t,e),e[0]=r,(0,n.VC)(t,e)}}(c,l,g,f,o?.maxLatitude),u=r,p[e]=f}p.pop();let d=(0,e.w)(c,p,{size:l,gridResolution:360,gridOffset:[-180,-180],edgeTypes:h});if(s)for(let t of d)g(t.positions,l);return d}function a(t,i,o,e){let n,l=t[0];for(let r=o;r<e;r+=i){let i=(n=t[r])-l;(i>180||i<-180)&&(n-=360*Math.round(i/360)),t[r]=l=n}}function g(t,i){let o,e=t.length/i;for(let n=0;n<e&&((o=t[n*i])+180)%360==0;n++);let n=-(360*Math.round(o/360));if(0!==n)for(let o=0;o<e;o++)t[o*i]+=n}},76520(t,i,o){function e(t,i){let o=i.length,e=t.length;if(e>0){let n=!0;for(let l=0;l<o;l++)if(t[e-o+l]!==i[l]){n=!1;break}if(n)return!1}for(let n=0;n<o;n++)t[e+n]=i[n];return!0}function n(t,i){let o=i.length;for(let e=0;e<o;e++)t[e]=i[e]}function l(t,i,o,e,n=[]){let r=e+i*o;for(let i=0;i<o;i++)n[i]=t[r+i];return n}o.d(i,{C:()=>n,VC:()=>e,ah:()=>l})}}]);