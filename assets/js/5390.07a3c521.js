"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["5390"],{42621(e,t,o){o.d(t,{A:()=>n});var i=o(60616),r=o(21992);function n(e,t,{showTitle:o=!1}={}){let a=t.ownerDocument.createElement("div");a.dataset.panelHost="",a.style.minWidth="0",t.append(a);let s=!1,l=e=>{s||(0,i.XX)(e?(0,i.h)(r.U,{panel:e,key:e.id},[(0,i.h)("section",{style:{display:"flex",flexDirection:"column",gap:"8px"}},[o&&e.title?(0,i.h)("header",{style:{fontSize:"12px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.04em",color:"var(--button-text, rgb(24, 24, 26))"}},e.title):null,(0,i.h)("div",{style:{display:"flex",flexDirection:"column",gap:"8px"}},e.content)])]):null,a)};return l(e),{setPanel:l,finalize:()=>{s||(s=!0,(0,i.XX)(null,a),a.remove())}}}},33865(e,t,o){o.d(t,{A:()=>L});var i=o(10032),r=o(46487),n=o(84175),a=o(83895),s=o(7914),l=o(88599),c=o(88967);function u(e,t,o){return Array.isArray(e)||ArrayBuffer.isView(e)&&!(e instanceof DataView)?e.map((e,i)=>u(e,t[i],o)):o*t+(1-o)*e}globalThis.mathgl=globalThis.mathgl||{config:{EPSILON:1e-12,debug:!1,precision:4,printTypes:!1,printDegrees:!1,printRowMajor:!0,_cartographicRadians:!1}},globalThis.mathgl.config;let p=[.25,.5,.75],g=[[1/3,1/3,1/3],[.5,.25,.25],[.25,.5,.25],[.25,.25,.5]];function f(e,t){return Math.hypot(...e.source.map((e,o)=>e-t.source[o]))}function d(e,t){return e<=t?`${e}:${t}`:`${t}:${e}`}function m(e){return Number.isSafeInteger(e)&&e>0&&e<=0xffffffff}function v(e,t){return e[0].map((o,i)=>e.reduce((e,o,r)=>e+o[i]*t[r],0))}let h=new Uint32Array([0,2,1,0,3,2]),b=new Float32Array([0,1,0,0,1,0,1,1]);function y(e,t,o){return u(u(e[0],e[1],o),u(e[3],e[2],o),t)}var C=o(6053);let x=`\
layout(std140) uniform bitmapUniforms {
  vec4 bounds;
  float coordinateConversion;
  float desaturate;
  vec3 tintColor;
  vec4 transparentColor;
} bitmap;
`,_={name:"bitmap",source:`
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
`,vs:x,fs:x,uniformTypes:{bounds:"vec4<f32>",coordinateConversion:"f32",desaturate:"f32",tintColor:"vec3<f32>",transparentColor:"vec4<f32>"}},A=`\
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

  if (bitmap.coordinateConversion < -0.5) {
    output.vTexPos = geometry.position.xy + project.commonOrigin.xy;
  } else if (bitmap.coordinateConversion > 0.5) {
    output.vTexPos = geometry.worldPosition.xy;
  }

  DECKGL_FILTER_GL_POSITION(&output.position, geometry);
  output.pickingDepth = output.position.z / output.position.w;

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

  fragmentGeometry.uv = geometry.uv;

  if (picking.isActive > 0.5) {
    if (picking.isAttribute > 0.5) {
      var extensionColor = vec4<f32>(input.pickingDepth, 0.0, 0.0, 1.0);
      DECKGL_FILTER_COLOR(&extensionColor, fragmentGeometry);
      // Color filters may discard, but must not alter the picking payload.
      return vec4<f32>(input.pickingDepth, 0.0, 0.0, 1.0);
    }
    var extensionColor = vec4<f32>(packUVsIntoRGB(uv), 1.0);
    DECKGL_FILTER_COLOR(&extensionColor, fragmentGeometry);
    // Color filters may discard, but must not alter the picking payload.
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

  DECKGL_FILTER_COLOR(&fragColor, fragmentGeometry);
  return deckgl_premultiplied_alpha(fragColor);
}
`,w=`\
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
`,T=`
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
`,P=`\
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

