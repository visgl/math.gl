"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["9233"],{80008(t,e,o){o.d(e,{A:()=>A});var i=o(41881),r=o(46487),a=o(84175),n=o(95335),l=o(95263);function s(t,e){if(!t)throw Error(e||"@math.gl/web-mercator: assertion failed.")}let c=Math.PI,p=c/4,u=c/180;function d(t){let[e,o]=t;s(Number.isFinite(e)),s(Number.isFinite(o)&&o>=-90&&o<=90,"invalid latitude");let i=512*(c+Math.log(Math.tan(p+o*u*.5)))/(2*c);return[512*(e*u+c)/(2*c),i]}function g(t,e,o){return Array.isArray(t)||ArrayBuffer.isView(t)&&!(t instanceof DataView)?t.map((t,i)=>g(t,e[i],o)):o*e+(1-o)*t}globalThis.mathgl=globalThis.mathgl||{config:{EPSILON:1e-12,debug:!1,precision:4,printTypes:!1,printDegrees:!1,printRowMajor:!0,_cartographicRadians:!1}},globalThis.mathgl.config;let v=new Uint32Array([0,2,1,0,3,2]),f=new Float32Array([0,1,0,0,1,0,1,1]),m=`\
layout(std140) uniform bitmapUniforms {
  vec4 bounds;
  float coordinateConversion;
  float desaturate;
  vec3 tintColor;
  vec4 transparentColor;
} bitmap;
`,b={name:"bitmap",source:`
struct BitmapUniforms {
  bounds: vec4<f32>,
  coordinateConversion: f32,
  desaturate: f32,
  tintColor: vec3<f32>,
  transparentColor: vec4<f32>,
};

@group(0) @binding(auto) var<uniform> bitmap: BitmapUniforms;
@group(0) @binding(auto) var bitmapTexture: texture_2d<f32>;
@group(0) @binding(auto) var bitmapTextureSampler: sampler;
`,vs:m,fs:m,uniformTypes:{bounds:"vec4<f32>",coordinateConversion:"f32",desaturate:"f32",tintColor:"vec3<f32>",transparentColor:"vec4<f32>"}},h=`\
struct Attributes {
  @location(0) positions: vec3<f32>,
  @location(1) positions64Low: vec3<f32>,
  @location(2) texCoords: vec2<f32>,
};

struct Varyings {
  @builtin(position) position: vec4<f32>,
  @location(0) vTexCoord: vec2<f32>,
  @location(1) vTexPos: vec2<f32>,
  @location(2) pickingColor: vec3<f32>,
  @location(3) pickingDepth: f32,
};

// from degrees to Web Mercator
fn lnglat_to_mercator(lnglat: vec2<f32>) -> vec2<f32> {
  let x = lnglat.x;
  let y = clamp(lnglat.y, -89.9, 89.9);
  return vec2<f32>(
    radians(x) + PI,
    PI + log(tan(PI * 0.25 + radians(y) * 0.5))
  ) * WORLD_SCALE;
}

// from Web Mercator to degrees
fn mercator_to_lnglat(xy: vec2<f32>) -> vec2<f32> {
  let position = xy / WORLD_SCALE;
  return degrees(vec2<f32>(
    position.x - PI,
    atan(exp(position.y - PI)) * 2.0 - PI * 0.5
  ));
}

fn color_desaturate(colorValue: vec3<f32>) -> vec3<f32> {
  let luminance = (colorValue.r + colorValue.g + colorValue.b) * 0.333333333;
  return mix(colorValue, vec3<f32>(luminance), bitmap.desaturate);
}

fn color_tint(colorValue: vec3<f32>) -> vec3<f32> {
  return colorValue * bitmap.tintColor;
}

fn apply_opacity(colorValue: vec3<f32>, alpha: f32) -> vec4<f32> {
  if (bitmap.transparentColor.a == 0.0) {
    return vec4<f32>(colorValue, alpha);
  }
  let blendedAlpha = alpha + bitmap.transparentColor.a * (1.0 - alpha);
  let highLightRatio = alpha / blendedAlpha;
  let blendedRGB = mix(bitmap.transparentColor.rgb, colorValue, highLightRatio);
  return vec4<f32>(blendedRGB, blendedAlpha);
}

fn getUV(position: vec2<f32>) -> vec2<f32> {
  return vec2<f32>(
    (position.x - bitmap.bounds[0]) / (bitmap.bounds[2] - bitmap.bounds[0]),
    (position.y - bitmap.bounds[3]) / (bitmap.bounds[1] - bitmap.bounds[3])
  );
}

