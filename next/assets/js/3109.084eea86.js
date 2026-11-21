"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["3109"],{98566(t,e,o){o.d(e,{A:()=>y});var i=o(12041),s=o(47345),r=o(41534),n=o(88967),a=o(25667);let l=Math.PI/180;class c extends s.A{constructor(t){let{height:e,projectionMatrix:o,fovy:i=50,orbitAxis:s="Z",target:a=[0,0,0],rotationX:c=0,rotationOrbit:p=0,zoom:u=0}=t,h=o?o[5]/2:(0,n.wZ)(i);super({...t,viewMatrix:function({height:t,focalDistance:e,orbitAxis:o,rotationX:i,rotationOrbit:s,zoom:n}){let a=new r.k().lookAt({eye:"Z"===o?[0,-e,0]:[0,0,e],up:"Z"===o?[0,0,1]:[0,1,0]});a.rotateX(i*l),"Z"===o?a.rotateZ(s*l):a.rotateY(s*l);let c=Math.pow(2,n)/t;return a.scale(c),a}({height:e||1,focalDistance:h,orbitAxis:s,rotationX:c,rotationOrbit:p,zoom:u}),fovy:i,focalDistance:h,position:a,zoom:u}),this.target=a,this.orbitAxis=s,this.rotationX=c,this.rotationOrbit=p,this.fovy=i,this.projectedCenter=this.project(this.center)}unproject(t,{topLeft:e=!0}={}){let[o,i,s=this.projectedCenter[2]]=t,r=e?i:this.height-i,[a,l,c]=(0,n.xJ)([o,r,s],this.pixelUnprojectionMatrix);return[a,l,c]}panByPosition(t,e,o){let i=this.project(t),{near:s,far:r}=(0,a.om)(this.projectionMatrix),n=s*r/(r-i[2]*(r-s))/(s*r/(r-this.projectedCenter[2]*(r-s))),l=[this.width/2+(i[0]-e[0])*n,this.height/2+(i[1]-e[1])*n,this.projectedCenter[2]];return{target:this.unproject(l)}}}c.displayName="OrbitViewport";var p=o(31609),u=o(79433),h=o(60676),m=o(58532),d=o(70053);class g extends h.A{constructor(t){let{width:e,height:o,rotationX:i=0,rotationOrbit:s=0,target:r=[0,0,0],zoom:n=0,minRotationX:a=-90,maxRotationX:l=90,minZoom:c=-1/0,maxZoom:p=1/0,maxBounds:u=null,maxBoundsPadding:h=null,startPanPosition:m,startRotatePos:d,startRotationX:g,startRotationOrbit:f,startZoomPosition:v,startZoom:y}=t;super({width:e,height:o,rotationX:i,rotationOrbit:s,target:r,zoom:n,minRotationX:a,maxRotationX:l,minZoom:c,maxZoom:p,maxBounds:u,maxBoundsPadding:h},{startPanPosition:m,startRotatePos:d,startRotationX:g,startRotationOrbit:f,startZoomPosition:v,startZoom:y},t.makeViewport),this.unproject3D=t.unproject3D}panStart({pos:t}){return this._getUpdatedState({startPanPosition:this._unproject(t)})}pan({pos:t,startPosition:e}){let o=this.getState().startPanPosition||e;if(!o)return this;let i=this.makeViewport(this.getViewportProps()).panByPosition(o,t);return this._getUpdatedState(i)}panEnd(){return this._getUpdatedState({startPanPosition:null})}rotateStart({pos:t}){return this._getUpdatedState({startRotatePos:t,startRotationX:this.getViewportProps().rotationX,startRotationOrbit:this.getViewportProps().rotationOrbit})}rotate({pos:t,deltaAngleX:e=0,deltaAngleY:o=0}){let i,{startRotatePos:s,startRotationX:r,startRotationOrbit:n}=this.getState(),{width:a,height:l}=this.getViewportProps();if(!s||void 0===r||void 0===n)return this;if(t){let e=(t[0]-s[0])/a;(r<-90||r>90)&&(e*=-1),i={rotationX:r+180*((t[1]-s[1])/l),rotationOrbit:n+180*e}}else i={rotationX:r+o,rotationOrbit:n+e};return this._getUpdatedState(i)}rotateEnd(){return this._getUpdatedState({startRotationX:null,startRotationOrbit:null})}shortestPathFrom(t){let e=t.getViewportProps(),o={...this.getViewportProps()},{rotationOrbit:i}=o;return Math.abs(i-e.rotationOrbit)>180&&(o.rotationOrbit=i<0?i+360:i-360),o}zoomStart({pos:t}){return this._getUpdatedState({startZoomPosition:this._unproject(t),startZoom:this.getViewportProps().zoom})}zoom({pos:t,startPos:e,scale:o}){let{startZoom:i,startZoomPosition:s}=this.getState();if(s||(i=this.getViewportProps().zoom,s=this._unproject(e||t)),!s)return this;let r=this._calculateNewZoom({scale:o,startZoom:i}),n=this.makeViewport({...this.getViewportProps(),zoom:r});return this._getUpdatedState({zoom:r,...n.panByPosition(s,t)})}zoomEnd(){return this._getUpdatedState({startZoomPosition:null,startZoom:null})}zoomIn(t=2){return this._getUpdatedState({zoom:this._calculateNewZoom({scale:t})})}zoomOut(t=2){return this._getUpdatedState({zoom:this._calculateNewZoom({scale:1/t})})}moveLeft(t=50){return this._panFromCenter([-t,0])}moveRight(t=50){return this._panFromCenter([t,0])}moveUp(t=50){return this._panFromCenter([0,-t])}moveDown(t=50){return this._panFromCenter([0,t])}rotateLeft(t=15){return this._getUpdatedState({rotationOrbit:this.getViewportProps().rotationOrbit-t})}rotateRight(t=15){return this._getUpdatedState({rotationOrbit:this.getViewportProps().rotationOrbit+t})}rotateUp(t=10){return this._getUpdatedState({rotationX:this.getViewportProps().rotationX-t})}rotateDown(t=10){return this._getUpdatedState({rotationX:this.getViewportProps().rotationX+t})}_project(t){return this.makeViewport(this.getViewportProps()).project(t)}_unproject(t){let e=this.unproject3D?.(t);return e||this.makeViewport(this.getViewportProps()).unproject(t)}_calculateNewZoom({scale:t,startZoom:e}){void 0===e&&(e=this.getViewportProps().zoom);let o=e+Math.log2(t);return this._constrainZoom(o)}_panFromCenter(t){let{target:e}=this.getViewportProps(),o=this._project(e);return this.pan({startPosition:e,pos:[o[0]+t[0],o[1]+t[1]]})}_getUpdatedState(t){return new this.constructor({makeViewport:this.makeViewport,...this.getViewportProps(),...this.getState(),...t})}applyConstraints(t){let{maxRotationX:e,minRotationX:o,rotationOrbit:i}=t;return t.zoom=this._constrainZoom(t.zoom,t),t.rotationX=(0,p.qE)(t.rotationX,o,e),(i<-180||i>180)&&(t.rotationOrbit=(0,a.zi)(i+180,360)-180),t.target=this._constrainTarget(t),t}_constrainZoom(t,e){e||(e=this.getViewportProps());let{maxZoom:o,maxBounds:i}=e,{minZoom:s}=e;if(i&&e.width>0&&e.height>0){let r=(0,m.CI)(e.width,e.height,e.maxBoundsPadding),n=[];if(r.width>0||r.height>0){let a=this.makeViewport({...e,zoom:t}),l=(0,m.jo)(a,e.target,r);r.width>0&&n.push(l.left,l.right),r.height>0&&n.push(l.top,l.bottom);let c=2*Math.min(...n),p=i[1][0]-i[0][0],u=i[1][1]-i[0][1],h=(i[1][2]??0)-(i[0][2]??0),d=Math.sqrt(p*p+u*u+h*h);c>0&&d>0&&(s=Math.max(s,Math.log2(c/d)))>o&&(s=o)}}return(0,p.qE)(t,s,o)}_constrainTarget(t){let{target:e,maxBounds:o}=t;if(!o)return e;let i=(0,m.CI)(t.width,t.height,t.maxBoundsPadding);if(i.width<0||i.height<0)return e;let[[s,r,n=0],[a,l,c=0]]=o;if(e[0]>=s&&e[0]<=a&&e[1]>=r&&e[1]<=l&&e[2]>=n&&e[2]<=c)return e;let u=this.makeViewport?.(t);if(u){let{cameraPosition:t}=u,o=t[0]-e[0],i=t[1]-e[1],h=t[2]-e[2],m=o*e[0]+i*e[1]+h*e[2],d=o*(o>=0?s:a)+i*(i>=0?r:l)+h*(h>=0?n:c),g=o*(o>=0?a:s)+i*(i>=0?l:r)+h*(h>=0?c:n);if((o||i||h)&&m>=d&&m<=g){let t=t=>(0,p.qE)(t,s,a),u=t=>(0,p.qE)(t,r,l),d=t=>(0,p.qE)(t,n,c),g=s=>o*t(e[0]-s*o)+i*u(e[1]-s*i)+h*d(e[2]-s*h)-m,f=-1,v=1,y=g(-1),M=g(v);for(;y<0;)v=f,M=y,f*=2,y=g(f);for(;M>0;)f=v,y=M,v*=2,M=g(v);for(let t=0;t<30;t++){let t=(f+v)/2;g(t)>0?f=t:v=t}let x=(f+v)/2;return[t(e[0]-x*o),u(e[1]-x*i),d(e[2]-x*h)]}}return[(0,p.qE)(e[0],s,a),(0,p.qE)(e[1],r,l),(0,p.qE)(e[2],n,c)]}}class f extends u.A{constructor(){super(...arguments),this.ControllerState=g,this.transition={transitionDuration:300,transitionInterpolator:new d.A({transitionProps:{compare:["target","zoom","rotationX","rotationOrbit"],required:["target","zoom"]}})},this._unproject3D=t=>{if(this.pickPosition){let{x:e,y:o}=this.props,i=this.pickPosition(e+t[0],o+t[1]);if(i&&i.coordinate)return i.coordinate}return null}}setProps(t){t.unproject3D=this._unproject3D,super.setProps(t)}}class v extends i.A{constructor(t={}){super(t),this.props.orbitAxis=t.orbitAxis||"Z"}getViewportType(){return c}get ControllerType(){return f}}v.displayName="OrbitView";let y=v},10437(t,e,o){o.d(e,{A:()=>R});var i=o(3459),s=o(10032),r=o(84175),n=o(46487),a=o(78168),l=o(83895),c=o(60608),p=o(7914),u=o(88599),h=o(55861),m=o(26335),d=o(82192),g=o(3770),f=o(96087),v=o(53439);let y=Math.PI/180,M=new Float32Array(16),x=new Float32Array(12);function C(t,e,o){let i=e[0]*y,s=e[1]*y,r=e[2]*y,n=Math.sin(r),a=Math.sin(i),l=Math.sin(s),c=Math.cos(r),p=Math.cos(i),u=Math.cos(s),h=o[0],m=o[1],d=o[2];t[0]=h*u*p,t[1]=h*l*p,t[2]=-(h*a),t[3]=m*(-l*c+u*a*n),t[4]=m*(u*c+l*a*n),t[5]=m*p*n,t[6]=d*(l*n+u*a*c),t[7]=d*(-u*n+l*a*c),t[8]=d*p*c}function b(t){return t[0]=t[0],t[1]=t[1],t[2]=t[2],t[3]=t[4],t[4]=t[5],t[5]=t[6],t[6]=t[8],t[7]=t[9],t[8]=t[10],t[9]=t[12],t[10]=t[13],t[11]=t[14],t.subarray(0,12)}let _={size:12,accessor:["getOrientation","getScale","getTranslation","getTransformMatrix"],shaderAttributes:{instanceModelMatrixCol0:{size:3,elementOffset:0},instanceModelMatrixCol1:{size:3,elementOffset:3},instanceModelMatrixCol2:{size:3,elementOffset:6},instanceTranslation:{size:3,elementOffset:9}},update(t,{startRow:e,endRow:o}){let{data:i,getOrientation:s,getScale:r,getTranslation:n,getTransformMatrix:a}=this.props,l=Array.isArray(a),c=l&&16===a.length,p=Array.isArray(r),u=Array.isArray(s),h=Array.isArray(n),m=c||!l&&!!a(i[0]);m?t.constant=c:t.constant=u&&p&&h;let d=t.value;if(t.constant){let e;m?(M.set(a),e=b(M)):(C(e=x,s,r),e.set(n,9)),t.value=new Float32Array(e)}else{let l=e*t.size,{iterable:g,objectInfo:f}=(0,v.X)(i,e,o);for(let t of g){let e;(f.index++,m)?(M.set(c?a:a(t,f)),e=b(M)):(C(e=x,u?s:s(t,f),p?r:r(t,f)),e.set(h?n:n(t,f),9)),d[l++]=e[0],d[l++]=e[1],d[l++]=e[2],d[l++]=e[3],d[l++]=e[4],d[l++]=e[5],d[l++]=e[6],d[l++]=e[7],d[l++]=e[8],d[l++]=e[9],d[l++]=e[10],d[l++]=e[11]}}}},P=`\
layout(std140) uniform simpleMeshUniforms {
  float sizeScale;
  bool composeModelMatrix;
  bool hasTexture;
  bool flatShading;
  highp uint rowIndexOffset;
} simpleMesh;
`,w={name:"simpleMesh",source:`\
struct SimpleMeshUniforms {
  sizeScale: f32,
  composeModelMatrix: f32,
  hasTexture: f32,
  flatShading: f32,
  rowIndexOffset: u32,
};

