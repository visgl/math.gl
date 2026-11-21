"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["7547"],{48149(e,t,o){o.d(t,{$q:()=>h,A4:()=>c,Dt:()=>a,S8:()=>d});var i=o(55230),r=o(58241);let s="clockwise",n="counter-clockwise",l={isClosed:!0};function a(e){return"positions"in e?e.positions:e}function c(e){return"holeIndices"in e?e.holeIndices:null}function p(e,t,o,i,s){let n,a,c=t,p=o.length;for(let t=0;t<p;t++)for(let r=0;r<i;r++)e[c++]=o[t][r]||0;if(n=o[0],a=o[o.length-1],n[0]!==a[0]||n[1]!==a[1]||n[2]!==a[2])for(let t=0;t<i;t++)e[c++]=o[0][t]||0;return l.start=t,l.end=c,l.size=i,(0,r.UD)(e,s,l),c}function u(e,t,o,i,s=0,n,a){let c=(n=n||o.length)-s;if(c<=0)return t;let p=t;for(let t=0;t<c;t++)e[p++]=o[s+t];if(!function(e,t,o,i){for(let r=0;r<t;r++)if(e[o+r]!==e[i-t+r])return!1;return!0}(o,i,s,n))for(let t=0;t<i;t++)e[p++]=o[s+t];return l.start=t,l.end=p,l.size=i,(0,r.UD)(e,a,l),p}function d(e,t){var o,i=e;if(!Array.isArray(i=i&&i.positions||i)&&!ArrayBuffer.isView(i))throw Error("invalid polygon");let r=[],l=[];if("positions"in e){let{positions:o,holeIndices:i}=e;if(i){let e=0;for(let a=0;a<=i.length;a++)e=u(r,e,o,t,i[a-1],i[a],0===a?s:n),l.push(e);return l.pop(),{positions:r,holeIndices:l}}e=o}if(!Array.isArray(e[0]))return u(r,0,e,t,0,r.length,s),r;if(!((o=e).length>=1&&o[0].length>=2&&Number.isFinite(o[0][0]))){let o=0;for(let[i,a]of e.entries())o=p(r,o,a,t,0===i?s:n),l.push(o);return l.pop(),{positions:r,holeIndices:l}}return p(r,0,e,t,s),r}function g(e,t,o){let i=e.length/3,r=0;for(let s=0;s<i;s++){let n=(s+1)%i;r+=e[3*s+t]*e[3*n+o],r-=e[3*n+t]*e[3*s+o]}return Math.abs(r/2)}function f(e,t,o,i){let r=e.length/3;for(let s=0;s<r;s++){let r=3*s,n=e[r+0],l=e[r+1],a=e[r+2];e[r+t]=n,e[r+o]=l,e[r+i]=a}}function h(e,t,o,r,s){let n=c(e);n&&(n=n.map(e=>e/t));let l=a(e),p=r&&(3===t||s),u=t;if(p&&2===t){let e=[];for(let t=0;t<l.length;t+=2)e.push(l[t],l[t+1],0);l=e,u=3}if(o){let e=l.length;l=l.slice();let t=[];for(let i=0;i<e;i+=u){t[0]=l[i],t[1]=l[i+1],p&&(t[2]=l[i+2]??0);let e=o(t);l[i]=e[0],l[i+1]=e[1],p&&(l[i+2]=e[2])}}let d=s?l.slice():null;if(p){let e=g(l,0,1),t=g(l,0,2),i=g(l,1,2);if(!e&&!t&&!i)return[];e>t&&e>i||(t>i?(o||(l=l.slice()),f(l,0,2,1)):(o||(l=l.slice()),f(l,2,0,1)))}let h=i(l,n,u);if(d)for(let e=0;e<h.length;e+=3){let t=h[e]*u,o=h[e+1]*u,i=h[e+2]*u;d[t]*(d[o+1]*d[i+2]-d[o+2]*d[i+1])+d[t+1]*(d[o+2]*d[i]-d[o]*d[i+2])+d[t+2]*(d[o]*d[i+1]-d[o+1]*d[i])<0&&([h[e+1],h[e+2]]=[h[e+2],h[e+1]])}return h}},95974(e,t,o){o.d(t,{A:()=>E});var i=o(84960),r=o(53031),s=o(87983),n=o(87238),l=o(84047),a=o(72594),c=o(25359),p=o(64794),u=o(48149),d=o(72085),g=o(58241),f=o(46168),h=o(80857),v=o(67017);class m extends d.A{constructor(e){let{fp64:t,IndexType:o=Uint32Array}=e;super({...e,attributes:{positions:{size:3,type:t?Float64Array:Float32Array},vertexValid:{type:Uint16Array,size:1},indices:{type:o,size:1}}})}get(e){let{attributes:t}=this;return"indices"===e?t.indices&&t.indices.subarray(0,this.vertexCount):t[e]}updateGeometry(e){super.updateGeometry(e);let t=this.buffers.indices;if(t)this.vertexCount=(t.value||t).length;else if(this.data&&!this.geometryAccessor)throw Error("missing indices buffer")}prepareGeometry(e){return this.preparePolygon(e,this.inputPositionSize)}normalizeGeometry(e){if(!this.opts.transform)return this.preparePolygon(e,this.positionSize);if(!this.normalize)return e;if(y(e)){for(let t of e){let{positions:e,holeIndices:o,edgeTypes:i}=t,r=[...o||[],e.length],s=0;for(let t=0;t<r.length;t++){let o=r[t];if((0,g.UD)(e,0===t?"clockwise":"counter-clockwise",{start:s,end:o,size:this.positionSize,isClosed:!0})&&i){let e=s/this.positionSize,t=o/this.positionSize-1,r=i.slice(e,t).reverse();for(let t=0;t<r.length;t++)i[e+t]=r[t]}s=o}}return e}return u.S8(e,this.positionSize)}preparePolygon(e,t){if(this.normalize){let o=u.S8(e,t);if(this.opts.resolution){let e=(0,f.w)(u.Dt(o),u.A4(o),{size:t,gridResolution:this.opts.resolution,edgeTypes:!0});return this.refinePolygons(e,t)}if(this.opts.wrapLongitude){let e=(0,h.E)(u.Dt(o),u.A4(o),{size:t,maxLatitude:86,edgeTypes:!0});return this.refinePolygons(e,t)}return this.opts.projectionTolerance?this.refinePolygons([o],t):o}return e}refinePolygons(e,t){let{projectionTolerance:o,projectionToleranceScale:i,transform:r}=this.opts;if(!o)return e;if(!r)throw Error("Projection refinement requires preprojected polygons");let s=i||[1,1,1];return e.map(e=>{let i=u.Dt(e),n=u.A4(e),l=e.edgeTypes,a=[],c=[],p=[],d=0;for(let e of[...n||[],i.length]){d&&c.push(a.length);let n=Array.from(i.slice(d,e));n.length&&n.slice(0,t).some((e,o)=>e!==n[n.length-t+o])&&n.push(...n.slice(0,t));let u=(0,v.A)(n,{size:t,targetSize:3,transform:e=>r(Array.from(e)).map((e,t)=>e*s[t]),tolerance:o});for(let e of u.sourcePositions)a.push(e);for(let e=0;e<u.segmentIndices.length;e++){let o=d/t+(u.segmentIndices[e]+ +(1===u.segmentFractions[e]));p.push(l?l[o]:1)}p[p.length-1]=0,d=e}return{positions:a,holeIndices:c,edgeTypes:p}})}getGeometrySize(e){if(y(e)){let t=0;for(let o of e)t+=this.getGeometrySize(o);return t}return u.Dt(e).length/this.positionSize}getGeometryFromBuffer(e){return this.normalize||this.opts.transform||!this.buffers.indices?super.getGeometryFromBuffer(e):null}updateGeometryAttributes(e,t){if(e&&y(e))for(let o of e){let e=this.getGeometrySize(o);t.geometrySize=e,this.updateGeometryAttributes(o,t),t.vertexStart+=e,t.indexStart=this.indexStarts[t.geometryIndex+1]}else this._updateIndices(e,t),this._updatePositions(e,t),this._updateVertexValid(e,t)}_updateIndices(e,{geometryIndex:t,vertexStart:o,indexStart:i}){let{attributes:r,indexStarts:s,typedArrayManager:n}=this,l=r.indices;if(!l||!e)return;let a=i,c=u.$q(e,this.positionSize,this.opts.preproject,this.opts.full3d,this.opts.geocentric);l=n.allocate(l,i+c.length,{copy:!0});for(let e=0;e<c.length;e++)l[a++]=c[e]+o;s[t+1]=i+c.length,r.indices=l}_updatePositions(e,{vertexStart:t,geometrySize:o}){let{attributes:{positions:i},positionSize:r}=this;if(!i||!e)return;let s=u.Dt(e);for(let e=t,n=0;n<o;e++,n++){let t=s[n*r],o=s[n*r+1],l=r>2?s[n*r+2]:0;i[3*e]=t,i[3*e+1]=o,i[3*e+2]=l}}_updateVertexValid(e,{vertexStart:t,geometrySize:o}){let{positionSize:i}=this,r=this.attributes.vertexValid,s=e&&u.A4(e);if(e&&e.edgeTypes?r.set(e.edgeTypes,t):r.fill(1,t,t+o),s)for(let e=0;e<s.length;e++)r[t+s[e]/i-1]=0;r[t+o-1]=0}}function y(e){return Array.isArray(e)&&e.length>0&&!Number.isFinite(e[0])}let x=`\
layout(std140) uniform solidPolygonUniforms {
  bool extruded;
  bool isWireframe;
  float elevationScale;
} solidPolygon;
`,P={name:"solidPolygon",source:`\
struct SolidPolygonUniforms {
  extruded: f32,
  isWireframe: f32,
  elevationScale: f32,
};

