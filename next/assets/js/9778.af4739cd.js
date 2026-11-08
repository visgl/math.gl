"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["9778"],{95337(e,t,o){o.d(t,{A:()=>z});var i=o(3459),s=o(41881),n=o(84175),r=o(46487),a=o(98881),l=o(66925),c=o(79439),p=o(38846);let m={name:"phongMaterial",firstBindingSlot:0,bindingLayout:[{name:"phongMaterial",group:3}],dependencies:[l.x,a.$n],source:c.X,vs:p.X,fs:p.l,defines:{LIGHTING_FRAGMENT:!0},uniformTypes:{unlit:"i32",ambient:"f32",diffuse:"f32",shininess:"f32",specularColor:"vec3<f32>"},defaultUniforms:{unlit:!1,ambient:.35,diffuse:.6,shininess:32,specularColor:[38.25,38.25,38.25]},getUniforms:e=>({...m.defaultUniforms,...e})};var u=o(95335),g=o(80698),d=o(25337),h=o(99592),f=o(53439);let v=Math.PI/180,y=new Float32Array(16),M=new Float32Array(12);function x(e,t,o){let i=t[0]*v,s=t[1]*v,n=t[2]*v,r=Math.sin(n),a=Math.sin(i),l=Math.sin(s),c=Math.cos(n),p=Math.cos(i),m=Math.cos(s),u=o[0],g=o[1],d=o[2];e[0]=u*m*p,e[1]=u*l*p,e[2]=-(u*a),e[3]=g*(-l*c+m*a*r),e[4]=g*(m*c+l*a*r),e[5]=g*p*r,e[6]=d*(l*r+m*a*c),e[7]=d*(-m*r+l*a*c),e[8]=d*p*c}function C(e){return e[0]=e[0],e[1]=e[1],e[2]=e[2],e[3]=e[4],e[4]=e[5],e[5]=e[6],e[6]=e[8],e[7]=e[9],e[8]=e[10],e[9]=e[12],e[10]=e[13],e[11]=e[14],e.subarray(0,12)}let _={size:12,accessor:["getOrientation","getScale","getTranslation","getTransformMatrix"],shaderAttributes:{instanceModelMatrixCol0:{size:3,elementOffset:0},instanceModelMatrixCol1:{size:3,elementOffset:3},instanceModelMatrixCol2:{size:3,elementOffset:6},instanceTranslation:{size:3,elementOffset:9}},update(e,{startRow:t,endRow:o}){let{data:i,getOrientation:s,getScale:n,getTranslation:r,getTransformMatrix:a}=this.props,l=Array.isArray(a),c=l&&16===a.length,p=Array.isArray(n),m=Array.isArray(s),u=Array.isArray(r),g=c||!l&&!!a(i[0]);g?e.constant=c:e.constant=m&&p&&u;let d=e.value;if(e.constant){let t;g?(y.set(a),t=C(y)):(x(t=M,s,n),t.set(r,9)),e.value=new Float32Array(t)}else{let l=t*e.size,{iterable:h,objectInfo:v}=(0,f.X)(i,t,o);for(let e of h){let t;(v.index++,g)?(y.set(c?a:a(e,v)),t=C(y)):(x(t=M,m?s:s(e,v),p?n:n(e,v)),t.set(u?r:r(e,v),9)),d[l++]=t[0],d[l++]=t[1],d[l++]=t[2],d[l++]=t[3],d[l++]=t[4],d[l++]=t[5],d[l++]=t[6],d[l++]=t[7],d[l++]=t[8],d[l++]=t[9],d[l++]=t[10],d[l++]=t[11]}}}},b=`\
layout(std140) uniform simpleMeshUniforms {
  float sizeScale;
  bool composeModelMatrix;
  bool hasTexture;
  bool flatShading;
} simpleMesh;
`,P={name:"simpleMesh",source:`\
struct SimpleMeshUniforms {
  sizeScale: f32,
  composeModelMatrix: f32,
  hasTexture: f32,
  flatShading: f32,
};

