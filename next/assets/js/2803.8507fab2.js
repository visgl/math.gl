"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["2803"],{55230(e){function t(e,t,c){c=c||2;var u,g,v,h,y,m,P,_=t&&t.length,C=_?t[0]*c:e.length,b=o(e,0,C,c,!0),w=[];if(!b||b.next===b.prev)return w;if(_&&(b=function(e,t,n,a){var p,c,u,g,x,v=[];for(p=0,c=t.length;p<c;p++)u=t[p]*a,g=p<c-1?t[p+1]*a:e.length,(x=o(e,u,g,a,!1))===x.next&&(x.steiner=!0),v.push(function(e){var t=e,o=e;do(t.x<o.x||t.x===o.x&&t.y<o.y)&&(o=t),t=t.next;while(t!==e)return o}(x));for(v.sort(r),p=0;p<v.length;p++)n=function(e,t){var o=function(e,t){var o,i,r,n=t,a=e.x,p=e.y,c=-1/0;do{if(p<=n.y&&p>=n.next.y&&n.next.y!==n.y){var u=n.x+(p-n.y)*(n.next.x-n.x)/(n.next.y-n.y);if(u<=a&&u>c&&(c=u,r=n.x<n.next.x?n:n.next,u===a))return r}n=n.next}while(n!==t)if(!r)return null;var d,g=r,x=r.x,v=r.y,h=1/0;n=r;do{a>=n.x&&n.x>=x&&a!==n.x&&s(p<v?a:c,p,x,v,p<v?c:a,p,n.x,n.y)&&(d=Math.abs(p-n.y)/(a-n.x),f(n,e)&&(d<h||d===h&&(n.x>r.x||n.x===r.x&&(o=r,i=n,0>l(o.prev,o,i.prev)&&0>l(i.next,o,o.next))))&&(r=n,h=d)),n=n.next}while(n!==g)return r}(e,t);if(!o)return t;var r=d(o,e);return i(r,r.next),i(o,o.next)}(v[p],n);return n}(e,t,b,c)),e.length>80*c){u=v=e[0],g=h=e[1];for(var I=c;I<C;I+=c)y=e[I],m=e[I+1],y<u&&(u=y),m<g&&(g=m),y>v&&(v=y),m>h&&(h=m);P=0!==(P=Math.max(v-u,h-g))?32767/P:0}return function e(t,o,r,c,u,g,v){if(t){!v&&g&&function(e,t,o,i){var r=e;do 0===r.z&&(r.z=n(r.x,r.y,t,o,i)),r.prevZ=r.prev,r.nextZ=r.next,r=r.next;while(r!==e)r.prevZ.nextZ=null,r.prevZ=null,function(e){var t,o,i,r,n,s,l,a,p=1;do{for(o=e,e=null,n=null,s=0;o;){for(s++,i=o,l=0,t=0;t<p&&(l++,i=i.nextZ);t++);for(a=p;l>0||a>0&&i;)0!==l&&(0===a||!i||o.z<=i.z)?(r=o,o=o.nextZ,l--):(r=i,i=i.nextZ,a--),n?n.nextZ=r:e=r,r.prevZ=n,n=r;o=i}n.nextZ=null,p*=2}while(s>1)}(r)}(t,c,u,g);for(var h,y,m=t;t.prev!==t.next;){if(h=t.prev,y=t.next,g?function(e,t,o,i){var r=e.prev,a=e.next;if(l(r,e,a)>=0)return!1;for(var p=r.x,c=e.x,u=a.x,f=r.y,d=e.y,g=a.y,x=p<c?p<u?p:u:c<u?c:u,v=f<d?f<g?f:g:d<g?d:g,h=p>c?p>u?p:u:c>u?c:u,y=f>d?f>g?f:g:d>g?d:g,m=n(x,v,t,o,i),P=n(h,y,t,o,i),_=e.prevZ,C=e.nextZ;_&&_.z>=m&&C&&C.z<=P;){if(_.x>=x&&_.x<=h&&_.y>=v&&_.y<=y&&_!==r&&_!==a&&s(p,f,c,d,u,g,_.x,_.y)&&l(_.prev,_,_.next)>=0||(_=_.prevZ,C.x>=x&&C.x<=h&&C.y>=v&&C.y<=y&&C!==r&&C!==a&&s(p,f,c,d,u,g,C.x,C.y)&&l(C.prev,C,C.next)>=0))return!1;C=C.nextZ}for(;_&&_.z>=m;){if(_.x>=x&&_.x<=h&&_.y>=v&&_.y<=y&&_!==r&&_!==a&&s(p,f,c,d,u,g,_.x,_.y)&&l(_.prev,_,_.next)>=0)return!1;_=_.prevZ}for(;C&&C.z<=P;){if(C.x>=x&&C.x<=h&&C.y>=v&&C.y<=y&&C!==r&&C!==a&&s(p,f,c,d,u,g,C.x,C.y)&&l(C.prev,C,C.next)>=0)return!1;C=C.nextZ}return!0}(t,c,u,g):function(e){var t=e.prev,o=e.next;if(l(t,e,o)>=0)return!1;for(var i=t.x,r=e.x,n=o.x,a=t.y,p=e.y,c=o.y,u=i<r?i<n?i:n:r<n?r:n,f=a<p?a<c?a:c:p<c?p:c,d=i>r?i>n?i:n:r>n?r:n,g=a>p?a>c?a:c:p>c?p:c,x=o.next;x!==t;){if(x.x>=u&&x.x<=d&&x.y>=f&&x.y<=g&&s(i,a,r,p,n,c,x.x,x.y)&&l(x.prev,x,x.next)>=0)return!1;x=x.next}return!0}(t)){o.push(h.i/r|0),o.push(t.i/r|0),o.push(y.i/r|0),x(t),t=y.next,m=y.next;continue}if((t=y)===m){v?1===v?e(t=function(e,t,o){var r=e;do{var n=r.prev,s=r.next.next;!a(n,s)&&p(n,r,r.next,s)&&f(n,s)&&f(s,n)&&(t.push(n.i/o|0),t.push(r.i/o|0),t.push(s.i/o|0),x(r),x(r.next),r=e=s),r=r.next}while(r!==e)return i(r)}(i(t),o,r),o,r,c,u,g,2):2===v&&function(t,o,r,n,s,c){var u=t;do{for(var g,x,v=u.next.next;v!==u.prev;){if(u.i!==v.i&&(g=u,x=v,g.next.i!==x.i&&g.prev.i!==x.i&&!function(e,t){var o=e;do{if(o.i!==e.i&&o.next.i!==e.i&&o.i!==t.i&&o.next.i!==t.i&&p(o,o.next,e,t))return!0;o=o.next}while(o!==e)return!1}(g,x)&&(f(g,x)&&f(x,g)&&function(e,t){var o=e,i=!1,r=(e.x+t.x)/2,n=(e.y+t.y)/2;do o.y>n!=o.next.y>n&&o.next.y!==o.y&&r<(o.next.x-o.x)*(n-o.y)/(o.next.y-o.y)+o.x&&(i=!i),o=o.next;while(o!==e)return i}(g,x)&&(l(g.prev,g,x.prev)||l(g,x.prev,x))||a(g,x)&&l(g.prev,g,g.next)>0&&l(x.prev,x,x.next)>0))){var h=d(u,v);u=i(u,u.next),h=i(h,h.next),e(u,o,r,n,s,c,0),e(h,o,r,n,s,c,0);return}v=v.next}u=u.next}while(u!==t)}(t,o,r,c,u,g):e(i(t),o,r,c,u,g,1);break}}}}(b,w,c,u,g,P,0),w}function o(e,t,o,i,r){var n,s;if(r===h(e,t,o,i)>0)for(n=t;n<o;n+=i)s=g(n,e[n],e[n+1],s);else for(n=o-i;n>=t;n-=i)s=g(n,e[n],e[n+1],s);return s&&a(s,s.next)&&(x(s),s=s.next),s}function i(e,t){if(!e)return e;t||(t=e);var o,i=e;do if(o=!1,!i.steiner&&(a(i,i.next)||0===l(i.prev,i,i.next))){if(x(i),(i=t=i.prev)===i.next)break;o=!0}else i=i.next;while(o||i!==t)return t}function r(e,t){return e.x-t.x}function n(e,t,o,i,r){return(e=((e=((e=((e=((e=(e-o)*r|0)|e<<8)&0xff00ff)|e<<4)&0xf0f0f0f)|e<<2)&0x33333333)|e<<1)&0x55555555)|(t=((t=((t=((t=((t=(t-i)*r|0)|t<<8)&0xff00ff)|t<<4)&0xf0f0f0f)|t<<2)&0x33333333)|t<<1)&0x55555555)<<1}function s(e,t,o,i,r,n,s,l){return(r-s)*(t-l)>=(e-s)*(n-l)&&(e-s)*(i-l)>=(o-s)*(t-l)&&(o-s)*(n-l)>=(r-s)*(i-l)}function l(e,t,o){return(t.y-e.y)*(o.x-t.x)-(t.x-e.x)*(o.y-t.y)}function a(e,t){return e.x===t.x&&e.y===t.y}function p(e,t,o,i){var r=u(l(e,t,o)),n=u(l(e,t,i)),s=u(l(o,i,e)),a=u(l(o,i,t));return!!(r!==n&&s!==a||0===r&&c(e,o,t)||0===n&&c(e,i,t)||0===s&&c(o,e,i)||0===a&&c(o,t,i))}function c(e,t,o){return t.x<=Math.max(e.x,o.x)&&t.x>=Math.min(e.x,o.x)&&t.y<=Math.max(e.y,o.y)&&t.y>=Math.min(e.y,o.y)}function u(e){return e>0?1:e<0?-1:0}function f(e,t){return 0>l(e.prev,e,e.next)?l(e,t,e.next)>=0&&l(e,e.prev,t)>=0:0>l(e,t,e.prev)||0>l(e,e.next,t)}function d(e,t){var o=new v(e.i,e.x,e.y),i=new v(t.i,t.x,t.y),r=e.next,n=t.prev;return e.next=t,t.prev=e,o.next=r,r.prev=o,i.next=o,o.prev=i,n.next=i,i.prev=n,i}function g(e,t,o,i){var r=new v(e,t,o);return i?(r.next=i.next,r.prev=i,i.next.prev=r,i.next=r):(r.prev=r,r.next=r),r}function x(e){e.next.prev=e.prev,e.prev.next=e.next,e.prevZ&&(e.prevZ.nextZ=e.nextZ),e.nextZ&&(e.nextZ.prevZ=e.prevZ)}function v(e,t,o){this.i=e,this.x=t,this.y=o,this.prev=null,this.next=null,this.z=0,this.prevZ=null,this.nextZ=null,this.steiner=!1}function h(e,t,o,i){for(var r=0,n=t,s=o-i;n<o;n+=i)r+=(e[s]-e[n])*(e[n+1]+e[s+1]),s=n;return r}e.exports=t,e.exports.default=t,t.deviation=function(e,t,o,i){var r=t&&t.length,n=r?t[0]*o:e.length,s=Math.abs(h(e,0,n,o));if(r)for(var l=0,a=t.length;l<a;l++){var p=t[l]*o,c=l<a-1?t[l+1]*o:e.length;s-=Math.abs(h(e,p,c,o))}var u=0;for(l=0;l<i.length;l+=3){var f=i[l]*o,d=i[l+1]*o,g=i[l+2]*o;u+=Math.abs((e[f]-e[g])*(e[d+1]-e[f+1])-(e[f]-e[d])*(e[g+1]-e[f+1]))}return 0===s&&0===u?0:Math.abs((u-s)/s)},t.flatten=function(e){for(var t=e[0][0].length,o={vertices:[],holes:[],dimensions:t},i=0,r=0;r<e.length;r++){for(var n=0;n<e[r].length;n++)for(var s=0;s<t;s++)o.vertices.push(e[r][n][s]);r>0&&(i+=e[r-1].length,o.holes.push(i))}return o}},41661(e,t,o){o.d(t,{$q:()=>x,A4:()=>p,Dt:()=>a,S8:()=>f});var i=o(55230),r=o(94402);let n="clockwise",s="counter-clockwise",l={isClosed:!0};function a(e){return"positions"in e?e.positions:e}function p(e){return"holeIndices"in e?e.holeIndices:null}function c(e,t,o,i,n){let s,a,p=t,c=o.length;for(let t=0;t<c;t++)for(let r=0;r<i;r++)e[p++]=o[t][r]||0;if(s=o[0],a=o[o.length-1],s[0]!==a[0]||s[1]!==a[1]||s[2]!==a[2])for(let t=0;t<i;t++)e[p++]=o[0][t]||0;return l.start=t,l.end=p,l.size=i,(0,r.UD)(e,n,l),p}function u(e,t,o,i,n=0,s,a){let p=(s=s||o.length)-n;if(p<=0)return t;let c=t;for(let t=0;t<p;t++)e[c++]=o[n+t];if(!function(e,t,o,i){for(let r=0;r<t;r++)if(e[o+r]!==e[i-t+r])return!1;return!0}(o,i,n,s))for(let t=0;t<i;t++)e[c++]=o[n+t];return l.start=t,l.end=c,l.size=i,(0,r.UD)(e,a,l),c}function f(e,t){var o,i=e;if(!Array.isArray(i=i&&i.positions||i)&&!ArrayBuffer.isView(i))throw Error("invalid polygon");let r=[],l=[];if("positions"in e){let{positions:o,holeIndices:i}=e;if(i){let e=0;for(let a=0;a<=i.length;a++)e=u(r,e,o,t,i[a-1],i[a],0===a?n:s),l.push(e);return l.pop(),{positions:r,holeIndices:l}}e=o}if(!Array.isArray(e[0]))return u(r,0,e,t,0,r.length,n),r;if(!((o=e).length>=1&&o[0].length>=2&&Number.isFinite(o[0][0]))){let o=0;for(let[i,a]of e.entries())o=c(r,o,a,t,0===i?n:s),l.push(o);return l.pop(),{positions:r,holeIndices:l}}return c(r,0,e,t,n),r}function d(e,t,o){let i=e.length/3,r=0;for(let n=0;n<i;n++){let s=(n+1)%i;r+=e[3*n+t]*e[3*s+o],r-=e[3*s+t]*e[3*n+o]}return Math.abs(r/2)}function g(e,t,o,i){let r=e.length/3;for(let n=0;n<r;n++){let r=3*n,s=e[r+0],l=e[r+1],a=e[r+2];e[r+t]=s,e[r+o]=l,e[r+i]=a}}function x(e,t,o,r,n){let s=p(e);s&&(s=s.map(e=>e/t));let l=a(e),c=r&&(3===t||n),u=t;if(c&&2===t){let e=[];for(let t=0;t<l.length;t+=2)e.push(l[t],l[t+1],0);l=e,u=3}if(o){let e=l.length;l=l.slice();let t=[];for(let i=0;i<e;i+=u){t[0]=l[i],t[1]=l[i+1],c&&(t[2]=l[i+2]??0);let e=o(t);l[i]=e[0],l[i+1]=e[1],c&&(l[i+2]=e[2])}}let f=n?l.slice():null;if(c){let e=d(l,0,1),t=d(l,0,2),i=d(l,1,2);if(!e&&!t&&!i)return[];e>t&&e>i||(t>i?(o||(l=l.slice()),g(l,0,2,1)):(o||(l=l.slice()),g(l,2,0,1)))}let x=i(l,s,u);if(f)for(let e=0;e<x.length;e+=3){let t=x[e]*u,o=x[e+1]*u,i=x[e+2]*u;f[t]*(f[o+1]*f[i+2]-f[o+2]*f[i+1])+f[t+1]*(f[o+2]*f[i]-f[o]*f[i+2])+f[t+2]*(f[o]*f[i+1]-f[o+1]*f[i])<0&&([x[e+1],x[e+2]]=[x[e+2],x[e+1]])}return x}},24654(e,t,o){o.d(t,{A:()=>k});var i=o(64177),r=o(84175),n=o(46487),s=o(89907),l=o(20723),a=o(63484),p=o(96489);let c={props:{},name:"gouraudMaterial",bindingLayout:[{name:"gouraudMaterial",group:3}],vs:a.l.replace("phongMaterial","gouraudMaterial"),fs:a.X.replace("phongMaterial","gouraudMaterial"),source:p.X.replaceAll("phongMaterial","gouraudMaterial"),defines:{LIGHTING_VERTEX:!0},dependencies:[l.x,s.$n],uniformTypes:{unlit:"i32",ambient:"f32",diffuse:"f32",shininess:"f32",specularColor:"vec3<f32>"},defaultUniforms:{unlit:!1,ambient:.35,diffuse:.6,shininess:32,specularColor:[38.25,38.25,38.25]},getUniforms:e=>({...c.defaultUniforms,...e})};var u=o(19754),f=o(7914),d=o(88599),g=o(25337),x=o(41661),v=o(44941),h=o(94402),y=o(86081),m=o(44168),P=o(22660);class _ extends v.A{constructor(e){let{fp64:t,IndexType:o=Uint32Array}=e;super({...e,attributes:{positions:{size:3,type:t?Float64Array:Float32Array},vertexValid:{type:Uint16Array,size:1},indices:{type:o,size:1}}})}get(e){let{attributes:t}=this;return"indices"===e?t.indices&&t.indices.subarray(0,this.vertexCount):t[e]}updateGeometry(e){super.updateGeometry(e);let t=this.buffers.indices;if(t)this.vertexCount=(t.value||t).length;else if(this.data&&!this.geometryAccessor)throw Error("missing indices buffer")}prepareGeometry(e){return this.preparePolygon(e,this.inputPositionSize)}normalizeGeometry(e){if(!this.opts.transform)return this.preparePolygon(e,this.positionSize);if(!this.normalize)return e;if(C(e)){for(let t of e){let{positions:e,holeIndices:o,edgeTypes:i}=t,r=[...o||[],e.length],n=0;for(let t=0;t<r.length;t++){let o=r[t];if((0,h.UD)(e,0===t?"clockwise":"counter-clockwise",{start:n,end:o,size:this.positionSize,isClosed:!0})&&i){let e=n/this.positionSize,t=o/this.positionSize-1,r=i.slice(e,t).reverse();for(let t=0;t<r.length;t++)i[e+t]=r[t]}n=o}}return e}return x.S8(e,this.positionSize)}preparePolygon(e,t){if(this.normalize){let o=x.S8(e,t);if(this.opts.resolution){let e=(0,y.w)(x.Dt(o),x.A4(o),{size:t,gridResolution:this.opts.resolution,edgeTypes:!0});return this.refinePolygons(e,t)}if(this.opts.wrapLongitude){let e=(0,m.E)(x.Dt(o),x.A4(o),{size:t,maxLatitude:86,edgeTypes:!0});return this.refinePolygons(e,t)}return this.opts.projectionTolerance?this.refinePolygons([o],t):o}return e}refinePolygons(e,t){let{projectionTolerance:o,projectionToleranceScale:i,transform:r}=this.opts;if(!o)return e;if(!r)throw Error("Projection refinement requires preprojected polygons");let n=i||[1,1,1];return e.map(e=>{let i=x.Dt(e),s=x.A4(e),l=e.edgeTypes,a=[],p=[],c=[],u=0;for(let e of[...s||[],i.length]){u&&p.push(a.length);let s=Array.from(i.slice(u,e));s.length&&s.slice(0,t).some((e,o)=>e!==s[s.length-t+o])&&s.push(...s.slice(0,t));let f=(0,P.A)(s,{size:t,targetSize:3,transform:e=>r(Array.from(e)).map((e,t)=>e*n[t]),tolerance:o});for(let e of f.sourcePositions)a.push(e);for(let e=0;e<f.segmentIndices.length;e++){let o=u/t+(f.segmentIndices[e]+ +(1===f.segmentFractions[e]));c.push(l?l[o]:1)}c[c.length-1]=0,u=e}return{positions:a,holeIndices:p,edgeTypes:c}})}getGeometrySize(e){if(C(e)){let t=0;for(let o of e)t+=this.getGeometrySize(o);return t}return x.Dt(e).length/this.positionSize}getGeometryFromBuffer(e){return this.normalize||this.opts.transform||!this.buffers.indices?super.getGeometryFromBuffer(e):null}updateGeometryAttributes(e,t){if(e&&C(e))for(let o of e){let e=this.getGeometrySize(o);t.geometrySize=e,this.updateGeometryAttributes(o,t),t.vertexStart+=e,t.indexStart=this.indexStarts[t.geometryIndex+1]}else this._updateIndices(e,t),this._updatePositions(e,t),this._updateVertexValid(e,t)}_updateIndices(e,{geometryIndex:t,vertexStart:o,indexStart:i}){let{attributes:r,indexStarts:n,typedArrayManager:s}=this,l=r.indices;if(!l||!e)return;let a=i,p=x.$q(e,this.positionSize,this.opts.preproject,this.opts.full3d,this.opts.geocentric);l=s.allocate(l,i+p.length,{copy:!0});for(let e=0;e<p.length;e++)l[a++]=p[e]+o;n[t+1]=i+p.length,r.indices=l}_updatePositions(e,{vertexStart:t,geometrySize:o}){let{attributes:{positions:i},positionSize:r}=this;if(!i||!e)return;let n=x.Dt(e);for(let e=t,s=0;s<o;e++,s++){let t=n[s*r],o=n[s*r+1],l=r>2?n[s*r+2]:0;i[3*e]=t,i[3*e+1]=o,i[3*e+2]=l}}_updateVertexValid(e,{vertexStart:t,geometrySize:o}){let{positionSize:i}=this,r=this.attributes.vertexValid,n=e&&x.A4(e);if(e&&e.edgeTypes?r.set(e.edgeTypes,t):r.fill(1,t,t+o),n)for(let e=0;e<n.length;e++)r[t+n[e]/i-1]=0;r[t+o-1]=0}}function C(e){return Array.isArray(e)&&e.length>0&&!Number.isFinite(e[0])}let b=`\
layout(std140) uniform solidPolygonUniforms {
  bool extruded;
  bool isWireframe;
  float elevationScale;
} solidPolygon;
`,w={name:"solidPolygon",source:`\
struct SolidPolygonUniforms {
  extruded: f32,
  isWireframe: f32,
  elevationScale: f32,
};

