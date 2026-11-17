"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["2911"],{59452(e,t,i){i.d(t,{A:()=>l});var o=i(10032),s=i(43411),n=i(38055),r=i(12897);class a extends o.A{get isComposite(){return!0}get isDrawable(){return!1}get isLoaded(){return super.isLoaded&&this.getSubLayers().every(e=>e.isLoaded)}getSubLayers(){return this.internalState&&this.internalState.subLayers||[]}initializeState(e){}setState(e){super.setState(e),this.setNeedsUpdate()}getPickingInfo({info:e}){let{object:t}=e;return t&&t.__source&&t.__source.parent&&t.__source.parent.id===this.id&&(e.object=t.__source.object,e.index=t.__source.index),e}filterSubLayer(e){return!0}shouldRenderSubLayer(e,t){return t&&t.length}getSubLayerClass(e,t){let{_subLayerProps:i}=this.props;return i&&i[e]&&i[e].type||t}getSubLayerRow(e,t,i){return e.__source={parent:this,object:t,index:i},e}getSubLayerAccessor(e){if("function"==typeof e){let t={index:-1,data:this.props.data,target:[]};return(i,o)=>i&&i.__source?(t.index=i.__source.index,e(i.__source.object,t)):e(i,o)}return e}getSubLayerProps(e={}){let{opacity:t,pickable:i,visible:o,parameters:s,getPolygonOffset:n,highlightedObjectIndex:a,autoHighlight:l,highlightColor:c,coordinateSystem:p,coordinateOrigin:f,wrapLongitude:g,positionFormat:d,modelMatrix:u,extensions:h,fetch:x,operation:v,_subLayerProps:m}=this.props,y={id:"",updateTriggers:{},opacity:t,pickable:i,visible:o,parameters:s,getPolygonOffset:n,highlightedObjectIndex:a,autoHighlight:l,highlightColor:c,coordinateSystem:p,coordinateOrigin:f,wrapLongitude:g,positionFormat:d,modelMatrix:u,extensions:h,fetch:x,operation:v},_=m&&e.id&&m[e.id],C=_&&_.updateTriggers,b=e.id||"sublayer";if(_){let t=this.props[r.fW],i=e.type?e.type._propTypes:{};for(let e in _){let o=i[e]||t[e];o&&"accessor"===o.type&&(_[e]=this.getSubLayerAccessor(_[e]))}}for(let t of(Object.assign(y,e,_),y.id=`${this.props.id}-${b}`,y.updateTriggers={all:this.props.updateTriggers?.all,...e.updateTriggers,...C},h)){let e=t.getSubLayerProps.call(this,t);e&&Object.assign(y,e,{updateTriggers:Object.assign(y.updateTriggers,e.updateTriggers)})}return y}_updateAutoHighlight(e){for(let t of this.getSubLayers())t.updateAutoHighlight(e)}_getAttributeManager(){return null}_postUpdate(e,t){let i=this.internalState.subLayers,o=!i||this.needsUpdate();if(o){let e=this.renderLayers();i=(0,n.B)(e,Boolean),this.internalState.subLayers=i}for(let e of((0,s.A)("compositeLayer.renderLayers",this,o,i),i))e.parent=this}}a.layerName="CompositeLayer";let l=a},86982(e,t,i){i.d(t,{A:()=>k});var o=i(10032),s=i(84175),n=i(46487),r=i(83895),a=i(60608),l=i(9350),c=i(88599),p=i(3459),f=i(3770),g=i(96087),d=i(25337);let u=`\
layout(std140) uniform iconUniforms {
  float sizeScale;
  vec2 iconsTextureDim;
  float sizeBasis;
  float sizeMinPixels;
  float sizeMaxPixels;
  bool billboard;
  highp int sizeUnits;
  float alphaCutoff;
  highp uint rowIndexOffset;
} icon;
`,h={name:"icon",vs:u,fs:u,uniformTypes:{sizeScale:"f32",iconsTextureDim:"vec2<f32>",sizeBasis:"f32",sizeMinPixels:"f32",sizeMaxPixels:"f32",billboard:"f32",sizeUnits:"i32",alphaCutoff:"f32",rowIndexOffset:"u32"}},x=`\
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
geometry.pickingColor = picking_getPickingColorFromIndex(uint(gl_InstanceID) + icon.rowIndexOffset);
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
gl_Position = project_globe_billboard_clipspace(gl_Position, geometry.position.xyz);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
vec3 offset = vec3(pixelOffset, 0.0);
DECKGL_FILTER_SIZE(offset, geometry);
gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);
if (project_globe_is_occluded(geometry.position.xyz)) {
gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
}
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
`,v=`\
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
`,m=`\
struct IconUniforms {
  sizeScale: f32,
  iconsTextureDim: vec2<f32>,
  sizeBasis: f32,
  sizeMinPixels: f32,
  sizeMaxPixels: f32,
  billboard: i32,
  sizeUnits: i32,
  alphaCutoff: f32,
  rowIndexOffset: u32
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
    let anchorCommon = project_position_vec3_f64(inp.instancePositions, inp.instancePositions64Low);
    geometry.position = vec4<f32>(anchorCommon, 1.0);
    var pos = project_position_to_clipspace(inp.instancePositions, inp.instancePositions64Low, vec3<f32>(0.0)); // TODO, &geometry.position);
    pos = project_globe_billboard_clipspace(pos, anchorCommon);
    // DECKGL_FILTER_GL_POSITION(pos, geometry);

    var offset = vec3<f32>(pixelOffset, 0.0);
    DECKGL_FILTER_SIZE(&offset, geometry);
    let clipOffset = project_pixel_size_to_clipspace(offset.xy);
    pos = vec4<f32>(pos.x + clipOffset.x, pos.y + clipOffset.y, pos.z, pos.w);
    // Hide icons whose anchor is behind the globe; culling handles non-billboard icons
    if (project_globe_is_occluded(anchorCommon)) {
      pos = vec4<f32>(0.0, 0.0, 2.0, 1.0);
    }
    outp.position = pos;
  } else {
    var offset_common = vec3<f32>(project_pixel_size_vec2(pixelOffset), 0.0);
    DECKGL_FILTER_SIZE(&offset_common, geometry);
    let projected = project_position_to_clipspace_and_commonspace(inp.instancePositions, inp.instancePositions64Low, offset_common);
    geometry.position = projected.commonPosition;
    var pos = projected.clipPosition;
    // DECKGL_FILTER_GL_POSITION(pos, geometry);
    outp.position = pos;
  }

  let uvMix = (inp.positions.xy + vec2<f32>(1.0, 1.0)) * 0.5;
  outp.vTextureCoords = mix(inp.instanceIconFrames.xy, inp.instanceIconFrames.xy + iconSize, uvMix) / icon.iconsTextureDim;

  outp.vColor = inp.instanceColors;
  // DECKGL_FILTER_COLOR(outp.vColor, geometry);

  outp.vColorMode = inp.instanceColorModes;
  outp.pickingColor = geometry.pickingColor;

  DECKGL_FILTER_GL_POSITION(&outp.position, geometry);

  return outp;
}