@group(0) @binding(auto) var<uniform> simpleMesh: SimpleMeshUniforms;
@group(0) @binding(auto) var simpleMeshTexture: texture_2d<f32>;
@group(0) @binding(auto) var simpleMeshTextureSampler: sampler;
`,vs:P,fs:P,uniformTypes:{sizeScale:"f32",composeModelMatrix:"f32",hasTexture:"f32",flatShading:"f32",rowIndexOffset:"u32"}},S=`#version 300 es
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
geometry.pickingColor = picking_getPickingColorFromIndex(uint(gl_InstanceID) + simpleMesh.rowIndexOffset);
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
`,A=`#version 300 es
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
`,T=`\
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
  geometry.pickingColor = picking_getPickingColorFromIndex(attributes.instanceIndex + simpleMesh.rowIndexOffset);

  let instanceModelMatrix = mat3x3<f32>(
    attributes.instanceModelMatrixCol0,
    attributes.instanceModelMatrixCol1,
    attributes.instanceModelMatrixCol2
  );
  var meshPosition =
    (instanceModelMatrix * attributes.positions) * simpleMesh.sizeScale +
    attributes.instanceTranslation;

  if (simpleMesh.composeModelMatrix > 0.5) {
    DECKGL_FILTER_SIZE(&meshPosition, geometry);
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
    meshPosition = project_size_vec3(meshPosition);
    DECKGL_FILTER_SIZE(&meshPosition, geometry);
    let projected = project_position_to_clipspace_and_commonspace(
      attributes.instancePositions,
      attributes.instancePositions64Low,
      meshPosition
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
  DECKGL_FILTER_GL_POSITION(&varyings.position, geometry);
  return varyings;
}

@fragment
fn fragmentMain(varyings: Varyings) -> @location(0) vec4<f32> {
  geometry.uv = varyings.texCoords;
  fragmentGeometry.uv = geometry.uv;

  if (picking.isActive > 0.5) {
    if (!picking_isColorValid(varyings.pickingColor)) {
      discard;
    }
    var extensionColor = vec4<f32>(varyings.pickingColor, 1.0);
    DECKGL_FILTER_COLOR(&extensionColor, fragmentGeometry);
    // Color filters may discard, but must not alter the picking payload.
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

  DECKGL_FILTER_COLOR(&color, fragmentGeometry);
  return deckgl_premultiplied_alpha(color);
}
`;var I=o(8994);let O=["getTransformMatrix","getOrientation","getScale","getTranslation"],j=Object.keys(_.shaderAttributes),z={positions:{attribute:"instancePositions",accessor:"getPosition",semantic:"position",size:3},colors:{attribute:"instanceColors",accessor:"getColor",semantic:"color",size:4}};for(let t of j)z[t]={attribute:t,accessor:t,semantic:"vector",size:3,prop:!1};var L=o(68025);function E(t){let e=t.positions||t.POSITION;i.A.assert(e,'no "postions" or "POSITION" attribute in mesh');let o=e.value.length/e.size,s=t.COLOR_0||t.colors;s||(s={size:3,value:new Float32Array(3*o).fill(1)});let r=t.NORMAL||t.normals;r||(r={size:3,value:new Float32Array(3*o).fill(0)});let n=t.TEXCOORD_0||t.texCoords;return n||(n={size:2,value:new Float32Array(2*o).fill(0)}),{positions:e,colors:s,normals:r,texCoords:n}}function k(t){if(t instanceof m.V2)return t.attributes=E(t.attributes),t;if(!t.attributes)return new m.V2({topology:"triangle-list",attributes:E(t)});{let{indices:e}=t,o=e?.value,i=o instanceof Int32Array?{...e,value:new Uint32Array(o.buffer,o.byteOffset,o.length)}:e;return new m.V2({...t,indices:i,topology:"triangle-list",attributes:E(t.attributes)})}}let V=t=>t.position;function F(t){if(t instanceof d.u)return!!(t.attributes.normals||t.bufferLayout?.some(t=>t.attributes?.some(t=>"normals"===t.attribute)));let e=t.attributes||t;return!!(e.NORMAL||e.normals)}class N extends s.A{getShaders(){return super.getShaders({vs:S,fs:A,source:T,modules:[r.A,n.A,a.w,l.Ay,w]})}getBounds(){if(this.props._instanced)return this.state.columns?this.state.columns.getBounds():super.getBounds();let t=this.state.positionBounds;if(t)return t;let{mesh:e}=this.props;if(!e||e instanceof d.u)return null;if(!(t=e.header?.boundingBox)){let{attributes:o}=k(e);o.POSITION=o.POSITION||o.positions,t=(0,L.l)(o)}return this.state.positionBounds=t,t}initializeState(){this.initializeAccessorAttributes(),this.setState({emptyTexture:this.context.device.createTexture({data:new Uint8Array(4),width:1,height:1})})}initializeAccessorAttributes(){this.getAttributeManager().addInstanced({instancePositions:{transition:!0,type:"float64",fp64:this.use64bitPositions(),...this.usePositionTransforms(),size:3,accessor:"getPosition"},instanceColors:{type:"unorm8",transition:!0,size:this.props.colorFormat.length,accessor:"getColor",defaultValue:[0,0,0,255]},instanceModelMatrix:_})}updateState(t){let{mesh:e}=t.props;if(e instanceof d.u&&e!==t.oldProps.mesh&&function(t){if(t.indices&&t.indices.data.length>1||Object.values(t.attributes).some(t=>t&&"data"in t&&t.data.length>1))throw Error("SimpleMeshLayer GPU mesh attributes and indices must be single-chunk")}(e),t.props.positions||t.props.colors)return void this.updateColumnState(t);let o=this.restoreAccessorState();super.updateState(t);let{props:i,oldProps:s,changeFlags:r}=t;(o||i.mesh!==s.mesh||r.extensionsChanged)&&(this.state.positionBounds=null,this.state.model?.destroy(),this.state.model=void 0,i.mesh&&(this.state.model=this.getModel(i.mesh),this.setState({hasNormals:F(i.mesh)})),this.getAttributeManager().invalidateAll()),i.texture!==s.texture&&i.texture instanceof h.g&&this.setTexture(i.texture),this.state.model&&this.state.model.setTopology(this.getMeshTopology())}updateColumnState(t){let{props:e,oldProps:o,changeFlags:i}=t;if(e.extensions.length||Object.keys(e.transitions||{}).length)throw Error("SimpleMesh Arrow columns do not support extensions or transitions");let s=!this.state.columns;s&&(this.state.model?.destroy(),this.state.model=void 0,this.internalState.attributeManager?.finalize(),this.internalState.attributeManager=null,this.state.columns=new c.h(this.context.device,z,"SimpleMesh")),(s||e.mesh!==o.mesh)&&this.updateColumnModel(e.mesh);let r=this.state.arrowModel;r&&(r.setTopology(this.getMeshTopology()),r.shaderInputs.setProps({simpleMesh:this.getTextureProps(e.texture)})),this.updateInstanceColumns(t)}getMeshTopology(){let{mesh:t,wireframe:e}=this.props;return e?"line-strip":t instanceof d.u?t.topology:"triangle-list"}updateColumnModel(t){if(this.state.arrowModel?.destroy(),this.state.ownedArrowGeometry?.destroy(),this.state.arrowModel=void 0,this.state.ownedArrowGeometry=void 0,this.state.positionBounds=null,!t)return;let e=t instanceof d.u?t:(0,g.M)(this.context.device,k(t));e!==t&&(this.state.ownedArrowGeometry=e),this.state.hasNormals=F(t),this.state.arrowModel=new f.X(this.context.device,{...this.getShaders(),id:this.props.id,geometry:e,bufferLayout:this.state.columns.getBufferLayouts(),isInstanced:!0,inferDrawCount:"instance"})}updateInstanceColumns({props:t,oldProps:e,changeFlags:o}){let i=O.some(o=>{let i=t[o],s=e[o];return("function"!=typeof i||"function"!=typeof s)&&!(0,p.b)(i,s,1)});this.state.columns.updateIfNeeded({props:t,oldProps:e,changeFlags:{...o,dataChanged:o.dataChanged||!!i&&"mesh transforms changed"}},{dataLoading:this.internalState.isAsyncPropLoading("data"),changed:()=>{this.setState({}),this.setNeedsUpdate()},failed:t=>this.raiseError(t,"converting Arrow columns"),prepareFallbacks:(e,o,i)=>(function(t,e,o,i,s){let r=e.data?.attributes?.instanceModelMatrix,n=r instanceof I.h?{buffer:r}:ArrayBuffer.isView(r)?{value:r}:r;if(!n){let t=O.map(t=>e[t]),s="function"!=typeof t[0]&&t[0]?.length===16||t.every(t=>Array.isArray(t)),r=s?1:i,a=new Float32Array(12*r),{objectInfo:l}=(0,v.X)(e.data);for(let e=0;e<r;e++){l.index=e;let i=o.at(e),s="function"==typeof t[0]?t[0](i,l):t[0],[r,n,c]=s?.length===16?[[],[],[]]:t.slice(1).map(t=>"function"==typeof t?t(i,l):t);a.set(function(t,e,o,i){if(t?.length===16)return b(new Float32Array(t));let s=new Float32Array(12);return C(s,e,o),s.set(i,9),s}(s,r,n,c),12*e)}n={value:a,constant:s}}if(!n.constant&&!n.buffer&&i){let e=t.createBuffer({data:n.value,usage:I.h.VERTEX|I.h.COPY_DST});s(e),n={...n,buffer:e}}return Object.fromEntries(j.map((t,e)=>[t,{...n,size:3,stride:n.stride??48,offset:(n.offset??0)+12*e}]))})(this.context.device,t,e,o,i),positionOptions:{transform:this.usePositionTransforms().transform?.bind(this),fp64:this.use64bitPositions(),requireRows:!t.positions&&t.getPosition===V&&!t.data?.attributes?.getPosition}})}restoreAccessorState(){return!!this.state.columns&&(this.state.columns.destroy(),this.state.columns=void 0,this.updateColumnModel(null),this.internalState.attributeManager=super._getAttributeManager(),this.initializeAccessorAttributes(),!0)}getModels(){return this.state?.arrowModel?[this.state.arrowModel]:super.getModels()}getNumInstances(){return this.state?.columns&&!Number.isFinite(this.props.numInstances)?this.state.columns.length:super.getNumInstances()}finalizeState(t){super.finalizeState(t),this.state.columns?.destroy(),this.state.ownedArrowGeometry?.destroy(),this.state.emptyTexture.delete()}draw({uniforms:t}){let{columns:e}=this.state,o=this.state.arrowModel??this.state.model;if(!o)return;let{viewport:i,renderPass:s}=this.context,{sizeScale:r,coordinateSystem:n,_instanced:a}=this.props,l={sizeScale:r,rowIndexOffset:0,composeModelMatrix:!a||function(t,e,o=!1){return o?"cartesian"===e:e===t.crs?.signature||"cartesian"===e||"meter-offsets"===e||"default"===e&&!t.isGeospatial}(i,this.state.sourceCrs?.signature||n,!!this.state.preproject),flatShading:!this.state.hasNormals};o.shaderInputs.setProps({simpleMesh:l}),e?e.draw(o,s,t=>{o.setInstanceCount(Math.min(o.instanceCount,Math.max(0,this.getNumInstances()-t))),o.shaderInputs.setProps({simpleMesh:{rowIndexOffset:t}})}):o.draw(s)}get isLoaded(){return!!((this.state?.model||this.state?.arrowModel)&&!this.state.columns?.loading&&super.isLoaded)}getModel(t){let e=new u.A(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:t instanceof d.u?t:k(t),isInstanced:!0});return e.shaderInputs.setProps({simpleMesh:this.getTextureProps(this.props.texture)}),e}setTexture(t){let{model:e}=this.state;e&&e.shaderInputs.setProps({simpleMesh:this.getTextureProps(t)})}getTextureProps(t){let e=t||this.state.emptyTexture;return{..."webgpu"===this.context.device.type?{simpleMeshTexture:e}:{sampler:e},hasTexture:!!t}}}N.defaultProps={mesh:{type:"object",value:null,async:!0},texture:{type:"image",value:null,async:!0},positions:{type:"object",value:null,optional:!0},colors:{type:"object",value:null,optional:!0},sizeScale:{type:"number",value:1,min:0},_instanced:!0,wireframe:!1,material:!0,getPosition:{type:"accessor",value:V},getColor:{type:"accessor",value:[0,0,0,255]},getOrientation:{type:"accessor",value:[0,0,0]},getScale:{type:"accessor",value:[1,1,1]},getTranslation:{type:"accessor",value:[0,0,0]},getTransformMatrix:{type:"accessor",value:[]},textureParameters:{type:"object",ignore:!0,value:null}},N.layerName="SimpleMeshLayer";let R=N},68025(t,e,o){o.d(e,{l:()=>i});function i(t){let e=1/0,o=1/0,i=1/0,s=-1/0,r=-1/0,n=-1/0,a=t.POSITION?t.POSITION.value:[],l=a&&a.length;for(let t=0;t<l;t+=3){let l=a[t],c=a[t+1],p=a[t+2];e=l<e?l:e,o=c<o?c:o,i=p<i?p:i,s=l>s?l:s,r=c>r?c:r,n=p>n?p:n}return[[e,o,i],[s,r,n]]}},78168(t,e,o){o.d(e,{w:()=>a});var i=o(89907),s=o(20723),r=o(96489),n=o(63484);let a={name:"phongMaterial",firstBindingSlot:0,bindingLayout:[{name:"phongMaterial",group:3}],dependencies:[s.x,i.$n],source:r.X,vs:n.X,fs:n.l,defines:{LIGHTING_FRAGMENT:!0},uniformTypes:{unlit:"i32",ambient:"f32",diffuse:"f32",shininess:"f32",specularColor:"vec3<f32>"},defaultUniforms:{unlit:!1,ambient:.35,diffuse:.6,shininess:32,specularColor:[38.25,38.25,38.25]},getUniforms:t=>({...a.defaultUniforms,...t})}}}]);