@group(0) @binding(auto) var<uniform> simpleMesh: SimpleMeshUniforms;
@group(0) @binding(auto) var simpleMeshTexture: texture_2d<f32>;
@group(0) @binding(auto) var simpleMeshTextureSampler: sampler;
`,vs:b,fs:b,uniformTypes:{sizeScale:"f32",composeModelMatrix:"f32",hasTexture:"f32",flatShading:"f32"}},T=`#version 300 es
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
`;function I(e){let t=e.positions||e.POSITION;i.A.assert(t,'no "postions" or "POSITION" attribute in mesh');let o=t.value.length/t.size,s=e.COLOR_0||e.colors;s||(s={size:3,value:new Float32Array(3*o).fill(1)});let n=e.NORMAL||e.normals;n||(n={size:3,value:new Float32Array(3*o).fill(0)});let r=e.TEXCOORD_0||e.texCoords;return r||(r={size:2,value:new Float32Array(2*o).fill(0)}),{positions:t,colors:s,normals:n,texCoords:r}}function L(e){return e instanceof d.V?(e.attributes=I(e.attributes),e):new d.V(e.attributes?{...e,topology:"triangle-list",attributes:I(e.attributes)}:{topology:"triangle-list",attributes:I(e)})}class O extends s.A{getShaders(){return super.getShaders({vs:T,fs:S,source:A,modules:[n.A,r.A,m,u.Ay,P]})}getBounds(){if(this.props._instanced)return super.getBounds();let e=this.state.positionBounds;if(e)return e;let{mesh:t}=this.props;if(!t)return null;if(!(e=t.header?.boundingBox)){let{attributes:o}=L(t);o.POSITION=o.POSITION||o.positions,e=function(e){let t=1/0,o=1/0,i=1/0,s=-1/0,n=-1/0,r=-1/0,a=e.POSITION?e.POSITION.value:[],l=a&&a.length;for(let e=0;e<l;e+=3){let l=a[e],c=a[e+1],p=a[e+2];t=l<t?l:t,o=c<o?c:o,i=p<i?p:i,s=l>s?l:s,n=c>n?c:n,r=p>r?p:r}return[[t,o,i],[s,n,r]]}(o)}return this.state.positionBounds=e,e}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{transition:!0,type:"float64",fp64:this.use64bitPositions(),size:3,accessor:"getPosition"},instanceColors:{type:"unorm8",transition:!0,size:this.props.colorFormat.length,accessor:"getColor",defaultValue:[0,0,0,255]},instanceModelMatrix:_}),this.setState({emptyTexture:this.context.device.createTexture({data:new Uint8Array(4),width:1,height:1})})}updateState(e){super.updateState(e);let{props:t,oldProps:o,changeFlags:i}=e;if(t.mesh!==o.mesh||i.extensionsChanged){if(this.state.positionBounds=null,this.state.model?.destroy(),t.mesh){this.state.model=this.getModel(t.mesh);let e=t.mesh.attributes||t.mesh;this.setState({hasNormals:!!(e.NORMAL||e.normals)})}this.getAttributeManager().invalidateAll()}t.texture!==o.texture&&t.texture instanceof g.g&&this.setTexture(t.texture),this.state.model&&this.state.model.setTopology(this.props.wireframe?"line-strip":"triangle-list")}finalizeState(e){super.finalizeState(e),this.state.emptyTexture.delete()}draw({uniforms:e}){let{model:t}=this.state;if(!t)return;let{viewport:o,renderPass:i}=this.context,{sizeScale:s,coordinateSystem:n,_instanced:r}=this.props,a={sizeScale:s,composeModelMatrix:!r||"cartesian"===n||"meter-offsets"===n||"default"===n&&!o.isGeospatial,flatShading:!this.state.hasNormals};t.shaderInputs.setProps({simpleMesh:a}),t.draw(i)}get isLoaded(){return!!(this.state?.model&&super.isLoaded)}getModel(e){let t=new h.K(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:L(e),isInstanced:!0});return t.shaderInputs.setProps({simpleMesh:this.getTextureProps(this.props.texture)}),t}setTexture(e){let{model:t}=this.state;t&&t.shaderInputs.setProps({simpleMesh:this.getTextureProps(e)})}getTextureProps(e){let t=e||this.state.emptyTexture;return{..."webgpu"===this.context.device.type?{simpleMeshTexture:t}:{sampler:t},hasTexture:!!e}}}O.defaultProps={mesh:{type:"object",value:null,async:!0},texture:{type:"image",value:null,async:!0},sizeScale:{type:"number",value:1,min:0},_instanced:!0,wireframe:!1,material:!0,getPosition:{type:"accessor",value:e=>e.position},getColor:{type:"accessor",value:[0,0,0,255]},getOrientation:{type:"accessor",value:[0,0,0]},getScale:{type:"accessor",value:[1,1,1]},getTranslation:{type:"accessor",value:[0,0,0]},getTransformMatrix:{type:"accessor",value:[]},textureParameters:{type:"object",ignore:!0,value:null}},O.layerName="SimpleMeshLayer";let z=O}}]);