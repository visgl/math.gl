"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["6085"],{93053(t,e,i){let o,a,r,n,s;i.d(e,{A:()=>th});var l=i(12041),h=i(41534),u=i(29527),c=i(70998),p=i(78883),g=i(47345),d=i(9350),m=i(25667);let f=Math.PI/180,b=180/Math.PI;function v(t){return 1>Math.abs((0,m.zi)(t+180,360)-180)}class x extends g.A{constructor(t={}){let e,{longitude:i=0,bearing:o=0,pitch:a=0,zoom:r=0,nearZMultiplier:n=.5,farZMultiplier:s=1,resolution:l=10}=t,{latitude:u=0,height:c,altitude:g=1.5,fovy:d}=t;u=Math.max(Math.min(u,90),-90),c=c||1,d?g=(0,p.wZ)(d):d=(0,p.Os)(g);let m=Math.pow(2,r-M(Math.max(Math.min(u,p.aH),-p.aH))),b=a*f,v=t.nearZ??n,x=t.farZ??(g+512*m/c/Math.max(Math.cos(b),.1))*s,y=new h.k().lookAt({eye:[0,-g,0],up:[0,0,1]}).rotateX(-b).rotateY(-o*f).rotateX(u*f).rotateZ(-i*f).scale(m/c);super({...t,height:c,viewMatrix:y,longitude:i,latitude:u,zoom:r,distanceScales:{unitsPerMeter:[4018225162502676e-20,4018225162502676e-20,4018225162502676e-20],unitsPerMeter2:[0,0,0],metersPerUnit:[24886.609375,24886.609375,24886.609375],unitsPerDegree:[e=Math.PI/180*256,e,4018225162502676e-20],unitsPerDegree2:[0,0,0],degreesPerUnit:[1/e,1/e,24886.609375]},fovy:d,focalDistance:g,near:v,far:x}),this.scale=m,this.latitude=u,this.longitude=i,this.bearing=o,this.pitch=a,this.fovy=d,this.resolution=l}get projectionMode(){return d.Kx.GLOBE}getDistanceScales(){return this.distanceScales}getBounds(t={}){let e={targetZ:t.z||0},i=this.unproject([0,this.height/2],e),o=this.unproject([this.width/2,0],e),a=this.unproject([this.width,this.height/2],e),r=this.unproject([this.width/2,this.height],e);return a[0]<this.longitude&&(a[0]+=360),i[0]>this.longitude&&(i[0]-=360),[Math.min(i[0],a[0],o[0],r[0]),Math.min(i[1],a[1],o[1],r[1]),Math.max(i[0],a[0],o[0],r[0]),Math.max(i[1],a[1],o[1],r[1])]}_getRayToGlobe(t,{topLeft:e=!0,targetZ:i}={}){let[o,a]=t,r=e?a:this.height-a,{pixelUnprojectionMatrix:n}=this,s=y(n,[o,r,-1,1]),l=y(n,[o,r,1,1]),h=u.uE(u.jb([],s,l)),c=u.uE(s),p=u.uE(l),g=(4*c*p-(h-c-p)**2)/16*4/h;return{rayStartPosition:s,rayEndPosition:l,radius:((i||0)/6370972+1)*256,rayLengthSquared:h,rayStartDistanceSquared:c,distanceToCenterSquared:g}}_getRayDistanceToGlobeCenterRatio(t,e){let{distanceToCenterSquared:i,radius:o}=this._getRayToGlobe(t,e);return Math.sqrt(Math.max(0,i))/o}getZoomAnchorStrength(t){let e=this._getRayDistanceToGlobeCenterRatio(t);if(e>=1.15)return 0;let i=Math.max(0,Math.min(1,(e-.75)/.3999999999999999));return 1-i*i*(3-2*i)}unproject(t,{topLeft:e=!0,targetZ:i}={}){let o,[a,r,n]=t,s=e?r:this.height-r,{pixelUnprojectionMatrix:l}=this;if(Number.isFinite(n))o=y(l,[a,s,n,1]);else{let{rayStartPosition:a,rayEndPosition:r,radius:n,rayLengthSquared:s,rayStartDistanceSquared:l,distanceToCenterSquared:h}=this._getRayToGlobe(t,{topLeft:e,targetZ:i}),c=(Math.sqrt(l-h)-Math.sqrt(Math.max(0,n*n-h)))/Math.sqrt(s);o=u.Cc([],a,r,c)}let[h,c,p]=this.unprojectPosition(o);return Number.isFinite(n)?[h,c,p]:Number.isFinite(i)?[h,c,i]:[h,c]}projectPosition(t){let[e,i,o=0]=t,a=e*f,r=i*f,n=Math.cos(r),s=(o/6370972+1)*256;return[Math.sin(a)*n*s,-Math.cos(a)*n*s,Math.sin(r)*s]}unprojectPosition(t){let[e,i,o]=t,a=u.Il(t);return[Math.atan2(e,-i)*b,Math.asin(o/a)*b,(a/256-1)*6370972]}projectFlat(t){return t}unprojectFlat(t){return t}panByPosition(t,e,i){if(!i){let i=this.getZoomAnchorStrength(e);if(0===i)return{longitude:this.longitude,latitude:this.latitude};let o=this.unproject(e),a=(0,m.zi)(t[0]-o[0]+180,360)-180,r=t[1]-o[1],n=Math.abs(o[1])>p.aH||Math.abs(a)>90;return v(this.bearing)&&n?{longitude:this.longitude,latitude:this.latitude}:(v(this.bearing)&&0!==r&&(i=Math.min(i,Math.max(0,((r>0?p.aH:-p.aH)-this.latitude)/r))),{longitude:this.longitude+a*i,latitude:Math.max(Math.min(this.latitude+r*i,90),-90)})}let[o,a,r]=t,n=.25/Math.pow(2,this.zoom-M(this.latitude)),s=o+n*(i[0]-e[0]),l=a-n*(i[1]-e[1]),h={longitude:s,latitude:l=Math.max(Math.min(l,90),-90),zoom:r-M(a)};return h.zoom+=M(h.latitude),h}}function M(t,e){return e&&(t=Math.max(Math.min(t,p.aH),-p.aH)),Math.log2(Math.PI*Math.cos(t*Math.PI/180))}function y(t,e){let i=c.Z0([],e,t);return c.hs(i,i,1/i[3]),i}x.displayName="GlobeViewport";var C=i(41367),P=i(31609),_=i(79433),w=i(58532),A=i(97564),k=i(60676),S=i(70053),E=i(22349),L=i(89607),I=i(76909),T=i(91504);class F extends T.M{static get ZERO(){return o||Object.freeze(o=new F(0,0,0,0)),o}constructor(t=0,e=0,i=0,o=0){super(-0,-0,-0,-0),(0,P.cy)(t)&&1==arguments.length?this.copy(t):(P.$W.debug&&((0,L.ws)(t),(0,L.ws)(e),(0,L.ws)(i),(0,L.ws)(o)),this[0]=t,this[1]=e,this[2]=i,this[3]=o)}set(t,e,i,o){return this[0]=t,this[1]=e,this[2]=i,this[3]=o,this.check()}copy(t){return this[0]=t[0],this[1]=t[1],this[2]=t[2],this[3]=t[3],this.check()}fromObject(t){return P.$W.debug&&((0,L.ws)(t.x),(0,L.ws)(t.y),(0,L.ws)(t.z),(0,L.ws)(t.w)),this[0]=t.x,this[1]=t.y,this[2]=t.z,this[3]=t.w,this}toObject(t){return t.x=this[0],t.y=this[1],t.z=this[2],t.w=this[3],t}get ELEMENTS(){return 4}get z(){return this[2]}set z(t){this[2]=(0,L.ws)(t)}get w(){return this[3]}set w(t){this[3]=(0,L.ws)(t)}transform(t){return(0,u.Z0)(this,this,t),this.check()}transformByMatrix3(t){return(0,I.vE)(this,this,t),this.check()}transformByMatrix2(t){return(0,I.Cg)(this,this,t),this.check()}transformByQuaternion(t){return(0,u.gL)(this,this,t),this.check()}applyMatrix4(t){return t.transform(this,this),this}}var V=i(61449);function z(){let t=new V.tb(4);return V.tb!=Float32Array&&(t[0]=0,t[1]=0,t[2]=0),t[3]=1,t}function R(t,e,i){let o=Math.sin(i*=.5);return t[0]=o*e[0],t[1]=o*e[1],t[2]=o*e[2],t[3]=Math.cos(i),t}function j(t,e,i){let o=e[0],a=e[1],r=e[2],n=e[3],s=i[0],l=i[1],h=i[2],u=i[3];return t[0]=o*u+n*s+a*h-r*l,t[1]=a*u+n*l+r*s-o*h,t[2]=r*u+n*h+o*l-a*s,t[3]=n*u-o*s-a*l-r*h,t}c.o8,c.fA,c.C,c.hZ;let D=c.WQ,O=c.hs,H=c.Om,B=c.Cc,q=c.Bw,Z=c.m3,U=c.S8;c.t2;let G=(a=u.vt(),r=u.fA(1,0,0),n=u.fA(0,1,0),function(t,e,i){let o=u.Om(e,i);return o<-.999999?(u.$A(a,r,e),1e-6>u.Il(a)&&u.$A(a,n,e),u.S8(a,a),R(t,a,Math.PI),t):o>.999999?(t[0]=0,t[1]=0,t[2]=0,t[3]=1,t):(u.$A(a,e,i),t[0]=a[0],t[1]=a[1],t[2]=a[2],t[3]=1+o,U(t,t))});z(),z(),s=new V.tb(9),V.tb!=Float32Array&&(s[1]=0,s[2]=0,s[3]=0,s[5]=0,s[6]=0,s[7]=0),s[0]=1,s[4]=1,s[8]=1;let N=[0,0,0,1];class W extends E.a{constructor(t=0,e=0,i=0,o=1){super(-0,-0,-0,-0),Array.isArray(t)&&1==arguments.length?this.copy(t):this.set(t,e,i,o)}copy(t){return this[0]=t[0],this[1]=t[1],this[2]=t[2],this[3]=t[3],this.check()}set(t,e,i,o){return this[0]=t,this[1]=e,this[2]=i,this[3]=o,this.check()}fromObject(t){return this[0]=t.x,this[1]=t.y,this[2]=t.z,this[3]=t.w,this.check()}fromMatrix3(t){return!function(t,e){let i,o=e[0]+e[4]+e[8];if(o>0)i=Math.sqrt(o+1),t[3]=.5*i,i=.5/i,t[0]=(e[5]-e[7])*i,t[1]=(e[6]-e[2])*i,t[2]=(e[1]-e[3])*i;else{let o=0;e[4]>e[0]&&(o=1),e[8]>e[3*o+o]&&(o=2);let a=(o+1)%3,r=(o+2)%3;i=Math.sqrt(e[3*o+o]-e[3*a+a]-e[3*r+r]+1),t[o]=.5*i,i=.5/i,t[3]=(e[3*a+r]-e[3*r+a])*i,t[a]=(e[3*a+o]+e[3*o+a])*i,t[r]=(e[3*r+o]+e[3*o+r])*i}}(this,t),this.check()}fromAxisRotation(t,e){return R(this,t,e),this.check()}identity(){return this[0]=0,this[1]=0,this[2]=0,this[3]=1,this.check()}setAxisAngle(t,e){return this.fromAxisRotation(t,e)}get ELEMENTS(){return 4}get x(){return this[0]}set x(t){this[0]=(0,L.ws)(t)}get y(){return this[1]}set y(t){this[1]=(0,L.ws)(t)}get z(){return this[2]}set z(t){this[2]=(0,L.ws)(t)}get w(){return this[3]}set w(t){this[3]=(0,L.ws)(t)}len(){return q(this)}lengthSquared(){return Z(this)}dot(t){return H(this,t)}rotationTo(t,e){return G(this,t,e),this.check()}add(t){return D(this,this,t),this.check()}calculateW(){let t,e,i;return t=this[0],e=this[1],i=this[2],this[0]=t,this[1]=e,this[2]=i,this[3]=Math.sqrt(Math.abs(1-t*t-e*e-i*i)),this.check()}conjugate(){return this[0]=-this[0],this[1]=-this[1],this[2]=-this[2],this[3]=this[3],this.check()}invert(){let t,e,i,o,a,r;return t=this[0],e=this[1],i=this[2],r=(a=t*t+e*e+i*i+(o=this[3])*o)?1/a:0,this[0]=-t*r,this[1]=-e*r,this[2]=-i*r,this[3]=o*r,this.check()}lerp(t,e,i){return void 0===i?this.lerp(this,t,e):(B(this,t,e,i),this.check())}multiplyRight(t){return j(this,this,t),this.check()}multiplyLeft(t){return j(this,t,this),this.check()}normalize(){let t=this.len(),e=t>0?1/t:0;return this[0]=this[0]*e,this[1]=this[1]*e,this[2]=this[2]*e,this[3]=this[3]*e,0===t&&(this[3]=1),this.check()}rotateX(t){var e;let i,o,a,r,n,s;return e=.5*t,i=this[0],o=this[1],a=this[2],r=this[3],n=Math.sin(e),s=Math.cos(e),this[0]=i*s+r*n,this[1]=o*s+a*n,this[2]=a*s-o*n,this[3]=r*s-i*n,this.check()}rotateY(t){var e;let i,o,a,r,n,s;return e=.5*t,i=this[0],o=this[1],a=this[2],r=this[3],n=Math.sin(e),s=Math.cos(e),this[0]=i*s-a*n,this[1]=o*s+r*n,this[2]=a*s+i*n,this[3]=r*s-o*n,this.check()}rotateZ(t){var e;let i,o,a,r,n,s;return e=.5*t,i=this[0],o=this[1],a=this[2],r=this[3],n=Math.sin(e),s=Math.cos(e),this[0]=i*s+o*n,this[1]=o*s-i*n,this[2]=a*s+r*n,this[3]=r*s-a*n,this.check()}scale(t){return O(this,this,t),this.check()}slerp(t,e,i){var o,a,r;let n,s,l,h,u,c,p,g,d,m,f,b,v,x,M,y;switch(arguments.length){case 1:({start:n=N,target:s,ratio:l}=t);break;case 2:n=this,s=t,l=e;break;default:n=t,s=e,l=i}return o=n,a=s,r=l,d=o[0],m=o[1],f=o[2],b=o[3],v=a[0],x=a[1],(h=d*v+m*x+f*(M=a[2])+b*(y=a[3]))<0&&(h=-h,v=-v,x=-x,M=-M,y=-y),1-h>V.p8?(g=Math.sin(u=Math.acos(h)),c=Math.sin((1-r)*u)/g,p=Math.sin(r*u)/g):(c=1-r,p=r),this[0]=c*d+p*v,this[1]=c*m+p*x,this[2]=c*f+p*M,this[3]=c*b+p*y,this.check()}transformVector4(t,e=new F){return(0,c.gL)(e,t,this),(0,L.qk)(e,4)}lengthSq(){return this.lengthSquared()}setFromAxisAngle(t,e){return this.setAxisAngle(t,e)}premultiply(t){return this.multiplyLeft(t)}multiply(t){return this.multiplyRight(t)}}var $=i(78715);let K=Math.PI/180,X=180/Math.PI;class Q{static toPosition(t,e){let i=e*K,o=t*K,a=Math.cos(i);return[a*Math.cos(o),a*Math.sin(o),Math.sin(i)]}static toLngLat(t){return[Math.atan2(t[1],t[0])*X,Math.asin((0,P.qE)(t[2],-1,1))*X]}static tangentBasis(t,e){let i=e*K,o=t*K,a=Math.sin(i),r=Math.sin(o),n=Math.cos(o);return{N:[-a*n,-a*r,Math.cos(i)],E:[-r,n,0]}}static upVector(t,e,i){let{N:o,E:a}=Q.tangentBasis(t,e),r=i*K,n=Math.cos(r),s=Math.sin(r);return[o[0]*n+a[0]*s,o[1]*n+a[1]*s,o[2]*n+a[2]*s]}static bearing(t,e,i){let{N:o,E:a}=Q.tangentBasis(e,i);return Math.atan2(u.Om(t,a),u.Om(t,o))*X}static cameraFrame(t,e,i){let o=Q.toPosition(t,e),a=Q.upVector(t,e,i),{N:r,E:n}=Q.tangentBasis(t,e),s=i*K,l=Math.cos(s),h=Math.sin(s),c=[n[0]*l-r[0]*h,n[1]*l-r[1]*h,n[2]*l-r[2]*h];return{position:o,up:a,axisHorizontal:u.$A([],o,c),axisVertical:u.$A([],o,a),longitude:t,latitude:e,bearing:i}}static angularDistance(t,e){let i=Q.toPosition(t.longitude,t.latitude),o=Q.toPosition(e.longitude,e.latitude);return Math.acos((0,P.qE)(u.Om(i,o),-1,1))}static greatCircleAxis(t,e){let i=Q.toPosition(t.longitude,t.latitude),o=Q.toPosition(e.longitude,e.latitude);return u.S8([],u.$A([],i,o))}static rotate(t,e,i){let o=new W().fromAxisRotation(e,i);return u.gL([],t,o)}static rotateFrame(t,e,i,o){let a=Q.rotate(t.position,t.axisHorizontal,e);a=Q.rotate(a,t.axisVertical,i);let r=Q.rotate(t.up,t.axisHorizontal,e);r=Q.rotate(r,t.axisVertical,i);let[n,s]=Q.toLngLat(a),l=o?0:Q.bearing(r,n,s);return{...t,position:a,up:r,longitude:n,latitude:s,bearing:l}}static rotateFrameToMatch(t,e,i,o=1){let a=Q.toPosition(...e),r=Q.toPosition(...i),n=u.$A([],a,r),s=u.Il(n),l=(0,P.qE)(u.Om(a,r),-1,1);if(s<1e-12){if(l>0)return t;n=u.$A([],a,t.up),1e-12>u.Il(n)&&(n=u.$A([],a,t.axisVertical))}u.S8(n,n);let h=Math.atan2(s,l)*(0,P.qE)(o,0,1),c=Q.rotate(t.position,n,h),p=Q.rotate(t.up,n,h),[g,d]=Q.toLngLat(c);return{...t,position:c,up:p,longitude:g,latitude:d,bearing:Q.bearing(p,g,d)}}}let Y=1/(1-Math.exp(-5)),J=t=>(1-Math.exp(-5*t))*Y;class tt extends $.A{constructor(t){let e="axis"in t;super({compare:["longitude","latitude"],extract:e?["longitude","latitude","zoom","bearing"]:["longitude","latitude","zoom"],required:["longitude","latitude"]}),e?(this._mode="rotation",this._axis=t.axis,this._totalAngle=t.totalAngle):(this._mode="linear",this._targetLongitude=t.targetLongitude)}initializeProps(t,e){let i=super.initializeProps(t,e);return this._startZoom=t.zoom,"rotation"===this._mode?this._startFrame={...Q.cameraFrame(t.longitude,t.latitude,t.bearing||0),axisHorizontal:this._axis}:i.end.longitude=this._targetLongitude,i}interpolateProps(t,e,i){if("rotation"===this._mode){let{longitude:t,latitude:e,bearing:o}=Q.rotateFrame(this._startFrame,this._totalAngle*i,0),a=this._startZoom+M(e,!0)-M(this._startFrame.latitude,!0);return{bearing:o,longitude:t,latitude:e,zoom:a}}let o=t.longitude+(e.longitude-t.longitude)*i,a=t.latitude+(e.latitude-t.latitude)*i,r=this._startZoom+M(a,!0)-M(t.latitude,!0);return{longitude:o,latitude:a,zoom:r}}}let te=Math.PI/180,ti=180/Math.PI;function to(t,e=0){return 512*Math.sin(Math.min(180,t)*te/2)*Math.pow(2,e)}function ta(t,e=0){return 2*Math.asin(Math.min(1,t/Math.pow(2,e)/256/2))*ti}class tr extends A.y{constructor(t){let{startPanPos:e,startPanCameraFrame:i,startPanAngularRate:o,...a}=t;a.normalize=!1,super(a);let r=this._state;void 0!==e&&(r.startPanPos=e),void 0!==i&&(r.startPanCameraFrame=i),void 0!==o&&(r.startPanAngularRate=o)}panStart({pos:t}){let{latitude:e,longitude:i,zoom:o,bearing:a=0}=this.getViewportProps(),r=Q.cameraFrame(i,e,a),n=Math.pow(2,o-M(e,!0));return this._getUpdatedState({startPanPos:t,startPanCameraFrame:r,startPanAngularRate:.25/n*te,startZoom:o})}pan({pos:t,startPos:e}){let i=this.getState(),o=i.startPanPos||e;if(!o)return this;let a=i.startPanCameraFrame,r=i.startPanAngularRate,n=i.startZoom??this.getViewportProps().zoom;if(!a||!r)return this;let s=o[0]-t[0],l=o[1]-t[1],h=Q.rotateFrame(a,s*r,-l*r),u=n+M(h.latitude,!0)-M(a.latitude,!0);return this._getUpdatedState({longitude:h.longitude,latitude:h.latitude,bearing:h.bearing,zoom:u})}panEnd(){return this._getUpdatedState({startPanPos:null,startPanCameraFrame:null,startPanAngularRate:null,startZoom:null})}_panFromCenter(t){let{width:e,height:i}=this.getViewportProps(),o=[e/2,i/2];return this.panStart({pos:o}).pan({pos:[o[0]+t[0],o[1]+t[1]]}).panEnd()}applyConstraints(t){let e=t[k.y];delete t[k.y];let{latitude:i,maxBounds:o}=t;if(t.zoom=this._constrainZoom(t.zoom,t),e){let i=this.makeViewport(t),o=i.getZoomAnchorStrength(e.screenPosition);if(o>0){let a=i.unproject(e.screenPosition),r=Q.cameraFrame(t.longitude,t.latitude,t.bearing||0),n=Q.rotateFrameToMatch(r,[a[0],a[1]],[e.position[0],e.position[1]],o);t.longitude=n.longitude,t.latitude=n.latitude,t.bearing=n.bearing}}(t.longitude<-180||t.longitude>180)&&(t.longitude=(0,m.zi)(t.longitude+180,360)-180),(t.bearing<-180||t.bearing>180)&&(t.bearing=(0,m.zi)(t.bearing+180,360)-180),t.latitude=(0,P.qE)(t.latitude,-90,90),t.pitch=(0,P.qE)(t.pitch,t.minPitch,t.maxPitch);let a=o?(0,w.CI)(t.width,t.height,t.maxBoundsPadding):null;if(o&&a&&(a.width>=0&&(t.longitude=(0,P.qE)(t.longitude,o[0][0],o[1][0])),a.height>=0&&(t.latitude=(0,P.qE)(t.latitude,o[0][1],o[1][1]))),o&&a){let e=this.makeViewport({...t,bearing:0,pitch:0}),r=(0,w.jo)(e,[t.longitude,t.latitude],a),n=t.zoom-M(i),s=o[1][0]-o[0][0],l=o[1][1]-o[0][1];if(a.height>=0&&l>0&&l<180){let e=Math.min(ta(a.height,n),l),i=a.height?e*r.bottom/a.height:ta(r.bottom,n),s=a.height?e*r.top/a.height:ta(r.top,n);t.latitude=(0,P.qE)(t.latitude,o[0][1]+i,o[1][1]-s)}if(a.width>=0&&s>0&&s<360){let e=Math.min(ta(a.width/Math.cos(t.latitude*te),n),s),i=a.width?e*r.left/a.width:ta(r.left/Math.cos(t.latitude*te),n),l=a.width?e*r.right/a.width:ta(r.right/Math.cos(t.latitude*te),n);t.longitude=(0,P.qE)(t.longitude,o[0][0]+i,o[1][0]-l)}}return t.latitude=(0,P.qE)(t.latitude,-90,90),t.latitude!==i&&(t.zoom+=M(t.latitude,!0)-M(i,!0)),t}_constrainZoom(t,e){e||(e=this.getViewportProps());let{maxZoom:i,maxBounds:o}=e,{minZoom:a}=e;if(null!==o&&e.width>0&&e.height>0){let t=(0,w.CI)(e.width,e.height,e.maxBoundsPadding),r=o[0][1],n=o[1][1],s=Math.sign(r)===Math.sign(n)?Math.min(Math.abs(r),Math.abs(n)):0,l=M(0),h=to(o[1][0]-o[0][0])*Math.cos(s*te),u=to(o[1][1]-o[0][1]);t.width>0&&h>0&&(a=Math.max(a,Math.log2(t.width/h)+l)),t.height>0&&u>0&&(a=Math.max(a,Math.log2(t.height/u)+l)),a>i&&(a=i)}let r=M(e.latitude,!0)-M(0,!0);return(0,P.qE)(t,a+r,i+r)}}class tn extends _.A{constructor(){super(...arguments),this.ControllerState=tr,this.transition={transitionDuration:300,transitionInterpolator:new S.A({transitionProps:{compare:["longitude","latitude","zoom","bearing","pitch"],required:["longitude","latitude","zoom"]}})},this.dragMode="pan",this._panHistory=[]}_onPanStart(t){return this._panHistory=[],super._onPanStart(t)}_onMultiPanStart(t){return this._panHistory=[],super._onMultiPanStart(t)}_onPanMove(t){if(!this.dragPan)return!1;let e=this.getCenter(t),i=this.controllerState.pan({pos:e});this.updateViewport(i,{transitionDuration:0},{isDragging:!0,isPanning:!0});let{longitude:o,latitude:a}=i.getViewportProps();return this._panHistory.push({longitude:o,latitude:a,timestamp:Date.now()}),this._panHistory.length>5&&this._panHistory.shift(),!0}_onPanMoveEnd(t){let{inertia:e}=this;if(this.dragPan&&e&&this._panHistory.length>=2){let t=this._panHistory[0],i=this._panHistory[this._panHistory.length-1],o=i.timestamp-t.timestamp;if(o>0){let a=this.controllerState.getViewportProps(),r=Q.angularDistance(t,i)/o;if(r>1e-6){let o=r*e/2,n=Q.greatCircleAxis(t,i),s=Q.cameraFrame(a.longitude,a.latitude,a.bearing||0),l=Q.rotateFrame({...s,axisHorizontal:n},o,0),h=l.longitude,u=(0,P.qE)(l.latitude,-90,90),c=new tt({axis:n,totalAngle:o}),p=this.controllerState.panEnd();return this.updateViewport(p,{transitionInterpolator:c,transitionDuration:e,transitionEasing:J,longitude:h,latitude:u},{isDragging:!1,isPanning:!0}),this._panHistory=[],!0}}}this._panHistory=[];let i=this.controllerState.panEnd();return this.updateViewport(i,null,{isDragging:!1,isPanning:!1}),!0}}let ts={cullMode:"back"};class tl extends l.A{constructor(t={}){super({...t,parameters:{...ts,...t.parameters}})}getViewportType(t){return t.zoom>12?C.A:x}get ControllerType(){return tn}}tl.displayName="GlobeView";let th=tl},80008(t,e,i){i.d(e,{A:()=>P});var o=i(41881),a=i(46487),r=i(84175),n=i(95335),s=i(95263);function l(t,e){if(!t)throw Error(e||"@math.gl/web-mercator: assertion failed.")}let h=Math.PI,u=h/4,c=h/180;function p(t){let[e,i]=t;l(Number.isFinite(e)),l(Number.isFinite(i)&&i>=-90&&i<=90,"invalid latitude");let o=512*(h+Math.log(Math.tan(u+i*c*.5)))/(2*h);return[512*(e*c+h)/(2*h),o]}function g(t,e,i){return Array.isArray(t)||ArrayBuffer.isView(t)&&!(t instanceof DataView)?t.map((t,o)=>g(t,e[o],i)):i*e+(1-i)*t}globalThis.mathgl=globalThis.mathgl||{config:{EPSILON:1e-12,debug:!1,precision:4,printTypes:!1,printDegrees:!1,printRowMajor:!0,_cartographicRadians:!1}},globalThis.mathgl.config;let d=new Uint32Array([0,2,1,0,3,2]),m=new Float32Array([0,1,0,0,1,0,1,1]),f=`\
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
`,vs:f,fs:f,uniformTypes:{bounds:"vec4<f32>",coordinateConversion:"f32",desaturate:"f32",tintColor:"vec3<f32>",transparentColor:"vec4<f32>"}},v=`\
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
`,x=`\
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
`,M=`
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

