"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["3707"],{43078(e,t,i){i.d(t,{J0:()=>_,Kr:()=>C,NT:()=>P,Nf:()=>y,hb:()=>x,li:()=>b,vJ:()=>w});var o,n,r,a,l=i(60616),s=0,c=[],u=l.fF,d=u.__b,f=u.__r,p=u.diffed,g=u.__c,h=u.unmount,v=u.__;function m(e,t){u.__h&&u.__h(n,e,s||t),s=0;var i=n.__H||(n.__H={__:[],__h:[]});return e>=i.__.length&&i.__.push({}),i.__[e]}function _(e){return s=1,function(e,t){var i=m(o++,2);if(i.t=e,!i.__c&&(i.__=[R(void 0,t),function(e){var t=i.__N?i.__N[0]:i.__[0],o=i.t(t,e);t!==o&&(i.__N=[o,i.__[1]],i.__c.setState({}))}],i.__c=n,!n.__f)){var r=function(e,t,o){if(!i.__c.__H)return!0;var n=!1,r=i.__c.props!==e;if(i.__c.__H.__.some(function(e){if(e.__N){n=!0;var t=e.__[0];e.__=e.__N,e.__N=void 0,t!==e.__[0]&&(r=!0)}}),a){var l=a.call(this,e,t,o);return n?l||r:l}return!n||r};n.__f=!0;var a=n.shouldComponentUpdate,l=n.componentWillUpdate;n.componentWillUpdate=function(e,t,i){if(this.__e){var o=a;a=void 0,r(e,t,i),a=o}l&&l.call(this,e,t,i)},n.shouldComponentUpdate=r}return i.__N||i.__}(R,e)}function w(e,t){var i=m(o++,3);!u.__s&&S(i.__H,t)&&(i.__=e,i.u=t,n.__H.__h.push(i))}function y(e,t){var i=m(o++,4);!u.__s&&S(i.__H,t)&&(i.__=e,i.u=t,n.__h.push(i))}function b(e){return s=5,C(function(){return{current:e}},[])}function C(e,t){var i=m(o++,7);return S(i.__H,t)&&(i.__=e(),i.__H=t,i.__h=e),i.__}function x(e,t){return s=8,C(function(){return e},t)}function P(e){var t=n.context[e.__c],i=m(o++,9);return i.c=e,t?(null==i.__&&(i.__=!0,t.sub(n)),t.props.value):e.__}function L(){for(var e;e=c.shift();){var t=e.__H;if(e.__P&&t)try{t.__h.some(M),t.__h.some(D),t.__h=[]}catch(i){t.__h=[],u.__e(i,e.__v)}}}u.__b=function(e){n=null,d&&d(e)},u.__=function(e,t){e&&t.__k&&t.__k.__m&&(e.__m=t.__k.__m),v&&v(e,t)},u.__r=function(e){f&&f(e),o=0;var t=(n=e.__c).__H;t&&(r===n?(t.__h=[],n.__h=[],t.__.some(function(e){e.__N&&(e.__=e.__N),e.u=e.__N=void 0})):(t.__h.some(M),t.__h.some(D),t.__h=[],o=0)),r=n},u.diffed=function(e){p&&p(e);var t=e.__c;t&&t.__H&&(t.__H.__h.length&&(1!==c.push(t)&&a===u.requestAnimationFrame||((a=u.requestAnimationFrame)||function(e){var t,i=function(){clearTimeout(o),A&&cancelAnimationFrame(t),setTimeout(e)},o=setTimeout(i,35);A&&(t=requestAnimationFrame(i))})(L)),t.__H.__.some(function(e){e.u&&(e.__H=e.u,e.u=void 0)})),r=n=null},u.__c=function(e,t){t.some(function(e){try{e.__h.some(M),e.__h=e.__h.filter(function(e){return!e.__||D(e)})}catch(i){t.some(function(e){e.__h&&(e.__h=[])}),t=[],u.__e(i,e.__v)}}),g&&g(e,t)},u.unmount=function(e){h&&h(e);var t,i=e.__c;i&&i.__H&&(i.__H.__.some(function(e){try{M(e)}catch(e){t=e}}),i.__H=void 0,t&&u.__e(t,i.__v))};var A="function"==typeof requestAnimationFrame;function M(e){var t=n,i=e.__c;"function"==typeof i&&(e.__c=void 0,i()),n=t}function D(e){var t=n;e.__c=e.__(),n=t}function S(e,t){return!e||e.length!==t.length||t.some(function(t,i){return t!==e[i]})}function R(e,t){return"function"==typeof t?t(e):t}},81413(e,t,i){i.d(t,{FD:()=>r,FK:()=>o.FK,Y:()=>r});var o=i(60616),n=0;function r(e,t,i,r,a,l){t||(t={});var s,c,u=t;if("ref"in u)for(c in u={},t)"ref"==c?s=t[c]:u[c]=t[c];var d={type:e,props:u,key:i,ref:s,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:--n,__i:-1,__u:0,__source:a,__self:l};if("function"==typeof e&&(s=e.defaultProps))for(c in s)void 0===u[c]&&(u[c]=s[c]);return o.fF.vnode&&o.fF.vnode(d),d}},12348(e,t,i){e.exports=i.p+"70b0ee3118bae7d0.js?url"},43997(e,t,i){i.d(t,{A:()=>w});var o=i(41881),n=i(84175),r=i(46487),a=i(95335),l=i(9350),s=i(99592),c=i(25337);let u=`\
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
`,d={name:"scatterplot",vs:u,fs:u,source:"",uniformTypes:{radiusScale:"f32",radiusMinPixels:"f32",radiusMaxPixels:"f32",lineWidthScale:"f32",lineWidthMinPixels:"f32",lineWidthMaxPixels:"f32",stroked:"f32",filled:"f32",antialiasing:"f32",billboard:"f32",radiusUnits:"i32",lineWidthUnits:"i32"}},f=`\
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
`,p=`\
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
`,g=`\
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
`;var h=i(86402);let v=[0,0,0,255],m={radiusUnits:"meters",radiusScale:{type:"number",min:0,value:1},radiusMinPixels:{type:"number",min:0,value:0},radiusMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},lineWidthUnits:"meters",lineWidthScale:{type:"number",min:0,value:1},lineWidthMinPixels:{type:"number",min:0,value:0},lineWidthMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},stroked:!1,filled:!0,billboard:!1,antialiasing:!0,getPosition:{type:"accessor",value:e=>e.position},getRadius:{type:"accessor",value:1},getFillColor:{type:"accessor",value:v},getLineColor:{type:"accessor",value:v},getLineWidth:{type:"accessor",value:1},getPixelOffset:{type:"accessor",value:[0,0]},strokeWidth:{deprecatedFor:"getLineWidth"},outline:{deprecatedFor:"stroked"},getColor:{deprecatedFor:["getFillColor","getLineColor"]}};class _ extends o.A{getShaders(){let e=!!this.props.data?.attributes?.rowIndexes;return super.getShaders({vs:f,fs:p,source:g.replace("PICKING_COLOR_ATTRIBUTE",e?"@location(8) rowIndexes: u32,":"").replace("PICKING_COLOR_VALUE",e?"picking_getPickingColorFromIndex(attributes.rowIndexes)":"picking_getPickingColorFromIndex(attributes.instanceIndex)"),defines:e?{USE_ROW_INDEXES:!0}:{},modules:[n.A,r.A,a.Ay,d,..."webgpu"===this.context.device.type?[h.A]:[]]})}initializeState(){let e=this.props.data?.attributes?.rowIndexes?{rowIndexes:{size:1,type:"uint32",noAlloc:!0}}:{};this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition"},instanceRadius:{size:1,transition:!0,accessor:"getRadius",defaultValue:1,bufferGroup:"scatterplot-instance-data"},instanceFillColors:{size:this.props.colorFormat.length,transition:!0,type:"unorm8",accessor:"getFillColor",defaultValue:[0,0,0,255],bufferGroup:"scatterplot-instance-data"},instanceLineColors:{size:this.props.colorFormat.length,transition:!0,type:"unorm8",accessor:"getLineColor",defaultValue:[0,0,0,255],bufferGroup:"scatterplot-instance-data"},instanceLineWidths:{size:1,transition:!0,accessor:"getLineWidth",defaultValue:1,bufferGroup:"scatterplot-instance-data"},instancePixelOffset:{size:2,transition:!0,accessor:"getPixelOffset",bufferGroup:"scatterplot-instance-data"},...e})}updateState(e){super.updateState(e),e.changeFlags.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll())}draw({uniforms:e}){let{radiusUnits:t,radiusScale:i,radiusMinPixels:o,radiusMaxPixels:n,stroked:r,filled:a,billboard:s,antialiasing:c,lineWidthUnits:u,lineWidthScale:d,lineWidthMinPixels:f,lineWidthMaxPixels:p}=this.props,g={stroked:r,filled:a,billboard:s,antialiasing:c,radiusUnits:l.p5[t],radiusScale:i,radiusMinPixels:o,radiusMaxPixels:n,lineWidthUnits:l.p5[u],lineWidthScale:d,lineWidthMinPixels:f,lineWidthMaxPixels:p},h=this.state.model;h.shaderInputs.setProps({scatterplot:g}),h.draw(this.context.renderPass)}_getModel(){return new s.K(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new c.V({topology:"triangle-strip",attributes:{positions:{size:3,value:new Float32Array([-1,-1,0,1,-1,0,-1,1,0,1,1,0])}}}),isInstanced:!0})}}_.defaultProps=m,_.layerName="ScatterplotLayer";let w=_},43847(e,t,i){let o;i.d(t,{e:()=>eC});var n=i(81413),r=i(1354),a=i(60616),l=i(43078);let s=Math.min,c=Math.max,u=Math.round,d=Math.floor,f=e=>({x:e,y:e}),p={left:"right",right:"left",bottom:"top",top:"bottom"};function g(e,t){return"function"==typeof e?e(t):e}function h(e){return e.split("-")[0]}function v(e){return e.split("-")[1]}function m(e){return"x"===e?"y":"x"}function _(e){return"y"===e?"height":"width"}function w(e){let t=e[0];return"t"===t||"b"===t?"y":"x"}function y(e){return e.includes("start")?e.replace("start","end"):e.replace("end","start")}let b=["left","right"],C=["right","left"],x=["top","bottom"],P=["bottom","top"];function L(e){let t=h(e);return p[t]+e.slice(t.length)}function A(e){let{x:t,y:i,width:o,height:n}=e;return{width:o,height:n,top:i,left:t,right:t+o,bottom:i+n,x:t,y:i}}function M(e,t,i){let o,{reference:n,floating:r}=e,a=w(t),l=m(w(t)),s=_(l),c=h(t),u=n.x+n.width/2-r.width/2,d=n.y+n.height/2-r.height/2,f=n[s]/2-r[s]/2;switch(c){case"top":o={x:u,y:n.y-r.height};break;case"bottom":o={x:u,y:n.y+n.height};break;case"right":o={x:n.x+n.width,y:d};break;case"left":o={x:n.x-r.width,y:d};break;default:o={x:n.x,y:n.y}}let p=v(t);return p&&(o[l]+=f*("end"===p?1:-1)*(i&&"y"===a?-1:1)),o}async function D(e,t){var i,o,n,r,a;void 0===t&&(t={});let{x:l,y:s,platform:c,rects:u,elements:d,strategy:f}=e,{boundary:p="clippingAncestors",rootBoundary:h="viewport",elementContext:v="floating",altBoundary:m=!1,padding:_=0}=g(t,e),w="number"!=typeof _?{top:null!=(o=_.top)?o:0,right:null!=(n=_.right)?n:0,bottom:null!=(r=_.bottom)?r:0,left:null!=(a=_.left)?a:0}:{top:_,right:_,bottom:_,left:_},y=d[m?"floating"===v?"reference":"floating":v],b=A(await c.getClippingRect({element:null==(i=await (null==c.isElement?void 0:c.isElement(y)))||i?y:y.contextElement||await (null==c.getDocumentElement?void 0:c.getDocumentElement(d.floating)),boundary:p,rootBoundary:h,strategy:f})),C="floating"===v?{x:l,y:s,width:u.floating.width,height:u.floating.height}:u.reference,x=await (null==c.getOffsetParent?void 0:c.getOffsetParent(d.floating)),P=await (null==c.isElement?void 0:c.isElement(x))&&await (null==c.getScale?void 0:c.getScale(x))||{x:1,y:1},L=A(c.convertOffsetParentRelativeRectToViewportRelativeRect?await c.convertOffsetParentRelativeRectToViewportRelativeRect({elements:d,rect:C,offsetParent:x,strategy:f}):C);return{top:(b.top-L.top+w.top)/P.y,bottom:(L.bottom-b.bottom+w.bottom)/P.y,left:(b.left-L.left+w.left)/P.x,right:(L.right-b.right+w.right)/P.x}}let S=async(e,t,i)=>{let{placement:o="bottom",strategy:n="absolute",middleware:r=[],platform:a}=i,l=a.detectOverflow?a:{...a,detectOverflow:D},s=await (null==a.isRTL?void 0:a.isRTL(t)),c=await a.getElementRects({reference:e,floating:t,strategy:n}),{x:u,y:d}=M(c,o,s),f=o,p=0,g={};for(let i=0;i<r.length;i++){let h=r[i];if(!h)continue;let{name:v,fn:m}=h,{x:_,y:w,data:y,reset:b}=await m({x:u,y:d,initialPlacement:o,placement:f,strategy:n,middlewareData:g,rects:c,platform:l,elements:{reference:e,floating:t}});u=null!=_?_:u,d=null!=w?w:d,g[v]={...g[v],...y},b&&p<50&&(p++,"object"==typeof b&&(b.placement&&(f=b.placement),b.rects&&(c=!0===b.rects?await a.getElementRects({reference:e,floating:t,strategy:n}):b.rects),{x:u,y:d}=M(c,f,s)),i=-1)}return{x:u,y:d,placement:f,strategy:n,middlewareData:g}},R=new Set(["left","top"]);async function T(e,t){let{placement:i,platform:o,elements:n}=e,r=await (null==o.isRTL?void 0:o.isRTL(n.floating)),a=h(i),l=v(i),s="y"===w(i),c=R.has(a)?-1:1,u=r&&s?-1:1,d=g(t,e),{mainAxis:f,crossAxis:p,alignmentAxis:m}="number"==typeof d?{mainAxis:d,crossAxis:0,alignmentAxis:null}:{mainAxis:d.mainAxis||0,crossAxis:d.crossAxis||0,alignmentAxis:d.alignmentAxis};return l&&"number"==typeof m&&(p="end"===l?-1*m:m),s?{x:p*u,y:f*c}:{x:f*c,y:p*u}}function k(){return"u">typeof window}function F(e){return N(e)?(e.nodeName||"").toLowerCase():"#document"}function E(e){var t;return(null==e||null==(t=e.ownerDocument)?void 0:t.defaultView)||window}function I(e){var t;return null==(t=(N(e)?e.ownerDocument:e.document)||window.document)?void 0:t.documentElement}function N(e){return!!k()&&(e instanceof Node||e instanceof E(e).Node)}function O(e){return!!k()&&(e instanceof Element||e instanceof E(e).Element)}function z(e){return!!k()&&(e instanceof HTMLElement||e instanceof E(e).HTMLElement)}function W(e){return!(!k()||"u"<typeof ShadowRoot)&&(e instanceof ShadowRoot||e instanceof E(e).ShadowRoot)}function B(e){let{overflow:t,overflowX:i,overflowY:o,display:n}=V(e);return/auto|scroll|overlay|hidden|clip/.test(t+o+i)&&"inline"!==n&&"contents"!==n}function U(e){try{if(e.matches(":popover-open"))return!0}catch(e){}try{return e.matches(":modal")}catch(e){return!1}}let j=/transform|translate|scale|rotate|perspective|filter/,G=/paint|layout|strict|content/,H=e=>!!e&&"none"!==e;function q(e){let t=O(e)?V(e):e;return H(t.transform)||H(t.translate)||H(t.scale)||H(t.rotate)||H(t.perspective)||!K()&&(H(t.backdropFilter)||H(t.filter))||j.test(t.willChange||"")||G.test(t.contain||"")}function K(){return null==o&&(o="u">typeof CSS&&CSS.supports&&CSS.supports("-webkit-backdrop-filter","none")),o}function Y(e){return/^(html|body|#document)$/.test(F(e))}function V(e){return E(e).getComputedStyle(e)}function $(e){return O(e)?{scrollLeft:e.scrollLeft,scrollTop:e.scrollTop}:{scrollLeft:e.scrollX,scrollTop:e.scrollY}}function X(e){if("html"===F(e))return e;let t=e.assignedSlot||e.parentNode||W(e)&&e.host||I(e);return W(t)?t.host:t}function J(e,t,i){var o;void 0===t&&(t=[]),void 0===i&&(i=!0);let n=function e(t){let i=X(t);return Y(i)?(t.ownerDocument||t).body:z(i)&&B(i)?i:e(i)}(e),r=n===(null==(o=e.ownerDocument)?void 0:o.body),a=E(n);if(!r)return t.concat(n,J(n,[],i));{let e=Z(a);return t.concat(a,a.visualViewport||[],B(n)?n:[],e&&i?J(e):[])}}function Z(e){return e.parent&&Object.getPrototypeOf(e.parent)?e.frameElement:null}function Q(e){let t=V(e),i=parseFloat(t.width)||0,o=parseFloat(t.height)||0,n=z(e),r=n?e.offsetWidth:i,a=n?e.offsetHeight:o,l=u(i)!==r||u(o)!==a;return l&&(i=r,o=a),{width:i,height:o,$:l}}function ee(e){return O(e)?e:e.contextElement}function et(e){let t=ee(e);if(!z(t))return f(1);let i=t.getBoundingClientRect(),{width:o,height:n,$:r}=Q(t),a=(r?u(i.width):i.width)/o,l=(r?u(i.height):i.height)/n;return a&&Number.isFinite(a)||(a=1),l&&Number.isFinite(l)||(l=1),{x:a,y:l}}let ei=f(0);function eo(e){let t=E(e);return K()&&t.visualViewport?{x:t.visualViewport.offsetLeft,y:t.visualViewport.offsetTop}:ei}function en(e,t,i,o){var n;void 0===t&&(t=!1),void 0===i&&(i=!1);let r=e.getBoundingClientRect(),a=ee(e),l=f(1);t&&(o?O(o)&&(l=et(o)):l=et(e));let s=(void 0===(n=i)&&(n=!1),o&&n&&o===E(a))?eo(a):f(0),c=(r.left+s.x)/l.x,u=(r.top+s.y)/l.y,d=r.width/l.x,p=r.height/l.y;if(a&&o){let e=E(a),t=O(o)?E(o):o,i=e,n=Z(i);for(;n&&t!==i;){let e=et(n),t=n.getBoundingClientRect(),o=V(n),r=t.left+(n.clientLeft+parseFloat(o.paddingLeft))*e.x,a=t.top+(n.clientTop+parseFloat(o.paddingTop))*e.y;c*=e.x,u*=e.y,d*=e.x,p*=e.y,c+=r,u+=a,n=Z(i=E(n))}}return A({width:d,height:p,x:c,y:u})}function er(e,t){let i=$(e).scrollLeft;return t?t.left+i:en(I(e)).left+i}function ea(e,t){let i=e.getBoundingClientRect();return{x:i.left+t.scrollLeft-er(e,i),y:i.top+t.scrollTop}}function el(e,t,i){var o;let n;if("viewport"===t||"layoutViewport"===t)n=function(e,t,i){void 0===i&&(i="viewport");let o="layoutViewport"===i,n=E(e),r=I(e),a=n.visualViewport,l=r.clientWidth,s=r.clientHeight,c=0,u=0;if(a){let e=!K()||"fixed"===t;o?e||(c=-a.offsetLeft,u=-a.offsetTop):(l=a.width,s=a.height,e&&(c=a.offsetLeft,u=a.offsetTop))}if(0>=er(r)){let e=r.ownerDocument,t=e.body,i=getComputedStyle(t),o="CSS1Compat"===e.compatMode&&parseFloat(i.marginLeft)+parseFloat(i.marginRight)||0,n=Math.abs(r.clientWidth-t.clientWidth-o),a="stable both-edges"===getComputedStyle(r).scrollbarGutter?n/2:n;a<=25&&(l-=a)}return{width:l,height:s,x:c,y:u}}(e,i,t);else if("document"===t){let t,i,r,a,l,s;t=$(o=I(e)),i=o.ownerDocument.body,r=c(o.scrollWidth,o.clientWidth,i.scrollWidth,i.clientWidth),a=c(o.scrollHeight,o.clientHeight,i.scrollHeight,i.clientHeight),l=-t.scrollLeft+er(o),s=-t.scrollTop,"rtl"===V(i).direction&&(l+=c(o.clientWidth,i.clientWidth)-r),n={width:r,height:a,x:l,y:s}}else if(O(t)){let e,o,r,a,l,s;o=(e=en(t,!0,"fixed"===i)).top+t.clientTop,r=e.left+t.clientLeft,a=et(t),l=t.clientWidth*a.x,s=t.clientHeight*a.y,n={width:l,height:s,x:r*a.x,y:o*a.y}}else{let i=eo(e);n={x:t.x-i.x,y:t.y-i.y,width:t.width,height:t.height}}return A(n)}function es(e){return"static"===V(e).position}function ec(e,t){if(!z(e)||"fixed"===V(e).position)return null;if(t)return t(e);let i=e.offsetParent;return I(e)===i&&(i=i.ownerDocument.body),i}function eu(e,t){var i;let o=E(e);if(U(e))return o;if(!z(e)){let t=X(e);for(;t&&!Y(t);){if(O(t)&&!es(t))return t;t=X(t)}return o}let n=ec(e,t);for(;n&&(i=n,/^(table|td|th)$/.test(F(i)))&&es(n);)n=ec(n,t);return n&&Y(n)&&es(n)&&!q(n)?o:n||function(e){let t=X(e);for(;z(t)&&!Y(t);){if(q(t))return t;if(U(t))break;t=X(t)}return null}(e)||o}let ed=async function(e){let t=this.getOffsetParent||eu,i=this.getDimensions,o=await i(e.floating);return{reference:function(e,t,i){let o=z(t),n=I(t),r="fixed"===i,a=en(e,!0,r,t),l={scrollLeft:0,scrollTop:0},s=f(0);if((o||!r)&&(("body"!==F(t)||B(n))&&(l=$(t)),o)){let e=en(t,!0,r,t);s.x=e.x+t.clientLeft,s.y=e.y+t.clientTop}!o&&n&&(s.x=er(n));let c=!n||o||r?f(0):ea(n,l);return{x:a.left+l.scrollLeft-s.x-c.x,y:a.top+l.scrollTop-s.y-c.y,width:a.width,height:a.height}}(e.reference,await t(e.floating),e.strategy),floating:{x:0,y:0,width:o.width,height:o.height}}},ef={convertOffsetParentRelativeRectToViewportRelativeRect:function(e){let{elements:t,rect:i,offsetParent:o,strategy:n}=e,r="fixed"===n,a=I(o),l=!!t&&U(t.floating);if(o===a||l&&r)return i;let s={scrollLeft:0,scrollTop:0},c=f(1),u=f(0),d=z(o);if((d||!r)&&(("body"!==F(o)||B(a))&&(s=$(o)),d)){let e=en(o);c=et(o),u.x=e.x+o.clientLeft,u.y=e.y+o.clientTop}let p=!a||d||r?f(0):ea(a,s);return{width:i.width*c.x,height:i.height*c.y,x:i.x*c.x-s.scrollLeft*c.x+u.x+p.x,y:i.y*c.y-s.scrollTop*c.y+u.y+p.y}},getDocumentElement:I,getClippingRect:function(e){let{element:t,boundary:i,rootBoundary:o,strategy:n}=e,r=[..."clippingAncestors"===i?U(t)?[]:function(e,t){let i=t.get(e);if(i)return i;let o=J(e,[],!1).filter(e=>O(e)&&"body"!==F(e)),n=null,r="fixed"===V(e).position,a=r?X(e):e;for(;O(a)&&!Y(a);){let e=V(a),t=q(a),i=n?n.position:r?"fixed":"";t||"fixed"!==i&&("absolute"!==i||"static"!==e.position)?n=e:o=o.filter(e=>e!==a),a=X(a)}return t.set(e,o),o}(t,this._c):[].concat(i),o],a=el(t,r[0],n),l=a.top,u=a.right,d=a.bottom,f=a.left;for(let e=1;e<r.length;e++){let i=el(t,r[e],n);l=c(i.top,l),u=s(i.right,u),d=s(i.bottom,d),f=c(i.left,f)}return{width:u-f,height:d-l,x:f,y:l}},getOffsetParent:eu,getElementRects:ed,getClientRects:function(e){return e.getClientRects?Array.from(e.getClientRects()):[]},getDimensions:function(e){let{width:t,height:i}=Q(e);return{width:t,height:i}},getScale:et,isElement:O,isRTL:function(e){return"rtl"===V(e).direction}};function ep(e,t){return e.x===t.x&&e.y===t.y&&e.width===t.width&&e.height===t.height}let eg=({content:e,placement:t="right",children:i})=>{let o=(0,l.li)(null),r=(0,l.li)(null),[a,u]=(0,l.J0)(!1),f=(0,l.li)(),p=(0,l.hb)(()=>{clearTimeout(f.current),u(!0)},[]),A=(0,l.hb)(()=>{clearTimeout(f.current),u(!1)},[]),M=(0,l.hb)(e=>{"Escape"===e.key&&A()},[A]);(0,l.vJ)(()=>{let e=r.current,i=o.current?.firstElementChild;if(a&&e&&i)return function(e,t,i,o){let n;void 0===o&&(o={});let{ancestorScroll:r=!0,ancestorResize:a=!0,elementResize:l="function"==typeof ResizeObserver,layoutShift:u="function"==typeof IntersectionObserver,animationFrame:f=!1}=o,p=ee(e),g=r||a?[...p?J(p):[],...t?J(t):[]]:[];g.forEach(e=>{r&&e.addEventListener("scroll",i),a&&e.addEventListener("resize",i)});let h=p&&u?function(e,t,i){let o,n=null,r=I(e);function a(){var e;clearTimeout(o),null==(e=n)||e.disconnect(),n=null}function l(i,u){void 0===i&&(i=!1),void 0===u&&(u=1),a();let f=e.getBoundingClientRect(),{left:p,top:g,width:h,height:v}=f;if(i||t(),!h||!v)return;let m={rootMargin:-d(g)+"px "+-d(r.clientWidth-(p+h))+"px "+-d(r.clientHeight-(g+v))+"px "+-d(p)+"px",threshold:c(0,s(1,u))||1},_=!0;function w(t){let i=t[0].intersectionRatio;if(!ep(f,e.getBoundingClientRect()))return l();if(i!==u){if(!_)return l();i?l(!1,i):o=setTimeout(()=>{l(!1,1e-7)},1e3)}_=!1}try{n=new IntersectionObserver(w,{...m,root:r.ownerDocument})}catch(e){n=new IntersectionObserver(w,m)}n.observe(e)}let u=E(e),f=()=>l(i);return u.addEventListener("resize",f),l(!0),()=>{u.removeEventListener("resize",f),a()}}(p,i,a):null,v=-1,m=null;l&&(m=new ResizeObserver(e=>{let[o]=e;o&&o.target===p&&m&&t&&(m.unobserve(t),cancelAnimationFrame(v),v=requestAnimationFrame(()=>{var e;null==(e=m)||e.observe(t)})),i()}),p&&!f&&m.observe(p),t&&m.observe(t));let _=f?en(e):null;return f&&function t(){let o=en(e);_&&!ep(_,o)&&i(),_=o,n=requestAnimationFrame(t)}(),i(),()=>{var e;g.forEach(e=>{r&&e.removeEventListener("scroll",i),a&&e.removeEventListener("resize",i)}),null==h||h(),null==(e=m)||e.disconnect(),m=null,f&&cancelAnimationFrame(n)}}(i,e,()=>{var o,n,a;let l,u,d;(a={placement:t,strategy:"fixed",middleware:[{name:"offset",options:8,async fn(e){var t,i;let{x:o,y:n,placement:r,middlewareData:a}=e,l=await T(e,8);return r===(null==(t=a.offset)?void 0:t.placement)&&null!=(i=a.arrow)&&i.alignmentOffset?{}:{x:o+l.x,y:n+l.y,data:{...l,placement:r}}}},(void 0===o&&(o={}),{name:"flip",options:o,async fn(e){var t,i,n,r,a,l,s,c;let u,d,f,{placement:p,middlewareData:A,rects:M,initialPlacement:D,platform:S,elements:R}=e,{mainAxis:T=!0,crossAxis:k=!0,fallbackPlacements:F,fallbackStrategy:E="bestFit",fallbackAxisSideDirection:I="none",flipAlignment:N=!0,...O}=g(o,e);if(null!=(t=A.arrow)&&t.alignmentOffset)return{};let z=h(p),W=w(D),B=h(D)===D,U=await (null==S.isRTL?void 0:S.isRTL(R.floating)),j=F||(B||!N?[L(D)]:(u=L(D),[y(D),u,y(u)])),G="none"!==I;!F&&G&&j.push(...(d=v(D),f=function(e,t,i){switch(e){case"top":case"bottom":if(i)return t?C:b;return t?b:C;case"left":case"right":return t?x:P;default:return[]}}(h(D),"start"===I,U),d&&(f=f.map(e=>e+"-"+d),N&&(f=f.concat(f.map(y)))),f));let H=[D,...j],q=await S.detectOverflow(e,O),K=[],Y=(null==(i=A.flip)?void 0:i.overflows)||[];if(T&&K.push(q[z]),k){let e,t,i,o,n=(l=p,s=M,void 0===(c=U)&&(c=!1),e=v(l),i=_(t=m(w(l))),o="x"===t?e===(c?"end":"start")?"right":"left":"start"===e?"bottom":"top",s.reference[i]>s.floating[i]&&(o=L(o)),[o,L(o)]);K.push(q[n[0]],q[n[1]])}if(Y=[...Y,{placement:p,overflows:K}],!K.every(e=>e<=0)){let e=((null==(n=A.flip)?void 0:n.index)||0)+1,t=H[e];if(t&&("alignment"!==k||W===w(t)||Y.every(e=>w(e.placement)!==W||e.overflows[0]>0)))return{data:{index:e,overflows:Y},reset:{placement:t}};let i=null==(r=Y.filter(e=>e.overflows[0]<=0).sort((e,t)=>e.overflows[1]-t.overflows[1])[0])?void 0:r.placement;if(!i)switch(E){case"bestFit":{let e=null==(a=Y.filter(e=>{if(G){let t=w(e.placement);return t===W||"y"===t}return!0}).map(e=>[e.placement,e.overflows.filter(e=>e>0).reduce((e,t)=>e+t,0)]).sort((e,t)=>e[1]-t[1])[0])?void 0:a[0];e&&(i=e);break}case"initialPlacement":i=D}if(p!==i)return{reset:{placement:i}}}return{}}}),{name:"shift",options:n={padding:4},async fn(e){let{x:t,y:i,placement:o,platform:r}=e,{mainAxis:a=!0,crossAxis:l=!1,limiter:u={fn:e=>{let{x:t,y:i}=e;return{x:t,y:i}}},...d}=g(n,e),f={x:t,y:i},p=await r.detectOverflow(e,d),h=w(o),v=m(h),_=f[v],y=f[h],b=(e,t)=>c(t+p["y"===e?"top":"left"],s(t,t-p["y"===e?"bottom":"right"]));a&&(_=b(v,_)),l&&(y=b(h,y));let C=u.fn({...e,[v]:_,[h]:y});return{...C,data:{x:C.x-t,y:C.y-i,enabled:{[v]:a,[h]:l}}}}}]},l=new Map,u=null!=a?a:{},d={...ef,...u.platform,_c:l},S(i,e,{...u,platform:d})).then(({x:t,y:i})=>{r.current===e&&Object.assign(e.style,{left:`${t}px`,top:`${i}px`,opacity:"1"})})})},[a,t]),(0,l.vJ)(()=>()=>clearTimeout(f.current),[]);let D=(0,l.hb)(t=>{t&&e instanceof HTMLElement&&t.replaceChildren(e.cloneNode(!0))},[e]);return null==e||!1===e||""===e?(0,n.Y)(n.FK,{children:i}):(0,n.FD)("div",{ref:o,className:"deck-widget-tooltip-trigger",onPointerEnter:p,onPointerLeave:A,onFocusCapture:p,onBlurCapture:A,onKeyDown:M,children:[i,a&&(0,n.Y)("div",{ref:r,className:"deck-widget-tooltip",role:"tooltip",style:{position:"fixed",opacity:0,fontSize:"12px",padding:"4px 8px"},children:e instanceof HTMLElement?(0,n.Y)("div",{ref:D}):e})]})},eh=e=>{let{className:t="",style:i,color:o,icon:r,label:a,tooltip:s,onClick:c,children:u}=e,d=!1===s?void 0:s??a,f=(0,l.Kr)(()=>{let e=function(e){if(!e)return;let t=`url("${e.replace(/"/g,"'")}")`;return{maskImage:t,WebkitMaskImage:t}}(r);return o?{...e,backgroundColor:o}:e},[o,r]),p=(0,n.Y)("button",{className:`deck-widget-icon-button ${t}`,type:"button",onClick:c,"aria-label":a,children:u||(0,n.Y)("div",{className:"deck-widget-icon",style:f})});return(0,n.Y)("div",{className:"deck-widget-button",style:i,children:d?(0,n.Y)(eg,{content:d,children:p}):p})},ev={passive:!1},em=(e,t,i)=>e<t?t:e>i?i:e,e_=(e,t)=>{if(!e||!e.firstElementChild)return[0,0];let i=e.firstElementChild.getBoundingClientRect();return t||t?[i.top,i.height]:[i.left,i.width]},ew=(e,t)=>"number"==typeof e&&!Number.isNaN(e)&&e>0?e:Math.max(1,t/10||1),ey=(e,t)=>"number"==typeof e&&!Number.isNaN(e)&&e>0?e:Math.max(1,t||1);function eb(e){let{className:t="",min:i,max:o,step:r,value:a,orientation:s,pageSize:c,stepButtons:u=!1,startButtonAriaLabel:d,endButtonAriaLabel:f,eventTarget:p,decorations:g=[],onChange:h}=e,v="horizontal"!==s,m=(0,l.li)(null),_=(0,l.li)(null),w=(0,l.li)(null),y=(0,l.li)(null),[b,C]=(0,l.J0)(0),x=o-i,P=Math.max(0,a[1]-a[0]),L=Math.max(0,x-P),A=em(a[0],i,i+L),{thumbLength:M,thumbOffset:D}=(0,l.Kr)(()=>{if(b<=0||x<=0)return{thumbLength:0,thumbOffset:0};if(x<=P)return{thumbLength:1,thumbOffset:0};let e=P/x,t=Math.max(0,1-e);return{thumbLength:Math.max(0,Math.min(e,1)),thumbOffset:t*(L<=0?0:em((A-i)/L,0,1))}},[b,x,P,L,A,i]),S=(0,l.hb)(e=>{if(!h)return;let t=em(e,i,i+L);h([t,t+P])},[h,i,L,P]),R=(0,l.hb)(e=>{e.stopPropagation(),S(A-ew(r,x))},[S,A,r,x]),T=(0,l.hb)(e=>{e.stopPropagation(),S(A+ew(r,x))},[S,A,r,x]),k=(0,l.hb)(e=>{if(0!==e.button)return;let t=e.target;if(t?.dataset.scrollbarThumb==="true")return;let o=_.current;if(!o)return;e.preventDefault(),e.stopPropagation();let[n]=e_(o,v),r=v?e.clientY-n:e.clientX-n,a=Math.max(1,1-M)*b,l=M/2*b;S(i+(a<=0?0:em((r-l)/a,0,1))*L)},[v,b,M,S,i,L]),F=(0,l.hb)(e=>{let t=y.current;if(!t||t.pointerId!==e.pointerId)return;let[i,o]=e_(_.current,v),n=(v?e.clientY:e.clientX)-t.startCoord;S(em((t.startRatio+n/o)*(t.max-t.min),0,t.maxStart)+t.min),e.preventDefault()},[S,v]),E=(0,l.hb)(e=>{let t=y.current;t&&t.pointerId===e.pointerId&&(y.current=null,w.current?.releasePointerCapture(e.pointerId),e.preventDefault())},[]),I=(0,l.hb)(e=>{switch(e.key){case"ArrowUp":case"ArrowLeft":(v&&"ArrowUp"===e.key||!v&&"ArrowLeft"===e.key)&&(S(A-ew(r,x)),e.preventDefault());break;case"ArrowDown":case"ArrowRight":(v&&"ArrowDown"===e.key||!v&&"ArrowRight"===e.key)&&(S(A+ew(r,x)),e.preventDefault());break;case"PageUp":S(A-ey(c,P)),e.preventDefault();break;case"PageDown":S(A+ey(c,P)),e.preventDefault();break;case"Home":S(i),e.preventDefault();break;case"End":S(i+L),e.preventDefault()}},[v,S,A,r,x,c,P,i,L]),N=(0,l.hb)(e=>{if(e.preventDefault(),e.stopPropagation(),0===L)return;let t=v?e.deltaY:e.deltaX;v||0!==t||(t=e.deltaY),e.deltaMode===WheelEvent.DOM_DELTA_LINE?t*=ew(r,x):e.deltaMode===WheelEvent.DOM_DELTA_PAGE&&(t*=ey(c,P)),0!==t&&S(A+t)},[S,A,L,v,r,x,c,P]);(0,l.Nf)(()=>{C(e_(_.current,v)[1])},[v]),(0,l.Nf)(()=>{let e=_.current;if(!e)return;let t=()=>{C(e_(e,v)[1])};if(t(),"u">typeof ResizeObserver){let i=new ResizeObserver(t);return i.observe(e),()=>i.disconnect()}if("u">typeof window)return window.addEventListener("resize",t),()=>window.removeEventListener("resize",t)},[v]),(0,l.vJ)(()=>{let e=p??m.current;if(e)return e.addEventListener("keydown",I),e.addEventListener("wheel",N,ev),()=>{e.removeEventListener("keydown",I),e.removeEventListener("wheel",N,ev)}},[p,I,N]);let O=(0,l.Kr)(()=>!g.length||x<=0?[]:g.map((e,t)=>{let[o,r]=e.position,a=(o-i)/x,l=Math.round(1e3*a)/10,s=Math.max(0,Math.round(((r-i)/x-a)*1e3)/10),c=v?{left:"0",width:"100%",top:`${l}%`,height:`${s}%`}:{top:"0",height:"100%",left:`${l}%`,width:`${s}%`};return(0,n.Y)("div",{className:"deck-widget-range__decoration",style:c,children:e.element},`decoration-${t}`)}),[g,x,i,v]);return(0,n.FD)("div",{ref:m,tabIndex:0,role:"scrollbar","aria-valuemin":i,"aria-valuemax":i+L,"aria-valuenow":A,"aria-orientation":s,className:`${t} deck-widget-range deck-widget-range--${s} ${0===L?"deck-widget-range--disabled":""}`,children:[u&&(0,n.Y)("button",{type:"button",className:"deck-widget-range__button deck-widget-range__button--start","aria-label":d,disabled:A<=i,onClick:R,children:(0,n.Y)("span",{className:"deck-widget-icon"})}),(0,n.FD)("div",{className:"deck-widget-range__track",ref:_,onClick:k,children:[(0,n.Y)("div",{className:"deck-widget-range__decorations",children:O}),(0,n.Y)("div",{className:"deck-widget-range__thumb","data-scrollbar-thumb":"true",ref:w,style:v?{height:`${100*M}%`,top:`${100*D}%`}:{width:`${100*M}%`,left:`${100*D}%`},onPointerDown:e=>{0!==e.button||_.current&&(y.current={pointerId:e.pointerId,startCoord:v?e.clientY:e.clientX,startRatio:D,min:i,max:o,maxStart:L},e.currentTarget.setPointerCapture(e.pointerId),e.preventDefault(),e.stopPropagation())},onPointerMove:F,onPointerUp:E,onPointerCancel:E})]}),u&&(0,n.Y)("button",{type:"button",className:"deck-widget-range__button deck-widget-range__button--end","aria-label":f,disabled:A>=i+L,onClick:T,children:(0,n.Y)("span",{className:"deck-widget-icon"})})]})}class eC extends r.x{getTime(){return this.props.time??this.currentTime}getPlaying(){return this.props.playing??this._playing}constructor(e={}){super(e),this.id="timeline",this.className="deck-widget-timeline",this.placement="fill",this._playing=!1,this.timerId=null,this.handlePlayPause=()=>{let e=!this.getPlaying();this.props.onPlayingChange?.(e),void 0===this.props.playing&&(e?this.play():this.stop())},this.handleTimeChange=([e])=>{this.props.onTimeChange(e),void 0===this.props.time&&(this.currentTime=e,this.props.timeline?.setTime(e),this.updateHTML())},this.tick=()=>{let{timeRange:[e,t],step:i,loop:o}=this.props;if(i>0){let n=this.getTime(),r=Math.round(n/i)*i+i;r>t&&(n<t?r=t:o?r=e:(r=t,this._playing=!1,this.props.onPlayingChange?.(!1))),this.props.onTimeChange(r),void 0===this.props.time&&(this.currentTime=r,this.props.timeline?.setTime(r)),this.updateHTML()}this._playing?this.timerId=window.setTimeout(this.tick,this.props.playInterval):this.timerId=null},this.currentTime=this.props.initialTime??this.props.timeRange[0];let t=this.props.time??this.currentTime;this.props.timeline?.setTime(t),this.setProps(this.props)}setProps(e){let{playing:t,time:i}=this.props;this.viewId=e.viewId??this.viewId,super.setProps(e),void 0!==e.time&&e.time!==i&&this.props.timeline?.setTime(e.time),void 0!==e.playing&&e.playing!==t&&(e.playing&&!this._playing?this._startTimer():!e.playing&&this._playing&&this._stopTimer())}onAdd(){this._playing=!1,this.timerId=null,this.props.autoPlay&&(void 0!==this.props.playing?this.props.onPlayingChange?.(!0):this.play())}onRemove(){this.stop()}onRenderHTML(e){let{timeRange:t,step:i,formatLabel:o,playTooltip:r,pauseTooltip:l}=this.props,s=this.getPlaying(),c=this.getTime();e.dataset.placement=this.props.placement,(0,a.XX)((0,n.FD)("div",{className:"deck-widget-button-group",children:[s?(0,n.Y)(eh,{label:"Pause",tooltip:l,className:"deck-widget-timeline-pause",onClick:this.handlePlayPause}):(0,n.Y)(eh,{label:"Play",tooltip:r,className:"deck-widget-timeline-play",onClick:this.handlePlayPause}),(0,n.Y)(eb,{min:t[0],max:t[1],orientation:"horizontal",step:i,value:[c,c],onChange:this.handleTimeChange,decorations:[{position:[c,c+i],element:(0,n.Y)("div",{className:"deck-widget-timeline-label deck-widget-timeline-label--current",children:o(c)})}]})]}),e)}play(){this._playing=!0;let{timeRange:[e,t]}=this.props;void 0===this.props.time&&this.getTime()>=t&&(this.currentTime=e,this.props.onTimeChange(e),this.props.timeline?.setTime(e)),this.updateHTML(),this.tick()}stop(){this._stopTimer(),this.updateHTML()}_startTimer(){this._playing=!0,this.tick()}_stopTimer(){this._playing=!1,null!==this.timerId&&(window.clearTimeout(this.timerId),this.timerId=null)}}eC.defaultProps={...r.x.defaultProps,id:"timeline",placement:"bottom-left",viewId:null,timeline:null,timeRange:[0,100],step:1,initialTime:void 0,time:void 0,onTimeChange:()=>{},autoPlay:!1,loop:!1,playInterval:1e3,playing:void 0,onPlayingChange:()=>{},formatLabel:String,playTooltip:void 0,pauseTooltip:void 0}},15979(e,t,i){i.d(t,{X:()=>s});var o=i(66925);let n=`\
layout(std140) uniform waterMaterialUniforms {
  uniform float time;
  uniform vec3 baseColor;
  uniform float opacity;
  uniform vec3 fresnelColor;
  uniform float fresnelPower;
  uniform float specularIntensity;
  uniform float normalStrength;
  uniform int mappingMode;
  uniform vec2 coordinateScale;
  uniform vec2 coordinateOffset;
  uniform vec2 waveADirection;
  uniform float waveASpeed;
  uniform float waveAFrequency;
  uniform float waveAAmplitude;
  uniform vec2 waveBDirection;
  uniform float waveBSpeed;
  uniform float waveBFrequency;
  uniform float waveBAmplitude;
} waterMaterial;
`,r=`\
layout(std140) uniform waterMaterialUniforms {
  uniform float time;
  uniform vec3 baseColor;
  uniform float opacity;
  uniform vec3 fresnelColor;
  uniform float fresnelPower;
  uniform float specularIntensity;
  uniform float normalStrength;
  uniform int mappingMode;
  uniform vec2 coordinateScale;
  uniform vec2 coordinateOffset;
  uniform vec2 waveADirection;
  uniform float waveASpeed;
  uniform float waveAFrequency;
  uniform float waveAAmplitude;
  uniform vec2 waveBDirection;
  uniform float waveBSpeed;
  uniform float waveBFrequency;
  uniform float waveBAmplitude;
} waterMaterial;