@fragment
fn fragmentMain(inp: Varyings) -> @location(0) vec4<f32> {
  // expose to deck.gl filter injection targets
  geometry.uv = inp.uv;
  fragmentGeometry.uv = geometry.uv;

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
    var extensionColor = vec4<f32>(inp.pickingColor, 1.0);
    DECKGL_FILTER_COLOR(&extensionColor, fragmentGeometry);
    // Color filters may discard, but must not alter the picking payload.
    return vec4<f32>(inp.pickingColor, 1.0);
  }

  var fragColor = vec4<f32>(rgb, a);

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
`;var y=i(327),_=i(53439);let C=()=>{},b={minFilter:"linear",mipmapFilter:"linear",magFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"},P={x:0,y:0,width:0,height:0};function z(e){return e&&(e.id||e.url)}function w(e){let{device:t}=e;"webgl"===t.type?e.generateMipmapsWebGL():"webgpu"===t.type&&t.generateMipmapsWebGPU(e)}function L(e,t,i){for(let o=0;o<t.length;o++){let{icon:s,xOffset:n}=t[o];e[z(s)]={...s,x:n,y:i}}}class I{constructor(e,{onUpdate:t=C,onError:i=C}){this._loadOptions=null,this._texture=null,this._externalTexture=null,this._mapping={},this._samplerParameters=null,this._pendingCount=0,this._autoPacking=!1,this._xOffset=0,this._yOffset=0,this._rowHeight=0,this._buffer=4,this._canvasWidth=1024,this._canvasHeight=0,this._canvas=null,this.device=e,this.onUpdate=t,this.onError=i}finalize(){this._texture?.delete(),this._texture=null}getTexture(){return this._texture||this._externalTexture}getIconMapping(e){let t=this._autoPacking?z(e):e;return this._mapping[t]||P}setProps({loadOptions:e,autoPacking:t,iconAtlas:i,iconMapping:o,textureParameters:s}){e&&(this._loadOptions=e),void 0!==t&&(this._autoPacking=t),o&&(this._mapping=o),i&&(this._texture?.delete(),this._texture=null,this._externalTexture=i),s&&(this._samplerParameters=s)}get isLoaded(){return 0===this._pendingCount}packIcons(e,t){if(!this._autoPacking||"u"<typeof document)return;let i=Object.values(function(e,t,i){if(!e||!t)return null;i=i||{};let o={},{iterable:s,objectInfo:n}=(0,_.X)(e);for(let e of s){n.index++;let s=t(e,n),r=z(s);if(!s)throw Error("Icon is missing.");if(!s.url)throw Error("Icon url is missing.");o[r]||i[r]&&s.url===i[r].url||(o[r]={...s,source:e,sourceIndex:n.index})}return o}(e,t,this._mapping)||{});if(i.length>0){let{mapping:e,xOffset:t,yOffset:o,rowHeight:s,canvasHeight:n}=function({icons:e,buffer:t,mapping:i={},xOffset:o=0,yOffset:s=0,rowHeight:n=0,canvasWidth:r}){let a=[];for(let l=0;l<e.length;l++){let c=e[l];if(!i[z(c)]){let{height:e,width:l}=c;o+l+t>r&&(L(i,a,s),o=0,s=n+s+t,n=0,a=[]),a.push({icon:c,xOffset:o}),o=o+l+t,n=Math.max(n,e)}}return a.length>0&&L(i,a,s),{mapping:i,rowHeight:n,xOffset:o,yOffset:s,canvasWidth:r,canvasHeight:Math.pow(2,Math.ceil(Math.log2(n+s+t)))}}({icons:i,buffer:this._buffer,canvasWidth:this._canvasWidth,mapping:this._mapping,rowHeight:this._rowHeight,xOffset:this._xOffset,yOffset:this._yOffset});this._rowHeight=s,this._mapping=e,this._xOffset=t,this._yOffset=o,this._canvasHeight=n,this._texture||(this._texture=this.device.createTexture({format:"rgba8unorm",data:null,width:this._canvasWidth,height:this._canvasHeight,sampler:this._samplerParameters||b,mipLevels:this.device.getMipLevelCount(this._canvasWidth,this._canvasHeight)})),this._texture.height!==this._canvasHeight&&(this._texture=function(e,t,i,o){let{width:s,height:n,device:r}=e,a=r.createTexture({format:"rgba8unorm",width:t,height:i,sampler:o,mipLevels:r.getMipLevelCount(t,i)}),l=r.createCommandEncoder();l.copyTextureToTexture({sourceTexture:e,destinationTexture:a,width:s,height:n});let c=l.finish();return r.submit(c),w(a),e.destroy(),a}(this._texture,this._canvasWidth,this._canvasHeight,this._samplerParameters||b)),this.onUpdate(!0),this._canvas=this._canvas||document.createElement("canvas"),this._loadIcons(i)}}_loadIcons(e){let t=this._canvas.getContext("2d",{willReadFrequently:!0});for(let i of e)this._pendingCount++,(0,y.H)(i.url,this._loadOptions).then(e=>{let o=z(i),s=this._mapping[o],{x:n,y:r,width:a,height:l}=s,{image:c,width:p,height:f}=function(e,t,i,o){let s=Math.min(i/t.width,o/t.height),n=Math.floor(t.width*s),r=Math.floor(t.height*s);return 1===s?{image:t,width:n,height:r}:(e.canvas.height=r,e.canvas.width=n,e.clearRect(0,0,n,r),e.drawImage(t,0,0,t.width,t.height,0,0,n,r),{image:e.canvas,width:n,height:r})}(t,e,a,l),g=n+(a-p)/2,d=r+(l-f)/2;this._texture?.copyExternalImage({image:c,x:g,y:d,width:p,height:f}),s.x=g,s.y=d,s.width=p,s.height=f,this._texture&&w(this._texture),this.onUpdate(p!==a||f!==l)}).catch(e=>{this.onError({url:i.url,source:i.source,sourceIndex:i.sourceIndex,loadOptions:this._loadOptions,error:e})}).finally(()=>{this._pendingCount--})}}let S=[0,0,0,255],O={positions:{attribute:"instancePositions",accessor:"getPosition",semantic:"position",size:3},sizes:{attribute:"instanceSizes",accessor:"getSize",semantic:"scalar",size:1,defaultValue:1},colors:{attribute:"instanceColors",accessor:"getColor",semantic:"color",size:4},angles:{attribute:"instanceAngles",accessor:"getAngle",semantic:"scalar",size:1},pixelOffsets:{attribute:"instancePixelOffset",accessor:"getPixelOffset",semantic:"vector",size:2},iconOffset:{attribute:"instanceOffsets",accessor:"iconOffset",semantic:"vector",size:2,prop:!1},iconFrame:{attribute:"instanceIconFrames",accessor:"iconFrame",semantic:"vector",size:4,prop:!1},iconMask:{attribute:"instanceColorModes",accessor:"iconMask",semantic:"vector",size:1,prop:!1}},A={positions:{type:"object",value:null,optional:!0},sizes:{type:"object",value:null,optional:!0},colors:{type:"object",value:null,optional:!0},angles:{type:"object",value:null,optional:!0},pixelOffsets:{type:"object",value:null,optional:!0},iconAtlas:{type:"image",value:null,async:!0},iconMapping:{type:"object",value:{},async:!0},sizeScale:{type:"number",value:1,min:0},billboard:!0,sizeUnits:"pixels",sizeBasis:"height",sizeMinPixels:{type:"number",min:0,value:0},sizeMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},alphaCutoff:{type:"number",value:.05,min:0,max:1},getPosition:{type:"accessor",value:e=>e.position},getIcon:{type:"accessor",value:e=>e.icon},getColor:{type:"accessor",value:S},getSize:{type:"accessor",value:1},getAngle:{type:"accessor",value:0},getPixelOffset:{type:"accessor",value:[0,0]},onIconError:{type:"function",value:null,optional:!0},textureParameters:{type:"object",ignore:!0,value:null}};class E extends o.A{getShaders(){let e=!!this.props.data?.attributes?.rowIndexes;return super.getShaders({vs:x,fs:v,source:function(e,t=!1){return(t?m.replace("@location(0) positions: vec2<f32>,","@builtin(vertex_index) vertexIndex: u32,").replace("  // write geometry fields",`  let quad = array(vec2<f32>(-1, 1), vec2<f32>(1, 1), vec2<f32>(-1, -1), vec2<f32>(1, -1));
  let quadPosition = quad[inp.vertexIndex];
  // write geometry fields`).replaceAll("inp.positions","quadPosition"):m).replace("PICKING_COLOR_ATTRIBUTE",e?"@location(10) rowIndexes: u32,":"").replace("PICKING_COLOR_VALUE",e?"picking_getPickingColorFromIndex(inp.rowIndexes)":"picking_getPickingColorFromIndex(inp.instanceIndex + icon.rowIndexOffset)")}(e,!!this.state?.columns),defines:e?{USE_ROW_INDEXES:!0}:{},modules:[s.A,n.A,r.Ay,h]})}initializeState(){this.state={iconManager:new I(this.context.device,{onUpdate:this._onUpdate.bind(this),onError:this._onError.bind(this)})},this._initializeAttributes()}_initializeAttributes(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),...this.usePositionTransforms(),transition:!0,accessor:"getPosition"},instanceSizes:{size:1,transition:!0,bufferGroup:"icon-instance-data",accessor:"getSize",defaultValue:1},instanceIconDefs:{size:7,bufferGroup:"icon-instance-data",accessor:"getIcon",transform:this.getInstanceIconDef,shaderAttributes:{instanceOffsets:{size:2,elementOffset:0},instanceIconFrames:{size:4,elementOffset:2},instanceColorModes:{size:1,elementOffset:6}}},instanceColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,bufferGroup:"icon-instance-data",accessor:"getColor",defaultValue:S},instanceAngles:{size:1,transition:!0,bufferGroup:"icon-instance-data",accessor:"getAngle"},instancePixelOffset:{size:2,transition:!0,bufferGroup:"icon-instance-data",accessor:"getPixelOffset"},...this.props.data?.attributes?.rowIndexes?{rowIndexes:{size:1,type:"uint32",noAlloc:!0}}:{}})}updateState(e){super.updateState(e);let{props:t,oldProps:i,changeFlags:o}=e,s=this.getAttributeManager(),{iconAtlas:n,iconMapping:r,data:a,getIcon:l,textureParameters:c}=t,{iconManager:p}=this.state;if("string"==typeof n)return;let f=n||this.internalState.isAsyncPropLoading("iconAtlas");p.setProps({loadOptions:t.loadOptions,autoPacking:!f,iconAtlas:n,iconMapping:f?r:null,textureParameters:c}),f?i.iconMapping!==t.iconMapping&&s?.invalidate("getIcon"):(o.dataChanged||t.iconAtlas!==i.iconAtlas||o.updateTriggersChanged&&(o.updateTriggersChanged.all||o.updateTriggersChanged.getIcon))&&p.packIcons(a,l),!this._updateColumnState(e)&&o.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll())}_updateColumnState(e){return Object.entries(O).some(([t,i])=>!1!==i.prop&&e.props[t])?(this._updateColumns(e),!0):!!this.state.columns&&(this._destroyColumns(),this.internalState.attributeManager=super._getAttributeManager(),this._initializeAttributes(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll(),!0)}_updateColumns(e){let{props:t,oldProps:i,changeFlags:o}=e;if(t.extensions.length||Object.keys(t.transitions||{}).length)throw Error("Icon Arrow columns do not support extensions or transitions");let s=!!t.data?.attributes?.rowIndexes;if(!this.state.columns||!!i.data?.attributes?.rowIndexes!==s){this._destroyColumns(),this.state.model?.destroy(),this.state.model=void 0,this.internalState.attributeManager?.finalize(),this.internalState.attributeManager=null;let e=new a.h(this.context.device,O,"Icon",!0);this.state.columns=e;let i="webgl"===this.context.device.type?(0,f.M)(this.context.device,this._getGeometry()):void 0;this.state.arrowGeometry=i,this.state.arrowModel=new g.X(this.context.device,{...this.getShaders(),id:t.id,...i?{geometry:i}:{topology:"triangle-strip",vertexCount:4},bufferLayout:e.getBufferLayouts(s),isInstanced:!0,inferDrawCount:"instance"})}let n=(e,i)=>this.getInstanceIconDef(t.getIcon(e,i)),r={iconOffset:(e,t)=>n(e,t).slice(0,2),iconFrame:(e,t)=>n(e,t).slice(2,6),iconMask:(e,t)=>n(e,t)[6]};this.state.columns.updateIfNeeded({props:Object.assign(Object.create(t),r),oldProps:Object.assign(Object.create(i),r),changeFlags:{...o,dataChanged:o.dataChanged||(!!this.state.iconDefinitionsDirty||t.iconMapping!==i.iconMapping)&&"icon definitions changed"}},{dataLoading:this.internalState.isAsyncPropLoading("data"),changed:()=>{this.setState({}),this.setNeedsUpdate()},failed:e=>this.raiseError(e,"converting Arrow columns"),positionOptions:{transform:this.usePositionTransforms().transform?.bind(this),fp64:this.use64bitPositions(),requireRows:!0}}),this.state.iconDefinitionsDirty=!1}_destroyColumns(){this.state.columns?.destroy(),this.state.arrowModel?.destroy(),this.state.arrowGeometry?.destroy(),this.state.columns=void 0,this.state.arrowModel=void 0,this.state.arrowGeometry=void 0}getModels(){return this.state?.arrowModel?[this.state.arrowModel]:super.getModels()}getBounds(){return this.state?.columns?this.state.columns.getBounds():super.getBounds()}getNumInstances(){return this.state?.columns&&!Number.isFinite(this.props.numInstances)?this.state.columns.length:super.getNumInstances()}get isLoaded(){return super.isLoaded&&this.state.iconManager.isLoaded&&!this.state.columns?.loading}finalizeState(e){this._destroyColumns(),super.finalizeState(e),this.state.iconManager.finalize()}draw({uniforms:e}){this._drawModel(this.state.arrowModel??this.state.model)}_drawModel(e){let{sizeScale:t,sizeBasis:i,sizeMinPixels:o,sizeMaxPixels:s,sizeUnits:n,billboard:r,alphaCutoff:a}=this.props,{iconManager:c}=this.state,p=c.getTexture();if(p){let c={rowIndexOffset:0,iconsTexture:p,iconsTextureDim:[p.width,p.height],sizeUnits:l.p5[n],sizeScale:t,sizeBasis:+("height"===i),sizeMinPixels:o,sizeMaxPixels:s,billboard:r,alphaCutoff:a};e.shaderInputs.setProps({icon:c}),this.state.columns?this.state.columns.draw(e,this.context.renderPass,t=>{e.setInstanceCount(Math.min(e.instanceCount,Math.max(0,this.getNumInstances()-t))),e.shaderInputs.setProps({icon:{rowIndexOffset:t}})}):e.draw(this.context.renderPass)}}_getGeometry(){return new d.V2({topology:"triangle-strip",attributes:{positions:{size:2,value:new Float32Array([-1,1,1,1,-1,-1,1,-1])}}})}_getModel(e=this.props.id){return new c.A(this.context.device,{...this.getShaders(),id:e,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:this._getGeometry(),isInstanced:!0})}_onUpdate(e){e?(this.state.iconDefinitionsDirty=!0,this.getAttributeManager()?.invalidate("getIcon"),this.setNeedsUpdate()):this.setNeedsRedraw()}_onError(e){let t=this.getCurrentLayer()?.props.onIconError;t?t(e):p.A.error(e.error.message)()}getInstanceIconDef(e){let{x:t,y:i,width:o,height:s,mask:n,anchorX:r=o/2,anchorY:a=s/2}=this.state.iconManager.getIconMapping(e);return[o/2-r,s/2-a,t,i,o,s,+!!n]}}E.defaultProps=A,E.layerName="IconLayer";let k=E},41661(e,t,i){i.d(t,{$q:()=>h,A4:()=>c,Dt:()=>l,S8:()=>g});var o=i(55230),s=i(94402);let n="clockwise",r="counter-clockwise",a={isClosed:!0};function l(e){return"positions"in e?e.positions:e}function c(e){return"holeIndices"in e?e.holeIndices:null}function p(e,t,i,o,n){let r,l,c=t,p=i.length;for(let t=0;t<p;t++)for(let s=0;s<o;s++)e[c++]=i[t][s]||0;if(r=i[0],l=i[i.length-1],r[0]!==l[0]||r[1]!==l[1]||r[2]!==l[2])for(let t=0;t<o;t++)e[c++]=i[0][t]||0;return a.start=t,a.end=c,a.size=o,(0,s.UD)(e,n,a),c}function f(e,t,i,o,n=0,r,l){let c=(r=r||i.length)-n;if(c<=0)return t;let p=t;for(let t=0;t<c;t++)e[p++]=i[n+t];if(!function(e,t,i,o){for(let s=0;s<t;s++)if(e[i+s]!==e[o-t+s])return!1;return!0}(i,o,n,r))for(let t=0;t<o;t++)e[p++]=i[n+t];return a.start=t,a.end=p,a.size=o,(0,s.UD)(e,l,a),p}function g(e,t){var i,o=e;if(!Array.isArray(o=o&&o.positions||o)&&!ArrayBuffer.isView(o))throw Error("invalid polygon");let s=[],a=[];if("positions"in e){let{positions:i,holeIndices:o}=e;if(o){let e=0;for(let l=0;l<=o.length;l++)e=f(s,e,i,t,o[l-1],o[l],0===l?n:r),a.push(e);return a.pop(),{positions:s,holeIndices:a}}e=i}if(!Array.isArray(e[0]))return f(s,0,e,t,0,s.length,n),s;if(!((i=e).length>=1&&i[0].length>=2&&Number.isFinite(i[0][0]))){let i=0;for(let[o,l]of e.entries())i=p(s,i,l,t,0===o?n:r),a.push(i);return a.pop(),{positions:s,holeIndices:a}}return p(s,0,e,t,n),s}function d(e,t,i){let o=e.length/3,s=0;for(let n=0;n<o;n++){let r=(n+1)%o;s+=e[3*n+t]*e[3*r+i],s-=e[3*r+t]*e[3*n+i]}return Math.abs(s/2)}function u(e,t,i,o){let s=e.length/3;for(let n=0;n<s;n++){let s=3*n,r=e[s+0],a=e[s+1],l=e[s+2];e[s+t]=r,e[s+i]=a,e[s+o]=l}}function h(e,t,i,s,n){let r=c(e);r&&(r=r.map(e=>e/t));let a=l(e),p=s&&(3===t||n),f=t;if(p&&2===t){let e=[];for(let t=0;t<a.length;t+=2)e.push(a[t],a[t+1],0);a=e,f=3}if(i){let e=a.length;a=a.slice();let t=[];for(let o=0;o<e;o+=f){t[0]=a[o],t[1]=a[o+1],p&&(t[2]=a[o+2]??0);let e=i(t);a[o]=e[0],a[o+1]=e[1],p&&(a[o+2]=e[2])}}let g=n?a.slice():null;if(p){let e=d(a,0,1),t=d(a,0,2),o=d(a,1,2);if(!e&&!t&&!o)return[];e>t&&e>o||(t>o?(i||(a=a.slice()),u(a,0,2,1)):(i||(a=a.slice()),u(a,2,0,1)))}let h=o(a,r,f);if(g)for(let e=0;e<h.length;e+=3){let t=h[e]*f,i=h[e+1]*f,o=h[e+2]*f;g[t]*(g[i+1]*g[o+2]-g[i+2]*g[o+1])+g[t+1]*(g[i+2]*g[o]-g[i]*g[o+2])+g[t+2]*(g[i]*g[o+1]-g[i+1]*g[o])<0&&([h[e+1],h[e+2]]=[h[e+2],h[e+1]])}return h}},41363(e,t,i){i.d(t,{A:()=>E});var o=i(10032),s=i(84175),n=i(46487),r=i(87238),a=i(83895),l=i(7914),c=i(88599),p=i(25337),f=i(41661),g=i(44941),d=i(94402),u=i(86081),h=i(44168),x=i(22660);class v extends g.A{constructor(e){let{fp64:t,IndexType:i=Uint32Array}=e;super({...e,attributes:{positions:{size:3,type:t?Float64Array:Float32Array},vertexValid:{type:Uint16Array,size:1},indices:{type:i,size:1}}})}get(e){let{attributes:t}=this;return"indices"===e?t.indices&&t.indices.subarray(0,this.vertexCount):t[e]}updateGeometry(e){super.updateGeometry(e);let t=this.buffers.indices;if(t)this.vertexCount=(t.value||t).length;else if(this.data&&!this.geometryAccessor)throw Error("missing indices buffer")}prepareGeometry(e){return this.preparePolygon(e,this.inputPositionSize)}normalizeGeometry(e){if(!this.opts.transform)return this.preparePolygon(e,this.positionSize);if(!this.normalize)return e;if(m(e)){for(let t of e){let{positions:e,holeIndices:i,edgeTypes:o}=t,s=[...i||[],e.length],n=0;for(let t=0;t<s.length;t++){let i=s[t];if((0,d.UD)(e,0===t?"clockwise":"counter-clockwise",{start:n,end:i,size:this.positionSize,isClosed:!0})&&o){let e=n/this.positionSize,t=i/this.positionSize-1,s=o.slice(e,t).reverse();for(let t=0;t<s.length;t++)o[e+t]=s[t]}n=i}}return e}return f.S8(e,this.positionSize)}preparePolygon(e,t){if(this.normalize){let i=f.S8(e,t);if(this.opts.resolution){let e=(0,u.w)(f.Dt(i),f.A4(i),{size:t,gridResolution:this.opts.resolution,edgeTypes:!0});return this.refinePolygons(e,t)}if(this.opts.wrapLongitude){let e=(0,h.E)(f.Dt(i),f.A4(i),{size:t,maxLatitude:86,edgeTypes:!0});return this.refinePolygons(e,t)}return this.opts.projectionTolerance?this.refinePolygons([i],t):i}return e}refinePolygons(e,t){let{projectionTolerance:i,projectionToleranceScale:o,transform:s}=this.opts;if(!i)return e;if(!s)throw Error("Projection refinement requires preprojected polygons");let n=o||[1,1,1];return e.map(e=>{let o=f.Dt(e),r=f.A4(e),a=e.edgeTypes,l=[],c=[],p=[],g=0;for(let e of[...r||[],o.length]){g&&c.push(l.length);let r=Array.from(o.slice(g,e));r.length&&r.slice(0,t).some((e,i)=>e!==r[r.length-t+i])&&r.push(...r.slice(0,t));let f=(0,x.A)(r,{size:t,targetSize:3,transform:e=>s(Array.from(e)).map((e,t)=>e*n[t]),tolerance:i});for(let e of f.sourcePositions)l.push(e);for(let e=0;e<f.segmentIndices.length;e++){let i=g/t+(f.segmentIndices[e]+ +(1===f.segmentFractions[e]));p.push(a?a[i]:1)}p[p.length-1]=0,g=e}return{positions:l,holeIndices:c,edgeTypes:p}})}getGeometrySize(e){if(m(e)){let t=0;for(let i of e)t+=this.getGeometrySize(i);return t}return f.Dt(e).length/this.positionSize}getGeometryFromBuffer(e){return this.normalize||this.opts.transform||!this.buffers.indices?super.getGeometryFromBuffer(e):null}updateGeometryAttributes(e,t){if(e&&m(e))for(let i of e){let e=this.getGeometrySize(i);t.geometrySize=e,this.updateGeometryAttributes(i,t),t.vertexStart+=e,t.indexStart=this.indexStarts[t.geometryIndex+1]}else this._updateIndices(e,t),this._updatePositions(e,t),this._updateVertexValid(e,t)}_updateIndices(e,{geometryIndex:t,vertexStart:i,indexStart:o}){let{attributes:s,indexStarts:n,typedArrayManager:r}=this,a=s.indices;if(!a||!e)return;let l=o,c=f.$q(e,this.positionSize,this.opts.preproject,this.opts.full3d,this.opts.geocentric);a=r.allocate(a,o+c.length,{copy:!0});for(let e=0;e<c.length;e++)a[l++]=c[e]+i;n[t+1]=o+c.length,s.indices=a}_updatePositions(e,{vertexStart:t,geometrySize:i}){let{attributes:{positions:o},positionSize:s}=this;if(!o||!e)return;let n=f.Dt(e);for(let e=t,r=0;r<i;e++,r++){let t=n[r*s],i=n[r*s+1],a=s>2?n[r*s+2]:0;o[3*e]=t,o[3*e+1]=i,o[3*e+2]=a}}_updateVertexValid(e,{vertexStart:t,geometrySize:i}){let{positionSize:o}=this,s=this.attributes.vertexValid,n=e&&f.A4(e);if(e&&e.edgeTypes?s.set(e.edgeTypes,t):s.fill(1,t,t+i),n)for(let e=0;e<n.length;e++)s[t+n[e]/o-1]=0;s[t+i-1]=0}}function m(e){return Array.isArray(e)&&e.length>0&&!Number.isFinite(e[0])}let y=`\