// Pack the top 12 bits of two normalized floats into three 8-bit values.
fn packUVsIntoRGB(uv: vec2<f32>) -> vec3<f32> {
  let uv8bit = floor(uv * 256.0);
  let uvFraction = fract(uv * 256.0);
  let uvFraction4bit = floor(uvFraction * 16.0);
  let fractions = uvFraction4bit.x + uvFraction4bit.y * 16.0;
  return vec3<f32>(uv8bit, fractions) / 255.0;
}

@vertex
fn vertexMain(attributes: Attributes) -> Varyings {
  var output: Varyings;
  geometry.worldPosition = attributes.positions;
  geometry.uv = attributes.texCoords;
  geometry.pickingColor = picking_getPickingColorFromIndex(0u);

  let projectedPosition = project_position_to_clipspace_and_commonspace(
    attributes.positions,
    attributes.positions64Low,
    vec3<f32>(0.0)
  );
  geometry.position = projectedPosition.commonPosition;
  output.position = projectedPosition.clipPosition;
  output.vTexCoord = attributes.texCoords;
  output.vTexPos = vec2<f32>(0.0);
  output.pickingColor = geometry.pickingColor;
  output.pickingDepth = output.position.z / output.position.w;

  if (bitmap.coordinateConversion < -0.5) {
    output.vTexPos = geometry.position.xy + project.commonOrigin.xy;
  } else if (bitmap.coordinateConversion > 0.5) {
    output.vTexPos = geometry.worldPosition.xy;
  }

  return output;
}

@fragment
fn fragmentMain(input: Varyings) -> @location(0) vec4<f32> {
  var uv = input.vTexCoord;
  if (bitmap.coordinateConversion < -0.5) {
    uv = getUV(mercator_to_lnglat(input.vTexPos));
  } else if (bitmap.coordinateConversion > 0.5) {
    uv = getUV(lnglat_to_mercator(input.vTexPos));
  }

  let bitmapColor = textureSample(bitmapTexture, bitmapTextureSampler, uv);
  var fragColor = apply_opacity(
    color_tint(color_desaturate(bitmapColor.rgb)),
    bitmapColor.a * layer.opacity
  );

  geometry.uv = uv;

  if (picking.isActive > 0.5) {
    if (picking.isAttribute > 0.5) {
      return vec4<f32>(input.pickingDepth, 0.0, 0.0, 1.0);
    }
    return vec4<f32>(packUVsIntoRGB(uv), 1.0);
  }

  if (picking.isHighlightActive > 0.5) {
    let highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
    if (picking_isColorZero(abs(input.pickingColor - highlightedObjectColor))) {
      let highLightAlpha = picking.highlightColor.a;
      let blendedAlpha = highLightAlpha + fragColor.a * (1.0 - highLightAlpha);
      if (blendedAlpha > 0.0) {
        let highLightRatio = highLightAlpha / blendedAlpha;
        fragColor = vec4<f32>(
          mix(fragColor.rgb, picking.highlightColor.rgb, highLightRatio),
          blendedAlpha
        );
      } else {
        fragColor = vec4<f32>(fragColor.rgb, 0.0);
      }
    }
  }

  return deckgl_premultiplied_alpha(fragColor);
}
`,C=`\
#version 300 es
#define SHADER_NAME bitmap-layer-vertex-shader

in vec2 texCoords;
in vec3 positions;
in vec3 positions64Low;

out vec2 vTexCoord;
out vec2 vTexPos;

const vec3 pickingColor = vec3(1.0, 0.0, 0.0);

void main(void) {
  geometry.worldPosition = positions;
  geometry.uv = texCoords;
  geometry.pickingColor = pickingColor;

  gl_Position = project_position_to_clipspace(positions, positions64Low, vec3(0.0), geometry.position);
  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);

  vTexCoord = texCoords;

  if (bitmap.coordinateConversion < -0.5) {
    vTexPos = geometry.position.xy + project.commonOrigin.xy;
  } else if (bitmap.coordinateConversion > 0.5) {
    vTexPos = geometry.worldPosition.xy;
  }

  vec4 color = vec4(0.0);
  DECKGL_FILTER_COLOR(color, geometry);
}
`,y=`
vec3 packUVsIntoRGB(vec2 uv) {
  // Extract the top 8 bits. We want values to be truncated down so we can add a fraction
  vec2 uv8bit = floor(uv * 256.);

  // Calculate the normalized remainders of u and v parts that do not fit into 8 bits
  // Scale and clamp to 0-1 range
  vec2 uvFraction = fract(uv * 256.);
  vec2 uvFraction4bit = floor(uvFraction * 16.);

  // Remainder can be encoded in blue channel, encode as 4 bits for pixel coordinates
  float fractions = uvFraction4bit.x + uvFraction4bit.y * 16.;

  return vec3(uv8bit, fractions) / 255.;
}
`,x=`\
#version 300 es
#define SHADER_NAME bitmap-layer-fragment-shader