vec2 water_getDirection(vec2 direction) {
  float directionLength = length(direction);
  return directionLength > 0.0 ? direction / directionLength : vec2(1.0, 0.0);
}

vec2 water_getCoordinates(vec3 position_worldspace, vec3 position_objectspace, vec2 uv) {
  vec2 baseCoordinates = uv;
  if (waterMaterial.mappingMode == 1) {
    baseCoordinates = position_worldspace.xz;
  } else if (waterMaterial.mappingMode == 2) {
    vec3 globeDirection = normalize(position_objectspace);
    float longitude = atan(globeDirection.x, globeDirection.z);
    float latitude = asin(clamp(globeDirection.y, -1.0, 1.0));
    baseCoordinates = vec2(longitude, latitude);
  }
  return baseCoordinates * waterMaterial.coordinateScale + waterMaterial.coordinateOffset;
}

vec2 water_getWaveGradient(
  vec2 coordinates,
  vec2 direction,
  float speed,
  float frequency,
  float amplitude
) {
  vec2 normalizedDirection = water_getDirection(direction);
  float phase = dot(coordinates * frequency, normalizedDirection) + waterMaterial.time * speed;
  return cos(phase) * normalizedDirection * frequency * amplitude;
}

vec3 water_getTangent(vec3 normal_worldspace) {
  vec3 referenceAxis = abs(normal_worldspace.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(0.0, 1.0, 0.0);
  return normalize(cross(referenceAxis, normal_worldspace));
}

vec3 water_getNormal(
  vec3 position_worldspace,
  vec3 position_objectspace,
  vec3 normal_worldspace,
  vec2 uv
) {
  vec2 coordinates = water_getCoordinates(position_worldspace, position_objectspace, uv);
  vec2 gradient =
    water_getWaveGradient(
      coordinates,
      waterMaterial.waveADirection,
      waterMaterial.waveASpeed,
      waterMaterial.waveAFrequency,
      waterMaterial.waveAAmplitude
    ) +
    water_getWaveGradient(
      coordinates,
      waterMaterial.waveBDirection,
      waterMaterial.waveBSpeed,
      waterMaterial.waveBFrequency,
      waterMaterial.waveBAmplitude
    );

  vec3 tangent = water_getTangent(normal_worldspace);
  vec3 bitangent = normalize(cross(normal_worldspace, tangent));
  vec3 perturbation =
    waterMaterial.normalStrength * (gradient.x * tangent + gradient.y * bitangent);

  return normalize(normal_worldspace + perturbation);
}

vec3 water_getSpecularContribution(
  vec3 light_direction,
  vec3 view_direction,
  vec3 normal_worldspace,
  vec3 light_color,
  float fresnel
) {
  vec3 halfway_direction = normalize(light_direction + view_direction);
  float specular =
    pow(max(dot(normal_worldspace, halfway_direction), 0.0), 72.0) *
    waterMaterial.specularIntensity *
    (0.25 + 0.75 * fresnel);

  return waterMaterial.fresnelColor * light_color * specular;
}

vec4 water_getColorMapped(
  vec3 cameraPosition,
  vec3 position_worldspace,
  vec3 position_objectspace,
  vec3 normal_worldspace,
  vec2 uv
) {
  vec3 waterNormal = water_getNormal(
    position_worldspace,
    position_objectspace,
    normalize(normal_worldspace),
    uv
  );
  vec3 viewDirection = normalize(cameraPosition - position_worldspace);
  float fresnel =
    pow(
      1.0 - max(dot(viewDirection, waterNormal), 0.0),
      max(waterMaterial.fresnelPower, 0.0001)
    );
  vec3 surfaceColor = mix(
    waterMaterial.baseColor,
    waterMaterial.fresnelColor,
    clamp(fresnel * 0.6, 0.0, 1.0)
  );

  if (lighting.enabled == 0) {
    return vec4(surfaceColor, waterMaterial.opacity);
  }

  vec3 lightColor = surfaceColor * (0.15 + 0.85 * lighting.ambientColor);

  for (int i = 0; i < lighting.pointLightCount; i++) {
    PointLight pointLight = lighting_getPointLight(i);
    vec3 lightPosition = pointLight.position;
    vec3 lightDirection = normalize(lightPosition - position_worldspace);
    float attenuation =
      getPointLightAttenuation(pointLight, distance(lightPosition, position_worldspace));
    vec3 incidentLight = pointLight.color / attenuation;
    float diffuse = max(dot(waterNormal, lightDirection), 0.0);

    lightColor += surfaceColor * incidentLight * diffuse;
    lightColor += water_getSpecularContribution(
      lightDirection,
      viewDirection,
      waterNormal,
      incidentLight,
      fresnel
    );
  }

  for (int i = 0; i < lighting.spotLightCount; i++) {
    SpotLight spotLight = lighting_getSpotLight(i);
    vec3 lightPosition = spotLight.position;
    vec3 lightDirection = normalize(lightPosition - position_worldspace);
    float attenuation = getSpotLightAttenuation(spotLight, position_worldspace);
    vec3 incidentLight = spotLight.color / attenuation;
    float diffuse = max(dot(waterNormal, lightDirection), 0.0);

    lightColor += surfaceColor * incidentLight * diffuse;
    lightColor += water_getSpecularContribution(
      lightDirection,
      viewDirection,
      waterNormal,
      incidentLight,
      fresnel
    );
  }

  for (int i = 0; i < lighting.directionalLightCount; i++) {
    DirectionalLight directionalLight = lighting_getDirectionalLight(i);
    vec3 lightDirection = normalize(-directionalLight.direction);
    float diffuse = max(dot(waterNormal, lightDirection), 0.0);

    lightColor += surfaceColor * directionalLight.color * diffuse;
    lightColor += water_getSpecularContribution(
      lightDirection,
      viewDirection,
      waterNormal,
      directionalLight.color,
      fresnel
    );
  }

  lightColor = mix(lightColor, waterMaterial.fresnelColor, clamp(fresnel, 0.0, 1.0) * 0.35);
  return vec4(lightColor, waterMaterial.opacity);
}

vec4 water_getColor(
  vec3 cameraPosition,
  vec3 position_worldspace,
  vec3 normal_worldspace,
  vec2 uv
) {
  return water_getColorMapped(
    cameraPosition,
    position_worldspace,
    position_worldspace,
    normal_worldspace,
    uv
  );
}
`,a=`\
struct waterMaterialUniforms {
  time: f32,
  baseColor: vec3<f32>,
  opacity: f32,
  fresnelColor: vec3<f32>,
  fresnelPower: f32,
  specularIntensity: f32,
  normalStrength: f32,
  mappingMode: i32,
  coordinateScale: vec2<f32>,
  coordinateOffset: vec2<f32>,
  waveADirection: vec2<f32>,
  waveASpeed: f32,
  waveAFrequency: f32,
  waveAAmplitude: f32,
  waveBDirection: vec2<f32>,
  waveBSpeed: f32,
  waveBFrequency: f32,
  waveBAmplitude: f32,
};

@group(3) @binding(auto) var<uniform> waterMaterial : waterMaterialUniforms;

fn water_getDirection(direction: vec2<f32>) -> vec2<f32> {
  let directionLength = length(direction);
  if (directionLength > 0.0) {
    return direction / directionLength;
  }

  return vec2<f32>(1.0, 0.0);
}

fn water_getCoordinates(
  position_worldspace: vec3<f32>,
  position_objectspace: vec3<f32>,
  uv: vec2<f32>
) -> vec2<f32> {
  var baseCoordinates = uv;
  if (waterMaterial.mappingMode == 1) {
    baseCoordinates = position_worldspace.xz;
  } else if (waterMaterial.mappingMode == 2) {
    let globeDirection = normalize(position_objectspace);
    let longitude = atan2(globeDirection.x, globeDirection.z);
    let latitude = asin(clamp(globeDirection.y, -1.0, 1.0));
    baseCoordinates = vec2<f32>(longitude, latitude);
  }

  return baseCoordinates * waterMaterial.coordinateScale + waterMaterial.coordinateOffset;
}

fn water_getWaveGradient(
  coordinates: vec2<f32>,
  direction: vec2<f32>,
  speed: f32,
  frequency: f32,
  amplitude: f32
) -> vec2<f32> {
  let normalizedDirection = water_getDirection(direction);
  let phase = dot(coordinates * frequency, normalizedDirection) + waterMaterial.time * speed;
  return cos(phase) * normalizedDirection * frequency * amplitude;
}

fn water_getTangent(normal_worldspace: vec3<f32>) -> vec3<f32> {
  var referenceAxis = vec3<f32>(0.0, 0.0, 1.0);
  if (abs(normal_worldspace.z) >= 0.999) {
    referenceAxis = vec3<f32>(0.0, 1.0, 0.0);
  }

  return normalize(cross(referenceAxis, normal_worldspace));
}

fn water_getNormal(
  position_worldspace: vec3<f32>,
  position_objectspace: vec3<f32>,
  normal_worldspace: vec3<f32>,
  uv: vec2<f32>
) -> vec3<f32> {
  let coordinates = water_getCoordinates(position_worldspace, position_objectspace, uv);
  let gradient =
    water_getWaveGradient(
      coordinates,
      waterMaterial.waveADirection,
      waterMaterial.waveASpeed,
      waterMaterial.waveAFrequency,
      waterMaterial.waveAAmplitude
    ) +
    water_getWaveGradient(
      coordinates,
      waterMaterial.waveBDirection,
      waterMaterial.waveBSpeed,
      waterMaterial.waveBFrequency,
      waterMaterial.waveBAmplitude
    );
  let tangent = water_getTangent(normal_worldspace);
  let bitangent = normalize(cross(normal_worldspace, tangent));
  let perturbation =
    waterMaterial.normalStrength * (gradient.x * tangent + gradient.y * bitangent);

  return normalize(normal_worldspace + perturbation);
}

fn water_getSpecularContribution(
  light_direction: vec3<f32>,
  view_direction: vec3<f32>,
  normal_worldspace: vec3<f32>,
  light_color: vec3<f32>,
  fresnel: f32
) -> vec3<f32> {
  let halfwayDirection = normalize(light_direction + view_direction);
  let specular =
    pow(max(dot(normal_worldspace, halfwayDirection), 0.0), 72.0) *
    waterMaterial.specularIntensity *
    (0.25 + 0.75 * fresnel);

  return waterMaterial.fresnelColor * light_color * specular;
}

fn water_getColorMapped(
  cameraPosition: vec3<f32>,
  position_worldspace: vec3<f32>,
  position_objectspace: vec3<f32>,
  normal_worldspace: vec3<f32>,
  uv: vec2<f32>
) -> vec4<f32> {
  let waterNormal = water_getNormal(
    position_worldspace,
    position_objectspace,
    normalize(normal_worldspace),
    uv
  );
  let viewDirection = normalize(cameraPosition - position_worldspace);
  let fresnel =
    pow(
      1.0 - max(dot(viewDirection, waterNormal), 0.0),
      max(waterMaterial.fresnelPower, 0.0001)
    );
  let surfaceColor = mix(
    waterMaterial.baseColor,
    waterMaterial.fresnelColor,
    clamp(fresnel * 0.6, 0.0, 1.0)
  );

  if (lighting.enabled == 0) {
    return vec4<f32>(surfaceColor, waterMaterial.opacity);
  }

  var lightColor = surfaceColor * (0.15 + 0.85 * lighting.ambientColor);

  for (var i: i32 = 0; i < lighting.pointLightCount; i++) {
    let pointLight = lighting_getPointLight(i);
    let lightPosition = pointLight.position;
    let lightDirection = normalize(lightPosition - position_worldspace);
    let attenuation = getPointLightAttenuation(
      pointLight,
      distance(lightPosition, position_worldspace)
    );
    let incidentLight = pointLight.color / attenuation;
    let diffuse = max(dot(waterNormal, lightDirection), 0.0);

    lightColor += surfaceColor * incidentLight * diffuse;
    lightColor += water_getSpecularContribution(
      lightDirection,
      viewDirection,
      waterNormal,
      incidentLight,
      fresnel
    );
  }

  for (var i: i32 = 0; i < lighting.spotLightCount; i++) {
    let spotLight = lighting_getSpotLight(i);
    let lightPosition = spotLight.position;
    let lightDirection = normalize(lightPosition - position_worldspace);
    let attenuation = getSpotLightAttenuation(spotLight, position_worldspace);
    let incidentLight = spotLight.color / attenuation;
    let diffuse = max(dot(waterNormal, lightDirection), 0.0);

    lightColor += surfaceColor * incidentLight * diffuse;
    lightColor += water_getSpecularContribution(
      lightDirection,
      viewDirection,
      waterNormal,
      incidentLight,
      fresnel
    );
  }

  for (var i: i32 = 0; i < lighting.directionalLightCount; i++) {
    let directionalLight = lighting_getDirectionalLight(i);
    let lightDirection = normalize(-directionalLight.direction);
    let diffuse = max(dot(waterNormal, lightDirection), 0.0);

    lightColor += surfaceColor * directionalLight.color * diffuse;
    lightColor += water_getSpecularContribution(
      lightDirection,
      viewDirection,
      waterNormal,
      directionalLight.color,
      fresnel
    );
  }

  lightColor = mix(
    lightColor,
    waterMaterial.fresnelColor,
    clamp(fresnel, 0.0, 1.0) * 0.35
  );
  return vec4<f32>(lightColor, waterMaterial.opacity);
}

fn water_getColor(
  cameraPosition: vec3<f32>,
  position_worldspace: vec3<f32>,
  normal_worldspace: vec3<f32>,
  uv: vec2<f32>
) -> vec4<f32> {
  return water_getColorMapped(
    cameraPosition,
    position_worldspace,
    position_worldspace,
    normal_worldspace,
    uv
  );
}
`,l={time:0,baseColor:[.04,.18,.31],opacity:.82,fresnelColor:[.86,.95,1],fresnelPower:5,specularIntensity:1.4,normalStrength:.35,mappingMode:0,coordinateScale:[1,1],coordinateOffset:[0,0],waveADirection:[.9805806756909201,.19611613513818402],waveASpeed:.6,waveAFrequency:4,waveAAmplitude:.08,waveBDirection:[.09950371902099893,.9950371902099893],waveBSpeed:-.45,waveBFrequency:7,waveBAmplitude:.04},s={name:"waterMaterial",firstBindingSlot:0,bindingLayout:[{name:"waterMaterial",group:3}],dependencies:[o.x],source:a,vs:n,fs:r,defines:{LIGHTING_FRAGMENT:!0},uniformTypes:{time:"f32",baseColor:"vec3<f32>",opacity:"f32",fresnelColor:"vec3<f32>",fresnelPower:"f32",specularIntensity:"f32",normalStrength:"f32",mappingMode:"i32",coordinateScale:"vec2<f32>",coordinateOffset:"vec2<f32>",waveADirection:"vec2<f32>",waveASpeed:"f32",waveAFrequency:"f32",waveAAmplitude:"f32",waveBDirection:"vec2<f32>",waveBSpeed:"f32",waveBFrequency:"f32",waveBAmplitude:"f32"},defaultUniforms:l,getUniforms(e,t=l){var i;let{mapping:o,...n}=e||{},r={time:(i=t).time??l.time,baseColor:i.baseColor?c(i.baseColor):l.baseColor,opacity:i.opacity??l.opacity,fresnelColor:i.fresnelColor?c(i.fresnelColor):l.fresnelColor,fresnelPower:i.fresnelPower??l.fresnelPower,specularIntensity:i.specularIntensity??l.specularIntensity,normalStrength:i.normalStrength??l.normalStrength,mappingMode:i.mappingMode??l.mappingMode,coordinateScale:i.coordinateScale?[Number(i.coordinateScale[0]),Number(i.coordinateScale[1])]:l.coordinateScale,coordinateOffset:i.coordinateOffset?[Number(i.coordinateOffset[0]),Number(i.coordinateOffset[1])]:l.coordinateOffset,waveADirection:i.waveADirection?u(i.waveADirection):l.waveADirection,waveASpeed:i.waveASpeed??l.waveASpeed,waveAFrequency:i.waveAFrequency??l.waveAFrequency,waveAAmplitude:i.waveAAmplitude??l.waveAAmplitude,waveBDirection:i.waveBDirection?u(i.waveBDirection):l.waveBDirection,waveBSpeed:i.waveBSpeed??l.waveBSpeed,waveBFrequency:i.waveBFrequency??l.waveBFrequency,waveBAmplitude:i.waveBAmplitude??l.waveBAmplitude};return void 0!==n.time&&(r.time=n.time),void 0!==n.opacity&&(r.opacity=n.opacity),void 0!==n.fresnelPower&&(r.fresnelPower=n.fresnelPower),void 0!==n.specularIntensity&&(r.specularIntensity=n.specularIntensity),void 0!==n.normalStrength&&(r.normalStrength=n.normalStrength),void 0!==n.coordinateScale&&(r.coordinateScale=[Number(n.coordinateScale[0]),Number(n.coordinateScale[1])]),void 0!==n.coordinateOffset&&(r.coordinateOffset=[Number(n.coordinateOffset[0]),Number(n.coordinateOffset[1])]),void 0!==n.waveASpeed&&(r.waveASpeed=n.waveASpeed),void 0!==n.waveAFrequency&&(r.waveAFrequency=n.waveAFrequency),void 0!==n.waveAAmplitude&&(r.waveAAmplitude=n.waveAAmplitude),void 0!==n.waveBSpeed&&(r.waveBSpeed=n.waveBSpeed),void 0!==n.waveBFrequency&&(r.waveBFrequency=n.waveBFrequency),void 0!==n.waveBAmplitude&&(r.waveBAmplitude=n.waveBAmplitude),n.baseColor&&(r.baseColor=c(n.baseColor)),n.fresnelColor&&(r.fresnelColor=c(n.fresnelColor)),n.waveADirection&&(r.waveADirection=u(n.waveADirection)),n.waveBDirection&&(r.waveBDirection=u(n.waveBDirection)),void 0!==o&&(r.mappingMode="world"===o?1:2*("object"===o)),r}};function c(e){let t=[Number(e[0]),Number(e[1]),Number(e[2])];return Math.max(...t.map(e=>Math.abs(e)))>1&&(t[0]/=255,t[1]/=255,t[2]/=255),t}function u(e){let t=Number(e[0]),i=Number(e[1]),o=Math.hypot(t,i);return 0===o?[1,0]:[t/o,i/o]}}}]);