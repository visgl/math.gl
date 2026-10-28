"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["8634"],{55230(t){function i(t,i,g){g=g||2;var c,f,v,x,_,L,C,m=i&&i.length,y=m?i[0]*g:t.length,w=e(t,0,y,g,!0),b=[];if(!w||w.next===w.prev)return b;if(m&&(w=function(t,i,r,s){var h,g,c,f,d,v=[];for(h=0,g=i.length;h<g;h++)c=i[h]*s,f=h<g-1?i[h+1]*s:t.length,(d=e(t,c,f,s,!1))===d.next&&(d.steiner=!0),v.push(function(t){var i=t,e=t;do(i.x<e.x||i.x===e.x&&i.y<e.y)&&(e=i),i=i.next;while(i!==t)return e}(d));for(v.sort(n),h=0;h<v.length;h++)r=function(t,i){var e=function(t,i){var e,o,n,r=i,s=t.x,h=t.y,g=-1/0;do{if(h<=r.y&&h>=r.next.y&&r.next.y!==r.y){var c=r.x+(h-r.y)*(r.next.x-r.x)/(r.next.y-r.y);if(c<=s&&c>g&&(g=c,n=r.x<r.next.x?r:r.next,c===s))return n}r=r.next}while(r!==i)if(!n)return null;var p,f=n,d=n.x,v=n.y,x=1/0;r=n;do{s>=r.x&&r.x>=d&&s!==r.x&&l(h<v?s:g,h,d,v,h<v?g:s,h,r.x,r.y)&&(p=Math.abs(h-r.y)/(s-r.x),u(r,t)&&(p<x||p===x&&(r.x>n.x||r.x===n.x&&(e=n,o=r,0>a(e.prev,e,o.prev)&&0>a(o.next,e,e.next))))&&(n=r,x=p)),r=r.next}while(r!==f)return n}(t,i);if(!e)return i;var n=p(e,t);return o(n,n.next),o(e,e.next)}(v[h],r);return r}(t,i,w,g)),t.length>80*g){c=v=t[0],f=x=t[1];for(var M=g;M<y;M+=g)_=t[M],L=t[M+1],_<c&&(c=_),L<f&&(f=L),_>v&&(v=_),L>x&&(x=L);C=0!==(C=Math.max(v-c,x-f))?32767/C:0}return function t(i,e,n,g,c,f,v){if(i){!v&&f&&function(t,i,e,o){var n=t;do 0===n.z&&(n.z=r(n.x,n.y,i,e,o)),n.prevZ=n.prev,n.nextZ=n.next,n=n.next;while(n!==t)n.prevZ.nextZ=null,n.prevZ=null,function(t){var i,e,o,n,r,l,a,s,h=1;do{for(e=t,t=null,r=null,l=0;e;){for(l++,o=e,a=0,i=0;i<h&&(a++,o=o.nextZ);i++);for(s=h;a>0||s>0&&o;)0!==a&&(0===s||!o||e.z<=o.z)?(n=e,e=e.nextZ,a--):(n=o,o=o.nextZ,s--),r?r.nextZ=n:t=n,n.prevZ=r,r=n;e=o}r.nextZ=null,h*=2}while(l>1)}(n)}(i,g,c,f);for(var x,_,L=i;i.prev!==i.next;){if(x=i.prev,_=i.next,f?function(t,i,e,o){var n=t.prev,s=t.next;if(a(n,t,s)>=0)return!1;for(var h=n.x,g=t.x,c=s.x,u=n.y,p=t.y,f=s.y,d=h<g?h<c?h:c:g<c?g:c,v=u<p?u<f?u:f:p<f?p:f,x=h>g?h>c?h:c:g>c?g:c,_=u>p?u>f?u:f:p>f?p:f,L=r(d,v,i,e,o),C=r(x,_,i,e,o),m=t.prevZ,y=t.nextZ;m&&m.z>=L&&y&&y.z<=C;){if(m.x>=d&&m.x<=x&&m.y>=v&&m.y<=_&&m!==n&&m!==s&&l(h,u,g,p,c,f,m.x,m.y)&&a(m.prev,m,m.next)>=0||(m=m.prevZ,y.x>=d&&y.x<=x&&y.y>=v&&y.y<=_&&y!==n&&y!==s&&l(h,u,g,p,c,f,y.x,y.y)&&a(y.prev,y,y.next)>=0))return!1;y=y.nextZ}for(;m&&m.z>=L;){if(m.x>=d&&m.x<=x&&m.y>=v&&m.y<=_&&m!==n&&m!==s&&l(h,u,g,p,c,f,m.x,m.y)&&a(m.prev,m,m.next)>=0)return!1;m=m.prevZ}for(;y&&y.z<=C;){if(y.x>=d&&y.x<=x&&y.y>=v&&y.y<=_&&y!==n&&y!==s&&l(h,u,g,p,c,f,y.x,y.y)&&a(y.prev,y,y.next)>=0)return!1;y=y.nextZ}return!0}(i,g,c,f):function(t){var i=t.prev,e=t.next;if(a(i,t,e)>=0)return!1;for(var o=i.x,n=t.x,r=e.x,s=i.y,h=t.y,g=e.y,c=o<n?o<r?o:r:n<r?n:r,u=s<h?s<g?s:g:h<g?h:g,p=o>n?o>r?o:r:n>r?n:r,f=s>h?s>g?s:g:h>g?h:g,d=e.next;d!==i;){if(d.x>=c&&d.x<=p&&d.y>=u&&d.y<=f&&l(o,s,n,h,r,g,d.x,d.y)&&a(d.prev,d,d.next)>=0)return!1;d=d.next}return!0}(i)){e.push(x.i/n|0),e.push(i.i/n|0),e.push(_.i/n|0),d(i),i=_.next,L=_.next;continue}if((i=_)===L){v?1===v?t(i=function(t,i,e){var n=t;do{var r=n.prev,l=n.next.next;!s(r,l)&&h(r,n,n.next,l)&&u(r,l)&&u(l,r)&&(i.push(r.i/e|0),i.push(n.i/e|0),i.push(l.i/e|0),d(n),d(n.next),n=t=l),n=n.next}while(n!==t)return o(n)}(o(i),e,n),e,n,g,c,f,2):2===v&&function(i,e,n,r,l,g){var c=i;do{for(var f,d,v=c.next.next;v!==c.prev;){if(c.i!==v.i&&(f=c,d=v,f.next.i!==d.i&&f.prev.i!==d.i&&!function(t,i){var e=t;do{if(e.i!==t.i&&e.next.i!==t.i&&e.i!==i.i&&e.next.i!==i.i&&h(e,e.next,t,i))return!0;e=e.next}while(e!==t)return!1}(f,d)&&(u(f,d)&&u(d,f)&&function(t,i){var e=t,o=!1,n=(t.x+i.x)/2,r=(t.y+i.y)/2;do e.y>r!=e.next.y>r&&e.next.y!==e.y&&n<(e.next.x-e.x)*(r-e.y)/(e.next.y-e.y)+e.x&&(o=!o),e=e.next;while(e!==t)return o}(f,d)&&(a(f.prev,f,d.prev)||a(f,d.prev,d))||s(f,d)&&a(f.prev,f,f.next)>0&&a(d.prev,d,d.next)>0))){var x=p(c,v);c=o(c,c.next),x=o(x,x.next),t(c,e,n,r,l,g,0),t(x,e,n,r,l,g,0);return}v=v.next}c=c.next}while(c!==i)}(i,e,n,g,c,f):t(o(i),e,n,g,c,f,1);break}}}}(w,b,g,c,f,C,0),b}function e(t,i,e,o,n){var r,l;if(n===x(t,i,e,o)>0)for(r=i;r<e;r+=o)l=f(r,t[r],t[r+1],l);else for(r=e-o;r>=i;r-=o)l=f(r,t[r],t[r+1],l);return l&&s(l,l.next)&&(d(l),l=l.next),l}function o(t,i){if(!t)return t;i||(i=t);var e,o=t;do if(e=!1,!o.steiner&&(s(o,o.next)||0===a(o.prev,o,o.next))){if(d(o),(o=i=o.prev)===o.next)break;e=!0}else o=o.next;while(e||o!==i)return i}function n(t,i){return t.x-i.x}function r(t,i,e,o,n){return(t=((t=((t=((t=((t=(t-e)*n|0)|t<<8)&0xff00ff)|t<<4)&0xf0f0f0f)|t<<2)&0x33333333)|t<<1)&0x55555555)|(i=((i=((i=((i=((i=(i-o)*n|0)|i<<8)&0xff00ff)|i<<4)&0xf0f0f0f)|i<<2)&0x33333333)|i<<1)&0x55555555)<<1}function l(t,i,e,o,n,r,l,a){return(n-l)*(i-a)>=(t-l)*(r-a)&&(t-l)*(o-a)>=(e-l)*(i-a)&&(e-l)*(r-a)>=(n-l)*(o-a)}function a(t,i,e){return(i.y-t.y)*(e.x-i.x)-(i.x-t.x)*(e.y-i.y)}function s(t,i){return t.x===i.x&&t.y===i.y}function h(t,i,e,o){var n=c(a(t,i,e)),r=c(a(t,i,o)),l=c(a(e,o,t)),s=c(a(e,o,i));return!!(n!==r&&l!==s||0===n&&g(t,e,i)||0===r&&g(t,o,i)||0===l&&g(e,t,o)||0===s&&g(e,i,o))}function g(t,i,e){return i.x<=Math.max(t.x,e.x)&&i.x>=Math.min(t.x,e.x)&&i.y<=Math.max(t.y,e.y)&&i.y>=Math.min(t.y,e.y)}function c(t){return t>0?1:t<0?-1:0}function u(t,i){return 0>a(t.prev,t,t.next)?a(t,i,t.next)>=0&&a(t,t.prev,i)>=0:0>a(t,i,t.prev)||0>a(t,t.next,i)}function p(t,i){var e=new v(t.i,t.x,t.y),o=new v(i.i,i.x,i.y),n=t.next,r=i.prev;return t.next=i,i.prev=t,e.next=n,n.prev=e,o.next=e,e.prev=o,r.next=o,o.prev=r,o}function f(t,i,e,o){var n=new v(t,i,e);return o?(n.next=o.next,n.prev=o,o.next.prev=n,o.next=n):(n.prev=n,n.next=n),n}function d(t){t.next.prev=t.prev,t.prev.next=t.next,t.prevZ&&(t.prevZ.nextZ=t.nextZ),t.nextZ&&(t.nextZ.prevZ=t.prevZ)}function v(t,i,e){this.i=t,this.x=i,this.y=e,this.prev=null,this.next=null,this.z=0,this.prevZ=null,this.nextZ=null,this.steiner=!1}function x(t,i,e,o){for(var n=0,r=i,l=e-o;r<e;r+=o)n+=(t[l]-t[r])*(t[r+1]+t[l+1]),l=r;return n}t.exports=i,t.exports.default=i,i.deviation=function(t,i,e,o){var n=i&&i.length,r=n?i[0]*e:t.length,l=Math.abs(x(t,0,r,e));if(n)for(var a=0,s=i.length;a<s;a++){var h=i[a]*e,g=a<s-1?i[a+1]*e:t.length;l-=Math.abs(x(t,h,g,e))}var c=0;for(a=0;a<o.length;a+=3){var u=o[a]*e,p=o[a+1]*e,f=o[a+2]*e;c+=Math.abs((t[u]-t[f])*(t[p+1]-t[u+1])-(t[u]-t[p])*(t[f+1]-t[u+1]))}return 0===l&&0===c?0:Math.abs((c-l)/l)},i.flatten=function(t){for(var i=t[0][0].length,e={vertices:[],holes:[],dimensions:i},o=0,n=0;n<t.length;n++){for(var r=0;r<t[n].length;r++)for(var l=0;l<i;l++)e.vertices.push(t[n][r][l]);n>0&&(o+=t[n-1].length,e.holes.push(o))}return e}},44941(t,i,e){e.d(i,{A:()=>a});var o=e(53439),n=e(23459),r=e(24067),l=e(26839);class a{constructor(t){this.indexStarts=[0],this.vertexStarts=[0],this.vertexCount=0,this.instanceCount=0;let{attributes:i={}}=t;this.typedArrayManager=n.A,this.attributes={},this._attributeDefs=i,this.opts=t,this.updateGeometry(t)}updateGeometry(t){Object.assign(this.opts,t);let{data:i,buffers:e={},getGeometry:o,geometryBuffer:n,positionFormat:l,dataChanged:a,normalize:s=!0}=this.opts;if(this.data=i,this.getGeometry=o,this.positionSize=n&&n.size||("XY"===l?2:3),this.buffers=e,this.normalize=s,n&&((0,r.A)(i.startIndices),this.getGeometry=this.getGeometryFromBuffer(n),s||(e.vertexPositions=n)),this.geometryBuffer=e.vertexPositions,Array.isArray(a))for(let t of a)this._rebuildGeometry(t);else this._rebuildGeometry()}updatePartialGeometry({startRow:t,endRow:i}){this._rebuildGeometry({startRow:t,endRow:i})}getGeometryFromBuffer(t){let i=t.value||t;return ArrayBuffer.isView(i)?(0,o.I)(i,{size:this.positionSize,offset:t.offset,stride:t.stride,startIndices:this.data.startIndices}):null}_allocate(t,i){let{attributes:e,buffers:o,_attributeDefs:n,typedArrayManager:r}=this;for(let l in n)if(l in o)r.release(e[l]),e[l]=null;else{let o=n[l];o.copy=i,e[l]=r.allocate(e[l],t,o)}}_forEachGeometry(t,i,e){let{data:n,getGeometry:r}=this,{iterable:l,objectInfo:a}=(0,o.X)(n,i,e);for(let i of l)a.index++,t(r?r(i,a):null,a.index)}_rebuildGeometry(t){if(!this.data)return;let{indexStarts:i,vertexStarts:e,instanceCount:o}=this,{data:n,geometryBuffer:r}=this,{startRow:a=0,endRow:s=1/0}=t||{},h={};if(t||(i=[0],e=[0]),this.normalize||!r)this._forEachGeometry((t,i)=>{let o=t&&this.normalizeGeometry(t);h[i]=o,e[i+1]=e[i]+(o?this.getGeometrySize(o):0)},a,s),o=e[e.length-1];else if(o=(e=n.startIndices)[n.length]||0,ArrayBuffer.isView(r))o=o||r.length/this.positionSize;else if(r instanceof l.h){let t=4*this.positionSize;o=o||r.byteLength/t}else if(r.buffer){let t=r.stride||4*this.positionSize;o=o||r.buffer.byteLength/t}else if(r.value){let t=r.value,i=r.stride/t.BYTES_PER_ELEMENT||this.positionSize;o=o||t.length/i}this._allocate(o,!!t),this.indexStarts=i,this.vertexStarts=e,this.instanceCount=o;let g={};this._forEachGeometry((t,n)=>{let r=h[n]||t;g.vertexStart=e[n],g.indexStart=i[n],g.geometrySize=(n<e.length-1?e[n+1]:o)-e[n],g.geometryIndex=n,this.updateGeometryAttributes(r,g)},a,s),this.vertexCount=i[i.length-1]}}},98881(t,i,e){e.d(i,{$n:()=>l});Uint32Array.BYTES_PER_ELEMENT,n("colors");let o=n("floatColors");function n(t){return`\
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
`}function r(t){return`\
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
`}r("colors");let l={name:"floatColors",props:{},uniforms:{},vs:o,fs:o,source:r("floatColors"),uniformTypes:{useByteColors:"f32"},defaultUniforms:{useByteColors:!0}}},37072(t,i,e){e.d(i,{J:()=>a});var o=e(98881),n=e(66925),r=e(38846),l=e(79439);let a={props:{},name:"gouraudMaterial",bindingLayout:[{name:"gouraudMaterial",group:3}],vs:r.l.replace("phongMaterial","gouraudMaterial"),fs:r.X.replace("phongMaterial","gouraudMaterial"),source:l.X.replaceAll("phongMaterial","gouraudMaterial"),defines:{LIGHTING_VERTEX:!0},dependencies:[n.x,o.$n],uniformTypes:{unlit:"i32",ambient:"f32",diffuse:"f32",shininess:"f32",specularColor:"vec3<f32>"},defaultUniforms:{unlit:!1,ambient:.35,diffuse:.6,shininess:32,specularColor:[38.25,38.25,38.25]},getUniforms:t=>({...a.defaultUniforms,...t})}},66925(t,i,e){e.d(i,{x:()=>a});var o=e(29651);let n=`\
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
`,r=`\
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
`;var l=e(55611);let a={props:{},uniforms:{},name:"lighting",defines:{},uniformTypes:{enabled:"i32",directionalLightCount:"i32",pointLightCount:"i32",spotLightCount:"i32",ambientColor:"vec3<f32>",lights:[{color:"vec3<f32>",position:"vec3<f32>",direction:"vec3<f32>",attenuation:"vec3<f32>",coneCos:"vec2<f32>"},5]},defaultUniforms:h(),bindingLayout:[{name:"lighting",group:2}],firstBindingSlot:0,source:r,vs:n,fs:n,getUniforms:function(t,i={}){if(!(t=t?{...t}:t))return h();t.lights&&(t={...t,...function(t){let i={pointLights:[],spotLights:[],directionalLights:[]};for(let e of t||[])switch(e.type){case"ambient":i.ambientLight=e;break;case"directional":i.directionalLights?.push(e);break;case"point":i.pointLights?.push(e);break;case"spot":i.spotLights?.push(e)}return i}(t.lights),lights:void 0});let{useByteColors:e,ambientLight:n,pointLights:r,spotLights:l,directionalLights:a}=t||{};if(!(n||r&&r.length>0||l&&l.length>0||a&&a.length>0))return{...h(),enabled:0};let c={...h(),...function({useByteColors:t,ambientLight:i,pointLights:e=[],spotLights:n=[],directionalLights:r=[]}){let l=g(),a=0,h=0,c=0,u=0;for(let i of e){if(a>=5)break;l[a]={...l[a],color:s(i,t),position:i.position,attenuation:i.attenuation||[1,0,0]},a++,h++}for(let i of n){var p;if(a>=5)break;l[a]={...l[a],color:s(i,t),position:i.position,direction:i.direction,attenuation:i.attenuation||[1,0,0],coneCos:[Math.cos((p=i).innerConeAngle??0),Math.cos(p.outerConeAngle??Math.PI/4)]},a++,c++}for(let i of r){if(a>=5)break;l[a]={...l[a],color:s(i,t),direction:i.direction},a++,u++}return e.length+n.length+r.length>5&&o.R.warn("MAX_LIGHTS exceeded, truncating to 5")(),{ambientColor:s(i,t),directionalLightCount:u,pointLightCount:h,spotLightCount:c,lights:l}}({useByteColors:e,ambientLight:n,pointLights:r,spotLights:l,directionalLights:a})};return void 0!==t.enabled&&(c.enabled=+!!t.enabled),c}};function s(t={},i){let{color:e=[0,0,0],intensity:o=1}=t;return(0,l.sC)(e,(0,l.eS)(i,!0)).map(t=>t*o)}function h(){return{enabled:1,directionalLightCount:0,pointLightCount:0,spotLightCount:0,ambientColor:[.1,.1,.1],lights:g()}}function g(){return Array.from({length:5},()=>({color:[1,1,1],position:[1,1,2],direction:[1,1,1],attenuation:[1,0,0],coneCos:[1,0]}))}},38846(t,i,e){e.d(i,{X:()=>o,l:()=>n});let o=`\
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
`},79439(t,i,e){e.d(i,{X:()=>o});let o=`\
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
`},76046(t,i,e){function o(t,i,e,n,r=[]){let l,a;if(8&e)l=(n[3]-t[1])/(i[1]-t[1]),a=3;else if(4&e)l=(n[1]-t[1])/(i[1]-t[1]),a=1;else if(2&e)l=(n[2]-t[0])/(i[0]-t[0]),a=2;else{if(!(1&e))return null;l=(n[0]-t[0])/(i[0]-t[0]),a=0}for(let e=0;e<t.length;e++)r[e]=(1&a)===e?n[a]:l*(i[e]-t[e])+t[e];return r}function n(t,i){let e=0;return t[0]<i[0]?e|=1:t[0]>i[2]&&(e|=2),t[1]<i[1]?e|=4:t[1]>i[3]&&(e|=8),e}e.d(i,{w:()=>a,M:()=>l});var r=e(76520);function l(t,i){let e,l,{size:a=2,broken:s=!1,gridResolution:g=10,gridOffset:c=[0,0],startIndex:u=0,endIndex:p=t.length}=i||{},f=(p-u)/a,d=[],v=[d],x=(0,r.ah)(t,0,a,u),_=h(x,g,c,[]),L=[];(0,r.VC)(d,x);for(let i=1;i<f;i++){for(l=n(e=(0,r.ah)(t,i,a,u,e),_);l;){var C,m,y;o(x,e,l,_,L);let t=n(L,_);t&&(o(x,L,t,_,L),l=t),(0,r.VC)(d,L),(0,r.C)(x,L),C=_,m=g,8&(y=l)?(C[1]+=m,C[3]+=m):4&y?(C[1]-=m,C[3]-=m):2&y?(C[0]+=m,C[2]+=m):1&y&&(C[0]-=m,C[2]-=m),s&&d.length>a&&(d=[],v.push(d),(0,r.VC)(d,x)),l=n(e,_)}(0,r.VC)(d,e),(0,r.C)(x,e)}return s?v:v[0]}function a(t,i=null,e){if(!t.length)return[];let{size:o=2,gridResolution:r=10,gridOffset:l=[0,0],edgeTypes:c=!1}=e||{},u=[],p=[{pos:t,types:c?Array(t.length/o).fill(1):null,holes:i||[]}],f=[[],[]],d=[];for(;p.length;){let{pos:t,types:i,holes:e}=p.shift();(function(t,i,e,o){let n=1/0,r=-1/0,l=1/0,a=-1/0;for(let o=0;o<e;o+=i){let i=t[o],e=t[o+1];n=i<n?i:n,r=i>r?i:r,l=e<l?e:l,a=e>a?e:a}o[0][0]=n,o[0][1]=l,o[1][0]=r,o[1][1]=a})(t,o,e[0]||t.length,f),d=h(f[0],r,l,d);let a=n(f[1],d);if(a){let n=s(t,i,o,0,e[0]||t.length,d,a),r={pos:n[0].pos,types:n[0].types,holes:[]},l={pos:n[1].pos,types:n[1].types,holes:[]};p.push(r,l);for(let h=0;h<e.length;h++)(n=s(t,i,o,e[h],e[h+1]||t.length,d,a))[0]&&(r.holes.push(r.pos.length),r.pos=g(r.pos,n[0].pos),c&&(r.types=g(r.types,n[0].types))),n[1]&&(l.holes.push(l.pos.length),l.pos=g(l.pos,n[1].pos),c&&(l.types=g(l.types,n[1].types)))}else{let o={positions:t};c&&(o.edgeTypes=i),e.length&&(o.holeIndices=e),u.push(o)}}return u}function s(t,i,e,n,l,a,s){let h,g,c,u=(l-n)/e,p=[],f=[],d=[],v=[],x=[],_=(0,r.ah)(t,u-1,e,n),L=Math.sign(8&s?_[1]-a[3]:_[0]-a[2]),C=i&&i[u-1],m=0,y=0;for(let l=0;l<u;l++)h=(0,r.ah)(t,l,e,n,h),g=Math.sign(8&s?h[1]-a[3]:h[0]-a[2]),c=i&&i[n/e+l],g&&L&&L!==g&&(o(_,h,s,a,x),(0,r.VC)(p,x)&&d.push(C),(0,r.VC)(f,x)&&v.push(C)),g<=0?((0,r.VC)(p,h)&&d.push(c),m-=g):d.length&&(d[d.length-1]=0),g>=0?((0,r.VC)(f,h)&&v.push(c),y+=g):v.length&&(v[v.length-1]=0),(0,r.C)(_,h),L=g,C=c;return[m?{pos:p,types:i&&d}:null,y?{pos:f,types:i&&v}:null]}function h(t,i,e,o){let n=Math.floor((t[0]-e[0])/i)*i+e[0],r=Math.floor((t[1]-e[1])/i)*i+e[1];return o[0]=n,o[1]=r,o[2]=n+i,o[3]=r+i,o}function g(t,i){for(let e=0;e<i.length;e++)t.push(i[e]);return t}},6423(t,i,e){e.d(i,{E:()=>l,I:()=>r});var o=e(76046),n=e(76520);function r(t,i){let{size:e=2,startIndex:n=0,endIndex:r=t.length,normalize:l=!0}=i||{},h=t.slice(n,r);a(h,e,0,r-n);let g=(0,o.M)(h,{size:e,broken:!0,gridResolution:360,gridOffset:[-180,-180]});if(l)for(let t of g)s(t,e);return g}function l(t,i=null,e){let{size:r=2,normalize:h=!0,edgeTypes:g=!1}=e||{};i=i||[];let c=[],u=[],p=0,f=0;for(let o=0;o<=i.length;o++){let l=i[o]||t.length,s=f,h=function(t,i,e,o){let n=-1,r=-1;for(let l=e+1;l<o;l+=i){let i=Math.abs(t[l]);i>n&&(n=i,r=l-1)}return r}(t,r,p,l);for(let i=h;i<l;i++)c[f++]=t[i];for(let i=p;i<h;i++)c[f++]=t[i];a(c,r,s,f),function(t,i,e,o,r=85.051129){let l=t[e],a=t[o-i];if(Math.abs(l-a)>180){let o=(0,n.ah)(t,0,i,e);o[0]+=360*Math.round((a-l)/360),(0,n.VC)(t,o),o[1]=Math.sign(o[1])*r,(0,n.VC)(t,o),o[0]=l,(0,n.VC)(t,o)}}(c,r,s,f,e?.maxLatitude),p=l,u[o]=f}u.pop();let d=(0,o.w)(c,u,{size:r,gridResolution:360,gridOffset:[-180,-180],edgeTypes:g});if(h)for(let t of d)s(t.positions,r);return d}function a(t,i,e,o){let n,r=t[0];for(let l=e;l<o;l+=i){let i=(n=t[l])-r;(i>180||i<-180)&&(n-=360*Math.round(i/360)),t[l]=r=n}}function s(t,i){let e,o=t.length/i;for(let n=0;n<o&&((e=t[n*i])+180)%360==0;n++);let n=-(360*Math.round(e/360));if(0!==n)for(let e=0;e<o;e++)t[e*i]+=n}},18135(t,i,e){e.d(i,{UD:()=>n,rJ:()=>o});let o={CLOCKWISE:1,COUNTER_CLOCKWISE:-1};function n(t,i,e={}){return function(t,i={}){return Math.sign(function(t,i={}){let{start:e=0,end:o=t.length,plane:n="xy"}=i,l=i.size||2,a=0,s=r[n[0]],h=r[n[1]];for(let i=e,n=o-l;i<o;i+=l)a+=(t[i+s]-t[n+s])*(t[i+h]+t[n+h]),n=i;return a/2}(t,i))}(t,e)!==i&&(function(t,i){let{start:e=0,end:o=t.length,size:n=2}=i,r=(o-e)/n,l=Math.floor(r/2);for(let i=0;i<l;++i){let o=e+i*n,l=e+(r-1-i)*n;for(let i=0;i<n;++i){let e=t[o+i];t[o+i]=t[l+i],t[l+i]=e}}}(t,e),!0)}let r={x:0,y:1,z:2}},76520(t,i,e){function o(t,i){let e=i.length,o=t.length;if(o>0){let n=!0;for(let r=0;r<e;r++)if(t[o-e+r]!==i[r]){n=!1;break}if(n)return!1}for(let n=0;n<e;n++)t[o+n]=i[n];return!0}function n(t,i){let e=i.length;for(let o=0;o<e;o++)t[o]=i[o]}function r(t,i,e,o,n=[]){let l=o+i*e;for(let i=0;i<e;i++)n[i]=t[l+i];return n}e.d(i,{C:()=>n,VC:()=>o,ah:()=>r})}}]);