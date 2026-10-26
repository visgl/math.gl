"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["3434"],{55230(e){function t(e,t,f){f=f||2;var p,h,v,x,m,y,_,P=t&&t.length,C=P?t[0]*f:e.length,L=i(e,0,C,f,!0),b=[];if(!L||L.next===L.prev)return b;if(P&&(L=function(e,t,s,l){var c,f,p,h,u,v=[];for(c=0,f=t.length;c<f;c++)p=t[c]*l,h=c<f-1?t[c+1]*l:e.length,(u=i(e,p,h,l,!1))===u.next&&(u.steiner=!0),v.push(function(e){var t=e,i=e;do(t.x<i.x||t.x===i.x&&t.y<i.y)&&(i=t),t=t.next;while(t!==e)return i}(u));for(v.sort(n),c=0;c<v.length;c++)s=function(e,t){var i=function(e,t){var i,o,n,s=t,l=e.x,c=e.y,f=-1/0;do{if(c<=s.y&&c>=s.next.y&&s.next.y!==s.y){var p=s.x+(c-s.y)*(s.next.x-s.x)/(s.next.y-s.y);if(p<=l&&p>f&&(f=p,n=s.x<s.next.x?s:s.next,p===l))return n}s=s.next}while(s!==t)if(!n)return null;var d,h=n,u=n.x,v=n.y,x=1/0;s=n;do{l>=s.x&&s.x>=u&&l!==s.x&&r(c<v?l:f,c,u,v,c<v?f:l,c,s.x,s.y)&&(d=Math.abs(c-s.y)/(l-s.x),g(s,e)&&(d<x||d===x&&(s.x>n.x||s.x===n.x&&(i=n,o=s,0>a(i.prev,i,o.prev)&&0>a(o.next,i,i.next))))&&(n=s,x=d)),s=s.next}while(s!==h)return n}(e,t);if(!i)return t;var n=d(i,e);return o(n,n.next),o(i,i.next)}(v[c],s);return s}(e,t,L,f)),e.length>80*f){p=v=e[0],h=x=e[1];for(var S=f;S<C;S+=f)m=e[S],y=e[S+1],m<p&&(p=m),y<h&&(h=y),m>v&&(v=m),y>x&&(x=y);_=0!==(_=Math.max(v-p,x-h))?32767/_:0}return function e(t,i,n,f,p,h,v){if(t){!v&&h&&function(e,t,i,o){var n=e;do 0===n.z&&(n.z=s(n.x,n.y,t,i,o)),n.prevZ=n.prev,n.nextZ=n.next,n=n.next;while(n!==e)n.prevZ.nextZ=null,n.prevZ=null,function(e){var t,i,o,n,s,r,a,l,c=1;do{for(i=e,e=null,s=null,r=0;i;){for(r++,o=i,a=0,t=0;t<c&&(a++,o=o.nextZ);t++);for(l=c;a>0||l>0&&o;)0!==a&&(0===l||!o||i.z<=o.z)?(n=i,i=i.nextZ,a--):(n=o,o=o.nextZ,l--),s?s.nextZ=n:e=n,n.prevZ=s,s=n;i=o}s.nextZ=null,c*=2}while(r>1)}(n)}(t,f,p,h);for(var x,m,y=t;t.prev!==t.next;){if(x=t.prev,m=t.next,h?function(e,t,i,o){var n=e.prev,l=e.next;if(a(n,e,l)>=0)return!1;for(var c=n.x,f=e.x,p=l.x,g=n.y,d=e.y,h=l.y,u=c<f?c<p?c:p:f<p?f:p,v=g<d?g<h?g:h:d<h?d:h,x=c>f?c>p?c:p:f>p?f:p,m=g>d?g>h?g:h:d>h?d:h,y=s(u,v,t,i,o),_=s(x,m,t,i,o),P=e.prevZ,C=e.nextZ;P&&P.z>=y&&C&&C.z<=_;){if(P.x>=u&&P.x<=x&&P.y>=v&&P.y<=m&&P!==n&&P!==l&&r(c,g,f,d,p,h,P.x,P.y)&&a(P.prev,P,P.next)>=0||(P=P.prevZ,C.x>=u&&C.x<=x&&C.y>=v&&C.y<=m&&C!==n&&C!==l&&r(c,g,f,d,p,h,C.x,C.y)&&a(C.prev,C,C.next)>=0))return!1;C=C.nextZ}for(;P&&P.z>=y;){if(P.x>=u&&P.x<=x&&P.y>=v&&P.y<=m&&P!==n&&P!==l&&r(c,g,f,d,p,h,P.x,P.y)&&a(P.prev,P,P.next)>=0)return!1;P=P.prevZ}for(;C&&C.z<=_;){if(C.x>=u&&C.x<=x&&C.y>=v&&C.y<=m&&C!==n&&C!==l&&r(c,g,f,d,p,h,C.x,C.y)&&a(C.prev,C,C.next)>=0)return!1;C=C.nextZ}return!0}(t,f,p,h):function(e){var t=e.prev,i=e.next;if(a(t,e,i)>=0)return!1;for(var o=t.x,n=e.x,s=i.x,l=t.y,c=e.y,f=i.y,p=o<n?o<s?o:s:n<s?n:s,g=l<c?l<f?l:f:c<f?c:f,d=o>n?o>s?o:s:n>s?n:s,h=l>c?l>f?l:f:c>f?c:f,u=i.next;u!==t;){if(u.x>=p&&u.x<=d&&u.y>=g&&u.y<=h&&r(o,l,n,c,s,f,u.x,u.y)&&a(u.prev,u,u.next)>=0)return!1;u=u.next}return!0}(t)){i.push(x.i/n|0),i.push(t.i/n|0),i.push(m.i/n|0),u(t),t=m.next,y=m.next;continue}if((t=m)===y){v?1===v?e(t=function(e,t,i){var n=e;do{var s=n.prev,r=n.next.next;!l(s,r)&&c(s,n,n.next,r)&&g(s,r)&&g(r,s)&&(t.push(s.i/i|0),t.push(n.i/i|0),t.push(r.i/i|0),u(n),u(n.next),n=e=r),n=n.next}while(n!==e)return o(n)}(o(t),i,n),i,n,f,p,h,2):2===v&&function(t,i,n,s,r,f){var p=t;do{for(var h,u,v=p.next.next;v!==p.prev;){if(p.i!==v.i&&(h=p,u=v,h.next.i!==u.i&&h.prev.i!==u.i&&!function(e,t){var i=e;do{if(i.i!==e.i&&i.next.i!==e.i&&i.i!==t.i&&i.next.i!==t.i&&c(i,i.next,e,t))return!0;i=i.next}while(i!==e)return!1}(h,u)&&(g(h,u)&&g(u,h)&&function(e,t){var i=e,o=!1,n=(e.x+t.x)/2,s=(e.y+t.y)/2;do i.y>s!=i.next.y>s&&i.next.y!==i.y&&n<(i.next.x-i.x)*(s-i.y)/(i.next.y-i.y)+i.x&&(o=!o),i=i.next;while(i!==e)return o}(h,u)&&(a(h.prev,h,u.prev)||a(h,u.prev,u))||l(h,u)&&a(h.prev,h,h.next)>0&&a(u.prev,u,u.next)>0))){var x=d(p,v);p=o(p,p.next),x=o(x,x.next),e(p,i,n,s,r,f,0),e(x,i,n,s,r,f,0);return}v=v.next}p=p.next}while(p!==t)}(t,i,n,f,p,h):e(o(t),i,n,f,p,h,1);break}}}}(L,b,f,p,h,_,0),b}function i(e,t,i,o,n){var s,r;if(n===x(e,t,i,o)>0)for(s=t;s<i;s+=o)r=h(s,e[s],e[s+1],r);else for(s=i-o;s>=t;s-=o)r=h(s,e[s],e[s+1],r);return r&&l(r,r.next)&&(u(r),r=r.next),r}function o(e,t){if(!e)return e;t||(t=e);var i,o=e;do if(i=!1,!o.steiner&&(l(o,o.next)||0===a(o.prev,o,o.next))){if(u(o),(o=t=o.prev)===o.next)break;i=!0}else o=o.next;while(i||o!==t)return t}function n(e,t){return e.x-t.x}function s(e,t,i,o,n){return(e=((e=((e=((e=((e=(e-i)*n|0)|e<<8)&0xff00ff)|e<<4)&0xf0f0f0f)|e<<2)&0x33333333)|e<<1)&0x55555555)|(t=((t=((t=((t=((t=(t-o)*n|0)|t<<8)&0xff00ff)|t<<4)&0xf0f0f0f)|t<<2)&0x33333333)|t<<1)&0x55555555)<<1}function r(e,t,i,o,n,s,r,a){return(n-r)*(t-a)>=(e-r)*(s-a)&&(e-r)*(o-a)>=(i-r)*(t-a)&&(i-r)*(s-a)>=(n-r)*(o-a)}function a(e,t,i){return(t.y-e.y)*(i.x-t.x)-(t.x-e.x)*(i.y-t.y)}function l(e,t){return e.x===t.x&&e.y===t.y}function c(e,t,i,o){var n=p(a(e,t,i)),s=p(a(e,t,o)),r=p(a(i,o,e)),l=p(a(i,o,t));return!!(n!==s&&r!==l||0===n&&f(e,i,t)||0===s&&f(e,o,t)||0===r&&f(i,e,o)||0===l&&f(i,t,o))}function f(e,t,i){return t.x<=Math.max(e.x,i.x)&&t.x>=Math.min(e.x,i.x)&&t.y<=Math.max(e.y,i.y)&&t.y>=Math.min(e.y,i.y)}function p(e){return e>0?1:e<0?-1:0}function g(e,t){return 0>a(e.prev,e,e.next)?a(e,t,e.next)>=0&&a(e,e.prev,t)>=0:0>a(e,t,e.prev)||0>a(e,e.next,t)}function d(e,t){var i=new v(e.i,e.x,e.y),o=new v(t.i,t.x,t.y),n=e.next,s=t.prev;return e.next=t,t.prev=e,i.next=n,n.prev=i,o.next=i,i.prev=o,s.next=o,o.prev=s,o}function h(e,t,i,o){var n=new v(e,t,i);return o?(n.next=o.next,n.prev=o,o.next.prev=n,o.next=n):(n.prev=n,n.next=n),n}function u(e){e.next.prev=e.prev,e.prev.next=e.next,e.prevZ&&(e.prevZ.nextZ=e.nextZ),e.nextZ&&(e.nextZ.prevZ=e.prevZ)}function v(e,t,i){this.i=e,this.x=t,this.y=i,this.prev=null,this.next=null,this.z=0,this.prevZ=null,this.nextZ=null,this.steiner=!1}function x(e,t,i,o){for(var n=0,s=t,r=i-o;s<i;s+=o)n+=(e[r]-e[s])*(e[s+1]+e[r+1]),r=s;return n}e.exports=t,e.exports.default=t,t.deviation=function(e,t,i,o){var n=t&&t.length,s=n?t[0]*i:e.length,r=Math.abs(x(e,0,s,i));if(n)for(var a=0,l=t.length;a<l;a++){var c=t[a]*i,f=a<l-1?t[a+1]*i:e.length;r-=Math.abs(x(e,c,f,i))}var p=0;for(a=0;a<o.length;a+=3){var g=o[a]*i,d=o[a+1]*i,h=o[a+2]*i;p+=Math.abs((e[g]-e[h])*(e[d+1]-e[g+1])-(e[g]-e[d])*(e[h+1]-e[g+1]))}return 0===r&&0===p?0:Math.abs((p-r)/r)},t.flatten=function(e){for(var t=e[0][0].length,i={vertices:[],holes:[],dimensions:t},o=0,n=0;n<e.length;n++){for(var s=0;s<e[n].length;s++)for(var r=0;r<t;r++)i.vertices.push(e[n][s][r]);n>0&&(o+=e[n-1].length,i.holes.push(o))}return i}},59452(e,t,i){i.d(t,{A:()=>l});var o=i(41881),n=i(43411),s=i(38055),r=i(12897);class a extends o.A{get isComposite(){return!0}get isDrawable(){return!1}get isLoaded(){return super.isLoaded&&this.getSubLayers().every(e=>e.isLoaded)}getSubLayers(){return this.internalState&&this.internalState.subLayers||[]}initializeState(e){}setState(e){super.setState(e),this.setNeedsUpdate()}getPickingInfo({info:e}){let{object:t}=e;return t&&t.__source&&t.__source.parent&&t.__source.parent.id===this.id&&(e.object=t.__source.object,e.index=t.__source.index),e}filterSubLayer(e){return!0}shouldRenderSubLayer(e,t){return t&&t.length}getSubLayerClass(e,t){let{_subLayerProps:i}=this.props;return i&&i[e]&&i[e].type||t}getSubLayerRow(e,t,i){return e.__source={parent:this,object:t,index:i},e}getSubLayerAccessor(e){if("function"==typeof e){let t={index:-1,data:this.props.data,target:[]};return(i,o)=>i&&i.__source?(t.index=i.__source.index,e(i.__source.object,t)):e(i,o)}return e}getSubLayerProps(e={}){let{opacity:t,pickable:i,visible:o,parameters:n,getPolygonOffset:s,highlightedObjectIndex:a,autoHighlight:l,highlightColor:c,coordinateSystem:f,coordinateOrigin:p,wrapLongitude:g,positionFormat:d,modelMatrix:h,extensions:u,fetch:v,operation:x,_subLayerProps:m}=this.props,y={id:"",updateTriggers:{},opacity:t,pickable:i,visible:o,parameters:n,getPolygonOffset:s,highlightedObjectIndex:a,autoHighlight:l,highlightColor:c,coordinateSystem:f,coordinateOrigin:p,wrapLongitude:g,positionFormat:d,modelMatrix:h,extensions:u,fetch:v,operation:x},_=m&&e.id&&m[e.id],P=_&&_.updateTriggers,C=e.id||"sublayer";if(_){let t=this.props[r.fW],i=e.type?e.type._propTypes:{};for(let e in _){let o=i[e]||t[e];o&&"accessor"===o.type&&(_[e]=this.getSubLayerAccessor(_[e]))}}for(let t of(Object.assign(y,e,_),y.id=`${this.props.id}-${C}`,y.updateTriggers={all:this.props.updateTriggers?.all,...e.updateTriggers,...P},u)){let e=t.getSubLayerProps.call(this,t);e&&Object.assign(y,e,{updateTriggers:Object.assign(y.updateTriggers,e.updateTriggers)})}return y}_updateAutoHighlight(e){for(let t of this.getSubLayers())t.updateAutoHighlight(e)}_getAttributeManager(){return null}_postUpdate(e,t){let i=this.internalState.subLayers,o=!i||this.needsUpdate();if(o){let e=this.renderLayers();i=(0,s.B)(e,Boolean),this.internalState.subLayers=i}for(let e of((0,n.A)("compositeLayer.renderLayers",this,o,i),i))e.parent=this}}a.layerName="CompositeLayer";let l=a},44941(e,t,i){i.d(t,{A:()=>a});var o=i(53439),n=i(23459),s=i(24067),r=i(26839);class a{constructor(e){this.indexStarts=[0],this.vertexStarts=[0],this.vertexCount=0,this.instanceCount=0;let{attributes:t={}}=e;this.typedArrayManager=n.A,this.attributes={},this._attributeDefs=t,this.opts=e,this.updateGeometry(e)}updateGeometry(e){Object.assign(this.opts,e);let{data:t,buffers:i={},getGeometry:o,geometryBuffer:n,positionFormat:r,dataChanged:a,normalize:l=!0}=this.opts;if(this.data=t,this.getGeometry=o,this.positionSize=n&&n.size||("XY"===r?2:3),this.buffers=i,this.normalize=l,n&&((0,s.A)(t.startIndices),this.getGeometry=this.getGeometryFromBuffer(n),l||(i.vertexPositions=n)),this.geometryBuffer=i.vertexPositions,Array.isArray(a))for(let e of a)this._rebuildGeometry(e);else this._rebuildGeometry()}updatePartialGeometry({startRow:e,endRow:t}){this._rebuildGeometry({startRow:e,endRow:t})}getGeometryFromBuffer(e){let t=e.value||e;return ArrayBuffer.isView(t)?(0,o.I)(t,{size:this.positionSize,offset:e.offset,stride:e.stride,startIndices:this.data.startIndices}):null}_allocate(e,t){let{attributes:i,buffers:o,_attributeDefs:n,typedArrayManager:s}=this;for(let r in n)if(r in o)s.release(i[r]),i[r]=null;else{let o=n[r];o.copy=t,i[r]=s.allocate(i[r],e,o)}}_forEachGeometry(e,t,i){let{data:n,getGeometry:s}=this,{iterable:r,objectInfo:a}=(0,o.X)(n,t,i);for(let t of r)a.index++,e(s?s(t,a):null,a.index)}_rebuildGeometry(e){if(!this.data)return;let{indexStarts:t,vertexStarts:i,instanceCount:o}=this,{data:n,geometryBuffer:s}=this,{startRow:a=0,endRow:l=1/0}=e||{},c={};if(e||(t=[0],i=[0]),this.normalize||!s)this._forEachGeometry((e,t)=>{let o=e&&this.normalizeGeometry(e);c[t]=o,i[t+1]=i[t]+(o?this.getGeometrySize(o):0)},a,l),o=i[i.length-1];else if(o=(i=n.startIndices)[n.length]||0,ArrayBuffer.isView(s))o=o||s.length/this.positionSize;else if(s instanceof r.h){let e=4*this.positionSize;o=o||s.byteLength/e}else if(s.buffer){let e=s.stride||4*this.positionSize;o=o||s.buffer.byteLength/e}else if(s.value){let e=s.value,t=s.stride/e.BYTES_PER_ELEMENT||this.positionSize;o=o||e.length/t}this._allocate(o,!!e),this.indexStarts=t,this.vertexStarts=i,this.instanceCount=o;let f={};this._forEachGeometry((e,n)=>{let s=c[n]||e;f.vertexStart=i[n],f.indexStart=t[n],f.geometrySize=(n<i.length-1?i[n+1]:o)-i[n],f.geometryIndex=n,this.updateGeometryAttributes(s,f)},a,l),this.vertexCount=t[t.length-1]}}},86982(e,t,i){i.d(t,{A:()=>E});var o=i(41881),n=i(84175),s=i(46487),r=i(95335),a=i(9350),l=i(3459),c=i(95263),f=i(25337);let p=`\
layout(std140) uniform iconUniforms {
  float sizeScale;
  vec2 iconsTextureDim;
  float sizeBasis;
  float sizeMinPixels;
  float sizeMaxPixels;
  bool billboard;
  highp int sizeUnits;
  float alphaCutoff;
} icon;
`,g={name:"icon",vs:p,fs:p,uniformTypes:{sizeScale:"f32",iconsTextureDim:"vec2<f32>",sizeBasis:"f32",sizeMinPixels:"f32",sizeMaxPixels:"f32",billboard:"f32",sizeUnits:"i32",alphaCutoff:"f32"}},d=`\
#version 300 es
#define SHADER_NAME icon-layer-vertex-shader
in vec2 positions;
in vec3 instancePositions;
in vec3 instancePositions64Low;
in float instanceSizes;
in float instanceAngles;
in vec4 instanceColors;
#ifdef USE_ROW_INDEXES
in float rowIndexes;
#endif
in vec4 instanceIconFrames;
in float instanceColorModes;
in vec2 instanceOffsets;
in vec2 instancePixelOffset;
out float vColorMode;
out vec4 vColor;
out vec2 vTextureCoords;
out vec2 uv;
vec2 rotate_by_angle(vec2 vertex, float angle) {
float angle_radian = angle * PI / 180.0;
float cos_angle = cos(angle_radian);
float sin_angle = sin(angle_radian);
mat2 rotationMatrix = mat2(cos_angle, -sin_angle, sin_angle, cos_angle);
return rotationMatrix * vertex;
}
void main(void) {
geometry.worldPosition = instancePositions;
geometry.uv = positions;
#ifdef USE_ROW_INDEXES
geometry.pickingColor = picking_getPickingColorFromIndex(rowIndexes);
#else
geometry.pickingColor = picking_getPickingColorFromInstanceID();
#endif
uv = positions;
vec2 iconSize = instanceIconFrames.zw;
float sizePixels = clamp(
project_size_to_pixel(instanceSizes * icon.sizeScale, icon.sizeUnits),
icon.sizeMinPixels, icon.sizeMaxPixels
);
float iconConstraint = icon.sizeBasis == 0.0 ? iconSize.x : iconSize.y;
float instanceScale = iconConstraint == 0.0 ? 0.0 : sizePixels / iconConstraint;
vec2 pixelOffset = positions / 2.0 * iconSize + instanceOffsets;
pixelOffset = rotate_by_angle(pixelOffset, instanceAngles) * instanceScale;
pixelOffset += instancePixelOffset;
pixelOffset.y *= -1.0;
if (icon.billboard)  {
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0), geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
vec3 offset = vec3(pixelOffset, 0.0);
DECKGL_FILTER_SIZE(offset, geometry);
gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);
} else {
vec3 offset_common = vec3(project_pixel_size(pixelOffset), 0.0);
DECKGL_FILTER_SIZE(offset_common, geometry);
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, offset_common, geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
}
vTextureCoords = mix(
instanceIconFrames.xy,
instanceIconFrames.xy + iconSize,
(positions.xy + 1.0) / 2.0
) / icon.iconsTextureDim;
vColor = instanceColors;
DECKGL_FILTER_COLOR(vColor, geometry);
vColorMode = instanceColorModes;
}
`,h=`\
#version 300 es
#define SHADER_NAME icon-layer-fragment-shader
precision highp float;
uniform sampler2D iconsTexture;
in float vColorMode;
in vec4 vColor;
in vec2 vTextureCoords;
in vec2 uv;
out vec4 fragColor;
void main(void) {
geometry.uv = uv;
vec4 texColor = texture(iconsTexture, vTextureCoords);
vec3 color = mix(texColor.rgb, vColor.rgb, vColorMode);
float a = texColor.a * layer.opacity * vColor.a;
if (a < icon.alphaCutoff) {
discard;
}
fragColor = vec4(color, a);
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,u=`\
struct IconUniforms {
  sizeScale: f32,
  iconsTextureDim: vec2<f32>,
  sizeBasis: f32,
  sizeMinPixels: f32,
  sizeMaxPixels: f32,
  billboard: i32,
  sizeUnits: i32,
  alphaCutoff: f32
};

@group(0) @binding(auto) var<uniform> icon: IconUniforms;
@group(0) @binding(auto) var iconsTexture : texture_2d<f32>;
@group(0) @binding(auto) var iconsTextureSampler : sampler;

fn rotate_by_angle(vertex: vec2<f32>, angle_deg: f32) -> vec2<f32> {
  let angle_radian = angle_deg * PI / 180.0;
  let c = cos(angle_radian);
  let s = sin(angle_radian);
  let rotation = mat2x2<f32>(vec2<f32>(c, s), vec2<f32>(-s, c));
  return rotation * vertex;
}

struct Attributes {
  @builtin(instance_index) instanceIndex : u32,
  @location(0) positions: vec2<f32>,

  @location(1) instancePositions: vec3<f32>,
  @location(2) instancePositions64Low: vec3<f32>,
  @location(3) instanceSizes: f32,
  @location(4) instanceAngles: f32,
  @location(5) instanceColors: vec4<f32>,
  @location(6) instanceIconFrames: vec4<f32>,
  @location(7) instanceColorModes: f32,
  @location(8) instanceOffsets: vec2<f32>,
  @location(9) instancePixelOffset: vec2<f32>,
  PICKING_COLOR_ATTRIBUTE
};

struct Varyings {
  @builtin(position) position: vec4<f32>,

  @location(0) vColorMode: f32,
  @location(1) vColor: vec4<f32>,
  @location(2) vTextureCoords: vec2<f32>,
  @location(3) uv: vec2<f32>,
  @location(4) pickingColor: vec3<f32>,
};

@vertex
fn vertexMain(inp: Attributes) -> Varyings {
  // write geometry fields used by filters + FS
  geometry.worldPosition = inp.instancePositions;
  geometry.uv = inp.positions;
  geometry.pickingColor = PICKING_COLOR_VALUE;

  var outp: Varyings;
  outp.uv = inp.positions;

  let iconSize = inp.instanceIconFrames.zw;

  // convert size in meters to pixels, then clamp
  let sizePixels = clamp(
    project_unit_size_to_pixel(inp.instanceSizes * icon.sizeScale, icon.sizeUnits),
    icon.sizeMinPixels, icon.sizeMaxPixels
  );

  // scale icon height to match instanceSize
  let iconConstraint = select(iconSize.y, iconSize.x, icon.sizeBasis == 0.0);
  let instanceScale = select(sizePixels / iconConstraint, 0.0, iconConstraint == 0.0);

  // scale and rotate vertex in "pixel" units; then add per-instance pixel offset
  var pixelOffset = inp.positions / 2.0 * iconSize + inp.instanceOffsets;
  pixelOffset = rotate_by_angle(pixelOffset, inp.instanceAngles) * instanceScale;
  pixelOffset = pixelOffset + inp.instancePixelOffset;
  pixelOffset.y = pixelOffset.y * -1.0;

  if (icon.billboard != 0) {
    var pos = project_position_to_clipspace(inp.instancePositions, inp.instancePositions64Low, vec3<f32>(0.0)); // TODO, &geometry.position);
    // DECKGL_FILTER_GL_POSITION(pos, geometry);

    var offset = vec3<f32>(pixelOffset, 0.0);
    // DECKGL_FILTER_SIZE(offset, geometry);
    let clipOffset = project_pixel_size_to_clipspace(offset.xy);
    pos = vec4<f32>(pos.x + clipOffset.x, pos.y + clipOffset.y, pos.z, pos.w);
    outp.position = pos;
  } else {
    var offset_common = vec3<f32>(project_pixel_size_vec2(pixelOffset), 0.0);
    // DECKGL_FILTER_SIZE(offset_common, geometry);
    var pos = project_position_to_clipspace(inp.instancePositions, inp.instancePositions64Low, offset_common); // TODO, &geometry.position);
    // DECKGL_FILTER_GL_POSITION(pos, geometry);
    outp.position = pos;
  }

  let uvMix = (inp.positions.xy + vec2<f32>(1.0, 1.0)) * 0.5;
  outp.vTextureCoords = mix(inp.instanceIconFrames.xy, inp.instanceIconFrames.xy + iconSize, uvMix) / icon.iconsTextureDim;

  outp.vColor = inp.instanceColors;
  // DECKGL_FILTER_COLOR(outp.vColor, geometry);

  outp.vColorMode = inp.instanceColorModes;
  outp.pickingColor = geometry.pickingColor;

  return outp;
}

@fragment
fn fragmentMain(inp: Varyings) -> @location(0) vec4<f32> {
  // expose to deck.gl filter hooks
  geometry.uv = inp.uv;

  let texColor = textureSample(iconsTexture, iconsTextureSampler, inp.vTextureCoords);

  // if colorMode == 0, use pixel color from the texture
  // if colorMode == 1 (or picking), use texture as transparency mask
  let rgb = mix(texColor.rgb, inp.vColor.rgb, inp.vColorMode);
  let a = texColor.a * layer.opacity * inp.vColor.a;

  if (a < icon.alphaCutoff) {
    discard;
  }

  if (picking.isActive > 0.5) {
    if (!picking_isColorValid(inp.pickingColor)) {
      discard;
    }
    return vec4<f32>(inp.pickingColor, 1.0);
  }

  var fragColor = deckgl_premultiplied_alpha(vec4<f32>(rgb, a));

  if (picking.isHighlightActive > 0.5) {
    let highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
    if (picking_isColorZero(abs(inp.pickingColor - highlightedObjectColor))) {
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

  return fragColor;
}
`;var v=i(327),x=i(53439);let m=()=>{},y={minFilter:"linear",mipmapFilter:"linear",magFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"},_={x:0,y:0,width:0,height:0};function P(e){return e&&(e.id||e.url)}function C(e){let{device:t}=e;"webgl"===t.type?e.generateMipmapsWebGL():"webgpu"===t.type&&t.generateMipmapsWebGPU(e)}function L(e,t,i){for(let o=0;o<t.length;o++){let{icon:n,xOffset:s}=t[o];e[P(n)]={...n,x:s,y:i}}}class b{constructor(e,{onUpdate:t=m,onError:i=m}){this._loadOptions=null,this._texture=null,this._externalTexture=null,this._mapping={},this._samplerParameters=null,this._pendingCount=0,this._autoPacking=!1,this._xOffset=0,this._yOffset=0,this._rowHeight=0,this._buffer=4,this._canvasWidth=1024,this._canvasHeight=0,this._canvas=null,this.device=e,this.onUpdate=t,this.onError=i}finalize(){this._texture?.delete()}getTexture(){return this._texture||this._externalTexture}getIconMapping(e){let t=this._autoPacking?P(e):e;return this._mapping[t]||_}setProps({loadOptions:e,autoPacking:t,iconAtlas:i,iconMapping:o,textureParameters:n}){e&&(this._loadOptions=e),void 0!==t&&(this._autoPacking=t),o&&(this._mapping=o),i&&(this._texture?.delete(),this._texture=null,this._externalTexture=i),n&&(this._samplerParameters=n)}get isLoaded(){return 0===this._pendingCount}packIcons(e,t){if(!this._autoPacking||"u"<typeof document)return;let i=Object.values(function(e,t,i){if(!e||!t)return null;i=i||{};let o={},{iterable:n,objectInfo:s}=(0,x.X)(e);for(let e of n){s.index++;let n=t(e,s),r=P(n);if(!n)throw Error("Icon is missing.");if(!n.url)throw Error("Icon url is missing.");o[r]||i[r]&&n.url===i[r].url||(o[r]={...n,source:e,sourceIndex:s.index})}return o}(e,t,this._mapping)||{});if(i.length>0){let{mapping:e,xOffset:t,yOffset:o,rowHeight:n,canvasHeight:s}=function({icons:e,buffer:t,mapping:i={},xOffset:o=0,yOffset:n=0,rowHeight:s=0,canvasWidth:r}){let a=[];for(let l=0;l<e.length;l++){let c=e[l];if(!i[P(c)]){let{height:e,width:l}=c;o+l+t>r&&(L(i,a,n),o=0,n=s+n+t,s=0,a=[]),a.push({icon:c,xOffset:o}),o=o+l+t,s=Math.max(s,e)}}return a.length>0&&L(i,a,n),{mapping:i,rowHeight:s,xOffset:o,yOffset:n,canvasWidth:r,canvasHeight:Math.pow(2,Math.ceil(Math.log2(s+n+t)))}}({icons:i,buffer:this._buffer,canvasWidth:this._canvasWidth,mapping:this._mapping,rowHeight:this._rowHeight,xOffset:this._xOffset,yOffset:this._yOffset});this._rowHeight=n,this._mapping=e,this._xOffset=t,this._yOffset=o,this._canvasHeight=s,this._texture||(this._texture=this.device.createTexture({format:"rgba8unorm",data:null,width:this._canvasWidth,height:this._canvasHeight,sampler:this._samplerParameters||y,mipLevels:this.device.getMipLevelCount(this._canvasWidth,this._canvasHeight)})),this._texture.height!==this._canvasHeight&&(this._texture=function(e,t,i,o){let{width:n,height:s,device:r}=e,a=r.createTexture({format:"rgba8unorm",width:t,height:i,sampler:o,mipLevels:r.getMipLevelCount(t,i)}),l=r.createCommandEncoder();l.copyTextureToTexture({sourceTexture:e,destinationTexture:a,width:n,height:s});let c=l.finish();return r.submit(c),C(a),e.destroy(),a}(this._texture,this._canvasWidth,this._canvasHeight,this._samplerParameters||y)),this.onUpdate(!0),this._canvas=this._canvas||document.createElement("canvas"),this._loadIcons(i)}}_loadIcons(e){let t=this._canvas.getContext("2d",{willReadFrequently:!0});for(let i of e)this._pendingCount++,(0,v.H)(i.url,this._loadOptions).then(e=>{let o=P(i),n=this._mapping[o],{x:s,y:r,width:a,height:l}=n,{image:c,width:f,height:p}=function(e,t,i,o){let n=Math.min(i/t.width,o/t.height),s=Math.floor(t.width*n),r=Math.floor(t.height*n);return 1===n?{image:t,width:s,height:r}:(e.canvas.height=r,e.canvas.width=s,e.clearRect(0,0,s,r),e.drawImage(t,0,0,t.width,t.height,0,0,s,r),{image:e.canvas,width:s,height:r})}(t,e,a,l),g=s+(a-f)/2,d=r+(l-p)/2;this._texture?.copyExternalImage({image:c,x:g,y:d,width:f,height:p}),n.x=g,n.y=d,n.width=f,n.height=p,this._texture&&C(this._texture),this.onUpdate(f!==a||p!==l)}).catch(e=>{this.onError({url:i.url,source:i.source,sourceIndex:i.sourceIndex,loadOptions:this._loadOptions,error:e})}).finally(()=>{this._pendingCount--})}}let S=[0,0,0,255],w={iconAtlas:{type:"image",value:null,async:!0},iconMapping:{type:"object",value:{},async:!0},sizeScale:{type:"number",value:1,min:0},billboard:!0,sizeUnits:"pixels",sizeBasis:"height",sizeMinPixels:{type:"number",min:0,value:0},sizeMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},alphaCutoff:{type:"number",value:.05,min:0,max:1},getPosition:{type:"accessor",value:e=>e.position},getIcon:{type:"accessor",value:e=>e.icon},getColor:{type:"accessor",value:S},getSize:{type:"accessor",value:1},getAngle:{type:"accessor",value:0},getPixelOffset:{type:"accessor",value:[0,0]},onIconError:{type:"function",value:null,optional:!0},textureParameters:{type:"object",ignore:!0,value:null}};class A extends o.A{getShaders(){let e=!!this.props.data?.attributes?.rowIndexes;return super.getShaders({vs:d,fs:h,source:u.replace("PICKING_COLOR_ATTRIBUTE",e?"@location(10) rowIndexes: u32,":"").replace("PICKING_COLOR_VALUE",e?"picking_getPickingColorFromIndex(inp.rowIndexes)":"picking_getPickingColorFromIndex(inp.instanceIndex)"),defines:e?{USE_ROW_INDEXES:!0}:{},modules:[n.A,s.A,r.Ay,g]})}initializeState(){this.state={iconManager:new b(this.context.device,{onUpdate:this._onUpdate.bind(this),onError:this._onError.bind(this)})},this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition"},instanceSizes:{size:1,transition:!0,bufferGroup:"icon-instance-data",accessor:"getSize",defaultValue:1},instanceIconDefs:{size:7,bufferGroup:"icon-instance-data",accessor:"getIcon",transform:this.getInstanceIconDef,shaderAttributes:{instanceOffsets:{size:2,elementOffset:0},instanceIconFrames:{size:4,elementOffset:2},instanceColorModes:{size:1,elementOffset:6}}},instanceColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,bufferGroup:"icon-instance-data",accessor:"getColor",defaultValue:S},instanceAngles:{size:1,transition:!0,bufferGroup:"icon-instance-data",accessor:"getAngle"},instancePixelOffset:{size:2,transition:!0,bufferGroup:"icon-instance-data",accessor:"getPixelOffset"},...this.props.data?.attributes?.rowIndexes?{rowIndexes:{size:1,type:"uint32",noAlloc:!0}}:{}})}updateState(e){super.updateState(e);let{props:t,oldProps:i,changeFlags:o}=e,n=this.getAttributeManager(),{iconAtlas:s,iconMapping:r,data:a,getIcon:l,textureParameters:c}=t,{iconManager:f}=this.state;if("string"==typeof s)return;let p=s||this.internalState.isAsyncPropLoading("iconAtlas");f.setProps({loadOptions:t.loadOptions,autoPacking:!p,iconAtlas:s,iconMapping:p?r:null,textureParameters:c}),p?i.iconMapping!==t.iconMapping&&n.invalidate("getIcon"):(o.dataChanged||o.updateTriggersChanged&&(o.updateTriggersChanged.all||o.updateTriggersChanged.getIcon))&&f.packIcons(a,l),o.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),n.invalidateAll())}get isLoaded(){return super.isLoaded&&this.state.iconManager.isLoaded}finalizeState(e){super.finalizeState(e),this.state.iconManager.finalize()}draw({uniforms:e}){this._drawModel(this.state.model)}_drawModel(e){let{sizeScale:t,sizeBasis:i,sizeMinPixels:o,sizeMaxPixels:n,sizeUnits:s,billboard:r,alphaCutoff:l}=this.props,{iconManager:c}=this.state,f=c.getTexture();if(f){let c={iconsTexture:f,iconsTextureDim:[f.width,f.height],sizeUnits:a.p5[s],sizeScale:t,sizeBasis:+("height"===i),sizeMinPixels:o,sizeMaxPixels:n,billboard:r,alphaCutoff:l};e.shaderInputs.setProps({icon:c}),e.draw(this.context.renderPass)}}_getModel(e=this.props.id){return new c.K(this.context.device,{...this.getShaders(),id:e,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new f.V({topology:"triangle-strip",attributes:{positions:{size:2,value:new Float32Array([-1,-1,1,-1,-1,1,1,1])}}}),isInstanced:!0})}_onUpdate(e){e?(this.getAttributeManager()?.invalidate("getIcon"),this.setNeedsUpdate()):this.setNeedsRedraw()}_onError(e){let t=this.getCurrentLayer()?.props.onIconError;t?t(e):l.A.error(e.error.message)()}getInstanceIconDef(e){let{x:t,y:i,width:o,height:n,mask:s,anchorX:r=o/2,anchorY:a=n/2}=this.state.iconManager.getIconMapping(e);return[o/2-r,n/2-a,t,i,o,n,+!!s]}}A.defaultProps=w,A.layerName="IconLayer";let E=A},19896(e,t,i){i.d(t,{A:()=>E});var o=i(41881),n=i(84175),s=i(46487),r=i(95335),a=i(41367),l=i(52948),c=i(9350),f=i(25337),p=i(95263),g=i(44941),d=i(76046),h=i(6423);class u extends g.A{constructor(e){super({...e,attributes:{positions:{size:3,padding:18,initialize:!0,type:e.fp64?Float64Array:Float32Array},segmentTypes:{size:1,type:e.isWebGPU?Float32Array:Uint8ClampedArray}}})}get(e){return this.attributes[e]}getPathSegmentIndices(e){let t=this.attributes.segmentTypes,i=this.vertexStarts[e],o=Math.min(this.vertexStarts[e+1]??this.instanceCount,this.instanceCount),n=[];for(let e=i;e<o-1;e++)(4&t[e])==0&&n.push(e);return n.length&&(4&t[i])!=0&&n.unshift(n.pop()),n}getGeometryFromBuffer(e){return this.normalize||this.opts.isWebGPU?super.getGeometryFromBuffer(e):null}normalizeGeometry(e){return this.normalize?function(e,t,i,o){let n;if(Array.isArray(e[0])){n=Array(e.length*t);for(let i=0;i<e.length;i++)for(let o=0;o<t;o++)n[i*t+o]=e[i][o]||0}else n=e;return i?(0,d.M)(n,{size:t,gridResolution:i}):o?(0,h.I)(n,{size:t}):n}(e,this.positionSize,this.opts.resolution,this.opts.wrapLongitude):e}getGeometrySize(e){if(v(e)){let t=0;for(let i of e)t+=this.getGeometrySize(i);return t}let t=this.getPathLength(e);return t<2?0:this.isClosed(e)?t<3?0:t+2:t}updateGeometryAttributes(e,t){if(0!==t.geometrySize)if(e&&v(e))for(let i of e){let e=this.getGeometrySize(i);t.geometrySize=e,this.updateGeometryAttributes(i,t),t.vertexStart+=e}else this._updateSegmentTypes(e,t),this._updatePositions(e,t)}_updateSegmentTypes(e,t){let i=this.attributes.segmentTypes,o=!!e&&this.isClosed(e),{vertexStart:n,geometrySize:s}=t;i.fill(0,n,n+s),o?(i[n]=4,i[n+s-2]=4):(i[n]+=1,i[n+s-2]+=2),i[n+s-1]=4}_updatePositions(e,t){let{positions:i}=this.attributes;if(!i||!e)return;let{vertexStart:o,geometrySize:n}=t,s=[,,,];for(let t=o,r=0;r<n;t++,r++)this.getPointOnPath(e,r,s),i[3*t]=s[0],i[3*t+1]=s[1],i[3*t+2]=s[2]}getPathLength(e){return e.length/this.positionSize}getPointOnPath(e,t,i=[]){let{positionSize:o}=this;t*o>=e.length&&(t+=1-e.length/o);let n=t*o;return i[0]=e[n],i[1]=e[n+1],i[2]=3===o&&e[n+2]||0,i}isClosed(e){if(!this.normalize)return!!this.opts.loop;let{positionSize:t}=this,i=e.length-t;return e[0]===e[i]&&e[1]===e[i+1]&&(2===t||e[2]===e[i+2])}}function v(e){return Array.isArray(e[0])}let x=`\
layout(std140) uniform pathUniforms {
  float widthScale;
  float widthMinPixels;
  float widthMaxPixels;
  float jointType;
  float capType;
  float miterLimit;
  bool billboard;
  highp int widthUnits;
} path;
`,m={name:"path",source:`\
struct PathUniforms {
  widthScale: f32,
  widthMinPixels: f32,
  widthMaxPixels: f32,
  jointType: f32,
  capType: f32,
  miterLimit: f32,
  billboard: f32,
  widthUnits: i32,
};

@group(0) @binding(auto)
var<uniform> path: PathUniforms;
`,vs:x,fs:x,uniformTypes:{widthScale:"f32",widthMinPixels:"f32",widthMaxPixels:"f32",jointType:"f32",capType:"f32",miterLimit:"f32",billboard:"f32",widthUnits:"i32"}},y=`\
const EPSILON: f32 = 0.001;
const ZERO_OFFSET: vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);

struct JoinResult {
  offset: vec3<f32>,
  cornerOffset: vec2<f32>,
  miterLength: f32,
  pathPosition: vec2<f32>,
  pathLength: f32,
  jointType: f32,
};

struct Attributes {
  @location(0) positions: vec2<f32>,
  @location(1) instanceTypes: f32,
  @location(2) instanceLeftPositions: vec3<f32>,
  @location(3) instanceStartPositions: vec3<f32>,
  @location(4) instanceEndPositions: vec3<f32>,
  @location(5) instanceRightPositions: vec3<f32>,
  @location(6) instanceLeftPositions64Low: vec3<f32>,
  @location(7) instanceStartPositions64Low: vec3<f32>,
  @location(8) instanceEndPositions64Low: vec3<f32>,
  @location(9) instanceRightPositions64Low: vec3<f32>,
  @location(10) instanceStrokeWidths: f32,
  @location(11) instanceColors: vec4<f32>,
  @location(12) rowIndexes: u32,
};

struct Varyings {
  @builtin(position) position: vec4<f32>,
  @location(0) vColor: vec4<f32>,
  @location(1) vCornerOffset: vec2<f32>,
  @location(2) vMiterLength: f32,
  @location(3) vPathPosition: vec2<f32>,
  @location(4) vPathLength: f32,
  @location(5) vJointType: f32,
  // Location 6 is reserved for TripsLayer's injected vTime varying.
  @location(7) clipCoordinates: vec2<f32>,
#ifdef DASH_ENABLED
  @location(8) vPathBounds: vec2<f32>,
#endif
};

fn flipIfTrue(flag: bool) -> f32 {
  return select(1.0, -1.0, flag);
}

fn clipLine(position: vec4<f32>, refPosition: vec4<f32>) -> vec4<f32> {
  if (position.w < EPSILON) {
    let r = (EPSILON - refPosition.w) / (position.w - refPosition.w);
    return refPosition + (position - refPosition) * r;
  }
  return position;
}

#ifdef DASH_ENABLED
// Return the visible interval of the original segment before clipLine moves either endpoint.
fn getClippedPathRange(startW: f32, endW: f32) -> vec2<f32> {
  let startClipped = startW < EPSILON;
  let endClipped = endW < EPSILON;
  if (startClipped && endClipped) {
    return vec2<f32>(0.0, 0.0);
  }
  if (startClipped || endClipped) {
    let intersection = clamp((EPSILON - startW) / (endW - startW), 0.0, 1.0);
    if (startClipped) {
      return vec2<f32>(intersection, 1.0);
    }
    return vec2<f32>(0.0, intersection);
  }
  return vec2<f32>(0.0, 1.0);
}
#endif

fn getLineJoinOffset(
  prevPoint: vec3<f32>,
  currPoint: vec3<f32>,
  nextPoint: vec3<f32>,
  width: vec2<f32>,
#ifdef DASH_ENABLED
  sourcePathLength: f32,
  sourcePathRange: vec2<f32>,
#endif
#ifdef ANTIALIASING
  coverageScale: f32,
#endif
  positions: vec2<f32>,
  instanceTypes: f32
) -> JoinResult {
  let isEnd = positions.x > 0.0;
  let sideOfPath = positions.y;
  let isJoint = select(0.0, 1.0, sideOfPath == 0.0);

  var deltaA3 = currPoint - prevPoint;
  var deltaB3 = nextPoint - currPoint;

  let rotationResult = project_needs_rotation(currPoint);
  if (path.billboard == 0.0 && rotationResult.needsRotation) {
    deltaA3 = rotationResult.transform * deltaA3;
    deltaB3 = rotationResult.transform * deltaB3;
  }

  let deltaA = deltaA3.xy / width;
  let deltaB = deltaB3.xy / width;

  let lenA = length(deltaA);
  let lenB = length(deltaB);

  let dirA = select(vec2<f32>(0.0, 0.0), normalize(deltaA), lenA > 0.0);
  let dirB = select(vec2<f32>(0.0, 0.0), normalize(deltaB), lenB > 0.0);

  let perpA = vec2<f32>(-dirA.y, dirA.x);
  let perpB = vec2<f32>(-dirB.y, dirB.x);

  var tangent = dirA + dirB;
  tangent = select(perpA, normalize(tangent), length(tangent) > 0.0);
  let miterVec = vec2<f32>(-tangent.y, tangent.x);
  let dir = select(dirB, dirA, isEnd);
  let perp = select(perpB, perpA, isEnd);
#ifdef DASH_ENABLED
  let segmentLength2D = select(lenB, lenA, isEnd);

  // Extrusion happens in the XY plane, so segmentLength2D is a 2D length and pathPosition.y
  // below measures 2D distance along the segment. For a path that also moves in Z the true
  // arc length is longer by this ratio. Scaling pathLength and pathPosition.y by it makes
  // the coordinate measure real 3D distance while leaving the joint tests unchanged, since
  // they compare the two against each other and both are scaled alike. Billboard mode
  // extrudes in clip space, where the perspective divide has already reduced the segment to
  // its screen projection, so its complete common-space length is supplied by the caller.
  // Mirrors path-layer-vertex.glsl.ts.
  let currDelta3 = select(deltaB3, deltaA3, isEnd);
  let currLength2D = length(currDelta3.xy);
  // Do not clamp a valid denominator to EPSILON: high-zoom Web Mercator deltas are often
  // smaller than that in common space, and changing their scale corrupts even flat paths.
  let safeLength2D = select(1.0, currLength2D, currLength2D > 0.0);
  var arcLengthRatio = 1.0;
  var pathPositionOffset = 0.0;
  var pathLength = segmentLength2D;
  if (path.billboard != 0.0) {
    // clipLine may shorten the visible screen-space segment. Preserve the corresponding interval
    // of the complete common-space arclength instead of compressing the full dash period into the
    // visible span. Keep pathLength complete so justification is stable as the camera clips it.
    let visiblePathLength = sourcePathLength * (sourcePathRange.y - sourcePathRange.x);
    arcLengthRatio = 0.0;
    if (segmentLength2D > 0.0) {
      arcLengthRatio = visiblePathLength / segmentLength2D;
    }
    pathPositionOffset = sourcePathLength * sourcePathRange.x;
    pathLength = sourcePathLength;
  } else if (currLength2D > 0.0) {
    arcLengthRatio = length(currDelta3) / safeLength2D;
    pathLength = segmentLength2D * arcLengthRatio;
  }
#else
  let pathLength = select(lenB, lenA, isEnd);
#endif

  let sinHalfA = abs(dot(miterVec, perp));
  let cosHalfA = abs(dot(dirA, miterVec));
  let turnDirection = flipIfTrue(dirA.x * dirB.y >= dirA.y * dirB.x);
  let cornerPosition = sideOfPath * turnDirection;

  var miterSize = 1.0 / max(sinHalfA, EPSILON);
  miterSize = mix(
    min(miterSize, max(lenA, lenB) / max(cosHalfA, EPSILON)),
    miterSize,
    step(0.0, cornerPosition)
  );

  var offsetVec =
    mix(miterVec * miterSize, perp, step(0.5, cornerPosition)) *
    (sideOfPath + isJoint * turnDirection);

  let isStartCap = lenA == 0.0 || (!isEnd && (instanceTypes == 1.0 || instanceTypes == 3.0));
  let isEndCap = lenB == 0.0 || (isEnd && (instanceTypes == 2.0 || instanceTypes == 3.0));
  let isCap = isStartCap || isEndCap;

  var jointType = path.jointType;
  if (isCap) {
    offsetVec = mix(
      perp * sideOfPath,
      dir * path.capType * 4.0 * flipIfTrue(isStartCap),
      isJoint
    );
    jointType = path.capType;
  }

#ifdef ANTIALIASING
  let coverageOffsetVec = offsetVec * coverageScale;
  var miterLength = dot(coverageOffsetVec, miterVec * turnDirection);
#else
  var miterLength = dot(offsetVec, miterVec * turnDirection);
#endif
  miterLength = select(miterLength, isJoint, isCap);

#ifdef ANTIALIASING
  let offsetFromStartOfPath = coverageOffsetVec + deltaA * select(0.0, 1.0, isEnd);
#else
  let offsetFromStartOfPath = offsetVec + deltaA * select(0.0, 1.0, isEnd);
#endif
  let pathPosition = vec2<f32>(
    dot(offsetFromStartOfPath, perp),
#ifdef DASH_ENABLED
    pathPositionOffset + dot(offsetFromStartOfPath, dir) * arcLengthRatio
#else
    dot(offsetFromStartOfPath, dir)
#endif
  );
  let isValid = step(f32(instanceTypes), 3.5);
#ifdef ANTIALIASING
  var offset = vec3<f32>(coverageOffsetVec * width * isValid, 0.0);
#else
  var offset = vec3<f32>(offsetVec * width * isValid, 0.0);
#endif

  if (path.billboard == 0.0 && rotationResult.needsRotation) {
    offset = rotationResult.transform * offset;
  }

#ifdef ANTIALIASING
  return JoinResult(
    offset, coverageOffsetVec, miterLength, pathPosition, pathLength, jointType
  );
#else
  return JoinResult(offset, offsetVec, miterLength, pathPosition, pathLength, jointType);
#endif
}

@vertex
fn vertexMain(attributes: Attributes) -> Varyings {
  var varyings: Varyings;

  geometry.pickingColor = picking_getPickingColorFromIndex(attributes.rowIndexes);

  let isEnd = attributes.positions.x;

  let prevPosition = mix(attributes.instanceLeftPositions, attributes.instanceStartPositions, isEnd);
  let prevPosition64Low = mix(
    attributes.instanceLeftPositions64Low,
    attributes.instanceStartPositions64Low,
    isEnd
  );
  let currPosition = mix(attributes.instanceStartPositions, attributes.instanceEndPositions, isEnd);
  let currPosition64Low = mix(
    attributes.instanceStartPositions64Low,
    attributes.instanceEndPositions64Low,
    isEnd
  );
  let nextPosition = mix(attributes.instanceEndPositions, attributes.instanceRightPositions, isEnd);
  let nextPosition64Low = mix(
    attributes.instanceEndPositions64Low,
    attributes.instanceRightPositions64Low,
    isEnd
  );

  geometry.worldPosition = currPosition;

  let widthPixels =
    clamp(
      project_unit_size_to_pixel(attributes.instanceStrokeWidths * path.widthScale, path.widthUnits),
      path.widthMinPixels,
      path.widthMaxPixels
    ) / 2.0;

  if (path.billboard != 0.0) {
#ifdef DASH_ENABLED
    let prevProjection = project_position_to_clipspace_and_commonspace(
      prevPosition, prevPosition64Low, ZERO_OFFSET
    );
    let nextProjection = project_position_to_clipspace_and_commonspace(
      nextPosition, nextPosition64Low, ZERO_OFFSET
    );
    let prevPositionCommon = prevProjection.commonPosition.xyz;
    let nextPositionCommon = nextProjection.commonPosition.xyz;
    var prevPositionScreen = prevProjection.clipPosition;
    var nextPositionScreen = nextProjection.clipPosition;
#else
    var prevPositionScreen = project_position_to_clipspace(
      prevPosition, prevPosition64Low, ZERO_OFFSET
    );
    var nextPositionScreen = project_position_to_clipspace(
      nextPosition, nextPosition64Low, ZERO_OFFSET
    );
#endif
    let currProjection = project_position_to_clipspace_and_commonspace(
      currPosition, currPosition64Low, ZERO_OFFSET
    );
    geometry.position = currProjection.commonPosition;
    var currPositionScreen = currProjection.clipPosition;
#ifdef DASH_ENABLED
    let currPositionCommon = currProjection.commonPosition.xyz;
    let sourcePathStartScreen = mix(currPositionScreen, prevPositionScreen, isEnd);
    let sourcePathEndScreen = mix(nextPositionScreen, currPositionScreen, isEnd);
    let billboardPathRange = getClippedPathRange(
      sourcePathStartScreen.w, sourcePathEndScreen.w
    );
#endif

    prevPositionScreen = clipLine(prevPositionScreen, currPositionScreen);
    nextPositionScreen = clipLine(nextPositionScreen, currPositionScreen);
    currPositionScreen = clipLine(currPositionScreen, mix(nextPositionScreen, prevPositionScreen, isEnd));

#ifdef ANTIALIASING
    let coverageScale = select(
      1.0,
      (widthPixels + 0.5 / project.devicePixelRatio) / max(widthPixels, 1e-6),
      widthPixels > 0.0
    );
#endif
#ifdef DASH_ENABLED
    let currentDeltaCommon = select(
      nextPositionCommon - currPositionCommon,
      currPositionCommon - prevPositionCommon,
      isEnd > 0.0
    );
    let billboardPathLength = select(
      0.0,
      length(currentDeltaCommon) * project.scale / (widthPixels * project.focalDistance),
      widthPixels > 0.0
    );
#endif
    let join = getLineJoinOffset(
      prevPositionScreen.xyz / prevPositionScreen.w,
      currPositionScreen.xyz / currPositionScreen.w,
      nextPositionScreen.xyz / nextPositionScreen.w,
      project_pixel_size_to_clipspace(vec2<f32>(widthPixels, widthPixels)),
#ifdef DASH_ENABLED
      billboardPathLength,
      billboardPathRange,
#endif
#ifdef ANTIALIASING
      coverageScale,
#endif
      attributes.positions,
      attributes.instanceTypes
    );
#ifdef DASH_ENABLED
    // Phase and justification use the complete source segment, while cap and joint coverage
    // must still recognize the endpoints moved by clipLine.
    varyings.vPathBounds = billboardPathLength * billboardPathRange;
#endif

    geometry.uv = join.pathPosition;
    varyings.position = vec4<f32>(
      currPositionScreen.xyz + join.offset * currPositionScreen.w,
      currPositionScreen.w
    );
    varyings.vCornerOffset = join.cornerOffset;
    varyings.vMiterLength = join.miterLength;
    varyings.vPathPosition = join.pathPosition;
    varyings.vPathLength = join.pathLength;
    varyings.vJointType = join.jointType;
  } else {
    let prevPositionCommon = project_position_vec3_f64(prevPosition, prevPosition64Low);
    let currPositionCommon = project_position_vec3_f64(currPosition, currPosition64Low);
    let nextPositionCommon = project_position_vec3_f64(nextPosition, nextPosition64Low);

    let width = vec2<f32>(
      project_pixel_size_float(widthPixels),
      project_pixel_size_float(widthPixels)
    );
#ifdef ANTIALIASING
    let coverageScale = select(
      1.0,
      (widthPixels + 0.5 / project.devicePixelRatio) / max(widthPixels, 1e-6),
      widthPixels > 0.0
    );
#endif
    let join = getLineJoinOffset(
      prevPositionCommon,
      currPositionCommon,
      nextPositionCommon,
      width,
#ifdef DASH_ENABLED
      1.0,
      vec2<f32>(0.0, 1.0),
#endif
#ifdef ANTIALIASING
      coverageScale,
#endif
      attributes.positions,
      attributes.instanceTypes
    );
#ifdef DASH_ENABLED
    varyings.vPathBounds = vec2<f32>(0.0, join.pathLength);
#endif

    geometry.position = vec4<f32>(currPositionCommon + join.offset, 1.0);
    geometry.uv = join.pathPosition;
    varyings.position = project_common_position_to_clipspace(geometry.position);
    varyings.vCornerOffset = join.cornerOffset;
    varyings.vMiterLength = join.miterLength;
    varyings.vPathPosition = join.pathPosition;
    varyings.vPathLength = join.pathLength;
    varyings.vJointType = join.jointType;
  }

  varyings.clipCoordinates = geometry.position.xy;
  clip_filterPosition(&varyings.position, geometry.worldPosition.xy);

  varyings.vColor = vec4<f32>(
    attributes.instanceColors.rgb,
    attributes.instanceColors.a * layer.opacity
  );
  return varyings;
}

@fragment
fn fragmentMain(varyings: Varyings) -> @location(0) vec4<f32> {
  geometry.uv = varyings.vPathPosition;

#ifdef ANTIALIASING
  // Coordinates of the outer silhouette, in units of half-width: rounded joints and caps are
  // bounded by the corner offset, everywhere else by the edge of the stroke. Dividing by the
  // screen-space derivative converts the distance to the boundary into device pixels, which stays
  // correct under perspective foreshortening and under extensions that rescale the stroke.
#ifdef DASH_ENABLED
  let isCorner =
    varyings.vPathPosition.y < varyings.vPathBounds.x ||
    varyings.vPathPosition.y > varyings.vPathBounds.y;
#else
  let isCorner = varyings.vPathPosition.y < 0.0 || varyings.vPathPosition.y > varyings.vPathLength;
#endif
  let isRound = varyings.vJointType > 0.5;

  // Distance to the silhouette in device pixels, from the derivative of the coordinate that
  // bounds it. Computed before the discards below: derivatives need uniform control flow and are
  // undefined after a discard in the quad. See dev-docs/RFCs/v9.4/analytic-antialiasing-rfc.md
  let bodyCoord = abs(varyings.vPathPosition.x);
  let cornerCoord = length(varyings.vCornerOffset);
  // Both evaluated so each derivative stays on one field across the corner/body boundary
  let bodyPixels = (1.0 - bodyCoord) / max(fwidth(bodyCoord), 1e-6);
  let cornerPixels = (1.0 - cornerCoord) / max(fwidth(cornerCoord), 1e-6);
#ifdef PATH_STYLE_OFFSET
  // Rounded corners still intersect the stroke-width envelope. Extensions may remap
  // vPathPosition.x independently of vCornerOffset, as PathStyleExtension does for offsets.
  let edgePixels = select(bodyPixels, min(cornerPixels, bodyPixels), isRound && isCorner);
#else
  let edgePixels = select(bodyPixels, cornerPixels, isRound && isCorner);
#endif

  // Fragments outside the coverage ramp must not write depth or picking colors.
  if (edgePixels <= -SMOOTH_EDGE_RADIUS) {
    discard;
  }

  if (isCorner) {
    if (!isRound && varyings.vMiterLength > path.miterLimit + 1.0) {
      discard;
    }
  }

  var color = varyings.vColor;

  // Feather one device pixel across the width only, before premultiplication. edgePixels is a
  // signed device-pixel distance and SMOOTH_EDGE_RADIUS is 0.5, so this ramps across one pixel.
  color.a *= smoothedge(0.0, edgePixels);
#else
#ifdef DASH_ENABLED
  if (
    varyings.vPathPosition.y < varyings.vPathBounds.x ||
    varyings.vPathPosition.y > varyings.vPathBounds.y
  ) {
#else
  if (
    varyings.vPathPosition.y < 0.0 ||
    varyings.vPathPosition.y > varyings.vPathLength
  ) {
#endif
    if (varyings.vJointType > 0.5 && length(varyings.vCornerOffset) > 1.0) {
      discard;
    }
    if (
      varyings.vJointType < 0.5 &&
      varyings.vMiterLength > path.miterLimit + 1.0
    ) {
      discard;
    }
  }
#endif

  // Fragment-layer injections that discard pixels must run after analytic coverage derivatives.
  // See TripsLayer, which rejects fragments outside of the active time window at this anchor.
  // DECKGL_FILTER_COLOR
  clip_filterColor(varyings.clipCoordinates);
#ifdef ANTIALIASING
  return deckgl_premultiplied_alpha(color);
#else
  return deckgl_premultiplied_alpha(varyings.vColor);
#endif
}
`,_=`\
#version 300 es
#define SHADER_NAME path-layer-vertex-shader
in vec2 positions;
in float instanceTypes;
in vec3 instanceStartPositions;
in vec3 instanceEndPositions;
in vec3 instanceLeftPositions;
in vec3 instanceRightPositions;
in vec3 instanceLeftPositions64Low;
in vec3 instanceStartPositions64Low;
in vec3 instanceEndPositions64Low;
in vec3 instanceRightPositions64Low;
in float instanceStrokeWidths;
in vec4 instanceColors;
in float rowIndexes;
uniform float opacity;
out vec4 vColor;
out vec2 vCornerOffset;
out float vMiterLength;
out vec2 vPathPosition;
out float vPathLength;
out float vJointType;
#ifdef DASH_ENABLED
out vec2 vPathBounds;
#endif
const float EPSILON = 0.001;
const vec3 ZERO_OFFSET = vec3(0.0);
float flipIfTrue(bool flag) {
return -(float(flag) * 2. - 1.);
}
vec3 getLineJoinOffset(
vec3 prevPoint, vec3 currPoint, vec3 nextPoint,
vec2 width
#ifdef DASH_ENABLED
, float sourcePathLength, vec2 sourcePathRange
#endif
#ifdef ANTIALIASING
, float coverageScale
#endif
) {
bool isEnd = positions.x > 0.0;
float sideOfPath = positions.y;
float isJoint = float(sideOfPath == 0.0);
vec3 deltaA3 = (currPoint - prevPoint);
vec3 deltaB3 = (nextPoint - currPoint);
mat3 rotationMatrix;
bool needsRotation = !path.billboard && project_needs_rotation(currPoint, rotationMatrix);
if (needsRotation) {
deltaA3 = deltaA3 * rotationMatrix;
deltaB3 = deltaB3 * rotationMatrix;
}
vec2 deltaA = deltaA3.xy / width;
vec2 deltaB = deltaB3.xy / width;
float lenA = length(deltaA);
float lenB = length(deltaB);
vec2 dirA = lenA > 0. ? normalize(deltaA) : vec2(0.0, 0.0);
vec2 dirB = lenB > 0. ? normalize(deltaB) : vec2(0.0, 0.0);
vec2 perpA = vec2(-dirA.y, dirA.x);
vec2 perpB = vec2(-dirB.y, dirB.x);
vec2 tangent = dirA + dirB;
tangent = length(tangent) > 0. ? normalize(tangent) : perpA;
vec2 miterVec = vec2(-tangent.y, tangent.x);
vec2 dir = isEnd ? dirA : dirB;
vec2 perp = isEnd ? perpA : perpB;
float L = isEnd ? lenA : lenB;
#ifdef DASH_ENABLED
vec3 currDelta3 = isEnd ? deltaA3 : deltaB3;
float currLength2D = length(currDelta3.xy);
float arcLengthRatio = 1.0;
float pathPositionOffset = 0.0;
float pathLength = L;
if (path.billboard) {
float visiblePathLength = sourcePathLength * (sourcePathRange.y - sourcePathRange.x);
arcLengthRatio = L > 0.0 ? visiblePathLength / L : 0.0;
pathPositionOffset = sourcePathLength * sourcePathRange.x;
pathLength = sourcePathLength;
} else if (currLength2D > 0.0) {
arcLengthRatio = length(currDelta3) / currLength2D;
pathLength = L * arcLengthRatio;
}
#endif
float sinHalfA = abs(dot(miterVec, perp));
float cosHalfA = abs(dot(dirA, miterVec));
float turnDirection = flipIfTrue(dirA.x * dirB.y >= dirA.y * dirB.x);
float cornerPosition = sideOfPath * turnDirection;
float miterSize = 1.0 / max(sinHalfA, EPSILON);
miterSize = mix(
min(miterSize, max(lenA, lenB) / max(cosHalfA, EPSILON)),
miterSize,
step(0.0, cornerPosition)
);
vec2 offsetVec = mix(miterVec * miterSize, perp, step(0.5, cornerPosition))
* (sideOfPath + isJoint * turnDirection);
bool isStartCap = lenA == 0.0 || (!isEnd && (instanceTypes == 1.0 || instanceTypes == 3.0));
bool isEndCap = lenB == 0.0 || (isEnd && (instanceTypes == 2.0 || instanceTypes == 3.0));
bool isCap = isStartCap || isEndCap;
if (isCap) {
offsetVec = mix(perp * sideOfPath, dir * path.capType * 4.0 * flipIfTrue(isStartCap), isJoint);
vJointType = path.capType;
} else {
vJointType = path.jointType;
}
#ifdef ANTIALIASING
vec2 coverageOffsetVec = offsetVec * coverageScale;
#ifdef DASH_ENABLED
vPathLength = pathLength;
#else
vPathLength = L;
#endif
vCornerOffset = coverageOffsetVec;
vMiterLength = dot(vCornerOffset, miterVec * turnDirection);
vMiterLength = isCap ? isJoint : vMiterLength;
vec2 offsetFromStartOfPath = coverageOffsetVec + deltaA * float(isEnd);
vPathPosition = vec2(
dot(offsetFromStartOfPath, perp),
#ifdef DASH_ENABLED
pathPositionOffset + dot(offsetFromStartOfPath, dir) * arcLengthRatio
#else
dot(offsetFromStartOfPath, dir)
#endif
);
geometry.uv = vPathPosition;
float isValid = step(instanceTypes, 3.5);
vec3 offset = vec3(coverageOffsetVec * width * isValid, 0.0);
#else
#ifdef DASH_ENABLED
vPathLength = pathLength;
#else
vPathLength = L;
#endif
vCornerOffset = offsetVec;
vMiterLength = dot(vCornerOffset, miterVec * turnDirection);
vMiterLength = isCap ? isJoint : vMiterLength;
vec2 offsetFromStartOfPath = vCornerOffset + deltaA * float(isEnd);
vPathPosition = vec2(
dot(offsetFromStartOfPath, perp),
#ifdef DASH_ENABLED
pathPositionOffset + dot(offsetFromStartOfPath, dir) * arcLengthRatio
#else
dot(offsetFromStartOfPath, dir)
#endif
);
geometry.uv = vPathPosition;
float isValid = step(instanceTypes, 3.5);
vec3 offset = vec3(offsetVec * width * isValid, 0.0);
#endif
if (needsRotation) {
offset = rotationMatrix * offset;
}
return offset;
}
void clipLine(inout vec4 position, vec4 refPosition) {
if (position.w < EPSILON) {
float r = (EPSILON - refPosition.w) / (position.w - refPosition.w);
position = refPosition + (position - refPosition) * r;
}
}
#ifdef DASH_ENABLED
vec2 getClippedPathRange(float startW, float endW) {
bool startClipped = startW < EPSILON;
bool endClipped = endW < EPSILON;
if (startClipped && endClipped) {
return vec2(0.0);
}
if (startClipped || endClipped) {
float intersection = clamp((EPSILON - startW) / (endW - startW), 0.0, 1.0);
return startClipped ? vec2(intersection, 1.0) : vec2(0.0, intersection);
}
return vec2(0.0, 1.0);
}
#endif
void main() {
geometry.pickingColor = picking_getPickingColorFromIndex(rowIndexes);
vColor = vec4(instanceColors.rgb, instanceColors.a * layer.opacity);
float isEnd = positions.x;
vec3 prevPosition = mix(instanceLeftPositions, instanceStartPositions, isEnd);
vec3 prevPosition64Low = mix(instanceLeftPositions64Low, instanceStartPositions64Low, isEnd);
vec3 currPosition = mix(instanceStartPositions, instanceEndPositions, isEnd);
vec3 currPosition64Low = mix(instanceStartPositions64Low, instanceEndPositions64Low, isEnd);
vec3 nextPosition = mix(instanceEndPositions, instanceRightPositions, isEnd);
vec3 nextPosition64Low = mix(instanceEndPositions64Low, instanceRightPositions64Low, isEnd);
geometry.worldPosition = currPosition;
vec2 widthPixels = vec2(clamp(
project_size_to_pixel(instanceStrokeWidths * path.widthScale, path.widthUnits),
path.widthMinPixels, path.widthMaxPixels) / 2.0);
vec3 width;
if (path.billboard) {
#ifdef DASH_ENABLED
vec4 prevPositionCommon;
vec4 nextPositionCommon;
vec4 prevPositionScreen = project_position_to_clipspace(
prevPosition, prevPosition64Low, ZERO_OFFSET, prevPositionCommon
);
#else
vec4 prevPositionScreen = project_position_to_clipspace(
prevPosition, prevPosition64Low, ZERO_OFFSET
);
#endif
vec4 currPositionScreen = project_position_to_clipspace(currPosition, currPosition64Low, ZERO_OFFSET, geometry.position);
#ifdef DASH_ENABLED
vec4 nextPositionScreen = project_position_to_clipspace(
nextPosition, nextPosition64Low, ZERO_OFFSET, nextPositionCommon
);
#else
vec4 nextPositionScreen = project_position_to_clipspace(
nextPosition, nextPosition64Low, ZERO_OFFSET
);
#endif
#ifdef DASH_ENABLED
vec4 sourcePathStartScreen = mix(currPositionScreen, prevPositionScreen, isEnd);
vec4 sourcePathEndScreen = mix(nextPositionScreen, currPositionScreen, isEnd);
vec2 billboardPathRange = getClippedPathRange(
sourcePathStartScreen.w, sourcePathEndScreen.w
);
#endif
clipLine(prevPositionScreen, currPositionScreen);
clipLine(nextPositionScreen, currPositionScreen);
clipLine(currPositionScreen, mix(nextPositionScreen, prevPositionScreen, isEnd));
width = vec3(widthPixels, 0.0);
DECKGL_FILTER_SIZE(width, geometry);
#ifdef ANTIALIASING
vec2 coveragePadding = vec2(0.5 / project.devicePixelRatio);
float coverageScale = length(width.xy) > 0.0
? length(width.xy + coveragePadding) / length(width.xy)
: 1.0;
#endif
#ifdef DASH_ENABLED
vec3 currentDeltaCommon = isEnd > 0.0
? geometry.position.xyz - prevPositionCommon.xyz
: nextPositionCommon.xyz - geometry.position.xyz;
float billboardPathLength = width.x > 0.0
? length(currentDeltaCommon) * project.scale / (width.x * project.focalDistance)
: 0.0;
#endif
vec3 offset = getLineJoinOffset(
prevPositionScreen.xyz / prevPositionScreen.w,
currPositionScreen.xyz / currPositionScreen.w,
nextPositionScreen.xyz / nextPositionScreen.w,
project_pixel_size_to_clipspace(width.xy)
#ifdef DASH_ENABLED
,
billboardPathLength, billboardPathRange
#endif
#ifdef ANTIALIASING
,
coverageScale
#endif
);
#ifdef DASH_ENABLED
vPathBounds = billboardPathLength * billboardPathRange;
#endif
DECKGL_FILTER_GL_POSITION(currPositionScreen, geometry);
gl_Position = vec4(currPositionScreen.xyz + offset * currPositionScreen.w, currPositionScreen.w);
} else {
prevPosition = project_position(prevPosition, prevPosition64Low);
currPosition = project_position(currPosition, currPosition64Low);
nextPosition = project_position(nextPosition, nextPosition64Low);
width = vec3(project_pixel_size(widthPixels), 0.0);
DECKGL_FILTER_SIZE(width, geometry);
#ifdef ANTIALIASING
vec2 coveragePadding = project_pixel_size(vec2(0.5 / project.devicePixelRatio));
float coverageScale = length(width.xy) > 0.0
? length(width.xy + coveragePadding) / length(width.xy)
: 1.0;
#endif
vec3 offset = getLineJoinOffset(
prevPosition, currPosition, nextPosition, width.xy
#ifdef DASH_ENABLED
, 1.0, vec2(0.0, 1.0)
#endif
#ifdef ANTIALIASING
, coverageScale
#endif
);
#ifdef DASH_ENABLED
vPathBounds = vec2(0.0, vPathLength);
#endif
geometry.position = vec4(currPosition + offset, 1.0);
gl_Position = project_common_position_to_clipspace(geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
}
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,P=`\
#version 300 es
#define SHADER_NAME path-layer-fragment-shader
precision highp float;
in vec4 vColor;
in vec2 vCornerOffset;
in float vMiterLength;
in vec2 vPathPosition;
in float vPathLength;
in float vJointType;
#ifdef DASH_ENABLED
in vec2 vPathBounds;
#endif
out vec4 fragColor;
void main(void) {
geometry.uv = vPathPosition;
#ifdef ANTIALIASING
#ifdef DASH_ENABLED
bool isCorner = vPathPosition.y < vPathBounds.x || vPathPosition.y > vPathBounds.y;
#else
bool isCorner = vPathPosition.y < 0.0 || vPathPosition.y > vPathLength;
#endif
bool isRound = vJointType > 0.5;
float bodyCoord = abs(vPathPosition.x);
float cornerCoord = length(vCornerOffset);
float bodyPixels = (1.0 - bodyCoord) / max(fwidth(bodyCoord), 1e-6);
float cornerPixels = (1.0 - cornerCoord) / max(fwidth(cornerCoord), 1e-6);
#ifdef PATH_STYLE_OFFSET
float edgePixels = isRound && isCorner ? min(cornerPixels, bodyPixels) : bodyPixels;
#else
float edgePixels = isRound && isCorner ? cornerPixels : bodyPixels;
#endif
if (edgePixels <= -SMOOTH_EDGE_RADIUS) {
discard;
}
if (isCorner) {
if (!isRound && vMiterLength > path.miterLimit + 1.0) {
discard;
}
}
fragColor = vColor;
fragColor.a *= smoothedge(0.0, edgePixels);
#else
#ifdef DASH_ENABLED
if (vPathPosition.y < vPathBounds.x || vPathPosition.y > vPathBounds.y) {
#else
if (vPathPosition.y < 0.0 || vPathPosition.y > vPathLength) {
#endif
if (vJointType > 0.5 && length(vCornerOffset) > 1.0) {
discard;
}
if (vJointType < 0.5 && vMiterLength > path.miterLimit + 1.0) {
discard;
}
}
fragColor = vColor;
#endif
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`;var C=i(86402);let L=[0,0,0,255],b={widthUnits:"meters",widthScale:{type:"number",min:0,value:1},widthMinPixels:{type:"number",min:0,value:0},widthMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},jointRounded:!1,capRounded:!1,miterLimit:{type:"number",min:0,value:4},antialiasing:!1,billboard:!1,_pathType:null,getPath:{type:"accessor",value:e=>e.path},getColor:{type:"accessor",value:L},getWidth:{type:"accessor",value:1},rounded:{deprecatedFor:["jointRounded","capRounded"]}},S={enter:(e,t)=>t.length?t.subarray(t.length-e.length):e};function w(e,t){return e===t||!!(e&&t&&e.length===t.length&&e.every((e,i)=>e===t[i]))}class A extends o.A{getShaders(){let{antialiasing:e}=this.props;return super.getShaders({vs:_,fs:P,source:y,defines:e?{ANTIALIASING:1}:{},modules:[n.A,s.A,r.Ay,m,..."webgpu"===this.context.device.type?[C.A]:[]]})}get wrapLongitude(){return!1}getBounds(){return"webgpu"===this.context.device.type?null:this.getAttributeManager()?.getBounds(["vertexPositions"])}getPathProjectionScale(e){let t=this.props.coordinateSystem;if(!this.getAttributeManager()?.getAttributes().instanceDashOffsets)return null;if(e instanceof a.A&&e.zoom>=12&&("default"===t||"lnglat"===t||"cartesian"===t)){let i=l.A.getUniforms({viewport:e,coordinateSystem:t,coordinateOrigin:this.props.coordinateOrigin,autoWrapLongitude:this.wrapLongitude});return[e.projectionMode,i.coordinateOrigin[1],i.commonOrigin[1],...i.commonUnitsPerWorldUnit,...i.commonUnitsPerWorldUnit2,i.commonUnitsPerMeter[2]]}let i=function(e){if(e.isGeospatial)return null;let{unitsPerMeter:t}=e.distanceScales;return[t[0],t[1],t[2]]}(e);return i?[e.projectionMode,...i]:[e.projectionMode]}shouldUpdateState(e){let{viewport:t}=this.context;return super.shouldUpdateState(e)||this.state?.tessellationResolution!==t.resolution||!w(this.state?.pathProjectionScale,this.getPathProjectionScale(t))}initializeState(){let e="webgpu"===this.context.device.type;this.getAttributeManager().addInstanced({...e?{pathPositions:{size:24,type:"float32",transition:!1,accessor:"getPath",update:this.calculateWebGPUPositions,shaderAttributes:{instanceLeftPositions:{size:3,elementOffset:0},instanceStartPositions:{size:3,elementOffset:3},instanceEndPositions:{size:3,elementOffset:6},instanceRightPositions:{size:3,elementOffset:9},instanceLeftPositions64Low:{size:3,elementOffset:12},instanceStartPositions64Low:{size:3,elementOffset:15},instanceEndPositions64Low:{size:3,elementOffset:18},instanceRightPositions64Low:{size:3,elementOffset:21}},noAlloc:!0}}:{vertexPositions:{size:3,vertexOffset:1,type:"float64",fp64:this.use64bitPositions(),transition:S,accessor:"getPath",update:this.calculatePositions,noAlloc:!0,shaderAttributes:{instanceLeftPositions:{vertexOffset:0},instanceStartPositions:{vertexOffset:1},instanceEndPositions:{vertexOffset:2},instanceRightPositions:{vertexOffset:3}}}},instanceTypes:{size:1,type:e?"float32":"uint8",update:this.calculateSegmentTypes,noAlloc:!0},instanceStrokeWidths:{size:1,accessor:"getWidth",transition:!e&&S,defaultValue:1,bufferGroup:"path-instance-data"},instanceColors:{size:this.props.colorFormat.length,type:"unorm8",accessor:"getColor",transition:!e&&S,defaultValue:L,bufferGroup:"path-instance-data"},rowIndexes:{size:1,type:"uint32",accessor:(e,{index:t})=>e&&e.__source?e.__source.index:t,bufferGroup:"path-instance-data"}}),this.setState({pathTesselator:new u({fp64:this.use64bitPositions(),isWebGPU:e}),tessellationResolution:this.context.viewport.resolution,pathProjectionScale:this.getPathProjectionScale(this.context.viewport)})}updateState(e){super.updateState(e);let{props:t,oldProps:i,changeFlags:o}=e,n=this.getAttributeManager(),{viewport:s}=this.context,r=this.state.tessellationResolution!==s.resolution,a=this.getPathProjectionScale(s),l=!w(this.state.pathProjectionScale,a),c=o.updateTriggersChanged&&(o.updateTriggersChanged.all||o.updateTriggersChanged.getPath)||t._pathType!==i._pathType||t.positionFormat!==i.positionFormat||t.wrapLongitude!==i.wrapLongitude||r;if(o.dataChanged||c){let{pathTesselator:e}=this.state,i=t.data.attributes||{};e.updateGeometry({data:t.data,geometryBuffer:i.getPath,buffers:i,normalize:!t._pathType,loop:"loop"===t._pathType,getGeometry:t.getPath,positionFormat:t.positionFormat,wrapLongitude:t.wrapLongitude,resolution:s.resolution,dataChanged:c?void 0:o.dataChanged}),this.setState({numInstances:e.instanceCount,startIndices:e.vertexStarts,tessellationResolution:s.resolution,pathProjectionScale:a}),!o.dataChanged||c?n.invalidateAll():l&&n.invalidate("instanceDashOffsets")}else l&&(this.setState({pathProjectionScale:a}),n.invalidate("instanceDashOffsets"));(o.extensionsChanged||t.antialiasing!==i.antialiasing)&&(this.state.model?.destroy(),this.state.model=this._getModel(),n.invalidateAll())}getPickingInfo(e){let t=super.getPickingInfo(e),{index:i}=t,o=this.props.data;return o[0]&&o[0].__source&&(t.object=o.find(e=>e.__source.index===i)),t}disablePickingIndex(e){let t=this.props.data;if(t[0]&&t[0].__source)for(let i=0;i<t.length;i++)t[i].__source.index===e&&this._disablePickingIndex(i);else super.disablePickingIndex(e)}draw({uniforms:e}){let{jointRounded:t,capRounded:i,billboard:o,miterLimit:n,widthUnits:s,widthScale:r,widthMinPixels:a,widthMaxPixels:l}=this.props,f=this.state.model,p={jointType:Number(t),capType:Number(i),billboard:o,widthUnits:c.p5[s],widthScale:r,miterLimit:n,widthMinPixels:a,widthMaxPixels:l};f.shaderInputs.setProps({path:p}),f.draw(this.context.renderPass)}_getModel(){return new p.K(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new f.V({topology:"triangle-list",attributes:{indices:new Uint16Array([0,1,2,1,4,2,1,3,4,3,5,4]),positions:{value:new Float32Array([0,0,0,-1,0,1,1,-1,1,1,1,0]),size:2}}}),isInstanced:!0})}calculatePositions(e){let{pathTesselator:t}=this.state;e.startIndices=t.vertexStarts,e.value=t.get("positions")}calculateSegmentTypes(e){let{pathTesselator:t}=this.state;e.startIndices=t.vertexStarts,e.value=t.get("segmentTypes")}calculateWebGPUPositions(e){let{pathTesselator:t}=this.state,i=t.get("positions");if(!i){e.value=null;return}let o=t.instanceCount,n=new Float32Array(24*o),s=[-1,0,1,2];for(let e=0;e<o;e++){let t=24*e;for(let r=0;r<4;r++){let a=e+s[r],l=t+3*r;for(let e=0;e<3;e++){let t=a>=0&&a<o?i[3*a+e]:0,s=Math.fround(t);n[l+e]=s,n[l+e+12]=t-s}}}e.startIndices=t.vertexStarts,e.value=n}}A.defaultProps=b,A.layerName="PathLayer";let E=A},26166(e,t,i){i.d(t,{A4:()=>l,$q:()=>h,S8:()=>p,Dt:()=>a});var o=i(55230);function n(e,t,i={}){return function(e,t={}){return Math.sign(function(e,t={}){let{start:i=0,end:o=e.length,plane:n="xy"}=t,r=t.size||2,a=0,l=s[n[0]],c=s[n[1]];for(let t=i,n=o-r;t<o;t+=r)a+=(e[t+l]-e[n+l])*(e[t+c]+e[n+c]),n=t;return a/2}(e,t))}(e,i)!==t&&(function(e,t){let{start:i=0,end:o=e.length,size:n=2}=t,s=(o-i)/n,r=Math.floor(s/2);for(let t=0;t<r;++t){let o=i+t*n,r=i+(s-1-t)*n;for(let t=0;t<n;++t){let i=e[o+t];e[o+t]=e[r+t],e[r+t]=i}}}(e,i),!0)}let s={x:0,y:1,z:2},r={isClosed:!0};function a(e){return"positions"in e?e.positions:e}function l(e){return"holeIndices"in e?e.holeIndices:null}function c(e,t,i,o,s){let a,l,c=t,f=i.length;for(let t=0;t<f;t++)for(let n=0;n<o;n++)e[c++]=i[t][n]||0;if(a=i[0],l=i[i.length-1],a[0]!==l[0]||a[1]!==l[1]||a[2]!==l[2])for(let t=0;t<o;t++)e[c++]=i[0][t]||0;return r.start=t,r.end=c,r.size=o,n(e,s,r),c}function f(e,t,i,o,s=0,a,l){let c=(a=a||i.length)-s;if(c<=0)return t;let p=t;for(let t=0;t<c;t++)e[p++]=i[s+t];if(!function(e,t,i,o){for(let n=0;n<t;n++)if(e[i+n]!==e[o-t+n])return!1;return!0}(i,o,s,a))for(let t=0;t<o;t++)e[p++]=i[s+t];return r.start=t,r.end=p,r.size=o,n(e,l,r),p}function p(e,t){var i,o=e;if(!Array.isArray(o=o&&o.positions||o)&&!ArrayBuffer.isView(o))throw Error("invalid polygon");let n=[],s=[];if("positions"in e){let{positions:i,holeIndices:o}=e;if(o){let e=0;for(let r=0;r<=o.length;r++)e=f(n,e,i,t,o[r-1],o[r],0===r?1:-1),s.push(e);return s.pop(),{positions:n,holeIndices:s}}e=i}if(!Array.isArray(e[0]))return f(n,0,e,t,0,n.length,1),n;if(!((i=e).length>=1&&i[0].length>=2&&Number.isFinite(i[0][0]))){let i=0;for(let[o,r]of e.entries())i=c(n,i,r,t,0===o?1:-1),s.push(i);return s.pop(),{positions:n,holeIndices:s}}return c(n,0,e,t,1),n}function g(e,t,i){let o=e.length/3,n=0;for(let s=0;s<o;s++){let r=(s+1)%o;n+=e[3*s+t]*e[3*r+i],n-=e[3*r+t]*e[3*s+i]}return Math.abs(n/2)}function d(e,t,i,o){let n=e.length/3;for(let s=0;s<n;s++){let n=3*s,r=e[n+0],a=e[n+1],l=e[n+2];e[n+t]=r,e[n+i]=a,e[n+o]=l}}function h(e,t,i,n){let s=l(e);s&&(s=s.map(e=>e/t));let r=a(e),c=n&&3===t;if(i){let e=r.length;r=r.slice();let o=[];for(let n=0;n<e;n+=t){o[0]=r[n],o[1]=r[n+1],c&&(o[2]=r[n+2]);let e=i(o);r[n]=e[0],r[n+1]=e[1],c&&(r[n+2]=e[2])}}if(c){let e=g(r,0,1),t=g(r,0,2),o=g(r,1,2);if(!e&&!t&&!o)return[];e>t&&e>o||(t>o?(i||(r=r.slice()),d(r,0,2,1)):(i||(r=r.slice()),d(r,2,0,1)))}return o(r,s,t)}},91844(e,t,i){i.d(t,{A:()=>T});var o=i(41881),n=i(84175),s=i(46487),r=i(98881),a=i(66925),l=i(38846),c=i(79439);let f={props:{},name:"gouraudMaterial",bindingLayout:[{name:"gouraudMaterial",group:3}],vs:l.l.replace("phongMaterial","gouraudMaterial"),fs:l.X.replace("phongMaterial","gouraudMaterial"),source:c.X.replaceAll("phongMaterial","gouraudMaterial"),defines:{LIGHTING_VERTEX:!0},dependencies:[a.x,r.$n],uniformTypes:{unlit:"i32",ambient:"f32",diffuse:"f32",shininess:"f32",specularColor:"vec3<f32>"},defaultUniforms:{unlit:!1,ambient:.35,diffuse:.6,shininess:32,specularColor:[38.25,38.25,38.25]},getUniforms:e=>({...f.defaultUniforms,...e})};var p=i(95335),g=i(95263),d=i(25337),h=i(26166),u=i(44941),v=i(76046),x=i(6423);class m extends u.A{constructor(e){let{fp64:t,IndexType:i=Uint32Array}=e;super({...e,attributes:{positions:{size:3,type:t?Float64Array:Float32Array},vertexValid:{type:Uint16Array,size:1},indices:{type:i,size:1}}})}get(e){let{attributes:t}=this;return"indices"===e?t.indices&&t.indices.subarray(0,this.vertexCount):t[e]}updateGeometry(e){super.updateGeometry(e);let t=this.buffers.indices;if(t)this.vertexCount=(t.value||t).length;else if(this.data&&!this.getGeometry)throw Error("missing indices buffer")}normalizeGeometry(e){if(this.normalize){let t=h.S8(e,this.positionSize);return this.opts.resolution?(0,v.w)(h.Dt(t),h.A4(t),{size:this.positionSize,gridResolution:this.opts.resolution,edgeTypes:!0}):this.opts.wrapLongitude?(0,x.E)(h.Dt(t),h.A4(t),{size:this.positionSize,maxLatitude:86,edgeTypes:!0}):t}return e}getGeometrySize(e){if(y(e)){let t=0;for(let i of e)t+=this.getGeometrySize(i);return t}return h.Dt(e).length/this.positionSize}getGeometryFromBuffer(e){return this.normalize||!this.buffers.indices?super.getGeometryFromBuffer(e):null}updateGeometryAttributes(e,t){if(e&&y(e))for(let i of e){let e=this.getGeometrySize(i);t.geometrySize=e,this.updateGeometryAttributes(i,t),t.vertexStart+=e,t.indexStart=this.indexStarts[t.geometryIndex+1]}else this._updateIndices(e,t),this._updatePositions(e,t),this._updateVertexValid(e,t)}_updateIndices(e,{geometryIndex:t,vertexStart:i,indexStart:o}){let{attributes:n,indexStarts:s,typedArrayManager:r}=this,a=n.indices;if(!a||!e)return;let l=o,c=h.$q(e,this.positionSize,this.opts.preproject,this.opts.full3d);a=r.allocate(a,o+c.length,{copy:!0});for(let e=0;e<c.length;e++)a[l++]=c[e]+i;s[t+1]=o+c.length,n.indices=a}_updatePositions(e,{vertexStart:t,geometrySize:i}){let{attributes:{positions:o},positionSize:n}=this;if(!o||!e)return;let s=h.Dt(e);for(let e=t,r=0;r<i;e++,r++){let t=s[r*n],i=s[r*n+1],a=n>2?s[r*n+2]:0;o[3*e]=t,o[3*e+1]=i,o[3*e+2]=a}}_updateVertexValid(e,{vertexStart:t,geometrySize:i}){let{positionSize:o}=this,n=this.attributes.vertexValid,s=e&&h.A4(e);if(e&&e.edgeTypes?n.set(e.edgeTypes,t):n.fill(1,t,t+i),s)for(let e=0;e<s.length;e++)n[t+s[e]/o-1]=0;n[t+i-1]=0}}function y(e){return Array.isArray(e)&&e.length>0&&!Number.isFinite(e[0])}let _=`\
layout(std140) uniform solidPolygonUniforms {
  bool extruded;
  bool isWireframe;
  float elevationScale;
} solidPolygon;
`,P={name:"solidPolygon",source:`\
struct SolidPolygonUniforms {
  extruded: f32,
  isWireframe: f32,
  elevationScale: f32,
};

@group(0) @binding(auto) var<uniform> solidPolygon: SolidPolygonUniforms;
`,vs:_,fs:_,uniformTypes:{extruded:"f32",isWireframe:"f32",elevationScale:"f32"}},C=`\
in vec4 fillColors;
in vec4 lineColors;
in float rowIndexes;
out vec4 vColor;
struct PolygonProps {
vec3 positions;
vec3 positions64Low;
vec3 normal;
float elevations;
};
vec3 project_offset_normal(vec3 vector) {
if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT ||
project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT_OFFSETS) {
return normalize(vector * project.commonUnitsPerWorldUnit);
}
return project_normal(vector);
}
void calculatePosition(PolygonProps props) {
vec3 pos = props.positions;
vec3 pos64Low = props.positions64Low;
vec3 normal = props.normal;
vec4 colors = solidPolygon.isWireframe ? lineColors : fillColors;
geometry.worldPosition = props.positions;
geometry.pickingColor = picking_getPickingColorFromIndex(rowIndexes);
if (solidPolygon.extruded) {
pos.z += props.elevations * solidPolygon.elevationScale;
}
gl_Position = project_position_to_clipspace(pos, pos64Low, vec3(0.), geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
if (solidPolygon.extruded) {
#ifdef IS_SIDE_VERTEX
normal = project_offset_normal(normal);
#else
normal = project_normal(normal);
#endif
geometry.normal = normal;
vec3 lightColor = lighting_getLightColor(colors.rgb, project.cameraPosition, geometry.position.xyz, geometry.normal);
vColor = vec4(lightColor, colors.a * layer.opacity);
} else {
vColor = vec4(colors.rgb, colors.a * layer.opacity);
}
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,L=`\
#version 300 es
#define SHADER_NAME solid-polygon-layer-vertex-shader
in vec3 vertexPositions;
in vec3 vertexPositions64Low;
in float elevations;
${C}
void main(void) {
PolygonProps props;
props.positions = vertexPositions;
props.positions64Low = vertexPositions64Low;
props.elevations = elevations;
props.normal = vec3(0.0, 0.0, 1.0);
calculatePosition(props);
}
`,b=`\
#version 300 es
#define SHADER_NAME solid-polygon-layer-vertex-shader-side
#define IS_SIDE_VERTEX
in vec2 positions;
in vec3 vertexPositions;
in vec3 nextVertexPositions;
in vec3 vertexPositions64Low;
in vec3 nextVertexPositions64Low;
in float elevations;
in float instanceVertexValid;
${C}
void main(void) {
if(instanceVertexValid < 0.5){
gl_Position = vec4(0.);
return;
}
PolygonProps props;
vec3 pos;
vec3 pos64Low;
vec3 nextPos;
vec3 nextPos64Low;
#if RING_WINDING_ORDER_CW == 1
pos = vertexPositions;
pos64Low = vertexPositions64Low;
nextPos = nextVertexPositions;
nextPos64Low = nextVertexPositions64Low;
#else
pos = nextVertexPositions;
pos64Low = nextVertexPositions64Low;
nextPos = vertexPositions;
nextPos64Low = vertexPositions64Low;
#endif
props.positions = mix(pos, nextPos, positions.x);
props.positions64Low = mix(pos64Low, nextPos64Low, positions.x);
props.normal = vec3(
pos.y - nextPos.y + (pos64Low.y - nextPos64Low.y),
nextPos.x - pos.x + (nextPos64Low.x - pos64Low.x),
0.0);
props.elevations = elevations * positions.y;
calculatePosition(props);
}
`,S=`\
#version 300 es
#define SHADER_NAME solid-polygon-layer-fragment-shader
precision highp float;
in vec4 vColor;
out vec4 fragColor;
void main(void) {
fragColor = vColor;
geometry.uv = vec2(0.);
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`;function w(){return`\
fn project_offset_normal(vector: vec3<f32>) -> vec3<f32> {
  if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT ||
      project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT_OFFSETS) {
    return normalize(vector * project.commonUnitsPerWorldUnit);
  }
  return project_normal(vector);
}

fn apply_polygon_color(
  colors: vec4<f32>,
  normal: vec3<f32>,
  position: vec4<f32>
) -> vec4<f32> {
  if (solidPolygon.extruded > 0.5) {
    let lightColor = lighting_getLightColor2(
      colors.rgb,
      project.cameraPosition,
      position.xyz,
      normal
    );
    return vec4<f32>(lightColor, colors.a * layer.opacity);
  }
  return vec4<f32>(colors.rgb, colors.a * layer.opacity);
}
`}function A(){return`\
@fragment
fn fragmentMain(inp: Varyings) -> @location(0) vec4<f32> {
  geometry.uv = vec2<f32>(0.0, 0.0);

  clip_filterColor(inp.clipCoordinates);

  if (picking.isActive > 0.5) {
    if (!picking_isColorValid(inp.pickingColor)) {
      discard;
    }
    return vec4<f32>(inp.pickingColor, 1.0);
  }

  var fragColor = inp.vColor;

  if (picking.isHighlightActive > 0.5) {
    let highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
    if (picking_isColorZero(abs(inp.pickingColor - highlightedObjectColor))) {
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
`}var E=i(86402);let z=[0,0,0,255],I={enter:(e,t)=>t.length?t.subarray(t.length-e.length):e};class O extends o.A{getShaders(e){var t;let i=this.props._normalize||"CCW"!==this.props._windingOrder?1:0;return super.getShaders({vs:"top"===e?L:b,fs:S,source:(t=!!i,"top"===e?`\
${w()}

struct Attributes {
  @location(0) vertexPositions: vec3<f32>,
  @location(1) vertexPositions64Low: vec3<f32>,
  @location(2) elevations: f32,
  @location(3) fillColors: vec4<f32>,
  @location(4) lineColors: vec4<f32>,
  @location(5) rowIndexes: u32,
};

struct Varyings {
  @builtin(position) position: vec4<f32>,
  @location(0) vColor: vec4<f32>,
  @location(1) pickingColor: vec3<f32>,
  @location(2) clipCoordinates: vec2<f32>,
};

@vertex
fn vertexMain(attributes: Attributes) -> Varyings {
  var outp: Varyings;

  var pos = attributes.vertexPositions;
  if (solidPolygon.extruded > 0.5) {
    pos.z += attributes.elevations * solidPolygon.elevationScale;
  }

  geometry.worldPosition = attributes.vertexPositions;
  geometry.pickingColor = picking_getPickingColorFromIndex(attributes.rowIndexes);

  let projectedPosition = project_position_to_clipspace_and_commonspace(
    pos,
    attributes.vertexPositions64Low,
    vec3<f32>(0.0)
  );
  geometry.position = projectedPosition.commonPosition;
  outp.position = projectedPosition.clipPosition;

  let normal = project_normal(vec3<f32>(0.0, 0.0, 1.0));
  geometry.normal = normal;

  let colors = select(
    attributes.fillColors,
    attributes.lineColors,
    solidPolygon.isWireframe > 0.5
  );
  outp.vColor = apply_polygon_color(colors, normal, geometry.position);
  outp.pickingColor = geometry.pickingColor;

  outp.clipCoordinates = geometry.position.xy;
  clip_filterPosition(&outp.position, geometry.worldPosition.xy);

  return outp;
}

${A()}
`:`\
const RING_WINDING_ORDER_CW: bool = ${t?"true":"false"};

${w()}

struct Attributes {
  @location(0) positions: vec2<f32>,
  @location(1) vertexPositions: vec3<f32>,
  @location(2) vertexPositions64Low: vec3<f32>,
  @location(3) nextVertexPositions: vec3<f32>,
  @location(4) nextVertexPositions64Low: vec3<f32>,
  @location(5) vertexValid: f32,
  @location(6) elevations: f32,
  @location(7) fillColors: vec4<f32>,
  @location(8) lineColors: vec4<f32>,
  @location(9) rowIndexes: u32,
};

struct Varyings {
  @builtin(position) position: vec4<f32>,
  @location(0) vColor: vec4<f32>,
  @location(1) pickingColor: vec3<f32>,
  @location(2) clipCoordinates: vec2<f32>,
};

@vertex
fn vertexMain(attributes: Attributes) -> Varyings {
  var outp: Varyings;
  outp.position = vec4<f32>(0.0);
  outp.vColor = vec4<f32>(0.0);
  outp.pickingColor = picking_getPickingColorFromIndex(attributes.rowIndexes);
  outp.clipCoordinates = vec2<f32>(0.0);

  if (attributes.vertexValid < 0.5) {
    return outp;
  }

  let pos = select(attributes.nextVertexPositions, attributes.vertexPositions, RING_WINDING_ORDER_CW);
  let pos64Low = select(
    attributes.nextVertexPositions64Low,
    attributes.vertexPositions64Low,
    RING_WINDING_ORDER_CW
  );
  let nextPos = select(attributes.vertexPositions, attributes.nextVertexPositions, RING_WINDING_ORDER_CW);
  let nextPos64Low = select(
    attributes.vertexPositions64Low,
    attributes.nextVertexPositions64Low,
    RING_WINDING_ORDER_CW
  );

  let position = mix(pos, nextPos, attributes.positions.x);
  let position64Low = mix(pos64Low, nextPos64Low, attributes.positions.x);

  var worldPosition = position;
  if (solidPolygon.extruded > 0.5) {
    worldPosition.z += attributes.elevations * attributes.positions.y * solidPolygon.elevationScale;
  }

  geometry.worldPosition = position;
  geometry.pickingColor = picking_getPickingColorFromIndex(attributes.rowIndexes);

  let projectedPosition = project_position_to_clipspace_and_commonspace(
    worldPosition,
    position64Low,
    vec3<f32>(0.0)
  );
  geometry.position = projectedPosition.commonPosition;
  outp.position = projectedPosition.clipPosition;

  let normal = project_offset_normal(vec3<f32>(
    pos.y - nextPos.y + (pos64Low.y - nextPos64Low.y),
    nextPos.x - pos.x + (nextPos64Low.x - pos64Low.x),
    0.0
  ));
  geometry.normal = normal;

  let colors = select(
    attributes.fillColors,
    attributes.lineColors,
    solidPolygon.isWireframe > 0.5
  );
  outp.vColor = apply_polygon_color(colors, normal, geometry.position);
  outp.pickingColor = geometry.pickingColor;

  outp.clipCoordinates = geometry.position.xy;
  clip_filterPosition(&outp.position, geometry.worldPosition.xy);

  return outp;
}

${A()}
`),defines:{RING_WINDING_ORDER_CW:i},modules:[n.A,s.A,f,p.Ay,P,..."webgpu"===this.context.device.type?[E.A]:[]]})}get wrapLongitude(){return!1}getBounds(){return this.getAttributeManager()?.getBounds(["vertexPositions"])}initializeState(){let e,{viewport:t}=this.context,{coordinateSystem:i}=this.props,{_full3d:o}=this.props;t.isGeospatial&&"default"===i&&(i="lnglat"),"lnglat"===i&&(e=o?t.projectPosition.bind(t):t.projectFlat.bind(t)),this.setState({numInstances:0,polygonTesselator:new m({preproject:e,fp64:this.use64bitPositions(),IndexType:Uint32Array})});let n=this.getAttributeManager(),s="webgpu"===this.context.device.type;n.add({indices:{size:1,isIndexed:!0,update:this.calculateIndices,noAlloc:!0},vertexPositions:{size:3,type:"float64",stepMode:"dynamic",fp64:this.use64bitPositions(),transition:I,accessor:"getPolygon",update:this.calculatePositions,noAlloc:!0,...s?{}:{shaderAttributes:{nextVertexPositions:{vertexOffset:1}}}},...s?{nextVertexPositions:{size:3,type:"float64",stepMode:"dynamic",fp64:this.use64bitPositions(),transition:!1,update:this.calculateNextPositions,noAlloc:!0}}:{},[s?"vertexValid":"instanceVertexValid"]:{size:1,type:s?"float32":"uint16",stepMode:"instance",update:this.calculateVertexValid,noAlloc:!0},elevations:{size:1,stepMode:"dynamic",transition:I,accessor:"getElevation",bufferGroup:"solid-polygon-instance-data"},fillColors:{size:this.props.colorFormat.length,type:"unorm8",stepMode:"dynamic",transition:I,accessor:"getFillColor",defaultValue:z,bufferGroup:"solid-polygon-instance-data"},lineColors:{size:this.props.colorFormat.length,type:"unorm8",stepMode:"dynamic",transition:I,accessor:"getLineColor",defaultValue:z,bufferGroup:"solid-polygon-instance-data"},rowIndexes:{size:1,type:"uint32",stepMode:"dynamic",accessor:(e,{index:t})=>e&&e.__source?e.__source.index:t,bufferGroup:"solid-polygon-instance-data"}})}getPickingInfo(e){let t=super.getPickingInfo(e),{index:i}=t,o=this.props.data;return o[0]&&o[0].__source&&(t.object=o.find(e=>e.__source.index===i)),t}disablePickingIndex(e){let t=this.props.data;if(t[0]&&t[0].__source)for(let i=0;i<t.length;i++)t[i].__source.index===e&&this._disablePickingIndex(i);else super.disablePickingIndex(e)}draw({uniforms:e}){let{extruded:t,filled:i,wireframe:o,elevationScale:n}=this.props,{topModel:s,sideModel:r,wireframeModel:a,polygonTesselator:l}=this.state,c={extruded:!!t,elevationScale:n,isWireframe:!1};a&&o&&(a.setInstanceCount(l.instanceCount-1),a.shaderInputs.setProps({solidPolygon:{...c,isWireframe:!0}}),a.draw(this.context.renderPass)),r&&i&&(r.setInstanceCount(l.instanceCount-1),r.shaderInputs.setProps({solidPolygon:c}),r.draw(this.context.renderPass)),s&&i&&(s.setVertexCount(l.vertexCount),s.shaderInputs.setProps({solidPolygon:c}),s.draw(this.context.renderPass))}updateState(e){super.updateState(e),this.updateGeometry(e);let{props:t,oldProps:i,changeFlags:o}=e,n=this.getAttributeManager();(o.extensionsChanged||t.filled!==i.filled||t.extruded!==i.extruded)&&(this.state.models?.forEach(e=>e.destroy()),this.setState(this._getModels()),n.invalidateAll())}updateGeometry({props:e,oldProps:t,changeFlags:i}){if(i.dataChanged||i.updateTriggersChanged&&(i.updateTriggersChanged.all||i.updateTriggersChanged.getPolygon)){let{polygonTesselator:t}=this.state,o=e.data.attributes||{};t.updateGeometry({data:e.data,normalize:e._normalize,geometryBuffer:o.getPolygon,buffers:"webgpu"===this.context.device.type?{...o}:o,getGeometry:e.getPolygon,positionFormat:e.positionFormat,wrapLongitude:e.wrapLongitude,resolution:this.context.viewport.resolution,fp64:this.use64bitPositions(),dataChanged:i.dataChanged,full3d:e._full3d}),this.setState({numInstances:t.instanceCount,startIndices:t.vertexStarts}),i.dataChanged||this.getAttributeManager().invalidateAll()}}_getModels(){let e,t,i,{id:o,filled:n,extruded:s}=this.props;if(n){let t=this.getShaders("top");t.defines={...t.defines,NON_INSTANCED_MODEL:1};let i=this.getAttributeManager().getBufferLayouts({isInstanced:!1});"webgpu"===this.context.device.type&&(i=i.filter(e=>"indices"!==e.name&&"vertexValid"!==e.name&&"instanceVertexValid"!==e.name&&"nextVertexPositions"!==e.name)),e=new g.K(this.context.device,{...t,id:`${o}-top`,topology:"triangle-list",bufferLayout:i,isIndexed:!0,userData:{excludeAttributes:{vertexValid:!0,instanceVertexValid:!0,nextVertexPositions:!0}}})}if(s){let e=this.getAttributeManager().getBufferLayouts({isInstanced:!0});"webgpu"===this.context.device.type&&(e=e.filter(e=>"indices"!==e.name)),t=new g.K(this.context.device,{...this.getShaders("side"),id:`${o}-side`,bufferLayout:e,geometry:new d.V({topology:"triangle-strip",attributes:{positions:{size:2,value:new Float32Array([1,0,0,0,1,1,0,1])}}}),isInstanced:!0,userData:{excludeAttributes:{indices:!0}}}),i=new g.K(this.context.device,{...this.getShaders("side"),id:`${o}-wireframe`,bufferLayout:e,geometry:new d.V({topology:"line-strip",attributes:{positions:{size:2,value:new Float32Array([1,0,0,0,0,1,1,1])}}}),isInstanced:!0,userData:{excludeAttributes:{indices:!0}}})}return{models:[t,i,e].filter(Boolean),topModel:e,sideModel:t,wireframeModel:i}}calculateIndices(e){let{polygonTesselator:t}=this.state;e.startIndices=t.indexStarts,e.value=t.get("indices")}calculatePositions(e){let{polygonTesselator:t}=this.state;e.startIndices=t.vertexStarts;let i=this.props.data.attributes?.getPolygon;if("webgpu"===this.context.device.type&&ArrayBuffer.isView(i?.value)){let{value:o,size:n=3,offset:s=0,stride:r}=i,a=s/o.BYTES_PER_ELEMENT,l=r?r/o.BYTES_PER_ELEMENT:n,c=new Float64Array(3*t.instanceCount);for(let e=0;e<t.instanceCount;e++){let t=a+e*l,i=3*e;c[i]=o[t],c[i+1]=o[t+1],c[i+2]=n>2?o[t+2]:0}e.value=c;return}e.value=t.get("positions")}calculateVertexValid(e){let t=this.props.data.attributes?.instanceVertexValid?.value,i="webgpu"===this.context.device.type&&t?t:this.state.polygonTesselator.get("vertexValid");e.value="webgpu"===this.context.device.type&&i?Float32Array.from(i):i}calculateNextPositions(e){let{polygonTesselator:t}=this.state,i=this.getAttributeManager().getAttributes(),o=i.vertexPositions.value,n=this.props.data.attributes?.instanceVertexValid?.value||i.vertexValid?.value||t.get("vertexValid");if(e.startIndices=t.vertexStarts,!o){e.value=o;return}let s=o.length/3,r=new o.constructor(o.length);for(let e=0;e<s;e++){let t=3*e,i=n?.[e]&&e+1<s?t+3:t;for(let e=0;e<3;e++)r[t+e]=o[i+e]}e.value=r}}O.defaultProps={filled:!0,extruded:!1,wireframe:!1,_normalize:!0,_windingOrder:"CW",_full3d:!1,elevationScale:{type:"number",min:0,value:1},getPolygon:{type:"accessor",value:e=>e.polygon},getElevation:{type:"accessor",value:1e3},getFillColor:{type:"accessor",value:z},getLineColor:{type:"accessor",value:z},material:!0},O.layerName="SolidPolygonLayer";let T=O},46429(e,t,i){i.d(t,{A:()=>$});var o=i(59452),n=i(3459),s=i(53439),r=i(86982);let a=`\
layout(std140) uniform sdfUniforms {
  float gamma;
  bool enabled;
  float buffer;
  float outlineBuffer;
  vec4 outlineColor;
} sdf;
`,l={name:"sdf",vs:a,fs:a,uniformTypes:{gamma:"f32",enabled:"f32",buffer:"f32",outlineBuffer:"f32",outlineColor:"vec4<f32>"}},c={none:0,start:1,center:2,end:3},f={name:"text",vs:`\
layout(std140) uniform textUniforms {
  highp vec2 cutoffPixels;
  highp ivec2 align;
  highp float fontSize;
  bool flipY;
} text;

#define ALIGN_MODE_START ${c.start}
#define ALIGN_MODE_CENTER ${c.center}
#define ALIGN_MODE_END ${c.end}
`,getUniforms:({contentCutoffPixels:e=[0,0],contentAlignHorizontal:t="none",contentAlignVertical:i="none",fontSize:o,viewport:n})=>({cutoffPixels:e,align:[c[t],c[i]],fontSize:o,flipY:n?.flipY??!1}),uniformTypes:{cutoffPixels:"vec2<f32>",align:"vec2<i32>",fontSize:"f32",flipY:"f32"}},p=`\
#version 300 es
#define SHADER_NAME multi-icon-layer-vertex-shader
in vec2 positions;
in vec3 instancePositions;
in vec3 instancePositions64Low;
in float instanceSizes;
in float instanceAngles;
in vec4 instanceColors;
in float rowIndexes;
in vec4 instanceIconFrames;
in float instanceColorModes;
in vec2 instanceOffsets;
in vec2 instancePixelOffset;
in vec4 instanceClipRect;
out float vColorMode;
out vec4 vColor;
out vec2 vTextureCoords;
out vec2 uv;
vec2 rotate_by_angle(vec2 vertex, float angle) {
float angle_radian = angle * PI / 180.0;
float cos_angle = cos(angle_radian);
float sin_angle = sin(angle_radian);
mat2 rotationMatrix = mat2(cos_angle, -sin_angle, sin_angle, cos_angle);
return rotationMatrix * vertex;
}
float getPixelOffsetFromAlignment(float anchor, float extent, float clipStart, float clipEnd, int mode) {
if (clipEnd < clipStart) return 0.0;
if (mode == ALIGN_MODE_START) {
return max(- (anchor + clipStart), 0.0);
}
if (mode == ALIGN_MODE_CENTER) {
float _min = max(0., anchor + clipStart);
float _max = min(extent, anchor + clipEnd);
return _min < _max ? (_min + _max) / 2.0 - anchor : 0.0;
}
if (mode == ALIGN_MODE_END) {
return min(extent - (anchor + clipEnd), 0.);
}
return 0.0;
}
void main(void) {
geometry.worldPosition = instancePositions;
geometry.uv = positions;
geometry.pickingColor = picking_getPickingColorFromIndex(rowIndexes);
uv = positions;
vec2 iconSize = instanceIconFrames.zw;
float sizePixels = clamp(
project_size_to_pixel(instanceSizes * icon.sizeScale, icon.sizeUnits),
icon.sizeMinPixels, icon.sizeMaxPixels
);
float instanceScale = sizePixels / text.fontSize;
vec2 pixelOffset = positions / 2.0 * iconSize + instanceOffsets;
pixelOffset = rotate_by_angle(pixelOffset, instanceAngles) * instanceScale;
pixelOffset += instancePixelOffset;
pixelOffset.y *= -1.0;
vec2 anchorPosScreen;
if (icon.billboard)  {
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0), geometry.position);
anchorPosScreen = gl_Position.xy / gl_Position.w;
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
vec3 offset = vec3(pixelOffset, 0.0);
DECKGL_FILTER_SIZE(offset, geometry);
gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);
} else {
vec3 offset_common = vec3(project_pixel_size(pixelOffset), 0.0);
if (text.flipY) {
offset_common.y *= -1.;
}
DECKGL_FILTER_SIZE(offset_common, geometry);
vec4 anchorPos = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0));
anchorPosScreen = anchorPos.xy / anchorPos.w;
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, offset_common, geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
}
anchorPosScreen = vec2(anchorPosScreen.x + 1.0, 1.0 - anchorPosScreen.y) / 2.0 * project.viewportSize / project.devicePixelRatio;
vec2 xy = project_size_to_pixel(instanceClipRect.xy);
vec2 wh = project_size_to_pixel(instanceClipRect.zw);
if (text.flipY) {
xy.y = -xy.y - wh.y;
}
if (text.align.x > 0 || text.align.y > 0) {
vec2 viewportPixels = project.viewportSize / project.devicePixelRatio;
vec2 scrollPixels = vec2(
getPixelOffsetFromAlignment(anchorPosScreen.x, viewportPixels.x, xy.x, xy.x + wh.x, text.align.x),
-getPixelOffsetFromAlignment(anchorPosScreen.y, viewportPixels.y, -xy.y - wh.y, -xy.y, text.align.y)
);
pixelOffset += scrollPixels;
gl_Position.xy += project_pixel_size_to_clipspace(scrollPixels);
}
if (instanceClipRect.z >= 0.) {
if (pixelOffset.x < xy.x || pixelOffset.x > xy.x + wh.x) {
gl_Position = vec4(0.0);
}
else if (text.cutoffPixels.x > 0.) {
float vpWidth = project.viewportSize.x / project.devicePixelRatio;
float l = max(anchorPosScreen.x + xy.x, 0.0);
float r = min(anchorPosScreen.x + xy.x + wh.x, vpWidth);
if (r - l < text.cutoffPixels.x) {
gl_Position = vec4(0.0);
}
}
}
if (instanceClipRect.w >= 0.) {
if (pixelOffset.y < xy.y || pixelOffset.y > xy.y + wh.y) {
gl_Position = vec4(0.0);
}
else if (text.cutoffPixels.y > 0.) {
float vpHeight = project.viewportSize.y / project.devicePixelRatio;
float t = max(anchorPosScreen.y - xy.y - wh.y, 0.0);
float b = min(anchorPosScreen.y - xy.y, vpHeight);
if (b - t < text.cutoffPixels.y) {
gl_Position = vec4(0.0);
}
}
}
vTextureCoords = mix(
instanceIconFrames.xy,
instanceIconFrames.xy + iconSize,
(positions.xy + 1.0) / 2.0
) / icon.iconsTextureDim;
vColor = instanceColors;
DECKGL_FILTER_COLOR(vColor, geometry);
vColorMode = instanceColorModes;
}
`,g=`\
#version 300 es
#define SHADER_NAME multi-icon-layer-fragment-shader
precision highp float;
uniform sampler2D iconsTexture;
in vec4 vColor;
in vec2 vTextureCoords;
in vec2 uv;
out vec4 fragColor;
void main(void) {
geometry.uv = uv;
if (!bool(picking.isActive)) {
float alpha = texture(iconsTexture, vTextureCoords).a;
vec4 color = vColor;
if (sdf.enabled) {
float distance = alpha;
alpha = smoothstep(sdf.buffer - sdf.gamma, sdf.buffer + sdf.gamma, distance);
if (sdf.outlineBuffer > 0.0) {
float inFill = alpha;
float inBorder = smoothstep(sdf.outlineBuffer - sdf.gamma, sdf.outlineBuffer + sdf.gamma, distance);
color = mix(sdf.outlineColor, vColor, inFill);
alpha = inBorder;
}
}
float a = alpha * color.a;
if (a < icon.alphaCutoff) {
discard;
}
fragColor = vec4(color.rgb, a * layer.opacity);
}
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,d=function({collision:e=!1}={}){return`\
struct IconUniforms {
  sizeScale: f32,
  iconsTextureDim: vec2<f32>,
  sizeBasis: f32,
  sizeMinPixels: f32,
  sizeMaxPixels: f32,
  billboard: i32,
  sizeUnits: i32,
  alphaCutoff: f32
};

struct TextUniforms {
  cutoffPixels: vec2<f32>,
  align: vec2<i32>,
  fontSize: f32,
  flipY: f32
};

struct SdfUniforms {
  gamma: f32,
  enabled: f32,
  buffer: f32,
  outlineBuffer: f32,
  outlineColor: vec4<f32>
};

${e?`\
struct CollisionUniforms {
  sort: i32,
  enabled: i32
};
`:""}

const ALIGN_MODE_START: i32 = 1;
const ALIGN_MODE_CENTER: i32 = 2;
const ALIGN_MODE_END: i32 = 3;

@group(0) @binding(auto) var<uniform> icon: IconUniforms;
@group(0) @binding(auto) var<uniform> text: TextUniforms;
@group(0) @binding(auto) var<uniform> sdf: SdfUniforms;
${e?"@group(0) @binding(auto) var<uniform> collision: CollisionUniforms;":""}
@group(0) @binding(auto) var iconsTexture : texture_2d<f32>;
@group(0) @binding(auto) var iconsTextureSampler : sampler;
${e?`\
@group(0) @binding(auto) var collision_texture : texture_2d<f32>;
`:""}

fn rotate_by_angle(vertex: vec2<f32>, angle_deg: f32) -> vec2<f32> {
  let angle_radian = angle_deg * PI / 180.0;
  let c = cos(angle_radian);
  let s = sin(angle_radian);
  let rotation = mat2x2<f32>(vec2<f32>(c, -s), vec2<f32>(s, c));
  return rotation * vertex;
}

fn get_pixel_offset_from_alignment(
  anchor: f32,
  extent: f32,
  clipStart: f32,
  clipEnd: f32,
  mode: i32
) -> f32 {
  if (clipEnd < clipStart) {
    return 0.0;
  }
  if (mode == ALIGN_MODE_START) {
    return max(-(anchor + clipStart), 0.0);
  }
  if (mode == ALIGN_MODE_CENTER) {
    let minValue = max(0.0, anchor + clipStart);
    let maxValue = min(extent, anchor + clipEnd);
    if (minValue < maxValue) {
      return (minValue + maxValue) / 2.0 - anchor;
    }
    return 0.0;
  }
  if (mode == ALIGN_MODE_END) {
    return min(extent - (anchor + clipEnd), 0.0);
  }
  return 0.0;
}

${e?`\
fn collision_match(texCoords: vec2<f32>, pickingColor: vec3<f32>) -> f32 {
  let textureSize = vec2<i32>(textureDimensions(collision_texture));
  let pixelCoords = clamp(
    vec2<i32>(texCoords * vec2<f32>(textureSize)),
    vec2<i32>(0),
    textureSize - vec2<i32>(1)
  );
  let collisionPickingColor = textureLoad(collision_texture, pixelCoords, 0);
  let delta = dot(abs(collisionPickingColor.rgb - pickingColor), vec3<f32>(1.0));
  return step(delta, 0.001);
}

fn collision_is_visible(texCoords: vec2<f32>, pickingColor: vec3<f32>) -> f32 {
  if (collision.enabled == 0) {
    return 1.0;
  }

  var accumulator = 0.0;
  let stepSize = vec2<f32>(1.0) / project.viewportSize;

  for (var i: i32 = -2; i <= 2; i = i + 1) {
    for (var j: i32 = -2; j <= 2; j = j + 1) {
      let delta = vec2<f32>(f32(j), f32(i)) * stepSize;
      accumulator = accumulator + collision_match(texCoords + delta, pickingColor);
    }
  }

  return pow(accumulator / 25.0, 2.2);
}
`:""}

struct Attributes {
  @location(0) positions: vec2<f32>,

  @location(1) instancePositions: vec3<f32>,
  @location(2) instancePositions64Low: vec3<f32>,
  @location(3) instanceSizes: f32,
  @location(4) instanceAngles: f32,
  @location(5) instanceColors: vec4<f32>,
  @location(6) instanceIconFrames: vec4<f32>,
  @location(7) instanceColorModes: f32,
  @location(8) instanceOffsets: vec2<f32>,
  @location(9) instancePixelOffset: vec2<f32>,
  @location(10) rowIndexes: u32,
  @location(11) instanceClipRect: vec4<f32>,
  ${e?"@location(12) collisionPriorities: f32,":""}
};

struct Varyings {
  @builtin(position) position: vec4<f32>,

  @location(0) vColorMode: f32,
  @location(1) vColor: vec4<f32>,
  @location(2) vTextureCoords: vec2<f32>,
  @location(3) uv: vec2<f32>,
  @location(4) pickingColor: vec3<f32>,
};

@vertex
fn vertexMain(inp: Attributes) -> Varyings {
  geometry.worldPosition = inp.instancePositions;
  geometry.uv = inp.positions;
  geometry.pickingColor = picking_getPickingColorFromIndex(inp.rowIndexes);

  var outp: Varyings;
  outp.uv = inp.positions;

  let iconSize = inp.instanceIconFrames.zw;

  let sizePixels = clamp(
    project_unit_size_to_pixel(inp.instanceSizes * icon.sizeScale, icon.sizeUnits),
    icon.sizeMinPixels, icon.sizeMaxPixels
  );
  let instanceScale = sizePixels / text.fontSize;

  var pixelOffset = inp.positions / 2.0 * iconSize + inp.instanceOffsets;
  pixelOffset = rotate_by_angle(pixelOffset, inp.instanceAngles) * instanceScale;
  pixelOffset = pixelOffset + inp.instancePixelOffset;
  pixelOffset.y = pixelOffset.y * -1.0;

  var pos: vec4<f32>;
  var anchorPosScreen: vec2<f32>;
  if (icon.billboard != 0) {
    pos = project_position_to_clipspace(inp.instancePositions, inp.instancePositions64Low, vec3<f32>(0.0));
    anchorPosScreen = pos.xy / pos.w;

    let clipOffset = project_pixel_size_to_clipspace(pixelOffset);
    pos = vec4<f32>(pos.x + clipOffset.x, pos.y + clipOffset.y, pos.z, pos.w);
  } else {
    var offsetCommon = vec3<f32>(project_pixel_size_vec2(pixelOffset), 0.0);
    if (text.flipY > 0.5) {
      offsetCommon.y = offsetCommon.y * -1.0;
    }
    let anchorPos = project_position_to_clipspace(inp.instancePositions, inp.instancePositions64Low, vec3<f32>(0.0));
    anchorPosScreen = anchorPos.xy / anchorPos.w;
    pos = project_position_to_clipspace(inp.instancePositions, inp.instancePositions64Low, offsetCommon);
  }

  anchorPosScreen = vec2<f32>(anchorPosScreen.x + 1.0, 1.0 - anchorPosScreen.y) / 2.0 *
    project.viewportSize / project.devicePixelRatio;
  var xy = project_size_vec2(inp.instanceClipRect.xy) * project.scale;
  var wh = project_size_vec2(inp.instanceClipRect.zw) * project.scale;

  if (text.flipY > 0.5) {
    xy.y = -xy.y - wh.y;
  }
  if (text.align.x > 0 || text.align.y > 0) {
    let viewportPixels = project.viewportSize / project.devicePixelRatio;
    let scrollPixels = vec2<f32>(
      get_pixel_offset_from_alignment(anchorPosScreen.x, viewportPixels.x, xy.x, xy.x + wh.x, text.align.x),
      -get_pixel_offset_from_alignment(anchorPosScreen.y, viewportPixels.y, -xy.y - wh.y, -xy.y, text.align.y)
    );
    pixelOffset = pixelOffset + scrollPixels;
    let scrollClipOffset = project_pixel_size_to_clipspace(scrollPixels);
    pos.x = pos.x + scrollClipOffset.x;
    pos.y = pos.y + scrollClipOffset.y;
  }

  if (inp.instanceClipRect.z >= 0.0) {
    if (pixelOffset.x < xy.x || pixelOffset.x > xy.x + wh.x) {
      pos = vec4<f32>(0.0);
    } else if (text.cutoffPixels.x > 0.0) {
      let viewportWidth = project.viewportSize.x / project.devicePixelRatio;
      let left = max(anchorPosScreen.x + xy.x, 0.0);
      let right = min(anchorPosScreen.x + xy.x + wh.x, viewportWidth);
      if (right - left < text.cutoffPixels.x) {
        pos = vec4<f32>(0.0);
      }
    }
  }
  if (inp.instanceClipRect.w >= 0.0) {
    if (pixelOffset.y < xy.y || pixelOffset.y > xy.y + wh.y) {
      pos = vec4<f32>(0.0);
    } else if (text.cutoffPixels.y > 0.0) {
      let viewportHeight = project.viewportSize.y / project.devicePixelRatio;
      let top = max(anchorPosScreen.y - xy.y - wh.y, 0.0);
      let bottom = min(anchorPosScreen.y - xy.y, viewportHeight);
      if (bottom - top < text.cutoffPixels.y) {
        pos = vec4<f32>(0.0);
      }
    }
  }

  ${e?`\
  if (collision.sort != 0) {
    pos.z = -0.001 * inp.collisionPriorities * pos.w;
  }
  `:""}

  let uvMix = (inp.positions.xy + vec2<f32>(1.0, 1.0)) * 0.5;
  outp.vTextureCoords = mix(inp.instanceIconFrames.xy, inp.instanceIconFrames.xy + iconSize, uvMix) / icon.iconsTextureDim;

  outp.position = pos;
  outp.vColor = inp.instanceColors;
  outp.vColorMode = inp.instanceColorModes;
  outp.pickingColor = picking_getPickingColorFromIndex(inp.rowIndexes);

  return outp;
}

@fragment
fn fragmentMain(inp: Varyings) -> @location(0) vec4<f32> {
  geometry.uv = inp.uv;

  let texColor = textureSample(iconsTexture, iconsTextureSampler, inp.vTextureCoords);
  var alpha = texColor.a;
  var color = inp.vColor;

  if (sdf.enabled > 0.5) {
    let distance = alpha;
    alpha = smoothstep(sdf.buffer - sdf.gamma, sdf.buffer + sdf.gamma, distance);

    if (sdf.outlineBuffer > 0.0) {
      let inFill = alpha;
      let inBorder = smoothstep(sdf.outlineBuffer - sdf.gamma, sdf.outlineBuffer + sdf.gamma, distance);
      color = mix(sdf.outlineColor, inp.vColor, inFill);
      alpha = inBorder;
    }
  } else if (inp.vColorMode == 0.0) {
    color = texColor;
  }

  var a = alpha * color.a * layer.opacity;
  if (a < icon.alphaCutoff) {
    discard;
  }

  if (picking.isActive > 0.5) {
    if (!picking_isColorValid(inp.pickingColor)) {
      discard;
    }
    return vec4<f32>(inp.pickingColor, 1.0);
  }

  ${e?`\
  let collisionFade = collision_is_visible(inp.position.xy / project.viewportSize, inp.pickingColor);
  a = a * collisionFade;
  if (a <= 0.0001) {
    discard;
  }
  `:""}

  var fragColor = deckgl_premultiplied_alpha(vec4<f32>(color.rgb, a));

  if (picking.isHighlightActive > 0.5) {
    let highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
    if (picking_isColorZero(abs(inp.pickingColor - highlightedObjectColor))) {
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

  return fragColor;
}
`}();class h extends r.A{getShaders(){let e=super.getShaders();return{...e,modules:[...e.modules,f,l],vs:p,fs:g,source:d}}initializeState(){super.initializeState();let e=this.getAttributeManager();e.attributes.instanceIconDefs.settings.update=this.calculateInstanceIconDefs,e.addInstanced({rowIndexes:{type:"uint32",size:1,bufferGroup:"icon-instance-data",accessor:(e,{index:t})=>t},instanceClipRect:{size:4,bufferGroup:"icon-instance-data",accessor:"getContentBox",defaultValue:[0,0,-1,-1]}})}updateState(e){super.updateState(e);let{props:t,oldProps:i,changeFlags:o}=e,{outlineColor:s}=t;if(o.extensionsChanged){this.state.fillModel?.destroy();let e="webgpu"===this.context.device.type?this._getModel(`${this.props.id}-fill`):void 0;this.setState({fillModel:e,models:e?[this.state.model,e]:[this.state.model]})}if(o.updateTriggersChanged&&(o.updateTriggersChanged.getIcon||o.updateTriggersChanged.getIconOffsets)&&this.getAttributeManager().invalidate("instanceIconDefs"),s!==i.outlineColor){let e=[s[0]/255,s[1]/255,s[2]/255,(s[3]??255)/255];this.setState({outlineColor:e})}!t.sdf&&t.outlineWidth&&n.A.warn(`${this.id}: fontSettings.sdf is required to render outline`)()}draw(e){let{sdf:t,smoothing:i,fontSize:o,outlineWidth:n,contentCutoffPixels:s,contentAlignHorizontal:r,contentAlignVertical:a}=this.props,{outlineColor:l}=this.state,c=n?Math.max(i,.75*(1-n)):-1,f=this.state.model,p={buffer:.75,outlineBuffer:c,gamma:i,enabled:!!t,outlineColor:l},g={contentCutoffPixels:s,contentAlignHorizontal:r,contentAlignVertical:a,fontSize:o,viewport:this.context.viewport};if(f.shaderInputs.setProps({sdf:p,text:g}),super.draw(e),t&&n){let{iconManager:e}=this.state;if(e.getTexture()){let e=this.state.fillModel||f;e.shaderInputs.setProps({sdf:{...p,outlineBuffer:.75},text:g}),this._drawModel(e)}}}calculateInstanceIconDefs(e,{startRow:t,endRow:i}){let{data:o,getIcon:n,getIconOffsets:r}=this.props,a=e.getVertexOffset(t),l=e.value,{iterable:c,objectInfo:f}=(0,s.X)(o,t,i);for(let t of c){f.index++;let i=n(t,f),o=r(t,f);if(i){let t=0;for(let n of Array.from(i)){let i=super.getInstanceIconDef(n);i[0]=o[2*t],i[1]+=o[2*t+1],i[6]=1,l.set(i,a),a+=e.size,t++}}}}}h.defaultProps={getIconOffsets:{type:"accessor",value:e=>e.offsets},getContentBox:{type:"accessor",value:[0,0,-1,-1]},fontSize:1,alphaCutoff:.001,smoothing:.1,outlineWidth:0,outlineColor:{type:"color",value:[0,0,0,255]},contentCutoffPixels:{type:"array",value:[0,0]},contentAlignHorizontal:"none",contentAlignVertical:"none"},h.layerName="MultiIconLayer";let u=new Float64Array(256);for(let e=0;e<256;e++){let t=.5-Math.pow(e/255,1/2.2);u[e]=t*Math.abs(t)}u[255]=-1e20;class v{constructor({fontSize:e=24,buffer:t=3,radius:i=8,cutoff:o=.25,fontFamily:n="sans-serif",fontWeight:s="normal",fontStyle:r="normal",lang:a=null}={}){this.buffer=t,this.radius=i,this.cutoff=o,this.lang=a;let l=this.size=e+4*t,c=this._createCanvas(l),f=this.ctx=c.getContext("2d",{willReadFrequently:!0});f.font=`${r} ${s} ${e}px ${n}`,f.textBaseline="alphabetic",f.textAlign="left",f.fillStyle="black",this.gridOuter=new Float64Array(l*l),this.gridInner=new Float64Array(l*l),this.f=new Float64Array(l),this.z=new Float64Array(l+1),this.v=new Uint16Array(l)}_createCanvas(e){if("u">typeof OffscreenCanvas)return new OffscreenCanvas(e,e);let t=document.createElement("canvas");return t.width=t.height=e,t}draw(e){let{width:t,actualBoundingBoxAscent:i,actualBoundingBoxDescent:o,actualBoundingBoxLeft:n,actualBoundingBoxRight:s}=this.ctx.measureText(e),r=Math.ceil(i),a=Math.floor(-n),l=Math.max(0,Math.min(this.size-this.buffer,Math.ceil(s)-a)),c=Math.max(0,Math.min(this.size-this.buffer,r+Math.ceil(o))),f=l+2*this.buffer,p=c+2*this.buffer,g=Math.max(f*p,0),d=new Uint8ClampedArray(g),h={data:d,width:f,height:p,glyphWidth:l,glyphHeight:c,glyphTop:r,glyphLeft:a,glyphAdvance:t};if(0===l||0===c)return h;let{ctx:v,buffer:m,gridInner:y,gridOuter:_}=this;this.lang&&(v.lang=this.lang),v.clearRect(m,m,l,c),v.fillText(e,m-a,m+r);let P=v.getImageData(m,m,l,c);_.fill(1e20,0,g),y.fill(0,0,g);let C=3;for(let e=0;e<c;e++){let t=(e+m)*f+m;for(let e=0;e<l;e++,C+=4,t++){let e=P.data[C];if(0===e)continue;let i=u[e];_[t]=Math.max(0,i),y[t]=Math.max(0,-i)}}x(_,0,0,f,p,f,this.f,this.v,this.z);let L=Math.min(m,1);x(y,m-L,m-L,l+2*L,c+2*L,f,this.f,this.v,this.z);let b=255/this.radius,S=255*(1-this.cutoff);for(let e=0;e<g;e++){let t=Math.sqrt(_[e])-Math.sqrt(y[e]);d[e]=Math.round(S-b*t)}return h}}function x(e,t,i,o,n,s,r,a,l){for(let c=t;c<t+o;c++)m(e,i*s+c,s,n,r,a,l);for(let c=i;c<i+n;c++)m(e,c*s+t,1,o,r,a,l)}function m(e,t,i,o,n,s,r){s[0]=0,r[0]=-1e20,r[1]=1e20,n[0]=e[t];for(let a=1,l=0,c=0;a<o;a++){n[a]=e[t+a*i];let o=a*a;do{let e=s[l];c=(n[a]-n[e]+o-e*e)/(a-e)/2}while(c<=r[l]&&--l>-1)s[++l]=a,r[l]=c,r[l+1]=1e20}for(let a=0,l=0;a<o;a++){for(;r[l+1]<a;)l++;let o=s[l],c=a-o;e[t+a*i]=n[o]+c*c}}let y=[];function _(e,t,i,o){let n=0;for(let s=t;s<i;s++){let t=e[s];n+=o[t]?.advance||0}return n}function P(e,t,i,o,n,s){let r=t,a=0;for(let l=t;l<i;l++){let t=_(e,l,l+1,n);a+t>o&&(r<l&&s.push(l),r=l,a=0),a+=t}return a}class C{constructor(e=5){this._cache={},this._order=[],this.limit=e}get(e){let t=this._cache[e];return t&&(this._deleteOrder(e),this._appendOrder(e)),t}set(e,t){this._cache[e]?this.delete(e):Object.keys(this._cache).length===this.limit&&this.delete(this._order[0]),this._cache[e]=t,this._appendOrder(e)}delete(e){this._cache[e]&&(delete this._cache[e],this._deleteOrder(e))}_deleteOrder(e){let t=this._order.indexOf(e);t>=0&&this._order.splice(t,1)}_appendOrder(e){this._order.push(e)}}let L={fontFamily:"Monaco, monospace",fontWeight:"normal",characterSet:function(){let e=[];for(let t=32;t<128;t++)e.push(String.fromCharCode(t));return e}(),fontSize:64,buffer:4,sdf:!1,cutoff:.25,radius:12,smoothing:.1},b=new C(3);function S(e,t,i,o){e.font=`${o} ${i}px ${t}`,e.fillStyle="#000",e.textBaseline="alphabetic",e.textAlign="left"}class w{constructor(){this.props={...L}}get atlas(){return this._atlas}get mapping(){return this._atlas&&this._atlas.mapping}setProps(e={}){Object.assign(this.props,e),e._getFontRenderer&&(this._getFontRenderer=e._getFontRenderer),this._key=this._getKey();let t=function(e,t){let i;i=new Set("string"==typeof t?Array.from(t):t);let o=b.get(e);if(!o)return i;for(let e in o.mapping)i.has(e)&&i.delete(e);return i}(this._key,this.props.characterSet),i=b.get(this._key);if(i&&0===t.size){this._atlas!==i&&(this._atlas=i);return}let o=this._generateFontAtlas(t,i);this._atlas=o,b.set(this._key,o)}_generateFontAtlas(e,t){let i,{fontFamily:o,fontWeight:n,fontSize:s,buffer:r,sdf:a,radius:l,cutoff:c}=this.props,f=t&&t.data;f||((f=document.createElement("canvas")).width=1024);let p=f.getContext("2d",{willReadFrequently:!0});S(p,o,s,n);let g=e=>(function(e,t,i){if(void 0===i){let i=e.measureText("A");return i.fontBoundingBoxAscent?{advance:0,width:0,ascent:Math.ceil(i.fontBoundingBoxAscent),descent:Math.ceil(i.fontBoundingBoxDescent)}:{advance:0,width:0,ascent:.9*t,descent:.3*t}}let o=e.measureText(i);return o.actualBoundingBoxAscent?{advance:o.width,width:Math.ceil(o.actualBoundingBoxRight-o.actualBoundingBoxLeft),ascent:Math.ceil(o.actualBoundingBoxAscent),descent:Math.ceil(o.actualBoundingBoxDescent)}:{advance:o.width,width:o.width,ascent:.9*t,descent:.3*t}})(p,s,e);this._getFontRenderer?i=this._getFontRenderer(this.props):a&&(i={measure:g,draw:function({fontSize:e,buffer:t,radius:i,cutoff:o,fontFamily:n,fontWeight:s}){let r=new v({fontSize:e,buffer:t,radius:i,cutoff:o,fontFamily:n,fontWeight:`${s}`});return e=>{let{data:i,width:o,height:n}=r.draw(e),s=new ImageData(o,n);for(let e=0;e<i.length;e++)s.data[4*e+3]=i[e];return{data:s,left:t,top:t}}}(this.props)});let{mapping:d,canvasHeight:h,xOffset:u,yOffsetMin:x,yOffsetMax:m}=function({characterSet:e,measureText:t,buffer:i,maxCanvasWidth:o,mapping:n={},xOffset:s=0,yOffsetMin:r=0,yOffsetMax:a=0}){let l=s,c=r,f=a;for(let s of e)if(!n[s]){let{advance:e,width:r,ascent:a,descent:p}=t(s),g=a+p;l+r+2*i>o&&(l=0,c=f),n[s]={x:l+i,y:c+i,width:r,height:g,advance:e,anchorX:r/2,anchorY:a},l+=r+2*i,f=Math.max(f,c+g+2*i)}return{mapping:n,xOffset:l,yOffsetMin:c,yOffsetMax:f,canvasHeight:Math.pow(2,Math.ceil(Math.log2(f)))}}({measureText:e=>i?i.measure(e):g(e),buffer:r,characterSet:e,maxCanvasWidth:1024,...t&&{mapping:t.mapping,xOffset:t.xOffset,yOffsetMin:t.yOffsetMin,yOffsetMax:t.yOffsetMax}});if(f.height!==h){let e=f.height>0?p.getImageData(0,0,f.width,f.height):null;f.height=h,e&&p.putImageData(e,0,0)}if(S(p,o,s,n),i)for(let t of e){let e=d[t],o=e.width,{data:n,left:s=0,top:r=0}=i.draw(t),a=e.x-s,l=e.y-r,c=Math.max(0,Math.round(a)),g=Math.max(0,Math.round(l)),h=Math.min(n.width,f.width-c),u=Math.min(n.height,f.height-g);p.putImageData(n,c,g,0,0,h,u),e.x=c,e.y=g,e.width=h,e.height=u,e.anchorX+=h/2-s-o/2,e.anchorY+=r}else for(let t of e){let e=d[t];p.fillText(t,e.x,e.y+e.anchorY)}let y=i?i.measure():g();return{baselineOffset:(y.ascent-y.descent)/2,xOffset:u,yOffsetMin:x,yOffsetMax:m,mapping:d,data:f,width:f.width,height:f.height}}_getKey(){let{fontFamily:e,fontWeight:t,fontSize:i,buffer:o,sdf:n,radius:s,cutoff:r}=this.props;return n?`${e} ${t} ${i} ${o} ${s} ${r}`:`${e} ${t} ${i} ${o}`}}var A=i(41881),E=i(84175),z=i(46487),I=i(95335),O=i(9350),T=i(25337),M=i(95263);let R=`\
layout(std140) uniform textBackgroundUniforms {
  bool billboard;
  float sizeScale;
  float sizeMinPixels;
  float sizeMaxPixels;
  vec4 borderRadius;
  vec4 padding;
  highp int sizeUnits;
  bool stroked;
} textBackground;
`,B={name:"textBackground",source:`\
struct TextBackgroundUniforms {
  billboard: f32,
  sizeScale: f32,
  sizeMinPixels: f32,
  sizeMaxPixels: f32,
  borderRadius: vec4<f32>,
  padding: vec4<f32>,
  sizeUnits: i32,
  stroked: f32,
};

@group(0) @binding(auto) var<uniform> textBackground: TextBackgroundUniforms;
`,vs:R,fs:R,uniformTypes:{billboard:"f32",sizeScale:"f32",sizeMinPixels:"f32",sizeMaxPixels:"f32",borderRadius:"vec4<f32>",padding:"vec4<f32>",sizeUnits:"i32",stroked:"f32"}},D=`\
#version 300 es
#define SHADER_NAME text-background-layer-vertex-shader
in vec2 positions;
in vec3 instancePositions;
in vec3 instancePositions64Low;
in vec4 instanceRects;
in vec4 instanceClipRect;
in float instanceSizes;
in float instanceAngles;
in vec2 instancePixelOffsets;
in float instanceLineWidths;
in vec4 instanceFillColors;
in vec4 instanceLineColors;
out vec4 vFillColor;
out vec4 vLineColor;
out float vLineWidth;
out vec2 uv;
out vec2 dimensions;
vec2 rotate_by_angle(vec2 vertex, float angle) {
float angle_radian = radians(angle);
float cos_angle = cos(angle_radian);
float sin_angle = sin(angle_radian);
mat2 rotationMatrix = mat2(cos_angle, -sin_angle, sin_angle, cos_angle);
return rotationMatrix * vertex;
}
void main(void) {
geometry.worldPosition = instancePositions;
geometry.uv = positions;
geometry.pickingColor = picking_getPickingColorFromInstanceID();
uv = positions;
vLineWidth = instanceLineWidths;
float sizePixels = clamp(
project_size_to_pixel(instanceSizes * textBackground.sizeScale, textBackground.sizeUnits),
textBackground.sizeMinPixels, textBackground.sizeMaxPixels
);
float instanceScale = sizePixels / text.fontSize;
dimensions = instanceRects.zw * instanceScale + textBackground.padding.xy + textBackground.padding.zw;
vec2 pixelOffset = (positions * instanceRects.zw + instanceRects.xy) * instanceScale + mix(-textBackground.padding.xy, textBackground.padding.zw, positions);
pixelOffset = rotate_by_angle(pixelOffset, instanceAngles);
pixelOffset += instancePixelOffsets;
pixelOffset.y *= -1.0;
vec2 xy = project_size_to_pixel(instanceClipRect.xy);
vec2 wh = project_size_to_pixel(instanceClipRect.zw);
if (text.flipY) {
xy.y = -xy.y - wh.y;
}
if (instanceClipRect.z >= 0.0) {
dimensions.x = wh.x;
pixelOffset.x = xy.x + uv.x * wh.x + mix(-textBackground.padding.x, textBackground.padding.z, uv.x);
}
if (instanceClipRect.w >= 0.0) {
dimensions.y = wh.y;
pixelOffset.y = xy.y + uv.y * wh.y + mix(-textBackground.padding.y, textBackground.padding.w, uv.y);
}
if (textBackground.billboard)  {
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0), geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
vec3 offset = vec3(pixelOffset, 0.0);
DECKGL_FILTER_SIZE(offset, geometry);
gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);
} else {
vec3 offset_common = vec3(project_pixel_size(pixelOffset), 0.0);
if (text.flipY) {
offset_common.y *= -1.;
}
DECKGL_FILTER_SIZE(offset_common, geometry);
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, offset_common, geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
}
vFillColor = vec4(instanceFillColors.rgb, instanceFillColors.a * layer.opacity);
DECKGL_FILTER_COLOR(vFillColor, geometry);
vLineColor = vec4(instanceLineColors.rgb, instanceLineColors.a * layer.opacity);
DECKGL_FILTER_COLOR(vLineColor, geometry);
}
`,k=`\
#version 300 es
#define SHADER_NAME text-background-layer-fragment-shader
precision highp float;
in vec4 vFillColor;
in vec4 vLineColor;
in float vLineWidth;
in vec2 uv;
in vec2 dimensions;
out vec4 fragColor;
float round_rect(vec2 p, vec2 size, vec4 radii) {
vec2 pixelPositionCB = (p - 0.5) * size;
vec2 sizeCB = size * 0.5;
float maxBorderRadius = min(size.x, size.y) * 0.5;
vec4 borderRadius = vec4(min(radii, maxBorderRadius));
borderRadius.xy =
(pixelPositionCB.x > 0.0) ? borderRadius.xy : borderRadius.zw;
borderRadius.x = (pixelPositionCB.y > 0.0) ? borderRadius.x : borderRadius.y;
vec2 q = abs(pixelPositionCB) - sizeCB + borderRadius.x;
return -(min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - borderRadius.x);
}
float rect(vec2 p, vec2 size) {
vec2 pixelPosition = p * size;
return min(min(pixelPosition.x, size.x - pixelPosition.x),
min(pixelPosition.y, size.y - pixelPosition.y));
}
vec4 get_stroked_fragColor(float dist) {
float isBorder = smoothedge(dist, vLineWidth);
return mix(vFillColor, vLineColor, isBorder);
}
void main(void) {
geometry.uv = uv;
if (textBackground.borderRadius != vec4(0.0)) {
float distToEdge = round_rect(uv, dimensions, textBackground.borderRadius);
float shapeAlpha = smoothedge(-distToEdge, 0.0);
if (shapeAlpha == 0.0) {
discard;
}
if (textBackground.stroked) {
fragColor = get_stroked_fragColor(distToEdge);
} else {
fragColor = vFillColor;
}
fragColor.a *= shapeAlpha;
} else {
if (textBackground.stroked) {
float distToEdge = rect(uv, dimensions);
fragColor = get_stroked_fragColor(distToEdge);
} else {
fragColor = vFillColor;
}
}
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,j=`\
struct TextUniforms {
  cutoffPixels: vec2<f32>,
  align: vec2<i32>,
  fontSize: f32,
  flipY: f32,
};

@group(0) @binding(auto) var<uniform> text: TextUniforms;

fn rotate_by_angle(vertex: vec2<f32>, angle: f32) -> vec2<f32> {
  let angleRadian = radians(angle);
  let cosine = cos(angleRadian);
  let sine = sin(angleRadian);
  let rotationMatrix = mat2x2<f32>(
    vec2<f32>(cosine, -sine),
    vec2<f32>(sine, cosine)
  );
  return rotationMatrix * vertex;
}

struct Attributes {
  @builtin(instance_index) instanceIndex: u32,
  @location(0) positions: vec2<f32>,
  @location(1) instancePositions: vec3<f32>,
  @location(2) instancePositions64Low: vec3<f32>,
  @location(3) instanceSizes: f32,
  @location(4) instanceAngles: f32,
  @location(5) instanceRects: vec4<f32>,
  @location(6) instanceClipRect: vec4<f32>,
  @location(7) instancePixelOffsets: vec2<f32>,
  @location(8) instanceFillColors: vec4<f32>,
  @location(9) instanceLineColors: vec4<f32>,
  @location(10) instanceLineWidths: f32,
};

struct Varyings {
  @builtin(position) position: vec4<f32>,
  @location(0) vFillColor: vec4<f32>,
  @location(1) vLineColor: vec4<f32>,
  @location(2) vLineWidth: f32,
  @location(3) uv: vec2<f32>,
  @location(4) dimensions: vec2<f32>,
  @location(5) pickingColor: vec3<f32>,
};

@vertex
fn vertexMain(attributes: Attributes) -> Varyings {
  geometry.worldPosition = attributes.instancePositions;
  geometry.uv = attributes.positions;
  geometry.pickingColor = picking_getPickingColorFromIndex(attributes.instanceIndex);

  var varyings: Varyings;
  varyings.uv = attributes.positions;
  varyings.vLineWidth = attributes.instanceLineWidths;

  let sizePixels = clamp(
    project_unit_size_to_pixel(
      attributes.instanceSizes * textBackground.sizeScale,
      textBackground.sizeUnits
    ),
    textBackground.sizeMinPixels,
    textBackground.sizeMaxPixels
  );
  let instanceScale = sizePixels / text.fontSize;

  varyings.dimensions = attributes.instanceRects.zw * instanceScale +
    textBackground.padding.xy + textBackground.padding.zw;

  var pixelOffset =
    (attributes.positions * attributes.instanceRects.zw + attributes.instanceRects.xy) *
      instanceScale +
    mix(-textBackground.padding.xy, textBackground.padding.zw, attributes.positions);
  pixelOffset = rotate_by_angle(pixelOffset, attributes.instanceAngles);
  pixelOffset = pixelOffset + attributes.instancePixelOffsets;
  pixelOffset.y = pixelOffset.y * -1.0;

  var xy = project_size_vec2(attributes.instanceClipRect.xy) * project.scale;
  let wh = project_size_vec2(attributes.instanceClipRect.zw) * project.scale;
  if (text.flipY > 0.5) {
    xy.y = -xy.y - wh.y;
  }
  if (attributes.instanceClipRect.z >= 0.0) {
    varyings.dimensions.x = wh.x;
    pixelOffset.x = xy.x + varyings.uv.x * wh.x + mix(
      -textBackground.padding.x,
      textBackground.padding.z,
      varyings.uv.x
    );
  }
  if (attributes.instanceClipRect.w >= 0.0) {
    varyings.dimensions.y = wh.y;
    pixelOffset.y = xy.y + varyings.uv.y * wh.y + mix(
      -textBackground.padding.y,
      textBackground.padding.w,
      varyings.uv.y
    );
  }

  if (textBackground.billboard > 0.5) {
    var position = project_position_to_clipspace(
      attributes.instancePositions,
      attributes.instancePositions64Low,
      vec3<f32>(0.0)
    );
    let clipOffset = project_pixel_size_to_clipspace(pixelOffset);
    position = vec4<f32>(
      position.x + clipOffset.x,
      position.y + clipOffset.y,
      position.z,
      position.w
    );
    varyings.position = position;
  } else {
    var offsetCommon = vec3<f32>(project_pixel_size_vec2(pixelOffset), 0.0);
    if (text.flipY > 0.5) {
      offsetCommon.y = offsetCommon.y * -1.0;
    }
    varyings.position = project_position_to_clipspace(
      attributes.instancePositions,
      attributes.instancePositions64Low,
      offsetCommon
    );
  }

  varyings.vFillColor = vec4<f32>(
    attributes.instanceFillColors.rgb,
    attributes.instanceFillColors.a * layer.opacity
  );
  varyings.vLineColor = vec4<f32>(
    attributes.instanceLineColors.rgb,
    attributes.instanceLineColors.a * layer.opacity
  );
  varyings.pickingColor = geometry.pickingColor;
  return varyings;
}

fn round_rect(point: vec2<f32>, size: vec2<f32>, radii: vec4<f32>) -> f32 {
  let pixelPosition = (point - 0.5) * size;
  let halfSize = size * 0.5;
  let maxBorderRadius = min(size.x, size.y) * 0.5;
  var borderRadius = min(radii, vec4<f32>(maxBorderRadius));

  borderRadius = select(borderRadius.zwxy, borderRadius, pixelPosition.x > 0.0);
  let radius = select(borderRadius.y, borderRadius.x, pixelPosition.y > 0.0);
  let q = abs(pixelPosition) - halfSize + radius;
  return -(min(max(q.x, q.y), 0.0) + length(max(q, vec2<f32>(0.0))) - radius);
}

fn rect(point: vec2<f32>, size: vec2<f32>) -> f32 {
  let pixelPosition = point * size;
  return min(
    min(pixelPosition.x, size.x - pixelPosition.x),
    min(pixelPosition.y, size.y - pixelPosition.y)
  );
}

fn get_stroked_frag_color(
  distanceToEdge: f32,
  lineWidth: f32,
  fillColor: vec4<f32>,
  lineColor: vec4<f32>
) -> vec4<f32> {
  let isBorder = smoothedge(distanceToEdge, lineWidth);
  return mix(fillColor, lineColor, isBorder);
}

@fragment
fn fragmentMain(varyings: Varyings) -> @location(0) vec4<f32> {
  geometry.uv = varyings.uv;
  var fragColor: vec4<f32>;

  if (any(textBackground.borderRadius != vec4<f32>(0.0))) {
    let distanceToEdge = round_rect(
      varyings.uv,
      varyings.dimensions,
      textBackground.borderRadius
    );
    let shapeAlpha = smoothedge(-distanceToEdge, 0.0);
    if (shapeAlpha == 0.0) {
      discard;
    }
    if (textBackground.stroked > 0.5) {
      fragColor = get_stroked_frag_color(
        distanceToEdge,
        varyings.vLineWidth,
        varyings.vFillColor,
        varyings.vLineColor
      );
    } else {
      fragColor = varyings.vFillColor;
    }
    fragColor.a = fragColor.a * shapeAlpha;
  } else if (textBackground.stroked > 0.5) {
    let distanceToEdge = rect(varyings.uv, varyings.dimensions);
    fragColor = get_stroked_frag_color(
      distanceToEdge,
      varyings.vLineWidth,
      varyings.vFillColor,
      varyings.vLineColor
    );
  } else {
    fragColor = varyings.vFillColor;
  }

  if (picking.isActive > 0.5) {
    if (!picking_isColorValid(varyings.pickingColor)) {
      discard;
    }
    return vec4<f32>(varyings.pickingColor, 1.0);
  }

  if (picking.isHighlightActive > 0.5) {
    let highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
    if (picking_isColorZero(abs(varyings.pickingColor - highlightedObjectColor))) {
      let highlightAlpha = picking.highlightColor.a;
      let blendedAlpha = highlightAlpha + fragColor.a * (1.0 - highlightAlpha);
      if (blendedAlpha > 0.0) {
        let highlightRatio = highlightAlpha / blendedAlpha;
        fragColor = vec4<f32>(
          mix(fragColor.rgb, picking.highlightColor.rgb, highlightRatio),
          blendedAlpha
        );
      } else {
        fragColor = vec4<f32>(fragColor.rgb, 0.0);
      }
    }
  }

  return deckgl_premultiplied_alpha(fragColor);
}
`,F={billboard:!0,sizeScale:1,sizeUnits:"pixels",sizeMinPixels:0,sizeMaxPixels:Number.MAX_SAFE_INTEGER,fontSize:1,borderRadius:{type:"object",value:0},padding:{type:"array",value:[0,0,0,0]},getPosition:{type:"accessor",value:e=>e.position},getSize:{type:"accessor",value:1},getAngle:{type:"accessor",value:0},getPixelOffset:{type:"accessor",value:[0,0]},getBoundingRect:{type:"accessor",value:[0,0,0,0]},getClipRect:{type:"accessor",value:[0,0,-1,-1]},getFillColor:{type:"accessor",value:[0,0,0,255]},getLineColor:{type:"accessor",value:[0,0,0,255]},getLineWidth:{type:"accessor",value:1}};class N extends A.A{getShaders(){return super.getShaders({vs:D,fs:k,source:j,modules:[E.A,z.A,I.Ay,B,f]})}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition"},instanceSizes:{size:1,transition:!0,bufferGroup:"text-background-instance-data",accessor:"getSize",defaultValue:1},instanceAngles:{size:1,transition:!0,bufferGroup:"text-background-instance-data",accessor:"getAngle"},instanceRects:{size:4,bufferGroup:"text-background-instance-data",accessor:"getBoundingRect"},instanceClipRect:{size:4,bufferGroup:"text-background-instance-data",accessor:"getClipRect",defaultValue:[0,0,-1,-1]},instancePixelOffsets:{size:2,transition:!0,bufferGroup:"text-background-instance-data",accessor:"getPixelOffset"},instanceFillColors:{size:4,transition:!0,type:"unorm8",accessor:"getFillColor",defaultValue:[0,0,0,255]},instanceLineColors:{size:4,transition:!0,type:"unorm8",accessor:"getLineColor",defaultValue:[0,0,0,255]},instanceLineWidths:{size:1,transition:!0,bufferGroup:"text-background-instance-data",accessor:"getLineWidth",defaultValue:1}})}updateState(e){super.updateState(e);let{changeFlags:t}=e;t.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll())}draw({uniforms:e}){let{billboard:t,sizeScale:i,sizeUnits:o,sizeMinPixels:n,sizeMaxPixels:s,getLineWidth:r,fontSize:a}=this.props,{padding:l,borderRadius:c}=this.props;l.length<4&&(l=[l[0],l[1],l[0],l[1]]),Array.isArray(c)||(c=[c,c,c,c]);let f=this.state.model,p={billboard:t,stroked:!!r,borderRadius:c,padding:l,sizeUnits:O.p5[o],sizeScale:i,sizeMinPixels:n,sizeMaxPixels:s},g={fontSize:a,viewport:this.context.viewport};f.shaderInputs.setProps({textBackground:p,text:g}),f.draw(this.context.renderPass)}_getModel(){return new M.K(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new T.V({topology:"triangle-strip",vertexCount:4,attributes:{positions:{size:2,value:new Float32Array([0,0,1,0,0,1,1,1])}}}),isInstanced:!0})}}N.defaultProps=F,N.layerName="TextBackgroundLayer";let G={start:1,middle:0,end:-1},V={top:1,center:0,bottom:-1},U=[0,0,0,255],W={billboard:!0,sizeScale:1,sizeUnits:"pixels",sizeMinPixels:0,sizeMaxPixels:Number.MAX_SAFE_INTEGER,background:!1,getBackgroundColor:{type:"accessor",value:[255,255,255,255]},getBorderColor:{type:"accessor",value:U},getBorderWidth:{type:"accessor",value:0},backgroundBorderRadius:{type:"object",value:0},backgroundPadding:{type:"array",value:[0,0,0,0]},characterSet:{type:"object",value:L.characterSet},fontFamily:L.fontFamily,fontWeight:L.fontWeight,lineHeight:1,outlineWidth:{type:"number",value:0,min:0},outlineColor:{type:"color",value:U},fontSettings:{type:"object",value:{},compare:1},wordBreak:"break-word",maxWidth:{type:"number",value:-1},contentCutoffPixels:{type:"array",value:[0,0]},contentAlignHorizontal:"none",contentAlignVertical:"none",getText:{type:"accessor",value:e=>e.text},getPosition:{type:"accessor",value:e=>e.position},getColor:{type:"accessor",value:U},getSize:{type:"accessor",value:32},getAngle:{type:"accessor",value:0},getTextAnchor:{type:"accessor",value:"middle"},getAlignmentBaseline:{type:"accessor",value:"center"},getPixelOffset:{type:"accessor",value:[0,0]},getContentBox:{type:"accessor",value:[0,0,-1,-1]},backgroundColor:{deprecatedFor:["background","getBackgroundColor"]}};class H extends o.A{constructor(){super(...arguments),this.getBoundingRect=(e,t)=>{let{size:[i,o]}=this.transformParagraph(e,t),{getTextAnchor:n,getAlignmentBaseline:s}=this.props;return[(G["function"==typeof n?n(e,t):n]-1)*i/2,(V["function"==typeof s?s(e,t):s]-1)*o/2,i,o]},this.getIconOffsets=(e,t)=>{let{getTextAnchor:i,getAlignmentBaseline:o}=this.props,{x:n,y:s,rowWidth:r,size:[,a]}=this.transformParagraph(e,t),l=G["function"==typeof i?i(e,t):i],c=V["function"==typeof o?o(e,t):o],f=n.length,p=Array(2*f),g=0;for(let e=0;e<f;e++)p[g++]=(l-1)*r[e]/2+n[e],p[g++]=(c-1)*a/2+s[e];return p}}initializeState(){this.state={styleVersion:0,fontAtlasManager:new w},this.props.maxWidth>0&&n.A.once(1,"v8.9 breaking change: TextLayer maxWidth is now relative to text size")()}updateState(e){let{props:t,oldProps:i,changeFlags:o}=e;(o.dataChanged||o.updateTriggersChanged&&(o.updateTriggersChanged.all||o.updateTriggersChanged.getText))&&this._updateText(),(this._updateFontAtlas()||t.lineHeight!==i.lineHeight||t.wordBreak!==i.wordBreak||t.maxWidth!==i.maxWidth)&&this.setState({styleVersion:this.state.styleVersion+1})}getPickingInfo({info:e}){return e.object=e.index>=0?this.props.data[e.index]:null,e}_updateFontAtlas(){let{fontSettings:e,fontFamily:t,fontWeight:i,_getFontRenderer:o}=this.props,{fontAtlasManager:n,characterSet:s}=this.state,r={...e,characterSet:s,fontFamily:t,fontWeight:i,_getFontRenderer:o};if(!n.mapping)return n.setProps(r),!0;for(let e in r)if(r[e]!==n.props[e])return n.setProps(r),!0;return!1}_updateText(){let e,{data:t,characterSet:i}=this.props,o=t.attributes?.getText,{getText:n}=this.props,r=t.startIndices,a="auto"===i&&new Set;if(o&&r){let{texts:i,characterCount:s}=function({value:e,length:t,stride:i,offset:o,startIndices:n,characterSet:s}){let r=e.BYTES_PER_ELEMENT,a=i?i/r:1,l=o?o/r:0,c=n[t]||Math.ceil((e.length-l)/a),f=s&&new Set,p=Array(t),g=e;if(a>1||l>0){g=new e.constructor(c);for(let t=0;t<c;t++)g[t]=e[t*a+l]}for(let e=0;e<t;e++){let t=n[e],i=n[e+1]||c,o=g.subarray(t,i);p[e]=String.fromCodePoint.apply(null,o),f&&o.forEach(f.add,f)}if(f)for(let e of f)s.add(String.fromCodePoint(e));return{texts:p,characterCount:c}}({...ArrayBuffer.isView(o)?{value:o}:o,length:t.length,startIndices:r,characterSet:a});e=s,n=(e,{index:t})=>i[t]}else{let{iterable:i,objectInfo:o}=(0,s.X)(t);for(let t of(r=[0],e=0,i)){o.index++;let i=Array.from(n(t,o)||"");a&&i.forEach(a.add,a),e+=i.length,r.push(e)}}this.setState({getText:n,startIndices:r,numInstances:e,characterSet:a||i})}transformParagraph(e,t){let{fontAtlasManager:i}=this.state,o=i.mapping,{baselineOffset:s}=i.atlas,{fontSize:r}=i.props,a=this.state.getText,{wordBreak:l,lineHeight:c,maxWidth:f}=this.props;return function(e,t,i,o,s,r){let a=Array.from(e),l=a.length,c=Array(l),f=Array(l),p=Array(l),g=("break-word"===o||"break-all"===o)&&isFinite(s)&&s>0,d=[0,0],h=[0,0],u=0,v=t+i/2,x=0,m=0;for(let e=0;e<=l;e++){let t=a[e];if(("\n"===t||e===l)&&(m=e),m>x){let e=g?function(e,t,i,o,n=0,s){void 0===s&&(s=e.length);let r=[];return"break-all"===t?P(e,n,s,i,o,r):!function(e,t,i,o,n,s){let r=t,a=t,l=t,c=0;for(let f=t;f<i;f++)if(" "===e[f]?l=f+1:(" "===e[f+1]||f+1===i)&&(l=f+1),l>a){let t=_(e,a,l,n);c+t>o&&(r<a&&(s.push(a),r=a,c=0),t>o&&(t=P(e,a,l,o,n,s),r=s[s.length-1])),a=l,c+=t}}(e,n,s,i,o,r),r}(a,o,s,r,x,m):y;for(let t=0;t<=e.length;t++){let o=0===t?x:e[t-1],s=t<e.length?e[t]:m;!function(e,t,i,o,s,r){let a=0,l=0;for(let n=t;n<i;n++){let t=o[e[n]];t&&(l=Math.max(l,t.height))}for(let r=t;r<i;r++){let t=e[r],i=o[t];i?(s[r]=a+i.anchorX,a+=i.advance):(n.A.warn(`Missing character: ${t} (${t.codePointAt(0)})`)(),s[r]=a,a+=32)}r[0]=a,r[1]=l}(a,o,s,r,c,h);for(let e=o;e<s;e++)f[e]=v,p[e]=h[0];u++,v+=i,d[0]=Math.max(d[0],h[0])}x=m}"\n"===t&&(c[x]=0,f[x]=0,p[x]=0,x++)}return d[1]=u*i,{x:c,y:f,rowWidth:p,size:d}}(a(e,t)||"",s,c*r,l,f*r,o)}renderLayers(){let{startIndices:e,numInstances:t,getText:i,fontAtlasManager:{atlas:o,mapping:n},styleVersion:s}=this.state,{data:r,_dataDiff:a,getPosition:l,getColor:c,getSize:f,getAngle:p,getPixelOffset:g,getBackgroundColor:d,getBorderColor:u,getBorderWidth:v,getContentBox:x,backgroundBorderRadius:m,backgroundPadding:y,background:_,billboard:P,fontSettings:C,outlineWidth:b,outlineColor:S,sizeScale:w,sizeUnits:A,sizeMinPixels:E,sizeMaxPixels:z,contentCutoffPixels:I,contentAlignHorizontal:O,contentAlignVertical:T,transitions:M,updateTriggers:R}=this.props,B=this.getSubLayerClass("characters",h),D=this.getSubLayerClass("background",N),{fontSize:k}=this.state.fontAtlasManager.props;return[_&&new D({getFillColor:d,getLineColor:u,getLineWidth:v,borderRadius:m,padding:y,getPosition:l,getSize:f,getAngle:p,getPixelOffset:g,getClipRect:x,billboard:P,sizeScale:w,sizeUnits:A,sizeMinPixels:E,sizeMaxPixels:z,fontSize:k,transitions:M&&{getPosition:M.getPosition,getAngle:M.getAngle,getSize:M.getSize,getFillColor:M.getBackgroundColor,getLineColor:M.getBorderColor,getLineWidth:M.getBorderWidth,getPixelOffset:M.getPixelOffset}},this.getSubLayerProps({id:"background",updateTriggers:{getPosition:R.getPosition,getAngle:R.getAngle,getSize:R.getSize,getFillColor:R.getBackgroundColor,getLineColor:R.getBorderColor,getLineWidth:R.getBorderWidth,getPixelOffset:R.getPixelOffset,getBoundingRect:{getText:R.getText,getTextAnchor:R.getTextAnchor,getAlignmentBaseline:R.getAlignmentBaseline,styleVersion:s}}}),{data:r.attributes&&r.attributes.background?{length:r.length,attributes:r.attributes.background}:r,_dataDiff:a,autoHighlight:!1,getBoundingRect:this.getBoundingRect}),new B({sdf:C.sdf,smoothing:Number.isFinite(C.smoothing)?C.smoothing:L.smoothing,outlineWidth:b/(C.radius||L.radius),outlineColor:S,iconAtlas:o,iconMapping:n,getPosition:l,getColor:c,getSize:f,getAngle:p,getPixelOffset:g,getContentBox:x,billboard:P,sizeScale:w,sizeUnits:A,sizeMinPixels:E,sizeMaxPixels:z,fontSize:k,contentCutoffPixels:I,contentAlignHorizontal:O,contentAlignVertical:T,transitions:M&&{getPosition:M.getPosition,getAngle:M.getAngle,getColor:M.getColor,getSize:M.getSize,getPixelOffset:M.getPixelOffset,getContentBox:M.getContentBox}},this.getSubLayerProps({id:"characters",updateTriggers:{all:R.getText,getPosition:R.getPosition,getAngle:R.getAngle,getColor:R.getColor,getSize:R.getSize,getPixelOffset:R.getPixelOffset,getContentBox:R.getContentBox,getIconOffsets:{getTextAnchor:R.getTextAnchor,getAlignmentBaseline:R.getAlignmentBaseline,styleVersion:s}}}),{data:r,_dataDiff:a,startIndices:e,numInstances:t,getIconOffsets:this.getIconOffsets,getIcon:i})]}static set fontAtlasCacheLimit(e){n.A.assert(Number.isFinite(e)&&e>=3,"Invalid cache limit"),b=new C(e)}}H.defaultProps=W,H.layerName="TextLayer";let $=H},86402(e,t,i){i.d(t,{A:()=>o});let o={name:"clip",source:`\
struct ClipUniforms {
  enabled: i32,
  mode: i32,
  bounds: vec4<f32>,
};

@group(2) @binding(auto) var<uniform> clipUniforms: ClipUniforms;

fn clip_isInBounds(coordinates: vec2<f32>) -> bool {
  return coordinates.x >= clipUniforms.bounds.x &&
    coordinates.y >= clipUniforms.bounds.y &&
    coordinates.x < clipUniforms.bounds.z &&
    coordinates.y < clipUniforms.bounds.w;
}

fn clip_filterPosition(position: ptr<function, vec4<f32>>, instanceCoordinates: vec2<f32>) {
  if (
    clipUniforms.enabled != 0 &&
    clipUniforms.mode == 1 &&
    !clip_isInBounds(instanceCoordinates)
  ) {
    *position = vec4<f32>(2.0, 2.0, 2.0, 1.0);
  }
}

fn clip_filterColor(geometryCoordinates: vec2<f32>) {
  if (
    clipUniforms.enabled != 0 &&
    clipUniforms.mode == 0 &&
    !clip_isInBounds(geometryCoordinates)
  ) {
    discard;
  }
}
`,props:{},uniforms:{},bindingLayout:[{name:"clip",group:2}],uniformTypes:{enabled:"i32",mode:"i32",bounds:"vec4<f32>"},defaultUniforms:{enabled:0,mode:0,bounds:[0,0,1,1]},getUniforms(e={}){let t={};return void 0!==e.enabled&&(t.enabled=+!!e.enabled),void 0!==e.mode&&(t.mode=+("instance"===e.mode)),void 0!==e.bounds&&(t.bounds=e.bounds),t}}},98881(e,t,i){i.d(t,{$n:()=>r});Uint32Array.BYTES_PER_ELEMENT,n("colors");let o=n("floatColors");function n(e){return`\
layout(std140) uniform ${e}Uniforms {
  float useByteColors;
} ${e};

vec3 ${e}_normalize(vec3 inputColor) {
  return ${e}.useByteColors > 0.5 ? inputColor / 255.0 : inputColor;
}

vec4 ${e}_normalize(vec4 inputColor) {
  return ${e}.useByteColors > 0.5 ? inputColor / 255.0 : inputColor;
}

vec4 ${e}_premultiplyAlpha(vec4 inputColor) {
  return vec4(inputColor.rgb * inputColor.a, inputColor.a);
}

vec4 ${e}_unpremultiplyAlpha(vec4 inputColor) {
  return inputColor.a > 0.0 ? vec4(inputColor.rgb / inputColor.a, inputColor.a) : vec4(0.0);
}

vec4 ${e}_premultiply_alpha(vec4 inputColor) {
  return ${e}_premultiplyAlpha(inputColor);
}

vec4 ${e}_unpremultiply_alpha(vec4 inputColor) {
  return ${e}_unpremultiplyAlpha(inputColor);
}
`}function s(e){return`\
struct ${e}Uniforms {
  useByteColors: f32
};

@group(0) @binding(auto) var<uniform> ${e} : ${e}Uniforms;

fn ${e}_normalize(inputColor: vec3<f32>) -> vec3<f32> {
  return select(inputColor, inputColor / 255.0, ${e}.useByteColors > 0.5);
}

fn ${e}_normalize4(inputColor: vec4<f32>) -> vec4<f32> {
  return select(inputColor, inputColor / 255.0, ${e}.useByteColors > 0.5);
}

fn ${e}_premultiplyAlpha(inputColor: vec4<f32>) -> vec4<f32> {
  return vec4<f32>(inputColor.rgb * inputColor.a, inputColor.a);
}

fn ${e}_unpremultiplyAlpha(inputColor: vec4<f32>) -> vec4<f32> {
  return select(
    vec4<f32>(0.0),
    vec4<f32>(inputColor.rgb / inputColor.a, inputColor.a),
    inputColor.a > 0.0
  );
}

fn ${e}_premultiply_alpha(inputColor: vec4<f32>) -> vec4<f32> {
  return ${e}_premultiplyAlpha(inputColor);
}

fn ${e}_unpremultiply_alpha(inputColor: vec4<f32>) -> vec4<f32> {
  return ${e}_unpremultiplyAlpha(inputColor);
}
`}s("colors");let r={name:"floatColors",props:{},uniforms:{},vs:o,fs:o,source:s("floatColors"),uniformTypes:{useByteColors:"f32"},defaultUniforms:{useByteColors:!0}}},66925(e,t,i){i.d(t,{x:()=>a});var o=i(29651);let n=`\
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
`,s=`\
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
`;var r=i(55611);let a={props:{},uniforms:{},name:"lighting",defines:{},uniformTypes:{enabled:"i32",directionalLightCount:"i32",pointLightCount:"i32",spotLightCount:"i32",ambientColor:"vec3<f32>",lights:[{color:"vec3<f32>",position:"vec3<f32>",direction:"vec3<f32>",attenuation:"vec3<f32>",coneCos:"vec2<f32>"},5]},defaultUniforms:c(),bindingLayout:[{name:"lighting",group:2}],firstBindingSlot:0,source:s,vs:n,fs:n,getUniforms:function(e,t={}){if(!(e=e?{...e}:e))return c();e.lights&&(e={...e,...function(e){let t={pointLights:[],spotLights:[],directionalLights:[]};for(let i of e||[])switch(i.type){case"ambient":t.ambientLight=i;break;case"directional":t.directionalLights?.push(i);break;case"point":t.pointLights?.push(i);break;case"spot":t.spotLights?.push(i)}return t}(e.lights),lights:void 0});let{useByteColors:i,ambientLight:n,pointLights:s,spotLights:r,directionalLights:a}=e||{};if(!(n||s&&s.length>0||r&&r.length>0||a&&a.length>0))return{...c(),enabled:0};let p={...c(),...function({useByteColors:e,ambientLight:t,pointLights:i=[],spotLights:n=[],directionalLights:s=[]}){let r=f(),a=0,c=0,p=0,g=0;for(let t of i){if(a>=5)break;r[a]={...r[a],color:l(t,e),position:t.position,attenuation:t.attenuation||[1,0,0]},a++,c++}for(let t of n){var d;if(a>=5)break;r[a]={...r[a],color:l(t,e),position:t.position,direction:t.direction,attenuation:t.attenuation||[1,0,0],coneCos:[Math.cos((d=t).innerConeAngle??0),Math.cos(d.outerConeAngle??Math.PI/4)]},a++,p++}for(let t of s){if(a>=5)break;r[a]={...r[a],color:l(t,e),direction:t.direction},a++,g++}return i.length+n.length+s.length>5&&o.R.warn("MAX_LIGHTS exceeded, truncating to 5")(),{ambientColor:l(t,e),directionalLightCount:g,pointLightCount:c,spotLightCount:p,lights:r}}({useByteColors:i,ambientLight:n,pointLights:s,spotLights:r,directionalLights:a})};return void 0!==e.enabled&&(p.enabled=+!!e.enabled),p}};function l(e={},t){let{color:i=[0,0,0],intensity:o=1}=e;return(0,r.sC)(i,(0,r.eS)(t,!0)).map(e=>e*o)}function c(){return{enabled:1,directionalLightCount:0,pointLightCount:0,spotLightCount:0,ambientColor:[.1,.1,.1],lights:f()}}function f(){return Array.from({length:5},()=>({color:[1,1,1],position:[1,1,2],direction:[1,1,1],attenuation:[1,0,0],coneCos:[1,0]}))}},38846(e,t,i){i.d(t,{X:()=>o,l:()=>n});let o=`\
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
`},79439(e,t,i){i.d(t,{X:()=>o});let o=`\
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
`},76046(e,t,i){function o(e,t,i,n,s=[]){let r,a;if(8&i)r=(n[3]-e[1])/(t[1]-e[1]),a=3;else if(4&i)r=(n[1]-e[1])/(t[1]-e[1]),a=1;else if(2&i)r=(n[2]-e[0])/(t[0]-e[0]),a=2;else{if(!(1&i))return null;r=(n[0]-e[0])/(t[0]-e[0]),a=0}for(let i=0;i<e.length;i++)s[i]=(1&a)===i?n[a]:r*(t[i]-e[i])+e[i];return s}function n(e,t){let i=0;return e[0]<t[0]?i|=1:e[0]>t[2]&&(i|=2),e[1]<t[1]?i|=4:e[1]>t[3]&&(i|=8),i}i.d(t,{w:()=>a,M:()=>r});var s=i(76520);function r(e,t){let i,r,{size:a=2,broken:l=!1,gridResolution:f=10,gridOffset:p=[0,0],startIndex:g=0,endIndex:d=e.length}=t||{},h=(d-g)/a,u=[],v=[u],x=(0,s.ah)(e,0,a,g),m=c(x,f,p,[]),y=[];(0,s.VC)(u,x);for(let t=1;t<h;t++){for(r=n(i=(0,s.ah)(e,t,a,g,i),m);r;){var _,P,C;o(x,i,r,m,y);let e=n(y,m);e&&(o(x,y,e,m,y),r=e),(0,s.VC)(u,y),(0,s.C)(x,y),_=m,P=f,8&(C=r)?(_[1]+=P,_[3]+=P):4&C?(_[1]-=P,_[3]-=P):2&C?(_[0]+=P,_[2]+=P):1&C&&(_[0]-=P,_[2]-=P),l&&u.length>a&&(u=[],v.push(u),(0,s.VC)(u,x)),r=n(i,m)}(0,s.VC)(u,i),(0,s.C)(x,i)}return l?v:v[0]}function a(e,t=null,i){if(!e.length)return[];let{size:o=2,gridResolution:s=10,gridOffset:r=[0,0],edgeTypes:p=!1}=i||{},g=[],d=[{pos:e,types:p?Array(e.length/o).fill(1):null,holes:t||[]}],h=[[],[]],u=[];for(;d.length;){let{pos:e,types:t,holes:i}=d.shift();(function(e,t,i,o){let n=1/0,s=-1/0,r=1/0,a=-1/0;for(let o=0;o<i;o+=t){let t=e[o],i=e[o+1];n=t<n?t:n,s=t>s?t:s,r=i<r?i:r,a=i>a?i:a}o[0][0]=n,o[0][1]=r,o[1][0]=s,o[1][1]=a})(e,o,i[0]||e.length,h),u=c(h[0],s,r,u);let a=n(h[1],u);if(a){let n=l(e,t,o,0,i[0]||e.length,u,a),s={pos:n[0].pos,types:n[0].types,holes:[]},r={pos:n[1].pos,types:n[1].types,holes:[]};d.push(s,r);for(let c=0;c<i.length;c++)(n=l(e,t,o,i[c],i[c+1]||e.length,u,a))[0]&&(s.holes.push(s.pos.length),s.pos=f(s.pos,n[0].pos),p&&(s.types=f(s.types,n[0].types))),n[1]&&(r.holes.push(r.pos.length),r.pos=f(r.pos,n[1].pos),p&&(r.types=f(r.types,n[1].types)))}else{let o={positions:e};p&&(o.edgeTypes=t),i.length&&(o.holeIndices=i),g.push(o)}}return g}function l(e,t,i,n,r,a,l){let c,f,p,g=(r-n)/i,d=[],h=[],u=[],v=[],x=[],m=(0,s.ah)(e,g-1,i,n),y=Math.sign(8&l?m[1]-a[3]:m[0]-a[2]),_=t&&t[g-1],P=0,C=0;for(let r=0;r<g;r++)c=(0,s.ah)(e,r,i,n,c),f=Math.sign(8&l?c[1]-a[3]:c[0]-a[2]),p=t&&t[n/i+r],f&&y&&y!==f&&(o(m,c,l,a,x),(0,s.VC)(d,x)&&u.push(_),(0,s.VC)(h,x)&&v.push(_)),f<=0?((0,s.VC)(d,c)&&u.push(p),P-=f):u.length&&(u[u.length-1]=0),f>=0?((0,s.VC)(h,c)&&v.push(p),C+=f):v.length&&(v[v.length-1]=0),(0,s.C)(m,c),y=f,_=p;return[P?{pos:d,types:t&&u}:null,C?{pos:h,types:t&&v}:null]}function c(e,t,i,o){let n=Math.floor((e[0]-i[0])/t)*t+i[0],s=Math.floor((e[1]-i[1])/t)*t+i[1];return o[0]=n,o[1]=s,o[2]=n+t,o[3]=s+t,o}function f(e,t){for(let i=0;i<t.length;i++)e.push(t[i]);return e}},6423(e,t,i){i.d(t,{E:()=>r,I:()=>s});var o=i(76046),n=i(76520);function s(e,t){let{size:i=2,startIndex:n=0,endIndex:s=e.length,normalize:r=!0}=t||{},c=e.slice(n,s);a(c,i,0,s-n);let f=(0,o.M)(c,{size:i,broken:!0,gridResolution:360,gridOffset:[-180,-180]});if(r)for(let e of f)l(e,i);return f}function r(e,t=null,i){let{size:s=2,normalize:c=!0,edgeTypes:f=!1}=i||{};t=t||[];let p=[],g=[],d=0,h=0;for(let o=0;o<=t.length;o++){let r=t[o]||e.length,l=h,c=function(e,t,i,o){let n=-1,s=-1;for(let r=i+1;r<o;r+=t){let t=Math.abs(e[r]);t>n&&(n=t,s=r-1)}return s}(e,s,d,r);for(let t=c;t<r;t++)p[h++]=e[t];for(let t=d;t<c;t++)p[h++]=e[t];a(p,s,l,h),function(e,t,i,o,s=85.051129){let r=e[i],a=e[o-t];if(Math.abs(r-a)>180){let o=(0,n.ah)(e,0,t,i);o[0]+=360*Math.round((a-r)/360),(0,n.VC)(e,o),o[1]=Math.sign(o[1])*s,(0,n.VC)(e,o),o[0]=r,(0,n.VC)(e,o)}}(p,s,l,h,i?.maxLatitude),d=r,g[o]=h}g.pop();let u=(0,o.w)(p,g,{size:s,gridResolution:360,gridOffset:[-180,-180],edgeTypes:f});if(c)for(let e of u)l(e.positions,s);return u}function a(e,t,i,o){let n,s=e[0];for(let r=i;r<o;r+=t){let t=(n=e[r])-s;(t>180||t<-180)&&(n-=360*Math.round(t/360)),e[r]=s=n}}function l(e,t){let i,o=e.length/t;for(let n=0;n<o&&((i=e[n*t])+180)%360==0;n++);let n=-(360*Math.round(i/360));if(0!==n)for(let i=0;i<o;i++)e[i*t]+=n}},76520(e,t,i){function o(e,t){let i=t.length,o=e.length;if(o>0){let n=!0;for(let s=0;s<i;s++)if(e[o-i+s]!==t[s]){n=!1;break}if(n)return!1}for(let n=0;n<i;n++)e[o+n]=t[n];return!0}function n(e,t){let i=t.length;for(let o=0;o<i;o++)e[o]=t[o]}function s(e,t,i,o,n=[]){let r=o+t*i;for(let t=0;t<i;t++)n[t]=e[r+t];return n}i.d(t,{C:()=>n,VC:()=>o,ah:()=>s})}}]);