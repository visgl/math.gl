"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["9369"],{41661(e,t,o){o.d(t,{$q:()=>v,A4:()=>c,Dt:()=>a,S8:()=>u});var i=o(55230),s=o(18135);let r=s.rJ.CLOCKWISE,n=s.rJ.COUNTER_CLOCKWISE,l={isClosed:!0};function a(e){return"positions"in e?e.positions:e}function c(e){return"holeIndices"in e?e.holeIndices:null}function p(e,t,o,i,r){let n,a,c=t,p=o.length;for(let t=0;t<p;t++)for(let s=0;s<i;s++)e[c++]=o[t][s]||0;if(n=o[0],a=o[o.length-1],n[0]!==a[0]||n[1]!==a[1]||n[2]!==a[2])for(let t=0;t<i;t++)e[c++]=o[0][t]||0;return l.start=t,l.end=c,l.size=i,(0,s.UD)(e,r,l),c}function d(e,t,o,i,r=0,n,a){let c=(n=n||o.length)-r;if(c<=0)return t;let p=t;for(let t=0;t<c;t++)e[p++]=o[r+t];if(!function(e,t,o,i){for(let s=0;s<t;s++)if(e[o+s]!==e[i-t+s])return!1;return!0}(o,i,r,n))for(let t=0;t<i;t++)e[p++]=o[r+t];return l.start=t,l.end=p,l.size=i,(0,s.UD)(e,a,l),p}function u(e,t){var o,i=e;if(!Array.isArray(i=i&&i.positions||i)&&!ArrayBuffer.isView(i))throw Error("invalid polygon");let s=[],l=[];if("positions"in e){let{positions:o,holeIndices:i}=e;if(i){let e=0;for(let a=0;a<=i.length;a++)e=d(s,e,o,t,i[a-1],i[a],0===a?r:n),l.push(e);return l.pop(),{positions:s,holeIndices:l}}e=o}if(!Array.isArray(e[0]))return d(s,0,e,t,0,s.length,r),s;if(!((o=e).length>=1&&o[0].length>=2&&Number.isFinite(o[0][0]))){let o=0;for(let[i,a]of e.entries())o=p(s,o,a,t,0===i?r:n),l.push(o);return l.pop(),{positions:s,holeIndices:l}}return p(s,0,e,t,r),s}function g(e,t,o){let i=e.length/3,s=0;for(let r=0;r<i;r++){let n=(r+1)%i;s+=e[3*r+t]*e[3*n+o],s-=e[3*n+t]*e[3*r+o]}return Math.abs(s/2)}function f(e,t,o,i){let s=e.length/3;for(let r=0;r<s;r++){let s=3*r,n=e[s+0],l=e[s+1],a=e[s+2];e[s+t]=n,e[s+o]=l,e[s+i]=a}}function v(e,t,o,s){let r=c(e);r&&(r=r.map(e=>e/t));let n=a(e),l=s&&3===t;if(o){let e=n.length;n=n.slice();let i=[];for(let s=0;s<e;s+=t){i[0]=n[s],i[1]=n[s+1],l&&(i[2]=n[s+2]);let e=o(i);n[s]=e[0],n[s+1]=e[1],l&&(n[s+2]=e[2])}}if(l){let e=g(n,0,1),t=g(n,0,2),i=g(n,1,2);if(!e&&!t&&!i)return[];e>t&&e>i||(t>i?(o||(n=n.slice()),f(n,0,2,1)):(o||(n=n.slice()),f(n,2,0,1)))}return i(n,r,t)}},63744(e,t,o){o.d(t,{A:()=>S});var i=o(41881),s=o(84175),r=o(46487),n=o(37072),l=o(95335),a=o(95263),c=o(25337),p=o(41661),d=o(44941),u=o(76046),g=o(6423);class f extends d.A{constructor(e){let{fp64:t,IndexType:o=Uint32Array}=e;super({...e,attributes:{positions:{size:3,type:t?Float64Array:Float32Array},vertexValid:{type:Uint16Array,size:1},indices:{type:o,size:1}}})}get(e){let{attributes:t}=this;return"indices"===e?t.indices&&t.indices.subarray(0,this.vertexCount):t[e]}updateGeometry(e){super.updateGeometry(e);let t=this.buffers.indices;if(t)this.vertexCount=(t.value||t).length;else if(this.data&&!this.getGeometry)throw Error("missing indices buffer")}normalizeGeometry(e){if(this.normalize){let t=p.S8(e,this.positionSize);return this.opts.resolution?(0,u.w)(p.Dt(t),p.A4(t),{size:this.positionSize,gridResolution:this.opts.resolution,edgeTypes:!0}):this.opts.wrapLongitude?(0,g.E)(p.Dt(t),p.A4(t),{size:this.positionSize,maxLatitude:86,edgeTypes:!0}):t}return e}getGeometrySize(e){if(v(e)){let t=0;for(let o of e)t+=this.getGeometrySize(o);return t}return p.Dt(e).length/this.positionSize}getGeometryFromBuffer(e){return this.normalize||!this.buffers.indices?super.getGeometryFromBuffer(e):null}updateGeometryAttributes(e,t){if(e&&v(e))for(let o of e){let e=this.getGeometrySize(o);t.geometrySize=e,this.updateGeometryAttributes(o,t),t.vertexStart+=e,t.indexStart=this.indexStarts[t.geometryIndex+1]}else this._updateIndices(e,t),this._updatePositions(e,t),this._updateVertexValid(e,t)}_updateIndices(e,{geometryIndex:t,vertexStart:o,indexStart:i}){let{attributes:s,indexStarts:r,typedArrayManager:n}=this,l=s.indices;if(!l||!e)return;let a=i,c=p.$q(e,this.positionSize,this.opts.preproject,this.opts.full3d);l=n.allocate(l,i+c.length,{copy:!0});for(let e=0;e<c.length;e++)l[a++]=c[e]+o;r[t+1]=i+c.length,s.indices=l}_updatePositions(e,{vertexStart:t,geometrySize:o}){let{attributes:{positions:i},positionSize:s}=this;if(!i||!e)return;let r=p.Dt(e);for(let e=t,n=0;n<o;e++,n++){let t=r[n*s],o=r[n*s+1],l=s>2?r[n*s+2]:0;i[3*e]=t,i[3*e+1]=o,i[3*e+2]=l}}_updateVertexValid(e,{vertexStart:t,geometrySize:o}){let{positionSize:i}=this,s=this.attributes.vertexValid,r=e&&p.A4(e);if(e&&e.edgeTypes?s.set(e.edgeTypes,t):s.fill(1,t,t+o),r)for(let e=0;e<r.length;e++)s[t+r[e]/i-1]=0;s[t+o-1]=0}}function v(e){return Array.isArray(e)&&e.length>0&&!Number.isFinite(e[0])}let h=`\
layout(std140) uniform solidPolygonUniforms {
  bool extruded;
  bool isWireframe;
  float elevationScale;
} solidPolygon;
`,x={name:"solidPolygon",source:`\
struct SolidPolygonUniforms {
  extruded: f32,
  isWireframe: f32,
  elevationScale: f32,
};