#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D bitmapTexture;

in vec2 vTexCoord;
in vec2 vTexPos;

out vec4 fragColor;

/* projection utils */
const float TILE_SIZE = 512.0;
const float PI = 3.1415926536;
const float WORLD_SCALE = TILE_SIZE / PI / 2.0;

// from degrees to Web Mercator
vec2 lnglat_to_mercator(vec2 lnglat) {
  float x = lnglat.x;
  float y = clamp(lnglat.y, -89.9, 89.9);
  return vec2(
    radians(x) + PI,
    PI + log(tan(PI * 0.25 + radians(y) * 0.5))
  ) * WORLD_SCALE;
}

// from Web Mercator to degrees
vec2 mercator_to_lnglat(vec2 xy) {
  xy /= WORLD_SCALE;
  return degrees(vec2(
    xy.x - PI,
    atan(exp(xy.y - PI)) * 2.0 - PI * 0.5
  ));
}
/* End projection utils */

// apply desaturation
vec3 color_desaturate(vec3 color) {
  float luminance = (color.r + color.g + color.b) * 0.333333333;
  return mix(color, vec3(luminance), bitmap.desaturate);
}

// apply tint
vec3 color_tint(vec3 color) {
  return color * bitmap.tintColor;
}

// blend with background color
vec4 apply_opacity(vec3 color, float alpha) {
  if (bitmap.transparentColor.a == 0.0) {
    return vec4(color, alpha);
  }
  float blendedAlpha = alpha + bitmap.transparentColor.a * (1.0 - alpha);
  float highLightRatio = alpha / blendedAlpha;
  vec3 blendedRGB = mix(bitmap.transparentColor.rgb, color, highLightRatio);
  return vec4(blendedRGB, blendedAlpha);
}

vec2 getUV(vec2 pos) {
  return vec2(
    (pos.x - bitmap.bounds[0]) / (bitmap.bounds[2] - bitmap.bounds[0]),
    (pos.y - bitmap.bounds[3]) / (bitmap.bounds[1] - bitmap.bounds[3])
  );
}

${y}

