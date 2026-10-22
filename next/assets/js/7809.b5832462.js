"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["7809"],{98566(t,e,o){o.d(e,{A:()=>y});var i=o(12041),s=o(47345),r=o(41534),n=o(78883),a=o(25667);let l=Math.PI/180;class c extends s.A{constructor(t){let{height:e,projectionMatrix:o,fovy:i=50,orbitAxis:s="Z",target:a=[0,0,0],rotationX:c=0,rotationOrbit:p=0,zoom:h=0}=t,g=o?o[5]/2:(0,n.wZ)(i);super({...t,longitude:void 0,viewMatrix:function({height:t,focalDistance:e,orbitAxis:o,rotationX:i,rotationOrbit:s,zoom:n}){let a=new r.k().lookAt({eye:"Z"===o?[0,-e,0]:[0,0,e],up:"Z"===o?[0,0,1]:[0,1,0]});a.rotateX(i*l),"Z"===o?a.rotateZ(s*l):a.rotateY(s*l);let c=Math.pow(2,n)/t;return a.scale(c),a}({height:e||1,focalDistance:g,orbitAxis:s,rotationX:c,rotationOrbit:p,zoom:h}),fovy:i,focalDistance:g,position:a,zoom:h}),this.target=a,this.orbitAxis=s,this.rotationX=c,this.rotationOrbit=p,this.fovy=i,this.projectedCenter=this.project(this.center)}unproject(t,{topLeft:e=!0}={}){let[o,i,s=this.projectedCenter[2]]=t,r=e?i:this.height-i,[a,l,c]=(0,n.xJ)([o,r,s],this.pixelUnprojectionMatrix);return[a,l,c]}panByPosition(t,e,o){let i=this.project(t),{near:s,far:r}=(0,a.om)(this.projectionMatrix),n=s*r/(r-i[2]*(r-s))/(s*r/(r-this.projectedCenter[2]*(r-s))),l=[this.width/2+(i[0]-e[0])*n,this.height/2+(i[1]-e[1])*n,this.projectedCenter[2]];return{target:this.unproject(l)}}}c.displayName="OrbitViewport";var p=o(31609),h=o(79433),g=o(60676),u=o(58532),d=o(70053);class m extends g.A{constructor(t){let{width:e,height:o,rotationX:i=0,rotationOrbit:s=0,target:r=[0,0,0],zoom:n=0,minRotationX:a=-90,maxRotationX:l=90,minZoom:c=-1/0,maxZoom:p=1/0,maxBounds:h=null,maxBoundsPadding:g=null,startPanPosition:u,startRotatePos:d,startRotationX:m,startRotationOrbit:f,startZoomPosition:v,startZoom:y}=t;super({width:e,height:o,rotationX:i,rotationOrbit:s,target:r,zoom:n,minRotationX:a,maxRotationX:l,minZoom:c,maxZoom:p,maxBounds:h,maxBoundsPadding:g},{startPanPosition:u,startRotatePos:d,startRotationX:m,startRotationOrbit:f,startZoomPosition:v,startZoom:y},t.makeViewport),this.unproject3D=t.unproject3D}panStart({pos:t}){return this._getUpdatedState({startPanPosition:this._unproject(t)})}pan({pos:t,startPosition:e}){let o=this.getState().startPanPosition||e;if(!o)return this;let i=this.makeViewport(this.getViewportProps()).panByPosition(o,t);return this._getUpdatedState(i)}panEnd(){return this._getUpdatedState({startPanPosition:null})}rotateStart({pos:t}){return this._getUpdatedState({startRotatePos:t,startRotationX:this.getViewportProps().rotationX,startRotationOrbit:this.getViewportProps().rotationOrbit})}rotate({pos:t,deltaAngleX:e=0,deltaAngleY:o=0}){let i,{startRotatePos:s,startRotationX:r,startRotationOrbit:n}=this.getState(),{width:a,height:l}=this.getViewportProps();if(!s||void 0===r||void 0===n)return this;if(t){let e=(t[0]-s[0])/a;(r<-90||r>90)&&(e*=-1),i={rotationX:r+180*((t[1]-s[1])/l),rotationOrbit:n+180*e}}else i={rotationX:r+o,rotationOrbit:n+e};return this._getUpdatedState(i)}rotateEnd(){return this._getUpdatedState({startRotationX:null,startRotationOrbit:null})}shortestPathFrom(t){let e=t.getViewportProps(),o={...this.getViewportProps()},{rotationOrbit:i}=o;return Math.abs(i-e.rotationOrbit)>180&&(o.rotationOrbit=i<0?i+360:i-360),o}zoomStart({pos:t}){return this._getUpdatedState({startZoomPosition:this._unproject(t),startZoom:this.getViewportProps().zoom})}zoom({pos:t,startPos:e,scale:o}){let{startZoom:i,startZoomPosition:s}=this.getState();if(s||(i=this.getViewportProps().zoom,s=this._unproject(e||t)),!s)return this;let r=this._calculateNewZoom({scale:o,startZoom:i}),n=this.makeViewport({...this.getViewportProps(),zoom:r});return this._getUpdatedState({zoom:r,...n.panByPosition(s,t)})}zoomEnd(){return this._getUpdatedState({startZoomPosition:null,startZoom:null})}zoomIn(t=2){return this._getUpdatedState({zoom:this._calculateNewZoom({scale:t})})}zoomOut(t=2){return this._getUpdatedState({zoom:this._calculateNewZoom({scale:1/t})})}moveLeft(t=50){return this._panFromCenter([-t,0])}moveRight(t=50){return this._panFromCenter([t,0])}moveUp(t=50){return this._panFromCenter([0,-t])}moveDown(t=50){return this._panFromCenter([0,t])}rotateLeft(t=15){return this._getUpdatedState({rotationOrbit:this.getViewportProps().rotationOrbit-t})}rotateRight(t=15){return this._getUpdatedState({rotationOrbit:this.getViewportProps().rotationOrbit+t})}rotateUp(t=10){return this._getUpdatedState({rotationX:this.getViewportProps().rotationX-t})}rotateDown(t=10){return this._getUpdatedState({rotationX:this.getViewportProps().rotationX+t})}_project(t){return this.makeViewport(this.getViewportProps()).project(t)}_unproject(t){let e=this.unproject3D?.(t);return e||this.makeViewport(this.getViewportProps()).unproject(t)}_calculateNewZoom({scale:t,startZoom:e}){void 0===e&&(e=this.getViewportProps().zoom);let o=e+Math.log2(t);return this._constrainZoom(o)}_panFromCenter(t){let{target:e}=this.getViewportProps(),o=this._project(e);return this.pan({startPosition:e,pos:[o[0]+t[0],o[1]+t[1]]})}_getUpdatedState(t){return new this.constructor({makeViewport:this.makeViewport,...this.getViewportProps(),...this.getState(),...t})}applyConstraints(t){let{maxRotationX:e,minRotationX:o,rotationOrbit:i}=t;return t.zoom=this._constrainZoom(t.zoom,t),t.rotationX=(0,p.qE)(t.rotationX,o,e),(i<-180||i>180)&&(t.rotationOrbit=(0,a.zi)(i+180,360)-180),t.target=this._constrainTarget(t),t}_constrainZoom(t,e){e||(e=this.getViewportProps());let{maxZoom:o,maxBounds:i}=e,{minZoom:s}=e;if(i&&e.width>0&&e.height>0){let r=(0,u.CI)(e.width,e.height,e.maxBoundsPadding),n=[];if(r.width>0||r.height>0){let a=this.makeViewport({...e,zoom:t}),l=(0,u.jo)(a,e.target,r);r.width>0&&n.push(l.left,l.right),r.height>0&&n.push(l.top,l.bottom);let c=2*Math.min(...n),p=i[1][0]-i[0][0],h=i[1][1]-i[0][1],g=(i[1][2]??0)-(i[0][2]??0),d=Math.sqrt(p*p+h*h+g*g);c>0&&d>0&&(s=Math.max(s,Math.log2(c/d)))>o&&(s=o)}}return(0,p.qE)(t,s,o)}_constrainTarget(t){let{target:e,maxBounds:o}=t;if(!o)return e;let i=(0,u.CI)(t.width,t.height,t.maxBoundsPadding);if(i.width<0||i.height<0)return e;let[[s,r,n=0],[a,l,c=0]]=o;if(e[0]>=s&&e[0]<=a&&e[1]>=r&&e[1]<=l&&e[2]>=n&&e[2]<=c)return e;let h=this.makeViewport?.(t);if(h){let{cameraPosition:t}=h,o=t[0]-e[0],i=t[1]-e[1],g=t[2]-e[2],u=o*e[0]+i*e[1]+g*e[2],d=o*(o>=0?s:a)+i*(i>=0?r:l)+g*(g>=0?n:c),m=o*(o>=0?a:s)+i*(i>=0?l:r)+g*(g>=0?c:n);if((o||i||g)&&u>=d&&u<=m){let t=t=>(0,p.qE)(t,s,a),h=t=>(0,p.qE)(t,r,l),d=t=>(0,p.qE)(t,n,c),m=s=>o*t(e[0]-s*o)+i*h(e[1]-s*i)+g*d(e[2]-s*g)-u,f=-1,v=1,y=m(-1),x=m(v);for(;y<0;)v=f,x=y,f*=2,y=m(f);for(;x>0;)f=v,y=x,v*=2,x=m(v);for(let t=0;t<30;t++){let t=(f+v)/2;m(t)>0?f=t:v=t}let C=(f+v)/2;return[t(e[0]-C*o),h(e[1]-C*i),d(e[2]-C*g)]}}return[(0,p.qE)(e[0],s,a),(0,p.qE)(e[1],r,l),(0,p.qE)(e[2],n,c)]}}class f extends h.A{constructor(){super(...arguments),this.ControllerState=m,this.transition={transitionDuration:300,transitionInterpolator:new d.A({transitionProps:{compare:["target","zoom","rotationX","rotationOrbit"],required:["target","zoom"]}})},this._unproject3D=t=>{if(this.pickPosition){let{x:e,y:o}=this.props,i=this.pickPosition(e+t[0],o+t[1]);if(i&&i.coordinate)return i.coordinate}return null}}setProps(t){t.unproject3D=this._unproject3D,super.setProps(t)}}class v extends i.A{constructor(t={}){super(t),this.props.orbitAxis=t.orbitAxis||"Z"}getViewportType(){return c}get ControllerType(){return f}}v.displayName="OrbitView";let y=v},19751(t,e,o){o.d(e,{A:()=>u});var i=o(59452),s=o(3459),r=o(53439),n=o(91844),a=o(19896),l=o(26166),c=o(6053);let p=[0,0,0,255],h={stroked:!0,filled:!0,extruded:!1,elevationScale:1,wireframe:!1,_normalize:!0,_windingOrder:"CW",lineWidthUnits:"meters",lineWidthScale:1,lineWidthMinPixels:0,lineWidthMaxPixels:Number.MAX_SAFE_INTEGER,lineJointRounded:!1,lineMiterLimit:4,lineAntialiasing:!1,getPolygon:{type:"accessor",value:t=>t.polygon},getFillColor:{type:"accessor",value:[0,0,0,255]},getLineColor:{type:"accessor",value:p},getLineWidth:{type:"accessor",value:1},getElevation:{type:"accessor",value:1e3},material:!0};class g extends i.A{initializeState(){this.state={paths:[],pathsDiff:null},this.props.getLineDashArray&&s.A.removed("getLineDashArray","PathStyleExtension")()}updateState({changeFlags:t}){let e=t.dataChanged||t.updateTriggersChanged&&(t.updateTriggersChanged.all||t.updateTriggersChanged.getPolygon);if(e&&Array.isArray(t.dataChanged)){let e=this.state.paths.slice(),o=t.dataChanged.map(t=>(0,c.J)({data:e,getIndex:t=>t.__source.index,dataRange:t,replace:this._getPaths(t)}));this.setState({paths:e,pathsDiff:o})}else e&&this.setState({paths:this._getPaths(),pathsDiff:null})}_getPaths(t={}){let{data:e,getPolygon:o,positionFormat:i,_normalize:s}=this.props,n=[],a="XY"===i?2:3,{startRow:c,endRow:p}=t,{iterable:h,objectInfo:g}=(0,r.X)(e,c,p);for(let t of h){g.index++;let e=o(t,g);s&&(e=l.S8(e,a));let{holeIndices:i}=e,r=e.positions||e;if(i)for(let e=0;e<=i.length;e++){let o=r.slice(i[e-1]||0,i[e]||r.length);n.push(this.getSubLayerRow({path:o},t,g.index))}else n.push(this.getSubLayerRow({path:r},t,g.index))}return n}renderLayers(){let{data:t,_dataDiff:e,stroked:o,filled:i,extruded:s,wireframe:r,_normalize:l,_windingOrder:c,elevationScale:h,transitions:g,positionFormat:u}=this.props,{lineWidthUnits:d,lineWidthScale:m,lineWidthMinPixels:f,lineWidthMaxPixels:v,lineJointRounded:y,lineMiterLimit:x,lineAntialiasing:C,lineDashJustified:M}=this.props,{getFillColor:_,getLineColor:P,getLineWidth:b,getLineDashArray:w,getElevation:S,getPolygon:A,updateTriggers:T,material:L}=this.props,{paths:j,pathsDiff:z}=this.state,O=this.getSubLayerClass("fill",n.A),k=this.getSubLayerClass("stroke",a.A),I=this.shouldRenderSubLayer("fill",j)&&new O({_dataDiff:e,extruded:s,elevationScale:h,filled:i,wireframe:r,_normalize:l,_windingOrder:c,getElevation:S,getFillColor:_,getLineColor:s&&r?P:p,material:L,transitions:g},this.getSubLayerProps({id:"fill",updateTriggers:T&&{getPolygon:T.getPolygon,getElevation:T.getElevation,getFillColor:T.getFillColor,lineColors:s&&r,getLineColor:T.getLineColor}}),{data:t,positionFormat:u,getPolygon:A}),V=!s&&o&&this.shouldRenderSubLayer("stroke",j)&&new k({_dataDiff:z&&(()=>z),widthUnits:d,widthScale:m,widthMinPixels:f,widthMaxPixels:v,jointRounded:y,miterLimit:x,antialiasing:C,dashJustified:M,_pathType:"loop",transitions:g&&{getWidth:g.getLineWidth,getColor:g.getLineColor,getPath:g.getPolygon},getColor:this.getSubLayerAccessor(P),getWidth:this.getSubLayerAccessor(b),getDashArray:this.getSubLayerAccessor(w)},this.getSubLayerProps({id:"stroke",updateTriggers:T&&{getWidth:T.getLineWidth,getColor:T.getLineColor,getDashArray:T.getLineDashArray}}),{data:j,positionFormat:u,getPath:t=>t.path});return[!s&&I,V,s&&I]}}g.layerName="PolygonLayer",g.defaultProps=h;let u=g},95337(t,e,o){o.d(e,{A:()=>z});var i=o(3459),s=o(41881),r=o(84175),n=o(46487),a=o(98881),l=o(66925),c=o(79439),p=o(38846);let h={name:"phongMaterial",firstBindingSlot:0,bindingLayout:[{name:"phongMaterial",group:3}],dependencies:[l.x,a.$n],source:c.X,vs:p.X,fs:p.l,defines:{LIGHTING_FRAGMENT:!0},uniformTypes:{unlit:"i32",ambient:"f32",diffuse:"f32",shininess:"f32",specularColor:"vec3<f32>"},defaultUniforms:{unlit:!1,ambient:.35,diffuse:.6,shininess:32,specularColor:[38.25,38.25,38.25]},getUniforms:t=>({...h.defaultUniforms,...t})};var g=o(95335),u=o(80698),d=o(25337),m=o(95263),f=o(53439);let v=Math.PI/180,y=new Float32Array(16),x=new Float32Array(12);function C(t,e,o){let i=e[0]*v,s=e[1]*v,r=e[2]*v,n=Math.sin(r),a=Math.sin(i),l=Math.sin(s),c=Math.cos(r),p=Math.cos(i),h=Math.cos(s),g=o[0],u=o[1],d=o[2];t[0]=g*h*p,t[1]=g*l*p,t[2]=-(g*a),t[3]=u*(-l*c+h*a*n),t[4]=u*(h*c+l*a*n),t[5]=u*p*n,t[6]=d*(l*n+h*a*c),t[7]=d*(-h*n+l*a*c),t[8]=d*p*c}function M(t){return t[0]=t[0],t[1]=t[1],t[2]=t[2],t[3]=t[4],t[4]=t[5],t[5]=t[6],t[6]=t[8],t[7]=t[9],t[8]=t[10],t[9]=t[12],t[10]=t[13],t[11]=t[14],t.subarray(0,12)}let _={size:12,accessor:["getOrientation","getScale","getTranslation","getTransformMatrix"],shaderAttributes:{instanceModelMatrixCol0:{size:3,elementOffset:0},instanceModelMatrixCol1:{size:3,elementOffset:3},instanceModelMatrixCol2:{size:3,elementOffset:6},instanceTranslation:{size:3,elementOffset:9}},update(t,{startRow:e,endRow:o}){let{data:i,getOrientation:s,getScale:r,getTranslation:n,getTransformMatrix:a}=this.props,l=Array.isArray(a),c=l&&16===a.length,p=Array.isArray(r),h=Array.isArray(s),g=Array.isArray(n),u=c||!l&&!!a(i[0]);u?t.constant=c:t.constant=h&&p&&g;let d=t.value;if(t.constant){let e;u?(y.set(a),e=M(y)):(C(e=x,s,r),e.set(n,9)),t.value=new Float32Array(e)}else{let l=e*t.size,{iterable:m,objectInfo:v}=(0,f.X)(i,e,o);for(let t of m){let e;(v.index++,u)?(y.set(c?a:a(t,v)),e=M(y)):(C(e=x,h?s:s(t,v),p?r:r(t,v)),e.set(g?n:n(t,v),9)),d[l++]=e[0],d[l++]=e[1],d[l++]=e[2],d[l++]=e[3],d[l++]=e[4],d[l++]=e[5],d[l++]=e[6],d[l++]=e[7],d[l++]=e[8],d[l++]=e[9],d[l++]=e[10],d[l++]=e[11]}}}},P=`\
layout(std140) uniform simpleMeshUniforms {
  float sizeScale;
  bool composeModelMatrix;
  bool hasTexture;
  bool flatShading;
} simpleMesh;
`,b={name:"simpleMesh",source:`\
struct SimpleMeshUniforms {
  sizeScale: f32,
  composeModelMatrix: f32,
  hasTexture: f32,
  flatShading: f32,
};