@group(0) @binding(auto) var<uniform> solidPolygon: SolidPolygonUniforms;
`,vs:x,fs:x,uniformTypes:{extruded:"f32",isWireframe:"f32",elevationScale:"f32"}},_=`\
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
`,C=`\
#version 300 es
#define SHADER_NAME solid-polygon-layer-vertex-shader
in vec3 vertexPositions;
in vec3 vertexPositions64Low;
in float elevations;
${_}
void main(void) {
PolygonProps props;
props.positions = vertexPositions;
props.positions64Low = vertexPositions64Low;
props.elevations = elevations;
props.normal = vec3(0.0, 0.0, 1.0);
calculatePosition(props);
}
`,b=`\
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
${_}
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
`,w=`\
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
`;function I(){return`\
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
`}var A=o(98333);let S=[0,0,0,255],j={enter:(e,t)=>t.length?t.subarray(t.length-e.length):e};class V extends i.A{getShaders(e){var t;let o=this.props._normalize||"CCW"!==this.props._windingOrder?1:0;return super.getShaders({vs:"top"===e?C:b,fs:w,source:(t=!!o,"top"===e?`\
${I()}

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

${I()}

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
`),defines:{RING_WINDING_ORDER_CW:o},modules:[r.A,s.A,n.J,l.Ay,P]})}get wrapLongitude(){return!1}getBounds(){return this.getAttributeManager()?.getBounds(["vertexPositions"])}initializeState(){this.setState({numInstances:0,polygonTesselator:new m({fp64:this.use64bitPositions(),IndexType:Uint32Array})});let e=this.getAttributeManager(),t="webgpu"===this.context.device.type;e.add({indices:{size:1,isIndexed:!0,update:this.calculateIndices,noAlloc:!0},vertexPositions:{...this.usePositionTransforms(),size:3,type:"float64",stepMode:"dynamic",fp64:this.use64bitPositions(),transition:j,accessor:"getPolygon",update:this.calculatePositions,noAlloc:!0,shaderAttributes:{nextVertexPositions:{vertexOffset:1}}},[t?"vertexValid":"instanceVertexValid"]:{size:1,type:t?"float32":"uint16",stepMode:"instance",update:this.calculateVertexValid,noAlloc:!0},elevations:{transform:null,size:1,stepMode:"dynamic",transition:j,accessor:"getElevation",bufferGroup:"solid-polygon-instance-data"},fillColors:{transform:null,size:this.props.colorFormat.length,type:"unorm8",stepMode:"dynamic",transition:j,accessor:"getFillColor",defaultValue:S,bufferGroup:"solid-polygon-instance-data"},lineColors:{transform:null,size:this.props.colorFormat.length,type:"unorm8",stepMode:"dynamic",transition:j,accessor:"getLineColor",defaultValue:S,bufferGroup:"solid-polygon-instance-data"},rowIndexes:{size:1,type:"uint32",stepMode:"dynamic",accessor:(e,{index:t})=>e&&e.__source?e.__source.index:t,bufferGroup:"solid-polygon-instance-data"}})}getPickingInfo(e){let t=super.getPickingInfo(e),{index:o}=t,i=this.props.data;return i[0]&&i[0].__source&&(t.object=i.find(e=>e.__source.index===o)),t}disablePickingIndex(e){let t=this.props.data;if(t[0]&&t[0].__source)for(let o=0;o<t.length;o++)t[o].__source.index===e&&this._disablePickingIndex(o);else super.disablePickingIndex(e)}draw({uniforms:e}){let{extruded:t,filled:o,wireframe:i,elevationScale:r}=this.props,{topModel:s,sideModel:n,wireframeModel:l,polygonTesselator:a}=this.state,c={extruded:!!t,elevationScale:r,isWireframe:!1};l&&i&&(l.setInstanceCount(a.instanceCount-1),l.shaderInputs.setProps({solidPolygon:{...c,isWireframe:!0}}),l.draw(this.context.renderPass)),n&&o&&(n.setInstanceCount(a.instanceCount-1),n.shaderInputs.setProps({solidPolygon:c}),n.draw(this.context.renderPass)),s&&o&&(s.setVertexCount(a.vertexCount),s.shaderInputs.setProps({solidPolygon:c}),s.draw(this.context.renderPass))}updateState(e){super.updateState(e),this.updateGeometry(e);let{props:t,oldProps:o,changeFlags:i}=e,r=this.getAttributeManager(),s=r.attributes;s.elevations.settings.transform=t._projectionTolerance?z:null,s.fillColors.settings.transform=t._projectionTolerance?G:null,s.lineColors.settings.transform=t._projectionTolerance?G:null,(i.extensionsChanged||t.filled!==o.filled||t.extruded!==o.extruded)&&(this.state.models?.forEach(e=>e.destroy()),this.setState(this._getModels()),r.invalidateAll())}updateGeometry({props:e,oldProps:t,changeFlags:o}){let{viewport:i}=this.context,r=this.getSubdivisionStep(),s=!!(this.state.packedCrs&&i.crs?.coordinateFrame==="geocentric"),n=o.projectionChanged||this.state.subdivisionStep!==r||i.isGeospatial&&(!(0,a.b)(e.modelMatrix,t.modelMatrix,1)||!(0,a.b)(e.coordinateOrigin,t.coordinateOrigin,1)),l=e._projectionTolerance!==t._projectionTolerance||e._projectionTolerance>0&&e._normalize!==t._normalize;if(l||o.dataChanged||n||o.updateTriggersChanged&&(o.updateTriggersChanged.all||o.updateTriggersChanged.getPolygon)){let{polygonTesselator:t}=this.state,a=e.data.attributes||{},c=(0,A.A)(this.state.packedCrs);if(e._projectionTolerance&&(!c||!this.usePositionTransforms().transform||!e._normalize||a.getPolygon&&!ArrayBuffer.isView(a.getPolygon.value??a.getPolygon)||Object.keys(a).some(e=>"getPolygon"!==e)))throw Error("Projection refinement requires linear target units, normalized polygons and per-object attributes");t.updateGeometry({data:e.data,normalize:e._normalize,geometryBuffer:a.getPolygon,buffers:a,getGeometry:e.getPolygon,transform:this.usePositionTransforms().transform?.bind(this),preproject:this.state.packedCrs?e=>this.state.preproject?i.projectPosition(e,{sourceCrs:this.state.packedCrs}):this.projectPosition(e,{viewport:i,autoOffset:!1}):void 0,positionFormat:e.positionFormat,wrapLongitude:e.wrapLongitude&&!this.state.preproject&&this.state.sourceCrs?.signature==="WGS84",resolution:r,projectionTolerance:e._projectionTolerance,projectionToleranceScale:c??void 0,fp64:this.use64bitPositions(),dataChanged:n||l?void 0:o.dataChanged,full3d:e._full3d||s,geocentric:s}),this.setState({subdivisionStep:r,numInstances:t.instanceCount,startIndices:t.vertexStarts}),(!o.dataChanged||n||l)&&this.getAttributeManager().invalidateAll()}}_getModels(){let e,t,o,{id:i,filled:r,extruded:s}=this.props;if(r){let t=this.getShaders("top");t.defines={...t.defines,NON_INSTANCED_MODEL:1};let o=this.getAttributeManager().getBufferLayouts({isInstanced:!1});"webgpu"===this.context.device.type&&(o=o.filter(e=>"indices"!==e.name&&"vertexValid"!==e.name&&"instanceVertexValid"!==e.name&&"nextVertexPositions"!==e.name)),e=new c.A(this.context.device,{...t,id:`${i}-top`,topology:"triangle-list",bufferLayout:o,isIndexed:!0,isInstanced:!1,userData:{excludeAttributes:{vertexValid:!0,instanceVertexValid:!0,nextVertexPositions:!0}}})}if(s){let e=this.getAttributeManager().getBufferLayouts({isInstanced:!0});"webgpu"===this.context.device.type&&(e=e.filter(e=>"indices"!==e.name)),t=new c.A(this.context.device,{...this.getShaders("side"),id:`${i}-side`,bufferLayout:e,geometry:new p.V2({topology:"triangle-strip",attributes:{positions:{size:2,value:new Float32Array([1,0,0,0,1,1,0,1])}}}),isInstanced:!0,userData:{excludeAttributes:{indices:!0}}}),o=new c.A(this.context.device,{...this.getShaders("side"),id:`${i}-wireframe`,bufferLayout:e,geometry:new p.V2({topology:"line-strip",attributes:{positions:{size:2,value:new Float32Array([1,0,0,0,0,1,1,1])}}}),isInstanced:!0,userData:{excludeAttributes:{indices:!0}}})}return{models:[t,o,e].filter(Boolean),topModel:e,sideModel:t,wireframeModel:o}}calculateIndices(e){let{polygonTesselator:t}=this.state;e.startIndices=t.indexStarts,e.value=t.get("indices")}calculatePositions(e){let{polygonTesselator:t}=this.state;e.startIndices=t.vertexStarts,e.value=t.get("positions")}calculateVertexValid(e){let t=this.props.data.attributes?.instanceVertexValid?.value,o="webgpu"===this.context.device.type&&t?t:this.state.polygonTesselator.get("vertexValid");e.value="webgpu"===this.context.device.type&&o?Float32Array.from(o):o}}V.defaultProps={filled:!0,extruded:!1,wireframe:!1,_normalize:!0,_windingOrder:"CW",_full3d:!1,_projectionTolerance:{type:"number",value:0,min:0},elevationScale:{type:"number",min:0,value:1},getPolygon:{type:"accessor",value:e=>e.polygon},getElevation:{type:"accessor",value:1e3},getFillColor:{type:"accessor",value:S},getLineColor:{type:"accessor",value:S},material:!0},V.layerName="SolidPolygonLayer";let E=V;function z(e){if(this.props._projectionTolerance&&"number"!=typeof e)throw Error("Projection refinement requires per-object elevations");return e}function G(e){if(this.props._projectionTolerance&&("object"==typeof e?.[0]||e?.length>4))throw Error("Projection refinement requires per-object colors");return this.props._projectionTolerance&&"RGB"===this.props.colorFormat&&e?.length===4?e.slice(0,3):e}},58241(e,t,o){function i(e,t,o={}){return function(e,t={}){var o;return(o=function(e,t={}){let{start:o=0,end:i=e.length,plane:s="xy"}=t,n=t.size||2,l=0,a=r[s[0]],c=r[s[1]];for(let t=o,r=i-n;t<i;t+=n)l+=(e[t+a]-e[r+a])*(e[t+c]+e[r+c]),r=t;return l/2}(e,t))>0?"clockwise":o<0?"counter-clockwise":"none"}(e,o)!==t&&(function(e,t){let{start:o=0,end:i=e.length,size:r=2}=t,s=(i-o)/r,n=Math.floor(s/2);for(let t=0;t<n;++t){let i=o+t*r,n=o+(s-1-t)*r;for(let t=0;t<r;++t){let o=e[i+t];e[i+t]=e[n+t],e[n+t]=o}}}(e,o),!0)}o.d(t,{UD:()=>i});let r={x:0,y:1,z:2}}}]);