void main(void) {
  vec2 uv = vTexCoord;
  if (bitmap.coordinateConversion < -0.5) {
    vec2 lnglat = mercator_to_lnglat(vTexPos);
    uv = getUV(lnglat);
  } else if (bitmap.coordinateConversion > 0.5) {
    vec2 commonPos = lnglat_to_mercator(vTexPos);
    uv = getUV(commonPos);
  }
  vec4 bitmapColor = texture(bitmapTexture, uv);

  fragColor = apply_opacity(color_tint(color_desaturate(bitmapColor.rgb)), bitmapColor.a * layer.opacity);

  geometry.uv = uv;
  DECKGL_FILTER_COLOR(fragColor, geometry);

  if (bool(picking.isActive) && !bool(picking.isAttribute)) {
    // Since instance information is not used, we can use picking color for pixel index
    fragColor.rgb = packUVsIntoRGB(uv);
  }
}
`;class _ extends i.A{getShaders(){return super.getShaders({vs:C,fs:x,source:h,modules:[r.A,a.A,n.Ay,b]})}initializeState(){this.getAttributeManager().add({indices:{size:1,isIndexed:!0,update:t=>t.value=this.state.mesh.indices,noAlloc:!0},positions:{size:3,type:"float64",fp64:this.use64bitPositions(),update:t=>t.value=this.state.mesh.positions,noAlloc:!0},texCoords:{size:2,update:t=>t.value=this.state.mesh.texCoords,noAlloc:!0}})}updateState({props:t,oldProps:e,changeFlags:o}){let i=this.getAttributeManager();if(o.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),i.invalidateAll()),t.bounds!==e.bounds){let t=this.state.mesh,e=this._createMesh();for(let o in this.state.model.setVertexCount(e.vertexCount),e)t&&t[o]!==e[o]&&i.invalidate(o);this.setState({mesh:e,...this._getCoordinateUniforms()})}else t._imageCoordinateSystem!==e._imageCoordinateSystem&&this.setState(this._getCoordinateUniforms())}getPickingInfo(t){let{image:e}=this.props,o=t.info;if(!o.color||!e)return o.bitmap=null,o;let{width:i,height:r}=e;o.index=0;let a=function(t){let[e,o,i]=t;return[(e+(15&i)/16)/256,(o+(240&i)/256)/256]}(o.color);return o.bitmap={size:{width:i,height:r},uv:a,pixel:[Math.floor(a[0]*i),Math.floor(a[1]*r)]},o}disablePickingIndex(){this.setState({disablePicking:!0})}restorePickingColors(){this.setState({disablePicking:!1})}_updateAutoHighlight(t){super._updateAutoHighlight({...t,color:this.encodePickingColor(0)})}_createMesh(){let{bounds:t}=this.props,e=t;return P(t)&&(e=[[t[0],t[1]],[t[0],t[3]],[t[2],t[3]],[t[2],t[1]]]),function(t,e){if(!e){var o,i,r,a=t;let e=new Float64Array(12);for(let t=0;t<a.length;t++)e[3*t+0]=a[t][0],e[3*t+1]=a[t][1],e[3*t+2]=a[t][2]||0;return{vertexCount:6,positions:e,indices:v,texCoords:f}}let n=Math.max(Math.abs(t[0][0]-t[3][0]),Math.abs(t[1][0]-t[2][0])),l=Math.max(Math.abs(t[1][1]-t[0][1]),Math.abs(t[2][1]-t[3][1])),s=Math.ceil(n/e)+1,c=Math.ceil(l/e)+1,p=(s-1)*(c-1)*6,u=new Uint32Array(p),d=new Float32Array(s*c*2),m=new Float64Array(s*c*3),b=0,h=0;for(let e=0;e<s;e++){let a=e/(s-1);for(let n=0;n<c;n++){let l=n/(c-1),s=(o=t,i=a,r=l,g(g(o[0],o[1],r),g(o[3],o[2],r),i));m[3*b+0]=s[0],m[3*b+1]=s[1],m[3*b+2]=s[2]||0,d[2*b+0]=a,d[2*b+1]=1-l,e>0&&n>0&&(u[h++]=b-c,u[h++]=b-c-1,u[h++]=b-1,u[h++]=b-c,u[h++]=b-1,u[h++]=b),b++}}return{vertexCount:p,positions:m,indices:u,texCoords:d}}(e,this.context.viewport.resolution)}_getModel(){let t="webgpu"===this.context.device.type?this.getAttributeManager().getBufferLayouts({isInstanced:!1}).filter(t=>"indices"!==t.name):this.getAttributeManager().getBufferLayouts();return new l.K(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:t,topology:"triangle-list",isInstanced:!1})}draw(t){let{shaderModuleProps:e}=t,{model:o,coordinateConversion:i,bounds:r,disablePicking:a}=this.state,{image:n,desaturate:l,transparentColor:s,tintColor:c}=this.props;if((!e.picking.isActive||!a)&&n&&o){let t={bitmapTexture:n,bounds:r,coordinateConversion:i,desaturate:l,tintColor:c.slice(0,3).map(t=>t/255),transparentColor:s.map(t=>t/255)};o.shaderInputs.setProps({bitmap:t}),o.draw(this.context.renderPass)}}_getCoordinateUniforms(){let{_imageCoordinateSystem:t}=this.props;if("default"!==t){let{bounds:e}=this.props;if(!P(e))throw Error("_imageCoordinateSystem only supports rectangular bounds");let o=this.context.viewport.resolution?"lnglat":"cartesian";if("lnglat"==(t="lnglat"===t?"lnglat":"cartesian")&&"cartesian"===o)return{coordinateConversion:-1,bounds:e};if("cartesian"===t&&"lnglat"===o){let t=d([e[0],e[1]]),o=d([e[2],e[3]]);return{coordinateConversion:1,bounds:[t[0],t[1],o[0],o[1]]}}}return{coordinateConversion:0,bounds:[0,0,0,0]}}}_.layerName="BitmapLayer",_.defaultProps={image:{type:"image",value:null,async:!0},bounds:{type:"array",value:[1,0,0,1],compare:!0},_imageCoordinateSystem:"default",desaturate:{type:"number",min:0,max:1,value:0},transparentColor:{type:"color",value:[0,0,0,0]},tintColor:{type:"color",value:[255,255,255]},textureParameters:{type:"object",ignore:!0,value:null}};let A=_;function P(t){return Number.isFinite(t[0])}}}]);