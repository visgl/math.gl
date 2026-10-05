"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["8371"],{55230(t){function e(t,e,p){p=p||2;var f,g,v,P,m,x,y,L=e&&e.length,_=L?e[0]*p:t.length,C=i(t,0,_,p,!0),b=[];if(!C||C.next===C.prev)return b;if(L&&(C=function(t,e,r,l){var c,p,f,g,u,v=[];for(c=0,p=e.length;c<p;c++)f=e[c]*l,g=c<p-1?e[c+1]*l:t.length,(u=i(t,f,g,l,!1))===u.next&&(u.steiner=!0),v.push(function(t){var e=t,i=t;do(e.x<i.x||e.x===i.x&&e.y<i.y)&&(i=e),e=e.next;while(e!==t)return i}(u));for(v.sort(n),c=0;c<v.length;c++)r=function(t,e){var i=function(t,e){var i,o,n,r=e,l=t.x,c=t.y,p=-1/0;do{if(c<=r.y&&c>=r.next.y&&r.next.y!==r.y){var f=r.x+(c-r.y)*(r.next.x-r.x)/(r.next.y-r.y);if(f<=l&&f>p&&(p=f,n=r.x<r.next.x?r:r.next,f===l))return n}r=r.next}while(r!==e)if(!n)return null;var h,g=n,u=n.x,v=n.y,P=1/0;r=n;do{l>=r.x&&r.x>=u&&l!==r.x&&s(c<v?l:p,c,u,v,c<v?p:l,c,r.x,r.y)&&(h=Math.abs(c-r.y)/(l-r.x),d(r,t)&&(h<P||h===P&&(r.x>n.x||r.x===n.x&&(i=n,o=r,0>a(i.prev,i,o.prev)&&0>a(o.next,i,i.next))))&&(n=r,P=h)),r=r.next}while(r!==g)return n}(t,e);if(!i)return e;var n=h(i,t);return o(n,n.next),o(i,i.next)}(v[c],r);return r}(t,e,C,p)),t.length>80*p){f=v=t[0],g=P=t[1];for(var S=p;S<_;S+=p)m=t[S],x=t[S+1],m<f&&(f=m),x<g&&(g=x),m>v&&(v=m),x>P&&(P=x);y=0!==(y=Math.max(v-f,P-g))?32767/y:0}return function t(e,i,n,p,f,g,v){if(e){!v&&g&&function(t,e,i,o){var n=t;do 0===n.z&&(n.z=r(n.x,n.y,e,i,o)),n.prevZ=n.prev,n.nextZ=n.next,n=n.next;while(n!==t)n.prevZ.nextZ=null,n.prevZ=null,function(t){var e,i,o,n,r,s,a,l,c=1;do{for(i=t,t=null,r=null,s=0;i;){for(s++,o=i,a=0,e=0;e<c&&(a++,o=o.nextZ);e++);for(l=c;a>0||l>0&&o;)0!==a&&(0===l||!o||i.z<=o.z)?(n=i,i=i.nextZ,a--):(n=o,o=o.nextZ,l--),r?r.nextZ=n:t=n,n.prevZ=r,r=n;i=o}r.nextZ=null,c*=2}while(s>1)}(n)}(e,p,f,g);for(var P,m,x=e;e.prev!==e.next;){if(P=e.prev,m=e.next,g?function(t,e,i,o){var n=t.prev,l=t.next;if(a(n,t,l)>=0)return!1;for(var c=n.x,p=t.x,f=l.x,d=n.y,h=t.y,g=l.y,u=c<p?c<f?c:f:p<f?p:f,v=d<h?d<g?d:g:h<g?h:g,P=c>p?c>f?c:f:p>f?p:f,m=d>h?d>g?d:g:h>g?h:g,x=r(u,v,e,i,o),y=r(P,m,e,i,o),L=t.prevZ,_=t.nextZ;L&&L.z>=x&&_&&_.z<=y;){if(L.x>=u&&L.x<=P&&L.y>=v&&L.y<=m&&L!==n&&L!==l&&s(c,d,p,h,f,g,L.x,L.y)&&a(L.prev,L,L.next)>=0||(L=L.prevZ,_.x>=u&&_.x<=P&&_.y>=v&&_.y<=m&&_!==n&&_!==l&&s(c,d,p,h,f,g,_.x,_.y)&&a(_.prev,_,_.next)>=0))return!1;_=_.nextZ}for(;L&&L.z>=x;){if(L.x>=u&&L.x<=P&&L.y>=v&&L.y<=m&&L!==n&&L!==l&&s(c,d,p,h,f,g,L.x,L.y)&&a(L.prev,L,L.next)>=0)return!1;L=L.prevZ}for(;_&&_.z<=y;){if(_.x>=u&&_.x<=P&&_.y>=v&&_.y<=m&&_!==n&&_!==l&&s(c,d,p,h,f,g,_.x,_.y)&&a(_.prev,_,_.next)>=0)return!1;_=_.nextZ}return!0}(e,p,f,g):function(t){var e=t.prev,i=t.next;if(a(e,t,i)>=0)return!1;for(var o=e.x,n=t.x,r=i.x,l=e.y,c=t.y,p=i.y,f=o<n?o<r?o:r:n<r?n:r,d=l<c?l<p?l:p:c<p?c:p,h=o>n?o>r?o:r:n>r?n:r,g=l>c?l>p?l:p:c>p?c:p,u=i.next;u!==e;){if(u.x>=f&&u.x<=h&&u.y>=d&&u.y<=g&&s(o,l,n,c,r,p,u.x,u.y)&&a(u.prev,u,u.next)>=0)return!1;u=u.next}return!0}(e)){i.push(P.i/n|0),i.push(e.i/n|0),i.push(m.i/n|0),u(e),e=m.next,x=m.next;continue}if((e=m)===x){v?1===v?t(e=function(t,e,i){var n=t;do{var r=n.prev,s=n.next.next;!l(r,s)&&c(r,n,n.next,s)&&d(r,s)&&d(s,r)&&(e.push(r.i/i|0),e.push(n.i/i|0),e.push(s.i/i|0),u(n),u(n.next),n=t=s),n=n.next}while(n!==t)return o(n)}(o(e),i,n),i,n,p,f,g,2):2===v&&function(e,i,n,r,s,p){var f=e;do{for(var g,u,v=f.next.next;v!==f.prev;){if(f.i!==v.i&&(g=f,u=v,g.next.i!==u.i&&g.prev.i!==u.i&&!function(t,e){var i=t;do{if(i.i!==t.i&&i.next.i!==t.i&&i.i!==e.i&&i.next.i!==e.i&&c(i,i.next,t,e))return!0;i=i.next}while(i!==t)return!1}(g,u)&&(d(g,u)&&d(u,g)&&function(t,e){var i=t,o=!1,n=(t.x+e.x)/2,r=(t.y+e.y)/2;do i.y>r!=i.next.y>r&&i.next.y!==i.y&&n<(i.next.x-i.x)*(r-i.y)/(i.next.y-i.y)+i.x&&(o=!o),i=i.next;while(i!==t)return o}(g,u)&&(a(g.prev,g,u.prev)||a(g,u.prev,u))||l(g,u)&&a(g.prev,g,g.next)>0&&a(u.prev,u,u.next)>0))){var P=h(f,v);f=o(f,f.next),P=o(P,P.next),t(f,i,n,r,s,p,0),t(P,i,n,r,s,p,0);return}v=v.next}f=f.next}while(f!==e)}(e,i,n,p,f,g):t(o(e),i,n,p,f,g,1);break}}}}(C,b,p,f,g,y,0),b}function i(t,e,i,o,n){var r,s;if(n===P(t,e,i,o)>0)for(r=e;r<i;r+=o)s=g(r,t[r],t[r+1],s);else for(r=i-o;r>=e;r-=o)s=g(r,t[r],t[r+1],s);return s&&l(s,s.next)&&(u(s),s=s.next),s}function o(t,e){if(!t)return t;e||(e=t);var i,o=t;do if(i=!1,!o.steiner&&(l(o,o.next)||0===a(o.prev,o,o.next))){if(u(o),(o=e=o.prev)===o.next)break;i=!0}else o=o.next;while(i||o!==e)return e}function n(t,e){return t.x-e.x}function r(t,e,i,o,n){return(t=((t=((t=((t=((t=(t-i)*n|0)|t<<8)&0xff00ff)|t<<4)&0xf0f0f0f)|t<<2)&0x33333333)|t<<1)&0x55555555)|(e=((e=((e=((e=((e=(e-o)*n|0)|e<<8)&0xff00ff)|e<<4)&0xf0f0f0f)|e<<2)&0x33333333)|e<<1)&0x55555555)<<1}function s(t,e,i,o,n,r,s,a){return(n-s)*(e-a)>=(t-s)*(r-a)&&(t-s)*(o-a)>=(i-s)*(e-a)&&(i-s)*(r-a)>=(n-s)*(o-a)}function a(t,e,i){return(e.y-t.y)*(i.x-e.x)-(e.x-t.x)*(i.y-e.y)}function l(t,e){return t.x===e.x&&t.y===e.y}function c(t,e,i,o){var n=f(a(t,e,i)),r=f(a(t,e,o)),s=f(a(i,o,t)),l=f(a(i,o,e));return!!(n!==r&&s!==l||0===n&&p(t,i,e)||0===r&&p(t,o,e)||0===s&&p(i,t,o)||0===l&&p(i,e,o))}function p(t,e,i){return e.x<=Math.max(t.x,i.x)&&e.x>=Math.min(t.x,i.x)&&e.y<=Math.max(t.y,i.y)&&e.y>=Math.min(t.y,i.y)}function f(t){return t>0?1:t<0?-1:0}function d(t,e){return 0>a(t.prev,t,t.next)?a(t,e,t.next)>=0&&a(t,t.prev,e)>=0:0>a(t,e,t.prev)||0>a(t,t.next,e)}function h(t,e){var i=new v(t.i,t.x,t.y),o=new v(e.i,e.x,e.y),n=t.next,r=e.prev;return t.next=e,e.prev=t,i.next=n,n.prev=i,o.next=i,i.prev=o,r.next=o,o.prev=r,o}function g(t,e,i,o){var n=new v(t,e,i);return o?(n.next=o.next,n.prev=o,o.next.prev=n,o.next=n):(n.prev=n,n.next=n),n}function u(t){t.next.prev=t.prev,t.prev.next=t.next,t.prevZ&&(t.prevZ.nextZ=t.nextZ),t.nextZ&&(t.nextZ.prevZ=t.prevZ)}function v(t,e,i){this.i=t,this.x=e,this.y=i,this.prev=null,this.next=null,this.z=0,this.prevZ=null,this.nextZ=null,this.steiner=!1}function P(t,e,i,o){for(var n=0,r=e,s=i-o;r<i;r+=o)n+=(t[s]-t[r])*(t[r+1]+t[s+1]),s=r;return n}t.exports=e,t.exports.default=e,e.deviation=function(t,e,i,o){var n=e&&e.length,r=n?e[0]*i:t.length,s=Math.abs(P(t,0,r,i));if(n)for(var a=0,l=e.length;a<l;a++){var c=e[a]*i,p=a<l-1?e[a+1]*i:t.length;s-=Math.abs(P(t,c,p,i))}var f=0;for(a=0;a<o.length;a+=3){var d=o[a]*i,h=o[a+1]*i,g=o[a+2]*i;f+=Math.abs((t[d]-t[g])*(t[h+1]-t[d+1])-(t[d]-t[h])*(t[g+1]-t[d+1]))}return 0===s&&0===f?0:Math.abs((f-s)/s)},e.flatten=function(t){for(var e=t[0][0].length,i={vertices:[],holes:[],dimensions:e},o=0,n=0;n<t.length;n++){for(var r=0;r<t[n].length;r++)for(var s=0;s<e;s++)i.vertices.push(t[n][r][s]);n>0&&(o+=t[n-1].length,i.holes.push(o))}return i}},44941(t,e,i){i.d(e,{A:()=>a});var o=i(53439),n=i(23459),r=i(24067),s=i(26839);class a{constructor(t){this.indexStarts=[0],this.vertexStarts=[0],this.vertexCount=0,this.instanceCount=0;let{attributes:e={}}=t;this.typedArrayManager=n.A,this.attributes={},this._attributeDefs=e,this.opts=t,this.updateGeometry(t)}updateGeometry(t){Object.assign(this.opts,t);let{data:e,buffers:i={},getGeometry:o,geometryBuffer:n,positionFormat:s,dataChanged:a,normalize:l=!0}=this.opts;if(this.data=e,this.getGeometry=o,this.positionSize=n&&n.size||("XY"===s?2:3),this.buffers=i,this.normalize=l,n&&((0,r.A)(e.startIndices),this.getGeometry=this.getGeometryFromBuffer(n),l||(i.vertexPositions=n)),this.geometryBuffer=i.vertexPositions,Array.isArray(a))for(let t of a)this._rebuildGeometry(t);else this._rebuildGeometry()}updatePartialGeometry({startRow:t,endRow:e}){this._rebuildGeometry({startRow:t,endRow:e})}getGeometryFromBuffer(t){let e=t.value||t;return ArrayBuffer.isView(e)?(0,o.I)(e,{size:this.positionSize,offset:t.offset,stride:t.stride,startIndices:this.data.startIndices}):null}_allocate(t,e){let{attributes:i,buffers:o,_attributeDefs:n,typedArrayManager:r}=this;for(let s in n)if(s in o)r.release(i[s]),i[s]=null;else{let o=n[s];o.copy=e,i[s]=r.allocate(i[s],t,o)}}_forEachGeometry(t,e,i){let{data:n,getGeometry:r}=this,{iterable:s,objectInfo:a}=(0,o.X)(n,e,i);for(let e of s)a.index++,t(r?r(e,a):null,a.index)}_rebuildGeometry(t){if(!this.data)return;let{indexStarts:e,vertexStarts:i,instanceCount:o}=this,{data:n,geometryBuffer:r}=this,{startRow:a=0,endRow:l=1/0}=t||{},c={};if(t||(e=[0],i=[0]),this.normalize||!r)this._forEachGeometry((t,e)=>{let o=t&&this.normalizeGeometry(t);c[e]=o,i[e+1]=i[e]+(o?this.getGeometrySize(o):0)},a,l),o=i[i.length-1];else if(o=(i=n.startIndices)[n.length]||0,ArrayBuffer.isView(r))o=o||r.length/this.positionSize;else if(r instanceof s.h){let t=4*this.positionSize;o=o||r.byteLength/t}else if(r.buffer){let t=r.stride||4*this.positionSize;o=o||r.buffer.byteLength/t}else if(r.value){let t=r.value,e=r.stride/t.BYTES_PER_ELEMENT||this.positionSize;o=o||t.length/e}this._allocate(o,!!t),this.indexStarts=e,this.vertexStarts=i,this.instanceCount=o;let p={};this._forEachGeometry((t,n)=>{let r=c[n]||t;p.vertexStart=i[n],p.indexStart=e[n],p.geometrySize=(n<i.length-1?i[n+1]:o)-i[n],p.geometryIndex=n,this.updateGeometryAttributes(r,p)},a,l),this.vertexCount=e[e.length-1]}}},19896(t,e,i){i.d(e,{A:()=>E});var o=i(41881),n=i(84175),r=i(46487),s=i(95335),a=i(41367),l=i(52948),c=i(9350),p=i(25337),f=i(95263),d=i(44941),h=i(46146),g=i(92694);class u extends d.A{constructor(t){super({...t,attributes:{positions:{size:3,padding:18,initialize:!0,type:t.fp64?Float64Array:Float32Array},segmentTypes:{size:1,type:t.isWebGPU?Float32Array:Uint8ClampedArray}}})}get(t){return this.attributes[t]}getPathSegmentIndices(t){let e=this.attributes.segmentTypes,i=this.vertexStarts[t],o=Math.min(this.vertexStarts[t+1]??this.instanceCount,this.instanceCount),n=[];for(let t=i;t<o-1;t++)(4&e[t])==0&&n.push(t);return n.length&&(4&e[i])!=0&&n.unshift(n.pop()),n}getGeometryFromBuffer(t){return this.normalize||this.opts.isWebGPU?super.getGeometryFromBuffer(t):null}normalizeGeometry(t){return this.normalize?function(t,e,i,o){let n;if(Array.isArray(t[0])){n=Array(t.length*e);for(let i=0;i<t.length;i++)for(let o=0;o<e;o++)n[i*e+o]=t[i][o]||0}else n=t;return i?(0,h.M)(n,{size:e,gridResolution:i}):o?(0,g.I)(n,{size:e}):n}(t,this.positionSize,this.opts.resolution,this.opts.wrapLongitude):t}getGeometrySize(t){if(v(t)){let e=0;for(let i of t)e+=this.getGeometrySize(i);return e}let e=this.getPathLength(t);return e<2?0:this.isClosed(t)?e<3?0:e+2:e}updateGeometryAttributes(t,e){if(0!==e.geometrySize)if(t&&v(t))for(let i of t){let t=this.getGeometrySize(i);e.geometrySize=t,this.updateGeometryAttributes(i,e),e.vertexStart+=t}else this._updateSegmentTypes(t,e),this._updatePositions(t,e)}_updateSegmentTypes(t,e){let i=this.attributes.segmentTypes,o=!!t&&this.isClosed(t),{vertexStart:n,geometrySize:r}=e;i.fill(0,n,n+r),o?(i[n]=4,i[n+r-2]=4):(i[n]+=1,i[n+r-2]+=2),i[n+r-1]=4}_updatePositions(t,e){let{positions:i}=this.attributes;if(!i||!t)return;let{vertexStart:o,geometrySize:n}=e,r=[,,,];for(let e=o,s=0;s<n;e++,s++)this.getPointOnPath(t,s,r),i[3*e]=r[0],i[3*e+1]=r[1],i[3*e+2]=r[2]}getPathLength(t){return t.length/this.positionSize}getPointOnPath(t,e,i=[]){let{positionSize:o}=this;e*o>=t.length&&(e+=1-t.length/o);let n=e*o;return i[0]=t[n],i[1]=t[n+1],i[2]=3===o&&t[n+2]||0,i}isClosed(t){if(!this.normalize)return!!this.opts.loop;let{positionSize:e}=this,i=t.length-e;return t[0]===t[i]&&t[1]===t[i+1]&&(2===e||t[2]===t[i+2])}}function v(t){return Array.isArray(t[0])}let P=`\
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
`,vs:P,fs:P,uniformTypes:{widthScale:"f32",widthMinPixels:"f32",widthMaxPixels:"f32",jointType:"f32",capType:"f32",miterLimit:"f32",billboard:"f32",widthUnits:"i32"}},x=`\
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
`,y=`\
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
`,L=`\
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
`;var _=i(86402);let C=[0,0,0,255],b={widthUnits:"meters",widthScale:{type:"number",min:0,value:1},widthMinPixels:{type:"number",min:0,value:0},widthMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},jointRounded:!1,capRounded:!1,miterLimit:{type:"number",min:0,value:4},antialiasing:!1,billboard:!1,_pathType:null,getPath:{type:"accessor",value:t=>t.path},getColor:{type:"accessor",value:C},getWidth:{type:"accessor",value:1},rounded:{deprecatedFor:["jointRounded","capRounded"]}},S={enter:(t,e)=>e.length?e.subarray(e.length-t.length):t};function w(t,e){return t===e||!!(t&&e&&t.length===e.length&&t.every((t,i)=>t===e[i]))}class A extends o.A{getShaders(){let{antialiasing:t}=this.props;return super.getShaders({vs:y,fs:L,source:x,defines:t?{ANTIALIASING:1}:{},modules:[n.A,r.A,s.Ay,m,..."webgpu"===this.context.device.type?[_.A]:[]]})}get wrapLongitude(){return!1}getBounds(){return"webgpu"===this.context.device.type?null:this.getAttributeManager()?.getBounds(["vertexPositions"])}getPathProjectionScale(t){let e=this.props.coordinateSystem;if(!this.getAttributeManager()?.getAttributes().instanceDashOffsets)return null;if(t instanceof a.A&&t.zoom>=12&&("default"===e||"lnglat"===e||"cartesian"===e)){let i=l.A.getUniforms({viewport:t,coordinateSystem:e,coordinateOrigin:this.props.coordinateOrigin,autoWrapLongitude:this.wrapLongitude});return[t.projectionMode,i.coordinateOrigin[1],i.commonOrigin[1],...i.commonUnitsPerWorldUnit,...i.commonUnitsPerWorldUnit2,i.commonUnitsPerMeter[2]]}let i=function(t){if(t.isGeospatial)return null;let{unitsPerMeter:e}=t.distanceScales;return[e[0],e[1],e[2]]}(t);return i?[t.projectionMode,...i]:[t.projectionMode]}shouldUpdateState(t){let{viewport:e}=this.context;return super.shouldUpdateState(t)||this.state?.tessellationResolution!==e.resolution||!w(this.state?.pathProjectionScale,this.getPathProjectionScale(e))}initializeState(){let t="webgpu"===this.context.device.type;this.getAttributeManager().addInstanced({...t?{pathPositions:{size:24,type:"float32",transition:!1,accessor:"getPath",update:this.calculateWebGPUPositions,shaderAttributes:{instanceLeftPositions:{size:3,elementOffset:0},instanceStartPositions:{size:3,elementOffset:3},instanceEndPositions:{size:3,elementOffset:6},instanceRightPositions:{size:3,elementOffset:9},instanceLeftPositions64Low:{size:3,elementOffset:12},instanceStartPositions64Low:{size:3,elementOffset:15},instanceEndPositions64Low:{size:3,elementOffset:18},instanceRightPositions64Low:{size:3,elementOffset:21}},noAlloc:!0}}:{vertexPositions:{size:3,vertexOffset:1,type:"float64",fp64:this.use64bitPositions(),transition:S,accessor:"getPath",update:this.calculatePositions,noAlloc:!0,shaderAttributes:{instanceLeftPositions:{vertexOffset:0},instanceStartPositions:{vertexOffset:1},instanceEndPositions:{vertexOffset:2},instanceRightPositions:{vertexOffset:3}}}},instanceTypes:{size:1,type:t?"float32":"uint8",update:this.calculateSegmentTypes,noAlloc:!0},instanceStrokeWidths:{size:1,accessor:"getWidth",transition:!t&&S,defaultValue:1,bufferGroup:"path-instance-data"},instanceColors:{size:this.props.colorFormat.length,type:"unorm8",accessor:"getColor",transition:!t&&S,defaultValue:C,bufferGroup:"path-instance-data"},rowIndexes:{size:1,type:"uint32",accessor:(t,{index:e})=>t&&t.__source?t.__source.index:e,bufferGroup:"path-instance-data"}}),this.setState({pathTesselator:new u({fp64:this.use64bitPositions(),isWebGPU:t}),tessellationResolution:this.context.viewport.resolution,pathProjectionScale:this.getPathProjectionScale(this.context.viewport)})}updateState(t){super.updateState(t);let{props:e,oldProps:i,changeFlags:o}=t,n=this.getAttributeManager(),{viewport:r}=this.context,s=this.state.tessellationResolution!==r.resolution,a=this.getPathProjectionScale(r),l=!w(this.state.pathProjectionScale,a),c=o.updateTriggersChanged&&(o.updateTriggersChanged.all||o.updateTriggersChanged.getPath)||e._pathType!==i._pathType||e.positionFormat!==i.positionFormat||e.wrapLongitude!==i.wrapLongitude||s;if(o.dataChanged||c){let{pathTesselator:t}=this.state,i=e.data.attributes||{};t.updateGeometry({data:e.data,geometryBuffer:i.getPath,buffers:i,normalize:!e._pathType,loop:"loop"===e._pathType,getGeometry:e.getPath,positionFormat:e.positionFormat,wrapLongitude:e.wrapLongitude,resolution:r.resolution,dataChanged:c?void 0:o.dataChanged}),this.setState({numInstances:t.instanceCount,startIndices:t.vertexStarts,tessellationResolution:r.resolution,pathProjectionScale:a}),!o.dataChanged||c?n.invalidateAll():l&&n.invalidate("instanceDashOffsets")}else l&&(this.setState({pathProjectionScale:a}),n.invalidate("instanceDashOffsets"));(o.extensionsChanged||e.antialiasing!==i.antialiasing)&&(this.state.model?.destroy(),this.state.model=this._getModel(),n.invalidateAll())}getPickingInfo(t){let e=super.getPickingInfo(t),{index:i}=e,o=this.props.data;return o[0]&&o[0].__source&&(e.object=o.find(t=>t.__source.index===i)),e}disablePickingIndex(t){let e=this.props.data;if(e[0]&&e[0].__source)for(let i=0;i<e.length;i++)e[i].__source.index===t&&this._disablePickingIndex(i);else super.disablePickingIndex(t)}draw({uniforms:t}){let{jointRounded:e,capRounded:i,billboard:o,miterLimit:n,widthUnits:r,widthScale:s,widthMinPixels:a,widthMaxPixels:l}=this.props,p=this.state.model,f={jointType:Number(e),capType:Number(i),billboard:o,widthUnits:c.p5[r],widthScale:s,miterLimit:n,widthMinPixels:a,widthMaxPixels:l};p.shaderInputs.setProps({path:f}),p.draw(this.context.renderPass)}_getModel(){return new f.K(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new p.V({topology:"triangle-list",attributes:{indices:new Uint16Array([0,1,2,1,4,2,1,3,4,3,5,4]),positions:{value:new Float32Array([0,0,0,-1,0,1,1,-1,1,1,1,0]),size:2}}}),isInstanced:!0})}calculatePositions(t){let{pathTesselator:e}=this.state;t.startIndices=e.vertexStarts,t.value=e.get("positions")}calculateSegmentTypes(t){let{pathTesselator:e}=this.state;t.startIndices=e.vertexStarts,t.value=e.get("segmentTypes")}calculateWebGPUPositions(t){let{pathTesselator:e}=this.state,i=e.get("positions");if(!i){t.value=null;return}let o=e.instanceCount,n=new Float32Array(24*o),r=[-1,0,1,2];for(let t=0;t<o;t++){let e=24*t;for(let s=0;s<4;s++){let a=t+r[s],l=e+3*s;for(let t=0;t<3;t++){let e=a>=0&&a<o?i[3*a+t]:0,r=Math.fround(e);n[l+t]=r,n[l+t+12]=e-r}}}t.startIndices=e.vertexStarts,t.value=n}}A.defaultProps=b,A.layerName="PathLayer";let E=A},54895(t,e,i){i.d(e,{A:()=>H});var o=i(41881),n=i(84175),r=i(46487);Uint32Array.BYTES_PER_ELEMENT,l("colors");let s=l("floatColors");c("colors");let a=c("floatColors");function l(t){return`\
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
`}function c(t){return`\
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
`}var p=i(66925);let f=`\
layout(std140) uniform phongMaterialUniforms {
  uniform bool unlit;
  uniform float ambient;
  uniform float diffuse;
  uniform float shininess;
  uniform vec3  specularColor;
} material;
`,d=`\
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
`,h={props:{},name:"gouraudMaterial",bindingLayout:[{name:"gouraudMaterial",group:3}],vs:`\
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
`.replace("phongMaterial","gouraudMaterial"),fs:f.replace("phongMaterial","gouraudMaterial"),source:d.replaceAll("phongMaterial","gouraudMaterial"),defines:{LIGHTING_VERTEX:!0},dependencies:[p.x,{name:"floatColors",props:{},uniforms:{},vs:s,fs:s,source:a,uniformTypes:{useByteColors:"f32"},defaultUniforms:{useByteColors:!0}}],uniformTypes:{unlit:"i32",ambient:"f32",diffuse:"f32",shininess:"f32",specularColor:"vec3<f32>"},defaultUniforms:{unlit:!1,ambient:.35,diffuse:.6,shininess:32,specularColor:[38.25,38.25,38.25]},getUniforms:t=>({...h.defaultUniforms,...t})};var g=i(95335),u=i(95263),v=i(25337),P=i(55230);function m(t,e,i={}){return function(t,e={}){return Math.sign(function(t,e={}){let{start:i=0,end:o=t.length,plane:n="xy"}=e,r=e.size||2,s=0,a=x[n[0]],l=x[n[1]];for(let e=i,n=o-r;e<o;e+=r)s+=(t[e+a]-t[n+a])*(t[e+l]+t[n+l]),n=e;return s/2}(t,e))}(t,i)!==e&&(function(t,e){let{start:i=0,end:o=t.length,size:n=2}=e,r=(o-i)/n,s=Math.floor(r/2);for(let e=0;e<s;++e){let o=i+e*n,s=i+(r-1-e)*n;for(let e=0;e<n;++e){let i=t[o+e];t[o+e]=t[s+e],t[s+e]=i}}}(t,i),!0)}let x={x:0,y:1,z:2},y={isClosed:!0};function L(t){return"positions"in t?t.positions:t}function _(t){return"holeIndices"in t?t.holeIndices:null}function C(t,e,i,o,n){let r,s,a=e,l=i.length;for(let e=0;e<l;e++)for(let n=0;n<o;n++)t[a++]=i[e][n]||0;if(r=i[0],s=i[i.length-1],r[0]!==s[0]||r[1]!==s[1]||r[2]!==s[2])for(let e=0;e<o;e++)t[a++]=i[0][e]||0;return y.start=e,y.end=a,y.size=o,m(t,n,y),a}function b(t,e,i,o,n=0,r,s){let a=(r=r||i.length)-n;if(a<=0)return e;let l=e;for(let e=0;e<a;e++)t[l++]=i[n+e];if(!function(t,e,i,o){for(let n=0;n<e;n++)if(t[i+n]!==t[o-e+n])return!1;return!0}(i,o,n,r))for(let e=0;e<o;e++)t[l++]=i[n+e];return y.start=e,y.end=l,y.size=o,m(t,s,y),l}function S(t,e,i){let o=t.length/3,n=0;for(let r=0;r<o;r++){let s=(r+1)%o;n+=t[3*r+e]*t[3*s+i],n-=t[3*s+e]*t[3*r+i]}return Math.abs(n/2)}function w(t,e,i,o){let n=t.length/3;for(let r=0;r<n;r++){let n=3*r,s=t[n+0],a=t[n+1],l=t[n+2];t[n+e]=s,t[n+i]=a,t[n+o]=l}}var A=i(44941),E=i(46146),I=i(92694);class T extends A.A{constructor(t){let{fp64:e,IndexType:i=Uint32Array}=t;super({...t,attributes:{positions:{size:3,type:e?Float64Array:Float32Array},vertexValid:{type:Uint16Array,size:1},indices:{type:i,size:1}}})}get(t){let{attributes:e}=this;return"indices"===t?e.indices&&e.indices.subarray(0,this.vertexCount):e[t]}updateGeometry(t){super.updateGeometry(t);let e=this.buffers.indices;if(e)this.vertexCount=(e.value||e).length;else if(this.data&&!this.getGeometry)throw Error("missing indices buffer")}normalizeGeometry(t){if(this.normalize){let e=function(t,e){var i,o=t;if(!Array.isArray(o=o&&o.positions||o)&&!ArrayBuffer.isView(o))throw Error("invalid polygon");let n=[],r=[];if("positions"in t){let{positions:i,holeIndices:o}=t;if(o){let t=0;for(let s=0;s<=o.length;s++)t=b(n,t,i,e,o[s-1],o[s],0===s?1:-1),r.push(t);return r.pop(),{positions:n,holeIndices:r}}t=i}if(!Array.isArray(t[0]))return b(n,0,t,e,0,n.length,1),n;if(!((i=t).length>=1&&i[0].length>=2&&Number.isFinite(i[0][0]))){let i=0;for(let[o,s]of t.entries())i=C(n,i,s,e,0===o?1:-1),r.push(i);return r.pop(),{positions:n,holeIndices:r}}return C(n,0,t,e,1),n}(t,this.positionSize);return this.opts.resolution?(0,E.w)(L(e),_(e),{size:this.positionSize,gridResolution:this.opts.resolution,edgeTypes:!0}):this.opts.wrapLongitude?(0,I.E)(L(e),_(e),{size:this.positionSize,maxLatitude:86,edgeTypes:!0}):e}return t}getGeometrySize(t){if(D(t)){let e=0;for(let i of t)e+=this.getGeometrySize(i);return e}return L(t).length/this.positionSize}getGeometryFromBuffer(t){return this.normalize||!this.buffers.indices?super.getGeometryFromBuffer(t):null}updateGeometryAttributes(t,e){if(t&&D(t))for(let i of t){let t=this.getGeometrySize(i);e.geometrySize=t,this.updateGeometryAttributes(i,e),e.vertexStart+=t,e.indexStart=this.indexStarts[e.geometryIndex+1]}else this._updateIndices(t,e),this._updatePositions(t,e),this._updateVertexValid(t,e)}_updateIndices(t,{geometryIndex:e,vertexStart:i,indexStart:o}){let{attributes:n,indexStarts:r,typedArrayManager:s}=this,a=n.indices;if(!a||!t)return;let l=o,c=function(t,e,i,o){let n=_(t);n&&(n=n.map(t=>t/e));let r=L(t),s=o&&3===e;if(i){let t=r.length;r=r.slice();let o=[];for(let n=0;n<t;n+=e){o[0]=r[n],o[1]=r[n+1],s&&(o[2]=r[n+2]);let t=i(o);r[n]=t[0],r[n+1]=t[1],s&&(r[n+2]=t[2])}}if(s){let t=S(r,0,1),e=S(r,0,2),o=S(r,1,2);if(!t&&!e&&!o)return[];t>e&&t>o||(e>o?(i||(r=r.slice()),w(r,0,2,1)):(i||(r=r.slice()),w(r,2,0,1)))}return P(r,n,e)}(t,this.positionSize,this.opts.preproject,this.opts.full3d);a=s.allocate(a,o+c.length,{copy:!0});for(let t=0;t<c.length;t++)a[l++]=c[t]+i;r[e+1]=o+c.length,n.indices=a}_updatePositions(t,{vertexStart:e,geometrySize:i}){let{attributes:{positions:o},positionSize:n}=this;if(!o||!t)return;let r=L(t);for(let t=e,s=0;s<i;t++,s++){let e=r[s*n],i=r[s*n+1],a=n>2?r[s*n+2]:0;o[3*t]=e,o[3*t+1]=i,o[3*t+2]=a}}_updateVertexValid(t,{vertexStart:e,geometrySize:i}){let{positionSize:o}=this,n=this.attributes.vertexValid,r=t&&_(t);if(t&&t.edgeTypes?n.set(t.edgeTypes,e):n.fill(1,e,e+i),r)for(let t=0;t<r.length;t++)n[e+r[t]/o-1]=0;n[e+i-1]=0}}function D(t){return Array.isArray(t)&&t.length>0&&!Number.isFinite(t[0])}let O=`\
layout(std140) uniform solidPolygonUniforms {
  bool extruded;
  bool isWireframe;
  float elevationScale;
} solidPolygon;
`,z={name:"solidPolygon",source:`\
struct SolidPolygonUniforms {
  extruded: f32,
  isWireframe: f32,
  elevationScale: f32,
};

