"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["864"],{14115(e,t,o){o.d(t,{A:()=>U});var s=o(26391),i=o(64177),n=o(84175),r=o(46487),a=o(89907),l=o(20723),c=o(96489),u=o(63484);let p={name:"phongMaterial",firstBindingSlot:0,bindingLayout:[{name:"phongMaterial",group:3}],dependencies:[l.x,a.$n],source:c.X,vs:u.X,fs:u.l,defines:{LIGHTING_FRAGMENT:!0},uniformTypes:{unlit:"i32",ambient:"f32",diffuse:"f32",shininess:"f32",specularColor:"vec3<f32>"},defaultUniforms:{unlit:!1,ambient:.35,diffuse:.6,shininess:32,specularColor:[38.25,38.25,38.25]},getUniforms:e=>({...p.defaultUniforms,...e})};var m=o(19754),d=o(60608),h=o(7914),g=o(88599),f=o(55861),v=o(25337),y=o(82192),M=o(3770),x=o(86181),C=o(53439);let b=Math.PI/180,_=new Float32Array(16),P=new Float32Array(12);function T(e,t,o){let s=t[0]*b,i=t[1]*b,n=t[2]*b,r=Math.sin(n),a=Math.sin(s),l=Math.sin(i),c=Math.cos(n),u=Math.cos(s),p=Math.cos(i),m=o[0],d=o[1],h=o[2];e[0]=m*p*u,e[1]=m*l*u,e[2]=-(m*a),e[3]=d*(-l*c+p*a*r),e[4]=d*(p*c+l*a*r),e[5]=d*u*r,e[6]=h*(l*r+p*a*c),e[7]=h*(-p*r+l*a*c),e[8]=h*u*c}function A(e){return e[0]=e[0],e[1]=e[1],e[2]=e[2],e[3]=e[4],e[4]=e[5],e[5]=e[6],e[6]=e[8],e[7]=e[9],e[8]=e[10],e[9]=e[12],e[10]=e[13],e[11]=e[14],e.subarray(0,12)}let w={size:12,accessor:["getOrientation","getScale","getTranslation","getTransformMatrix"],shaderAttributes:{instanceModelMatrixCol0:{size:3,elementOffset:0},instanceModelMatrixCol1:{size:3,elementOffset:3},instanceModelMatrixCol2:{size:3,elementOffset:6},instanceTranslation:{size:3,elementOffset:9}},update(e,{startRow:t,endRow:o}){let{data:s,getOrientation:i,getScale:n,getTranslation:r,getTransformMatrix:a}=this.props,l=Array.isArray(a),c=l&&16===a.length,u=Array.isArray(n),p=Array.isArray(i),m=Array.isArray(r),d=c||!l&&!!a(s[0]);d?e.constant=c:e.constant=p&&u&&m;let h=e.value;if(e.constant){let t;d?(_.set(a),t=A(_)):(T(t=P,i,n),t.set(r,9)),e.value=new Float32Array(t)}else{let l=t*e.size,{iterable:g,objectInfo:f}=(0,C.X)(s,t,o);for(let e of g){let t;(f.index++,d)?(_.set(c?a:a(e,f)),t=A(_)):(T(t=P,p?i:i(e,f),u?n:n(e,f)),t.set(m?r:r(e,f),9)),h[l++]=t[0],h[l++]=t[1],h[l++]=t[2],h[l++]=t[3],h[l++]=t[4],h[l++]=t[5],h[l++]=t[6],h[l++]=t[7],h[l++]=t[8],h[l++]=t[9],h[l++]=t[10],h[l++]=t[11]}}}},I=`\
layout(std140) uniform simpleMeshUniforms {
  float sizeScale;
  bool composeModelMatrix;
  bool hasTexture;
  bool flatShading;
  highp uint rowIndexOffset;
} simpleMesh;
`,S={name:"simpleMesh",source:`\
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
`,vs:I,fs:I,uniformTypes:{sizeScale:"f32",composeModelMatrix:"f32",hasTexture:"f32",flatShading:"f32",rowIndexOffset:"u32"}},L=`#version 300 es
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
`,O=`#version 300 es
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
`,z=`\
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
`;var E=o(8994);let k=["getTransformMatrix","getOrientation","getScale","getTranslation"],j=Object.keys(w.shaderAttributes),F={positions:{attribute:"instancePositions",accessor:"getPosition",semantic:"position",size:3},colors:{attribute:"instanceColors",accessor:"getColor",semantic:"color",size:4}};for(let e of j)F[e]={attribute:e,accessor:e,semantic:"vector",size:3,prop:!1};function G(e){let t=e.positions||e.POSITION;s.A.assert(t,'no "postions" or "POSITION" attribute in mesh');let o=t.value.length/t.size,i=e.COLOR_0||e.colors;i||(i={size:3,value:new Float32Array(3*o).fill(1)});let n=e.NORMAL||e.normals;n||(n={size:3,value:new Float32Array(3*o).fill(0)});let r=e.TEXCOORD_0||e.texCoords;return r||(r={size:2,value:new Float32Array(2*o).fill(0)}),{positions:t,colors:i,normals:n,texCoords:r}}function N(e){if(e instanceof v.V2)return e.attributes=G(e.attributes),e;if(!e.attributes)return new v.V2({topology:"triangle-list",attributes:G(e)});{let{indices:t}=e,o=t?.value,s=o instanceof Int32Array?{...t,value:new Uint32Array(o.buffer,o.byteOffset,o.length)}:t;return new v.V2({...e,indices:s,topology:"triangle-list",attributes:G(e.attributes)})}}let R=e=>e.position;function D(e){if(e instanceof y.u)return!!(e.attributes.normals||e.bufferLayout?.some(e=>e.attributes?.some(e=>"normals"===e.attribute)));let t=e.attributes||e;return!!(t.NORMAL||t.normals)}class B extends i.A{getShaders(){return super.getShaders({vs:L,fs:O,source:z,modules:[n.A,r.A,p,m.Ay,S]})}getBounds(){if(this.props._instanced)return this.state.columns?this.state.columns.getBounds():super.getBounds();let e=this.state.positionBounds;if(e)return e;let{mesh:t}=this.props;if(!t||t instanceof y.u)return null;if(!(e=t.header?.boundingBox)){let{attributes:o}=N(t);o.POSITION=o.POSITION||o.positions,e=function(e){let t=1/0,o=1/0,s=1/0,i=-1/0,n=-1/0,r=-1/0,a=e.POSITION?e.POSITION.value:[],l=a&&a.length;for(let e=0;e<l;e+=3){let l=a[e],c=a[e+1],u=a[e+2];t=l<t?l:t,o=c<o?c:o,s=u<s?u:s,i=l>i?l:i,n=c>n?c:n,r=u>r?u:r}return[[t,o,s],[i,n,r]]}(o)}return this.state.positionBounds=e,e}initializeState(){this.initializeAccessorAttributes(),this.setState({emptyTexture:this.context.device.createTexture({data:new Uint8Array(4),width:1,height:1})})}initializeAccessorAttributes(){this.getAttributeManager().addInstanced({instancePositions:{transition:!0,type:"float64",fp64:this.use64bitPositions(),...this.usePositionTransforms(),size:3,accessor:"getPosition"},instanceColors:{type:"unorm8",transition:!0,size:this.props.colorFormat.length,accessor:"getColor",defaultValue:[0,0,0,255]},instanceModelMatrix:w})}updateState(e){let{mesh:t}=e.props;if(t instanceof y.u&&t!==e.oldProps.mesh&&function(e){if(e.indices&&e.indices.data.length>1||Object.values(e.attributes).some(e=>e&&"data"in e&&e.data.length>1))throw Error("SimpleMeshLayer GPU mesh attributes and indices must be single-chunk")}(t),e.props.positions||e.props.colors)return void this.updateColumnState(e);let o=this.restoreAccessorState();super.updateState(e);let{props:s,oldProps:i,changeFlags:n}=e;(o||s.mesh!==i.mesh||n.extensionsChanged)&&(this.state.positionBounds=null,this.state.model?.destroy(),this.state.model=void 0,s.mesh&&(this.state.model=this.getModel(s.mesh),this.setState({hasNormals:D(s.mesh)})),this.getAttributeManager().invalidateAll()),s.texture!==i.texture&&s.texture instanceof f.g&&this.setTexture(s.texture),this.state.model&&this.state.model.setTopology(this.getMeshTopology())}updateColumnState(e){let{props:t,oldProps:o,changeFlags:s}=e;if(t.extensions.length||Object.keys(t.transitions||{}).length)throw Error("SimpleMesh Arrow columns do not support extensions or transitions");let i=!this.state.columns;i&&(this.state.model?.destroy(),this.state.model=void 0,this.internalState.attributeManager?.finalize(),this.internalState.attributeManager=null,this.state.columns=new d.h(this.context.device,F,"SimpleMesh")),(i||t.mesh!==o.mesh)&&this.updateColumnModel(t.mesh);let n=this.state.arrowModel;n&&(n.setTopology(this.getMeshTopology()),n.shaderInputs.setProps({simpleMesh:this.getTextureProps(t.texture)})),this.updateInstanceColumns(e)}getMeshTopology(){let{mesh:e,wireframe:t}=this.props;return t?"line-strip":e instanceof y.u?e.topology:"triangle-list"}updateColumnModel(e){if(this.state.arrowModel?.destroy(),this.state.ownedArrowGeometry?.destroy(),this.state.arrowModel=void 0,this.state.ownedArrowGeometry=void 0,this.state.positionBounds=null,!e)return;let t=e instanceof y.u?e:(0,M.M)(this.context.device,N(e));t!==e&&(this.state.ownedArrowGeometry=t),this.state.hasNormals=D(e),this.state.arrowModel=new x.X(this.context.device,{...this.getShaders(),id:this.props.id,geometry:t,bufferLayout:this.state.columns.getBufferLayouts(),isInstanced:!0,inferDrawCount:"instance"})}updateInstanceColumns({props:e,oldProps:t,changeFlags:o}){let s=k.some(o=>{let s=e[o],i=t[o];return("function"!=typeof s||"function"!=typeof i)&&!(0,h.b)(s,i,1)});this.state.columns.updateIfNeeded({props:e,oldProps:t,changeFlags:{...o,dataChanged:o.dataChanged||!!s&&"mesh transforms changed"}},{dataLoading:this.internalState.isAsyncPropLoading("data"),changed:()=>{this.setState({}),this.setNeedsUpdate()},failed:e=>this.raiseError(e,"converting Arrow columns"),prepareFallbacks:(t,o,s)=>(function(e,t,o,s,i){let n=t.data?.attributes?.instanceModelMatrix,r=n instanceof E.h?{buffer:n}:ArrayBuffer.isView(n)?{value:n}:n;if(!r){let e=k.map(e=>t[e]),i="function"!=typeof e[0]&&e[0]?.length===16||e.every(e=>Array.isArray(e)),n=i?1:s,a=new Float32Array(12*n),{objectInfo:l}=(0,C.X)(t.data);for(let t=0;t<n;t++){l.index=t;let s=o.at(t),i="function"==typeof e[0]?e[0](s,l):e[0],[n,r,c]=i?.length===16?[[],[],[]]:e.slice(1).map(e=>"function"==typeof e?e(s,l):e);a.set(function(e,t,o,s){if(e?.length===16)return A(new Float32Array(e));let i=new Float32Array(12);return T(i,t,o),i.set(s,9),i}(i,n,r,c),12*t)}r={value:a,constant:i}}if(!r.constant&&!r.buffer&&s){let t=e.createBuffer({data:r.value,usage:E.h.VERTEX|E.h.COPY_DST});i(t),r={...r,buffer:t}}return Object.fromEntries(j.map((e,t)=>[e,{...r,size:3,stride:r.stride??48,offset:(r.offset??0)+12*t}]))})(this.context.device,e,t,o,s),positionOptions:{transform:this.usePositionTransforms().transform?.bind(this),fp64:this.use64bitPositions(),requireRows:!e.positions&&e.getPosition===R&&!e.data?.attributes?.getPosition}})}restoreAccessorState(){return!!this.state.columns&&(this.state.columns.destroy(),this.state.columns=void 0,this.updateColumnModel(null),this.internalState.attributeManager=super._getAttributeManager(),this.initializeAccessorAttributes(),!0)}getModels(){return this.state?.arrowModel?[this.state.arrowModel]:super.getModels()}getNumInstances(){return this.state?.columns&&!Number.isFinite(this.props.numInstances)?this.state.columns.length:super.getNumInstances()}finalizeState(e){super.finalizeState(e),this.state.columns?.destroy(),this.state.ownedArrowGeometry?.destroy(),this.state.emptyTexture.delete()}draw({uniforms:e}){let{columns:t}=this.state,o=this.state.arrowModel??this.state.model;if(!o)return;let{viewport:s,renderPass:i}=this.context,{sizeScale:n,coordinateSystem:r,_instanced:a}=this.props,l={sizeScale:n,rowIndexOffset:0,composeModelMatrix:!a||function(e,t,o=!1){return o?"cartesian"===t:t===e.crs?.signature||"cartesian"===t||"meter-offsets"===t||"default"===t&&!e.isGeospatial}(s,this.state.sourceCrs?.signature||r,!!this.state.preproject),flatShading:!this.state.hasNormals};o.shaderInputs.setProps({simpleMesh:l}),t?t.draw(o,i,e=>{o.setInstanceCount(Math.min(o.instanceCount,Math.max(0,this.getNumInstances()-e))),o.shaderInputs.setProps({simpleMesh:{rowIndexOffset:e}})}):o.draw(i)}get isLoaded(){return!!((this.state?.model||this.state?.arrowModel)&&!this.state.columns?.loading&&super.isLoaded)}getModel(e){let t=new g.A(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:e instanceof y.u?e:N(e),isInstanced:!0});return t.shaderInputs.setProps({simpleMesh:this.getTextureProps(this.props.texture)}),t}setTexture(e){let{model:t}=this.state;t&&t.shaderInputs.setProps({simpleMesh:this.getTextureProps(e)})}getTextureProps(e){let t=e||this.state.emptyTexture;return{..."webgpu"===this.context.device.type?{simpleMeshTexture:t}:{sampler:t},hasTexture:!!e}}}B.defaultProps={mesh:{type:"object",value:null,async:!0},texture:{type:"image",value:null,async:!0},positions:{type:"object",value:null,optional:!0},colors:{type:"object",value:null,optional:!0},sizeScale:{type:"number",value:1,min:0},_instanced:!0,wireframe:!1,material:!0,getPosition:{type:"accessor",value:R},getColor:{type:"accessor",value:[0,0,0,255]},getOrientation:{type:"accessor",value:[0,0,0]},getScale:{type:"accessor",value:[1,1,1]},getTranslation:{type:"accessor",value:[0,0,0]},getTransformMatrix:{type:"accessor",value:[]},textureParameters:{type:"object",ignore:!0,value:null}},B.layerName="SimpleMeshLayer";let U=B}}]);