${T}

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
`;class I extends i.A{getShaders(){return super.getShaders({vs:w,fs:P,source:A,modules:[r.A,n.A,a.Ay,_]})}initializeState(){this.getAttributeManager().add({indices:{size:1,isIndexed:!0,update:e=>e.value=this.state.mesh.indices,noAlloc:!0},positions:{size:3,type:"float64",fp64:this.use64bitPositions(),...this.usePositionTransforms(),update:function(e){let{positions:t,projectedPositions:o}=this.state.mesh;if(o){e.value=o;return}let{transform:i}=e.settings;if(!i){e.value=t;return}let r=new Float64Array(t.length);for(let e=0;e<t.length;e+=3)r.set(i.call(this,t.subarray(e,e+3)),e);e.value=r},noAlloc:!0},texCoords:{size:2,update:e=>e.value=this.state.mesh.texCoords,noAlloc:!0}})}updateState({props:e,oldProps:t,changeFlags:o}){let i=this.getAttributeManager();o.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),i.invalidateAll());let r=this.getSubdivisionStep();if(e.bounds!==t.bounds||o.projectionChanged||this.state.subdivisionStep!==r||e._projectionTolerance!==t._projectionTolerance||this.state.preproject&&(!(0,s.b)(e.modelMatrix,t.modelMatrix,1)||!(0,s.b)(e.coordinateOrigin,t.coordinateOrigin,1))){let e=this.state.mesh,t=this._createMesh();for(let o in this.state.model.setVertexCount(t.vertexCount),t)e&&e[o]!==t[o]&&i.invalidate(o);this.setState({mesh:t,subdivisionStep:r,...this._getCoordinateUniforms()})}else e._imageCoordinateSystem!==t._imageCoordinateSystem&&this.setState(this._getCoordinateUniforms())}getPickingInfo(e){let{image:t}=this.props,o=e.info;if(!o.color||!t)return o.bitmap=null,o;let{width:i,height:r}=t;o.index=0;let n=function(e){let[t,o,i]=e;return[(t+(15&i)/16)/256,(o+(240&i)/256)/256]}(o.color);return o.bitmap={size:{width:i,height:r},uv:n,pixel:[Math.floor(n[0]*i),Math.floor(n[1]*r)]},o}disablePickingIndex(){this.setState({disablePicking:!0})}restorePickingColors(){this.setState({disablePicking:!1})}_updateAutoHighlight(e){super._updateAutoHighlight({...e,color:this.encodePickingColor(0)})}_createMesh(){let{bounds:e}=this.props,t=e;k(e)&&(t=[[e[0],e[1]],[e[0],e[3]],[e[2],e[3]],[e[2],e[1]]]);let o=this.props._projectionTolerance,i=this.usePositionTransforms().transform?.bind(this);if(o&&!i)throw Error("_projectionTolerance requires a preprojecting viewport");let r=o?(0,C.A)(this.state.packedCrs):null;if(o&&!r)throw Error("_projectionTolerance requires projected coordinates with linear units");return function e(t,o,i){if(i)return function(t,o,{transform:i,tolerance:r,scale:n}){let a=e(t,o),s=Float64Array.from(a.texCoords);for(let e=1;e<s.length;e+=2)s[e]=1-s[e];let l=function(e,t){let{transform:o,tolerance:i,errorMetric:r,refinement:n="transform-error",size:a=2,targetSize:s=a,maxEdgeLength:l=1/0,maxDepth:c=10,maxVertices:u=65536,maxTriangles:h=131072}=t;if("function"!=typeof o||void 0!==r&&"function"!=typeof r||"transform-error"!==n&&"source-edge"!==n||"transform-error"===n&&(void 0===i||!Number.isFinite(i)||i<=0)||"source-edge"===n&&(void 0!==i||void 0!==r||!Number.isFinite(l))||2!==a&&3!==a||2!==s&&3!==s||!(l>0)||!Number.isFinite(l)&&l!==1/0||!Number.isInteger(c)||c<0||c>30||!m(u)||!m(h)||!Number.isSafeInteger(e.positions.length)||e.positions.length<0||e.positions.length%a!=0||!Number.isSafeInteger(e.indices.length)||e.indices.length<0||e.indices.length%3!=0)throw RangeError("Invalid triangle mesh subdivision options or input lengths");if(e.positions.length/a>u||e.indices.length/3>h)throw RangeError("Input mesh exceeds subdivision limits");let b=[],y=[];for(let t=0;t<e.positions.length;t+=a){let o=Array.from({length:a},(o,i)=>e.positions[t+i]);if(!o.every(Number.isFinite))throw RangeError("Source positions must be finite");b.push({source:o,target:C(o),weights:new Map([[t/a,1]])})}for(let t=0;t<e.indices.length;t+=3){let o=Array.from({length:3},(o,i)=>e.indices[t+i]);if(!o.every(e=>Number.isInteger(e)&&e>=0&&e<b.length))throw RangeError("Triangle indices must reference input vertices");y.push({vertices:o,sourceTriangle:t/3})}for(let e=0;;e++){let t=new Set;for(let e of y)if("source-edge"===n)for(let o=0;o<3;o++){let i=e.vertices[o],r=e.vertices[(o+1)%3];f(b[i],b[r])>l&&t.add(d(i,r))}else if(function(e){let t=e.vertices.map(e=>b[e]),o=!1;for(let e=0;e<3;e++){let r=t[e],n=t[(e+1)%3];for(let e of(f(r,n)>l&&(o=!0),p))x([r,n],[1-e,e])>(i??1/0)&&(o=!0)}for(let e of g)x(t,e)>(i??1/0)&&(o=!0);return o}(e)){let[o,i,r]=e.vertices;t.add(d(o,i)),t.add(d(i,r)),t.add(d(r,o))}if(!t.size)return function(){let e=new Uint32Array(3*b.length),t=new Float64Array(3*b.length);for(let o=0;o<b.length;o++){let i=0;for(let[r,n]of b[o].weights)e[3*o+i]=r,t[3*o+i++]=n}return{sourcePositions:new Float64Array(b.flatMap(e=>e.source)),positions:new Float64Array(b.flatMap(e=>e.target)),indices:new Uint32Array(y.flatMap(e=>e.vertices)),sourceVertexIndices:e,sourceVertexWeights:t,sourceTriangleIndices:new Uint32Array(y.map(e=>e.sourceTriangle))}}();if(e>=c)throw RangeError("Triangle mesh subdivision exceeded maxDepth");let o=new Map,r=[];for(let e of y)!function(e,t,o,i){let[r,n,a]=e.vertices,s=o.has(d(r,n))?_(r,n,i):-1,l=o.has(d(n,a))?_(n,a,i):-1,c=o.has(d(a,r))?_(a,r,i):-1,u=Number(s>=0)+Number(l>=0)+Number(c>=0);if(0===u)p(r,n,a);else if(3===u)p(r,s,c),p(s,n,l),p(c,l,a),p(s,l,c);else{let e=[r,n,a],t=[s,l,c],o=1===u?t.findIndex(e=>e>=0):t.findIndex(e=>e<0),i=1===u?o:(o+1)%3,g=e[i],f=e[(i+1)%3],d=e[(i+2)%3],m=t[i];if(1===u)p(g,m,d),p(m,f,d);else{let e=t[(i+1)%3];p(f,e,m),p(g,m,d),p(m,e,d)}}function p(o,i,r){if(t.length>=h)throw RangeError("Triangle mesh subdivision exceeded maxTriangles");t.push({vertices:[o,i,r],sourceTriangle:e.sourceTriangle})}}(e,r,t,o);y=r}function C(e){let t=o(e.slice());if(!t||t.length!==s)throw RangeError("Transform must return targetSize components");let i=Array.from(t);if(!i.every(Number.isFinite))throw RangeError("Transform returned nonfinite coordinates");return i}function x(e,t){let o=v(e.map(e=>e.source),t),i=v(e.map(e=>e.target),t),n=C(o);if(!r)return Math.hypot(...n.map((e,t)=>e-i[t]));let a=r({source:o,exact:n,interpolated:i});if(!Number.isFinite(a)||a<0)throw RangeError("errorMetric must return a finite nonnegative value");return a}function _(e,t,o){let i=d(e,t),r=o.get(i);if(void 0!==r)return r;if(b.length>=u)throw RangeError("Triangle mesh subdivision exceeded maxVertices");let n=v([b[e].source,b[t].source],[.5,.5]),a=new Map;for(let o of[b[e],b[t]])for(let[e,t]of o.weights)a.set(e,(a.get(e)||0)+.5*t);if(a.size>3)throw Error("Inconsistent mesh provenance");let s=b.length;return b.push({source:n,target:C(n),weights:a}),o.set(i,s),s}}({positions:s,indices:a.indices},{size:2,targetSize:3,tolerance:r,transform:e=>{let o=y(t,e[0],e[1]);return i([o[0],o[1],o[2]??0]).map((e,t)=>e*n[t])}}),c=l.sourcePositions.length/2,u=new Float64Array(3*c),h=new Float32Array(2*c);for(let e=0;e<c;e++){let o=l.sourcePositions[2*e],i=l.sourcePositions[2*e+1],r=y(t,o,i);u.set([r[0],r[1],r[2]??0],3*e),h.set([o,1-i],2*e)}return{vertexCount:l.indices.length,positions:u,projectedPositions:l.positions.map((e,t)=>e/n[t%3]),indices:l.indices,texCoords:h}}(t,o,i);if(!o){var r=t;let e=new Float64Array(12);for(let t=0;t<r.length;t++)e[3*t+0]=r[t][0],e[3*t+1]=r[t][1],e[3*t+2]=r[t][2]||0;return{vertexCount:6,positions:e,indices:h,texCoords:b}}let n=Math.max(Math.abs(t[0][0]-t[3][0]),Math.abs(t[1][0]-t[2][0])),a=Math.max(Math.abs(t[1][1]-t[0][1]),Math.abs(t[2][1]-t[3][1])),s=Math.ceil(n/o)+1,l=Math.ceil(a/o)+1,c=(s-1)*(l-1)*6,u=new Uint32Array(c),C=new Float32Array(s*l*2),x=new Float64Array(s*l*3),_=0,A=0;for(let e=0;e<s;e++){let o=e/(s-1);for(let i=0;i<l;i++){let r=i/(l-1),n=y(t,o,r);x[3*_+0]=n[0],x[3*_+1]=n[1],x[3*_+2]=n[2]||0,C[2*_+0]=o,C[2*_+1]=1-r,e>0&&i>0&&(u[A++]=_-l,u[A++]=_-l-1,u[A++]=_-1,u[A++]=_-l,u[A++]=_-1,u[A++]=_),_++}}return{vertexCount:c,positions:x,indices:u,texCoords:C}}(t,this.getSubdivisionStep(),o?{transform:i,tolerance:o,scale:r}:void 0)}_getModel(){let e="webgpu"===this.context.device.type?this.getAttributeManager().getBufferLayouts({isInstanced:!1}).filter(e=>"indices"!==e.name):this.getAttributeManager().getBufferLayouts();return new l.A(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:e,topology:"triangle-list",isInstanced:!1})}draw(e){let{shaderModuleProps:t}=e,{model:o,coordinateConversion:i,bounds:r,disablePicking:n}=this.state,{image:a,desaturate:s,transparentColor:l,tintColor:c}=this.props;if((!t.picking.isActive||!n)&&a&&o){let e={bitmapTexture:a,bounds:r,coordinateConversion:i,desaturate:s,tintColor:c.slice(0,3).map(e=>e/255),transparentColor:l.map(e=>e/255)};o.shaderInputs.setProps({bitmap:e}),o.draw(this.context.renderPass)}}_getCoordinateUniforms(){let{_imageCoordinateSystem:e}=this.props;if(!this.state.preproject&&"default"!==e){let{bounds:t}=this.props;if(!k(t))throw Error("_imageCoordinateSystem only supports rectangular bounds");let o=this.context.viewport.isGeospatial&&this.context.viewport.crs?.signature!=="OSMTile512"?"lnglat":"cartesian";if("lnglat"==(e="lnglat"===e?"lnglat":"cartesian")&&"cartesian"===o)return{coordinateConversion:-1,bounds:t};if("cartesian"===e&&"lnglat"===o){let e=(0,c.Gw)([t[0],t[1]]),o=(0,c.Gw)([t[2],t[3]]);return{coordinateConversion:1,bounds:[e[0],e[1],o[0],o[1]]}}}return{coordinateConversion:0,bounds:[0,0,0,0]}}}I.layerName="BitmapLayer",I.defaultProps={image:{type:"image",value:null,async:!0},bounds:{type:"array",value:[1,0,0,1],compare:!0},_imageCoordinateSystem:"default",_projectionTolerance:{type:"number",value:0,min:0},desaturate:{type:"number",min:0,max:1,value:0},transparentColor:{type:"color",value:[0,0,0,0]},tintColor:{type:"color",value:[255,255,255]},textureParameters:{type:"object",ignore:!0,value:null}};let L=I;function k(e){return Number.isFinite(e[0])}}}]);