@group(0) @binding(auto) var<uniform> solidPolygon: SolidPolygonUniforms;
`,vs:O,fs:O,uniformTypes:{extruded:"f32",isWireframe:"f32",elevationScale:"f32"}},R=`\
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
`,N=`\
#version 300 es
#define SHADER_NAME solid-polygon-layer-vertex-shader
in vec3 vertexPositions;
in vec3 vertexPositions64Low;
in float elevations;
${R}
void main(void) {
PolygonProps props;
props.positions = vertexPositions;
props.positions64Low = vertexPositions64Low;
props.elevations = elevations;
props.normal = vec3(0.0, 0.0, 1.0);
calculatePosition(props);
}
`,M=`\
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
${R}
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
`,j=`\
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
`;function B(){return`\
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
`}function V(){return`\
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
`}var G=i(86402);let F=[0,0,0,255],U={enter:(t,e)=>e.length?e.subarray(e.length-t.length):t};class k extends o.A{getShaders(t){var e;let i=this.props._normalize||"CCW"!==this.props._windingOrder?1:0;return super.getShaders({vs:"top"===t?N:M,fs:j,source:(e=!!i,"top"===t?`\
${B()}

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

${V()}
`:`\
const RING_WINDING_ORDER_CW: bool = ${e?"true":"false"};

