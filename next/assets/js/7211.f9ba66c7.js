"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["7211"],{87720(e,t,i){i.d(t,{A:()=>s});var o=i(28608);function s(){return(0,o.A)().parallels([29.5,45.5]).scale(1070).translate([480,250]).rotate([96,0]).center([-.6,38.7])}},75249(e,t,i){i.d(t,{A:()=>a});var o=i(20512),s=i(87720),r=i(28608),n=i(37728);function a(){var e,t,i,a,l,c,h=(0,s.A)(),u=(0,r.A)().rotate([154,0]).center([-2,58.5]).parallels([55,65]),f=(0,r.A)().rotate([157,0]).center([-3,19.9]).parallels([8,18]),d={point:function(e,t){c=[e,t]}};function p(e){var t=e[0],o=e[1];return c=null,i.point(t,o),c||(a.point(t,o),c)||(l.point(t,o),c)}function g(){return e=t=null,p}return p.invert=function(e){var t=h.scale(),i=h.translate(),o=(e[0]-i[0])/t,s=(e[1]-i[1])/t;return(s>=.12&&s<.234&&o>=-.425&&o<-.214?u:s>=.166&&s<.234&&o>=-.214&&o<-.115?f:h).invert(e)},p.stream=function(i){var o,s;return e&&t===i?e:(s=(o=[h.stream(t=i),u.stream(i),f.stream(i)]).length,e={point:function(e,t){for(var i=-1;++i<s;)o[i].point(e,t)},sphere:function(){for(var e=-1;++e<s;)o[e].sphere()},lineStart:function(){for(var e=-1;++e<s;)o[e].lineStart()},lineEnd:function(){for(var e=-1;++e<s;)o[e].lineEnd()},polygonStart:function(){for(var e=-1;++e<s;)o[e].polygonStart()},polygonEnd:function(){for(var e=-1;++e<s;)o[e].polygonEnd()}})},p.precision=function(e){return arguments.length?(h.precision(e),u.precision(e),f.precision(e),g()):h.precision()},p.scale=function(e){return arguments.length?(h.scale(e),u.scale(.35*e),f.scale(e),p.translate(h.translate())):h.scale()},p.translate=function(e){if(!arguments.length)return h.translate();var t=h.scale(),s=+e[0],r=+e[1];return i=h.translate(e).clipExtent([[s-.455*t,r-.238*t],[s+.455*t,r+.238*t]]).stream(d),a=u.translate([s-.307*t,r+.201*t]).clipExtent([[s-.425*t+o.Ni,r+.12*t+o.Ni],[s-.214*t-o.Ni,r+.234*t-o.Ni]]).stream(d),l=f.translate([s-.205*t,r+.212*t]).clipExtent([[s-.214*t+o.Ni,r+.166*t+o.Ni],[s-.115*t-o.Ni,r+.234*t-o.Ni]]).stream(d),g()},p.fitExtent=function(e,t){return(0,n.sp)(p,e,t)},p.fitSize=function(e,t){return(0,n.Hv)(p,e,t)},p.fitWidth=function(e,t){return(0,n.G0)(p,e,t)},p.fitHeight=function(e,t){return(0,n.FL)(p,e,t)},p.scale(1070)}},28608(e,t,i){i.d(t,{A:()=>n});var o=i(20512),s=i(69108);function r(e,t){var i=(0,o.F8)(e),s=(i+(0,o.F8)(t))/2;if((0,o.tn)(s)<o.Ni){var r=(0,o.gn)(e);function n(e,t){return[e*r,(0,o.F8)(t)/r]}return n.invert=function(e,t){return[e/r,(0,o.qR)(t*r)]},n}var a=1+i*(2*s-i),l=(0,o.RZ)(a)/s;function c(e,t){var i=(0,o.RZ)(a-2*s*(0,o.F8)(t))/s;return[i*(0,o.F8)(e*=s),l-i*(0,o.gn)(e)]}return c.invert=function(e,t){var i=l-t,r=(0,o.FP)(e,(0,o.tn)(i))*(0,o._S)(i);return i*s<0&&(r-=o.pi*(0,o._S)(e)*(0,o._S)(i)),[r/s,(0,o.qR)((a-(e*e+i*i)*s*s)/(2*s))]},c}function n(){var e,t,i,n;return(e=0,t=o.pi/3,(n=(i=(0,s.U)(r))(e,t)).parallels=function(s){return arguments.length?i(e=s[0]*o.F2,t=s[1]*o.F2):[e*o.uj,t*o.uj]},n).scale(155.424).center([0,33.6442])}},85863(e,t,i){let o,s,r,n,a,l,c,h,u;i.d(t,{ws:()=>eW,sG:()=>e$,uY:()=>eG,Ww:()=>eV});var f,d,p=i(28193),g=i(41367);globalThis.mathgl=globalThis.mathgl||{config:{EPSILON:1e-12,debug:!1,precision:4,printTypes:!1,printDegrees:!1,printRowMajor:!0,_cartographicRadians:!1}};let m=globalThis.mathgl.config;function y(e){return Array.isArray(e)||ArrayBuffer.isView(e)&&!(e instanceof DataView)}function v(e,t,i){let o=m.EPSILON;i&&(m.EPSILON=i);try{if(e===t)return!0;if(y(e)&&y(t)){if(e.length!==t.length)return!1;for(let i=0;i<e.length;++i)if(!v(e[i],t[i]))return!1;return!0}if(e&&e.equals)return e.equals(t);if(t&&t.equals)return t.equals(e);if("number"==typeof e&&"number"==typeof t)return Math.abs(e-t)<=m.EPSILON*Math.max(1,Math.abs(e),Math.abs(t));return!1}finally{m.EPSILON=o}}class x extends Array{clone(){return new this.constructor().copy(this)}fromArray(e,t=0){for(let i=0;i<this.ELEMENTS;++i)this[i]=e[i+t];return this.check()}toArray(e=[],t=0){for(let i=0;i<this.ELEMENTS;++i)e[t+i]=this[i];return e}toObject(e){return e}from(e){return Array.isArray(e)?this.copy(e):this.fromObject(e)}to(e){return e===this?this:y(e)?this.toArray(e):this.toObject(e)}toTarget(e){return e?this.to(e):this}toFloat32Array(){return new Float32Array(this)}toString(){return this.formatString(m)}formatString(e){let t="";for(let i=0;i<this.ELEMENTS;++i)t+=(i>0?", ":"")+function(e,{precision:t=m.precision}={}){return e=Math.round(e/m.EPSILON)*m.EPSILON,`${parseFloat(e.toPrecision(t))}`}(this[i],e);return`${e.printTypes?this.constructor.name:""}[${t}]`}equals(e){if(!e||this.length!==e.length)return!1;for(let t=0;t<this.ELEMENTS;++t)if(!v(this[t],e[t]))return!1;return!0}exactEquals(e){if(!e||this.length!==e.length)return!1;for(let t=0;t<this.ELEMENTS;++t)if(this[t]!==e[t])return!1;return!0}negate(){for(let e=0;e<this.ELEMENTS;++e)this[e]=-this[e];return this.check()}lerp(e,t,i){if(void 0===i)return this.lerp(this,e,t);for(let o=0;o<this.ELEMENTS;++o){let s=e[o],r="number"==typeof t?t:t[o];this[o]=s+i*(r-s)}return this.check()}min(e){for(let t=0;t<this.ELEMENTS;++t)this[t]=Math.min(e[t],this[t]);return this.check()}max(e){for(let t=0;t<this.ELEMENTS;++t)this[t]=Math.max(e[t],this[t]);return this.check()}clamp(e,t){for(let i=0;i<this.ELEMENTS;++i)this[i]=Math.min(Math.max(this[i],e[i]),t[i]);return this.check()}add(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]+=t[e];return this.check()}subtract(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]-=t[e];return this.check()}scale(e){if("number"==typeof e)for(let t=0;t<this.ELEMENTS;++t)this[t]*=e;else for(let t=0;t<this.ELEMENTS&&t<e.length;++t)this[t]*=e[t];return this.check()}multiplyByScalar(e){for(let t=0;t<this.ELEMENTS;++t)this[t]*=e;return this.check()}check(){if(m.debug&&!this.validate())throw Error(`math.gl: ${this.constructor.name} some fields set to invalid numbers'`);return this}validate(){let e=this.length===this.ELEMENTS;for(let t=0;t<this.ELEMENTS;++t)e=e&&Number.isFinite(this[t]);return e}sub(e){return this.subtract(e)}setScalar(e){for(let t=0;t<this.ELEMENTS;++t)this[t]=e;return this.check()}addScalar(e){for(let t=0;t<this.ELEMENTS;++t)this[t]+=e;return this.check()}subScalar(e){return this.addScalar(-e)}multiplyScalar(e){for(let t=0;t<this.ELEMENTS;++t)this[t]*=e;return this.check()}divideScalar(e){return this.multiplyByScalar(1/e)}clampScalar(e,t){for(let i=0;i<this.ELEMENTS;++i)this[i]=Math.min(Math.max(this[i],e),t);return this.check()}get elements(){return this}}function _(e){if(!Number.isFinite(e))throw Error(`Invalid number ${JSON.stringify(e)}`);return e}function b(e,t,i=""){if(m.debug&&!function(e,t){if(e.length!==t)return!1;for(let t=0;t<e.length;++t)if(!Number.isFinite(e[t]))return!1;return!0}(e,t))throw Error(`math.gl: ${i} some fields set to invalid numbers'`);return e}function P(e,t){if(!e)throw Error(`math.gl assertion ${t}`)}class C extends x{get x(){return this[0]}set x(e){this[0]=_(e)}get y(){return this[1]}set y(e){this[1]=_(e)}len(){return Math.sqrt(this.lengthSquared())}magnitude(){return this.len()}lengthSquared(){let e=0;for(let t=0;t<this.ELEMENTS;++t)e+=this[t]*this[t];return e}magnitudeSquared(){return this.lengthSquared()}distance(e){return Math.sqrt(this.distanceSquared(e))}distanceSquared(e){let t=0;for(let i=0;i<this.ELEMENTS;++i){let o=this[i]-e[i];t+=o*o}return _(t)}dot(e){let t=0;for(let i=0;i<this.ELEMENTS;++i)t+=this[i]*e[i];return _(t)}normalize(){let e=this.magnitude();if(0!==e)for(let t=0;t<this.ELEMENTS;++t)this[t]/=e;return this.check()}multiply(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]*=t[e];return this.check()}divide(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]/=t[e];return this.check()}lengthSq(){return this.lengthSquared()}distanceTo(e){return this.distance(e)}distanceToSquared(e){return this.distanceSquared(e)}getComponent(e){return P(e>=0&&e<this.ELEMENTS,"index is out of range"),_(this[e])}setComponent(e,t){return P(e>=0&&e<this.ELEMENTS,"index is out of range"),this[e]=t,this.check()}addVectors(e,t){return this.copy(e).add(t)}subVectors(e,t){return this.copy(e).subtract(t)}multiplyVectors(e,t){return this.copy(e).multiply(t)}addScaledVector(e,t){return this.add(new this.constructor(e).multiplyScalar(t))}}let w="u">typeof Float32Array?Float32Array:Array;function S(){let e=new w(3);return w!=Float32Array&&(e[0]=0,e[1]=0,e[2]=0),e}function L(e,t,i){let o=new w(3);return o[0]=e,o[1]=t,o[2]=i,o}function A(e,t){return e[0]*t[0]+e[1]*t[1]+e[2]*t[2]}function E(e,t,i){let o=t[0],s=t[1],r=t[2],n=i[0],a=i[1],l=i[2];return e[0]=s*l-r*a,e[1]=r*n-o*l,e[2]=o*a-s*n,e}function T(e,t,i){let o=t[0],s=t[1],r=t[2],n=i[3]*o+i[7]*s+i[11]*r+i[15];return n=n||1,e[0]=(i[0]*o+i[4]*s+i[8]*r+i[12])/n,e[1]=(i[1]*o+i[5]*s+i[9]*r+i[13])/n,e[2]=(i[2]*o+i[6]*s+i[10]*r+i[14])/n,e}function M(e,t,i){let o=t[0],s=t[1],r=t[2];return e[0]=o*i[0]+s*i[3]+r*i[6],e[1]=o*i[1]+s*i[4]+r*i[7],e[2]=o*i[2]+s*i[5]+r*i[8],e}function O(e,t,i){let o=i[0],s=i[1],r=i[2],n=i[3],a=t[0],l=t[1],c=t[2],h=s*c-r*l,u=r*a-o*c,f=o*l-s*a,d=s*f-r*u,p=r*h-o*f,g=o*u-s*h,m=2*n;return h*=m,u*=m,f*=m,d*=2,p*=2,g*=2,e[0]=a+h+d,e[1]=l+u+p,e[2]=c+f+g,e}let R=function(e){let t=e[0],i=e[1],o=e[2];return Math.sqrt(t*t+i*i+o*o)};function I(e,t,i){let o=t[0],s=t[1],r=t[2];return e[0]=i[0]*o+i[3]*s+i[6]*r,e[1]=i[1]*o+i[4]*s+i[7]*r,e[2]=i[2]*o+i[5]*s+i[8]*r,e[3]=t[3],e}S();let z=[0,0,0];class k extends C{static get ZERO(){return o||Object.freeze(o=new k(0,0,0)),o}constructor(e=0,t=0,i=0){super(-0,-0,-0),1==arguments.length&&y(e)?this.copy(e):(m.debug&&(_(e),_(t),_(i)),this[0]=e,this[1]=t,this[2]=i)}set(e,t,i){return this[0]=e,this[1]=t,this[2]=i,this.check()}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this.check()}fromObject(e){return m.debug&&(_(e.x),_(e.y),_(e.z)),this[0]=e.x,this[1]=e.y,this[2]=e.z,this.check()}toObject(e){return e.x=this[0],e.y=this[1],e.z=this[2],e}get ELEMENTS(){return 3}get z(){return this[2]}set z(e){this[2]=_(e)}angle(e){let t,i,o,s,r,n,a;return t=this[0],i=this[1],o=this[2],s=e[0],r=e[1],Math.acos(Math.min(Math.max((a=Math.sqrt((t*t+i*i+o*o)*(s*s+r*r+(n=e[2])*n)))&&A(this,e)/a,-1),1))}cross(e){return E(this,this,e),this.check()}rotateX({radians:e,origin:t=z}){let i,o;return o=[],(i=[])[0]=this[0]-t[0],i[1]=this[1]-t[1],i[2]=this[2]-t[2],o[0]=i[0],o[1]=i[1]*Math.cos(e)-i[2]*Math.sin(e),o[2]=i[1]*Math.sin(e)+i[2]*Math.cos(e),this[0]=o[0]+t[0],this[1]=o[1]+t[1],this[2]=o[2]+t[2],this.check()}rotateY({radians:e,origin:t=z}){let i,o;return o=[],(i=[])[0]=this[0]-t[0],i[1]=this[1]-t[1],i[2]=this[2]-t[2],o[0]=i[2]*Math.sin(e)+i[0]*Math.cos(e),o[1]=i[1],o[2]=i[2]*Math.cos(e)-i[0]*Math.sin(e),this[0]=o[0]+t[0],this[1]=o[1]+t[1],this[2]=o[2]+t[2],this.check()}rotateZ({radians:e,origin:t=z}){let i,o;return o=[],(i=[])[0]=this[0]-t[0],i[1]=this[1]-t[1],i[2]=this[2]-t[2],o[0]=i[0]*Math.cos(e)-i[1]*Math.sin(e),o[1]=i[0]*Math.sin(e)+i[1]*Math.cos(e),o[2]=i[2],this[0]=o[0]+t[0],this[1]=o[1]+t[1],this[2]=o[2]+t[2],this.check()}transform(e){return this.transformAsPoint(e)}transformAsPoint(e){return T(this,this,e),this.check()}transformAsVector(e){let t,i,o,s;return t=this[0],i=this[1],o=this[2],s=e[3]*t+e[7]*i+e[11]*o||1,this[0]=(e[0]*t+e[4]*i+e[8]*o)/s,this[1]=(e[1]*t+e[5]*i+e[9]*o)/s,this[2]=(e[2]*t+e[6]*i+e[10]*o)/s,this.check()}transformByMatrix3(e){return M(this,this,e),this.check()}transformByMatrix2(e){let t,i;return t=this[0],i=this[1],this[0]=e[0]*t+e[2]*i,this[1]=e[1]*t+e[3]*i,this[2]=this[2],this.check()}transformByQuaternion(e){return O(this,this,e),this.check()}}let N=new k,B=new k;class F{constructor(e=[0,0,0],t=[0,0,0],i){i=i||N.copy(e).add(t).scale(.5),this.center=new k(i),this.halfDiagonal=new k(t).subtract(this.center),this.minimum=new k(e),this.maximum=new k(t)}clone(){return new F(this.minimum,this.maximum,this.center)}equals(e){return this===e||!!e&&this.minimum.equals(e.minimum)&&this.maximum.equals(e.maximum)}transform(e){return this.center.transformAsPoint(e),this.halfDiagonal.transform(e),this.minimum.transform(e),this.maximum.transform(e),this}intersectPlane(e){let{halfDiagonal:t}=this,i=B.from(e.normal),o=t.x*Math.abs(i.x)+t.y*Math.abs(i.y)+t.z*Math.abs(i.z),s=this.center.dot(i)+e.distance;return s-o>0?1:s+o<0?-1:0}distanceTo(e){return Math.sqrt(this.distanceSquaredTo(e))}distanceSquaredTo(e){let t,i=N.from(e).subtract(this.center),{halfDiagonal:o}=this,s=0;return(t=Math.abs(i.x)-o.x)>0&&(s+=t*t),(t=Math.abs(i.y)-o.y)>0&&(s+=t*t),(t=Math.abs(i.z)-o.z)>0&&(s+=t*t),s}}let D=new k,j=new k;class V{constructor(e=[0,0,0],t=0){this.radius=-0,this.center=new k,this.fromCenterRadius(e,t)}fromCenterRadius(e,t){return this.center.from(e),this.radius=t,this}fromCornerPoints(e,t){return t=D.from(t),this.center=new k().from(e).add(t).scale(.5),this.radius=this.center.distance(t),this}equals(e){return this===e||!!e&&this.center.equals(e.center)&&this.radius===e.radius}clone(){return new V(this.center,this.radius)}union(e){let t=this.center,i=this.radius,o=e.center,s=e.radius,r=D.copy(o).subtract(t),n=r.magnitude();if(i>=n+s)return this.clone();if(s>=n+i)return e.clone();let a=(i+n+s)*.5;return j.copy(r).scale((-i+a)/n).add(t),this.center.copy(j),this.radius=a,this}expand(e){let t=D.from(e).subtract(this.center).magnitude();return t>this.radius&&(this.radius=t),this}transform(e){let t,i,o,s,r,n,a,l,c;this.center.transform(e);let h=(t=e[0],i=e[1],o=e[2],s=e[4],r=e[5],n=e[6],a=e[8],l=e[9],c=e[10],D[0]=Math.sqrt(t*t+i*i+o*o),D[1]=Math.sqrt(s*s+r*r+n*n),D[2]=Math.sqrt(a*a+l*l+c*c),D);return this.radius=Math.max(h[0],Math.max(h[1],h[2]))*this.radius,this}distanceSquaredTo(e){let t=this.distanceTo(e);return t*t}distanceTo(e){return Math.max(0,D.from(e).subtract(this.center).len()-this.radius)}intersectPlane(e){let t=this.center,i=this.radius,o=e.normal.dot(t)+e.distance;return o<-i?-1:o<i?0:1}}class W extends x{toString(){let e="[";if(m.printRowMajor){e+="row-major:";for(let t=0;t<this.RANK;++t)for(let i=0;i<this.RANK;++i)e+=` ${this[i*this.RANK+t]}`}else{e+="column-major:";for(let t=0;t<this.ELEMENTS;++t)e+=` ${this[t]}`}return e+"]"}getElementIndex(e,t){return t*this.RANK+e}getElement(e,t){return this[t*this.RANK+e]}setElement(e,t,i){return this[t*this.RANK+e]=_(i),this}getColumn(e,t=Array(this.RANK).fill(-0)){let i=e*this.RANK;for(let e=0;e<this.RANK;++e)t[e]=this[i+e];return t}setColumn(e,t){let i=e*this.RANK;for(let e=0;e<this.RANK;++e)this[i+e]=t[e];return this}}function U(e,t,i){let o=t[0],s=t[1],r=t[2],n=t[3],a=t[4],l=t[5],c=t[6],h=t[7],u=t[8],f=i[0],d=i[1],p=i[2],g=i[3],m=i[4],y=i[5],v=i[6],x=i[7],_=i[8];return e[0]=f*o+d*n+p*c,e[1]=f*s+d*a+p*h,e[2]=f*r+d*l+p*u,e[3]=g*o+m*n+y*c,e[4]=g*s+m*a+y*h,e[5]=g*r+m*l+y*u,e[6]=v*o+x*n+_*c,e[7]=v*s+x*a+_*h,e[8]=v*r+x*l+_*u,e}function G(e,t,i){let o=i[0],s=i[1];return e[0]=o*t[0],e[1]=o*t[1],e[2]=o*t[2],e[3]=s*t[3],e[4]=s*t[4],e[5]=s*t[5],e[6]=t[6],e[7]=t[7],e[8]=t[8],e}n=new w(2),w!=Float32Array&&(n[0]=0,n[1]=0),(f=d||(d={}))[f.COL0ROW0=0]="COL0ROW0",f[f.COL0ROW1=1]="COL0ROW1",f[f.COL0ROW2=2]="COL0ROW2",f[f.COL1ROW0=3]="COL1ROW0",f[f.COL1ROW1=4]="COL1ROW1",f[f.COL1ROW2=5]="COL1ROW2",f[f.COL2ROW0=6]="COL2ROW0",f[f.COL2ROW1=7]="COL2ROW1",f[f.COL2ROW2=8]="COL2ROW2";let q=Object.freeze([1,0,0,0,1,0,0,0,1]);class $ extends W{static get IDENTITY(){return K||Object.freeze(K=new $),K}static get ZERO(){return s||Object.freeze(s=new $([0,0,0,0,0,0,0,0,0])),s}get ELEMENTS(){return 9}get RANK(){return 3}get INDICES(){return d}constructor(e,...t){super(-0,-0,-0,-0,-0,-0,-0,-0,-0),1==arguments.length&&Array.isArray(e)?this.copy(e):t.length>0?this.copy([e,...t]):this.identity()}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this[3]=e[3],this[4]=e[4],this[5]=e[5],this[6]=e[6],this[7]=e[7],this[8]=e[8],this.check()}identity(){return this.copy(q)}fromObject(e){return this.check()}fromQuaternion(e){let t,i,o,s,r,n,a,l,c,h,u,f,d,p,g,m;return t=e[0],i=e[1],o=e[2],s=e[3],r=t+t,n=i+i,a=o+o,l=t*r,c=i*r,h=i*n,u=o*r,f=o*n,d=o*a,p=s*r,g=s*n,m=s*a,this[0]=1-h-d,this[3]=c-m,this[6]=u+g,this[1]=c+m,this[4]=1-l-d,this[7]=f-p,this[2]=u-g,this[5]=f+p,this[8]=1-l-h,this.check()}set(e,t,i,o,s,r,n,a,l){return this[0]=e,this[1]=t,this[2]=i,this[3]=o,this[4]=s,this[5]=r,this[6]=n,this[7]=a,this[8]=l,this.check()}setRowMajor(e,t,i,o,s,r,n,a,l){return this[0]=e,this[1]=o,this[2]=n,this[3]=t,this[4]=s,this[5]=a,this[6]=i,this[7]=r,this[8]=l,this.check()}determinant(){let e,t,i,o,s,r,n,a,l;return e=this[0],t=this[1],i=this[2],o=this[3],s=this[4],r=this[5],n=this[6],a=this[7],e*((l=this[8])*s-r*a)+t*(-l*o+r*n)+i*(a*o-s*n)}transpose(){return!function(e,t){if(e===t){let i=t[1],o=t[2],s=t[5];e[1]=t[3],e[2]=t[6],e[3]=i,e[5]=t[7],e[6]=o,e[7]=s}else e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8]}(this,this),this.check()}invert(){let e,t,i,o,s,r,n,a,l,c,h,u,f;return e=this[0],t=this[1],i=this[2],o=this[3],s=this[4],r=this[5],n=this[6],a=this[7],c=(l=this[8])*s-r*a,(f=e*c+t*(h=-l*o+r*n)+i*(u=a*o-s*n))&&(f=1/f,this[0]=c*f,this[1]=(-l*t+i*a)*f,this[2]=(r*t-i*s)*f,this[3]=h*f,this[4]=(l*e-i*n)*f,this[5]=(-r*e+i*o)*f,this[6]=u*f,this[7]=(-a*e+t*n)*f,this[8]=(s*e-t*o)*f),this.check()}multiplyLeft(e){return U(this,e,this),this.check()}multiplyRight(e){return U(this,this,e),this.check()}rotate(e){let t,i,o,s,r,n,a,l,c,h,u;return t=this[0],i=this[1],o=this[2],s=this[3],r=this[4],n=this[5],a=this[6],l=this[7],c=this[8],h=Math.sin(e),u=Math.cos(e),this[0]=u*t+h*s,this[1]=u*i+h*r,this[2]=u*o+h*n,this[3]=u*s-h*t,this[4]=u*r-h*i,this[5]=u*n-h*o,this[6]=a,this[7]=l,this[8]=c,this.check()}scale(e){return Array.isArray(e)?G(this,this,e):G(this,this,[e,e]),this.check()}translate(e){let t,i,o,s,r,n,a,l,c,h,u;return t=this[0],i=this[1],o=this[2],s=this[3],r=this[4],n=this[5],a=this[6],l=this[7],c=this[8],h=e[0],u=e[1],this[0]=t,this[1]=i,this[2]=o,this[3]=s,this[4]=r,this[5]=n,this[6]=h*t+u*s+a,this[7]=h*i+u*r+l,this[8]=h*o+u*n+c,this.check()}transform(e,t){let i;switch(e.length){case 2:var o;let s,r;o=t||[-0,-0],s=e[0],r=e[1],o[0]=this[0]*s+this[3]*r+this[6],o[1]=this[1]*s+this[4]*r+this[7],i=o;break;case 3:i=M(t||[-0,-0,-0],e,this);break;case 4:i=I(t||[-0,-0,-0,-0],e,this);break;default:throw Error("Illegal vector")}return b(i,e.length),i}transformVector(e,t){return this.transform(e,t)}transformVector2(e,t){return this.transform(e,t)}transformVector3(e,t){return this.transform(e,t)}}let K=null;class H extends C{static get ZERO(){return r||Object.freeze(r=new H(0,0,0,0)),r}constructor(e=0,t=0,i=0,o=0){super(-0,-0,-0,-0),y(e)&&1==arguments.length?this.copy(e):(m.debug&&(_(e),_(t),_(i),_(o)),this[0]=e,this[1]=t,this[2]=i,this[3]=o)}set(e,t,i,o){return this[0]=e,this[1]=t,this[2]=i,this[3]=o,this.check()}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this[3]=e[3],this.check()}fromObject(e){return m.debug&&(_(e.x),_(e.y),_(e.z),_(e.w)),this[0]=e.x,this[1]=e.y,this[2]=e.z,this[3]=e.w,this}toObject(e){return e.x=this[0],e.y=this[1],e.z=this[2],e.w=this[3],e}get ELEMENTS(){return 4}get z(){return this[2]}set z(e){this[2]=_(e)}get w(){return this[3]}set w(e){this[3]=_(e)}transform(e){return T(this,this,e),this.check()}transformByMatrix3(e){return I(this,this,e),this.check()}transformByMatrix2(e){let t,i;return t=this[0],i=this[1],this[0]=e[0]*t+e[2]*i,this[1]=e[1]*t+e[3]*i,this[2]=this[2],this[3]=this[3],this.check()}transformByQuaternion(e){return O(this,this,e),this.check()}applyMatrix4(e){return e.transform(this,this),this}}function Z(){let e=new w(4);return w!=Float32Array&&(e[0]=0,e[1]=0,e[2]=0),e[3]=1,e}function J(e,t,i){let o=Math.sin(i*=.5);return e[0]=o*t[0],e[1]=o*t[1],e[2]=o*t[2],e[3]=Math.cos(i),e}function Y(e,t,i){let o=t[0],s=t[1],r=t[2],n=t[3],a=i[0],l=i[1],c=i[2],h=i[3];return e[0]=o*h+n*a+s*c-r*l,e[1]=s*h+n*l+r*a-o*c,e[2]=r*h+n*c+o*l-s*a,e[3]=n*h-o*a-s*l-r*c,e}a=new w(4),w!=Float32Array&&(a[0]=0,a[1]=0,a[2]=0,a[3]=0);let X=function(e,t,i,o){let s=t[0],r=t[1],n=t[2],a=t[3];return e[0]=s+o*(i[0]-s),e[1]=r+o*(i[1]-r),e[2]=n+o*(i[2]-n),e[3]=a+o*(i[3]-a),e},Q=function(e){let t=e[0],i=e[1],o=e[2],s=e[3];return Math.sqrt(t*t+i*i+o*o+s*s)},ee=function(e){let t=e[0],i=e[1],o=e[2],s=e[3];return t*t+i*i+o*o+s*s},et=function(e,t){let i=t[0],o=t[1],s=t[2],r=t[3],n=i*i+o*o+s*s+r*r;return n>0&&(n=1/Math.sqrt(n)),e[0]=i*n,e[1]=o*n,e[2]=s*n,e[3]=r*n,e},ei=(l=S(),c=L(1,0,0),h=L(0,1,0),function(e,t,i){let o=A(t,i);if(o<-.999999){let i,o,s,r;return E(l,c,t),1e-6>R(l)&&E(l,h,t),i=l[0],o=l[1],(r=i*i+o*o+(s=l[2])*s)>0&&(r=1/Math.sqrt(r)),l[0]=l[0]*r,l[1]=l[1]*r,l[2]=l[2]*r,J(e,l,Math.PI),e}return o>.999999?(e[0]=0,e[1]=0,e[2]=0,e[3]=1,e):(E(l,t,i),e[0]=l[0],e[1]=l[1],e[2]=l[2],e[3]=1+o,et(e,e))});Z(),Z(),u=new w(9),w!=Float32Array&&(u[1]=0,u[2]=0,u[3]=0,u[5]=0,u[6]=0,u[7]=0),u[0]=1,u[4]=1,u[8]=1;let eo=[0,0,0,1];class es extends x{constructor(e=0,t=0,i=0,o=1){super(-0,-0,-0,-0),Array.isArray(e)&&1==arguments.length?this.copy(e):this.set(e,t,i,o)}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this[3]=e[3],this.check()}set(e,t,i,o){return this[0]=e,this[1]=t,this[2]=i,this[3]=o,this.check()}fromObject(e){return this[0]=e.x,this[1]=e.y,this[2]=e.z,this[3]=e.w,this.check()}fromMatrix3(e){return!function(e,t){let i,o=t[0]+t[4]+t[8];if(o>0)i=Math.sqrt(o+1),e[3]=.5*i,i=.5/i,e[0]=(t[5]-t[7])*i,e[1]=(t[6]-t[2])*i,e[2]=(t[1]-t[3])*i;else{let o=0;t[4]>t[0]&&(o=1),t[8]>t[3*o+o]&&(o=2);let s=(o+1)%3,r=(o+2)%3;i=Math.sqrt(t[3*o+o]-t[3*s+s]-t[3*r+r]+1),e[o]=.5*i,i=.5/i,e[3]=(t[3*s+r]-t[3*r+s])*i,e[s]=(t[3*s+o]+t[3*o+s])*i,e[r]=(t[3*r+o]+t[3*o+r])*i}}(this,e),this.check()}fromAxisRotation(e,t){return J(this,e,t),this.check()}identity(){return this[0]=0,this[1]=0,this[2]=0,this[3]=1,this.check()}setAxisAngle(e,t){return this.fromAxisRotation(e,t)}get ELEMENTS(){return 4}get x(){return this[0]}set x(e){this[0]=_(e)}get y(){return this[1]}set y(e){this[1]=_(e)}get z(){return this[2]}set z(e){this[2]=_(e)}get w(){return this[3]}set w(e){this[3]=_(e)}len(){return Q(this)}lengthSquared(){return ee(this)}dot(e){return this[0]*e[0]+this[1]*e[1]+this[2]*e[2]+this[3]*e[3]}rotationTo(e,t){return ei(this,e,t),this.check()}add(e){return this[0]=this[0]+e[0],this[1]=this[1]+e[1],this[2]=this[2]+e[2],this[3]=this[3]+e[3],this.check()}calculateW(){let e,t,i;return e=this[0],t=this[1],i=this[2],this[0]=e,this[1]=t,this[2]=i,this[3]=Math.sqrt(Math.abs(1-e*e-t*t-i*i)),this.check()}conjugate(){return this[0]=-this[0],this[1]=-this[1],this[2]=-this[2],this[3]=this[3],this.check()}invert(){let e,t,i,o,s,r;return e=this[0],t=this[1],i=this[2],r=(s=e*e+t*t+i*i+(o=this[3])*o)?1/s:0,this[0]=-e*r,this[1]=-t*r,this[2]=-i*r,this[3]=o*r,this.check()}lerp(e,t,i){return void 0===i?this.lerp(this,e,t):(X(this,e,t,i),this.check())}multiplyRight(e){return Y(this,this,e),this.check()}multiplyLeft(e){return Y(this,e,this),this.check()}normalize(){let e=this.len(),t=e>0?1/e:0;return this[0]=this[0]*t,this[1]=this[1]*t,this[2]=this[2]*t,this[3]=this[3]*t,0===e&&(this[3]=1),this.check()}rotateX(e){var t;let i,o,s,r,n,a;return t=.5*e,i=this[0],o=this[1],s=this[2],r=this[3],n=Math.sin(t),a=Math.cos(t),this[0]=i*a+r*n,this[1]=o*a+s*n,this[2]=s*a-o*n,this[3]=r*a-i*n,this.check()}rotateY(e){var t;let i,o,s,r,n,a;return t=.5*e,i=this[0],o=this[1],s=this[2],r=this[3],n=Math.sin(t),a=Math.cos(t),this[0]=i*a-s*n,this[1]=o*a+r*n,this[2]=s*a+i*n,this[3]=r*a-o*n,this.check()}rotateZ(e){var t;let i,o,s,r,n,a;return t=.5*e,i=this[0],o=this[1],s=this[2],r=this[3],n=Math.sin(t),a=Math.cos(t),this[0]=i*a+o*n,this[1]=o*a-i*n,this[2]=s*a+r*n,this[3]=r*a-s*n,this.check()}scale(e){return this[0]=this[0]*e,this[1]=this[1]*e,this[2]=this[2]*e,this[3]=this[3]*e,this.check()}slerp(e,t,i){var o,s,r;let n,a,l,c,h,u,f,d,p,g,m,y,v,x,_,b;switch(arguments.length){case 1:({start:n=eo,target:a,ratio:l}=e);break;case 2:n=this,a=e,l=t;break;default:n=e,a=t,l=i}return o=n,s=a,r=l,p=o[0],g=o[1],m=o[2],y=o[3],v=s[0],x=s[1],(c=p*v+g*x+m*(_=s[2])+y*(b=s[3]))<0&&(c=-c,v=-v,x=-x,_=-_,b=-b),1-c>1e-6?(d=Math.sin(h=Math.acos(c)),u=Math.sin((1-r)*h)/d,f=Math.sin(r*h)/d):(u=1-r,f=r),this[0]=u*p+f*v,this[1]=u*g+f*x,this[2]=u*m+f*_,this[3]=u*y+f*b,this.check()}transformVector4(e,t=new H){let i,o,s,r,n,a,l,c,h,u,f;return i=e[0],o=e[1],s=e[2],r=this[0],n=this[1],a=this[2],c=(l=this[3])*i+n*s-a*o,h=l*o+a*i-r*s,u=l*s+r*o-n*i,f=-r*i-n*o-a*s,t[0]=c*l+-(f*r)+-(h*a)- -(u*n),t[1]=h*l+-(f*n)+-(u*r)- -(c*a),t[2]=u*l+-(f*a)+-(c*n)- -(h*r),t[3]=e[3],b(t,4)}lengthSq(){return this.lengthSquared()}setFromAxisAngle(e,t){return this.setAxisAngle(e,t)}premultiply(e){return this.multiplyLeft(e)}multiply(e){return this.multiplyRight(e)}}let er=new k,en=new k,ea=new k,el=new k,ec=new k,eh=new k,eu=new k;class ef{constructor(e=[0,0,0],t=[0,0,0,0,0,0,0,0,0]){this.center=new k().from(e),this.halfAxes=new $(t)}get halfSize(){let e=this.halfAxes.getColumn(0),t=this.halfAxes.getColumn(1),i=this.halfAxes.getColumn(2);return[new k(e).len(),new k(t).len(),new k(i).len()]}get quaternion(){let e=this.halfAxes.getColumn(0),t=this.halfAxes.getColumn(1),i=this.halfAxes.getColumn(2),o=new k(e).normalize(),s=new k(t).normalize(),r=new k(i).normalize();return new es().fromMatrix3(new $([...o,...s,...r]))}fromCenterHalfSizeQuaternion(e,t,i){let o=new es(i),s=new $().fromQuaternion(o);return s[0]=s[0]*t[0],s[1]=s[1]*t[0],s[2]=s[2]*t[0],s[3]=s[3]*t[1],s[4]=s[4]*t[1],s[5]=s[5]*t[1],s[6]=s[6]*t[2],s[7]=s[7]*t[2],s[8]=s[8]*t[2],this.center=new k().from(e),this.halfAxes=s,this}clone(){return new ef(this.center,this.halfAxes)}equals(e){return this===e||!!e&&this.center.equals(e.center)&&this.halfAxes.equals(e.halfAxes)}getBoundingSphere(e=new V){let t=this.halfAxes,i=t.getColumn(0,ea),o=t.getColumn(1,el),s=t.getColumn(2,ec),r=er.copy(i).add(o).add(s);return e.center.copy(this.center),e.radius=r.magnitude(),e}intersectPlane(e){let t=this.center,i=e.normal,o=this.halfAxes,s=i.x,r=i.y,n=i.z,a=Math.abs(s*o[0]+r*o[1]+n*o[2])+Math.abs(s*o[3]+r*o[4]+n*o[5])+Math.abs(s*o[6]+r*o[7]+n*o[8]),l=i.dot(t)+e.distance;return l<=-a?-1:1*!!(l>=a)}distanceTo(e){return Math.sqrt(this.distanceSquaredTo(e))}distanceSquaredTo(e){let t,i=en.from(e).subtract(this.center),o=this.halfAxes,s=o.getColumn(0,ea),r=o.getColumn(1,el),n=o.getColumn(2,ec),a=s.magnitude(),l=r.magnitude(),c=n.magnitude();s.normalize(),r.normalize(),n.normalize();let h=0;return(t=Math.abs(i.dot(s))-a)>0&&(h+=t*t),(t=Math.abs(i.dot(r))-l)>0&&(h+=t*t),(t=Math.abs(i.dot(n))-c)>0&&(h+=t*t),h}computePlaneDistances(e,t,i=[-0,-0]){let o=1/0,s=-1/0,r=this.center,n=this.halfAxes,a=n.getColumn(0,ea),l=n.getColumn(1,el),c=n.getColumn(2,ec),h=eh.copy(a).add(l).add(c).add(r),u=eu.copy(h).subtract(e),f=t.dot(u);return o=Math.min(f,o),s=Math.max(f,s),h.copy(r).add(a).add(l).subtract(c),u.copy(h).subtract(e),o=Math.min(f=t.dot(u),o),s=Math.max(f,s),h.copy(r).add(a).subtract(l).add(c),u.copy(h).subtract(e),o=Math.min(f=t.dot(u),o),s=Math.max(f,s),h.copy(r).add(a).subtract(l).subtract(c),u.copy(h).subtract(e),o=Math.min(f=t.dot(u),o),s=Math.max(f,s),r.copy(h).subtract(a).add(l).add(c),u.copy(h).subtract(e),o=Math.min(f=t.dot(u),o),s=Math.max(f,s),r.copy(h).subtract(a).add(l).subtract(c),u.copy(h).subtract(e),o=Math.min(f=t.dot(u),o),s=Math.max(f,s),r.copy(h).subtract(a).subtract(l).add(c),u.copy(h).subtract(e),o=Math.min(f=t.dot(u),o),s=Math.max(f,s),r.copy(h).subtract(a).subtract(l).subtract(c),u.copy(h).subtract(e),o=Math.min(f=t.dot(u),o),s=Math.max(f,s),i[0]=o,i[1]=s,i}transform(e){this.center.transformAsPoint(e);let t=this.halfAxes.getColumn(0,ea);t.transformAsPoint(e);let i=this.halfAxes.getColumn(1,el);i.transformAsPoint(e);let o=this.halfAxes.getColumn(2,ec);return o.transformAsPoint(e),this.halfAxes=new $([...t,...i,...o]),this}getTransform(){throw Error("not implemented")}}let ed=new k,ep=new k;class eg{constructor(e=[0,0,1],t=0){this.normal=new k,this.distance=-0,this.fromNormalDistance(e,t)}fromNormalDistance(e,t){return P(Number.isFinite(t)),this.normal.from(e).normalize(),this.distance=t,this}fromPointNormal(e,t){e=ed.from(e),this.normal.from(t).normalize();let i=-this.normal.dot(e);return this.distance=i,this}fromCoefficients(e,t,i,o){return this.normal.set(e,t,i),P(v(this.normal.len(),1)),this.distance=o,this}clone(){return new eg(this.normal,this.distance)}equals(e){return v(this.distance,e.distance)&&v(this.normal,e.normal)}getPointDistance(e){return this.normal.dot(e)+this.distance}transform(e){let t=ep.copy(this.normal).transformAsVector(e).normalize(),i=this.normal.scale(-this.distance).transform(e);return this.fromPointNormal(i,t)}projectPointOntoPlane(e,t=[0,0,0]){let i=ed.from(e),o=this.getPointDistance(i),s=ep.copy(this.normal).scale(o);return i.subtract(s).to(t)}}let em=[new k([1,0,0]),new k([0,1,0]),new k([0,0,1])],ey=new k,ev=new k;class ex{constructor(e=[]){this.planes=e}fromBoundingSphere(e){this.planes.length=2*em.length;let t=e.center,i=e.radius,o=0;for(let e of em){let s=this.planes[o],r=this.planes[o+1];s||(s=this.planes[o]=new eg),r||(r=this.planes[o+1]=new eg);let n=ey.copy(e).scale(-i).add(t);s.fromPointNormal(n,e);let a=ey.copy(e).scale(i).add(t),l=ev.copy(e).negate();r.fromPointNormal(a,l),o+=2}return this}computeVisibility(e){let t=1;for(let i of this.planes)switch(e.intersectPlane(i)){case -1:return -1;case 0:t=0}return t}computeVisibilityWithPlaneMask(e,t){if(P(Number.isFinite(t),"parentPlaneMask is required."),t===ex.MASK_OUTSIDE||t===ex.MASK_INSIDE)return t;let i=ex.MASK_INSIDE,o=this.planes;for(let s=0;s<this.planes.length;++s){let r=s<31?1<<s:0;if(s<31&&(t&r)==0)continue;let n=o[s],a=e.intersectPlane(n);if(-1===a)return ex.MASK_OUTSIDE;0===a&&(i|=r)}return i}}ex.MASK_OUTSIDE=0xffffffff,ex.MASK_INSIDE=0,ex.MASK_INDETERMINATE=0x7fffffff,new k,new k,new k,new k,new k,new k,new k,new k,new k,new k,new k,new k,new k,new k,new k,new k,new k;let e_=new $,eb=new $,eP=new $,eC=new $,ew=new $,eS=[1,0,0],eL=[2,2,1],eA=new k,eE=new k,eT=new k,eM=new k,eO=new k,eR=new $,eI={diagonal:new $,unitary:new $};var ez=i(52699);let ek=[[.5,.5],[0,0],[0,1],[1,0],[1,1]],eN=ek.concat([[0,.5],[.5,0],[1,.5],[.5,1]]),eB=eN.concat([[.25,.5],[.75,.5]]);class eF{x;y;z;childVisible;selected;_children;constructor(e,t,i){this.x=e,this.y=t,this.z=i}get children(){if(!this._children){let e=2*this.x,t=2*this.y,i=this.z+1;this._children=[new eF(e,t,i),new eF(e,t+1,i),new eF(e+1,t,i),new eF(e+1,t+1,i)]}return this._children}update(e){var t;let{viewport:i,cullingVolume:o,elevationBounds:s,minZ:r,maxZ:n,bounds:a,offset:l,project:c}=e,h=this.getBoundingVolume(s,l,c);if(a&&!this.insideBounds(a)||"outside"===(t=o.computeVisibility(h))||"number"==typeof t&&t<0||c&&this.beyondHorizon(i.cameraPosition,c,s[1]))return!1;if(!this.childVisible){let{z:e}=this;if(e<n&&e>=r&&(e+=Math.floor(Math.log2(h.distanceTo(i.cameraPosition)*i.scale/i.height))),e>=n)return this.selected=!0,!0}for(let t of(this.selected=!1,this.childVisible=!0,this.children))t.update(e);return!0}getSelected(e=[]){if(this.selected&&e.push(this),this._children)for(let t of this._children)t.getSelected(e);return e}beyondHorizon(e,t,i){let o=e[0],s=e[1],r=e[2],n=Math.sqrt(o*o+s*s+r*r),a=180*Math.atan2(o,-s)/Math.PI,l=180*Math.asin(r/n)/Math.PI,[c,h]=eG(this.x,this.y,this.z),[u,f]=eG(this.x+1,this.y+1,this.z),d=(c+u)/2,p=t([Math.max(c,Math.min(d+((a-d+540)%360-180),u)),Math.max(f,Math.min(l,h)),i]);return p[0]*o+p[1]*s+p[2]*r<=p[0]*p[0]+p[1]*p[1]+p[2]*p[2]}insideBounds([e,t,i,o]){let s=512/Math.pow(2,this.z);return this.x*s<i&&this.y*s<o&&(this.x+1)*s>e&&(this.y+1)*s>t}getBoundingVolume(e,t,i){if(i){let t=this.z<1?eB:this.z<2?eN:ek,o=[];for(let s of t){let t=eG(this.x+s[0],this.y+s[1],this.z);t[2]=e[0],o.push(i(t)),e[0]!==e[1]&&(t[2]=e[1],o.push(i(t)))}return function(e,t=new ef){if(!e||0===e.length)return t.halfAxes=new $([0,0,0,0,0,0,0,0,0]),t.center=new k,t;let i=e.length,o=new k(0,0,0);for(let t of e)o.add(t);let s=1/i;o.multiplyByScalar(s);let r=0,n=0,a=0,l=0,c=0,h=0;for(let t of e){let e=eA.copy(t).subtract(o);r+=e.x*e.x,n+=e.x*e.y,a+=e.x*e.z,l+=e.y*e.y,c+=e.y*e.z,h+=e.z*e.z}r*=s,n*=s,a*=s,l*=s,c*=s,h*=s,eR[0]=r,eR[1]=n,eR[2]=a,eR[3]=n,eR[4]=l,eR[5]=c,eR[6]=a,eR[7]=c,eR[8]=h;let{unitary:u}=function(e,t={}){let i=0,o=0;eb.identity(),eP.copy(e);let s=1e-20*function(e){let t=0;for(let i=0;i<9;++i){let o=e[i];t+=o*o}return Math.sqrt(t)}(eP);for(;o<10&&function(e){let t=0;for(let i=0;i<3;++i){let o=e[e_.getElementIndex(eL[i],eS[i])];t+=2*o*o}return Math.sqrt(t)}(eP)>s;)(function(e,t){let i=0,o=1;for(let t=0;t<3;++t){let s=Math.abs(e[e_.getElementIndex(eL[t],eS[t])]);s>i&&(o=t,i=s)}let s=eS[o],r=eL[o],n=1,a=0;if(Math.abs(e[e_.getElementIndex(r,s)])>1e-15){let t,i=(e[e_.getElementIndex(r,r)]-e[e_.getElementIndex(s,s)])/2/e[e_.getElementIndex(r,s)];n=1/Math.sqrt(1+(t=i<0?-1/(-i+Math.sqrt(1+i*i)):1/(i+Math.sqrt(1+i*i)))*t),a=t*n}$.IDENTITY.to(t),t[e_.getElementIndex(s,s)]=t[e_.getElementIndex(r,r)]=n,t[e_.getElementIndex(r,s)]=a,t[e_.getElementIndex(s,r)]=-a})(eP,eC),ew.copy(eC).transpose(),eP.multiplyRight(eC),eP.multiplyLeft(ew),eb.multiplyRight(eC),++i>2&&(++o,i=0);return t.unitary=eb.toTarget(t.unitary),t.diagonal=eP.toTarget(t.diagonal),t}(eR,eI),f=t.halfAxes.copy(u),d=f.getColumn(0,eT),p=f.getColumn(1,eM),g=f.getColumn(2,eO),m=-Number.MAX_VALUE,y=-Number.MAX_VALUE,v=-Number.MAX_VALUE,x=Number.MAX_VALUE,_=Number.MAX_VALUE,b=Number.MAX_VALUE;for(let t of e)eA.copy(t),m=Math.max(eA.dot(d),m),y=Math.max(eA.dot(p),y),v=Math.max(eA.dot(g),v),x=Math.min(eA.dot(d),x),_=Math.min(eA.dot(p),_),b=Math.min(eA.dot(g),b);d=d.multiplyByScalar(.5*(x+m)),p=p.multiplyByScalar(.5*(_+y)),g=g.multiplyByScalar(.5*(b+v)),t.center.copy(d).add(p).add(g);let P=eE.set(m-x,y-_,v-b).multiplyByScalar(.5),C=new $([P[0],0,0,0,P[1],0,0,0,P[2]]);return t.halfAxes.multiplyRight(C),t}(o)}let o=512/Math.pow(2,this.z),s=this.x*o+512*t,r=512-(this.y+1)*o;return new F([s,r,e[0]],[s+o,r+o,e[1]])}}function eD(e,t,i,o){for(t.offset=i;e.update(t)&&(t.offset+=Math.sign(i),(!(i<0)||!(t.offset<o))&&(!(i>0)||!(t.offset>o))););}let ej=[-1/0,-1/0,1/0,1/0];function eV(e,t){let i=[t.transformAsPoint([e[0],e[1]]),t.transformAsPoint([e[2],e[1]]),t.transformAsPoint([e[0],e[3]]),t.transformAsPoint([e[2],e[3]])];return[Math.min(...i.map(e=>e[0])),Math.min(...i.map(e=>e[1])),Math.max(...i.map(e=>e[0])),Math.max(...i.map(e=>e[1]))]}function eW({viewport:e,z:t,cullRect:i}){return(e.subViewports||[e]).map(e=>(function e(t,i,o){if(!Array.isArray(i)){let e=o.x-t.x,s=o.y-t.y,{width:r,height:n}=o,a={targetZ:i},l=t.unproject([e,s],a),c=t.unproject([e+r,s],a),h=t.unproject([e,s+n],a),u=t.unproject([e+r,s+n],a);return[Math.min(l[0],c[0],h[0],u[0]),Math.min(l[1],c[1],h[1],u[1]),Math.max(l[0],c[0],h[0],u[0]),Math.max(l[1],c[1],h[1],u[1])]}let s=e(t,i[0],o),r=e(t,i[1],o);return[Math.min(s[0],r[0]),Math.min(s[1],r[1]),Math.max(s[2],r[2]),Math.max(s[3],r[3])]})(e,t||0,i))}function eU(e,t){return 512*Math.pow(2,e)/t}function eG(e,t,i){let o=eU(i,512),s=Math.PI-2*Math.PI*t/o;return[e/o*360-180,180/Math.PI*Math.atan(.5*(Math.exp(s)-Math.exp(-s)))]}function eq(e,t,i,o){let s=eU(i,o);return[e/s*512,t/s*512]}let e$={getTileIndices:function(e){let{viewState:t,maxZoom:i,minZoom:o,zRange:s=null,extent:r,tileSize:n=512,modelMatrix:a,modelMatrixInverse:l,zoomOffset:c=0}=e,h=t.isGeospatial?Math.round(t.zoom+Math.log2(512/n)+c):Math.ceil(t.zoom+c);if(null===(h=function(e,t,i,o){if("number"==typeof t&&Number.isFinite(t)&&e<t){if(!o)return null;e=t}return"number"==typeof i&&Number.isFinite(i)&&e>i&&(e=i),e}(h,o,i,r)))return[];let u=r||void 0;return a&&l&&r&&!t.isGeospatial&&(u=eV(r,a)),t.isGeospatial?function(e,t,i,o){var s,r,n;let a=e instanceof p.Ay&&e.resolution?t=>e.projectPosition(t):null,l=new ex(Object.values(e.getFrustumPlanes()).map(({normal:e,distance:t})=>new eg(e.clone().negate(),t))),c=e.distanceScales.unitsPerMeter[2],h=i&&i[0]*c||0,u=i&&i[1]*c||0,f=e instanceof g.A&&e.pitch<=60?t:0;if(o){let[e,t,i,s]=o,r=(0,ez.Gw)([e,s]),n=(0,ez.Gw)([i,t]);o=[r[0],512-r[1],n[0],512-n[1]]}let d=new eF(0,0,0),m={viewport:e,project:a,cullingVolume:l,elevationBounds:[h,u],minZ:f,maxZ:t,bounds:o,offset:0};return d.update(m),s=d,r=m,(n=e)instanceof g.A&&n.subViewports&&!(n.subViewports.length<=1)&&(eD(s,r,-1,-3),eD(s,r,1,3)),d.getSelected()}(t,h,s,r||void 0):function(e,t,i,o,s){var r,n;let a,l=(r=e,n=o,a=r.getBounds(),r.isGeospatial?[Math.max(a[0],n[0]),Math.max(a[1],n[1]),Math.min(a[2],n[2]),Math.min(a[3],n[3])]:[Math.max(Math.min(a[0],n[2]),n[0]),Math.max(Math.min(a[1],n[3]),n[1]),Math.min(Math.max(a[2],n[0]),n[2]),Math.min(Math.max(a[3],n[1]),n[3])]),c=eU(t,i),[h,u,f,d]=s?eV(l,s).map(e=>e*c/512):l.map(e=>e*c/512),p=[];for(let e=Math.floor(h);e<f;e++)for(let i=Math.floor(u);i<d;i++)p.push({x:e,y:i,z:t});return p}(t,h,n,u||ej,l)},getTileBoundingBox:function(e,t){return function(e,t,i,o,s=512){if(e.isGeospatial){let[e,s]=eG(t,i,o),[r,n]=eG(t+1,i+1,o);return{west:e,north:s,east:r,south:n}}let[r,n]=eq(t,i,o,s),[a,l]=eq(t+1,i+1,o,s);return{left:r,top:n,right:a,bottom:l}}(e.viewState,t.x,t.y,t.z,e.tileSize)}}},69415(e,t,i){let o,s,r,n,a,l;i.d(t,{N:()=>iX});var c,h,u=i(59452),f=i(38055),d=i(41881),p=i(84175),g=i(46487),m=i(95335),y=i(9350),v=i(3459),x=i(95263),_=i(25337);let b=`\
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
`,P={name:"icon",vs:b,fs:b,uniformTypes:{sizeScale:"f32",iconsTextureDim:"vec2<f32>",sizeBasis:"f32",sizeMinPixels:"f32",sizeMaxPixels:"f32",billboard:"f32",sizeUnits:"i32",alphaCutoff:"f32"}},C=`\
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
`,w=`\
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
`,S=`\
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
`,L=e=>null!==e&&"object"==typeof e,A=e=>L(e)&&e.constructor===({}).constructor,E=e=>"u">typeof SharedArrayBuffer&&e instanceof SharedArrayBuffer,T=e=>L(e)&&"number"==typeof e.byteLength&&"function"==typeof e.slice,M=e=>"u">typeof Response&&e instanceof Response||L(e)&&"function"==typeof e.arrayBuffer&&"function"==typeof e.text&&"function"==typeof e.json,O=e=>"u">typeof Blob&&e instanceof Blob,R=e=>{let t,i;return t=e,"u">typeof ReadableStream&&t instanceof ReadableStream||L(t)&&"function"==typeof t.tee&&"function"==typeof t.cancel&&"function"==typeof t.getReader||L(i=e)&&"function"==typeof i.read&&"function"==typeof i.pipe&&"boolean"==typeof i.readable};function I(e,t){if(!e)throw Error(t||"loader assertion failed.")}function z(e){return!!e&&(Array.isArray(e)&&(e=e[0]),Array.isArray(e?.extensions))}function k(e){let t;return I(e,"null loader"),I(z(e),"invalid loader"),Array.isArray(e)&&(t=e[1],e={...e=e[0],options:{...e.options,...t}}),(e?.parseTextSync||e?.parseText)&&(e.text=!0),e.text||(e.binary=!0),e}let N={};class B extends Error{constructor(e,t){super(e),this.reason=t.reason,this.url=t.url,this.response=t.response}reason;url;response}let F=/^data:([-\w.]+\/[-\w.+]+)(;|,)/,D=/^([-\w.]+\/[-\w.+]+)/;function j(e,t){return e.toLowerCase()===t.toLowerCase()}function V(e){let t=F.exec(e);return t?t[1]:""}let W=/\?.*/;function U(e){return e.replace(W,"")}function G(e){return M(e)?e.url:O(e)?("name"in e?e.name:"")||"":"string"==typeof e?e:""}function q(e){if(M(e)){let t,i=e.headers.get("content-type")||"",o=U(e.url);return((t=D.exec(i))?t[1]:i)||V(o)}return O(e)?e.type||"":"string"==typeof e?V(e):""}async function $(e){var t;if(M(e))return e;let i={},o=M(t=e)?t.headers["content-length"]||-1:O(t)?t.size:"string"==typeof t?t.length:t instanceof ArrayBuffer||ArrayBuffer.isView(t)?t.byteLength:-1;o>=0&&(i["content-length"]=String(o));let s=G(e),r=q(e);r&&(i["content-type"]=r);let n=await Z(e);n&&(i["x-first-bytes"]=n),"string"==typeof e&&(e=new TextEncoder().encode(e));let a=new Response(e,{headers:i});return Object.defineProperty(a,"url",{value:s}),a}async function K(e){if(!e.ok)throw await H(e)}async function H(e){let t=function(e){if(e.length<50)return e;let t=e.slice(e.length-15),i=e.substr(0,32);return`${i}...${t}`}(e.url),i=`Failed to fetch resource (${e.status}) ${e.statusText}: ${t}`;i=i.length>100?`${i.slice(0,100)}...`:i;let o={reason:e.statusText,url:e.url,response:e};try{let t=e.headers.get("Content-Type");o.reason=!e.bodyUsed&&t?.includes("application/json")?await e.json():await e.text()}catch(e){}return new B(i,o)}async function Z(e){if("string"==typeof e)return`data:,${e.slice(0,5)}`;if(e instanceof Blob){let t=e.slice(0,5);return await new Promise(e=>{let i=new FileReader;i.onload=t=>e(t?.target?.result),i.readAsDataURL(t)})}if(e instanceof ArrayBuffer){let t=function(e){let t="",i=new Uint8Array(e);for(let e=0;e<i.byteLength;e++)t+=String.fromCharCode(i[e]);return btoa(t)}(e.slice(0,5));return`data:base64,${t}`}return null}async function J(e,t){if("string"==typeof e){var i;let o=function(e){for(let t in N)if(e.startsWith(t)){let i=N[t];e=e.replace(t,i)}return e.startsWith("http://")||e.startsWith("https://")||(e=`${e}`),e}(e);return!((i=o).startsWith("http:")||i.startsWith("https:"))&&!o.startsWith("data:")&&globalThis.loaders?.fetchNode?globalThis.loaders?.fetchNode(o,t):await fetch(o,t)}return await $(e)}function Y(e){let t=e?e.lastIndexOf("/"):-1;return t>=0?e.substr(t+1):e}function X(e){let t=e?e.lastIndexOf("/"):-1;return t>=0?e.substr(0,t):""}var Q=i(19727);let ee=new Q.h({id:"loaders.gl"});class et{log(){return()=>{}}info(){return()=>{}}warn(){return()=>{}}error(){return()=>{}}}let ei={self:"u">typeof self&&self,window:"u">typeof window&&window,global:"u">typeof global&&global,document:"u">typeof document&&document};ei.self||ei.window||ei.global,ei.window||ei.self||ei.global,ei.global||ei.self||ei.window,ei.document;let eo=!!("object"!=typeof process||"[object process]"!==String(process)||process.browser),es="u">typeof process&&process.version&&/v([0-9]*)/.exec(process.version);es&&parseFloat(es[1]);let er={core:{baseUrl:void 0,fetch:null,mimeType:void 0,fallbackMimeType:void 0,ignoreRegisteredLoaders:void 0,nothrow:!1,log:new class{console;constructor(){this.console=console}log(...e){return this.console.log.bind(this.console,...e)}info(...e){return this.console.info.bind(this.console,...e)}warn(...e){return this.console.warn.bind(this.console,...e)}error(...e){return this.console.error.bind(this.console,...e)}},useLocalLibraries:!1,CDN:"https://unpkg.com/@loaders.gl",worker:!0,maxConcurrency:3,maxMobileConcurrency:1,reuseWorkers:eo,_nodeWorkers:!1,_workerType:"",limit:0,_limitMB:0,batchSize:"auto",batchDebounceMs:0,metadata:!1,transforms:[]}},en={baseUri:"core.baseUrl",fetch:"core.fetch",mimeType:"core.mimeType",fallbackMimeType:"core.fallbackMimeType",ignoreRegisteredLoaders:"core.ignoreRegisteredLoaders",nothrow:"core.nothrow",log:"core.log",useLocalLibraries:"core.useLocalLibraries",CDN:"core.CDN",worker:"core.worker",maxConcurrency:"core.maxConcurrency",maxMobileConcurrency:"core.maxMobileConcurrency",reuseWorkers:"core.reuseWorkers",_nodeWorkers:"core.nodeWorkers",_workerType:"core._workerType",_worker:"core._workerType",limit:"core.limit",_limitMB:"core._limitMB",batchSize:"core.batchSize",batchDebounceMs:"core.batchDebounceMs",metadata:"core.metadata",transforms:"core.transforms",throws:"nothrow",dataType:"(no longer used)",uri:"core.baseUrl",method:"core.fetch.method",headers:"core.fetch.headers",body:"core.fetch.body",mode:"core.fetch.mode",credentials:"core.fetch.credentials",cache:"core.fetch.cache",redirect:"core.fetch.redirect",referrer:"core.fetch.referrer",referrerPolicy:"core.fetch.referrerPolicy",integrity:"core.fetch.integrity",keepalive:"core.fetch.keepalive",signal:"core.fetch.signal"},ea=["baseUrl","fetch","mimeType","fallbackMimeType","ignoreRegisteredLoaders","nothrow","log","useLocalLibraries","CDN","worker","maxConcurrency","maxMobileConcurrency","reuseWorkers","_nodeWorkers","_workerType","limit","_limitMB","batchSize","batchDebounceMs","metadata","transforms"];function el(){globalThis.loaders=globalThis.loaders||{};let{loaders:e}=globalThis;return e._state||(e._state={}),e._state}function ec(){let e=el();return e.globalOptions=e.globalOptions||{...er,core:{...er.core}},eh(e.globalOptions)}function eh(e){var t;let i,o=(i={...t=e},t.core&&(i.core={...t.core}),i);for(let e of(ed(o),ea))o.core&&void 0!==o.core[e]&&delete o[e];return o.core&&void 0!==o.core._workerType&&delete o._worker,o}function eu(e,t,i,o,s){let r=t||"Top level",n=t?`${t}.`:"";for(let a in e){let l=!t&&L(e[a]),c="baseUri"===a&&!t,h="workerUrl"===a&&t;if(!(a in i)&&!c&&!h){if(a in o)ee.level>0&&ee.warn(`${r} loader option '${n}${a}' no longer supported, use '${o[a]}'`)();else if(!l&&ee.level>0){let e=function(e,t){let i=e.toLowerCase(),o="";for(let s of t)for(let t in s.options){if(e===t)return`Did you mean '${s.id}.${t}'?`;let r=t.toLowerCase();(i.startsWith(r)||r.startsWith(i))&&(o=o||`Did you mean '${s.id}.${t}'?`)}return o}(a,s);ee.warn(`${r} loader option '${n}${a}' not recognized. ${e}`)()}}}}function ef(e,t){for(let i in t)i in t&&(A(t[i])&&A(e[i])?e[i]={...e[i],...t[i]}:e[i]=t[i])}function ed(e){for(let t of(void 0!==e.baseUri&&(e.core||={},void 0===e.core.baseUrl&&(e.core.baseUrl=e.baseUri)),ea))if(void 0!==e[t]){let i=e.core=e.core||{};void 0===i[t]&&(i[t]=e[t])}let t=e._worker;void 0!==t&&(e.core||={},void 0===e.core._workerType&&(e.core._workerType=t))}function ep(e,t){let i=ec(),o=e||i,s=o.fetch??o.core?.fetch;return"function"==typeof s?s:L(s)?e=>J(e,s):t?.fetch?t?.fetch:J}let eg={self:"u">typeof self&&self,window:"u">typeof window&&window,global:"u">typeof global&&global,document:"u">typeof document&&document};eg.self||eg.window||eg.global,eg.window||eg.self||eg.global,eg.global||eg.self||eg.window,eg.document;let em="object"!=typeof process||"[object process]"!==String(process)||process.browser,ey="u">typeof window&&void 0!==window.orientation,ev="u">typeof process&&process.version&&/v([0-9]*)/.exec(process.version);ev&&parseFloat(ev[1]);class ex{terminate(){}}function e_(e,t){if(!e)throw Error(t||"loaders.gl assertion failed.")}let eb=new Map;function eP(e){let t=new Blob([e],{type:"application/javascript"});return URL.createObjectURL(t)}function eC(e){return!!e&&!!(e instanceof ArrayBuffer||"u">typeof MessagePort&&e instanceof MessagePort||"u">typeof ImageBitmap&&e instanceof ImageBitmap||"u">typeof OffscreenCanvas&&e instanceof OffscreenCanvas)}let ew=()=>{};class eS{name;source;url;terminated=!1;worker;onMessage;onError;_loadableURL="";static isSupported(){return"u">typeof Worker&&em||!em}constructor(e){let{name:t,source:i,url:o}=e;e_(i||o),this.name=t,this.source=i,this.url=o,this.onMessage=ew,this.onError=e=>console.log(e),this.worker=em?this._createBrowserWorker():this._createNodeWorker()}destroy(){this.onMessage=ew,this.onError=ew,this.worker.terminate(),this.terminated=!0}get isRunning(){return!!this.onMessage}postMessage(e,t){t=t||function e(t,i=!0,o){let s=o||new Set;if(t){if(eC(t))s.add(t);else if(eC(t.buffer))s.add(t.buffer);else if(ArrayBuffer.isView(t));else if(i&&"object"==typeof t)for(let o in t)e(t[o],i,s)}return void 0===o?Array.from(s):[]}(e),this.worker.postMessage(e,t)}_getErrorFromErrorEvent(e){let t="Failed to load ";return t+=`worker ${this.name} from ${this.url}. `,e.message&&(t+=`${e.message} in `),e.lineno&&(t+=`:${e.lineno}:${e.colno}`),Error(t)}_createBrowserWorker(){var e,t,i;let o;this._loadableURL=(e_((e={source:this.source,url:this.url}).source&&!e.url||!e.source&&e.url),(o=eb.get(e.source||e.url))||(e.url&&(o=(t=e.url).startsWith("http")?eP((i=t,`\
try {
  importScripts('${i}');
} catch (error) {
  console.error(error);
  throw error;
}`)):t,eb.set(e.url,o)),e.source&&(o=eP(e.source),eb.set(e.source,o))),e_(o),o);let s=new Worker(this._loadableURL,{name:this.name});return s.onmessage=e=>{e.data?this.onMessage(e.data):this.onError(Error("No data received"))},s.onerror=e=>{this.onError(this._getErrorFromErrorEvent(e)),this.terminated=!0},s.onmessageerror=e=>console.error(e),s}_createNodeWorker(){let e;if(this.url)e=new ex(this.url.includes(":/")||this.url.startsWith("/")?this.url:`./${this.url}`,{eval:!1,type:this.url.endsWith(".ts")||this.url.endsWith(".mjs")?"module":"commonjs"});else if(this.source)e=new ex(this.source,{eval:!0});else throw Error("no worker");return e.on("message",e=>{this.onMessage(e)}),e.on("error",e=>{this.onError(e)}),e.on("exit",e=>{}),e}}class eL{name;workerThread;isRunning=!0;result;_resolve=()=>{};_reject=()=>{};constructor(e,t){this.name=e,this.workerThread=t,this.result=new Promise((e,t)=>{this._resolve=e,this._reject=t})}postMessage(e,t){this.workerThread.postMessage({source:"loaders.gl",type:e,payload:t})}done(e){e_(this.isRunning),this.isRunning=!1,this._resolve(e)}error(e){e_(this.isRunning),this.isRunning=!1,this._reject(e)}}class eA{name="unnamed";source;url;maxConcurrency=1;maxMobileConcurrency=1;onDebug=()=>{};reuseWorkers=!0;props={};jobQueue=[];idleQueue=[];count=0;isDestroyed=!1;static isSupported(){return eS.isSupported()}constructor(e){this.source=e.source,this.url=e.url,this.setProps(e)}destroy(){this.idleQueue.forEach(e=>e.destroy()),this.isDestroyed=!0}setProps(e){this.props={...this.props,...e},void 0!==e.name&&(this.name=e.name),void 0!==e.maxConcurrency&&(this.maxConcurrency=e.maxConcurrency),void 0!==e.maxMobileConcurrency&&(this.maxMobileConcurrency=e.maxMobileConcurrency),void 0!==e.reuseWorkers&&(this.reuseWorkers=e.reuseWorkers),void 0!==e.onDebug&&(this.onDebug=e.onDebug)}async startJob(e,t=(e,t,i)=>e.done(i),i=(e,t)=>e.error(t)){let o=new Promise(o=>(this.jobQueue.push({name:e,onMessage:t,onError:i,onStart:o}),this));return this._startQueuedJob(),await o}async _startQueuedJob(){if(!this.jobQueue.length)return;let e=this._getAvailableWorker();if(!e)return;let t=this.jobQueue.shift();if(t){this.onDebug({message:"Starting job",name:t.name,workerThread:e,backlog:this.jobQueue.length});let i=new eL(t.name,e);e.onMessage=e=>t.onMessage(i,e.type,e.payload),e.onError=e=>t.onError(i,e),t.onStart(i);try{await i.result}catch(e){console.error(`Worker exception: ${e}`)}finally{this.returnWorkerToQueue(e)}}}returnWorkerToQueue(e){!em||this.isDestroyed||!this.reuseWorkers||this.count>this._getMaxConcurrency()?(e.destroy(),this.count--):this.idleQueue.push(e),this.isDestroyed||this._startQueuedJob()}_getAvailableWorker(){return this.idleQueue.length>0?this.idleQueue.shift()||null:this.count<this._getMaxConcurrency()?(this.count++,new eS({name:`${this.name.toLowerCase()} (#${this.count} of ${this.maxConcurrency})`,source:this.source,url:this.url})):null}_getMaxConcurrency(){return ey?this.maxMobileConcurrency:this.maxConcurrency}}let eE={maxConcurrency:3,maxMobileConcurrency:1,reuseWorkers:!0,onDebug:()=>{}};class eT{props;workerPools=new Map;static _workerFarm;static isSupported(){return eS.isSupported()}static getWorkerFarm(e={}){return eT._workerFarm=eT._workerFarm||new eT({}),eT._workerFarm.setProps(e),eT._workerFarm}constructor(e){this.props={...eE},this.setProps(e),this.workerPools=new Map}destroy(){for(let e of this.workerPools.values())e.destroy();this.workerPools=new Map}setProps(e){for(let t of(this.props={...this.props,...e},this.workerPools.values()))t.setProps(this._getWorkerPoolProps())}getWorkerPool(e){let{name:t,source:i,url:o}=e,s=this.workerPools.get(t);return s||((s=new eA({name:t,source:i,url:o})).setProps(this._getWorkerPoolProps()),this.workerPools.set(t,s)),s}_getWorkerPoolProps(){return{maxConcurrency:this.props.maxConcurrency,maxMobileConcurrency:this.props.maxMobileConcurrency,reuseWorkers:this.props.reuseWorkers,onDebug:this.props.onDebug}}}async function eM(e,t,i,o,s){let r=e.id,n=function(e,t={}){let i=t[e.id]||{},o=em?e.workerFile||`${e.id}-worker.js`:`${e.id}-worker-node.js`,s=i.workerUrl;if(s||"compression"!==e.id||(s=t.workerUrl),"test"===(t._workerType||t?.core?._workerType)&&(s=em?`modules/${e.module}/dist/${o}`:`modules/${e.module}/src/workers/${e.id}-worker-node.ts`),!s){let t=e.version;"latest"===t&&(t="latest");let i=t?`@${t}`:"";s=`https://unpkg.com/@loaders.gl/${e.module}${i}/dist/${o}`}return e_(s),s}(e,i),a=eT.getWorkerFarm(i?.core).getWorkerPool({name:r,url:n});(i=JSON.parse(JSON.stringify(i||{})))._workerLoaderId=e.id,o=JSON.parse(JSON.stringify(o||{}));let l=await a.startJob("process-on-worker",eO.bind(null,s));l.postMessage("process",{input:t,options:i,context:o});let c=await l.result;return await c.result}async function eO(e,t,i,o){switch(i){case"done":t.done(o);break;case"error":t.error(Error(o.error));break;case"process":let{id:s,input:r,options:n}=o;try{let i=await e(r,n);t.postMessage("done",{id:s,result:i})}catch(i){let e=i instanceof Error?i.message:"unknown error";t.postMessage("error",{id:s,error:e})}break;default:console.warn(`parse-with-worker unknown message ${i}`)}}let eR=(globalThis._loadersgl_?.version||(globalThis._loadersgl_=globalThis._loadersgl_||{},globalThis._loadersgl_.version="4.5.4"),globalThis._loadersgl_.version);function eI(e){return e&&"object"==typeof e&&e.isBuffer}function ez(e){if(eI(e)||e instanceof ArrayBuffer)return e;if(E(e))return eN(e);if(ArrayBuffer.isView(e)){let t=e.buffer;return 0===e.byteOffset&&e.byteLength===e.buffer.byteLength?t:t.slice(e.byteOffset,e.byteOffset+e.byteLength)}if("string"==typeof e)return new TextEncoder().encode(e).buffer;if(e&&"object"==typeof e&&e._toArrayBuffer)return e._toArrayBuffer();throw Error("toArrayBuffer")}function ek(e){if(e instanceof ArrayBuffer)return e;if(E(e))return eN(e);let{buffer:t,byteOffset:i,byteLength:o}=e;return t instanceof ArrayBuffer&&0===i&&o===t.byteLength?t:eN(t,i,o)}function eN(e,t=0,i=e.byteLength-t){let o=new Uint8Array(e,t,i),s=new Uint8Array(o.length);return s.set(o),s.buffer}async function eB(e){let t=[];for await(let i of e)t.push(function(e){if(e instanceof ArrayBuffer)return e;if(ArrayBuffer.isView(e)){let{buffer:t,byteOffset:i,byteLength:o}=e;return eF(t,i,o)}return eF(e)}(i));return function(...e){var t=e;let i=t.map(e=>e instanceof ArrayBuffer?new Uint8Array(e):e),o=new Uint8Array(i.reduce((e,t)=>e+t.byteLength,0)),s=0;for(let e of i)o.set(e,s),s+=e.byteLength;return o.buffer}(...t)}function eF(e,t=0,i=e.byteLength-t){let o=new Uint8Array(e,t,i),s=new Uint8Array(o.length);return s.set(o),s.buffer}async function*eD(e,t){let i=t?.chunkSize||1048576,o=0;for(;o<e.size;){let t=o+i,s=await e.slice(o,t).arrayBuffer();o=t,yield s}}function ej(e,t){return eo?eV(e,t):eW(e,t)}async function*eV(e,t){let i,o=e.getReader();try{for(;;){let e=i||o.read();t?._streamReadAhead&&(i=o.read());let{done:s,value:r}=await e;if(s)return;yield ez(r)}}catch(e){o.releaseLock()}}async function*eW(e,t){for await(let t of e)yield ez(t)}let eU="Cannot convert supplied data type";async function eG(e,t,i){let o,s;if("string"==typeof e||T(e)){var r,n=e;if(t.text&&"string"==typeof n)return n;if(eI(n)&&(n=n.buffer),T(n)){let e=ArrayBuffer.isView(r=n)?r:new Uint8Array(r);return t.text&&!t.binary?new TextDecoder("utf8").decode(e):ez(e)}throw Error(eU)}if(O(e)&&(e=await $(e)),M(e))return await K(e),t.binary?await e.arrayBuffer():await e.text();if(R(e)&&(e=function(e,t){if("string"==typeof e)return function*(e,t){let i=t?.chunkSize||262144,o=0,s=new TextEncoder;for(;o<e.length;){let t=Math.min(e.length-o,i),r=e.slice(o,o+t);o+=t,yield ek(s.encode(r))}}(e,t);if(e instanceof ArrayBuffer)return function*(e,t={}){let{chunkSize:i=262144}=t,o=0;for(;o<e.byteLength;){let t=Math.min(e.byteLength-o,i),s=new ArrayBuffer(t),r=new Uint8Array(e,o,t);new Uint8Array(s).set(r),o+=t,yield s}}(e,t);if(O(e))return eD(e,t);if(R(e))return ej(e,t);if(M(e)){let i=e.body;if(!i)throw Error("Readable stream not available on Response");return ej(i,t)}throw Error("makeIterator")}(e,i)),(o=e)&&"function"==typeof o[Symbol.iterator]||(s=e)&&"function"==typeof s[Symbol.asyncIterator])return eB(e);throw Error(eU)}let eq="4.5.4",e$=eq[0]>="0"&&eq[0]<="9"?`v${eq}`:"",eK=(r=new Q.h({id:"loaders.gl"}),globalThis.loaders||={},globalThis.loaders.log=r,globalThis.loaders.version=e$,globalThis.probe||={},globalThis.probe.loaders=r,r),eH=/\.([^.]+)$/;async function eZ(e,t=[],i,o){if(!eX(e))return null;let s=eh(i||{});if(s.core||={},e instanceof Response&&eJ(e)){let i=eY(await e.clone().text(),t,{...s,core:{...s.core,nothrow:!0}},o);if(i)return i}let r=eY(e,t,{...s,core:{...s.core,nothrow:!0}},o);if(r)return r;if(O(e)&&(r=eY(e=await e.slice(0,10).arrayBuffer(),t,s,o)),!r&&e instanceof Response&&eJ(e)&&(r=eY(await e.clone().text(),t,s,o)),!r&&!s.core.nothrow)throw Error(eQ(e));return r}function eJ(e){let t=q(e);return!!(t&&(t.startsWith("text/")||"application/json"===t||t.endsWith("+json")))}function eY(e,t=[],i,o){var s,r,n,a,l,c;let h,u,f,d,p,g,m,y;if(!eX(e))return null;let v=eh(i||{});if(v.core||={},t&&!Array.isArray(t))return k(t);let x=[];t&&(x=x.concat(t)),v.core.ignoreRegisteredLoaders||x.push(...((h=el()).loaderRegistry=h.loaderRegistry||[],h.loaderRegistry)),function(e){for(let t of e)k(t)}(x);let _=(s=e,r=x,n=v,a=o,u=G(s),f=q(s),d=U(u)||a?.url,p=null,g="",n?.core?.mimeType&&(p=e0(r,n?.core?.mimeType),g=`match forced by supplied MIME type ${n?.core?.mimeType}`),p=p||(l=r,(y=(m=(c=d)&&eH.exec(c))&&m[1])?function(e,t){for(let i of(t=t.toLowerCase(),e))for(let e of i.extensions)if(e.toLowerCase()===t)return i;return null}(l,y):null),g=g||(p?`matched url ${d}`:""),p=p||e0(r,f),g=g||(p?`matched MIME type ${f}`:""),p=p||function(e,t){if(!t)return null;for(let i of e)if("string"==typeof t){if(function(e,t){return t.testText?t.testText(e):(Array.isArray(t.tests)?t.tests:[t.tests]).some(t=>e.startsWith(t))}(t,i))return i}else if(ArrayBuffer.isView(t)){if(e2(t.buffer,t.byteOffset,i))return i}else if(t instanceof ArrayBuffer&&e2(t,0,i))return i;return null}(r,s),g=g||(p?`matched initial data ${e1(s)}`:""),n?.core?.fallbackMimeType&&(p=p||e0(r,n?.core?.fallbackMimeType),g=g||(p?`matched fallback MIME type ${f}`:"")),g&&eK.log(1,`selectLoader selected ${p?.name}: ${g}.`),p);if(!_&&!v.core.nothrow)throw Error(eQ(e));return _}function eX(e){return!(e instanceof Response)||204!==e.status}function eQ(e){let t=G(e),i=q(e),o="No valid loader found (";o+=(t?`${Y(t)}, `:"no url provided, ")+`MIME type: ${i?`"${i}"`:"not provided"}, `;let s=e?e1(e):"";return o+((s?` first bytes: "${s}"`:"first bytes: not available")+")")}function e0(e,t){for(let i of e)if(i.mimeTypes?.some(e=>j(t,e))||j(t,`application/x.${i.id}`))return i;return null}function e2(e,t,i){return(Array.isArray(i.tests)?i.tests:[i.tests]).some(i=>(function(e,t,i){if(T(i))return function(e,t,i){if(i=i||e.byteLength,e.byteLength<i||t.byteLength<i)return!1;let o=new Uint8Array(e),s=new Uint8Array(t);for(let e=0;e<o.length;++e)if(o[e]!==s[e])return!1;return!0}(i,e,i.byteLength);switch(typeof i){case"function":return i(ek(e));case"string":let o=e3(e,t,i.length);return i===o;default:return!1}})(e,t,i))}function e1(e,t=5){return"string"==typeof e?e.slice(0,t):ArrayBuffer.isView(e)?e3(e.buffer,e.byteOffset,t):e instanceof ArrayBuffer?e3(e,0,t):""}function e3(e,t,i){if(e.byteLength<t+i)return"";let o=new DataView(e),s="";for(let e=0;e<i;e++)s+=String.fromCharCode(o.getUint8(t+e));return s}async function e4(e,t,i,o){var s,r,n,a,l,c,h;let u,f;!t||Array.isArray(t)||z(t)||(o=void 0,i=t,t=void 0),e=await e,i=i||{};let d=G(e),p=function(e,t){let i;if(e&&!Array.isArray(e))return e;if(e&&(i=Array.isArray(e)?e:[e]),t&&t.loaders){let e=Array.isArray(t.loaders)?t.loaders:[t.loaders];i=i?[...i,...e]:e}return i&&i.length?i:void 0}(t,o),g=await eZ(e,p,i);if(!g)return null;let m=(function(e,t){for(let i of(eu(e,null,er,en,t),t)){let o=e&&e[i.id]||{},s=i.options&&i.options[i.id]||{},r=i.deprecatedOptions&&i.deprecatedOptions[i.id]||{};eu(o,i.id,s,r,t)}}(s=i,r=Array.isArray(r=(r=p)||[])?r:[r]),eh((n=g,a=s,l=d,f={...u=n.options||{}},u.core&&(f.core={...u.core}),ed(f),f.core?.log===null&&(f.core={...f.core,log:new et}),ef(f,eh(ec())),ef(f,eh(a)),c=f,(h=l)&&c.core?.baseUrl===void 0&&(c.core||={},c.core.baseUrl=X(U(h))),function(e){let t=e.core;if(t)for(let i of ea)void 0!==t[i]&&(e[i]=t[i])}(f),f)));return o=function(e,t,i){if(i)return i;let o={fetch:ep(t,e),...e};if(o.url){let e,t=U(o.url);o.baseUrl=t,e=o.url.match(W),o.queryString=e&&e[0],o.filename=Y(t),o.baseUrl=X(t)}return Array.isArray(o.loaders)||(o.loaders=null),o}({url:d,_parse:e4,loaders:p},m,o||null),await e5(g,e,m,o)}async function e5(e,t,i,o){if(!function(e,t=eR){e_(e,"no worker provided");e.version}(e),i=function e(t,i,o=0){if(o>3)return i;let s={...t};for(let[t,r]of Object.entries(i))r&&"object"==typeof r&&!Array.isArray(r)?s[t]=e(s[t]||{},i[t],o+1):s[t]=i[t];return s}(e.options||{},i),M(t)){let{ok:e,redirected:i,status:s,statusText:r,type:n,url:a}=t;o.response={headers:Object.fromEntries(t.headers.entries()),ok:e,redirected:i,status:s,statusText:r,type:n,url:a}}if(t=await eG(t,e,i),e.parseTextSync&&"string"==typeof t)return e.parseTextSync(t,i,o);if(function(e,t){if(!eT.isSupported())return!1;let i=t?._nodeWorkers??t?.core?._nodeWorkers;if(!em&&!i)return!1;let o=t?.worker??t?.core?.worker;return!!(e.worker&&o)}(e,i))return await eM(e,t,i,o,e4);if(e.parseText&&"string"==typeof t)return await e.parseText(t,i,o);if(e.parse)return await e.parse(t,i,o);throw e_(!e.parseSync),Error(`${e.id} loader - no parser found and worker is disabled`)}async function e6(e,t,i,o){let s,r;Array.isArray(t)||z(t)?(s=t,r=i):(s=[],r=t);let n=ep(r),a=e;if("string"==typeof e&&(a=await n(e)),O(e)&&(a=await n(e)),"string"==typeof e){let t=eh(r||{});t.core?.baseUrl||(r={...r,core:{...r?.core,baseUrl:e}})}return Array.isArray(s),await e4(a,s,r)}var e8=i(53439);let e9=()=>{},e7={minFilter:"linear",mipmapFilter:"linear",magFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"},te={x:0,y:0,width:0,height:0};function tt(e){return e&&(e.id||e.url)}function ti(e){let{device:t}=e;"webgl"===t.type?e.generateMipmapsWebGL():"webgpu"===t.type&&t.generateMipmapsWebGPU(e)}function to(e,t,i){for(let o=0;o<t.length;o++){let{icon:s,xOffset:r}=t[o];e[tt(s)]={...s,x:r,y:i}}}class ts{constructor(e,{onUpdate:t=e9,onError:i=e9}){this._loadOptions=null,this._texture=null,this._externalTexture=null,this._mapping={},this._samplerParameters=null,this._pendingCount=0,this._autoPacking=!1,this._xOffset=0,this._yOffset=0,this._rowHeight=0,this._buffer=4,this._canvasWidth=1024,this._canvasHeight=0,this._canvas=null,this.device=e,this.onUpdate=t,this.onError=i}finalize(){this._texture?.delete()}getTexture(){return this._texture||this._externalTexture}getIconMapping(e){let t=this._autoPacking?tt(e):e;return this._mapping[t]||te}setProps({loadOptions:e,autoPacking:t,iconAtlas:i,iconMapping:o,textureParameters:s}){e&&(this._loadOptions=e),void 0!==t&&(this._autoPacking=t),o&&(this._mapping=o),i&&(this._texture?.delete(),this._texture=null,this._externalTexture=i),s&&(this._samplerParameters=s)}get isLoaded(){return 0===this._pendingCount}packIcons(e,t){if(!this._autoPacking||"u"<typeof document)return;let i=Object.values(function(e,t,i){if(!e||!t)return null;i=i||{};let o={},{iterable:s,objectInfo:r}=(0,e8.X)(e);for(let e of s){r.index++;let s=t(e,r),n=tt(s);if(!s)throw Error("Icon is missing.");if(!s.url)throw Error("Icon url is missing.");o[n]||i[n]&&s.url===i[n].url||(o[n]={...s,source:e,sourceIndex:r.index})}return o}(e,t,this._mapping)||{});if(i.length>0){let{mapping:e,xOffset:t,yOffset:o,rowHeight:s,canvasHeight:r}=function({icons:e,buffer:t,mapping:i={},xOffset:o=0,yOffset:s=0,rowHeight:r=0,canvasWidth:n}){let a=[];for(let l=0;l<e.length;l++){let c=e[l];if(!i[tt(c)]){let{height:e,width:l}=c;o+l+t>n&&(to(i,a,s),o=0,s=r+s+t,r=0,a=[]),a.push({icon:c,xOffset:o}),o=o+l+t,r=Math.max(r,e)}}return a.length>0&&to(i,a,s),{mapping:i,rowHeight:r,xOffset:o,yOffset:s,canvasWidth:n,canvasHeight:Math.pow(2,Math.ceil(Math.log2(r+s+t)))}}({icons:i,buffer:this._buffer,canvasWidth:this._canvasWidth,mapping:this._mapping,rowHeight:this._rowHeight,xOffset:this._xOffset,yOffset:this._yOffset});this._rowHeight=s,this._mapping=e,this._xOffset=t,this._yOffset=o,this._canvasHeight=r,this._texture||(this._texture=this.device.createTexture({format:"rgba8unorm",data:null,width:this._canvasWidth,height:this._canvasHeight,sampler:this._samplerParameters||e7,mipLevels:this.device.getMipLevelCount(this._canvasWidth,this._canvasHeight)})),this._texture.height!==this._canvasHeight&&(this._texture=function(e,t,i,o){let{width:s,height:r,device:n}=e,a=n.createTexture({format:"rgba8unorm",width:t,height:i,sampler:o,mipLevels:n.getMipLevelCount(t,i)}),l=n.createCommandEncoder();l.copyTextureToTexture({sourceTexture:e,destinationTexture:a,width:s,height:r});let c=l.finish();return n.submit(c),ti(a),e.destroy(),a}(this._texture,this._canvasWidth,this._canvasHeight,this._samplerParameters||e7)),this.onUpdate(!0),this._canvas=this._canvas||document.createElement("canvas"),this._loadIcons(i)}}_loadIcons(e){let t=this._canvas.getContext("2d",{willReadFrequently:!0});for(let i of e)this._pendingCount++,e6(i.url,this._loadOptions).then(e=>{let o=tt(i),s=this._mapping[o],{x:r,y:n,width:a,height:l}=s,{image:c,width:h,height:u}=function(e,t,i,o){let s=Math.min(i/t.width,o/t.height),r=Math.floor(t.width*s),n=Math.floor(t.height*s);return 1===s?{image:t,width:r,height:n}:(e.canvas.height=n,e.canvas.width=r,e.clearRect(0,0,r,n),e.drawImage(t,0,0,t.width,t.height,0,0,r,n),{image:e.canvas,width:r,height:n})}(t,e,a,l),f=r+(a-h)/2,d=n+(l-u)/2;this._texture?.copyExternalImage({image:c,x:f,y:d,width:h,height:u}),s.x=f,s.y=d,s.width=h,s.height=u,this._texture&&ti(this._texture),this.onUpdate(h!==a||u!==l)}).catch(e=>{this.onError({url:i.url,source:i.source,sourceIndex:i.sourceIndex,loadOptions:this._loadOptions,error:e})}).finally(()=>{this._pendingCount--})}}let tr=[0,0,0,255],tn={iconAtlas:{type:"image",value:null,async:!0},iconMapping:{type:"object",value:{},async:!0},sizeScale:{type:"number",value:1,min:0},billboard:!0,sizeUnits:"pixels",sizeBasis:"height",sizeMinPixels:{type:"number",min:0,value:0},sizeMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},alphaCutoff:{type:"number",value:.05,min:0,max:1},getPosition:{type:"accessor",value:e=>e.position},getIcon:{type:"accessor",value:e=>e.icon},getColor:{type:"accessor",value:tr},getSize:{type:"accessor",value:1},getAngle:{type:"accessor",value:0},getPixelOffset:{type:"accessor",value:[0,0]},onIconError:{type:"function",value:null,optional:!0},textureParameters:{type:"object",ignore:!0,value:null}};class ta extends d.A{getShaders(){let e=!!this.props.data?.attributes?.rowIndexes;return super.getShaders({vs:C,fs:w,source:S.replace("PICKING_COLOR_ATTRIBUTE",e?"@location(10) rowIndexes: u32,":"").replace("PICKING_COLOR_VALUE",e?"picking_getPickingColorFromIndex(inp.rowIndexes)":"picking_getPickingColorFromIndex(inp.instanceIndex)"),defines:e?{USE_ROW_INDEXES:!0}:{},modules:[p.A,g.A,m.Ay,P]})}initializeState(){this.state={iconManager:new ts(this.context.device,{onUpdate:this._onUpdate.bind(this),onError:this._onError.bind(this)})},this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition"},instanceSizes:{size:1,transition:!0,bufferGroup:"icon-instance-data",accessor:"getSize",defaultValue:1},instanceIconDefs:{size:7,bufferGroup:"icon-instance-data",accessor:"getIcon",transform:this.getInstanceIconDef,shaderAttributes:{instanceOffsets:{size:2,elementOffset:0},instanceIconFrames:{size:4,elementOffset:2},instanceColorModes:{size:1,elementOffset:6}}},instanceColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,bufferGroup:"icon-instance-data",accessor:"getColor",defaultValue:tr},instanceAngles:{size:1,transition:!0,bufferGroup:"icon-instance-data",accessor:"getAngle"},instancePixelOffset:{size:2,transition:!0,bufferGroup:"icon-instance-data",accessor:"getPixelOffset"},...this.props.data?.attributes?.rowIndexes?{rowIndexes:{size:1,type:"uint32",noAlloc:!0}}:{}})}updateState(e){super.updateState(e);let{props:t,oldProps:i,changeFlags:o}=e,s=this.getAttributeManager(),{iconAtlas:r,iconMapping:n,data:a,getIcon:l,textureParameters:c}=t,{iconManager:h}=this.state;if("string"==typeof r)return;let u=r||this.internalState.isAsyncPropLoading("iconAtlas");h.setProps({loadOptions:t.loadOptions,autoPacking:!u,iconAtlas:r,iconMapping:u?n:null,textureParameters:c}),u?i.iconMapping!==t.iconMapping&&s.invalidate("getIcon"):(o.dataChanged||o.updateTriggersChanged&&(o.updateTriggersChanged.all||o.updateTriggersChanged.getIcon))&&h.packIcons(a,l),o.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),s.invalidateAll())}get isLoaded(){return super.isLoaded&&this.state.iconManager.isLoaded}finalizeState(e){super.finalizeState(e),this.state.iconManager.finalize()}draw({uniforms:e}){this._drawModel(this.state.model)}_drawModel(e){let{sizeScale:t,sizeBasis:i,sizeMinPixels:o,sizeMaxPixels:s,sizeUnits:r,billboard:n,alphaCutoff:a}=this.props,{iconManager:l}=this.state,c=l.getTexture();if(c){let l={iconsTexture:c,iconsTextureDim:[c.width,c.height],sizeUnits:y.p5[r],sizeScale:t,sizeBasis:+("height"===i),sizeMinPixels:o,sizeMaxPixels:s,billboard:n,alphaCutoff:a};e.shaderInputs.setProps({icon:l}),e.draw(this.context.renderPass)}}_getModel(e=this.props.id){return new x.K(this.context.device,{...this.getShaders(),id:e,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new _.V({topology:"triangle-strip",attributes:{positions:{size:2,value:new Float32Array([-1,-1,1,-1,-1,1,1,1])}}}),isInstanced:!0})}_onUpdate(e){e?(this.getAttributeManager()?.invalidate("getIcon"),this.setNeedsUpdate()):this.setNeedsRedraw()}_onError(e){let t=this.getCurrentLayer()?.props.onIconError;t?t(e):v.A.error(e.error.message)()}getInstanceIconDef(e){let{x:t,y:i,width:o,height:s,mask:r,anchorX:n=o/2,anchorY:a=s/2}=this.state.iconManager.getIconMapping(e);return[o/2-n,s/2-a,t,i,o,s,+!!r]}}ta.defaultProps=tn,ta.layerName="IconLayer";let tl=ta,tc=`\
layout(std140) uniform scatterplotUniforms {
  float radiusScale;
  float radiusMinPixels;
  float radiusMaxPixels;
  float lineWidthScale;
  float lineWidthMinPixels;
  float lineWidthMaxPixels;
  float stroked;
  float filled;
  bool antialiasing;
  bool billboard;
  highp int radiusUnits;
  highp int lineWidthUnits;
} scatterplot;
`,th={name:"scatterplot",vs:tc,fs:tc,source:"",uniformTypes:{radiusScale:"f32",radiusMinPixels:"f32",radiusMaxPixels:"f32",lineWidthScale:"f32",lineWidthMinPixels:"f32",lineWidthMaxPixels:"f32",stroked:"f32",filled:"f32",antialiasing:"f32",billboard:"f32",radiusUnits:"i32",lineWidthUnits:"i32"}},tu=`\
#version 300 es
#define SHADER_NAME scatterplot-layer-vertex-shader
in vec3 positions;
in vec3 instancePositions;
in vec3 instancePositions64Low;
in float instanceRadius;
in float instanceLineWidths;
in vec4 instanceFillColors;
in vec4 instanceLineColors;
#ifdef USE_ROW_INDEXES
in float rowIndexes;
#endif
in vec2 instancePixelOffset;
out vec4 vFillColor;
out vec4 vLineColor;
out vec2 unitPosition;
out float innerUnitRadius;
out float outerRadiusPixels;
void main(void) {
geometry.worldPosition = instancePositions;
outerRadiusPixels = clamp(
project_size_to_pixel(scatterplot.radiusScale * instanceRadius, scatterplot.radiusUnits),
scatterplot.radiusMinPixels, scatterplot.radiusMaxPixels
);
float lineWidthPixels = clamp(
project_size_to_pixel(scatterplot.lineWidthScale * instanceLineWidths, scatterplot.lineWidthUnits),
scatterplot.lineWidthMinPixels, scatterplot.lineWidthMaxPixels
);
outerRadiusPixels += scatterplot.stroked * lineWidthPixels / 2.0;
float edgePadding = scatterplot.antialiasing ? (outerRadiusPixels + SMOOTH_EDGE_RADIUS) / outerRadiusPixels : 1.0;
unitPosition = edgePadding * positions.xy;
geometry.uv = unitPosition;
#ifdef USE_ROW_INDEXES
geometry.pickingColor = picking_getPickingColorFromIndex(rowIndexes);
#else
geometry.pickingColor = picking_getPickingColorFromInstanceID();
#endif
innerUnitRadius = 1.0 - scatterplot.stroked * lineWidthPixels / outerRadiusPixels;
if (scatterplot.billboard) {
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0), geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
vec3 offset = edgePadding * positions * outerRadiusPixels;
offset.xy += instancePixelOffset;
DECKGL_FILTER_SIZE(offset, geometry);
gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);
} else {
vec3 offset = edgePadding * positions * project_pixel_size(outerRadiusPixels);
offset.xy += project_pixel_size(instancePixelOffset);
DECKGL_FILTER_SIZE(offset, geometry);
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, offset, geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
}
vFillColor = vec4(instanceFillColors.rgb, instanceFillColors.a * layer.opacity);
DECKGL_FILTER_COLOR(vFillColor, geometry);
vLineColor = vec4(instanceLineColors.rgb, instanceLineColors.a * layer.opacity);
DECKGL_FILTER_COLOR(vLineColor, geometry);
}
`,tf=`\
#version 300 es
#define SHADER_NAME scatterplot-layer-fragment-shader
precision highp float;
in vec4 vFillColor;
in vec4 vLineColor;
in vec2 unitPosition;
in float innerUnitRadius;
in float outerRadiusPixels;
out vec4 fragColor;
void main(void) {
geometry.uv = unitPosition;
float distToCenter = length(unitPosition) * outerRadiusPixels;
float inCircle = scatterplot.antialiasing ?
smoothedge(distToCenter, outerRadiusPixels) :
step(distToCenter, outerRadiusPixels);
if (inCircle == 0.0) {
discard;
}
if (scatterplot.stroked > 0.5) {
float isLine = scatterplot.antialiasing ?
smoothedge(innerUnitRadius * outerRadiusPixels, distToCenter) :
step(innerUnitRadius * outerRadiusPixels, distToCenter);
if (scatterplot.filled > 0.5) {
fragColor = mix(vFillColor, vLineColor, isLine);
} else {
if (isLine == 0.0) {
discard;
}
fragColor = vec4(vLineColor.rgb, vLineColor.a * isLine);
}
} else if (scatterplot.filled < 0.5) {
discard;
} else {
fragColor = vFillColor;
}
fragColor.a *= inCircle;
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,td=`\
// Main shaders

struct ScatterplotUniforms {
  radiusScale: f32,
  radiusMinPixels: f32,
  radiusMaxPixels: f32,
  lineWidthScale: f32,
  lineWidthMinPixels: f32,
  lineWidthMaxPixels: f32,
  stroked: f32,
  filled: i32,
  antialiasing: i32,
  billboard: i32,
  radiusUnits: i32,
  lineWidthUnits: i32,
};

@group(0) @binding(0) var<uniform> scatterplot: ScatterplotUniforms;

struct Attributes {
  @builtin(instance_index) instanceIndex : u32,
  @builtin(vertex_index) vertexIndex : u32,
  @location(0) positions: vec3<f32>,
  @location(1) instancePositions: vec3<f32>,
  @location(2) instancePositions64Low: vec3<f32>,
  @location(3) instanceRadius: f32,
  @location(4) instanceLineWidths: f32,
  @location(5) instanceFillColors: vec4<f32>,
  @location(6) instanceLineColors: vec4<f32>,
  @location(7) instancePixelOffset: vec2<f32>,
  PICKING_COLOR_ATTRIBUTE
};

struct Varyings {
  @builtin(position) position: vec4<f32>,
  @location(0) vFillColor: vec4<f32>,
  @location(1) vLineColor: vec4<f32>,
  @location(2) unitPosition: vec2<f32>,
  @location(3) innerUnitRadius: f32,
  @location(4) outerRadiusPixels: f32,
  @location(5) pickingColor: vec3<f32>,
  @location(6) clipCoordinates: vec2<f32>,
};

@vertex
fn vertexMain(attributes: Attributes) -> Varyings {
  var varyings: Varyings;

  // Draw an inline geometry constant array clip space triangle to verify that rendering works.
  // var positions = array<vec2<f32>, 3>(vec2(0.0, 0.5), vec2(-0.5, -0.5), vec2(0.5, -0.5));
  // if (attributes.instanceIndex == 0) {
  //   varyings.position = vec4<f32>(positions[attributes.vertexIndex], 0.0, 1.0);
  //   return varyings;
  // }

  geometry.worldPosition = attributes.instancePositions;

  // Multiply out radius and clamp to limits
  varyings.outerRadiusPixels = clamp(
    project_unit_size_to_pixel(scatterplot.radiusScale * attributes.instanceRadius, scatterplot.radiusUnits),
    scatterplot.radiusMinPixels, scatterplot.radiusMaxPixels
  );

  // Multiply out line width and clamp to limits
  let lineWidthPixels = clamp(
    project_unit_size_to_pixel(scatterplot.lineWidthScale * attributes.instanceLineWidths, scatterplot.lineWidthUnits),
    scatterplot.lineWidthMinPixels, scatterplot.lineWidthMaxPixels
  );

  // outer radius needs to offset by half stroke width
  varyings.outerRadiusPixels += scatterplot.stroked * lineWidthPixels / 2.0;
  // Expand geometry to accommodate edge smoothing
  // WGSL selects the second value when the condition is true, so keep the antialiased path second.
  let edgePadding = select(
    1.0,
    (varyings.outerRadiusPixels + SMOOTH_EDGE_RADIUS) / varyings.outerRadiusPixels,
    scatterplot.antialiasing != 0
  );

  // position on the containing square in [-1, 1] space
  varyings.unitPosition = edgePadding * attributes.positions.xy;
  geometry.uv = varyings.unitPosition;
  geometry.pickingColor = PICKING_COLOR_VALUE;

  varyings.innerUnitRadius = 1.0 - scatterplot.stroked * lineWidthPixels / varyings.outerRadiusPixels;

  if (scatterplot.billboard != 0) {
    let projectedPosition = project_position_to_clipspace_and_commonspace(
      attributes.instancePositions,
      attributes.instancePositions64Low,
      vec3<f32>(0.0)
    );
    geometry.position = projectedPosition.commonPosition;
    varyings.position = projectedPosition.clipPosition;
    // DECKGL_FILTER_GL_POSITION(varyings.position, geometry);
    var offset = edgePadding * attributes.positions * varyings.outerRadiusPixels;
    offset = vec3<f32>(offset.xy + attributes.instancePixelOffset, offset.z);
    // DECKGL_FILTER_SIZE(offset, geometry);
    let clipPixels = project_pixel_size_to_clipspace(offset.xy);
    varyings.position = vec4<f32>(varyings.position.x + clipPixels.x, varyings.position.y + clipPixels.y, varyings.position.z, varyings.position.w);
    geometry.position = vec4<f32>(
      geometry.position.xy + project_pixel_size_vec2(offset.xy),
      geometry.position.zw
    );
  } else {
    var offset = edgePadding * attributes.positions * project_pixel_size_float(varyings.outerRadiusPixels);
    offset = vec3<f32>(offset.xy + project_pixel_size_vec2(attributes.instancePixelOffset), offset.z);
    // DECKGL_FILTER_SIZE(offset, geometry);
    let projectedPosition = project_position_to_clipspace_and_commonspace(
      attributes.instancePositions,
      attributes.instancePositions64Low,
      offset
    );
    geometry.position = projectedPosition.commonPosition;
    varyings.position = projectedPosition.clipPosition;
    // DECKGL_FILTER_GL_POSITION(varyings.position, geometry);
  }

  varyings.clipCoordinates = geometry.position.xy;
  clip_filterPosition(&varyings.position, geometry.worldPosition.xy);

  // Apply opacity to instance color, or return instance picking color
  varyings.vFillColor = vec4<f32>(attributes.instanceFillColors.rgb, attributes.instanceFillColors.a * layer.opacity);
  // DECKGL_FILTER_COLOR(varyings.vFillColor, geometry);
  varyings.vLineColor = vec4<f32>(attributes.instanceLineColors.rgb, attributes.instanceLineColors.a * layer.opacity);
  // DECKGL_FILTER_COLOR(varyings.vLineColor, geometry);
  varyings.pickingColor = geometry.pickingColor;

  return varyings;
}

@fragment
fn fragmentMain(varyings: Varyings) -> @location(0) vec4<f32> {
  // var geometry: Geometry;
  // geometry.uv = unitPosition;

  let distToCenter = length(varyings.unitPosition) * varyings.outerRadiusPixels;
  let inCircle = select(
    step(distToCenter, varyings.outerRadiusPixels),
    smoothedge(distToCenter, varyings.outerRadiusPixels),
    scatterplot.antialiasing != 0
  );

  if (inCircle == 0.0) {
    discard;
  }

  var fragColor: vec4<f32>;

  if (scatterplot.stroked != 0) {
    let isLine = select(
      step(varyings.innerUnitRadius * varyings.outerRadiusPixels, distToCenter),
      smoothedge(varyings.innerUnitRadius * varyings.outerRadiusPixels, distToCenter),
      scatterplot.antialiasing != 0
    );

    if (scatterplot.filled != 0) {
      fragColor = mix(varyings.vFillColor, varyings.vLineColor, isLine);
    } else {
      if (isLine == 0.0) {
        discard;
      }
      fragColor = vec4<f32>(varyings.vLineColor.rgb, varyings.vLineColor.a * isLine);
    }
  } else if (scatterplot.filled == 0) {
    discard;
  } else {
    fragColor = varyings.vFillColor;
  }

  fragColor.a *= inCircle;

  clip_filterColor(varyings.clipCoordinates);

  if (picking.isActive > 0.5) {
    if (!picking_isColorValid(varyings.pickingColor)) {
      discard;
    }
    return vec4<f32>(varyings.pickingColor, 1.0);
  }

  if (picking.isHighlightActive > 0.5) {
    let highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
    if (picking_isColorZero(abs(varyings.pickingColor - highlightedObjectColor))) {
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

  // Apply premultiplied alpha as required by transparent canvas
  fragColor = deckgl_premultiplied_alpha(fragColor);

  return fragColor;
  // return vec4<f32>(0, 0, 1, 1);
}
`;var tp=i(82819);let tg=[0,0,0,255],tm={radiusUnits:"meters",radiusScale:{type:"number",min:0,value:1},radiusMinPixels:{type:"number",min:0,value:0},radiusMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},lineWidthUnits:"meters",lineWidthScale:{type:"number",min:0,value:1},lineWidthMinPixels:{type:"number",min:0,value:0},lineWidthMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},stroked:!1,filled:!0,billboard:!1,antialiasing:!0,getPosition:{type:"accessor",value:e=>e.position},getRadius:{type:"accessor",value:1},getFillColor:{type:"accessor",value:tg},getLineColor:{type:"accessor",value:tg},getLineWidth:{type:"accessor",value:1},getPixelOffset:{type:"accessor",value:[0,0]},strokeWidth:{deprecatedFor:"getLineWidth"},outline:{deprecatedFor:"stroked"},getColor:{deprecatedFor:["getFillColor","getLineColor"]}};class ty extends d.A{getShaders(){let e=!!this.props.data?.attributes?.rowIndexes;return super.getShaders({vs:tu,fs:tf,source:td.replace("PICKING_COLOR_ATTRIBUTE",e?"@location(8) rowIndexes: u32,":"").replace("PICKING_COLOR_VALUE",e?"picking_getPickingColorFromIndex(attributes.rowIndexes)":"picking_getPickingColorFromIndex(attributes.instanceIndex)"),defines:e?{USE_ROW_INDEXES:!0}:{},modules:[p.A,g.A,m.Ay,th,..."webgpu"===this.context.device.type?[tp.A]:[]]})}initializeState(){let e=this.props.data?.attributes?.rowIndexes?{rowIndexes:{size:1,type:"uint32",noAlloc:!0}}:{};this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition"},instanceRadius:{size:1,transition:!0,accessor:"getRadius",defaultValue:1,bufferGroup:"scatterplot-instance-data"},instanceFillColors:{size:this.props.colorFormat.length,transition:!0,type:"unorm8",accessor:"getFillColor",defaultValue:[0,0,0,255],bufferGroup:"scatterplot-instance-data"},instanceLineColors:{size:this.props.colorFormat.length,transition:!0,type:"unorm8",accessor:"getLineColor",defaultValue:[0,0,0,255],bufferGroup:"scatterplot-instance-data"},instanceLineWidths:{size:1,transition:!0,accessor:"getLineWidth",defaultValue:1,bufferGroup:"scatterplot-instance-data"},instancePixelOffset:{size:2,transition:!0,accessor:"getPixelOffset",bufferGroup:"scatterplot-instance-data"},...e})}updateState(e){super.updateState(e),e.changeFlags.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll())}draw({uniforms:e}){let{radiusUnits:t,radiusScale:i,radiusMinPixels:o,radiusMaxPixels:s,stroked:r,filled:n,billboard:a,antialiasing:l,lineWidthUnits:c,lineWidthScale:h,lineWidthMinPixels:u,lineWidthMaxPixels:f}=this.props,d={stroked:r,filled:n,billboard:a,antialiasing:l,radiusUnits:y.p5[t],radiusScale:i,radiusMinPixels:o,radiusMaxPixels:s,lineWidthUnits:y.p5[c],lineWidthScale:h,lineWidthMinPixels:u,lineWidthMaxPixels:f},p=this.state.model;p.shaderInputs.setProps({scatterplot:d}),p.draw(this.context.renderPass)}_getModel(){return new x.K(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new _.V({topology:"triangle-strip",attributes:{positions:{size:3,value:new Float32Array([-1,-1,0,1,-1,0,-1,1,0,1,1,0])}}}),isInstanced:!0})}}ty.defaultProps=tm,ty.layerName="ScatterplotLayer";let tv=`\
layout(std140) uniform sdfUniforms {
  float gamma;
  bool enabled;
  float buffer;
  float outlineBuffer;
  vec4 outlineColor;
} sdf;
`,tx={name:"sdf",vs:tv,fs:tv,uniformTypes:{gamma:"f32",enabled:"f32",buffer:"f32",outlineBuffer:"f32",outlineColor:"vec4<f32>"}},t_={none:0,start:1,center:2,end:3},tb={name:"text",vs:`\
layout(std140) uniform textUniforms {
  highp vec2 cutoffPixels;
  highp ivec2 align;
  highp float fontSize;
  bool flipY;
} text;

#define ALIGN_MODE_START ${t_.start}
#define ALIGN_MODE_CENTER ${t_.center}
#define ALIGN_MODE_END ${t_.end}
`,getUniforms:({contentCutoffPixels:e=[0,0],contentAlignHorizontal:t="none",contentAlignVertical:i="none",fontSize:o,viewport:s})=>({cutoffPixels:e,align:[t_[t],t_[i]],fontSize:o,flipY:s?.flipY??!1}),uniformTypes:{cutoffPixels:"vec2<f32>",align:"vec2<i32>",fontSize:"f32",flipY:"f32"}},tP=`\
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
`,tC=`\
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
`,tw=function({collision:e=!1}={}){return`\
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
`}();class tS extends tl{getShaders(){let e=super.getShaders();return{...e,modules:[...e.modules,tb,tx],vs:tP,fs:tC,source:tw}}initializeState(){super.initializeState();let e=this.getAttributeManager();e.attributes.instanceIconDefs.settings.update=this.calculateInstanceIconDefs,e.addInstanced({rowIndexes:{type:"uint32",size:1,bufferGroup:"icon-instance-data",accessor:(e,{index:t})=>t},instanceClipRect:{size:4,bufferGroup:"icon-instance-data",accessor:"getContentBox",defaultValue:[0,0,-1,-1]}})}updateState(e){super.updateState(e);let{props:t,oldProps:i,changeFlags:o}=e,{outlineColor:s}=t;if(o.extensionsChanged){this.state.fillModel?.destroy();let e="webgpu"===this.context.device.type?this._getModel(`${this.props.id}-fill`):void 0;this.setState({fillModel:e,models:e?[this.state.model,e]:[this.state.model]})}if(o.updateTriggersChanged&&(o.updateTriggersChanged.getIcon||o.updateTriggersChanged.getIconOffsets)&&this.getAttributeManager().invalidate("instanceIconDefs"),s!==i.outlineColor){let e=[s[0]/255,s[1]/255,s[2]/255,(s[3]??255)/255];this.setState({outlineColor:e})}!t.sdf&&t.outlineWidth&&v.A.warn(`${this.id}: fontSettings.sdf is required to render outline`)()}draw(e){let{sdf:t,smoothing:i,fontSize:o,outlineWidth:s,contentCutoffPixels:r,contentAlignHorizontal:n,contentAlignVertical:a}=this.props,{outlineColor:l}=this.state,c=s?Math.max(i,.75*(1-s)):-1,h=this.state.model,u={buffer:.75,outlineBuffer:c,gamma:i,enabled:!!t,outlineColor:l},f={contentCutoffPixels:r,contentAlignHorizontal:n,contentAlignVertical:a,fontSize:o,viewport:this.context.viewport};if(h.shaderInputs.setProps({sdf:u,text:f}),super.draw(e),t&&s){let{iconManager:e}=this.state;if(e.getTexture()){let e=this.state.fillModel||h;e.shaderInputs.setProps({sdf:{...u,outlineBuffer:.75},text:f}),this._drawModel(e)}}}calculateInstanceIconDefs(e,{startRow:t,endRow:i}){let{data:o,getIcon:s,getIconOffsets:r}=this.props,n=e.getVertexOffset(t),a=e.value,{iterable:l,objectInfo:c}=(0,e8.X)(o,t,i);for(let t of l){c.index++;let i=s(t,c),o=r(t,c);if(i){let t=0;for(let s of Array.from(i)){let i=super.getInstanceIconDef(s);i[0]=o[2*t],i[1]+=o[2*t+1],i[6]=1,a.set(i,n),n+=e.size,t++}}}}}tS.defaultProps={getIconOffsets:{type:"accessor",value:e=>e.offsets},getContentBox:{type:"accessor",value:[0,0,-1,-1]},fontSize:1,alphaCutoff:.001,smoothing:.1,outlineWidth:0,outlineColor:{type:"color",value:[0,0,0,255]},contentCutoffPixels:{type:"array",value:[0,0]},contentAlignHorizontal:"none",contentAlignVertical:"none"},tS.layerName="MultiIconLayer";var tL=i(58974);let tA=[];function tE(e,t,i,o){let s=0;for(let r=t;r<i;r++){let t=e[r];s+=o[t]?.advance||0}return s}function tT(e,t,i,o,s,r){let n=t,a=0;for(let l=t;l<i;l++){let t=tE(e,l,l+1,s);a+t>o&&(n<l&&r.push(l),n=l,a=0),a+=t}return a}class tM{constructor(e=5){this._cache={},this._order=[],this.limit=e}get(e){let t=this._cache[e];return t&&(this._deleteOrder(e),this._appendOrder(e)),t}set(e,t){this._cache[e]?this.delete(e):Object.keys(this._cache).length===this.limit&&this.delete(this._order[0]),this._cache[e]=t,this._appendOrder(e)}delete(e){this._cache[e]&&(delete this._cache[e],this._deleteOrder(e))}_deleteOrder(e){let t=this._order.indexOf(e);t>=0&&this._order.splice(t,1)}_appendOrder(e){this._order.push(e)}}let tO={fontFamily:"Monaco, monospace",fontWeight:"normal",characterSet:function(){let e=[];for(let t=32;t<128;t++)e.push(String.fromCharCode(t));return e}(),fontSize:64,buffer:4,sdf:!1,cutoff:.25,radius:12,smoothing:.1},tR=new tM(3);function tI(e,t,i,o){e.font=`${o} ${i}px ${t}`,e.fillStyle="#000",e.textBaseline="alphabetic",e.textAlign="left"}class tz{constructor(){this.props={...tO}}get atlas(){return this._atlas}get mapping(){return this._atlas&&this._atlas.mapping}setProps(e={}){Object.assign(this.props,e),e._getFontRenderer&&(this._getFontRenderer=e._getFontRenderer),this._key=this._getKey();let t=function(e,t){let i;i=new Set("string"==typeof t?Array.from(t):t);let o=tR.get(e);if(!o)return i;for(let e in o.mapping)i.has(e)&&i.delete(e);return i}(this._key,this.props.characterSet),i=tR.get(this._key);if(i&&0===t.size){this._atlas!==i&&(this._atlas=i);return}let o=this._generateFontAtlas(t,i);this._atlas=o,tR.set(this._key,o)}_generateFontAtlas(e,t){let i,{fontFamily:o,fontWeight:s,fontSize:r,buffer:n,sdf:a,radius:l,cutoff:c}=this.props,h=t&&t.data;h||((h=document.createElement("canvas")).width=1024);let u=h.getContext("2d",{willReadFrequently:!0});tI(u,o,r,s);let f=e=>(function(e,t,i){if(void 0===i){let i=e.measureText("A");return i.fontBoundingBoxAscent?{advance:0,width:0,ascent:Math.ceil(i.fontBoundingBoxAscent),descent:Math.ceil(i.fontBoundingBoxDescent)}:{advance:0,width:0,ascent:.9*t,descent:.3*t}}let o=e.measureText(i);return o.actualBoundingBoxAscent?{advance:o.width,width:Math.ceil(o.actualBoundingBoxRight-o.actualBoundingBoxLeft),ascent:Math.ceil(o.actualBoundingBoxAscent),descent:Math.ceil(o.actualBoundingBoxDescent)}:{advance:o.width,width:o.width,ascent:.9*t,descent:.3*t}})(u,r,e);this._getFontRenderer?i=this._getFontRenderer(this.props):a&&(i={measure:f,draw:function({fontSize:e,buffer:t,radius:i,cutoff:o,fontFamily:s,fontWeight:r}){let n=new tL.A({fontSize:e,buffer:t,radius:i,cutoff:o,fontFamily:s,fontWeight:`${r}`});return e=>{let{data:i,width:o,height:s}=n.draw(e),r=new ImageData(o,s);for(let e=0;e<i.length;e++)r.data[4*e+3]=i[e];return{data:r,left:t,top:t}}}(this.props)});let{mapping:d,canvasHeight:p,xOffset:g,yOffsetMin:m,yOffsetMax:y}=function({characterSet:e,measureText:t,buffer:i,maxCanvasWidth:o,mapping:s={},xOffset:r=0,yOffsetMin:n=0,yOffsetMax:a=0}){let l=r,c=n,h=a;for(let r of e)if(!s[r]){let{advance:e,width:n,ascent:a,descent:u}=t(r),f=a+u;l+n+2*i>o&&(l=0,c=h),s[r]={x:l+i,y:c+i,width:n,height:f,advance:e,anchorX:n/2,anchorY:a},l+=n+2*i,h=Math.max(h,c+f+2*i)}return{mapping:s,xOffset:l,yOffsetMin:c,yOffsetMax:h,canvasHeight:Math.pow(2,Math.ceil(Math.log2(h)))}}({measureText:e=>i?i.measure(e):f(e),buffer:n,characterSet:e,maxCanvasWidth:1024,...t&&{mapping:t.mapping,xOffset:t.xOffset,yOffsetMin:t.yOffsetMin,yOffsetMax:t.yOffsetMax}});if(h.height!==p){let e=h.height>0?u.getImageData(0,0,h.width,h.height):null;h.height=p,e&&u.putImageData(e,0,0)}if(tI(u,o,r,s),i)for(let t of e){let e=d[t],o=e.width,{data:s,left:r=0,top:n=0}=i.draw(t),a=e.x-r,l=e.y-n,c=Math.max(0,Math.round(a)),f=Math.max(0,Math.round(l)),p=Math.min(s.width,h.width-c),g=Math.min(s.height,h.height-f);u.putImageData(s,c,f,0,0,p,g),e.x=c,e.y=f,e.width=p,e.height=g,e.anchorX+=p/2-r-o/2,e.anchorY+=n}else for(let t of e){let e=d[t];u.fillText(t,e.x,e.y+e.anchorY)}let v=i?i.measure():f();return{baselineOffset:(v.ascent-v.descent)/2,xOffset:g,yOffsetMin:m,yOffsetMax:y,mapping:d,data:h,width:h.width,height:h.height}}_getKey(){let{fontFamily:e,fontWeight:t,fontSize:i,buffer:o,sdf:s,radius:r,cutoff:n}=this.props;return s?`${e} ${t} ${i} ${o} ${r} ${n}`:`${e} ${t} ${i} ${o}`}}let tk=`\
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
`,tN={name:"textBackground",source:`\
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
`,vs:tk,fs:tk,uniformTypes:{billboard:"f32",sizeScale:"f32",sizeMinPixels:"f32",sizeMaxPixels:"f32",borderRadius:"vec4<f32>",padding:"vec4<f32>",sizeUnits:"i32",stroked:"f32"}},tB=`\
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
`,tF=`\
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
`,tD=`\
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
`,tj={billboard:!0,sizeScale:1,sizeUnits:"pixels",sizeMinPixels:0,sizeMaxPixels:Number.MAX_SAFE_INTEGER,fontSize:1,borderRadius:{type:"object",value:0},padding:{type:"array",value:[0,0,0,0]},getPosition:{type:"accessor",value:e=>e.position},getSize:{type:"accessor",value:1},getAngle:{type:"accessor",value:0},getPixelOffset:{type:"accessor",value:[0,0]},getBoundingRect:{type:"accessor",value:[0,0,0,0]},getClipRect:{type:"accessor",value:[0,0,-1,-1]},getFillColor:{type:"accessor",value:[0,0,0,255]},getLineColor:{type:"accessor",value:[0,0,0,255]},getLineWidth:{type:"accessor",value:1}};class tV extends d.A{getShaders(){return super.getShaders({vs:tB,fs:tF,source:tD,modules:[p.A,g.A,m.Ay,tN,tb]})}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition"},instanceSizes:{size:1,transition:!0,bufferGroup:"text-background-instance-data",accessor:"getSize",defaultValue:1},instanceAngles:{size:1,transition:!0,bufferGroup:"text-background-instance-data",accessor:"getAngle"},instanceRects:{size:4,bufferGroup:"text-background-instance-data",accessor:"getBoundingRect"},instanceClipRect:{size:4,bufferGroup:"text-background-instance-data",accessor:"getClipRect",defaultValue:[0,0,-1,-1]},instancePixelOffsets:{size:2,transition:!0,bufferGroup:"text-background-instance-data",accessor:"getPixelOffset"},instanceFillColors:{size:4,transition:!0,type:"unorm8",accessor:"getFillColor",defaultValue:[0,0,0,255]},instanceLineColors:{size:4,transition:!0,type:"unorm8",accessor:"getLineColor",defaultValue:[0,0,0,255]},instanceLineWidths:{size:1,transition:!0,bufferGroup:"text-background-instance-data",accessor:"getLineWidth",defaultValue:1}})}updateState(e){super.updateState(e);let{changeFlags:t}=e;t.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll())}draw({uniforms:e}){let{billboard:t,sizeScale:i,sizeUnits:o,sizeMinPixels:s,sizeMaxPixels:r,getLineWidth:n,fontSize:a}=this.props,{padding:l,borderRadius:c}=this.props;l.length<4&&(l=[l[0],l[1],l[0],l[1]]),Array.isArray(c)||(c=[c,c,c,c]);let h=this.state.model,u={billboard:t,stroked:!!n,borderRadius:c,padding:l,sizeUnits:y.p5[o],sizeScale:i,sizeMinPixels:s,sizeMaxPixels:r},f={fontSize:a,viewport:this.context.viewport};h.shaderInputs.setProps({textBackground:u,text:f}),h.draw(this.context.renderPass)}_getModel(){return new x.K(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new _.V({topology:"triangle-strip",vertexCount:4,attributes:{positions:{size:2,value:new Float32Array([0,0,1,0,0,1,1,1])}}}),isInstanced:!0})}}tV.defaultProps=tj,tV.layerName="TextBackgroundLayer";let tW={start:1,middle:0,end:-1},tU={top:1,center:0,bottom:-1},tG=[0,0,0,255],tq={billboard:!0,sizeScale:1,sizeUnits:"pixels",sizeMinPixels:0,sizeMaxPixels:Number.MAX_SAFE_INTEGER,background:!1,getBackgroundColor:{type:"accessor",value:[255,255,255,255]},getBorderColor:{type:"accessor",value:tG},getBorderWidth:{type:"accessor",value:0},backgroundBorderRadius:{type:"object",value:0},backgroundPadding:{type:"array",value:[0,0,0,0]},characterSet:{type:"object",value:tO.characterSet},fontFamily:tO.fontFamily,fontWeight:tO.fontWeight,lineHeight:1,outlineWidth:{type:"number",value:0,min:0},outlineColor:{type:"color",value:tG},fontSettings:{type:"object",value:{},compare:1},wordBreak:"break-word",maxWidth:{type:"number",value:-1},contentCutoffPixels:{type:"array",value:[0,0]},contentAlignHorizontal:"none",contentAlignVertical:"none",getText:{type:"accessor",value:e=>e.text},getPosition:{type:"accessor",value:e=>e.position},getColor:{type:"accessor",value:tG},getSize:{type:"accessor",value:32},getAngle:{type:"accessor",value:0},getTextAnchor:{type:"accessor",value:"middle"},getAlignmentBaseline:{type:"accessor",value:"center"},getPixelOffset:{type:"accessor",value:[0,0]},getContentBox:{type:"accessor",value:[0,0,-1,-1]},backgroundColor:{deprecatedFor:["background","getBackgroundColor"]}};class t$ extends u.A{constructor(){super(...arguments),this.getBoundingRect=(e,t)=>{let{size:[i,o]}=this.transformParagraph(e,t),{getTextAnchor:s,getAlignmentBaseline:r}=this.props;return[(tW["function"==typeof s?s(e,t):s]-1)*i/2,(tU["function"==typeof r?r(e,t):r]-1)*o/2,i,o]},this.getIconOffsets=(e,t)=>{let{getTextAnchor:i,getAlignmentBaseline:o}=this.props,{x:s,y:r,rowWidth:n,size:[,a]}=this.transformParagraph(e,t),l=tW["function"==typeof i?i(e,t):i],c=tU["function"==typeof o?o(e,t):o],h=s.length,u=Array(2*h),f=0;for(let e=0;e<h;e++)u[f++]=(l-1)*n[e]/2+s[e],u[f++]=(c-1)*a/2+r[e];return u}}initializeState(){this.state={styleVersion:0,fontAtlasManager:new tz},this.props.maxWidth>0&&v.A.once(1,"v8.9 breaking change: TextLayer maxWidth is now relative to text size")()}updateState(e){let{props:t,oldProps:i,changeFlags:o}=e;(o.dataChanged||o.updateTriggersChanged&&(o.updateTriggersChanged.all||o.updateTriggersChanged.getText))&&this._updateText(),(this._updateFontAtlas()||t.lineHeight!==i.lineHeight||t.wordBreak!==i.wordBreak||t.maxWidth!==i.maxWidth)&&this.setState({styleVersion:this.state.styleVersion+1})}getPickingInfo({info:e}){return e.object=e.index>=0?this.props.data[e.index]:null,e}_updateFontAtlas(){let{fontSettings:e,fontFamily:t,fontWeight:i,_getFontRenderer:o}=this.props,{fontAtlasManager:s,characterSet:r}=this.state,n={...e,characterSet:r,fontFamily:t,fontWeight:i,_getFontRenderer:o};if(!s.mapping)return s.setProps(n),!0;for(let e in n)if(n[e]!==s.props[e])return s.setProps(n),!0;return!1}_updateText(){let e,{data:t,characterSet:i}=this.props,o=t.attributes?.getText,{getText:s}=this.props,r=t.startIndices,n="auto"===i&&new Set;if(o&&r){let{texts:i,characterCount:a}=function({value:e,length:t,stride:i,offset:o,startIndices:s,characterSet:r}){let n=e.BYTES_PER_ELEMENT,a=i?i/n:1,l=o?o/n:0,c=s[t]||Math.ceil((e.length-l)/a),h=r&&new Set,u=Array(t),f=e;if(a>1||l>0){f=new e.constructor(c);for(let t=0;t<c;t++)f[t]=e[t*a+l]}for(let e=0;e<t;e++){let t=s[e],i=s[e+1]||c,o=f.subarray(t,i);u[e]=String.fromCodePoint.apply(null,o),h&&o.forEach(h.add,h)}if(h)for(let e of h)r.add(String.fromCodePoint(e));return{texts:u,characterCount:c}}({...ArrayBuffer.isView(o)?{value:o}:o,length:t.length,startIndices:r,characterSet:n});e=a,s=(e,{index:t})=>i[t]}else{let{iterable:i,objectInfo:o}=(0,e8.X)(t);for(let t of(r=[0],e=0,i)){o.index++;let i=Array.from(s(t,o)||"");n&&i.forEach(n.add,n),e+=i.length,r.push(e)}}this.setState({getText:s,startIndices:r,numInstances:e,characterSet:n||i})}transformParagraph(e,t){let{fontAtlasManager:i}=this.state,o=i.mapping,{baselineOffset:s}=i.atlas,{fontSize:r}=i.props,n=this.state.getText,{wordBreak:a,lineHeight:l,maxWidth:c}=this.props;return function(e,t,i,o,s,r){let n=Array.from(e),a=n.length,l=Array(a),c=Array(a),h=Array(a),u=("break-word"===o||"break-all"===o)&&isFinite(s)&&s>0,f=[0,0],d=[0,0],p=0,g=t+i/2,m=0,y=0;for(let e=0;e<=a;e++){let t=n[e];if(("\n"===t||e===a)&&(y=e),y>m){let e=u?function(e,t,i,o,s=0,r){void 0===r&&(r=e.length);let n=[];return"break-all"===t?tT(e,s,r,i,o,n):!function(e,t,i,o,s,r){let n=t,a=t,l=t,c=0;for(let h=t;h<i;h++)if(" "===e[h]?l=h+1:(" "===e[h+1]||h+1===i)&&(l=h+1),l>a){let t=tE(e,a,l,s);c+t>o&&(n<a&&(r.push(a),n=a,c=0),t>o&&(t=tT(e,a,l,o,s,r),n=r[r.length-1])),a=l,c+=t}}(e,s,r,i,o,n),n}(n,o,s,r,m,y):tA;for(let t=0;t<=e.length;t++){let o=0===t?m:e[t-1],s=t<e.length?e[t]:y;!function(e,t,i,o,s,r){let n=0,a=0;for(let s=t;s<i;s++){let t=o[e[s]];t&&(a=Math.max(a,t.height))}for(let r=t;r<i;r++){let t=e[r],i=o[t];i?(s[r]=n+i.anchorX,n+=i.advance):(v.A.warn(`Missing character: ${t} (${t.codePointAt(0)})`)(),s[r]=n,n+=32)}r[0]=n,r[1]=a}(n,o,s,r,l,d);for(let e=o;e<s;e++)c[e]=g,h[e]=d[0];p++,g+=i,f[0]=Math.max(f[0],d[0])}m=y}"\n"===t&&(l[m]=0,c[m]=0,h[m]=0,m++)}return f[1]=p*i,{x:l,y:c,rowWidth:h,size:f}}(n(e,t)||"",s,l*r,a,c*r,o)}renderLayers(){let{startIndices:e,numInstances:t,getText:i,fontAtlasManager:{atlas:o,mapping:s},styleVersion:r}=this.state,{data:n,_dataDiff:a,getPosition:l,getColor:c,getSize:h,getAngle:u,getPixelOffset:f,getBackgroundColor:d,getBorderColor:p,getBorderWidth:g,getContentBox:m,backgroundBorderRadius:y,backgroundPadding:v,background:x,billboard:_,fontSettings:b,outlineWidth:P,outlineColor:C,sizeScale:w,sizeUnits:S,sizeMinPixels:L,sizeMaxPixels:A,contentCutoffPixels:E,contentAlignHorizontal:T,contentAlignVertical:M,transitions:O,updateTriggers:R}=this.props,I=this.getSubLayerClass("characters",tS),z=this.getSubLayerClass("background",tV),{fontSize:k}=this.state.fontAtlasManager.props;return[x&&new z({getFillColor:d,getLineColor:p,getLineWidth:g,borderRadius:y,padding:v,getPosition:l,getSize:h,getAngle:u,getPixelOffset:f,getClipRect:m,billboard:_,sizeScale:w,sizeUnits:S,sizeMinPixels:L,sizeMaxPixels:A,fontSize:k,transitions:O&&{getPosition:O.getPosition,getAngle:O.getAngle,getSize:O.getSize,getFillColor:O.getBackgroundColor,getLineColor:O.getBorderColor,getLineWidth:O.getBorderWidth,getPixelOffset:O.getPixelOffset}},this.getSubLayerProps({id:"background",updateTriggers:{getPosition:R.getPosition,getAngle:R.getAngle,getSize:R.getSize,getFillColor:R.getBackgroundColor,getLineColor:R.getBorderColor,getLineWidth:R.getBorderWidth,getPixelOffset:R.getPixelOffset,getBoundingRect:{getText:R.getText,getTextAnchor:R.getTextAnchor,getAlignmentBaseline:R.getAlignmentBaseline,styleVersion:r}}}),{data:n.attributes&&n.attributes.background?{length:n.length,attributes:n.attributes.background}:n,_dataDiff:a,autoHighlight:!1,getBoundingRect:this.getBoundingRect}),new I({sdf:b.sdf,smoothing:Number.isFinite(b.smoothing)?b.smoothing:tO.smoothing,outlineWidth:P/(b.radius||tO.radius),outlineColor:C,iconAtlas:o,iconMapping:s,getPosition:l,getColor:c,getSize:h,getAngle:u,getPixelOffset:f,getContentBox:m,billboard:_,sizeScale:w,sizeUnits:S,sizeMinPixels:L,sizeMaxPixels:A,fontSize:k,contentCutoffPixels:E,contentAlignHorizontal:T,contentAlignVertical:M,transitions:O&&{getPosition:O.getPosition,getAngle:O.getAngle,getColor:O.getColor,getSize:O.getSize,getPixelOffset:O.getPixelOffset,getContentBox:O.getContentBox}},this.getSubLayerProps({id:"characters",updateTriggers:{all:R.getText,getPosition:R.getPosition,getAngle:R.getAngle,getColor:R.getColor,getSize:R.getSize,getPixelOffset:R.getPixelOffset,getContentBox:R.getContentBox,getIconOffsets:{getTextAnchor:R.getTextAnchor,getAlignmentBaseline:R.getAlignmentBaseline,styleVersion:r}}}),{data:n,_dataDiff:a,startIndices:e,numInstances:t,getIconOffsets:this.getIconOffsets,getIcon:i})]}static set fontAtlasCacheLimit(e){v.A.assert(Number.isFinite(e)&&e>=3,"Invalid cache limit"),tR=new tM(e)}}t$.defaultProps=tq,t$.layerName="TextLayer";var tK=i(88149),tH=i(37072),tZ=i(55230),tJ=i(18135);let tY=tJ.rJ.CLOCKWISE,tX=tJ.rJ.COUNTER_CLOCKWISE,tQ={isClosed:!0};function t0(e){return"positions"in e?e.positions:e}function t2(e){return"holeIndices"in e?e.holeIndices:null}function t1(e,t,i,o,s){let r,n,a=t,l=i.length;for(let t=0;t<l;t++)for(let s=0;s<o;s++)e[a++]=i[t][s]||0;if(r=i[0],n=i[i.length-1],r[0]!==n[0]||r[1]!==n[1]||r[2]!==n[2])for(let t=0;t<o;t++)e[a++]=i[0][t]||0;return tQ.start=t,tQ.end=a,tQ.size=o,(0,tJ.UD)(e,s,tQ),a}function t3(e,t,i,o,s=0,r,n){let a=(r=r||i.length)-s;if(a<=0)return t;let l=t;for(let t=0;t<a;t++)e[l++]=i[s+t];if(!function(e,t,i,o){for(let s=0;s<t;s++)if(e[i+s]!==e[o-t+s])return!1;return!0}(i,o,s,r))for(let t=0;t<o;t++)e[l++]=i[s+t];return tQ.start=t,tQ.end=l,tQ.size=o,(0,tJ.UD)(e,n,tQ),l}function t4(e,t,i){let o=e.length/3,s=0;for(let r=0;r<o;r++){let n=(r+1)%o;s+=e[3*r+t]*e[3*n+i],s-=e[3*n+t]*e[3*r+i]}return Math.abs(s/2)}function t5(e,t,i,o){let s=e.length/3;for(let r=0;r<s;r++){let s=3*r,n=e[s+0],a=e[s+1],l=e[s+2];e[s+t]=n,e[s+i]=a,e[s+o]=l}}var t6=i(44941),t8=i(76046),t9=i(6423);class t7 extends t6.A{constructor(e){let{fp64:t,IndexType:i=Uint32Array}=e;super({...e,attributes:{positions:{size:3,type:t?Float64Array:Float32Array},vertexValid:{type:Uint16Array,size:1},indices:{type:i,size:1}}})}get(e){let{attributes:t}=this;return"indices"===e?t.indices&&t.indices.subarray(0,this.vertexCount):t[e]}updateGeometry(e){super.updateGeometry(e);let t=this.buffers.indices;if(t)this.vertexCount=(t.value||t).length;else if(this.data&&!this.getGeometry)throw Error("missing indices buffer")}normalizeGeometry(e){if(this.normalize){let t=function(e,t){var i,o=e;if(!Array.isArray(o=o&&o.positions||o)&&!ArrayBuffer.isView(o))throw Error("invalid polygon");let s=[],r=[];if("positions"in e){let{positions:i,holeIndices:o}=e;if(o){let e=0;for(let n=0;n<=o.length;n++)e=t3(s,e,i,t,o[n-1],o[n],0===n?tY:tX),r.push(e);return r.pop(),{positions:s,holeIndices:r}}e=i}if(!Array.isArray(e[0]))return t3(s,0,e,t,0,s.length,tY),s;if(!((i=e).length>=1&&i[0].length>=2&&Number.isFinite(i[0][0]))){let i=0;for(let[o,n]of e.entries())i=t1(s,i,n,t,0===o?tY:tX),r.push(i);return r.pop(),{positions:s,holeIndices:r}}return t1(s,0,e,t,tY),s}(e,this.positionSize);return this.opts.resolution?(0,t8.w)(t0(t),t2(t),{size:this.positionSize,gridResolution:this.opts.resolution,edgeTypes:!0}):this.opts.wrapLongitude?(0,t9.E)(t0(t),t2(t),{size:this.positionSize,maxLatitude:86,edgeTypes:!0}):t}return e}getGeometrySize(e){if(ie(e)){let t=0;for(let i of e)t+=this.getGeometrySize(i);return t}return t0(e).length/this.positionSize}getGeometryFromBuffer(e){return this.normalize||!this.buffers.indices?super.getGeometryFromBuffer(e):null}updateGeometryAttributes(e,t){if(e&&ie(e))for(let i of e){let e=this.getGeometrySize(i);t.geometrySize=e,this.updateGeometryAttributes(i,t),t.vertexStart+=e,t.indexStart=this.indexStarts[t.geometryIndex+1]}else this._updateIndices(e,t),this._updatePositions(e,t),this._updateVertexValid(e,t)}_updateIndices(e,{geometryIndex:t,vertexStart:i,indexStart:o}){let{attributes:s,indexStarts:r,typedArrayManager:n}=this,a=s.indices;if(!a||!e)return;let l=o,c=function(e,t,i,o){let s=t2(e);s&&(s=s.map(e=>e/t));let r=t0(e),n=o&&3===t;if(i){let e=r.length;r=r.slice();let o=[];for(let s=0;s<e;s+=t){o[0]=r[s],o[1]=r[s+1],n&&(o[2]=r[s+2]);let e=i(o);r[s]=e[0],r[s+1]=e[1],n&&(r[s+2]=e[2])}}if(n){let e=t4(r,0,1),t=t4(r,0,2),o=t4(r,1,2);if(!e&&!t&&!o)return[];e>t&&e>o||(t>o?(i||(r=r.slice()),t5(r,0,2,1)):(i||(r=r.slice()),t5(r,2,0,1)))}return tZ(r,s,t)}(e,this.positionSize,this.opts.preproject,this.opts.full3d);a=n.allocate(a,o+c.length,{copy:!0});for(let e=0;e<c.length;e++)a[l++]=c[e]+i;r[t+1]=o+c.length,s.indices=a}_updatePositions(e,{vertexStart:t,geometrySize:i}){let{attributes:{positions:o},positionSize:s}=this;if(!o||!e)return;let r=t0(e);for(let e=t,n=0;n<i;e++,n++){let t=r[n*s],i=r[n*s+1],a=s>2?r[n*s+2]:0;o[3*e]=t,o[3*e+1]=i,o[3*e+2]=a}}_updateVertexValid(e,{vertexStart:t,geometrySize:i}){let{positionSize:o}=this,s=this.attributes.vertexValid,r=e&&t2(e);if(e&&e.edgeTypes?s.set(e.edgeTypes,t):s.fill(1,t,t+i),r)for(let e=0;e<r.length;e++)s[t+r[e]/o-1]=0;s[t+i-1]=0}}function ie(e){return Array.isArray(e)&&e.length>0&&!Number.isFinite(e[0])}let it=`\
layout(std140) uniform solidPolygonUniforms {
  bool extruded;
  bool isWireframe;
  float elevationScale;
} solidPolygon;
`,ii={name:"solidPolygon",source:`\
struct SolidPolygonUniforms {
  extruded: f32,
  isWireframe: f32,
  elevationScale: f32,
};

@group(0) @binding(auto) var<uniform> solidPolygon: SolidPolygonUniforms;
`,vs:it,fs:it,uniformTypes:{extruded:"f32",isWireframe:"f32",elevationScale:"f32"}},io=`\
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
`,is=`\
#version 300 es
#define SHADER_NAME solid-polygon-layer-vertex-shader
in vec3 vertexPositions;
in vec3 vertexPositions64Low;
in float elevations;
${io}
void main(void) {
PolygonProps props;
props.positions = vertexPositions;
props.positions64Low = vertexPositions64Low;
props.elevations = elevations;
props.normal = vec3(0.0, 0.0, 1.0);
calculatePosition(props);
}
`,ir=`\
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
${io}
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
`,ia=`\
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
`;function il(){return`\
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
`}function ic(){return`\
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
`}let ih=[0,0,0,255],iu={enter:(e,t)=>t.length?t.subarray(t.length-e.length):e};class id extends d.A{getShaders(e){var t;let i=this.props._normalize||"CCW"!==this.props._windingOrder?1:0;return super.getShaders({vs:"top"===e?is:ir,fs:ia,source:(t=!!i,"top"===e?`\
${il()}

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

${ic()}
`:`\
const RING_WINDING_ORDER_CW: bool = ${t?"true":"false"};

${il()}

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

${ic()}
`),defines:{RING_WINDING_ORDER_CW:i},modules:[p.A,g.A,tH.J,m.Ay,ii,..."webgpu"===this.context.device.type?[tp.A]:[]]})}get wrapLongitude(){return!1}getBounds(){return this.getAttributeManager()?.getBounds(["vertexPositions"])}initializeState(){let e,{viewport:t}=this.context,{coordinateSystem:i}=this.props,{_full3d:o}=this.props;t.isGeospatial&&"default"===i&&(i="lnglat"),"lnglat"===i&&(e=o?t.projectPosition.bind(t):t.projectFlat.bind(t)),this.setState({numInstances:0,polygonTesselator:new t7({preproject:e,fp64:this.use64bitPositions(),IndexType:Uint32Array})});let s=this.getAttributeManager(),r="webgpu"===this.context.device.type;s.add({indices:{size:1,isIndexed:!0,update:this.calculateIndices,noAlloc:!0},vertexPositions:{size:3,type:"float64",stepMode:"dynamic",fp64:this.use64bitPositions(),transition:iu,accessor:"getPolygon",update:this.calculatePositions,noAlloc:!0,...r?{}:{shaderAttributes:{nextVertexPositions:{vertexOffset:1}}}},...r?{nextVertexPositions:{size:3,type:"float64",stepMode:"dynamic",fp64:this.use64bitPositions(),transition:!1,update:this.calculateNextPositions,noAlloc:!0}}:{},[r?"vertexValid":"instanceVertexValid"]:{size:1,type:r?"float32":"uint16",stepMode:"instance",update:this.calculateVertexValid,noAlloc:!0},elevations:{size:1,stepMode:"dynamic",transition:iu,accessor:"getElevation",bufferGroup:"solid-polygon-instance-data"},fillColors:{size:this.props.colorFormat.length,type:"unorm8",stepMode:"dynamic",transition:iu,accessor:"getFillColor",defaultValue:ih,bufferGroup:"solid-polygon-instance-data"},lineColors:{size:this.props.colorFormat.length,type:"unorm8",stepMode:"dynamic",transition:iu,accessor:"getLineColor",defaultValue:ih,bufferGroup:"solid-polygon-instance-data"},rowIndexes:{size:1,type:"uint32",stepMode:"dynamic",accessor:(e,{index:t})=>e&&e.__source?e.__source.index:t,bufferGroup:"solid-polygon-instance-data"}})}getPickingInfo(e){let t=super.getPickingInfo(e),{index:i}=t,o=this.props.data;return o[0]&&o[0].__source&&(t.object=o.find(e=>e.__source.index===i)),t}disablePickingIndex(e){let t=this.props.data;if(t[0]&&t[0].__source)for(let i=0;i<t.length;i++)t[i].__source.index===e&&this._disablePickingIndex(i);else super.disablePickingIndex(e)}draw({uniforms:e}){let{extruded:t,filled:i,wireframe:o,elevationScale:s}=this.props,{topModel:r,sideModel:n,wireframeModel:a,polygonTesselator:l}=this.state,c={extruded:!!t,elevationScale:s,isWireframe:!1};a&&o&&(a.setInstanceCount(l.instanceCount-1),a.shaderInputs.setProps({solidPolygon:{...c,isWireframe:!0}}),a.draw(this.context.renderPass)),n&&i&&(n.setInstanceCount(l.instanceCount-1),n.shaderInputs.setProps({solidPolygon:c}),n.draw(this.context.renderPass)),r&&i&&(r.setVertexCount(l.vertexCount),r.shaderInputs.setProps({solidPolygon:c}),r.draw(this.context.renderPass))}updateState(e){super.updateState(e),this.updateGeometry(e);let{props:t,oldProps:i,changeFlags:o}=e,s=this.getAttributeManager();(o.extensionsChanged||t.filled!==i.filled||t.extruded!==i.extruded)&&(this.state.models?.forEach(e=>e.destroy()),this.setState(this._getModels()),s.invalidateAll())}updateGeometry({props:e,oldProps:t,changeFlags:i}){if(i.dataChanged||i.updateTriggersChanged&&(i.updateTriggersChanged.all||i.updateTriggersChanged.getPolygon)){let{polygonTesselator:t}=this.state,o=e.data.attributes||{};t.updateGeometry({data:e.data,normalize:e._normalize,geometryBuffer:o.getPolygon,buffers:"webgpu"===this.context.device.type?{...o}:o,getGeometry:e.getPolygon,positionFormat:e.positionFormat,wrapLongitude:e.wrapLongitude,resolution:this.context.viewport.resolution,fp64:this.use64bitPositions(),dataChanged:i.dataChanged,full3d:e._full3d}),this.setState({numInstances:t.instanceCount,startIndices:t.vertexStarts}),i.dataChanged||this.getAttributeManager().invalidateAll()}}_getModels(){let e,t,i,{id:o,filled:s,extruded:r}=this.props;if(s){let t=this.getShaders("top");t.defines={...t.defines,NON_INSTANCED_MODEL:1};let i=this.getAttributeManager().getBufferLayouts({isInstanced:!1});"webgpu"===this.context.device.type&&(i=i.filter(e=>"indices"!==e.name&&"vertexValid"!==e.name&&"instanceVertexValid"!==e.name&&"nextVertexPositions"!==e.name)),e=new x.K(this.context.device,{...t,id:`${o}-top`,topology:"triangle-list",bufferLayout:i,isIndexed:!0,userData:{excludeAttributes:{vertexValid:!0,instanceVertexValid:!0,nextVertexPositions:!0}}})}if(r){let e=this.getAttributeManager().getBufferLayouts({isInstanced:!0});"webgpu"===this.context.device.type&&(e=e.filter(e=>"indices"!==e.name)),t=new x.K(this.context.device,{...this.getShaders("side"),id:`${o}-side`,bufferLayout:e,geometry:new _.V({topology:"triangle-strip",attributes:{positions:{size:2,value:new Float32Array([1,0,0,0,1,1,0,1])}}}),isInstanced:!0,userData:{excludeAttributes:{indices:!0}}}),i=new x.K(this.context.device,{...this.getShaders("side"),id:`${o}-wireframe`,bufferLayout:e,geometry:new _.V({topology:"line-strip",attributes:{positions:{size:2,value:new Float32Array([1,0,0,0,0,1,1,1])}}}),isInstanced:!0,userData:{excludeAttributes:{indices:!0}}})}return{models:[t,i,e].filter(Boolean),topModel:e,sideModel:t,wireframeModel:i}}calculateIndices(e){let{polygonTesselator:t}=this.state;e.startIndices=t.indexStarts,e.value=t.get("indices")}calculatePositions(e){let{polygonTesselator:t}=this.state;e.startIndices=t.vertexStarts;let i=this.props.data.attributes?.getPolygon;if("webgpu"===this.context.device.type&&ArrayBuffer.isView(i?.value)){let{value:o,size:s=3,offset:r=0,stride:n}=i,a=r/o.BYTES_PER_ELEMENT,l=n?n/o.BYTES_PER_ELEMENT:s,c=new Float64Array(3*t.instanceCount);for(let e=0;e<t.instanceCount;e++){let t=a+e*l,i=3*e;c[i]=o[t],c[i+1]=o[t+1],c[i+2]=s>2?o[t+2]:0}e.value=c;return}e.value=t.get("positions")}calculateVertexValid(e){let t=this.props.data.attributes?.instanceVertexValid?.value,i="webgpu"===this.context.device.type&&t?t:this.state.polygonTesselator.get("vertexValid");e.value="webgpu"===this.context.device.type&&i?Float32Array.from(i):i}calculateNextPositions(e){let{polygonTesselator:t}=this.state,i=this.getAttributeManager().getAttributes(),o=i.vertexPositions.value,s=this.props.data.attributes?.instanceVertexValid?.value||i.vertexValid?.value||t.get("vertexValid");if(e.startIndices=t.vertexStarts,!o){e.value=o;return}let r=o.length/3,n=new o.constructor(o.length);for(let e=0;e<r;e++){let t=3*e,i=s?.[e]&&e+1<r?t+3:t;for(let e=0;e<3;e++)n[t+e]=o[i+e]}e.value=n}}id.defaultProps={filled:!0,extruded:!1,wireframe:!1,_normalize:!0,_windingOrder:"CW",_full3d:!1,elevationScale:{type:"number",min:0,value:1},getPolygon:{type:"accessor",value:e=>e.polygon},getElevation:{type:"accessor",value:1e3},getFillColor:{type:"accessor",value:ih},getLineColor:{type:"accessor",value:ih},material:!0},id.layerName="SolidPolygonLayer";let ip={circle:{type:ty,props:{filled:"filled",stroked:"stroked",lineWidthMaxPixels:"lineWidthMaxPixels",lineWidthMinPixels:"lineWidthMinPixels",lineWidthScale:"lineWidthScale",lineWidthUnits:"lineWidthUnits",pointRadiusMaxPixels:"radiusMaxPixels",pointRadiusMinPixels:"radiusMinPixels",pointRadiusScale:"radiusScale",pointRadiusUnits:"radiusUnits",pointAntialiasing:"antialiasing",pointBillboard:"billboard",getFillColor:"getFillColor",getLineColor:"getLineColor",getLineWidth:"getLineWidth",getPointRadius:"getRadius"}},icon:{type:tl,props:{iconAtlas:"iconAtlas",iconMapping:"iconMapping",iconSizeMaxPixels:"sizeMaxPixels",iconSizeMinPixels:"sizeMinPixels",iconSizeScale:"sizeScale",iconSizeUnits:"sizeUnits",iconAlphaCutoff:"alphaCutoff",iconBillboard:"billboard",getIcon:"getIcon",getIconAngle:"getAngle",getIconColor:"getColor",getIconPixelOffset:"getPixelOffset",getIconSize:"getSize"}},text:{type:t$,props:{textSizeMaxPixels:"sizeMaxPixels",textSizeMinPixels:"sizeMinPixels",textSizeScale:"sizeScale",textSizeUnits:"sizeUnits",textBackground:"background",textBackgroundPadding:"backgroundPadding",textFontFamily:"fontFamily",textFontWeight:"fontWeight",textLineHeight:"lineHeight",textMaxWidth:"maxWidth",textOutlineColor:"outlineColor",textOutlineWidth:"outlineWidth",textWordBreak:"wordBreak",textCharacterSet:"characterSet",textBillboard:"billboard",textFontSettings:"fontSettings",getText:"getText",getTextAngle:"getAngle",getTextColor:"getColor",getTextPixelOffset:"getPixelOffset",getTextSize:"getSize",getTextAnchor:"getTextAnchor",getTextAlignmentBaseline:"getAlignmentBaseline",getTextBackgroundColor:"getBackgroundColor",getTextBorderColor:"getBorderColor",getTextBorderWidth:"getBorderWidth"}}},ig={type:tK.A,props:{lineWidthUnits:"widthUnits",lineWidthScale:"widthScale",lineWidthMinPixels:"widthMinPixels",lineWidthMaxPixels:"widthMaxPixels",lineJointRounded:"jointRounded",lineCapRounded:"capRounded",lineMiterLimit:"miterLimit",lineBillboard:"billboard",lineAntialiasing:"antialiasing",getLineColor:"getColor",getLineWidth:"getWidth"}},im={type:id,props:{extruded:"extruded",filled:"filled",wireframe:"wireframe",elevationScale:"elevationScale",material:"material",_full3d:"_full3d",getElevation:"getElevation",getFillColor:"getFillColor",getLineColor:"getLineColor"}};function iy({type:e,props:t}){let i={};for(let o in t)i[o]=e.defaultProps[t[o]];return i}function iv(e,t){let{transitions:i,updateTriggers:o}=e.props,s={updateTriggers:{},transitions:i&&{getPosition:i.geometry}};for(let r in t){let n=t[r],a=e.props[r];r.startsWith("get")&&(a=e.getSubLayerAccessor(a),s.updateTriggers[n]=o[r],i&&(s.transitions[n]=i[r])),s[n]=a}return s}function ix(e,t,i={}){let o={pointFeatures:[],lineFeatures:[],polygonFeatures:[],polygonOutlineFeatures:[]},{startRow:s=0,endRow:r=e.length}=i;for(let i=s;i<r;i++){let s=e[i],{geometry:r}=s;if(r)if("GeometryCollection"===r.type){v.A.assert(Array.isArray(r.geometries),"GeoJSON does not have geometries array");let{geometries:e}=r;for(let r=0;r<e.length;r++)i_(e[r],o,t,s,i)}else i_(r,o,t,s,i)}return o}function i_(e,t,i,o,s){let{type:r,coordinates:n}=e,{pointFeatures:a,lineFeatures:l,polygonFeatures:c,polygonOutlineFeatures:h}=t;if(!function(e,t){let i=ib[e];for(v.A.assert(i,`Unknown GeoJSON type ${e}`);t&&--i>0;)t=t[0];return t&&Number.isFinite(t[0])}(r,n))return void v.A.warn(`${r} coordinates are malformed`)();switch(r){case"Point":a.push(i({geometry:e},o,s));break;case"MultiPoint":n.forEach(e=>{a.push(i({geometry:{type:"Point",coordinates:e}},o,s))});break;case"LineString":l.push(i({geometry:e},o,s));break;case"MultiLineString":n.forEach(e=>{l.push(i({geometry:{type:"LineString",coordinates:e}},o,s))});break;case"Polygon":c.push(i({geometry:e},o,s)),n.forEach(e=>{h.push(i({geometry:{type:"LineString",coordinates:e}},o,s))});break;case"MultiPolygon":n.forEach(e=>{c.push(i({geometry:{type:"Polygon",coordinates:e}},o,s)),e.forEach(e=>{h.push(i({geometry:{type:"LineString",coordinates:e}},o,s))})})}}let ib={Point:1,MultiPoint:2,LineString:2,MultiLineString:3,Polygon:3,MultiPolygon:4};function iP(){return{points:{},lines:{},polygons:{},polygonsOutline:{}}}function iC(e){return e.geometry.coordinates}let iw=["points","linestrings","polygons"],iS={...iy(ip.circle),...iy(ip.icon),...iy(ip.text),...iy(ig),...iy(im),stroked:!0,filled:!0,extruded:!1,wireframe:!1,_full3d:!1,iconAtlas:{type:"object",value:null},iconMapping:{type:"object",value:{}},getIcon:{type:"accessor",value:e=>e.properties.icon},getText:{type:"accessor",value:e=>e.properties.text},pointType:"circle",getRadius:{deprecatedFor:"getPointRadius"}};class iL extends u.A{initializeState(){this.state={layerProps:{},features:{},featuresDiff:{}}}updateState({props:e,changeFlags:t}){if(!t.dataChanged)return;let{data:i}=this.props,o=i&&"points"in i&&"polygons"in i&&"lines"in i;this.setState({binary:o}),o?this._updateStateBinary({props:e,changeFlags:t}):this._updateStateJSON({props:e,changeFlags:t})}_updateStateBinary({props:e,changeFlags:t}){let i=function(e){let t=iP(),{points:i,lines:o,polygons:s}=e,r=function(e){let t={points:null,lines:null,polygons:null};for(let i in t){let o=e[i].globalFeatureIds.value;t[i]=new Uint32Array(o)}return t}(e);t.points.data={length:i.positions.value.length/i.positions.size,attributes:{...i.attributes,getPosition:i.positions,rowIndexes:{size:1,type:"uint32",value:r.points}},properties:i.properties,numericProps:i.numericProps,featureIds:i.featureIds},t.lines.data={length:o.pathIndices.value.length-1,startIndices:o.pathIndices.value,attributes:{...o.attributes,getPath:o.positions,rowIndexes:{size:1,type:"uint32",value:r.lines}},properties:o.properties,numericProps:o.numericProps,featureIds:o.featureIds},t.lines._pathType="open";let n=Array(s.positions.value.length/s.positions.size).fill(1);for(let e of s.primitivePolygonIndices.value)n[e-1]=0;return t.polygons.data={length:s.polygonIndices.value.length-1,startIndices:s.polygonIndices.value,attributes:{...s.attributes,getPolygon:s.positions,instanceVertexValid:{size:1,value:new Uint16Array(n)},rowIndexes:{size:1,type:"uint32",value:r.polygons}},properties:s.properties,numericProps:s.numericProps,featureIds:s.featureIds},t.polygons._normalize=!1,s.triangles&&(t.polygons.data.attributes.indices=s.triangles.value),t.polygonsOutline.data={length:s.primitivePolygonIndices.value.length-1,startIndices:s.primitivePolygonIndices.value,attributes:{...s.attributes,getPath:s.positions,rowIndexes:{size:1,type:"uint32",value:r.polygons}},properties:s.properties,numericProps:s.numericProps,featureIds:s.featureIds},t.polygonsOutline._pathType="open",t}(e.data);this.setState({layerProps:i})}_updateStateJSON({props:e,changeFlags:t}){let i=function(e){if(Array.isArray(e))return e;switch(v.A.assert(e.type,"GeoJSON does not have type"),e.type){case"Feature":return[e];case"FeatureCollection":return v.A.assert(Array.isArray(e.features),"GeoJSON does not have features array"),e.features;default:return[{geometry:e}]}}(e.data),o=this.getSubLayerRow.bind(this),s={},r={};if(Array.isArray(t.dataChanged)){let e=this.state.features;for(let t in e)s[t]=e[t].slice(),r[t]=[];for(let n of t.dataChanged){let t=ix(i,o,n);for(let i in e)r[i].push(function({data:e,getIndex:t,dataRange:i,replace:o}){let{startRow:s=0,endRow:r=1/0}=i,n=e.length,a=n,l=n;for(let i=0;i<n;i++){let o=t(e[i]);if(a>i&&o>=s&&(a=i),o>=r){l=i;break}}let c=a,h=l-a!==o.length?e.slice(l):void 0;for(let t=0;t<o.length;t++)e[c++]=o[t];if(h){for(let t=0;t<h.length;t++)e[c++]=h[t];e.length=c}return{startRow:a,endRow:a+o.length}}({data:s[i],getIndex:e=>e.__source.index,dataRange:n,replace:t[i]}))}}else s=ix(i,o);let n=function(e,t){let i=iP(),{pointFeatures:o,lineFeatures:s,polygonFeatures:r,polygonOutlineFeatures:n}=e;return i.points.data=o,i.points._dataDiff=t.pointFeatures&&(()=>t.pointFeatures),i.points.getPosition=iC,i.lines.data=s,i.lines._dataDiff=t.lineFeatures&&(()=>t.lineFeatures),i.lines.getPath=iC,i.polygons.data=r,i.polygons._dataDiff=t.polygonFeatures&&(()=>t.polygonFeatures),i.polygons.getPolygon=iC,i.polygonsOutline.data=n,i.polygonsOutline._dataDiff=t.polygonOutlineFeatures&&(()=>t.polygonOutlineFeatures),i.polygonsOutline.getPath=iC,i}(s,r);this.setState({features:s,featuresDiff:r,layerProps:n})}getPickingInfo(e){let t=super.getPickingInfo(e),{index:i,sourceLayer:o}=t;return t.featureType=iw.find(e=>o.id.startsWith(`${this.id}-${e}-`)),i>=0&&o.id.startsWith(`${this.id}-points-text`)&&this.state.binary&&(t.index=this.props.data.points.globalFeatureIds.value[i]),t}_updateAutoHighlight(e){let t=`${this.id}-points-`,i="points"===e.featureType;for(let o of this.getSubLayers())o.id.startsWith(t)===i&&o.updateAutoHighlight(e)}_renderPolygonLayer(){let{extruded:e,wireframe:t}=this.props,{layerProps:i}=this.state,o="polygons-fill",s=this.shouldRenderSubLayer(o,i.polygons?.data)&&this.getSubLayerClass(o,im.type);if(s){let r=iv(this,im.props),n=e&&t;return n||delete r.getLineColor,r.updateTriggers.lineColors=n,new s(r,this.getSubLayerProps({id:o,updateTriggers:r.updateTriggers}),i.polygons)}return null}_renderLineLayers(){let{extruded:e,stroked:t}=this.props,{layerProps:i}=this.state,o="polygons-stroke",s="linestrings",r=!e&&t&&this.shouldRenderSubLayer(o,i.polygonsOutline?.data)&&this.getSubLayerClass(o,ig.type),n=this.shouldRenderSubLayer(s,i.lines?.data)&&this.getSubLayerClass(s,ig.type);if(r||n){let e=iv(this,ig.props);return[r&&new r(e,this.getSubLayerProps({id:o,updateTriggers:e.updateTriggers}),i.polygonsOutline),n&&new n(e,this.getSubLayerProps({id:s,updateTriggers:e.updateTriggers}),i.lines)]}return null}_renderPointLayers(){let{pointType:e}=this.props,{layerProps:t,binary:i}=this.state,{highlightedObjectIndex:o}=this.props;!i&&Number.isFinite(o)&&(o=t.points.data.findIndex(e=>e.__source.index===o));let s=new Set(e.split("+")),r=[];for(let e of s){let s=`points-${e}`,n=ip[e],a=n&&this.shouldRenderSubLayer(s,t.points?.data)&&this.getSubLayerClass(s,n.type);if(a){let l=iv(this,n.props),c=t.points;if("text"===e&&i){let{rowIndexes:e,...t}=c.data.attributes;c={...c,data:{...c.data,attributes:t}}}r.push(new a(l,this.getSubLayerProps({id:s,updateTriggers:l.updateTriggers,highlightedObjectIndex:o}),c))}}return r}renderLayers(){let{extruded:e}=this.props,t=this._renderPolygonLayer();return[!e&&t,this._renderLineLayers(),this._renderPointLayers(),e&&t]}getSubLayerAccessor(e){let{binary:t}=this.state;return t&&"function"==typeof e?(t,i)=>{let{data:o,index:s}=i;return e(function(e,t){if(!e)return null;let i="startIndices"in e?e.startIndices[t]:t,o=e.featureIds.value[i];return -1!==i?function(e,t,i){let o={properties:{...e.properties[t]}};for(let t in e.numericProps)o.properties[t]=e.numericProps[t].value[i];return o}(e,o,i):null}(o,s),i)}:super.getSubLayerAccessor(e)}}iL.layerName="GeoJsonLayer",iL.defaultProps=iS;var iA=i(15084);class iE extends Array{clone(){return new this.constructor().copy(this)}fromArray(e,t=0){for(let i=0;i<this.ELEMENTS;++i)this[i]=e[i+t];return this.check()}toArray(e=[],t=0){for(let i=0;i<this.ELEMENTS;++i)e[t+i]=this[i];return e}toObject(e){return e}from(e){return Array.isArray(e)?this.copy(e):this.fromObject(e)}to(e){return e===this?this:(0,iA.cy)(e)?this.toArray(e):this.toObject(e)}toTarget(e){return e?this.to(e):this}toFloat32Array(){return new Float32Array(this)}toString(){return this.formatString(iA.$W)}formatString(e){let t="";for(let i=0;i<this.ELEMENTS;++i)t+=(i>0?", ":"")+(0,iA.Fl)(this[i],e);return`${e.printTypes?this.constructor.name:""}[${t}]`}equals(e){if(!e||this.length!==e.length)return!1;for(let t=0;t<this.ELEMENTS;++t)if(!(0,iA.aI)(this[t],e[t]))return!1;return!0}exactEquals(e){if(!e||this.length!==e.length)return!1;for(let t=0;t<this.ELEMENTS;++t)if(this[t]!==e[t])return!1;return!0}negate(){for(let e=0;e<this.ELEMENTS;++e)this[e]=-this[e];return this.check()}lerp(e,t,i){if(void 0===i)return this.lerp(this,e,t);for(let o=0;o<this.ELEMENTS;++o){let s=e[o],r="number"==typeof t?t:t[o];this[o]=s+i*(r-s)}return this.check()}min(e){for(let t=0;t<this.ELEMENTS;++t)this[t]=Math.min(e[t],this[t]);return this.check()}max(e){for(let t=0;t<this.ELEMENTS;++t)this[t]=Math.max(e[t],this[t]);return this.check()}clamp(e,t){for(let i=0;i<this.ELEMENTS;++i)this[i]=Math.min(Math.max(this[i],e[i]),t[i]);return this.check()}add(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]+=t[e];return this.check()}subtract(...e){for(let t of e)for(let e=0;e<this.ELEMENTS;++e)this[e]-=t[e];return this.check()}scale(e){if("number"==typeof e)for(let t=0;t<this.ELEMENTS;++t)this[t]*=e;else for(let t=0;t<this.ELEMENTS&&t<e.length;++t)this[t]*=e[t];return this.check()}multiplyByScalar(e){for(let t=0;t<this.ELEMENTS;++t)this[t]*=e;return this.check()}check(){if(iA.$W.debug&&!this.validate())throw Error(`math.gl: ${this.constructor.name} some fields set to invalid numbers'`);return this}validate(){let e=this.length===this.ELEMENTS;for(let t=0;t<this.ELEMENTS;++t)e=e&&Number.isFinite(this[t]);return e}sub(e){return this.subtract(e)}setScalar(e){for(let t=0;t<this.ELEMENTS;++t)this[t]=e;return this.check()}addScalar(e){for(let t=0;t<this.ELEMENTS;++t)this[t]+=e;return this.check()}subScalar(e){return this.addScalar(-e)}multiplyScalar(e){for(let t=0;t<this.ELEMENTS;++t)this[t]*=e;return this.check()}divideScalar(e){return this.multiplyByScalar(1/e)}clampScalar(e,t){for(let i=0;i<this.ELEMENTS;++i)this[i]=Math.min(Math.max(this[i],e),t);return this.check()}get elements(){return this}}function iT(e,t,i=""){if(iA.$W.debug&&!function(e,t){if(e.length!==t)return!1;for(let t=0;t<e.length;++t)if(!Number.isFinite(e[t]))return!1;return!0}(e,t))throw Error(`math.gl: ${i} some fields set to invalid numbers'`);return e}class iM extends iE{toString(){let e="[";if(iA.$W.printRowMajor){e+="row-major:";for(let t=0;t<this.RANK;++t)for(let i=0;i<this.RANK;++i)e+=` ${this[i*this.RANK+t]}`}else{e+="column-major:";for(let t=0;t<this.ELEMENTS;++t)e+=` ${this[t]}`}return e+"]"}getElementIndex(e,t){return t*this.RANK+e}getElement(e,t){return this[t*this.RANK+e]}setElement(e,t,i){return this[t*this.RANK+e]=function(e){if(!Number.isFinite(e))throw Error(`Invalid number ${JSON.stringify(e)}`);return e}(i),this}getColumn(e,t=Array(this.RANK).fill(-0)){let i=e*this.RANK;for(let e=0;e<this.RANK;++e)t[e]=this[i+e];return t}setColumn(e,t){let i=e*this.RANK;for(let e=0;e<this.RANK;++e)this[i+e]=t[e];return this}}let iO="u">typeof Float32Array?Float32Array:Array;function iR(e,t,i){let o=t[0],s=t[1],r=t[2],n=t[3],a=t[4],l=t[5],c=t[6],h=t[7],u=t[8],f=t[9],d=t[10],p=t[11],g=t[12],m=t[13],y=t[14],v=t[15],x=i[0],_=i[1],b=i[2],P=i[3];return e[0]=x*o+_*a+b*u+P*g,e[1]=x*s+_*l+b*f+P*m,e[2]=x*r+_*c+b*d+P*y,e[3]=x*n+_*h+b*p+P*v,x=i[4],_=i[5],b=i[6],P=i[7],e[4]=x*o+_*a+b*u+P*g,e[5]=x*s+_*l+b*f+P*m,e[6]=x*r+_*c+b*d+P*y,e[7]=x*n+_*h+b*p+P*v,x=i[8],_=i[9],b=i[10],P=i[11],e[8]=x*o+_*a+b*u+P*g,e[9]=x*s+_*l+b*f+P*m,e[10]=x*r+_*c+b*d+P*y,e[11]=x*n+_*h+b*p+P*v,x=i[12],_=i[13],b=i[14],P=i[15],e[12]=x*o+_*a+b*u+P*g,e[13]=x*s+_*l+b*f+P*m,e[14]=x*r+_*c+b*d+P*y,e[15]=x*n+_*h+b*p+P*v,e}let iI=function(e,t,i,o,s){let r=1/Math.tan(t/2);if(e[0]=r/i,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=r,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[11]=-1,e[12]=0,e[13]=0,e[15]=0,null!=s&&s!==1/0){let t=1/(o-s);e[10]=(s+o)*t,e[14]=2*s*o*t}else e[10]=-1,e[14]=-2*o;return e},iz=function(e,t,i,o,s,r,n){let a=1/(t-i),l=1/(o-s),c=1/(r-n);return e[0]=-2*a,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=-2*l,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=2*c,e[11]=0,e[12]=(t+i)*a,e[13]=(s+o)*l,e[14]=(n+r)*c,e[15]=1,e};n=new iO(2),iO!=Float32Array&&(n[0]=0,n[1]=0),a=new iO(3),iO!=Float32Array&&(a[0]=0,a[1]=0,a[2]=0),l=new iO(4),iO!=Float32Array&&(l[0]=0,l[1]=0,l[2]=0,l[3]=0),(c=h||(h={}))[c.COL0ROW0=0]="COL0ROW0",c[c.COL0ROW1=1]="COL0ROW1",c[c.COL0ROW2=2]="COL0ROW2",c[c.COL0ROW3=3]="COL0ROW3",c[c.COL1ROW0=4]="COL1ROW0",c[c.COL1ROW1=5]="COL1ROW1",c[c.COL1ROW2=6]="COL1ROW2",c[c.COL1ROW3=7]="COL1ROW3",c[c.COL2ROW0=8]="COL2ROW0",c[c.COL2ROW1=9]="COL2ROW1",c[c.COL2ROW2=10]="COL2ROW2",c[c.COL2ROW3=11]="COL2ROW3",c[c.COL3ROW0=12]="COL3ROW0",c[c.COL3ROW1=13]="COL3ROW1",c[c.COL3ROW2=14]="COL3ROW2",c[c.COL3ROW3=15]="COL3ROW3";let ik=45*Math.PI/180,iN=Object.freeze([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);class iB extends iM{static get IDENTITY(){return s||Object.freeze(s=new iB),s}static get ZERO(){return o||Object.freeze(o=new iB([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])),o}get ELEMENTS(){return 16}get RANK(){return 4}get INDICES(){return h}constructor(e){super(-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0),1==arguments.length&&Array.isArray(e)?this.copy(e):this.identity()}copy(e){return this[0]=e[0],this[1]=e[1],this[2]=e[2],this[3]=e[3],this[4]=e[4],this[5]=e[5],this[6]=e[6],this[7]=e[7],this[8]=e[8],this[9]=e[9],this[10]=e[10],this[11]=e[11],this[12]=e[12],this[13]=e[13],this[14]=e[14],this[15]=e[15],this.check()}set(e,t,i,o,s,r,n,a,l,c,h,u,f,d,p,g){return this[0]=e,this[1]=t,this[2]=i,this[3]=o,this[4]=s,this[5]=r,this[6]=n,this[7]=a,this[8]=l,this[9]=c,this[10]=h,this[11]=u,this[12]=f,this[13]=d,this[14]=p,this[15]=g,this.check()}setRowMajor(e,t,i,o,s,r,n,a,l,c,h,u,f,d,p,g){return this[0]=e,this[1]=s,this[2]=l,this[3]=f,this[4]=t,this[5]=r,this[6]=c,this[7]=d,this[8]=i,this[9]=n,this[10]=h,this[11]=p,this[12]=o,this[13]=a,this[14]=u,this[15]=g,this.check()}toRowMajor(e){return e[0]=this[0],e[1]=this[4],e[2]=this[8],e[3]=this[12],e[4]=this[1],e[5]=this[5],e[6]=this[9],e[7]=this[13],e[8]=this[2],e[9]=this[6],e[10]=this[10],e[11]=this[14],e[12]=this[3],e[13]=this[7],e[14]=this[11],e[15]=this[15],e}identity(){return this.copy(iN)}fromObject(e){return this.check()}fromQuaternion(e){let t,i,o,s,r,n,a,l,c,h,u,f,d,p,g,m;return t=e[0],i=e[1],o=e[2],s=e[3],r=t+t,n=i+i,a=o+o,l=t*r,c=i*r,h=i*n,u=o*r,f=o*n,d=o*a,p=s*r,g=s*n,m=s*a,this[0]=1-h-d,this[1]=c+m,this[2]=u-g,this[3]=0,this[4]=c-m,this[5]=1-l-d,this[6]=f+p,this[7]=0,this[8]=u+g,this[9]=f-p,this[10]=1-l-h,this[11]=0,this[12]=0,this[13]=0,this[14]=0,this[15]=1,this.check()}frustum(e){let{left:t,right:i,bottom:o,top:s,near:r=.1,far:n=500}=e;if(n===1/0){var a,l,c,h,u,f;a=this,l=t,c=i,h=o,u=s,f=r,a[0]=2*f/(c-l),a[1]=0,a[2]=0,a[3]=0,a[4]=0,a[5]=2*f/(u-h),a[6]=0,a[7]=0,a[8]=(c+l)/(c-l),a[9]=(u+h)/(u-h),a[10]=-1,a[11]=-1,a[12]=0,a[13]=0,a[14]=-2*f,a[15]=0}else{let e,a,l;e=1/(i-t),a=1/(s-o),l=1/(r-n),this[0]=2*r*e,this[1]=0,this[2]=0,this[3]=0,this[4]=0,this[5]=2*r*a,this[6]=0,this[7]=0,this[8]=(i+t)*e,this[9]=(s+o)*a,this[10]=(n+r)*l,this[11]=-1,this[12]=0,this[13]=0,this[14]=n*r*2*l,this[15]=0}return this.check()}lookAt(e){let{eye:t,center:i=[0,0,0],up:o=[0,1,0]}=e;return!function(e,t,i,o){let s,r,n,a,l,c,h,u,f,d,p=t[0],g=t[1],m=t[2],y=o[0],v=o[1],x=o[2],_=i[0],b=i[1],P=i[2];if(1e-6>Math.abs(p-_)&&1e-6>Math.abs(g-b)&&1e-6>Math.abs(m-P))return e[0]=1,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=1,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=1,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1;s=1/Math.sqrt((u=p-_)*u+(f=g-b)*f+(d=m-P)*d),u*=s,f*=s,d*=s,(s=Math.sqrt((r=v*d-x*f)*r+(n=x*u-y*d)*n+(a=y*f-v*u)*a))?(r*=s=1/s,n*=s,a*=s):(r=0,n=0,a=0),(s=Math.sqrt((l=f*a-d*n)*l+(c=d*r-u*a)*c+(h=u*n-f*r)*h))?(l*=s=1/s,c*=s,h*=s):(l=0,c=0,h=0),e[0]=r,e[1]=l,e[2]=u,e[3]=0,e[4]=n,e[5]=c,e[6]=f,e[7]=0,e[8]=a,e[9]=h,e[10]=d,e[11]=0,e[12]=-(r*p+n*g+a*m),e[13]=-(l*p+c*g+h*m),e[14]=-(u*p+f*g+d*m),e[15]=1}(this,t,i,o),this.check()}ortho(e){let{left:t,right:i,bottom:o,top:s,near:r=.1,far:n=500}=e;return iz(this,t,i,o,s,r,n),this.check()}orthographic(e){let{fovy:t=ik,aspect:i=1,focalDistance:o=1,near:s=.1,far:r=500}=e;iF(t);let n=o*Math.tan(t/2),a=n*i;return this.ortho({left:-a,right:a,bottom:-n,top:n,near:s,far:r})}perspective(e){let{fovy:t=45*Math.PI/180,aspect:i=1,near:o=.1,far:s=500}=e;return iF(t),iI(this,t,i,o,s),this.check()}determinant(){let e,t,i,o,s,r,n,a,l,c,h,u,f,d,p,g,m,y,v,x,_,b;return e=this[0],t=this[1],i=this[2],o=this[3],s=this[4],r=this[5],n=this[6],a=this[7],l=this[8],c=this[9],h=this[10],u=this[11],f=this[12],d=this[13],p=this[14],g=this[15],m=e*r-t*s,y=e*n-i*s,v=t*n-i*r,x=l*d-c*f,_=l*p-h*f,a*(e*(b=c*p-h*d)-t*_+i*x)-o*(s*b-r*_+n*x)+g*(l*v-c*y+h*m)-u*(f*v-d*y+p*m)}getScale(e=[-0,-0,-0]){return e[0]=Math.sqrt(this[0]*this[0]+this[1]*this[1]+this[2]*this[2]),e[1]=Math.sqrt(this[4]*this[4]+this[5]*this[5]+this[6]*this[6]),e[2]=Math.sqrt(this[8]*this[8]+this[9]*this[9]+this[10]*this[10]),e}getTranslation(e=[-0,-0,-0]){return e[0]=this[12],e[1]=this[13],e[2]=this[14],e}getRotation(e,t){e=e||[-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0,-0],t=t||[-0,-0,-0];let i=this.getScale(t),o=1/i[0],s=1/i[1],r=1/i[2];return e[0]=this[0]*o,e[1]=this[1]*s,e[2]=this[2]*r,e[3]=0,e[4]=this[4]*o,e[5]=this[5]*s,e[6]=this[6]*r,e[7]=0,e[8]=this[8]*o,e[9]=this[9]*s,e[10]=this[10]*r,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}getRotationMatrix3(e,t){e=e||[-0,-0,-0,-0,-0,-0,-0,-0,-0],t=t||[-0,-0,-0];let i=this.getScale(t),o=1/i[0],s=1/i[1],r=1/i[2];return e[0]=this[0]*o,e[1]=this[1]*s,e[2]=this[2]*r,e[3]=this[4]*o,e[4]=this[5]*s,e[5]=this[6]*r,e[6]=this[8]*o,e[7]=this[9]*s,e[8]=this[10]*r,e}transpose(){return!function(e,t){if(e===t){let i=t[1],o=t[2],s=t[3],r=t[6],n=t[7],a=t[11];e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=i,e[6]=t[9],e[7]=t[13],e[8]=o,e[9]=r,e[11]=t[14],e[12]=s,e[13]=n,e[14]=a}else e[0]=t[0],e[1]=t[4],e[2]=t[8],e[3]=t[12],e[4]=t[1],e[5]=t[5],e[6]=t[9],e[7]=t[13],e[8]=t[2],e[9]=t[6],e[10]=t[10],e[11]=t[14],e[12]=t[3],e[13]=t[7],e[14]=t[11],e[15]=t[15]}(this,this),this.check()}invert(){let e,t,i,o,s,r,n,a,l,c,h,u,f,d,p,g,m,y,v,x,_,b,P,C,w,S,L,A,E;return e=this[0],t=this[1],i=this[2],o=this[3],s=this[4],r=this[5],n=this[6],a=this[7],l=this[8],c=this[9],h=this[10],u=this[11],f=this[12],d=this[13],p=this[14],g=this[15],m=e*r-t*s,y=e*n-i*s,v=e*a-o*s,x=t*n-i*r,_=t*a-o*r,b=i*a-o*n,P=l*d-c*f,C=l*p-h*f,w=l*g-u*f,S=c*p-h*d,L=c*g-u*d,(E=m*(A=h*g-u*p)-y*L+v*S+x*w-_*C+b*P)&&(E=1/E,this[0]=(r*A-n*L+a*S)*E,this[1]=(i*L-t*A-o*S)*E,this[2]=(d*b-p*_+g*x)*E,this[3]=(h*_-c*b-u*x)*E,this[4]=(n*w-s*A-a*C)*E,this[5]=(e*A-i*w+o*C)*E,this[6]=(p*v-f*b-g*y)*E,this[7]=(l*b-h*v+u*y)*E,this[8]=(s*L-r*w+a*P)*E,this[9]=(t*w-e*L-o*P)*E,this[10]=(f*_-d*v+g*m)*E,this[11]=(c*v-l*_-u*m)*E,this[12]=(r*C-s*S-n*P)*E,this[13]=(e*S-t*C+i*P)*E,this[14]=(d*y-f*x-p*m)*E,this[15]=(l*x-c*y+h*m)*E),this.check()}multiplyLeft(e){return iR(this,e,this),this.check()}multiplyRight(e){return iR(this,this,e),this.check()}rotateX(e){let t,i,o,s,r,n,a,l,c,h;return t=Math.sin(e),i=Math.cos(e),o=this[4],s=this[5],r=this[6],n=this[7],a=this[8],l=this[9],c=this[10],h=this[11],this!==this&&(this[0]=this[0],this[1]=this[1],this[2]=this[2],this[3]=this[3],this[12]=this[12],this[13]=this[13],this[14]=this[14],this[15]=this[15]),this[4]=o*i+a*t,this[5]=s*i+l*t,this[6]=r*i+c*t,this[7]=n*i+h*t,this[8]=a*i-o*t,this[9]=l*i-s*t,this[10]=c*i-r*t,this[11]=h*i-n*t,this.check()}rotateY(e){let t,i,o,s,r,n,a,l,c,h;return t=Math.sin(e),i=Math.cos(e),o=this[0],s=this[1],r=this[2],n=this[3],a=this[8],l=this[9],c=this[10],h=this[11],this!==this&&(this[4]=this[4],this[5]=this[5],this[6]=this[6],this[7]=this[7],this[12]=this[12],this[13]=this[13],this[14]=this[14],this[15]=this[15]),this[0]=o*i-a*t,this[1]=s*i-l*t,this[2]=r*i-c*t,this[3]=n*i-h*t,this[8]=o*t+a*i,this[9]=s*t+l*i,this[10]=r*t+c*i,this[11]=n*t+h*i,this.check()}rotateZ(e){let t,i,o,s,r,n,a,l,c,h;return t=Math.sin(e),i=Math.cos(e),o=this[0],s=this[1],r=this[2],n=this[3],a=this[4],l=this[5],c=this[6],h=this[7],this!==this&&(this[8]=this[8],this[9]=this[9],this[10]=this[10],this[11]=this[11],this[12]=this[12],this[13]=this[13],this[14]=this[14],this[15]=this[15]),this[0]=o*i+a*t,this[1]=s*i+l*t,this[2]=r*i+c*t,this[3]=n*i+h*t,this[4]=a*i-o*t,this[5]=l*i-s*t,this[6]=c*i-r*t,this[7]=h*i-n*t,this.check()}rotateXYZ(e){return this.rotateX(e[0]).rotateY(e[1]).rotateZ(e[2])}rotateAxis(e,t){let i,o,s,r,n,a,l,c,h,u,f,d,p,g,m,y,v,x,_,b,P,C,w,S,L,A,E,T;return L=t[0],(T=Math.sqrt(L*L+(A=t[1])*A+(E=t[2])*E))<1e-6||(L*=T=1/T,A*=T,E*=T,o=Math.sin(e),s=1-(i=Math.cos(e)),r=this[0],n=this[1],a=this[2],l=this[3],c=this[4],h=this[5],u=this[6],f=this[7],d=this[8],p=this[9],g=this[10],m=this[11],y=L*L*s+i,v=A*L*s+E*o,x=E*L*s-A*o,_=L*A*s-E*o,b=A*A*s+i,P=E*A*s+L*o,C=L*E*s+A*o,w=A*E*s-L*o,S=E*E*s+i,this[0]=r*y+c*v+d*x,this[1]=n*y+h*v+p*x,this[2]=a*y+u*v+g*x,this[3]=l*y+f*v+m*x,this[4]=r*_+c*b+d*P,this[5]=n*_+h*b+p*P,this[6]=a*_+u*b+g*P,this[7]=l*_+f*b+m*P,this[8]=r*C+c*w+d*S,this[9]=n*C+h*w+p*S,this[10]=a*C+u*w+g*S,this[11]=l*C+f*w+m*S,this!==this&&(this[12]=this[12],this[13]=this[13],this[14]=this[14],this[15]=this[15])),this.check()}scale(e){var t;let i,o,s;return i=(t=Array.isArray(e)?e:[e,e,e])[0],o=t[1],s=t[2],this[0]=this[0]*i,this[1]=this[1]*i,this[2]=this[2]*i,this[3]=this[3]*i,this[4]=this[4]*o,this[5]=this[5]*o,this[6]=this[6]*o,this[7]=this[7]*o,this[8]=this[8]*s,this[9]=this[9]*s,this[10]=this[10]*s,this[11]=this[11]*s,this[12]=this[12],this[13]=this[13],this[14]=this[14],this[15]=this[15],this.check()}translate(e){let t,i,o,s,r,n,a,l,c,h,u,f,d,p,g;return d=e[0],p=e[1],g=e[2],this===this?(this[12]=this[0]*d+this[4]*p+this[8]*g+this[12],this[13]=this[1]*d+this[5]*p+this[9]*g+this[13],this[14]=this[2]*d+this[6]*p+this[10]*g+this[14],this[15]=this[3]*d+this[7]*p+this[11]*g+this[15]):(t=this[0],i=this[1],o=this[2],s=this[3],r=this[4],n=this[5],a=this[6],l=this[7],c=this[8],h=this[9],u=this[10],f=this[11],this[0]=t,this[1]=i,this[2]=o,this[3]=s,this[4]=r,this[5]=n,this[6]=a,this[7]=l,this[8]=c,this[9]=h,this[10]=u,this[11]=f,this[12]=t*d+r*p+c*g+this[12],this[13]=i*d+n*p+h*g+this[13],this[14]=o*d+a*p+u*g+this[14],this[15]=s*d+l*p+f*g+this[15]),this.check()}transform(e,t){if(4===e.length){var i;let o,s,r,n;return i=t||[-0,-0,-0,-0],o=e[0],s=e[1],r=e[2],n=e[3],i[0]=this[0]*o+this[4]*s+this[8]*r+this[12]*n,i[1]=this[1]*o+this[5]*s+this[9]*r+this[13]*n,i[2]=this[2]*o+this[6]*s+this[10]*r+this[14]*n,i[3]=this[3]*o+this[7]*s+this[11]*r+this[15]*n,iT(t=i,4),t}return this.transformAsPoint(e,t)}transformAsPoint(e,t){var i,o;let s,r,n,a,l,c,h,{length:u}=e;switch(u){case 2:i=t||[-0,-0],r=e[0],n=e[1],i[0]=this[0]*r+this[4]*n+this[12],i[1]=this[1]*r+this[5]*n+this[13],s=i;break;case 3:o=t||[-0,-0,-0],a=e[0],l=e[1],c=e[2],h=(h=this[3]*a+this[7]*l+this[11]*c+this[15])||1,o[0]=(this[0]*a+this[4]*l+this[8]*c+this[12])/h,o[1]=(this[1]*a+this[5]*l+this[9]*c+this[13])/h,o[2]=(this[2]*a+this[6]*l+this[10]*c+this[14])/h,s=o;break;default:throw Error("Illegal vector")}return iT(s,e.length),s}transformAsVector(e,t){var i,o;let s,r,n,a,l,c,h,u;switch(e.length){case 2:i=t||[-0,-0],r=e[0],n=e[1],a=this[3]*r+this[7]*n||1,i[0]=(this[0]*r+this[4]*n)/a,i[1]=(this[1]*r+this[5]*n)/a,s=i;break;case 3:o=t||[-0,-0,-0],l=e[0],c=e[1],h=e[2],u=this[3]*l+this[7]*c+this[11]*h||1,o[0]=(this[0]*l+this[4]*c+this[8]*h)/u,o[1]=(this[1]*l+this[5]*c+this[9]*h)/u,o[2]=(this[2]*l+this[6]*c+this[10]*h)/u,s=o;break;default:throw Error("Illegal vector")}return iT(s,e.length),s}transformPoint(e,t){return this.transformAsPoint(e,t)}transformVector(e,t){return this.transformAsPoint(e,t)}transformDirection(e,t){return this.transformAsVector(e,t)}makeRotationX(e){return this.identity().rotateX(e)}makeTranslation(e,t,i){return this.identity().translate([e,t,i])}}function iF(e){if(e>2*Math.PI)throw Error("expected radians")}var iD=i(22191),ij=i(85863);let iV={[iD.UK]:function(e,t){for(let i of e)iq(t,i).state=0;for(let i of e)iq(t,i).isSelected&&!iU(i,t)&&iG(i,t);for(let i of e){let e=iq(t,i);e.isVisible=!!(2&e.state)}},[iD.ll]:function(e,t){for(let i of e)iq(t,i).state=0;for(let i of e)iq(t,i).isSelected&&iU(i,t);for(let i of Array.from(e).sort((e,t)=>e.zoom-t.zoom)){let e=iq(t,i);if(e.isVisible=!!(2&e.state),i.children&&(e.isVisible||1&e.state))for(let e of i.children)iq(t,e).state=1;else e.isSelected&&iG(i,t)}},[iD.to]:()=>{}};class iW{id=Symbol("tile-2d-view");_tileset;_selectedTiles=null;_frameNumber=0;_viewport=null;_zRange=null;_selectionVersion=-1;_modelMatrix=new iB;_modelMatrixInverse=new iB;_state=new Map;constructor(e){this._tileset=e,this._tileset.adapter||this._tileset.setOptions({adapter:ij.sG}),this._tileset.attachConsumer(this.id)}finalize(){this._tileset.detachConsumer(this.id),this._selectedTiles=null,this._state.clear()}get selectedTiles(){return this._selectedTiles}get isLoaded(){return null!==this._selectedTiles&&this._selectedTiles.every(e=>e.isLoaded)}get needsReload(){return null!==this._selectedTiles&&this._selectedTiles.some(e=>e.needsReload)}update(e,{zRange:t,modelMatrix:i}={zRange:null,modelMatrix:null}){let o=i?new iB(i):new iB,s=!o.equals(this._modelMatrix);if(this._viewport&&e.equals(this._viewport)&&(0,iA.aI)(this._zRange,t)&&!s&&this._selectionVersion===this._tileset.selectionVersion)this.needsReload&&(this._selectedTiles=(this._selectedTiles||[]).map(e=>this._tileset.getTile(e.index,!0)),this._tileset.prepareTiles());else{s&&(this._modelMatrixInverse=o.clone().invert(),this._modelMatrix=o),this._viewport=e,this._zRange=t,this._selectionVersion=this._tileset.selectionVersion;let i=this._tileset.getTileIndices({viewState:e,maxZoom:this._tileset.maxZoom,minZoom:this._tileset.minZoom,zRange:t,modelMatrix:this._modelMatrix,modelMatrixInverse:this._modelMatrixInverse});this._selectedTiles=i.map(e=>this._tileset.getTile(e,!0)),this._tileset.prepareTiles()}let r=this._updateTileStates();return this._tileset.updateConsumer(this.id,this._selectedTiles||[],this._getVisibleTiles()),this._pruneEvictedTileStates(),r&&this._frameNumber++,this._frameNumber}isTileVisible(e,t,i){let o=this._state.get(e);return!!o?.isVisible&&(!t||!this._viewport||this._getCullBounds({viewport:this._viewport,z:this._zRange,cullRect:t}).some(t=>this._tileOverlapsBounds(e,t,i)))}_getVisibleTiles(){let e=[];for(let t of this._tileset.tiles)this._state.get(t)?.isVisible&&e.push(t);return e}_pruneEvictedTileStates(){let e=new Set(this._tileset.tiles);for(let t of this._state.keys())e.has(t)||this._state.delete(t)}_getCullBounds=(function(e){let t,i={};return o=>{for(let s in o)if(!function(e,t){if(e===t)return!0;if(Array.isArray(e)){let i=e.length;if(!t||t.length!==i)return!1;for(let o=0;o<i;o++)if(e[o]!==t[o])return!1;return!0}return!1}(o[s],i[s])){t=e(o),i=o;break}return t}})(ij.ws);_updateTileStates(){let e=this._tileset.refinementStrategy||iD.UK,t=this._tileset.tiles,i=new Map;for(let e of t){let t=this._state.get(e);i.set(e,t?.isVisible||!1),this._state.set(e,{isSelected:!1,isVisible:!1,state:0})}for(let e of this._selectedTiles||[]){let t=this._state.get(e)||{isSelected:!1,isVisible:!1,state:0};t.isSelected=!0,t.isVisible=!0,this._state.set(e,t)}iV[e](t,this._state);let o=!1;for(let e of t){let t=this._state.get(e);t&&t.isVisible!==i.get(e)&&(o=!0)}return o}_tileOverlapsBounds(e,[t,i,o,s],r){let n=this._getTileBoundingBox(e,r);if("west"in n)return n.west<o&&n.east>t&&n.south<s&&n.north>i;let a=Math.min(n.top,n.bottom),l=Math.max(n.top,n.bottom);return n.left<o&&n.right>t&&a<s&&l>i}_getTileBoundingBox(e,t){let{bbox:i}=e;if("west"in i||!t||iB.IDENTITY.equals(t))return i;let[o,s,r,n]=(0,ij.Ww)([i.left,i.top,i.right,i.bottom],t);return{left:o,top:s,right:r,bottom:n}}}function iU(e,t){let i=e;for(;i;){if(i.isLoaded||i.content)return iq(t,i).state|=2,!0;i=i.parent}return!1}function iG(e,t){for(let i of e.children||[])i.isLoaded||i.content?iq(t,i).state|=2:iG(i,t)}function iq(e,t){let i=e.get(t);return i||(i={isSelected:!1,isVisible:!1,state:0},e.set(t,i)),i}function i$(e){return!!(e&&"object"==typeof e&&"getTileData"in e&&"function"==typeof e.getTileData&&"getMetadata"in e&&"function"==typeof e.getMetadata)}function iK(e){return null===e||"string"==typeof e||Array.isArray(e)&&e.every(e=>"string"==typeof e)}let iH={type:"object",value:null,validate:(e,t)=>t.optional&&null===e||e instanceof iD._f||i$(e)||iK(e),equal:(e,t)=>e===t},iZ={TilesetClass:iD._f,data:iH,dataComparator:iH.equal,renderSubLayers:{type:"function",value:e=>new iL(e)},getTileData:{type:"function",optional:!0,value:null},onViewportLoad:{type:"function",optional:!0,value:null},onTileLoad:{type:"function",value:()=>{}},onTileUnload:{type:"function",value:()=>{}},onTileError:{type:"function",value:e=>console.error(e)},extent:{type:"array",optional:!0,value:null,compare:!0},tileSize:512,maxZoom:null,minZoom:0,maxCacheSize:null,maxCacheByteSize:null,refinementStrategy:iD.UK,zRange:null,maxRequests:6,debounceTime:0,zoomOffset:0},iJ="DEFAULT-INITIAL-VIEWPORT",iY={maxCacheSize:null,maxCacheByteSize:null,maxZoom:null,minZoom:0,tileSize:512,refinementStrategy:iD.UK,extent:null,maxRequests:6,debounceTime:0,zoomOffset:0};class iX extends u.A{static defaultProps=iZ;static layerName="SharedTile2DLayer";_knownViewports=new Map;state=null;initializeState(){this._knownViewports.clear(),this.context.viewport&&this._knownViewports.set(this.context.viewport.id||"default",this.context.viewport),this.state={tileset:null,tilesetViews:new Map,ownsTileset:!1,isLoaded:!1,frameNumbers:new Map,tileLayers:new Map,unsubscribeTilesetEvents:null}}finalizeState(){for(let e of(this.state.unsubscribeTilesetEvents?.(),this.state.tilesetViews.values()))e.finalize();this.state.ownsTileset&&this.state.tileset?.finalize()}get isLoaded(){let{tilesetViews:e,tileLayers:t}=this.state;return!!e.size&&!!Array.from(e.values()).every(e=>e.selectedTiles?.every(e=>{let i=t.get(e.id);return e.isLoaded&&(!e.content||!i||i.every(e=>e.isLoaded))}))}shouldUpdateState({changeFlags:e}){return e.somethingChanged}updateState({changeFlags:e}){(0,iD.JX)(this.props.refinementStrategy),this.context.viewport&&this._knownViewports.set(this._getViewportKey(),this.context.viewport);let t=!!(e.propsOrDataChanged||e.updateTriggersChanged),i=e.dataChanged||e.updateTriggersChanged&&(e.updateTriggersChanged.all||e.updateTriggersChanged.getTileData),{tileset:o,ownsTileset:s}=this.state,r=this.props.data instanceof iD._f?this.props.data:null;r&&!r.adapter&&r.setOptions({adapter:ij.sG});let n=!r,a=this._resolveTileset(o,s,r);a!==o||n!==s?(this._releaseTileset(o,s),o=a,s=n,this.setState({tileset:o,tilesetViews:new Map,ownsTileset:s,tileLayers:new Map,frameNumbers:new Map,unsubscribeTilesetEvents:a.subscribe({onTileLoad:this._onTileLoad.bind(this),onTileError:this._onTileError.bind(this),onTileUnload:this._onTileUnload.bind(this),onUpdate:()=>this.setNeedsUpdate(),onError:e=>this.raiseError(e,"loading TileSource metadata")})})):this._updateExistingTileset(t,s,!!i,a),this._updateTileset()}_resolveTileset(e,t,i){return i||(e&&t?e:new this.props.TilesetClass(this._getTilesetOptions()))}_releaseTileset(e,t){for(let e of(this.state.unsubscribeTilesetEvents?.(),this.state.tilesetViews.values()))e.finalize();t&&e?.finalize()}_updateExistingTileset(e,t,i,o){if(e){if(t&&(o.setOptions(this._getTilesetOptions()),i))return void o.reloadAll();this.state.tileLayers.clear()}}_getTilesetOptions(){let{tileSize:e,maxCacheSize:t,maxCacheByteSize:i,refinementStrategy:o,extent:s,maxZoom:r,minZoom:n,maxRequests:a,debounceTime:l,zoomOffset:c}=this.props,h=i$(this.props.data)?this.props.data:void 0,u={tileSource:h,adapter:ij.sG,getTileData:h?void 0:this.getTileData.bind(this),onTileLoad:()=>{},onTileError:()=>{},onTileUnload:()=>{}};return this._assignTilesetOptionIfExplicit(u,"maxCacheSize",t,iY.maxCacheSize),this._assignTilesetOptionIfExplicit(u,"maxCacheByteSize",i,iY.maxCacheByteSize),this._assignTilesetOptionIfExplicit(u,"maxZoom",r,iY.maxZoom),this._assignTilesetOptionIfExplicit(u,"minZoom",n,iY.minZoom),this._assignTilesetOptionIfExplicit(u,"tileSize",e,iY.tileSize),this._assignTilesetOptionIfExplicit(u,"refinementStrategy",o,iY.refinementStrategy),this._assignTilesetOptionIfExplicit(u,"extent",s,iY.extent),this._assignTilesetOptionIfExplicit(u,"maxRequests",a,iY.maxRequests),this._assignTilesetOptionIfExplicit(u,"debounceTime",l,iY.debounceTime),this._assignTilesetOptionIfExplicit(u,"zoomOffset",c,iY.zoomOffset),u}_updateTileset(){let{zRange:e,modelMatrix:t}=this.props,i=!1,o=new Set;for(let[s,r]of(this._pruneRemovedViewports(),this._knownViewports)){this._prunePlaceholderViewportView(s);let n=this._getOrCreateTilesetView(s),a=n.update(r,{zRange:e,modelMatrix:t}),l=this.state.frameNumbers.get(s)!==a;i||=l,n.isLoaded&&l&&(this._onViewportLoad(n),o.add(n)),l&&this.state.frameNumbers.set(s,a)}let s=this.isLoaded;if(this.state.isLoaded!==s)for(let e of this.state.tilesetViews.values())e.isLoaded&&!o.has(e)&&this._onViewportLoad(e);i&&this.setState({frameNumbers:new Map(this.state.frameNumbers)}),this.state.isLoaded=s}_onViewportLoad(e){e.selectedTiles&&this.props.onViewportLoad?.(e.selectedTiles)}_onTileLoad(e){this.state.tileLayers.delete(e.id),this.props.onTileLoad(e),this.setNeedsUpdate()}_onTileError(e,t){this.state.tileLayers.delete(t.id),this.props.onTileError(e,t),this.setNeedsUpdate()}_onTileUnload(e){this.state.tileLayers.delete(e.id),this.props.onTileUnload(e)}getTileData(e){let{data:t,getTileData:i,fetch:o}=this.props,{signal:s}=e;return iK(t)?(e.url=function(e,t){if(!e||!e.length)return null;let{index:i,id:o}=t;Array.isArray(e)&&(e=e[Math.abs(o.split("").reduce((e,t)=>(e<<5)-e+t.charCodeAt(0)|0,0))%e.length]);let s=e;for(let e of Object.keys(i))s=s.replace(RegExp(`{${e}}`,"g"),String(i[e]));return Number.isInteger(i.y)&&Number.isInteger(i.z)&&(s=s.replace(/\{-y\}/g,String(Math.pow(2,i.z)-i.y-1))),s}(t,e),i)?i(e):o&&e.url?o(e.url,{propName:"data",layer:this,signal:s}):null:null}renderSubLayers(e){return this.props.renderSubLayers(e)}getSubLayerPropsByTile(e,t){return null}getPickingInfo(e){let{sourceLayer:t}=e;if(!t)throw Error("SharedTile2DLayer picking info requires a source layer.");let i=t.props.tile,o=e.info;return o.picked&&(o.tile=i),o.sourceTile=i,o.sourceTileSubLayer=t,o}_updateAutoHighlight(e){e.sourceTileSubLayer.updateAutoHighlight(e)}renderLayers(){let{tileset:e,tileLayers:t}=this.state;return e?e.tiles.map(e=>{let i=t.get(e.id);if(!e.isLoaded&&!e.content)return i;if(i)i=i.map(t=>{let i=this.getSubLayerPropsByTile(e,t);return i&&Object.keys(i).some(e=>t.props[e]!==i[e])?t.clone(i):t}),t.set(e.id,i);else{let o=this.renderSubLayers({...this.props,...this.getSubLayerProps({id:e.id,updateTriggers:this.props.updateTriggers}),data:e.content,_offset:0,tile:e});i=this._flattenTileLayers(o).map(t=>t.clone({tile:e,...this.getSubLayerPropsByTile(e,t)})),t.set(e.id,i)}return i}):null}filterSubLayer({layer:e,cullRect:t}){let{tile:i}=e.props;return this._getOrCreateTilesetView(this._getViewportKey()).isTileVisible(i,t,this.props.modelMatrix?new iB(this.props.modelMatrix):null)}_getViewportKey(){return this.context.viewport?.id||"default"}_assignTilesetOptionIfExplicit(e,t,i,o){this._isDefaultOptionValue(i,o)||(e[t]=i)}_isDefaultOptionValue(e,t){return Array.isArray(e)||Array.isArray(t)?Array.isArray(e)&&Array.isArray(t)&&e.length===t.length&&e.every((e,i)=>e===t[i]):e===t}_pruneRemovedViewports(){for(let e of this._getRemovedViewportKeys())this._knownViewports.delete(e),this.state.tilesetViews.get(e)?.finalize(),this.state.tilesetViews.delete(e),this.state.frameNumbers.delete(e)}_getRemovedViewportKeys(){let e=this.context?.deck?.getViewports()||[];if(!e.length)return[];let t=new Set(e.map(e=>e.id));return Array.from(new Set([...this._knownViewports.keys(),...this.state.tilesetViews.keys()])).filter(e=>!t.has(e))}_prunePlaceholderViewportView(e){if(e!==iJ){let e=this.state.tilesetViews.get(iJ);e&&(e.finalize(),this.state.tilesetViews.delete(iJ),this.state.frameNumbers.delete(iJ))}}_getOrCreateTilesetView(e){let t=this.state.tilesetViews.get(e);if(!t){let i=this.state.tileset;if(!i)throw Error("SharedTile2DLayer tileset was not initialized.");t=new iW(i),this.state.tilesetViews.set(e,t)}return t}activateViewport(e){let t=e.id||"default",i=this._knownViewports.get(t);this._knownViewports.set(t,e),i&&e.equals(i)||this.setNeedsUpdate(),super.activateViewport(e)}_flattenTileLayers(e){return(0,f.B)(e,Boolean)}}},22191(e,t,i){i.d(t,{UK:()=>c,_f:()=>d,ll:()=>l,JX:()=>u,to:()=>a});var o=i(29947);let s={id:"request-scheduler",throttleRequests:!0,maxRequests:6,debounceTime:0};class r{props;stats;activeRequestCount=0;requestQueue=[];requestMap=new Map;updateTimer=null;constructor(e={}){this.props={...s,...e},this.stats=new o.A({id:this.props.id}),this.stats.get("Queued Requests"),this.stats.get("Active Requests"),this.stats.get("Cancelled Requests"),this.stats.get("Queued Requests Ever"),this.stats.get("Active Requests Ever")}setProps(e){void 0!==e.throttleRequests&&(this.props.throttleRequests=e.throttleRequests),void 0!==e.maxRequests&&(this.props.maxRequests=e.maxRequests),void 0!==e.debounceTime&&(this.props.debounceTime=e.debounceTime)}scheduleRequest(e,t=()=>0){if(!this.props.throttleRequests)return Promise.resolve({done:()=>{}});if(this.requestMap.has(e))return this.requestMap.get(e);let i={handle:e,priority:0,getPriority:t},o=new Promise(e=>(i.resolve=e,i));return this.requestQueue.push(i),this.requestMap.set(e,o),this._issueNewRequests(),o}_issueRequest(e){let{handle:t,resolve:i}=e,o=!1,s=()=>{o||(o=!0,this.requestMap.delete(t),this.activeRequestCount--,null===this.updateTimer&&(this.updateTimer=setTimeout(()=>this._issueNewRequestsAsync(),0)))};return this.activeRequestCount++,i?i({done:s}):Promise.resolve({done:s})}_issueNewRequests(){null!==this.updateTimer&&clearTimeout(this.updateTimer),this.updateTimer=setTimeout(()=>this._issueNewRequestsAsync(),this.props.debounceTime)}_issueNewRequestsAsync(){null!==this.updateTimer&&clearTimeout(this.updateTimer),this.updateTimer=null;let e=Math.max(this.props.maxRequests-this.activeRequestCount,0);if(0!==e){this._updateAllRequests();for(let t=0;t<e;++t){let e=this.requestQueue.shift();e&&this._issueRequest(e)}}}_updateAllRequests(){let e=this.requestQueue;for(let t=0;t<e.length;++t){let i=e[t];!this._updateRequest(i)&&(e.splice(t,1),this.requestMap.delete(i.handle),t--)}e.sort((e,t)=>e.priority-t.priority)}_updateRequest(e){return e.priority=e.getPriority(e.handle),!(e.priority<0)||(e.resolve(null),!1)}}class n{index;parent;children;content;id;zoom;userData;boundingBox;_abortController;_loader;_loaderId;_isLoaded;_isCancelled;_needsReload;_bbox;constructor(e){this.index=e,this.parent=null,this.children=[],this.content=null,this._loader=void 0,this._abortController=null,this._loaderId=0,this._isLoaded=!1,this._isCancelled=!1,this._needsReload=!1}get bbox(){return this._bbox}set bbox(e){this._bbox||(this._bbox=e,"west"in e?this.boundingBox=[[e.west,e.south],[e.east,e.north]]:this.boundingBox=[[e.left,e.top],[e.right,e.bottom]])}get data(){let e=this._loader;return this._isCancelled||void 0===e?this.content:e.then(()=>this.data)}get isLoaded(){return this._isLoaded&&!this._needsReload}get isLoading(){return!!this._loader&&!this._isCancelled}get needsReload(){return this._needsReload||this._isCancelled}get byteLength(){let e=this.content?this.content.byteLength:0;return Number.isFinite(e)?e:0}async _loadData({getData:e,requestScheduler:t,onLoad:i,onError:o}){let s,r=(e,t,s)=>{if(s===this._loaderId){if(this._loader=void 0,this.content=e,this._isCancelled&&!e){this._isLoaded=!1;return}if(this._isLoaded=!0,this._isCancelled=!1,t)return void o(t,this);i(this)}},{index:n,id:a,bbox:l,userData:c,zoom:h}=this,u=this._loaderId;this._abortController=new AbortController;let{signal:f}=this._abortController,d=await t.scheduleRequest(this,()=>1);if(!d){this._isCancelled=!0;return}if(this._isCancelled)return void d.done();let p=null;try{p=await e({index:n,id:a,bbox:l,userData:c,zoom:h,signal:f})}catch(e){s=e||!0}finally{d.done()}r(p,s,u)}loadData(e){return this._isLoaded=!1,this._isCancelled=!1,this._needsReload=!1,this._loaderId++,this._loader=this._loadData(e),this._loader}setNeedsReload(){this.isLoading&&(this.abort(),this._loader=void 0),this._needsReload=!0}abort(){this.isLoaded||(this._isCancelled=!0,this._abortController?.abort())}}let a="never",l="no-overlap",c="best-available",h=[a,l,c];function u(e){if(null!=e&&!h.includes(e)){let t="function"==typeof e?"a function":JSON.stringify(e);throw Error(`refinementStrategy must be '${c}', '${l}' or '${a}', not ${t}.`)}}let f={adapter:null,extent:null,tileSize:512,maxZoom:null,minZoom:null,maxCacheSize:100,maxCacheByteSize:null,refinementStrategy:"best-available",zRange:null,maxRequests:6,debounceTime:0,zoomOffset:0,onTileLoad:()=>{},onTileUnload:()=>{},onTileError:()=>{}};class d{stats;opts;sourceMetadata=null;_requestScheduler;_cache;_dirty;_tiles;_cacheByteSize;_unloadedTileCount;_listeners=new Set;_consumers=new Map;_explicitOptionKeys=new Set;_baseOpts={};_sourceMetadataOverrides={};_maxZoom;_minZoom;_lastTileContext=null;_selectionVersion=0;constructor(e){if(this.stats=new o.A({id:"SharedTileset2D",stats:[{name:"Tiles In Cache"},{name:"Cache Size"},{name:"Visible Tiles"},{name:"Selected Tiles"},{name:"Loading Tiles"},{name:"Unloaded Tiles"},{name:"Consumers"}]}),this.opts={...f,...e,getTileData:e.getTileData||(()=>null),tileSource:e.tileSource},this._requestScheduler=new r({throttleRequests:this.opts.maxRequests>0||this.opts.debounceTime>0,maxRequests:this.opts.maxRequests,debounceTime:this.opts.debounceTime}),this._cache=new Map,this._tiles=[],this._dirty=!1,this._cacheByteSize=0,this._unloadedTileCount=0,!this.opts.tileSource&&!e.getTileData)throw Error("SharedTileset2D requires either `getTileData` or `tileSource`.");this.setOptions(e),this._updateStats(),this.opts.tileSource&&this._initializeTileSource(this.opts.tileSource).catch(()=>{})}static fromTileSource(e,t={}){return new d({...t,tileSource:e})}get tiles(){return this._tiles}get cacheByteSize(){return this._cacheByteSize}get selectedTiles(){return Array.from(this._getSelectedTilesUnion())}get visibleTiles(){let e=this._getVisibleTilesUnion();for(let t of this._getSelectedTilesUnion())e.add(t);return Array.from(e)}get loadingTiles(){return Array.from(this._cache.values()).filter(e=>e.isLoading)}get unloadedTiles(){return Array.from(this._cache.values()).filter(e=>!e.isLoaded)}get maxZoom(){return this._maxZoom}get minZoom(){return this._minZoom}get selectionVersion(){return this._selectionVersion}get refinementStrategy(){return this.opts.refinementStrategy||c}get adapter(){return this.opts.adapter}subscribe(e){return this._listeners.add(e),()=>this._listeners.delete(e)}attachConsumer(e){this._consumers.set(e,{selectedTiles:new Set,visibleTiles:new Set}),this._updateStats()}detachConsumer(e){this._consumers.delete(e),this._pruneRequests(),this._resizeCache(),this._updateStats()}setOptions(e){u(e.refinementStrategy),this._rememberExplicitOptions(e),this._baseOpts={...this._baseOpts,...e},this._applyResolvedOptions()}finalize(){for(let e of this._cache.values())e.isLoading&&e.abort();this._cache.clear(),this._tiles=[],this._consumers.clear(),this._cacheByteSize=0,this._unloadedTileCount=0,this._updateStats()}reloadAll(){let e=this._getSelectedTilesUnion();for(let t of this._cache.keys()){let i=this._cache.get(t);i&&!e.has(i)?this._cache.delete(t):i&&i.setNeedsReload()}this._cacheByteSize=this._getCacheByteSize(),this.prepareTiles(),this._updateStats()}updateConsumer(e,t,i){this._consumers.set(e,{selectedTiles:new Set(t),visibleTiles:new Set(i)}),this._pruneRequests(),this._resizeCache(),this._updateStats()}prepareTiles(){this._dirty&&(this._rebuildTree(),this._syncTiles(),this._dirty=!1)}getTileIndices({viewState:e,maxZoom:t,minZoom:i,zRange:o,modelMatrix:s,modelMatrixInverse:r}){let{adapter:n,tileSize:a,extent:l,zoomOffset:c}=this.opts;if(!n)throw Error("SharedTileset2D requires an adapter before tile traversal can be used.");return this._lastTileContext={viewState:e,tileSize:a},n.getTileIndices({viewState:e,maxZoom:t,minZoom:i,zRange:o,tileSize:a,extent:p(l),modelMatrix:s,modelMatrixInverse:r,zoomOffset:c})}getTileId(e){return`${e.x}-${e.y}-${e.z}`}getTileZoom(e){return e.z}getTileMetadata(e){if(!this._lastTileContext)throw Error("SharedTileset2D metadata requested before traversal context was set.");if(!this.opts.adapter)throw Error("SharedTileset2D requires an adapter before tile metadata can be derived.");return{bbox:this.opts.adapter.getTileBoundingBox(this._lastTileContext,e)}}getParentIndex(e){return{x:Math.floor(e.x/2),y:Math.floor(e.y/2),z:e.z-1}}getTile(e,t){let i=this.getTileId(e),o=this._cache.get(i),s=!1;return!o&&t?(Object.assign(o=new n(e),this.getTileMetadata(o.index)),Object.assign(o,{id:i,zoom:this.getTileZoom(o.index)}),s=!0,this._cache.set(i,o),this._dirty=!0,this._updateStats()):o&&o.needsReload&&(s=!0),o&&this._touchTile(i,o),o&&s&&(o.loadData({getData:this.opts.getTileData,requestScheduler:this._requestScheduler,onLoad:this._handleTileLoad.bind(this),onError:this._handleTileError.bind(this)}).catch(()=>{}),this._updateStats()),o}async _initializeTileSource(e){try{this.sourceMetadata=await e.getMetadata(),this._sourceMetadataOverrides=this._getMetadataOverrides(this.sourceMetadata),this._applyResolvedOptions(),this._notifyUpdate()}catch(t){let e=t instanceof Error?t:Error(`TileSource metadata error: ${String(t)}`);this._notifyError(e)}}_rememberExplicitOptions(e){for(let t of Object.keys(e))this._explicitOptionKeys.add(t)}_applyResolvedOptions(){var e,t;let i,o,s={...f,...this._sourceMetadataOverrides,...this._baseOpts};if(s.tileSource){let e=s.tileSource;s.getTileData=t=>e.getTileData(t)}let r=this.opts,n=this._maxZoom,a=this._minZoom;this.opts=s,this._maxZoom="number"==typeof this.opts.maxZoom&&Number.isFinite(this.opts.maxZoom)?Math.floor(this.opts.maxZoom):void 0,this._minZoom="number"==typeof this.opts.minZoom&&Number.isFinite(this.opts.minZoom)?Math.ceil(this.opts.minZoom):void 0,(this._maxZoom!==n||this._minZoom!==a||this.opts.tileSize!==r.tileSize||this.opts.zoomOffset!==r.zoomOffset||this.opts.adapter!==r.adapter||(e=this.opts.extent,t=r.extent,i=p(e),o=p(t),i&&o?!i.every((e,t)=>e===o[t]):i!==o))&&this._selectionVersion++}_getMetadataOverrides(e){if(!e)return{};let t={};return!this._explicitOptionKeys.has("minZoom")&&Number.isFinite(e.minZoom)&&(t.minZoom=e.minZoom),!this._explicitOptionKeys.has("maxZoom")&&Number.isFinite(e.maxZoom)&&(t.maxZoom=e.maxZoom),!this._explicitOptionKeys.has("extent")&&e.boundingBox&&(t.extent=[e.boundingBox[0][0],e.boundingBox[0][1],e.boundingBox[1][0],e.boundingBox[1][1]]),t}_handleTileLoad(e){for(let t of(this.opts.onTileLoad?.(e),this._cacheByteSize=this._getCacheByteSize(),this._resizeCache(),this._listeners))t.onTileLoad?.(e);this._updateStats()}_handleTileError(e,t){for(let i of(this.opts.onTileError?.(e,t),this._listeners))i.onTileError?.(e,t);this._updateStats()}_handleTileUnload(e){for(let t of(this._unloadedTileCount++,this.opts.onTileUnload?.(e),this._listeners))t.onTileUnload?.(e);this._updateStats()}_notifyUpdate(){for(let e of this._listeners)e.onUpdate?.()}_notifyError(e){for(let t of this._listeners)t.onError?.(e)}_updateStats(){for(let e of(this._setStatCount("Tiles In Cache",this._cache.size),this._setStatCount("Cache Size",this.cacheByteSize),this._setStatCount("Visible Tiles",this.visibleTiles.length),this._setStatCount("Selected Tiles",this.selectedTiles.length),this._setStatCount("Loading Tiles",this.loadingTiles.length),this._setStatCount("Unloaded Tiles",this._unloadedTileCount),this._setStatCount("Consumers",this._consumers.size),this._listeners))e.onStatsChange?.(this.stats)}_setStatCount(e,t){this.stats.get(e).reset().addCount(t)}_getSelectedTilesUnion(){let e=new Set;for(let t of this._consumers.values())for(let i of t.selectedTiles)e.add(i);return e}_getVisibleTilesUnion(){let e=new Set;for(let t of this._consumers.values())for(let i of t.visibleTiles)e.add(i);return e}_touchTile(e,t){this._cache.delete(e),this._cache.set(e,t)}_getCacheByteSize(){let e=0;for(let t of this._cache.values())e+=t.byteLength;return e}_pruneRequests(){let{maxRequests:e=0}=this.opts,t=this._getSelectedTilesUnion(),i=this._getVisibleTilesUnion(),o=[],s=0;for(let e of this._cache.values())e.isLoading&&(s++,t.has(e)||i.has(e)||o.push(e));for(;e>0&&s>e&&o.length>0;){let e=o.shift();e&&e.abort(),s--}}_rebuildTree(){for(let e of this._cache.values())e.parent=null,e.children&&(e.children.length=0);for(let e of this._cache.values()){let t=this._getNearestAncestor(e);e.parent=t,t?.children&&t.children.push(e)}}_syncTiles(){this._tiles=Array.from(this._cache.values()).sort((e,t)=>e.zoom-t.zoom)}_resizeCache(){let e=this.opts.maxCacheSize??100,t=this.opts.maxCacheByteSize??1/0,i=this._getVisibleTilesUnion(),o=this._getSelectedTilesUnion();if(this._cache.size>e||this._cacheByteSize>t){for(let[s,r]of this._cache)if(i.has(r)||o.has(r)||(this._cache.delete(s),this._cacheByteSize=this._getCacheByteSize(),this._handleTileUnload(r)),this._cache.size<=e&&this._cacheByteSize<=t)break;this._dirty=!0}this._dirty&&(this._rebuildTree(),this._syncTiles(),this._dirty=!1)}_getNearestAncestor(e){let{_minZoom:t=0}=this,i=e.index;for(;this.getTileZoom(i)>t;){i=this.getParentIndex(i);let e=this.getTile(i);if(e)return e}return null}}function p(e){return e&&4===e.length?e:void 0}},63736(e,t,i){i.d(t,{A:()=>x});var o=i(41881),s=i(46487),r=i(84175),n=i(95335),a=i(95263),l=i(52699),c=i(15084);let h=new Uint32Array([0,2,1,0,3,2]),u=new Float32Array([0,1,0,0,1,0,1,1]),f=`\
layout(std140) uniform bitmapUniforms {
  vec4 bounds;
  float coordinateConversion;
  float desaturate;
  vec3 tintColor;
  vec4 transparentColor;
} bitmap;
`,d={name:"bitmap",source:`
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
`,vs:f,fs:f,uniformTypes:{bounds:"vec4<f32>",coordinateConversion:"f32",desaturate:"f32",tintColor:"vec3<f32>",transparentColor:"vec4<f32>"}},p=`\
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
`,g=`\
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
`,m=`
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
`,y=`\
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

${m}

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
`;class v extends o.A{getShaders(){return super.getShaders({vs:g,fs:y,source:p,modules:[s.A,r.A,n.Ay,d]})}initializeState(){this.getAttributeManager().add({indices:{size:1,isIndexed:!0,update:e=>e.value=this.state.mesh.indices,noAlloc:!0},positions:{size:3,type:"float64",fp64:this.use64bitPositions(),update:e=>e.value=this.state.mesh.positions,noAlloc:!0},texCoords:{size:2,update:e=>e.value=this.state.mesh.texCoords,noAlloc:!0}})}updateState({props:e,oldProps:t,changeFlags:i}){let o=this.getAttributeManager();if(i.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),o.invalidateAll()),e.bounds!==t.bounds){let e=this.state.mesh,t=this._createMesh();for(let i in this.state.model.setVertexCount(t.vertexCount),t)e&&e[i]!==t[i]&&o.invalidate(i);this.setState({mesh:t,...this._getCoordinateUniforms()})}else e._imageCoordinateSystem!==t._imageCoordinateSystem&&this.setState(this._getCoordinateUniforms())}getPickingInfo(e){let{image:t}=this.props,i=e.info;if(!i.color||!t)return i.bitmap=null,i;let{width:o,height:s}=t;i.index=0;let r=function(e){let[t,i,o]=e;return[(t+(15&o)/16)/256,(i+(240&o)/256)/256]}(i.color);return i.bitmap={size:{width:o,height:s},uv:r,pixel:[Math.floor(r[0]*o),Math.floor(r[1]*s)]},i}disablePickingIndex(){this.setState({disablePicking:!0})}restorePickingColors(){this.setState({disablePicking:!1})}_updateAutoHighlight(e){super._updateAutoHighlight({...e,color:this.encodePickingColor(0)})}_createMesh(){let{bounds:e}=this.props,t=e;return _(e)&&(t=[[e[0],e[1]],[e[0],e[3]],[e[2],e[3]],[e[2],e[1]]]),function(e,t){if(!t){var i,o,s,r=e;let t=new Float64Array(12);for(let e=0;e<r.length;e++)t[3*e+0]=r[e][0],t[3*e+1]=r[e][1],t[3*e+2]=r[e][2]||0;return{vertexCount:6,positions:t,indices:h,texCoords:u}}let n=Math.max(Math.abs(e[0][0]-e[3][0]),Math.abs(e[1][0]-e[2][0])),a=Math.max(Math.abs(e[1][1]-e[0][1]),Math.abs(e[2][1]-e[3][1])),l=Math.ceil(n/t)+1,f=Math.ceil(a/t)+1,d=(l-1)*(f-1)*6,p=new Uint32Array(d),g=new Float32Array(l*f*2),m=new Float64Array(l*f*3),y=0,v=0;for(let t=0;t<l;t++){let r=t/(l-1);for(let n=0;n<f;n++){let a=n/(f-1),l=(i=e,o=r,s=a,(0,c.Cc)((0,c.Cc)(i[0],i[1],s),(0,c.Cc)(i[3],i[2],s),o));m[3*y+0]=l[0],m[3*y+1]=l[1],m[3*y+2]=l[2]||0,g[2*y+0]=r,g[2*y+1]=1-a,t>0&&n>0&&(p[v++]=y-f,p[v++]=y-f-1,p[v++]=y-1,p[v++]=y-f,p[v++]=y-1,p[v++]=y),y++}}return{vertexCount:d,positions:m,indices:p,texCoords:g}}(t,this.context.viewport.resolution)}_getModel(){let e="webgpu"===this.context.device.type?this.getAttributeManager().getBufferLayouts({isInstanced:!1}).filter(e=>"indices"!==e.name):this.getAttributeManager().getBufferLayouts();return new a.K(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:e,topology:"triangle-list",isInstanced:!1})}draw(e){let{shaderModuleProps:t}=e,{model:i,coordinateConversion:o,bounds:s,disablePicking:r}=this.state,{image:n,desaturate:a,transparentColor:l,tintColor:c}=this.props;if((!t.picking.isActive||!r)&&n&&i){let e={bitmapTexture:n,bounds:s,coordinateConversion:o,desaturate:a,tintColor:c.slice(0,3).map(e=>e/255),transparentColor:l.map(e=>e/255)};i.shaderInputs.setProps({bitmap:e}),i.draw(this.context.renderPass)}}_getCoordinateUniforms(){let{_imageCoordinateSystem:e}=this.props;if("default"!==e){let{bounds:t}=this.props;if(!_(t))throw Error("_imageCoordinateSystem only supports rectangular bounds");let i=this.context.viewport.resolution?"lnglat":"cartesian";if("lnglat"==(e="lnglat"===e?"lnglat":"cartesian")&&"cartesian"===i)return{coordinateConversion:-1,bounds:t};if("cartesian"===e&&"lnglat"===i){let e=(0,l.Gw)([t[0],t[1]]),i=(0,l.Gw)([t[2],t[3]]);return{coordinateConversion:1,bounds:[e[0],e[1],i[0],i[1]]}}}return{coordinateConversion:0,bounds:[0,0,0,0]}}}v.layerName="BitmapLayer",v.defaultProps={image:{type:"image",value:null,async:!0},bounds:{type:"array",value:[1,0,0,1],compare:!0},_imageCoordinateSystem:"default",desaturate:{type:"number",min:0,max:1,value:0},transparentColor:{type:"color",value:[0,0,0,0]},tintColor:{type:"color",value:[255,255,255]},textureParameters:{type:"object",ignore:!0,value:null}};let x=v;function _(e){return Number.isFinite(e[0])}},88149(e,t,i){i.d(t,{A:()=>E});var o=i(41881),s=i(84175),r=i(46487),n=i(95335),a=i(41367),l=i(52948),c=i(9350),h=i(25337),u=i(95263),f=i(44941),d=i(76046),p=i(6423);class g extends f.A{constructor(e){super({...e,attributes:{positions:{size:3,padding:18,initialize:!0,type:e.fp64?Float64Array:Float32Array},segmentTypes:{size:1,type:e.isWebGPU?Float32Array:Uint8ClampedArray}}})}get(e){return this.attributes[e]}getPathSegmentIndices(e){let t=this.attributes.segmentTypes,i=this.vertexStarts[e],o=Math.min(this.vertexStarts[e+1]??this.instanceCount,this.instanceCount),s=[];for(let e=i;e<o-1;e++)(4&t[e])==0&&s.push(e);return s.length&&(4&t[i])!=0&&s.unshift(s.pop()),s}getGeometryFromBuffer(e){return this.normalize||this.opts.isWebGPU?super.getGeometryFromBuffer(e):null}normalizeGeometry(e){return this.normalize?function(e,t,i,o){let s;if(Array.isArray(e[0])){s=Array(e.length*t);for(let i=0;i<e.length;i++)for(let o=0;o<t;o++)s[i*t+o]=e[i][o]||0}else s=e;return i?(0,d.M)(s,{size:t,gridResolution:i}):o?(0,p.I)(s,{size:t}):s}(e,this.positionSize,this.opts.resolution,this.opts.wrapLongitude):e}getGeometrySize(e){if(m(e)){let t=0;for(let i of e)t+=this.getGeometrySize(i);return t}let t=this.getPathLength(e);return t<2?0:this.isClosed(e)?t<3?0:t+2:t}updateGeometryAttributes(e,t){if(0!==t.geometrySize)if(e&&m(e))for(let i of e){let e=this.getGeometrySize(i);t.geometrySize=e,this.updateGeometryAttributes(i,t),t.vertexStart+=e}else this._updateSegmentTypes(e,t),this._updatePositions(e,t)}_updateSegmentTypes(e,t){let i=this.attributes.segmentTypes,o=!!e&&this.isClosed(e),{vertexStart:s,geometrySize:r}=t;i.fill(0,s,s+r),o?(i[s]=4,i[s+r-2]=4):(i[s]+=1,i[s+r-2]+=2),i[s+r-1]=4}_updatePositions(e,t){let{positions:i}=this.attributes;if(!i||!e)return;let{vertexStart:o,geometrySize:s}=t,r=[,,,];for(let t=o,n=0;n<s;t++,n++)this.getPointOnPath(e,n,r),i[3*t]=r[0],i[3*t+1]=r[1],i[3*t+2]=r[2]}getPathLength(e){return e.length/this.positionSize}getPointOnPath(e,t,i=[]){let{positionSize:o}=this;t*o>=e.length&&(t+=1-e.length/o);let s=t*o;return i[0]=e[s],i[1]=e[s+1],i[2]=3===o&&e[s+2]||0,i}isClosed(e){if(!this.normalize)return!!this.opts.loop;let{positionSize:t}=this,i=e.length-t;return e[0]===e[i]&&e[1]===e[i+1]&&(2===t||e[2]===e[i+2])}}function m(e){return Array.isArray(e[0])}let y=`\
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
`,v={name:"path",source:`\
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
`,vs:y,fs:y,uniformTypes:{widthScale:"f32",widthMinPixels:"f32",widthMaxPixels:"f32",jointType:"f32",capType:"f32",miterLimit:"f32",billboard:"f32",widthUnits:"i32"}},x=`\
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
`,b=`\
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
`;var P=i(82819);let C=[0,0,0,255],w={widthUnits:"meters",widthScale:{type:"number",min:0,value:1},widthMinPixels:{type:"number",min:0,value:0},widthMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},jointRounded:!1,capRounded:!1,miterLimit:{type:"number",min:0,value:4},antialiasing:!1,billboard:!1,_pathType:null,getPath:{type:"accessor",value:e=>e.path},getColor:{type:"accessor",value:C},getWidth:{type:"accessor",value:1},rounded:{deprecatedFor:["jointRounded","capRounded"]}},S={enter:(e,t)=>t.length?t.subarray(t.length-e.length):e};function L(e,t){return e===t||!!(e&&t&&e.length===t.length&&e.every((e,i)=>e===t[i]))}class A extends o.A{getShaders(){let{antialiasing:e}=this.props;return super.getShaders({vs:_,fs:b,source:x,defines:e?{ANTIALIASING:1}:{},modules:[s.A,r.A,n.Ay,v,..."webgpu"===this.context.device.type?[P.A]:[]]})}get wrapLongitude(){return!1}getBounds(){return"webgpu"===this.context.device.type?null:this.getAttributeManager()?.getBounds(["vertexPositions"])}getPathProjectionScale(e){let t=this.props.coordinateSystem;if(!this.getAttributeManager()?.getAttributes().instanceDashOffsets)return null;if(e instanceof a.A&&e.zoom>=12&&("default"===t||"lnglat"===t||"cartesian"===t)){let i=l.A.getUniforms({viewport:e,coordinateSystem:t,coordinateOrigin:this.props.coordinateOrigin,autoWrapLongitude:this.wrapLongitude});return[e.projectionMode,i.coordinateOrigin[1],i.commonOrigin[1],...i.commonUnitsPerWorldUnit,...i.commonUnitsPerWorldUnit2,i.commonUnitsPerMeter[2]]}let i=function(e){if(e.isGeospatial)return null;let{unitsPerMeter:t}=e.distanceScales;return[t[0],t[1],t[2]]}(e);return i?[e.projectionMode,...i]:[e.projectionMode]}shouldUpdateState(e){let{viewport:t}=this.context;return super.shouldUpdateState(e)||this.state?.tessellationResolution!==t.resolution||!L(this.state?.pathProjectionScale,this.getPathProjectionScale(t))}initializeState(){let e="webgpu"===this.context.device.type;this.getAttributeManager().addInstanced({...e?{pathPositions:{size:24,type:"float32",transition:!1,accessor:"getPath",update:this.calculateWebGPUPositions,shaderAttributes:{instanceLeftPositions:{size:3,elementOffset:0},instanceStartPositions:{size:3,elementOffset:3},instanceEndPositions:{size:3,elementOffset:6},instanceRightPositions:{size:3,elementOffset:9},instanceLeftPositions64Low:{size:3,elementOffset:12},instanceStartPositions64Low:{size:3,elementOffset:15},instanceEndPositions64Low:{size:3,elementOffset:18},instanceRightPositions64Low:{size:3,elementOffset:21}},noAlloc:!0}}:{vertexPositions:{size:3,vertexOffset:1,type:"float64",fp64:this.use64bitPositions(),transition:S,accessor:"getPath",update:this.calculatePositions,noAlloc:!0,shaderAttributes:{instanceLeftPositions:{vertexOffset:0},instanceStartPositions:{vertexOffset:1},instanceEndPositions:{vertexOffset:2},instanceRightPositions:{vertexOffset:3}}}},instanceTypes:{size:1,type:e?"float32":"uint8",update:this.calculateSegmentTypes,noAlloc:!0},instanceStrokeWidths:{size:1,accessor:"getWidth",transition:!e&&S,defaultValue:1,bufferGroup:"path-instance-data"},instanceColors:{size:this.props.colorFormat.length,type:"unorm8",accessor:"getColor",transition:!e&&S,defaultValue:C,bufferGroup:"path-instance-data"},rowIndexes:{size:1,type:"uint32",accessor:(e,{index:t})=>e&&e.__source?e.__source.index:t,bufferGroup:"path-instance-data"}}),this.setState({pathTesselator:new g({fp64:this.use64bitPositions(),isWebGPU:e}),tessellationResolution:this.context.viewport.resolution,pathProjectionScale:this.getPathProjectionScale(this.context.viewport)})}updateState(e){super.updateState(e);let{props:t,oldProps:i,changeFlags:o}=e,s=this.getAttributeManager(),{viewport:r}=this.context,n=this.state.tessellationResolution!==r.resolution,a=this.getPathProjectionScale(r),l=!L(this.state.pathProjectionScale,a),c=o.updateTriggersChanged&&(o.updateTriggersChanged.all||o.updateTriggersChanged.getPath)||t._pathType!==i._pathType||t.positionFormat!==i.positionFormat||t.wrapLongitude!==i.wrapLongitude||n;if(o.dataChanged||c){let{pathTesselator:e}=this.state,i=t.data.attributes||{};e.updateGeometry({data:t.data,geometryBuffer:i.getPath,buffers:i,normalize:!t._pathType,loop:"loop"===t._pathType,getGeometry:t.getPath,positionFormat:t.positionFormat,wrapLongitude:t.wrapLongitude,resolution:r.resolution,dataChanged:c?void 0:o.dataChanged}),this.setState({numInstances:e.instanceCount,startIndices:e.vertexStarts,tessellationResolution:r.resolution,pathProjectionScale:a}),!o.dataChanged||c?s.invalidateAll():l&&s.invalidate("instanceDashOffsets")}else l&&(this.setState({pathProjectionScale:a}),s.invalidate("instanceDashOffsets"));(o.extensionsChanged||t.antialiasing!==i.antialiasing)&&(this.state.model?.destroy(),this.state.model=this._getModel(),s.invalidateAll())}getPickingInfo(e){let t=super.getPickingInfo(e),{index:i}=t,o=this.props.data;return o[0]&&o[0].__source&&(t.object=o.find(e=>e.__source.index===i)),t}disablePickingIndex(e){let t=this.props.data;if(t[0]&&t[0].__source)for(let i=0;i<t.length;i++)t[i].__source.index===e&&this._disablePickingIndex(i);else super.disablePickingIndex(e)}draw({uniforms:e}){let{jointRounded:t,capRounded:i,billboard:o,miterLimit:s,widthUnits:r,widthScale:n,widthMinPixels:a,widthMaxPixels:l}=this.props,h=this.state.model,u={jointType:Number(t),capType:Number(i),billboard:o,widthUnits:c.p5[r],widthScale:n,miterLimit:s,widthMinPixels:a,widthMaxPixels:l};h.shaderInputs.setProps({path:u}),h.draw(this.context.renderPass)}_getModel(){return new u.K(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new h.V({topology:"triangle-list",attributes:{indices:new Uint16Array([0,1,2,1,4,2,1,3,4,3,5,4]),positions:{value:new Float32Array([0,0,0,-1,0,1,1,-1,1,1,1,0]),size:2}}}),isInstanced:!0})}calculatePositions(e){let{pathTesselator:t}=this.state;e.startIndices=t.vertexStarts,e.value=t.get("positions")}calculateSegmentTypes(e){let{pathTesselator:t}=this.state;e.startIndices=t.vertexStarts,e.value=t.get("segmentTypes")}calculateWebGPUPositions(e){let{pathTesselator:t}=this.state,i=t.get("positions");if(!i){e.value=null;return}let o=t.instanceCount,s=new Float32Array(24*o),r=[-1,0,1,2];for(let e=0;e<o;e++){let t=24*e;for(let n=0;n<4;n++){let a=e+r[n],l=t+3*n;for(let e=0;e<3;e++){let t=a>=0&&a<o?i[3*a+e]:0,r=Math.fround(t);s[l+e]=r,s[l+e+12]=t-r}}}e.startIndices=t.vertexStarts,e.value=s}}A.defaultProps=w,A.layerName="PathLayer";let E=A},82819(e,t,i){i.d(t,{A:()=>o});let o={name:"clip",source:`\
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
`,props:{},uniforms:{},bindingLayout:[{name:"clip",group:2}],uniformTypes:{enabled:"i32",mode:"i32",bounds:"vec4<f32>"},defaultUniforms:{enabled:0,mode:0,bounds:[0,0,1,1]},getUniforms(e={}){let t={};return void 0!==e.enabled&&(t.enabled=+!!e.enabled),void 0!==e.mode&&(t.mode=+("instance"===e.mode)),void 0!==e.bounds&&(t.bounds=e.bounds),t}}},15084(e,t,i){i.d(t,{$W:()=>o,Cc:()=>function e(t,i,o){return r(t)?t.map((t,s)=>e(t,i[s],o)):o*i+(1-o)*t},Fl:()=>s,aI:()=>function e(t,i,s){let n=o.EPSILON;s&&(o.EPSILON=s);try{if(t===i)return!0;if(r(t)&&r(i)){if(t.length!==i.length)return!1;for(let o=0;o<t.length;++o)if(!e(t[o],i[o]))return!1;return!0}if(t&&t.equals)return t.equals(i);if(i&&i.equals)return i.equals(t);if("number"==typeof t&&"number"==typeof i)return Math.abs(t-i)<=o.EPSILON*Math.max(1,Math.abs(t),Math.abs(i));return!1}finally{o.EPSILON=n}},cy:()=>r}),globalThis.mathgl=globalThis.mathgl||{config:{EPSILON:1e-12,debug:!1,precision:4,printTypes:!1,printDegrees:!1,printRowMajor:!0,_cartographicRadians:!1}};let o=globalThis.mathgl.config;function s(e,{precision:t=o.precision}={}){return e=Math.round(e/o.EPSILON)*o.EPSILON,`${parseFloat(e.toPrecision(t))}`}function r(e){return Array.isArray(e)||ArrayBuffer.isView(e)&&!(e instanceof DataView)}},52699(e,t,i){function o(e,t){if(!e)throw Error(t||"@math.gl/web-mercator: assertion failed.")}i.d(t,{Gw:()=>a});let s=Math.PI,r=s/4,n=s/180;function a(e){let[t,i]=e;o(Number.isFinite(t)),o(Number.isFinite(i)&&i>=-90&&i<=90,"invalid latitude");let a=512*(s+Math.log(Math.tan(r+i*n*.5)))/(2*s);return[512*(t*n+s)/(2*s),a]}}}]);