layout(std140) uniform solidPolygonUniforms {
  bool extruded;
  bool isWireframe;
  float elevationScale;
} solidPolygon;
`,_={name:"solidPolygon",source:`\
struct SolidPolygonUniforms {
  extruded: f32,
  isWireframe: f32,
  elevationScale: f32,
};

@group(0) @binding(auto) var<uniform> solidPolygon: SolidPolygonUniforms;
`,vs:y,fs:y,uniformTypes:{extruded:"f32",isWireframe:"f32",elevationScale:"f32"}},C=`\
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
`,b=`\
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
`,P=`\
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
`,z=`\
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
`}function L(){return`\
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
`}var I=i(6053);let S=[0,0,0,255],O={enter:(e,t)=>t.length?t.subarray(t.length-e.length):e};class A extends o.A{getShaders(e){var t;let i=this.props._normalize||"CCW"!==this.props._windingOrder?1:0;return super.getShaders({vs:"top"===e?b:P,fs:z,source:(t=!!i,"top"===e?`\
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

${L()}
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

${L()}
`),defines:{RING_WINDING_ORDER_CW:i},modules:[s.A,n.A,r.J,a.Ay,_]})}get wrapLongitude(){return!1}getBounds(){return this.getAttributeManager()?.getBounds(["vertexPositions"])}initializeState(){this.setState({numInstances:0,polygonTesselator:new v({fp64:this.use64bitPositions(),IndexType:Uint32Array})});let e=this.getAttributeManager(),t="webgpu"===this.context.device.type;e.add({indices:{size:1,isIndexed:!0,update:this.calculateIndices,noAlloc:!0},vertexPositions:{...this.usePositionTransforms(),size:3,type:"float64",stepMode:"dynamic",fp64:this.use64bitPositions(),transition:O,accessor:"getPolygon",update:this.calculatePositions,noAlloc:!0,shaderAttributes:{nextVertexPositions:{vertexOffset:1}}},[t?"vertexValid":"instanceVertexValid"]:{size:1,type:t?"float32":"uint16",stepMode:"instance",update:this.calculateVertexValid,noAlloc:!0},elevations:{transform:null,size:1,stepMode:"dynamic",transition:O,accessor:"getElevation",bufferGroup:"solid-polygon-instance-data"},fillColors:{transform:null,size:this.props.colorFormat.length,type:"unorm8",stepMode:"dynamic",transition:O,accessor:"getFillColor",defaultValue:S,bufferGroup:"solid-polygon-instance-data"},lineColors:{transform:null,size:this.props.colorFormat.length,type:"unorm8",stepMode:"dynamic",transition:O,accessor:"getLineColor",defaultValue:S,bufferGroup:"solid-polygon-instance-data"},rowIndexes:{size:1,type:"uint32",stepMode:"dynamic",accessor:(e,{index:t})=>e&&e.__source?e.__source.index:t,bufferGroup:"solid-polygon-instance-data"}})}getPickingInfo(e){let t=super.getPickingInfo(e),{index:i}=t,o=this.props.data;return o[0]&&o[0].__source&&(t.object=o.find(e=>e.__source.index===i)),t}disablePickingIndex(e){let t=this.props.data;if(t[0]&&t[0].__source)for(let i=0;i<t.length;i++)t[i].__source.index===e&&this._disablePickingIndex(i);else super.disablePickingIndex(e)}draw({uniforms:e}){let{extruded:t,filled:i,wireframe:o,elevationScale:s}=this.props,{topModel:n,sideModel:r,wireframeModel:a,polygonTesselator:l}=this.state,c={extruded:!!t,elevationScale:s,isWireframe:!1};a&&o&&(a.setInstanceCount(l.instanceCount-1),a.shaderInputs.setProps({solidPolygon:{...c,isWireframe:!0}}),a.draw(this.context.renderPass)),r&&i&&(r.setInstanceCount(l.instanceCount-1),r.shaderInputs.setProps({solidPolygon:c}),r.draw(this.context.renderPass)),n&&i&&(n.setVertexCount(l.vertexCount),n.shaderInputs.setProps({solidPolygon:c}),n.draw(this.context.renderPass))}updateState(e){super.updateState(e),this.updateGeometry(e);let{props:t,oldProps:i,changeFlags:o}=e,s=this.getAttributeManager(),n=s.attributes;n.elevations.settings.transform=t._projectionTolerance?k:null,n.fillColors.settings.transform=t._projectionTolerance?T:null,n.lineColors.settings.transform=t._projectionTolerance?T:null,(o.extensionsChanged||t.filled!==i.filled||t.extruded!==i.extruded)&&(this.state.models?.forEach(e=>e.destroy()),this.setState(this._getModels()),s.invalidateAll())}updateGeometry({props:e,oldProps:t,changeFlags:i}){let{viewport:o}=this.context,s=this.getSubdivisionStep(),n=!!(this.state.packedCrs&&o.crs?.coordinateFrame==="geocentric"),r=i.projectionChanged||this.state.subdivisionStep!==s||o.isGeospatial&&(!(0,l.b)(e.modelMatrix,t.modelMatrix,1)||!(0,l.b)(e.coordinateOrigin,t.coordinateOrigin,1)),a=e._projectionTolerance!==t._projectionTolerance||e._projectionTolerance>0&&e._normalize!==t._normalize;if(a||i.dataChanged||r||i.updateTriggersChanged&&(i.updateTriggersChanged.all||i.updateTriggersChanged.getPolygon)){let{polygonTesselator:t}=this.state,l=e.data.attributes||{},c=(0,I.A)(this.state.packedCrs);if(e._projectionTolerance&&(!c||!this.usePositionTransforms().transform||!e._normalize||l.getPolygon&&!ArrayBuffer.isView(l.getPolygon.value??l.getPolygon)||Object.keys(l).some(e=>"getPolygon"!==e)))throw Error("Projection refinement requires linear target units, normalized polygons and per-object attributes");t.updateGeometry({data:e.data,normalize:e._normalize,geometryBuffer:l.getPolygon,buffers:l,getGeometry:e.getPolygon,transform:this.usePositionTransforms().transform?.bind(this),preproject:this.state.packedCrs?e=>this.state.preproject?o.projectPosition(e,{sourceCrs:this.state.packedCrs}):this.projectPosition(e,{viewport:o,autoOffset:!1}):void 0,positionFormat:e.positionFormat,wrapLongitude:e.wrapLongitude&&!this.state.preproject&&this.state.sourceCrs?.signature==="WGS84",resolution:s,projectionTolerance:e._projectionTolerance,projectionToleranceScale:c??void 0,fp64:this.use64bitPositions(),dataChanged:r||a?void 0:i.dataChanged,full3d:e._full3d||n,geocentric:n}),this.setState({subdivisionStep:s,numInstances:t.instanceCount,startIndices:t.vertexStarts}),(!i.dataChanged||r||a)&&this.getAttributeManager().invalidateAll()}}_getModels(){let e,t,i,{id:o,filled:s,extruded:n}=this.props;if(s){let t=this.getShaders("top");t.defines={...t.defines,NON_INSTANCED_MODEL:1};let i=this.getAttributeManager().getBufferLayouts({isInstanced:!1});"webgpu"===this.context.device.type&&(i=i.filter(e=>"indices"!==e.name&&"vertexValid"!==e.name&&"instanceVertexValid"!==e.name&&"nextVertexPositions"!==e.name)),e=new c.A(this.context.device,{...t,id:`${o}-top`,topology:"triangle-list",bufferLayout:i,isIndexed:!0,isInstanced:!1,userData:{excludeAttributes:{vertexValid:!0,instanceVertexValid:!0,nextVertexPositions:!0}}})}if(n){let e=this.getAttributeManager().getBufferLayouts({isInstanced:!0});"webgpu"===this.context.device.type&&(e=e.filter(e=>"indices"!==e.name)),t=new c.A(this.context.device,{...this.getShaders("side"),id:`${o}-side`,bufferLayout:e,geometry:new p.V2({topology:"triangle-strip",attributes:{positions:{size:2,value:new Float32Array([1,0,0,0,1,1,0,1])}}}),isInstanced:!0,userData:{excludeAttributes:{indices:!0}}}),i=new c.A(this.context.device,{...this.getShaders("side"),id:`${o}-wireframe`,bufferLayout:e,geometry:new p.V2({topology:"line-strip",attributes:{positions:{size:2,value:new Float32Array([1,0,0,0,0,1,1,1])}}}),isInstanced:!0,userData:{excludeAttributes:{indices:!0}}})}return{models:[t,i,e].filter(Boolean),topModel:e,sideModel:t,wireframeModel:i}}calculateIndices(e){let{polygonTesselator:t}=this.state;e.startIndices=t.indexStarts,e.value=t.get("indices")}calculatePositions(e){let{polygonTesselator:t}=this.state;e.startIndices=t.vertexStarts,e.value=t.get("positions")}calculateVertexValid(e){let t=this.props.data.attributes?.instanceVertexValid?.value,i="webgpu"===this.context.device.type&&t?t:this.state.polygonTesselator.get("vertexValid");e.value="webgpu"===this.context.device.type&&i?Float32Array.from(i):i}}A.defaultProps={filled:!0,extruded:!1,wireframe:!1,_normalize:!0,_windingOrder:"CW",_full3d:!1,_projectionTolerance:{type:"number",value:0,min:0},elevationScale:{type:"number",min:0,value:1},getPolygon:{type:"accessor",value:e=>e.polygon},getElevation:{type:"accessor",value:1e3},getFillColor:{type:"accessor",value:S},getLineColor:{type:"accessor",value:S},material:!0},A.layerName="SolidPolygonLayer";let E=A;function k(e){if(this.props._projectionTolerance&&"number"!=typeof e)throw Error("Projection refinement requires per-object elevations");return e}function T(e){if(this.props._projectionTolerance&&("object"==typeof e?.[0]||e?.length>4))throw Error("Projection refinement requires per-object colors");return this.props._projectionTolerance&&"RGB"===this.props.colorFormat&&e?.length===4?e.slice(0,3):e}},4559(e,t,i){i.d(t,{A:()=>$});var o=i(59452),s=i(3459),n=i(53439),r=i(86982);let a=`\
layout(std140) uniform sdfUniforms {
  float gamma;
  bool enabled;
  float buffer;
  float outlineBuffer;
  vec4 outlineColor;
} sdf;
`,l={name:"sdf",vs:a,fs:a,uniformTypes:{gamma:"f32",enabled:"f32",buffer:"f32",outlineBuffer:"f32",outlineColor:"vec4<f32>"}},c={none:0,start:1,center:2,end:3},p={name:"text",vs:`\
layout(std140) uniform textUniforms {
  highp vec2 cutoffPixels;
  highp ivec2 align;
  highp float fontSize;
  bool flipY;
} text;