@group(0) @binding(auto) var<uniform> simpleMesh: SimpleMeshUniforms;
@group(0) @binding(auto) var simpleMeshTexture: texture_2d<f32>;
@group(0) @binding(auto) var simpleMeshTextureSampler: sampler;
`,vs:P,fs:P,uniformTypes:{sizeScale:"f32",composeModelMatrix:"f32",hasTexture:"f32",flatShading:"f32"}},w=`#version 300 es
#define SHADER_NAME simple-mesh-layer-vs
in vec3 positions;
in vec3 normals;
in vec3 colors;
in vec2 texCoords;
in vec3 instancePositions;
in vec3 instancePositions64Low;
in vec4 instanceColors;
in vec3 instanceModelMatrixCol0;
in vec3 instanceModelMatrixCol1;
in vec3 instanceModelMatrixCol2;
in vec3 instanceTranslation;
out vec2 vTexCoord;
out vec3 cameraPosition;
out vec3 normals_commonspace;
out vec4 position_commonspace;
out vec4 vColor;
void main(void) {
geometry.worldPosition = instancePositions;
geometry.uv = texCoords;
geometry.pickingColor = picking_getPickingColorFromInstanceID();
vTexCoord = texCoords;
cameraPosition = project.cameraPosition;
vColor = vec4(colors * instanceColors.rgb, instanceColors.a);
mat3 instanceModelMatrix = mat3(instanceModelMatrixCol0, instanceModelMatrixCol1, instanceModelMatrixCol2);
vec3 pos = (instanceModelMatrix * positions) * simpleMesh.sizeScale + instanceTranslation;
if (simpleMesh.composeModelMatrix) {
DECKGL_FILTER_SIZE(pos, geometry);
normals_commonspace = project_normal(instanceModelMatrix * normals);
geometry.worldPosition += pos;
gl_Position = project_position_to_clipspace(pos + instancePositions, instancePositions64Low, vec3(0.0), position_commonspace);
geometry.position = position_commonspace;
}
else {
pos = project_size(pos);
DECKGL_FILTER_SIZE(pos, geometry);
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, pos, position_commonspace);
geometry.position = position_commonspace;
normals_commonspace = project_normal(instanceModelMatrix * normals);
}
geometry.normal = normals_commonspace;
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,S=`#version 300 es
#define SHADER_NAME simple-mesh-layer-fs
precision highp float;
uniform sampler2D sampler;
in vec2 vTexCoord;
in vec3 cameraPosition;
in vec3 normals_commonspace;
in vec4 position_commonspace;
in vec4 vColor;
out vec4 fragColor;
void main(void) {
geometry.uv = vTexCoord;
vec3 normal;
if (simpleMesh.flatShading) {
normal = normalize(cross(dFdx(position_commonspace.xyz), dFdy(position_commonspace.xyz)));
} else {
normal = normals_commonspace;
}
vec4 color = simpleMesh.hasTexture ? texture(sampler, vTexCoord) : vColor;
DECKGL_FILTER_COLOR(color, geometry);
vec3 lightColor = lighting_getLightColor(color.rgb, cameraPosition, position_commonspace.xyz, normal);
fragColor = vec4(lightColor, color.a * layer.opacity);
}
`,A=`\
struct Attributes {
  @builtin(instance_index) instanceIndex: u32,
  @location(0) positions: vec3<f32>,
  @location(1) normals: vec3<f32>,
  @location(2) colors: vec3<f32>,
  @location(3) texCoords: vec2<f32>,
  @location(4) instancePositions: vec3<f32>,
  @location(5) instancePositions64Low: vec3<f32>,
  @location(6) instanceColors: vec4<f32>,
  @location(7) instanceModelMatrixCol0: vec3<f32>,
  @location(8) instanceModelMatrixCol1: vec3<f32>,
  @location(9) instanceModelMatrixCol2: vec3<f32>,
  @location(10) instanceTranslation: vec3<f32>,
};

struct Varyings {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) texCoords: vec2<f32>,
  @location(2) normal: vec3<f32>,
  @location(3) positionCommon: vec3<f32>,
  @location(4) pickingColor: vec3<f32>,
};

@vertex
fn vertexMain(attributes: Attributes) -> Varyings {
  var varyings: Varyings;

  geometry.worldPosition = attributes.instancePositions;
  geometry.uv = attributes.texCoords;
  geometry.pickingColor = picking_getPickingColorFromIndex(attributes.instanceIndex);

  let instanceModelMatrix = mat3x3<f32>(
    attributes.instanceModelMatrixCol0,
    attributes.instanceModelMatrixCol1,
    attributes.instanceModelMatrixCol2
  );
  let meshPosition =
    (instanceModelMatrix * attributes.positions) * simpleMesh.sizeScale +
    attributes.instanceTranslation;

  if (simpleMesh.composeModelMatrix > 0.5) {
    geometry.normal = project_normal(instanceModelMatrix * attributes.normals);
    geometry.worldPosition += meshPosition;
    let projected = project_position_to_clipspace_and_commonspace(
      attributes.instancePositions + meshPosition,
      attributes.instancePositions64Low,
      vec3<f32>(0.0)
    );
    geometry.position = projected.commonPosition;
    varyings.position = projected.clipPosition;
  } else {
    let projected = project_position_to_clipspace_and_commonspace(
      attributes.instancePositions,
      attributes.instancePositions64Low,
      project_size_vec3(meshPosition)
    );
    geometry.position = projected.commonPosition;
    geometry.normal = project_normal(instanceModelMatrix * attributes.normals);
    varyings.position = projected.clipPosition;
  }

  varyings.color = vec4<f32>(
    attributes.colors * attributes.instanceColors.rgb,
    attributes.instanceColors.a
  );
  varyings.texCoords = attributes.texCoords;
  varyings.normal = geometry.normal;
  varyings.positionCommon = geometry.position.xyz;
  varyings.pickingColor = geometry.pickingColor;
  return varyings;
}

@fragment
fn fragmentMain(varyings: Varyings) -> @location(0) vec4<f32> {
  geometry.uv = varyings.texCoords;

  if (picking.isActive > 0.5) {
    if (!picking_isColorValid(varyings.pickingColor)) {
      discard;
    }
    return vec4<f32>(varyings.pickingColor, 1.0);
  }

  var color = varyings.color;
  if (simpleMesh.hasTexture > 0.5) {
    color = textureSample(simpleMeshTexture, simpleMeshTextureSampler, varyings.texCoords);
  }

  var normal = varyings.normal;
  if (simpleMesh.flatShading > 0.5) {
    // WebGPU's screen-space Y axis reverses the derivative orientation used by GLSL flat shading.
    normal = normalize(cross(dpdy(varyings.positionCommon), dpdx(varyings.positionCommon)));
  }

  color = vec4<f32>(
    lighting_getLightColor2(color.rgb, project.cameraPosition, varyings.positionCommon, normal),
    color.a * layer.opacity
  );

  if (picking.isHighlightActive > 0.5) {
    let highlightedColor = picking_normalizeColor(picking.highlightedObjectColor);
    if (picking_isColorZero(abs(varyings.pickingColor - highlightedColor))) {
      let blendedAlpha = picking.highlightColor.a + color.a * (1.0 - picking.highlightColor.a);
      if (blendedAlpha > 0.0) {
        color = vec4<f32>(
          mix(color.rgb, picking.highlightColor.rgb, picking.highlightColor.a / blendedAlpha),
          blendedAlpha
        );
      }
    }
  }

  return deckgl_premultiplied_alpha(color);
}
`;function T(t){let e=t.positions||t.POSITION;i.A.assert(e,'no "postions" or "POSITION" attribute in mesh');let o=e.value.length/e.size,s=t.COLOR_0||t.colors;s||(s={size:3,value:new Float32Array(3*o).fill(1)});let r=t.NORMAL||t.normals;r||(r={size:3,value:new Float32Array(3*o).fill(0)});let n=t.TEXCOORD_0||t.texCoords;return n||(n={size:2,value:new Float32Array(2*o).fill(0)}),{positions:e,colors:s,normals:r,texCoords:n}}function L(t){return t instanceof d.V?(t.attributes=T(t.attributes),t):new d.V(t.attributes?{...t,topology:"triangle-list",attributes:T(t.attributes)}:{topology:"triangle-list",attributes:T(t)})}class j extends s.A{getShaders(){return super.getShaders({vs:w,fs:S,source:A,modules:[r.A,n.A,h,g.Ay,b]})}getBounds(){if(this.props._instanced)return super.getBounds();let t=this.state.positionBounds;if(t)return t;let{mesh:e}=this.props;if(!e)return null;if(!(t=e.header?.boundingBox)){let{attributes:o}=L(e);o.POSITION=o.POSITION||o.positions,t=function(t){let e=1/0,o=1/0,i=1/0,s=-1/0,r=-1/0,n=-1/0,a=t.POSITION?t.POSITION.value:[],l=a&&a.length;for(let t=0;t<l;t+=3){let l=a[t],c=a[t+1],p=a[t+2];e=l<e?l:e,o=c<o?c:o,i=p<i?p:i,s=l>s?l:s,r=c>r?c:r,n=p>n?p:n}return[[e,o,i],[s,r,n]]}(o)}return this.state.positionBounds=t,t}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{transition:!0,type:"float64",fp64:this.use64bitPositions(),size:3,accessor:"getPosition"},instanceColors:{type:"unorm8",transition:!0,size:this.props.colorFormat.length,accessor:"getColor",defaultValue:[0,0,0,255]},instanceModelMatrix:_}),this.setState({emptyTexture:this.context.device.createTexture({data:new Uint8Array(4),width:1,height:1})})}updateState(t){super.updateState(t);let{props:e,oldProps:o,changeFlags:i}=t;if(e.mesh!==o.mesh||i.extensionsChanged){if(this.state.positionBounds=null,this.state.model?.destroy(),e.mesh){this.state.model=this.getModel(e.mesh);let t=e.mesh.attributes||e.mesh;this.setState({hasNormals:!!(t.NORMAL||t.normals)})}this.getAttributeManager().invalidateAll()}e.texture!==o.texture&&e.texture instanceof u.g&&this.setTexture(e.texture),this.state.model&&this.state.model.setTopology(this.props.wireframe?"line-strip":"triangle-list")}finalizeState(t){super.finalizeState(t),this.state.emptyTexture.delete()}draw({uniforms:t}){let{model:e}=this.state;if(!e)return;let{viewport:o,renderPass:i}=this.context,{sizeScale:s,coordinateSystem:r,_instanced:n}=this.props,a={sizeScale:s,composeModelMatrix:!n||"cartesian"===r||"meter-offsets"===r||"default"===r&&!o.isGeospatial,flatShading:!this.state.hasNormals};e.shaderInputs.setProps({simpleMesh:a}),e.draw(i)}get isLoaded(){return!!(this.state?.model&&super.isLoaded)}getModel(t){let e=new m.K(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:L(t),isInstanced:!0});return e.shaderInputs.setProps({simpleMesh:this.getTextureProps(this.props.texture)}),e}setTexture(t){let{model:e}=this.state;e&&e.shaderInputs.setProps({simpleMesh:this.getTextureProps(t)})}getTextureProps(t){let e=t||this.state.emptyTexture;return{..."webgpu"===this.context.device.type?{simpleMeshTexture:e}:{sampler:e},hasTexture:!!t}}}j.defaultProps={mesh:{type:"object",value:null,async:!0},texture:{type:"image",value:null,async:!0},sizeScale:{type:"number",value:1,min:0},_instanced:!0,wireframe:!1,material:!0,getPosition:{type:"accessor",value:t=>t.position},getColor:{type:"accessor",value:[0,0,0,255]},getOrientation:{type:"accessor",value:[0,0,0]},getScale:{type:"accessor",value:[1,1,1]},getTranslation:{type:"accessor",value:[0,0,0]},getTransformMatrix:{type:"accessor",value:[]},textureParameters:{type:"object",ignore:!0,value:null}},j.layerName="SimpleMeshLayer";let z=j}}]);