@group(0) @binding(auto) var<uniform> solidPolygon: SolidPolygonUniforms;
`,vs:b,fs:b,uniformTypes:{extruded:"f32",isWireframe:"f32",elevationScale:"f32"}},I=`\
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
if (project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC) {
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
${I}
void main(void) {
PolygonProps props;
props.positions = vertexPositions;
props.positions64Low = vertexPositions64Low;
props.elevations = elevations;
props.normal = vec3(0.0, 0.0, 1.0);
calculatePosition(props);
}
`,A=`\
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
${I}
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
`;function j(){return`\
fn project_offset_normal(vector: vec3<f32>) -> vec3<f32> {
  if (project.coordinateFrame == COORDINATE_SYSTEM_GEODETIC) {
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
`}function z(){return`\
@fragment
fn fragmentMain(inp: Varyings) -> @location(0) vec4<f32> {
  geometry.uv = vec2<f32>(0.0, 0.0);
  fragmentGeometry.uv = geometry.uv;


  if (picking.isActive > 0.5) {
    if (!picking_isColorValid(inp.pickingColor)) {
      discard;
    }
    var extensionColor = vec4<f32>(inp.pickingColor, 1.0);
    DECKGL_FILTER_COLOR(&extensionColor, fragmentGeometry);
    // Color filters may discard, but must not alter the picking payload.
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

  DECKGL_FILTER_COLOR(&fragColor, fragmentGeometry);
  return deckgl_premultiplied_alpha(fragColor);
}
`}var V=o(6053);let E=[0,0,0,255],G={enter:(e,t)=>t.length?t.subarray(t.length-e.length):e};class T extends i.A{getShaders(e){var t;let o=this.props._normalize||"CCW"!==this.props._windingOrder?1:0;return super.getShaders({vs:"top"===e?L:A,fs:S,source:(t=!!o,"top"===e?`\
${j()}

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


  DECKGL_FILTER_GL_POSITION(&outp.position, geometry);

  return outp;
}

${z()}
`:`\
const RING_WINDING_ORDER_CW: bool = ${t?"true":"false"};

${j()}

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
};

@vertex
fn vertexMain(attributes: Attributes) -> Varyings {
  var outp: Varyings;
  outp.position = vec4<f32>(0.0);
  outp.vColor = vec4<f32>(0.0);
  outp.pickingColor = picking_getPickingColorFromIndex(attributes.rowIndexes);

  if (attributes.vertexValid < 0.5) {
    DECKGL_FILTER_GL_POSITION(&outp.position, geometry);
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


  DECKGL_FILTER_GL_POSITION(&outp.position, geometry);

  return outp;
}

${z()}
`),defines:{RING_WINDING_ORDER_CW:o},modules:[r.A,n.A,c,u.Ay,w]})}get wrapLongitude(){return!1}getBounds(){return this.getAttributeManager()?.getBounds(["vertexPositions"])}initializeState(){this.setState({numInstances:0,polygonTesselator:new _({fp64:this.use64bitPositions(),IndexType:Uint32Array})});let e=this.getAttributeManager(),t="webgpu"===this.context.device.type;e.add({indices:{size:1,isIndexed:!0,update:this.calculateIndices,noAlloc:!0},vertexPositions:{...this.usePositionTransforms(),size:3,type:"float64",stepMode:"dynamic",fp64:this.use64bitPositions(),transition:G,accessor:"getPolygon",update:this.calculatePositions,noAlloc:!0,shaderAttributes:{nextVertexPositions:{vertexOffset:1}}},[t?"vertexValid":"instanceVertexValid"]:{size:1,type:t?"float32":"uint16",stepMode:"instance",update:this.calculateVertexValid,noAlloc:!0},elevations:{transform:null,size:1,stepMode:"dynamic",transition:G,accessor:"getElevation",bufferGroup:"solid-polygon-instance-data"},fillColors:{transform:null,size:this.props.colorFormat.length,type:"unorm8",stepMode:"dynamic",transition:G,accessor:"getFillColor",defaultValue:E,bufferGroup:"solid-polygon-instance-data"},lineColors:{transform:null,size:this.props.colorFormat.length,type:"unorm8",stepMode:"dynamic",transition:G,accessor:"getLineColor",defaultValue:E,bufferGroup:"solid-polygon-instance-data"},rowIndexes:{size:1,type:"uint32",stepMode:"dynamic",accessor:(e,{index:t})=>e&&e.__source?e.__source.index:t,bufferGroup:"solid-polygon-instance-data"}})}getPickingInfo(e){let t=super.getPickingInfo(e),{index:o}=t,i=this.props.data;return i[0]&&i[0].__source&&(t.object=i.find(e=>e.__source.index===o)),t}disablePickingIndex(e){let t=this.props.data;if(t[0]&&t[0].__source)for(let o=0;o<t.length;o++)t[o].__source.index===e&&this._disablePickingIndex(o);else super.disablePickingIndex(e)}draw({uniforms:e}){let{extruded:t,filled:o,wireframe:i,elevationScale:r}=this.props,{topModel:n,sideModel:s,wireframeModel:l,polygonTesselator:a}=this.state,p={extruded:!!t,elevationScale:r,isWireframe:!1};l&&i&&(l.setInstanceCount(a.instanceCount-1),l.shaderInputs.setProps({solidPolygon:{...p,isWireframe:!0}}),l.draw(this.context.renderPass)),s&&o&&(s.setInstanceCount(a.instanceCount-1),s.shaderInputs.setProps({solidPolygon:p}),s.draw(this.context.renderPass)),n&&o&&(n.setVertexCount(a.vertexCount),n.shaderInputs.setProps({solidPolygon:p}),n.draw(this.context.renderPass))}updateState(e){super.updateState(e),this.updateGeometry(e);let{props:t,oldProps:o,changeFlags:i}=e,r=this.getAttributeManager(),n=r.attributes;n.elevations.settings.transform=t._projectionTolerance?D:null,n.fillColors.settings.transform=t._projectionTolerance?R:null,n.lineColors.settings.transform=t._projectionTolerance?R:null,(i.extensionsChanged||t.filled!==o.filled||t.extruded!==o.extruded)&&(this.state.models?.forEach(e=>e.destroy()),this.setState(this._getModels()),r.invalidateAll())}updateGeometry({props:e,oldProps:t,changeFlags:o}){let{viewport:i}=this.context,r=this.getSubdivisionStep(),n=!!(this.state.packedCrs&&i.crs?.coordinateFrame==="geocentric"),s=o.projectionChanged||this.state.subdivisionStep!==r||i.isGeospatial&&(!(0,f.b)(e.modelMatrix,t.modelMatrix,1)||!(0,f.b)(e.coordinateOrigin,t.coordinateOrigin,1)),l=e._projectionTolerance!==t._projectionTolerance||e._projectionTolerance>0&&e._normalize!==t._normalize;if(l||o.dataChanged||s||o.updateTriggersChanged&&(o.updateTriggersChanged.all||o.updateTriggersChanged.getPolygon)){let{polygonTesselator:t}=this.state,a=e.data.attributes||{},p=(0,V.A)(this.state.packedCrs);if(e._projectionTolerance&&(!p||!this.usePositionTransforms().transform||!e._normalize||a.getPolygon&&!ArrayBuffer.isView(a.getPolygon.value??a.getPolygon)||Object.keys(a).some(e=>"getPolygon"!==e)))throw Error("Projection refinement requires linear target units, normalized polygons and per-object attributes");t.updateGeometry({data:e.data,normalize:e._normalize,geometryBuffer:a.getPolygon,buffers:a,getGeometry:e.getPolygon,transform:this.usePositionTransforms().transform?.bind(this),preproject:this.state.packedCrs?e=>this.state.preproject?i.projectPosition(e,{sourceCrs:this.state.packedCrs}):this.projectPosition(e,{viewport:i,autoOffset:!1}):void 0,positionFormat:e.positionFormat,wrapLongitude:e.wrapLongitude&&!this.state.preproject&&this.state.sourceCrs?.signature==="WGS84",resolution:r,projectionTolerance:e._projectionTolerance,projectionToleranceScale:p??void 0,fp64:this.use64bitPositions(),dataChanged:s||l?void 0:o.dataChanged,full3d:e._full3d||n,geocentric:n}),this.setState({subdivisionStep:r,numInstances:t.instanceCount,startIndices:t.vertexStarts}),(!o.dataChanged||s||l)&&this.getAttributeManager().invalidateAll()}}_getModels(){let e,t,o,{id:i,filled:r,extruded:n}=this.props;if(r){let t=this.getShaders("top");t.defines={...t.defines,NON_INSTANCED_MODEL:1};let o=this.getAttributeManager().getBufferLayouts({isInstanced:!1});"webgpu"===this.context.device.type&&(o=o.filter(e=>"indices"!==e.name&&"vertexValid"!==e.name&&"instanceVertexValid"!==e.name&&"nextVertexPositions"!==e.name)),e=new d.A(this.context.device,{...t,id:`${i}-top`,topology:"triangle-list",bufferLayout:o,isIndexed:!0,isInstanced:!1,userData:{excludeAttributes:{vertexValid:!0,instanceVertexValid:!0,nextVertexPositions:!0}}})}if(n){let e=this.getAttributeManager().getBufferLayouts({isInstanced:!0});"webgpu"===this.context.device.type&&(e=e.filter(e=>"indices"!==e.name)),t=new d.A(this.context.device,{...this.getShaders("side"),id:`${i}-side`,bufferLayout:e,geometry:new g.V2({topology:"triangle-strip",attributes:{positions:{size:2,value:new Float32Array([1,0,0,0,1,1,0,1])}}}),isInstanced:!0,userData:{excludeAttributes:{indices:!0}}}),o=new d.A(this.context.device,{...this.getShaders("side"),id:`${i}-wireframe`,bufferLayout:e,geometry:new g.V2({topology:"line-strip",attributes:{positions:{size:2,value:new Float32Array([1,0,0,0,0,1,1,1])}}}),isInstanced:!0,userData:{excludeAttributes:{indices:!0}}})}return{models:[t,o,e].filter(Boolean),topModel:e,sideModel:t,wireframeModel:o}}calculateIndices(e){let{polygonTesselator:t}=this.state;e.startIndices=t.indexStarts,e.value=t.get("indices")}calculatePositions(e){let{polygonTesselator:t}=this.state;e.startIndices=t.vertexStarts,e.value=t.get("positions")}calculateVertexValid(e){let t=this.props.data.attributes?.instanceVertexValid?.value,o="webgpu"===this.context.device.type&&t?t:this.state.polygonTesselator.get("vertexValid");e.value="webgpu"===this.context.device.type&&o?Float32Array.from(o):o}}T.defaultProps={filled:!0,extruded:!1,wireframe:!1,_normalize:!0,_windingOrder:"CW",_full3d:!1,_projectionTolerance:{type:"number",value:0,min:0},elevationScale:{type:"number",min:0,value:1},getPolygon:{type:"accessor",value:e=>e.polygon},getElevation:{type:"accessor",value:1e3},getFillColor:{type:"accessor",value:E},getLineColor:{type:"accessor",value:E},material:!0},T.layerName="SolidPolygonLayer";let k=T;function D(e){if(this.props._projectionTolerance&&"number"!=typeof e)throw Error("Projection refinement requires per-object elevations");return e}function R(e){if(this.props._projectionTolerance&&("object"==typeof e?.[0]||e?.length>4))throw Error("Projection refinement requires per-object colors");return this.props._projectionTolerance&&"RGB"===this.props.colorFormat&&e?.length===4?e.slice(0,3):e}}}]);