#define ALIGN_MODE_START ${c.start}
#define ALIGN_MODE_CENTER ${c.center}
#define ALIGN_MODE_END ${c.end}
`,getUniforms:({contentCutoffPixels:e=[0,0],contentAlignHorizontal:t="none",contentAlignVertical:i="none",fontSize:o,viewport:s})=>({cutoffPixels:e,align:[c[t],c[i]],fontSize:o,flipY:s?.flipY??!1}),uniformTypes:{cutoffPixels:"vec2<f32>",align:"vec2<i32>",fontSize:"f32",flipY:"f32"}},f=`\
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
bool globeOccluded = false;
if (icon.billboard)  {
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0), geometry.position);
gl_Position = project_globe_billboard_clipspace(gl_Position, geometry.position.xyz);
globeOccluded = project_globe_is_occluded(geometry.position.xyz);
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
if (globeOccluded) {
gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
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
  // Hide glyphs whose anchor is behind the globe; culling handles non-billboard glyphs
  var globeOccluded = false;
  if (icon.billboard != 0) {
    let anchorCommon = project_position_vec3_f64(inp.instancePositions, inp.instancePositions64Low);
    geometry.position = vec4<f32>(anchorCommon, 1.0);
    pos = project_position_to_clipspace(inp.instancePositions, inp.instancePositions64Low, vec3<f32>(0.0));
    pos = project_globe_billboard_clipspace(pos, anchorCommon);
    globeOccluded = project_globe_is_occluded(anchorCommon);
    anchorPosScreen = pos.xy / pos.w;

    var size = vec3<f32>(pixelOffset, 0.0);
    DECKGL_FILTER_SIZE(&size, geometry);
    let clipOffset = project_pixel_size_to_clipspace(size.xy);
    pos = vec4<f32>(pos.x + clipOffset.x, pos.y + clipOffset.y, pos.z, pos.w);
  } else {
    var offsetCommon = vec3<f32>(project_pixel_size_vec2(pixelOffset), 0.0);
    if (text.flipY > 0.5) {
      offsetCommon.y = offsetCommon.y * -1.0;
    }
    let anchorPos = project_position_to_clipspace(inp.instancePositions, inp.instancePositions64Low, vec3<f32>(0.0));
    anchorPosScreen = anchorPos.xy / anchorPos.w;
    DECKGL_FILTER_SIZE(&offsetCommon, geometry);
    let projected = project_position_to_clipspace_and_commonspace(inp.instancePositions, inp.instancePositions64Low, offsetCommon);
    geometry.position = projected.commonPosition;
    pos = projected.clipPosition;
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

  if (globeOccluded) {
    pos = vec4<f32>(0.0, 0.0, 2.0, 1.0);
  }

  let uvMix = (inp.positions.xy + vec2<f32>(1.0, 1.0)) * 0.5;
  outp.vTextureCoords = mix(inp.instanceIconFrames.xy, inp.instanceIconFrames.xy + iconSize, uvMix) / icon.iconsTextureDim;

  outp.position = pos;
  outp.vColor = inp.instanceColors;
  outp.vColorMode = inp.instanceColorModes;
  outp.pickingColor = picking_getPickingColorFromIndex(inp.rowIndexes);

  DECKGL_FILTER_GL_POSITION(&outp.position, geometry);

  return outp;
}

@fragment
fn fragmentMain(inp: Varyings) -> @location(0) vec4<f32> {
  geometry.uv = inp.uv;
  fragmentGeometry.uv = geometry.uv;

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
    var extensionColor = vec4<f32>(inp.pickingColor, 1.0);
    DECKGL_FILTER_COLOR(&extensionColor, fragmentGeometry);
    // Color filters may discard, but must not alter the picking payload.
    return vec4<f32>(inp.pickingColor, 1.0);
  }

  ${e?`\
  let collisionFade = collision_is_visible(inp.position.xy / project.viewportSize, inp.pickingColor);
  a = a * collisionFade;
  if (a <= 0.0001) {
    discard;
  }
  `:""}

  var fragColor = vec4<f32>(color.rgb, a);

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
`}();class u extends r.A{getShaders(){let e=super.getShaders();return{...e,modules:[...e.modules,p,l],vs:f,fs:g,source:d}}initializeState(){super.initializeState();let e=this.getAttributeManager();e.attributes.instanceIconDefs.settings.update=this.calculateInstanceIconDefs,e.addInstanced({rowIndexes:{type:"uint32",size:1,bufferGroup:"icon-instance-data",accessor:(e,{index:t})=>t},instanceClipRect:{size:4,bufferGroup:"icon-instance-data",accessor:"getContentBox",defaultValue:[0,0,-1,-1]}})}updateState(e){super.updateState(e);let{props:t,oldProps:i,changeFlags:o}=e,{outlineColor:n}=t;if(o.extensionsChanged){this.state.fillModel?.destroy();let e="webgpu"===this.context.device.type?this._getModel(`${this.props.id}-fill`):void 0;this.setState({fillModel:e,models:e?[this.state.model,e]:[this.state.model]})}if(o.updateTriggersChanged&&(o.updateTriggersChanged.getIcon||o.updateTriggersChanged.getIconOffsets)&&this.getAttributeManager().invalidate("instanceIconDefs"),n!==i.outlineColor){let e=[n[0]/255,n[1]/255,n[2]/255,(n[3]??255)/255];this.setState({outlineColor:e})}!t.sdf&&t.outlineWidth&&s.A.warn(`${this.id}: fontSettings.sdf is required to render outline`)()}draw(e){let{sdf:t,smoothing:i,fontSize:o,outlineWidth:s,contentCutoffPixels:n,contentAlignHorizontal:r,contentAlignVertical:a}=this.props,{outlineColor:l}=this.state,c=s?Math.max(i,.75*(1-s)):-1,p=this.state.model,f={buffer:.75,outlineBuffer:c,gamma:i,enabled:!!t,outlineColor:l},g={contentCutoffPixels:n,contentAlignHorizontal:r,contentAlignVertical:a,fontSize:o,viewport:this.context.viewport};if(p.shaderInputs.setProps({sdf:f,text:g}),super.draw(e),t&&s){let{iconManager:e}=this.state;if(e.getTexture()){let e=this.state.fillModel||p;e.shaderInputs.setProps({sdf:{...f,outlineBuffer:.75},text:g}),this._drawModel(e)}}}calculateInstanceIconDefs(e,{startRow:t,endRow:i}){let{data:o,getIcon:s,getIconOffsets:r}=this.props,a=e.getVertexOffset(t),l=e.value,{iterable:c,objectInfo:p}=(0,n.X)(o,t,i);for(let t of c){p.index++;let i=s(t,p),o=r(t,p);if(i){let t=0;for(let s of Array.from(i)){let i=super.getInstanceIconDef(s);i[0]=o[2*t],i[1]+=o[2*t+1],i[6]=1,l.set(i,a),a+=e.size,t++}}}}}u.defaultProps={getIconOffsets:{type:"accessor",value:e=>e.offsets},getContentBox:{type:"accessor",value:[0,0,-1,-1]},fontSize:1,alphaCutoff:.001,smoothing:.1,outlineWidth:0,outlineColor:{type:"color",value:[0,0,0,255]},contentCutoffPixels:{type:"array",value:[0,0]},contentAlignHorizontal:"none",contentAlignVertical:"none"},u.layerName="MultiIconLayer";let h=new Float64Array(256);for(let e=0;e<256;e++){let t=.5-Math.pow(e/255,1/2.2);h[e]=t*Math.abs(t)}h[255]=-1e20;class x{constructor({fontSize:e=24,buffer:t=3,radius:i=8,cutoff:o=.25,fontFamily:s="sans-serif",fontWeight:n="normal",fontStyle:r="normal",lang:a=null}={}){this.buffer=t,this.radius=i,this.cutoff=o,this.lang=a;let l=this.size=e+4*t,c=this._createCanvas(l),p=this.ctx=c.getContext("2d",{willReadFrequently:!0});p.font=`${r} ${n} ${e}px ${s}`,p.textBaseline="alphabetic",p.textAlign="left",p.fillStyle="black",this.gridOuter=new Float64Array(l*l),this.gridInner=new Float64Array(l*l),this.f=new Float64Array(l),this.z=new Float64Array(l+1),this.v=new Uint16Array(l)}_createCanvas(e){if("u">typeof OffscreenCanvas)return new OffscreenCanvas(e,e);let t=document.createElement("canvas");return t.width=t.height=e,t}draw(e){let{width:t,actualBoundingBoxAscent:i,actualBoundingBoxDescent:o,actualBoundingBoxLeft:s,actualBoundingBoxRight:n}=this.ctx.measureText(e),r=Math.ceil(i),a=Math.floor(-s),l=Math.max(0,Math.min(this.size-this.buffer,Math.ceil(n)-a)),c=Math.max(0,Math.min(this.size-this.buffer,r+Math.ceil(o))),p=l+2*this.buffer,f=c+2*this.buffer,g=Math.max(p*f,0),d=new Uint8ClampedArray(g),u={data:d,width:p,height:f,glyphWidth:l,glyphHeight:c,glyphTop:r,glyphLeft:a,glyphAdvance:t};if(0===l||0===c)return u;let{ctx:x,buffer:m,gridInner:y,gridOuter:_}=this;this.lang&&(x.lang=this.lang),x.clearRect(m,m,l,c),x.fillText(e,m-a,m+r);let C=x.getImageData(m,m,l,c);_.fill(1e20,0,g),y.fill(0,0,g);let b=3;for(let e=0;e<c;e++){let t=(e+m)*p+m;for(let e=0;e<l;e++,b+=4,t++){let e=C.data[b];if(0===e)continue;let i=h[e];_[t]=Math.max(0,i),y[t]=Math.max(0,-i)}}v(_,0,0,p,f,p,this.f,this.v,this.z);let P=Math.min(m,1);v(y,m-P,m-P,l+2*P,c+2*P,p,this.f,this.v,this.z);let z=255/this.radius,w=255*(1-this.cutoff);for(let e=0;e<g;e++){let t=Math.sqrt(_[e])-Math.sqrt(y[e]);d[e]=Math.round(w-z*t)}return u}}function v(e,t,i,o,s,n,r,a,l){for(let c=t;c<t+o;c++)m(e,i*n+c,n,s,r,a,l);for(let c=i;c<i+s;c++)m(e,c*n+t,1,o,r,a,l)}function m(e,t,i,o,s,n,r){n[0]=0,r[0]=-1e20,r[1]=1e20,s[0]=e[t];for(let a=1,l=0,c=0;a<o;a++){s[a]=e[t+a*i];let o=a*a;do{let e=n[l];c=(s[a]-s[e]+o-e*e)/(a-e)/2}while(c<=r[l]&&--l>-1)n[++l]=a,r[l]=c,r[l+1]=1e20}for(let a=0,l=0;a<o;a++){for(;r[l+1]<a;)l++;let o=n[l],c=a-o;e[t+a*i]=s[o]+c*c}}let y=[];function _(e,t,i,o){let s=0;for(let n=t;n<i;n++){let t=e[n];s+=o[t]?.advance||0}return s}function C(e,t,i,o,s,n){let r=t,a=0;for(let l=t;l<i;l++){let t=_(e,l,l+1,s);a+t>o&&(r<l&&n.push(l),r=l,a=0),a+=t}return a}class b{constructor(e=5){this._cache={},this._order=[],this.limit=e}get(e){let t=this._cache[e];return t&&(this._deleteOrder(e),this._appendOrder(e)),t}set(e,t){this._cache[e]?this.delete(e):Object.keys(this._cache).length===this.limit&&this.delete(this._order[0]),this._cache[e]=t,this._appendOrder(e)}delete(e){this._cache[e]&&(delete this._cache[e],this._deleteOrder(e))}_deleteOrder(e){let t=this._order.indexOf(e);t>=0&&this._order.splice(t,1)}_appendOrder(e){this._order.push(e)}}let P={fontFamily:"Monaco, monospace",fontWeight:"normal",characterSet:function(){let e=[];for(let t=32;t<128;t++)e.push(String.fromCharCode(t));return e}(),fontSize:64,buffer:4,sdf:!1,cutoff:.25,radius:12,smoothing:.1},z=new b(3);function w(e,t,i,o){e.font=`${o} ${i}px ${t}`,e.fillStyle="#000",e.textBaseline="alphabetic",e.textAlign="left"}class L{constructor(){this.props={...P}}get atlas(){return this._atlas}get mapping(){return this._atlas&&this._atlas.mapping}setProps(e={}){Object.assign(this.props,e),e._getFontRenderer&&(this._getFontRenderer=e._getFontRenderer),this._key=this._getKey();let t=function(e,t){let i;i=new Set("string"==typeof t?Array.from(t):t);let o=z.get(e);if(!o)return i;for(let e in o.mapping)i.has(e)&&i.delete(e);return i}(this._key,this.props.characterSet),i=z.get(this._key);if(i&&0===t.size){this._atlas!==i&&(this._atlas=i);return}let o=this._generateFontAtlas(t,i);this._atlas=o,z.set(this._key,o)}_generateFontAtlas(e,t){let i,{fontFamily:o,fontWeight:s,fontSize:n,buffer:r,sdf:a,radius:l,cutoff:c}=this.props,p=t&&t.data;p||((p=document.createElement("canvas")).width=1024);let f=p.getContext("2d",{willReadFrequently:!0});w(f,o,n,s);let g=e=>(function(e,t,i){if(void 0===i){let i=e.measureText("A");return i.fontBoundingBoxAscent?{advance:0,width:0,ascent:Math.ceil(i.fontBoundingBoxAscent),descent:Math.ceil(i.fontBoundingBoxDescent)}:{advance:0,width:0,ascent:.9*t,descent:.3*t}}let o=e.measureText(i);return o.actualBoundingBoxAscent?{advance:o.width,width:Math.ceil(o.actualBoundingBoxRight-o.actualBoundingBoxLeft),ascent:Math.ceil(o.actualBoundingBoxAscent),descent:Math.ceil(o.actualBoundingBoxDescent)}:{advance:o.width,width:o.width,ascent:.9*t,descent:.3*t}})(f,n,e);this._getFontRenderer?i=this._getFontRenderer(this.props):a&&(i={measure:g,draw:function({fontSize:e,buffer:t,radius:i,cutoff:o,fontFamily:s,fontWeight:n}){let r=new x({fontSize:e,buffer:t,radius:i,cutoff:o,fontFamily:s,fontWeight:`${n}`});return e=>{let{data:i,width:o,height:s}=r.draw(e),n=new ImageData(o,s);for(let e=0;e<i.length;e++)n.data[4*e+3]=i[e];return{data:n,left:t,top:t}}}(this.props)});let{mapping:d,canvasHeight:u,xOffset:h,yOffsetMin:v,yOffsetMax:m}=function({characterSet:e,measureText:t,buffer:i,maxCanvasWidth:o,mapping:s={},xOffset:n=0,yOffsetMin:r=0,yOffsetMax:a=0}){let l=n,c=r,p=a;for(let n of e)if(!s[n]){let{advance:e,width:r,ascent:a,descent:f}=t(n),g=a+f;l+r+2*i>o&&(l=0,c=p),s[n]={x:l+i,y:c+i,width:r,height:g,advance:e,anchorX:r/2,anchorY:a},l+=r+2*i,p=Math.max(p,c+g+2*i)}return{mapping:s,xOffset:l,yOffsetMin:c,yOffsetMax:p,canvasHeight:Math.pow(2,Math.ceil(Math.log2(p)))}}({measureText:e=>i?i.measure(e):g(e),buffer:r,characterSet:e,maxCanvasWidth:1024,...t&&{mapping:t.mapping,xOffset:t.xOffset,yOffsetMin:t.yOffsetMin,yOffsetMax:t.yOffsetMax}});if(p.height!==u){let e=p.height>0?f.getImageData(0,0,p.width,p.height):null;p.height=u,e&&f.putImageData(e,0,0)}if(w(f,o,n,s),i)for(let t of e){let e=d[t],o=e.width,{data:s,left:n=0,top:r=0}=i.draw(t),a=e.x-n,l=e.y-r,c=Math.max(0,Math.round(a)),g=Math.max(0,Math.round(l)),u=Math.min(s.width,p.width-c),h=Math.min(s.height,p.height-g);f.putImageData(s,c,g,0,0,u,h),e.x=c,e.y=g,e.width=u,e.height=h,e.anchorX+=u/2-n-o/2,e.anchorY+=r}else for(let t of e){let e=d[t];f.fillText(t,e.x,e.y+e.anchorY)}let y=i?i.measure():g();return{baselineOffset:(y.ascent-y.descent)/2,xOffset:h,yOffsetMin:v,yOffsetMax:m,mapping:d,data:p,width:p.width,height:p.height}}_getKey(){let{fontFamily:e,fontWeight:t,fontSize:i,buffer:o,sdf:s,radius:n,cutoff:r}=this.props;return s?`${e} ${t} ${i} ${o} ${n} ${r}`:`${e} ${t} ${i} ${o}`}}var I=i(10032),S=i(84175),O=i(46487),A=i(83895),E=i(9350),k=i(88599),T=i(25337);let M=`\
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
`,R={name:"textBackground",source:`\
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
`,vs:M,fs:M,uniformTypes:{billboard:"f32",sizeScale:"f32",sizeMinPixels:"f32",sizeMaxPixels:"f32",borderRadius:"vec4<f32>",padding:"vec4<f32>",sizeUnits:"i32",stroked:"f32"}},j=`\
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
float v = 1.0 - uv.y;
pixelOffset.y = xy.y + v * wh.y + mix(-textBackground.padding.y, textBackground.padding.w, v);
}
if (textBackground.billboard)  {
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0), geometry.position);
gl_Position = project_globe_billboard_clipspace(gl_Position, geometry.position.xyz);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
vec3 offset = vec3(pixelOffset, 0.0);
DECKGL_FILTER_SIZE(offset, geometry);
gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);
if (project_globe_is_occluded(geometry.position.xyz)) {
gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
}
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
`,F=`\
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
`,B=`\
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
    // Assign the same corners in the flipped order of the default offset above so the strip
    // stays front-facing
    let v = 1.0 - varyings.uv.y;
    pixelOffset.y = xy.y + v * wh.y + mix(
      -textBackground.padding.y,
      textBackground.padding.w,
      v
    );
  }

  if (textBackground.billboard > 0.5) {
    let anchorCommon = project_position_vec3_f64(attributes.instancePositions, attributes.instancePositions64Low);
    geometry.position = vec4<f32>(anchorCommon, 1.0);
    var position = project_position_to_clipspace(
      attributes.instancePositions,
      attributes.instancePositions64Low,
      vec3<f32>(0.0)
    );
    position = project_globe_billboard_clipspace(position, anchorCommon);
    var size = vec3<f32>(pixelOffset, 0.0);
    DECKGL_FILTER_SIZE(&size, geometry);
    let clipOffset = project_pixel_size_to_clipspace(size.xy);
    position = vec4<f32>(
      position.x + clipOffset.x,
      position.y + clipOffset.y,
      position.z,
      position.w
    );
    // Hide backgrounds whose anchor is behind the globe; culling handles non-billboard ones
    if (project_globe_is_occluded(anchorCommon)) {
      position = vec4<f32>(0.0, 0.0, 2.0, 1.0);
    }
    varyings.position = position;
  } else {
    var offsetCommon = vec3<f32>(project_pixel_size_vec2(pixelOffset), 0.0);
    if (text.flipY > 0.5) {
      offsetCommon.y = offsetCommon.y * -1.0;
    }
    DECKGL_FILTER_SIZE(&offsetCommon, geometry);
    let projected = project_position_to_clipspace_and_commonspace(
      attributes.instancePositions,
      attributes.instancePositions64Low,
      offsetCommon
    );
    geometry.position = projected.commonPosition;
    varyings.position = projected.clipPosition;
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
  DECKGL_FILTER_GL_POSITION(&varyings.position, geometry);
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
  fragmentGeometry.uv = geometry.uv;
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
    var extensionColor = fragColor;
    DECKGL_FILTER_COLOR(&extensionColor, fragmentGeometry);
    // Color filters may discard, but must not alter the picking payload.
    return vec4<f32>(varyings.pickingColor, 1.0);
  }

  DECKGL_FILTER_COLOR(&fragColor, fragmentGeometry);

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
`,G={billboard:!0,sizeScale:1,sizeUnits:"pixels",sizeMinPixels:0,sizeMaxPixels:Number.MAX_SAFE_INTEGER,fontSize:1,borderRadius:{type:"object",value:0},padding:{type:"array",value:[0,0,0,0]},getPosition:{type:"accessor",value:e=>e.position},getSize:{type:"accessor",value:1},getAngle:{type:"accessor",value:0},getPixelOffset:{type:"accessor",value:[0,0]},getBoundingRect:{type:"accessor",value:[0,0,0,0]},getClipRect:{type:"accessor",value:[0,0,-1,-1]},getFillColor:{type:"accessor",value:[0,0,0,255]},getLineColor:{type:"accessor",value:[0,0,0,255]},getLineWidth:{type:"accessor",value:1}};class D extends I.A{getShaders(){return super.getShaders({vs:j,fs:F,source:B,modules:[S.A,O.A,A.Ay,R,p]})}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),...this.usePositionTransforms(),transition:!0,accessor:"getPosition"},instanceSizes:{size:1,transition:!0,bufferGroup:"text-background-instance-data",accessor:"getSize",defaultValue:1},instanceAngles:{size:1,transition:!0,bufferGroup:"text-background-instance-data",accessor:"getAngle"},instanceRects:{size:4,bufferGroup:"text-background-instance-data",accessor:"getBoundingRect"},instanceClipRect:{size:4,bufferGroup:"text-background-instance-data",accessor:"getClipRect",defaultValue:[0,0,-1,-1]},instancePixelOffsets:{size:2,transition:!0,bufferGroup:"text-background-instance-data",accessor:"getPixelOffset"},instanceFillColors:{size:4,transition:!0,type:"unorm8",accessor:"getFillColor",defaultValue:[0,0,0,255]},instanceLineColors:{size:4,transition:!0,type:"unorm8",accessor:"getLineColor",defaultValue:[0,0,0,255]},instanceLineWidths:{size:1,transition:!0,bufferGroup:"text-background-instance-data",accessor:"getLineWidth",defaultValue:1}})}updateState(e){super.updateState(e);let{changeFlags:t}=e;t.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll())}draw({uniforms:e}){let{billboard:t,sizeScale:i,sizeUnits:o,sizeMinPixels:s,sizeMaxPixels:n,getLineWidth:r,fontSize:a}=this.props,{padding:l,borderRadius:c}=this.props;l.length<4&&(l=[l[0],l[1],l[0],l[1]]),Array.isArray(c)||(c=[c,c,c,c]);let p=this.state.model,f={billboard:t,stroked:!!r,borderRadius:c,padding:l,sizeUnits:E.p5[o],sizeScale:i,sizeMinPixels:s,sizeMaxPixels:n},g={fontSize:a,viewport:this.context.viewport};p.shaderInputs.setProps({textBackground:f,text:g}),p.draw(this.context.renderPass)}_getModel(){return new k.A(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new T.V2({topology:"triangle-strip",vertexCount:4,attributes:{positions:{size:2,value:new Float32Array([0,1,1,1,0,0,1,0])}}}),isInstanced:!0})}}D.defaultProps=G,D.layerName="TextBackgroundLayer";let N={start:1,middle:0,end:-1},V={top:1,center:0,bottom:-1},W=[0,0,0,255],U={billboard:!0,sizeScale:1,sizeUnits:"pixels",sizeMinPixels:0,sizeMaxPixels:Number.MAX_SAFE_INTEGER,background:!1,getBackgroundColor:{type:"accessor",value:[255,255,255,255]},getBorderColor:{type:"accessor",value:W},getBorderWidth:{type:"accessor",value:0},backgroundBorderRadius:{type:"object",value:0},backgroundPadding:{type:"array",value:[0,0,0,0]},characterSet:{type:"object",value:P.characterSet},fontFamily:P.fontFamily,fontWeight:P.fontWeight,lineHeight:1,outlineWidth:{type:"number",value:0,min:0},outlineColor:{type:"color",value:W},fontSettings:{type:"object",value:{},compare:1},wordBreak:"break-word",maxWidth:{type:"number",value:-1},contentCutoffPixels:{type:"array",value:[0,0]},contentAlignHorizontal:"none",contentAlignVertical:"none",getText:{type:"accessor",value:e=>e.text},getPosition:{type:"accessor",value:e=>e.position},getColor:{type:"accessor",value:W},getSize:{type:"accessor",value:32},getAngle:{type:"accessor",value:0},getTextAnchor:{type:"accessor",value:"middle"},getAlignmentBaseline:{type:"accessor",value:"center"},getPixelOffset:{type:"accessor",value:[0,0]},getContentBox:{type:"accessor",value:[0,0,-1,-1]},backgroundColor:{deprecatedFor:["background","getBackgroundColor"]}};class K extends o.A{constructor(){super(...arguments),this.getBoundingRect=(e,t)=>{let{size:[i,o]}=this.transformParagraph(e,t),{getTextAnchor:s,getAlignmentBaseline:n}=this.props;return[(N["function"==typeof s?s(e,t):s]-1)*i/2,(V["function"==typeof n?n(e,t):n]-1)*o/2,i,o]},this.getIconOffsets=(e,t)=>{let{getTextAnchor:i,getAlignmentBaseline:o}=this.props,{x:s,y:n,rowWidth:r,size:[,a]}=this.transformParagraph(e,t),l=N["function"==typeof i?i(e,t):i],c=V["function"==typeof o?o(e,t):o],p=s.length,f=Array(2*p),g=0;for(let e=0;e<p;e++)f[g++]=(l-1)*r[e]/2+s[e],f[g++]=(c-1)*a/2+n[e];return f}}initializeState(){this.state={styleVersion:0,fontAtlasManager:new L},this.props.maxWidth>0&&s.A.once(1,"v8.9 breaking change: TextLayer maxWidth is now relative to text size")()}updateState(e){let{props:t,oldProps:i,changeFlags:o}=e;(o.dataChanged||o.updateTriggersChanged&&(o.updateTriggersChanged.all||o.updateTriggersChanged.getText))&&this._updateText(),(this._updateFontAtlas()||t.lineHeight!==i.lineHeight||t.wordBreak!==i.wordBreak||t.maxWidth!==i.maxWidth)&&this.setState({styleVersion:this.state.styleVersion+1})}getPickingInfo({info:e}){return e.object=e.index>=0?this.props.data[e.index]:null,e}_updateFontAtlas(){let{fontSettings:e,fontFamily:t,fontWeight:i,_getFontRenderer:o}=this.props,{fontAtlasManager:s,characterSet:n}=this.state,r={...e,characterSet:n,fontFamily:t,fontWeight:i,_getFontRenderer:o};if(!s.mapping)return s.setProps(r),!0;for(let e in r)if(r[e]!==s.props[e])return s.setProps(r),!0;return!1}_updateText(){let e,{data:t,characterSet:i}=this.props,o=t.attributes?.getText,{getText:s}=this.props,r=t.startIndices,a="auto"===i&&new Set;if(o&&r){let{texts:i,characterCount:n}=function({value:e,length:t,stride:i,offset:o,startIndices:s,characterSet:n}){let r=e.BYTES_PER_ELEMENT,a=i?i/r:1,l=o?o/r:0,c=s[t]||Math.ceil((e.length-l)/a),p=n&&new Set,f=Array(t),g=e;if(a>1||l>0){g=new e.constructor(c);for(let t=0;t<c;t++)g[t]=e[t*a+l]}for(let e=0;e<t;e++){let t=s[e],i=s[e+1]||c,o=g.subarray(t,i);f[e]=String.fromCodePoint.apply(null,o),p&&o.forEach(p.add,p)}if(p)for(let e of p)n.add(String.fromCodePoint(e));return{texts:f,characterCount:c}}({...ArrayBuffer.isView(o)?{value:o}:o,length:t.length,startIndices:r,characterSet:a});e=n,s=(e,{index:t})=>i[t]}else{let{iterable:i,objectInfo:o}=(0,n.X)(t);for(let t of(r=[0],e=0,i)){o.index++;let i=Array.from(s(t,o)||"");a&&i.forEach(a.add,a),e+=i.length,r.push(e)}}this.setState({getText:s,startIndices:r,numInstances:e,characterSet:a||i})}transformParagraph(e,t){let{fontAtlasManager:i}=this.state,o=i.mapping,{baselineOffset:n}=i.atlas,{fontSize:r}=i.props,a=this.state.getText,{wordBreak:l,lineHeight:c,maxWidth:p}=this.props;return function(e,t,i,o,n,r){let a=Array.from(e),l=a.length,c=Array(l),p=Array(l),f=Array(l),g=("break-word"===o||"break-all"===o)&&isFinite(n)&&n>0,d=[0,0],u=[0,0],h=0,x=t+i/2,v=0,m=0;for(let e=0;e<=l;e++){let t=a[e];if(("\n"===t||e===l)&&(m=e),m>v){let e=g?function(e,t,i,o,s=0,n){void 0===n&&(n=e.length);let r=[];return"break-all"===t?C(e,s,n,i,o,r):!function(e,t,i,o,s,n){let r=t,a=t,l=t,c=0;for(let p=t;p<i;p++)if(" "===e[p]?l=p+1:(" "===e[p+1]||p+1===i)&&(l=p+1),l>a){let t=_(e,a,l,s);c+t>o&&(r<a&&(n.push(a),r=a,c=0),t>o&&(t=C(e,a,l,o,s,n),r=n[n.length-1])),a=l,c+=t}}(e,s,n,i,o,r),r}(a,o,n,r,v,m):y;for(let t=0;t<=e.length;t++){let o=0===t?v:e[t-1],n=t<e.length?e[t]:m;!function(e,t,i,o,n,r){let a=0,l=0;for(let s=t;s<i;s++){let t=o[e[s]];t&&(l=Math.max(l,t.height))}for(let r=t;r<i;r++){let t=e[r],i=o[t];i?(n[r]=a+i.anchorX,a+=i.advance):(s.A.warn(`Missing character: ${t} (${t.codePointAt(0)})`)(),n[r]=a,a+=32)}r[0]=a,r[1]=l}(a,o,n,r,c,u);for(let e=o;e<n;e++)p[e]=x,f[e]=u[0];h++,x+=i,d[0]=Math.max(d[0],u[0])}v=m}"\n"===t&&(c[v]=0,p[v]=0,f[v]=0,v++)}return d[1]=h*i,{x:c,y:p,rowWidth:f,size:d}}(a(e,t)||"",n,c*r,l,p*r,o)}renderLayers(){let{startIndices:e,numInstances:t,getText:i,fontAtlasManager:{atlas:o,mapping:s},styleVersion:n}=this.state,{data:r,_dataDiff:a,getPosition:l,getColor:c,getSize:p,getAngle:f,getPixelOffset:g,getBackgroundColor:d,getBorderColor:h,getBorderWidth:x,getContentBox:v,backgroundBorderRadius:m,backgroundPadding:y,background:_,billboard:C,fontSettings:b,outlineWidth:z,outlineColor:w,sizeScale:L,sizeUnits:I,sizeMinPixels:S,sizeMaxPixels:O,contentCutoffPixels:A,contentAlignHorizontal:E,contentAlignVertical:k,transitions:T,updateTriggers:M}=this.props,R=this.getSubLayerClass("characters",u),j=this.getSubLayerClass("background",D),{fontSize:F}=this.state.fontAtlasManager.props;return[_&&new j({getFillColor:d,getLineColor:h,getLineWidth:x,borderRadius:m,padding:y,getPosition:l,getSize:p,getAngle:f,getPixelOffset:g,getClipRect:v,billboard:C,sizeScale:L,sizeUnits:I,sizeMinPixels:S,sizeMaxPixels:O,fontSize:F,transitions:T&&{getPosition:T.getPosition,getAngle:T.getAngle,getSize:T.getSize,getFillColor:T.getBackgroundColor,getLineColor:T.getBorderColor,getLineWidth:T.getBorderWidth,getPixelOffset:T.getPixelOffset}},this.getSubLayerProps({id:"background",updateTriggers:{getPosition:M.getPosition,getAngle:M.getAngle,getSize:M.getSize,getFillColor:M.getBackgroundColor,getLineColor:M.getBorderColor,getLineWidth:M.getBorderWidth,getPixelOffset:M.getPixelOffset,getBoundingRect:{getText:M.getText,getTextAnchor:M.getTextAnchor,getAlignmentBaseline:M.getAlignmentBaseline,styleVersion:n}}}),{data:r.attributes&&r.attributes.background?{length:r.length,attributes:r.attributes.background}:r,_dataDiff:a,autoHighlight:!1,getBoundingRect:this.getBoundingRect}),new R({sdf:b.sdf,smoothing:Number.isFinite(b.smoothing)?b.smoothing:P.smoothing,outlineWidth:z/(b.radius||P.radius),outlineColor:w,iconAtlas:o,iconMapping:s,getPosition:l,getColor:c,getSize:p,getAngle:f,getPixelOffset:g,getContentBox:v,billboard:C,sizeScale:L,sizeUnits:I,sizeMinPixels:S,sizeMaxPixels:O,fontSize:F,contentCutoffPixels:A,contentAlignHorizontal:E,contentAlignVertical:k,transitions:T&&{getPosition:T.getPosition,getAngle:T.getAngle,getColor:T.getColor,getSize:T.getSize,getPixelOffset:T.getPixelOffset,getContentBox:T.getContentBox}},this.getSubLayerProps({id:"characters",updateTriggers:{all:M.getText,getPosition:M.getPosition,getAngle:M.getAngle,getColor:M.getColor,getSize:M.getSize,getPixelOffset:M.getPixelOffset,getContentBox:M.getContentBox,getIconOffsets:{getTextAnchor:M.getTextAnchor,getAlignmentBaseline:M.getAlignmentBaseline,styleVersion:n}}}),{data:r,_dataDiff:a,startIndices:e,numInstances:t,getIconOffsets:this.getIconOffsets,getIcon:i})]}static set fontAtlasCacheLimit(e){s.A.assert(Number.isFinite(e)&&e>=3,"Invalid cache limit"),z=new b(e)}}K.defaultProps=U,K.layerName="TextLayer";let $=K}}]);