@group(0) @binding(auto) var<uniform> solidPolygon: SolidPolygonUniforms;
`,vs:h,fs:h,uniformTypes:{extruded:"f32",isWireframe:"f32",elevationScale:"f32"}},y=`\
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
`,m=`\
#version 300 es
#define SHADER_NAME solid-polygon-layer-vertex-shader
in vec3 vertexPositions;
in vec3 vertexPositions64Low;
in float elevations;
${y}
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
${y}
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
`,_=`\
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
`;function C(){return`\
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
`}function b(){return`\
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
`}var w=o(86402);let L=[0,0,0,255],I={enter:(e,t)=>t.length?t.subarray(t.length-e.length):e};class A extends i.A{getShaders(e){var t;let o=this.props._normalize||"CCW"!==this.props._windingOrder?1:0;return super.getShaders({vs:"top"===e?m:P,fs:_,source:(t=!!o,"top"===e?`\
${C()}

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

${b()}
`:`\
const RING_WINDING_ORDER_CW: bool = ${t?"true":"false"};

${C()}

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

${b()}
`),defines:{RING_WINDING_ORDER_CW:o},modules:[s.A,r.A,n.J,l.Ay,x,..."webgpu"===this.context.device.type?[w.A]:[]]})}get wrapLongitude(){return!1}getBounds(){return this.getAttributeManager()?.getBounds(["vertexPositions"])}initializeState(){let e,{viewport:t}=this.context,{coordinateSystem:o}=this.props,{_full3d:i}=this.props;t.isGeospatial&&"default"===o&&(o="lnglat"),"lnglat"===o&&(e=i?t.projectPosition.bind(t):t.projectFlat.bind(t)),this.setState({numInstances:0,polygonTesselator:new f({preproject:e,fp64:this.use64bitPositions(),IndexType:Uint32Array})});let s=this.getAttributeManager(),r="webgpu"===this.context.device.type;s.add({indices:{size:1,isIndexed:!0,update:this.calculateIndices,noAlloc:!0},vertexPositions:{size:3,type:"float64",stepMode:"dynamic",fp64:this.use64bitPositions(),transition:I,accessor:"getPolygon",update:this.calculatePositions,noAlloc:!0,...r?{}:{shaderAttributes:{nextVertexPositions:{vertexOffset:1}}}},...r?{nextVertexPositions:{size:3,type:"float64",stepMode:"dynamic",fp64:this.use64bitPositions(),transition:!1,update:this.calculateNextPositions,noAlloc:!0}}:{},[r?"vertexValid":"instanceVertexValid"]:{size:1,type:r?"float32":"uint16",stepMode:"instance",update:this.calculateVertexValid,noAlloc:!0},elevations:{size:1,stepMode:"dynamic",transition:I,accessor:"getElevation",bufferGroup:"solid-polygon-instance-data"},fillColors:{size:this.props.colorFormat.length,type:"unorm8",stepMode:"dynamic",transition:I,accessor:"getFillColor",defaultValue:L,bufferGroup:"solid-polygon-instance-data"},lineColors:{size:this.props.colorFormat.length,type:"unorm8",stepMode:"dynamic",transition:I,accessor:"getLineColor",defaultValue:L,bufferGroup:"solid-polygon-instance-data"},rowIndexes:{size:1,type:"uint32",stepMode:"dynamic",accessor:(e,{index:t})=>e&&e.__source?e.__source.index:t,bufferGroup:"solid-polygon-instance-data"}})}getPickingInfo(e){let t=super.getPickingInfo(e),{index:o}=t,i=this.props.data;return i[0]&&i[0].__source&&(t.object=i.find(e=>e.__source.index===o)),t}disablePickingIndex(e){let t=this.props.data;if(t[0]&&t[0].__source)for(let o=0;o<t.length;o++)t[o].__source.index===e&&this._disablePickingIndex(o);else super.disablePickingIndex(e)}draw({uniforms:e}){let{extruded:t,filled:o,wireframe:i,elevationScale:s}=this.props,{topModel:r,sideModel:n,wireframeModel:l,polygonTesselator:a}=this.state,c={extruded:!!t,elevationScale:s,isWireframe:!1};l&&i&&(l.setInstanceCount(a.instanceCount-1),l.shaderInputs.setProps({solidPolygon:{...c,isWireframe:!0}}),l.draw(this.context.renderPass)),n&&o&&(n.setInstanceCount(a.instanceCount-1),n.shaderInputs.setProps({solidPolygon:c}),n.draw(this.context.renderPass)),r&&o&&(r.setVertexCount(a.vertexCount),r.shaderInputs.setProps({solidPolygon:c}),r.draw(this.context.renderPass))}updateState(e){super.updateState(e),this.updateGeometry(e);let{props:t,oldProps:o,changeFlags:i}=e,s=this.getAttributeManager();(i.extensionsChanged||t.filled!==o.filled||t.extruded!==o.extruded)&&(this.state.models?.forEach(e=>e.destroy()),this.setState(this._getModels()),s.invalidateAll())}updateGeometry({props:e,oldProps:t,changeFlags:o}){if(o.dataChanged||o.updateTriggersChanged&&(o.updateTriggersChanged.all||o.updateTriggersChanged.getPolygon)){let{polygonTesselator:t}=this.state,i=e.data.attributes||{};t.updateGeometry({data:e.data,normalize:e._normalize,geometryBuffer:i.getPolygon,buffers:"webgpu"===this.context.device.type?{...i}:i,getGeometry:e.getPolygon,positionFormat:e.positionFormat,wrapLongitude:e.wrapLongitude,resolution:this.context.viewport.resolution,fp64:this.use64bitPositions(),dataChanged:o.dataChanged,full3d:e._full3d}),this.setState({numInstances:t.instanceCount,startIndices:t.vertexStarts}),o.dataChanged||this.getAttributeManager().invalidateAll()}}_getModels(){let e,t,o,{id:i,filled:s,extruded:r}=this.props;if(s){let t=this.getShaders("top");t.defines={...t.defines,NON_INSTANCED_MODEL:1};let o=this.getAttributeManager().getBufferLayouts({isInstanced:!1});"webgpu"===this.context.device.type&&(o=o.filter(e=>"indices"!==e.name&&"vertexValid"!==e.name&&"instanceVertexValid"!==e.name&&"nextVertexPositions"!==e.name)),e=new a.K(this.context.device,{...t,id:`${i}-top`,topology:"triangle-list",bufferLayout:o,isIndexed:!0,userData:{excludeAttributes:{vertexValid:!0,instanceVertexValid:!0,nextVertexPositions:!0}}})}if(r){let e=this.getAttributeManager().getBufferLayouts({isInstanced:!0});"webgpu"===this.context.device.type&&(e=e.filter(e=>"indices"!==e.name)),t=new a.K(this.context.device,{...this.getShaders("side"),id:`${i}-side`,bufferLayout:e,geometry:new c.V({topology:"triangle-strip",attributes:{positions:{size:2,value:new Float32Array([1,0,0,0,1,1,0,1])}}}),isInstanced:!0,userData:{excludeAttributes:{indices:!0}}}),o=new a.K(this.context.device,{...this.getShaders("side"),id:`${i}-wireframe`,bufferLayout:e,geometry:new c.V({topology:"line-strip",attributes:{positions:{size:2,value:new Float32Array([1,0,0,0,0,1,1,1])}}}),isInstanced:!0,userData:{excludeAttributes:{indices:!0}}})}return{models:[t,o,e].filter(Boolean),topModel:e,sideModel:t,wireframeModel:o}}calculateIndices(e){let{polygonTesselator:t}=this.state;e.startIndices=t.indexStarts,e.value=t.get("indices")}calculatePositions(e){let{polygonTesselator:t}=this.state;e.startIndices=t.vertexStarts;let o=this.props.data.attributes?.getPolygon;if("webgpu"===this.context.device.type&&ArrayBuffer.isView(o?.value)){let{value:i,size:s=3,offset:r=0,stride:n}=o,l=r/i.BYTES_PER_ELEMENT,a=n?n/i.BYTES_PER_ELEMENT:s,c=new Float64Array(3*t.instanceCount);for(let e=0;e<t.instanceCount;e++){let t=l+e*a,o=3*e;c[o]=i[t],c[o+1]=i[t+1],c[o+2]=s>2?i[t+2]:0}e.value=c;return}e.value=t.get("positions")}calculateVertexValid(e){let t=this.props.data.attributes?.instanceVertexValid?.value,o="webgpu"===this.context.device.type&&t?t:this.state.polygonTesselator.get("vertexValid");e.value="webgpu"===this.context.device.type&&o?Float32Array.from(o):o}calculateNextPositions(e){let{polygonTesselator:t}=this.state,o=this.getAttributeManager().getAttributes(),i=o.vertexPositions.value,s=this.props.data.attributes?.instanceVertexValid?.value||o.vertexValid?.value||t.get("vertexValid");if(e.startIndices=t.vertexStarts,!i){e.value=i;return}let r=i.length/3,n=new i.constructor(i.length);for(let e=0;e<r;e++){let t=3*e,o=s?.[e]&&e+1<r?t+3:t;for(let e=0;e<3;e++)n[t+e]=i[o+e]}e.value=n}}A.defaultProps={filled:!0,extruded:!1,wireframe:!1,_normalize:!0,_windingOrder:"CW",_full3d:!1,elevationScale:{type:"number",min:0,value:1},getPolygon:{type:"accessor",value:e=>e.polygon},getElevation:{type:"accessor",value:1e3},getFillColor:{type:"accessor",value:L},getLineColor:{type:"accessor",value:L},material:!0},A.layerName="SolidPolygonLayer";let S=A}}]);