${B()}

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

${V()}
`),defines:{RING_WINDING_ORDER_CW:i},modules:[n.A,r.A,h,g.Ay,z,..."webgpu"===this.context.device.type?[G.A]:[]]})}get wrapLongitude(){return!1}getBounds(){return this.getAttributeManager()?.getBounds(["vertexPositions"])}initializeState(){let t,{viewport:e}=this.context,{coordinateSystem:i}=this.props,{_full3d:o}=this.props;e.isGeospatial&&"default"===i&&(i="lnglat"),"lnglat"===i&&(t=o?e.projectPosition.bind(e):e.projectFlat.bind(e)),this.setState({numInstances:0,polygonTesselator:new T({preproject:t,fp64:this.use64bitPositions(),IndexType:Uint32Array})});let n=this.getAttributeManager(),r="webgpu"===this.context.device.type;n.add({indices:{size:1,isIndexed:!0,update:this.calculateIndices,noAlloc:!0},vertexPositions:{size:3,type:"float64",stepMode:"dynamic",fp64:this.use64bitPositions(),transition:U,accessor:"getPolygon",update:this.calculatePositions,noAlloc:!0,...r?{}:{shaderAttributes:{nextVertexPositions:{vertexOffset:1}}}},...r?{nextVertexPositions:{size:3,type:"float64",stepMode:"dynamic",fp64:this.use64bitPositions(),transition:!1,update:this.calculateNextPositions,noAlloc:!0}}:{},[r?"vertexValid":"instanceVertexValid"]:{size:1,type:r?"float32":"uint16",stepMode:"instance",update:this.calculateVertexValid,noAlloc:!0},elevations:{size:1,stepMode:"dynamic",transition:U,accessor:"getElevation",bufferGroup:"solid-polygon-instance-data"},fillColors:{size:this.props.colorFormat.length,type:"unorm8",stepMode:"dynamic",transition:U,accessor:"getFillColor",defaultValue:F,bufferGroup:"solid-polygon-instance-data"},lineColors:{size:this.props.colorFormat.length,type:"unorm8",stepMode:"dynamic",transition:U,accessor:"getLineColor",defaultValue:F,bufferGroup:"solid-polygon-instance-data"},rowIndexes:{size:1,type:"uint32",stepMode:"dynamic",accessor:(t,{index:e})=>t&&t.__source?t.__source.index:e,bufferGroup:"solid-polygon-instance-data"}})}getPickingInfo(t){let e=super.getPickingInfo(t),{index:i}=e,o=this.props.data;return o[0]&&o[0].__source&&(e.object=o.find(t=>t.__source.index===i)),e}disablePickingIndex(t){let e=this.props.data;if(e[0]&&e[0].__source)for(let i=0;i<e.length;i++)e[i].__source.index===t&&this._disablePickingIndex(i);else super.disablePickingIndex(t)}draw({uniforms:t}){let{extruded:e,filled:i,wireframe:o,elevationScale:n}=this.props,{topModel:r,sideModel:s,wireframeModel:a,polygonTesselator:l}=this.state,c={extruded:!!e,elevationScale:n,isWireframe:!1};a&&o&&(a.setInstanceCount(l.instanceCount-1),a.shaderInputs.setProps({solidPolygon:{...c,isWireframe:!0}}),a.draw(this.context.renderPass)),s&&i&&(s.setInstanceCount(l.instanceCount-1),s.shaderInputs.setProps({solidPolygon:c}),s.draw(this.context.renderPass)),r&&i&&(r.setVertexCount(l.vertexCount),r.shaderInputs.setProps({solidPolygon:c}),r.draw(this.context.renderPass))}updateState(t){super.updateState(t),this.updateGeometry(t);let{props:e,oldProps:i,changeFlags:o}=t,n=this.getAttributeManager();(o.extensionsChanged||e.filled!==i.filled||e.extruded!==i.extruded)&&(this.state.models?.forEach(t=>t.destroy()),this.setState(this._getModels()),n.invalidateAll())}updateGeometry({props:t,oldProps:e,changeFlags:i}){if(i.dataChanged||i.updateTriggersChanged&&(i.updateTriggersChanged.all||i.updateTriggersChanged.getPolygon)){let{polygonTesselator:e}=this.state,o=t.data.attributes||{};e.updateGeometry({data:t.data,normalize:t._normalize,geometryBuffer:o.getPolygon,buffers:"webgpu"===this.context.device.type?{...o}:o,getGeometry:t.getPolygon,positionFormat:t.positionFormat,wrapLongitude:t.wrapLongitude,resolution:this.context.viewport.resolution,fp64:this.use64bitPositions(),dataChanged:i.dataChanged,full3d:t._full3d}),this.setState({numInstances:e.instanceCount,startIndices:e.vertexStarts}),i.dataChanged||this.getAttributeManager().invalidateAll()}}_getModels(){let t,e,i,{id:o,filled:n,extruded:r}=this.props;if(n){let e=this.getShaders("top");e.defines={...e.defines,NON_INSTANCED_MODEL:1};let i=this.getAttributeManager().getBufferLayouts({isInstanced:!1});"webgpu"===this.context.device.type&&(i=i.filter(t=>"indices"!==t.name&&"vertexValid"!==t.name&&"instanceVertexValid"!==t.name&&"nextVertexPositions"!==t.name)),t=new u.K(this.context.device,{...e,id:`${o}-top`,topology:"triangle-list",bufferLayout:i,isIndexed:!0,userData:{excludeAttributes:{vertexValid:!0,instanceVertexValid:!0,nextVertexPositions:!0}}})}if(r){let t=this.getAttributeManager().getBufferLayouts({isInstanced:!0});"webgpu"===this.context.device.type&&(t=t.filter(t=>"indices"!==t.name)),e=new u.K(this.context.device,{...this.getShaders("side"),id:`${o}-side`,bufferLayout:t,geometry:new v.V({topology:"triangle-strip",attributes:{positions:{size:2,value:new Float32Array([1,0,0,0,1,1,0,1])}}}),isInstanced:!0,userData:{excludeAttributes:{indices:!0}}}),i=new u.K(this.context.device,{...this.getShaders("side"),id:`${o}-wireframe`,bufferLayout:t,geometry:new v.V({topology:"line-strip",attributes:{positions:{size:2,value:new Float32Array([1,0,0,0,0,1,1,1])}}}),isInstanced:!0,userData:{excludeAttributes:{indices:!0}}})}return{models:[e,i,t].filter(Boolean),topModel:t,sideModel:e,wireframeModel:i}}calculateIndices(t){let{polygonTesselator:e}=this.state;t.startIndices=e.indexStarts,t.value=e.get("indices")}calculatePositions(t){let{polygonTesselator:e}=this.state;t.startIndices=e.vertexStarts;let i=this.props.data.attributes?.getPolygon;if("webgpu"===this.context.device.type&&ArrayBuffer.isView(i?.value)){let{value:o,size:n=3,offset:r=0,stride:s}=i,a=r/o.BYTES_PER_ELEMENT,l=s?s/o.BYTES_PER_ELEMENT:n,c=new Float64Array(3*e.instanceCount);for(let t=0;t<e.instanceCount;t++){let e=a+t*l,i=3*t;c[i]=o[e],c[i+1]=o[e+1],c[i+2]=n>2?o[e+2]:0}t.value=c;return}t.value=e.get("positions")}calculateVertexValid(t){let e=this.props.data.attributes?.instanceVertexValid?.value,i="webgpu"===this.context.device.type&&e?e:this.state.polygonTesselator.get("vertexValid");t.value="webgpu"===this.context.device.type&&i?Float32Array.from(i):i}calculateNextPositions(t){let{polygonTesselator:e}=this.state,i=this.getAttributeManager().getAttributes(),o=i.vertexPositions.value,n=this.props.data.attributes?.instanceVertexValid?.value||i.vertexValid?.value||e.get("vertexValid");if(t.startIndices=e.vertexStarts,!o){t.value=o;return}let r=o.length/3,s=new o.constructor(o.length);for(let t=0;t<r;t++){let e=3*t,i=n?.[t]&&t+1<r?e+3:e;for(let t=0;t<3;t++)s[e+t]=o[i+t]}t.value=s}}k.defaultProps={filled:!0,extruded:!1,wireframe:!1,_normalize:!0,_windingOrder:"CW",_full3d:!1,elevationScale:{type:"number",min:0,value:1},getPolygon:{type:"accessor",value:t=>t.polygon},getElevation:{type:"accessor",value:1e3},getFillColor:{type:"accessor",value:F},getLineColor:{type:"accessor",value:F},material:!0},k.layerName="SolidPolygonLayer";let H=k},86402(t,e,i){i.d(e,{A:()=>o});let o={name:"clip",source:`\
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
`,props:{},uniforms:{},bindingLayout:[{name:"clip",group:2}],uniformTypes:{enabled:"i32",mode:"i32",bounds:"vec4<f32>"},defaultUniforms:{enabled:0,mode:0,bounds:[0,0,1,1]},getUniforms(t={}){let e={};return void 0!==t.enabled&&(e.enabled=+!!t.enabled),void 0!==t.mode&&(e.mode=+("instance"===t.mode)),void 0!==t.bounds&&(e.bounds=t.bounds),e}}},46146(t,e,i){function o(t,e,i,n,r=[]){let s,a;if(8&i)s=(n[3]-t[1])/(e[1]-t[1]),a=3;else if(4&i)s=(n[1]-t[1])/(e[1]-t[1]),a=1;else if(2&i)s=(n[2]-t[0])/(e[0]-t[0]),a=2;else{if(!(1&i))return null;s=(n[0]-t[0])/(e[0]-t[0]),a=0}for(let i=0;i<t.length;i++)r[i]=(1&a)===i?n[a]:s*(e[i]-t[i])+t[i];return r}function n(t,e){let i=0;return t[0]<e[0]?i|=1:t[0]>e[2]&&(i|=2),t[1]<e[1]?i|=4:t[1]>e[3]&&(i|=8),i}i.d(e,{w:()=>a,M:()=>s});var r=i(77019);function s(t,e){let i,s,{size:a=2,broken:l=!1,gridResolution:p=10,gridOffset:f=[0,0],startIndex:d=0,endIndex:h=t.length}=e||{},g=(h-d)/a,u=[],v=[u],P=(0,r.ah)(t,0,a,d),m=c(P,p,f,[]),x=[];(0,r.VC)(u,P);for(let e=1;e<g;e++){for(s=n(i=(0,r.ah)(t,e,a,d,i),m);s;){var y,L,_;o(P,i,s,m,x);let t=n(x,m);t&&(o(P,x,t,m,x),s=t),(0,r.VC)(u,x),(0,r.C)(P,x),y=m,L=p,8&(_=s)?(y[1]+=L,y[3]+=L):4&_?(y[1]-=L,y[3]-=L):2&_?(y[0]+=L,y[2]+=L):1&_&&(y[0]-=L,y[2]-=L),l&&u.length>a&&(u=[],v.push(u),(0,r.VC)(u,P)),s=n(i,m)}(0,r.VC)(u,i),(0,r.C)(P,i)}return l?v:v[0]}function a(t,e=null,i){if(!t.length)return[];let{size:o=2,gridResolution:r=10,gridOffset:s=[0,0],edgeTypes:f=!1}=i||{},d=[],h=[{pos:t,types:f?Array(t.length/o).fill(1):null,holes:e||[]}],g=[[],[]],u=[];for(;h.length;){let{pos:t,types:e,holes:i}=h.shift();(function(t,e,i,o){let n=1/0,r=-1/0,s=1/0,a=-1/0;for(let o=0;o<i;o+=e){let e=t[o],i=t[o+1];n=e<n?e:n,r=e>r?e:r,s=i<s?i:s,a=i>a?i:a}o[0][0]=n,o[0][1]=s,o[1][0]=r,o[1][1]=a})(t,o,i[0]||t.length,g),u=c(g[0],r,s,u);let a=n(g[1],u);if(a){let n=l(t,e,o,0,i[0]||t.length,u,a),r={pos:n[0].pos,types:n[0].types,holes:[]},s={pos:n[1].pos,types:n[1].types,holes:[]};h.push(r,s);for(let c=0;c<i.length;c++)(n=l(t,e,o,i[c],i[c+1]||t.length,u,a))[0]&&(r.holes.push(r.pos.length),r.pos=p(r.pos,n[0].pos),f&&(r.types=p(r.types,n[0].types))),n[1]&&(s.holes.push(s.pos.length),s.pos=p(s.pos,n[1].pos),f&&(s.types=p(s.types,n[1].types)))}else{let o={positions:t};f&&(o.edgeTypes=e),i.length&&(o.holeIndices=i),d.push(o)}}return d}function l(t,e,i,n,s,a,l){let c,p,f,d=(s-n)/i,h=[],g=[],u=[],v=[],P=[],m=(0,r.ah)(t,d-1,i,n),x=Math.sign(8&l?m[1]-a[3]:m[0]-a[2]),y=e&&e[d-1],L=0,_=0;for(let s=0;s<d;s++)c=(0,r.ah)(t,s,i,n,c),p=Math.sign(8&l?c[1]-a[3]:c[0]-a[2]),f=e&&e[n/i+s],p&&x&&x!==p&&(o(m,c,l,a,P),(0,r.VC)(h,P)&&u.push(y),(0,r.VC)(g,P)&&v.push(y)),p<=0?((0,r.VC)(h,c)&&u.push(f),L-=p):u.length&&(u[u.length-1]=0),p>=0?((0,r.VC)(g,c)&&v.push(f),_+=p):v.length&&(v[v.length-1]=0),(0,r.C)(m,c),x=p,y=f;return[L?{pos:h,types:e&&u}:null,_?{pos:g,types:e&&v}:null]}function c(t,e,i,o){let n=Math.floor((t[0]-i[0])/e)*e+i[0],r=Math.floor((t[1]-i[1])/e)*e+i[1];return o[0]=n,o[1]=r,o[2]=n+e,o[3]=r+e,o}function p(t,e){for(let i=0;i<e.length;i++)t.push(e[i]);return t}},92694(t,e,i){i.d(e,{E:()=>s,I:()=>r});var o=i(46146),n=i(77019);function r(t,e){let{size:i=2,startIndex:n=0,endIndex:r=t.length,normalize:s=!0}=e||{},c=t.slice(n,r);a(c,i,0,r-n);let p=(0,o.M)(c,{size:i,broken:!0,gridResolution:360,gridOffset:[-180,-180]});if(s)for(let t of p)l(t,i);return p}function s(t,e=null,i){let{size:r=2,normalize:c=!0,edgeTypes:p=!1}=i||{};e=e||[];let f=[],d=[],h=0,g=0;for(let o=0;o<=e.length;o++){let s=e[o]||t.length,l=g,c=function(t,e,i,o){let n=-1,r=-1;for(let s=i+1;s<o;s+=e){let e=Math.abs(t[s]);e>n&&(n=e,r=s-1)}return r}(t,r,h,s);for(let e=c;e<s;e++)f[g++]=t[e];for(let e=h;e<c;e++)f[g++]=t[e];a(f,r,l,g),function(t,e,i,o,r=85.051129){let s=t[i],a=t[o-e];if(Math.abs(s-a)>180){let o=(0,n.ah)(t,0,e,i);o[0]+=360*Math.round((a-s)/360),(0,n.VC)(t,o),o[1]=Math.sign(o[1])*r,(0,n.VC)(t,o),o[0]=s,(0,n.VC)(t,o)}}(f,r,l,g,i?.maxLatitude),h=s,d[o]=g}d.pop();let u=(0,o.w)(f,d,{size:r,gridResolution:360,gridOffset:[-180,-180],edgeTypes:p});if(c)for(let t of u)l(t.positions,r);return u}function a(t,e,i,o){let n,r=t[0];for(let s=i;s<o;s+=e){let e=(n=t[s])-r;(e>180||e<-180)&&(n-=360*Math.round(e/360)),t[s]=r=n}}function l(t,e){let i,o=t.length/e;for(let n=0;n<o&&((i=t[n*e])+180)%360==0;n++);let n=-(360*Math.round(i/360));if(0!==n)for(let i=0;i<o;i++)t[i*e]+=n}},77019(t,e,i){function o(t,e){let i=e.length,o=t.length;if(o>0){let n=!0;for(let r=0;r<i;r++)if(t[o-i+r]!==e[r]){n=!1;break}if(n)return!1}for(let n=0;n<i;n++)t[o+n]=e[n];return!0}function n(t,e){let i=e.length;for(let o=0;o<i;o++)t[o]=e[o]}function r(t,e,i,o,n=[]){let s=o+e*i;for(let e=0;e<i;e++)n[e]=t[s+e];return n}i.d(e,{C:()=>n,VC:()=>o,ah:()=>r})},66925(t,e,i){i.d(e,{x:()=>a});var o=i(29651);let n=`\
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
`;var s=i(55611);let a={props:{},uniforms:{},name:"lighting",defines:{},uniformTypes:{enabled:"i32",directionalLightCount:"i32",pointLightCount:"i32",spotLightCount:"i32",ambientColor:"vec3<f32>",lights:[{color:"vec3<f32>",position:"vec3<f32>",direction:"vec3<f32>",attenuation:"vec3<f32>",coneCos:"vec2<f32>"},5]},defaultUniforms:c(),bindingLayout:[{name:"lighting",group:2}],firstBindingSlot:0,source:r,vs:n,fs:n,getUniforms:function(t,e={}){if(!(t=t?{...t}:t))return c();t.lights&&(t={...t,...function(t){let e={pointLights:[],spotLights:[],directionalLights:[]};for(let i of t||[])switch(i.type){case"ambient":e.ambientLight=i;break;case"directional":e.directionalLights?.push(i);break;case"point":e.pointLights?.push(i);break;case"spot":e.spotLights?.push(i)}return e}(t.lights),lights:void 0});let{useByteColors:i,ambientLight:n,pointLights:r,spotLights:s,directionalLights:a}=t||{};if(!(n||r&&r.length>0||s&&s.length>0||a&&a.length>0))return{...c(),enabled:0};let f={...c(),...function({useByteColors:t,ambientLight:e,pointLights:i=[],spotLights:n=[],directionalLights:r=[]}){let s=p(),a=0,c=0,f=0,d=0;for(let e of i){if(a>=5)break;s[a]={...s[a],color:l(e,t),position:e.position,attenuation:e.attenuation||[1,0,0]},a++,c++}for(let e of n){var h;if(a>=5)break;s[a]={...s[a],color:l(e,t),position:e.position,direction:e.direction,attenuation:e.attenuation||[1,0,0],coneCos:[Math.cos((h=e).innerConeAngle??0),Math.cos(h.outerConeAngle??Math.PI/4)]},a++,f++}for(let e of r){if(a>=5)break;s[a]={...s[a],color:l(e,t),direction:e.direction},a++,d++}return i.length+n.length+r.length>5&&o.R.warn("MAX_LIGHTS exceeded, truncating to 5")(),{ambientColor:l(e,t),directionalLightCount:d,pointLightCount:c,spotLightCount:f,lights:s}}({useByteColors:i,ambientLight:n,pointLights:r,spotLights:s,directionalLights:a})};return void 0!==t.enabled&&(f.enabled=+!!t.enabled),f}};function l(t={},e){let{color:i=[0,0,0],intensity:o=1}=t;return(0,s.sC)(i,(0,s.eS)(e,!0)).map(t=>t*o)}function c(){return{enabled:1,directionalLightCount:0,pointLightCount:0,spotLightCount:0,ambientColor:[.1,.1,.1],lights:p()}}function p(){return Array.from({length:5},()=>({color:[1,1,1],position:[1,1,2],direction:[1,1,1],attenuation:[1,0,0],coneCos:[1,0]}))}}}]);