${M}

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
`;class C extends o.A{getShaders(){return super.getShaders({vs:x,fs:y,source:v,modules:[a.A,r.A,n.Ay,b]})}initializeState(){this.getAttributeManager().add({indices:{size:1,isIndexed:!0,update:t=>t.value=this.state.mesh.indices,noAlloc:!0},positions:{size:3,type:"float64",fp64:this.use64bitPositions(),update:t=>t.value=this.state.mesh.positions,noAlloc:!0},texCoords:{size:2,update:t=>t.value=this.state.mesh.texCoords,noAlloc:!0}})}updateState({props:t,oldProps:e,changeFlags:i}){let o=this.getAttributeManager();if(i.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),o.invalidateAll()),t.bounds!==e.bounds){let t=this.state.mesh,e=this._createMesh();for(let i in this.state.model.setVertexCount(e.vertexCount),e)t&&t[i]!==e[i]&&o.invalidate(i);this.setState({mesh:e,...this._getCoordinateUniforms()})}else t._imageCoordinateSystem!==e._imageCoordinateSystem&&this.setState(this._getCoordinateUniforms())}getPickingInfo(t){let{image:e}=this.props,i=t.info;if(!i.color||!e)return i.bitmap=null,i;let{width:o,height:a}=e;i.index=0;let r=function(t){let[e,i,o]=t;return[(e+(15&o)/16)/256,(i+(240&o)/256)/256]}(i.color);return i.bitmap={size:{width:o,height:a},uv:r,pixel:[Math.floor(r[0]*o),Math.floor(r[1]*a)]},i}disablePickingIndex(){this.setState({disablePicking:!0})}restorePickingColors(){this.setState({disablePicking:!1})}_updateAutoHighlight(t){super._updateAutoHighlight({...t,color:this.encodePickingColor(0)})}_createMesh(){let{bounds:t}=this.props,e=t;return _(t)&&(e=[[t[0],t[1]],[t[0],t[3]],[t[2],t[3]],[t[2],t[1]]]),function(t,e){if(!e){var i,o,a,r=t;let e=new Float64Array(12);for(let t=0;t<r.length;t++)e[3*t+0]=r[t][0],e[3*t+1]=r[t][1],e[3*t+2]=r[t][2]||0;return{vertexCount:6,positions:e,indices:d,texCoords:m}}let n=Math.max(Math.abs(t[0][0]-t[3][0]),Math.abs(t[1][0]-t[2][0])),s=Math.max(Math.abs(t[1][1]-t[0][1]),Math.abs(t[2][1]-t[3][1])),l=Math.ceil(n/e)+1,h=Math.ceil(s/e)+1,u=(l-1)*(h-1)*6,c=new Uint32Array(u),p=new Float32Array(l*h*2),f=new Float64Array(l*h*3),b=0,v=0;for(let e=0;e<l;e++){let r=e/(l-1);for(let n=0;n<h;n++){let s=n/(h-1),l=(i=t,o=r,a=s,g(g(i[0],i[1],a),g(i[3],i[2],a),o));f[3*b+0]=l[0],f[3*b+1]=l[1],f[3*b+2]=l[2]||0,p[2*b+0]=r,p[2*b+1]=1-s,e>0&&n>0&&(c[v++]=b-h,c[v++]=b-h-1,c[v++]=b-1,c[v++]=b-h,c[v++]=b-1,c[v++]=b),b++}}return{vertexCount:u,positions:f,indices:c,texCoords:p}}(e,this.context.viewport.resolution)}_getModel(){let t="webgpu"===this.context.device.type?this.getAttributeManager().getBufferLayouts({isInstanced:!1}).filter(t=>"indices"!==t.name):this.getAttributeManager().getBufferLayouts();return new s.K(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:t,topology:"triangle-list",isInstanced:!1})}draw(t){let{shaderModuleProps:e}=t,{model:i,coordinateConversion:o,bounds:a,disablePicking:r}=this.state,{image:n,desaturate:s,transparentColor:l,tintColor:h}=this.props;if((!e.picking.isActive||!r)&&n&&i){let t={bitmapTexture:n,bounds:a,coordinateConversion:o,desaturate:s,tintColor:h.slice(0,3).map(t=>t/255),transparentColor:l.map(t=>t/255)};i.shaderInputs.setProps({bitmap:t}),i.draw(this.context.renderPass)}}_getCoordinateUniforms(){let{_imageCoordinateSystem:t}=this.props;if("default"!==t){let{bounds:e}=this.props;if(!_(e))throw Error("_imageCoordinateSystem only supports rectangular bounds");let i=this.context.viewport.resolution?"lnglat":"cartesian";if("lnglat"==(t="lnglat"===t?"lnglat":"cartesian")&&"cartesian"===i)return{coordinateConversion:-1,bounds:e};if("cartesian"===t&&"lnglat"===i){let t=p([e[0],e[1]]),i=p([e[2],e[3]]);return{coordinateConversion:1,bounds:[t[0],t[1],i[0],i[1]]}}}return{coordinateConversion:0,bounds:[0,0,0,0]}}}C.layerName="BitmapLayer",C.defaultProps={image:{type:"image",value:null,async:!0},bounds:{type:"array",value:[1,0,0,1],compare:!0},_imageCoordinateSystem:"default",desaturate:{type:"number",min:0,max:1,value:0},transparentColor:{type:"color",value:[0,0,0,0]},tintColor:{type:"color",value:[255,255,255]},textureParameters:{type:"object",ignore:!0,value:null}};let P=C;function _(t){return Number.isFinite(t[0])}}}]);