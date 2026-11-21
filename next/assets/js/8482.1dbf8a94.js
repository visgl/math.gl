"use strict";(self.webpackChunkproject_website=self.webpackChunkproject_website||[]).push([["8482"],{44941(e,t,i){i.d(t,{A:()=>a});var o=i(53439),n=i(23459),r=i(24067),s=i(8994);class a{constructor(e){this.indexStarts=[0],this.vertexStarts=[0],this.vertexCount=0,this.instanceCount=0;let{attributes:t={}}=e;this.typedArrayManager=n.A,this.attributes={},this._attributeDefs=t,this.opts=e,this.updateGeometry(e)}updateGeometry(e){Object.assign(this.opts,e);let{data:t,buffers:i={},getGeometry:o,geometryBuffer:n,positionFormat:s,dataChanged:a,normalize:l=!0}=this.opts;if(this.data=t,this.geometryAccessor=o,this.inputPositionSize=n&&n.size||("XY"===s?2:3),this.positionSize=this.opts.transform?3:this.inputPositionSize,this.buffers=i,this.normalize=l,n&&((0,r.A)(t.startIndices),this.geometryAccessor=this.getGeometryFromBuffer(n),l||this.opts.transform||(i.vertexPositions=n)),this.geometryBuffer=i.vertexPositions,Array.isArray(a))for(let e of a)this._rebuildGeometry(e);else this._rebuildGeometry()}updatePartialGeometry({startRow:e,endRow:t}){this._rebuildGeometry({startRow:e,endRow:t})}getGeometry(...e){let t=this.geometryAccessor?.(...e);return t&&this.opts.transform?function e(t,i,o){if("positions"in t)return{...t,positions:e(t.positions,i,o),...t.holeIndices&&{holeIndices:Array.from(t.holeIndices,e=>e/i*3)}};if(!t.length)return[];if("number"!=typeof t[0])return Array.from(t,t=>e(t,i,o));let n=[];for(let e=0;e<t.length;e+=i){let r=o([t[e],t[e+1],3===i?t[e+2]:0]);n.push(r[0],r[1],r[2]??0)}return n}(this.prepareGeometry(t),this.inputPositionSize,this.opts.transform):t??null}prepareGeometry(e){return e}getGeometryFromBuffer(e){let t=e.value||e;return ArrayBuffer.isView(t)?(0,o.I)(t,{size:this.inputPositionSize,offset:e.offset,stride:e.stride,startIndices:this.data.startIndices}):null}_allocate(e,t){let{attributes:i,buffers:o,_attributeDefs:n,typedArrayManager:r}=this;for(let s in n)if(s in o)r.release(i[s]),i[s]=null;else{let o=n[s];o.copy=t,i[s]=r.allocate(i[s],e,o)}}_forEachGeometry(e,t,i){let{data:n}=this,{iterable:r,objectInfo:s}=(0,o.X)(n,t,i);for(let t of r)s.index++,e(this.getGeometry(t,s),s.index)}_rebuildGeometry(e){if(!this.data)return;let{indexStarts:t,vertexStarts:i,instanceCount:o}=this,{data:n,geometryBuffer:r}=this,{startRow:a=0,endRow:l=1/0}=e||{},c={};if(e||(t=[0],i=[0]),this.normalize||!r)this._forEachGeometry((e,t)=>{let o=e&&this.normalizeGeometry(e);c[t]=o,i[t+1]=i[t]+(o?this.getGeometrySize(o):0)},a,l),o=i[i.length-1];else if(o=(i=n.startIndices)[n.length]||0,ArrayBuffer.isView(r))o=o||r.length/this.positionSize;else if(r instanceof s.h){let e=4*this.positionSize;o=o||r.byteLength/e}else if(r.buffer){let e=r.stride||4*this.positionSize;o=o||r.buffer.byteLength/e}else if(r.value){let e=r.value,t=r.stride/e.BYTES_PER_ELEMENT||this.positionSize;o=o||e.length/t}this._allocate(o,!!e),this.indexStarts=t,this.vertexStarts=i,this.instanceCount=o;let f={},h=(e,n)=>{f.vertexStart=i[n],f.indexStart=t[n],f.geometrySize=(i[n+1]??o)-i[n],f.geometryIndex=n,this.updateGeometryAttributes(e,f)};if(this.normalize||!r)for(let e=a;e<Math.min(l,i.length-1);e++)h(c[e],e);else this._forEachGeometry((e,t)=>{h(e,t)},a,l);this.vertexCount=t[t.length-1]}}},18937(e,t,i){i.d(t,{A:()=>D});var o=i(10032);let n={name:"pathShaderPlugin",injectionTargets:[{name:"DECKGL_FILTER_PATH_COLOR_VERTEX",stage:"vertex",wgsl:{parameters:"color: ptr<function, vec4<f32>>, pathPosition: vec2<f32>, pathLength: f32"}},{name:"DECKGL_FILTER_PATH_COLOR",stage:"fragment",wgsl:{parameters:""}},{name:"DECKGL_PATH_STYLE_COORDINATES",stage:"vertex",wgsl:{parameters:"pathPosition: ptr<function, vec2<f32>>, pathLength: ptr<function, f32>, pathBounds: ptr<function, vec2<f32>>, halfWidth: f32"}},{name:"DECKGL_PATH_STYLE_COLOR",stage:"fragment",wgsl:{parameters:"color: ptr<function, vec4<f32>>, pathPosition: vec2<f32>, pathCoverage: f32"}}]},r=function({vertexEntry:e="@vertex\nfn vertexMain(attributes: Attributes) -> Varyings",vertexSetup:t="",vertexOutput:i="",extraVaryings:o="",fragmentFilter:n="",colorFilter:r=""}={}){return`\
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
  ${o}
  @builtin(position) position: vec4<f32>,
  @location(0) vColor: vec4<f32>,
  @location(1) vCornerOffset: vec2<f32>,
  @location(2) vMiterLength: f32,
  @location(3) vPathPosition: vec2<f32>,
  @location(4) vPathLength: f32,
  @location(5) vJointType: f32,
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

${e} {
  ${t}
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

  var widthPixels =
    clamp(
      project_unit_size_to_pixel(attributes.instanceStrokeWidths * path.widthScale, path.widthUnits),
      path.widthMinPixels,
      path.widthMaxPixels
    ) / 2.0;
  var size = vec3<f32>(widthPixels, widthPixels, 0.0);
  DECKGL_FILTER_SIZE(&size, geometry);
  widthPixels = size.x;

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

  var pathBounds = vec2<f32>(0.0);
#ifdef DASH_ENABLED
  pathBounds = varyings.vPathBounds;
#endif
  var pathPosition = varyings.vPathPosition;
  var pathLength = varyings.vPathLength;
  DECKGL_PATH_STYLE_COORDINATES(
    &pathPosition, &pathLength, &pathBounds,
    select(project_pixel_size_float(widthPixels), widthPixels, path.billboard != 0)
  );
#ifdef DASH_ENABLED
  varyings.vPathBounds = pathBounds;
#endif
  varyings.vPathPosition = pathPosition;
  varyings.vPathLength = pathLength;
  geometry.uv = pathPosition;

  varyings.vColor = vec4<f32>(
    attributes.instanceColors.rgb,
    attributes.instanceColors.a * layer.opacity
  );
  DECKGL_FILTER_PATH_COLOR_VERTEX(&varyings.vColor, varyings.vPathPosition, varyings.vPathLength);
  DECKGL_FILTER_GL_POSITION(&varyings.position, geometry);
  ${i}
  return varyings;
}

@fragment
fn fragmentMain(varyings: Varyings) -> @location(0) vec4<f32> {
  geometry.uv = varyings.vPathPosition;
  fragmentGeometry.uv = geometry.uv;

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
  let pathCoverage = smoothedge(0.0, edgePixels);
  color.a *= pathCoverage;
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
  ${n}
  DECKGL_FILTER_PATH_COLOR();
#ifndef ANTIALIASING
  var color = varyings.vColor;
  let pathCoverage = 1.0;
#endif
  ${r}
  DECKGL_PATH_STYLE_COLOR(&color, varyings.vPathPosition, pathCoverage);
  DECKGL_FILTER_COLOR(&color, fragmentGeometry);
  return deckgl_premultiplied_alpha(color);
}
`}();var s=i(84175),a=i(46487),l=i(83895);let c=`\
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
`,f={name:"path",source:`\
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
`,vs:c,fs:c,uniformTypes:{widthScale:"f32",widthMinPixels:"f32",widthMaxPixels:"f32",jointType:"f32",capType:"f32",miterLimit:"f32",billboard:"f32",widthUnits:"i32"}};var h=i(69502),d=i(52948),p=i(7914),u=i(9350),g=i(88599),P=i(26335),v=i(44941),m=i(12116),y=i(65441);function L(e,t,i,o){let n;if(Array.isArray(e[0])){n=Array(e.length*t);for(let i=0;i<e.length;i++)for(let o=0;o<t;o++)n[i*t+o]=e[i][o]||0}else n=e;return i?(0,m.M)(n,{size:t,gridResolution:i}):o?(0,y.I)(n,{size:t}):n}var S=i(40961);class x extends v.A{constructor(e){super({...e,attributes:{positions:{size:3,padding:18,initialize:!0,type:e.fp64?Float64Array:Float32Array},segmentTypes:{size:1,type:e.isWebGPU?Float32Array:Uint8ClampedArray}}})}get(e){return this.attributes[e]}getPathSegmentIndices(e){let t=this.attributes.segmentTypes,i=this.vertexStarts[e],o=Math.min(this.vertexStarts[e+1]??this.instanceCount,this.instanceCount),n=[];for(let e=i;e<o-1;e++)(4&t[e])==0&&n.push(e);return n.length&&(4&t[i])!=0&&n.unshift(n.pop()),n}getGeometryFromBuffer(e){return this.normalize||this.opts.transform||this.opts.isWebGPU?super.getGeometryFromBuffer(e):null}prepareGeometry(e){let t=this.normalize?L(e,this.inputPositionSize,this.opts.resolution,this.opts.wrapLongitude):e,{projectionTolerance:i,projectionToleranceScale:o,transform:n}=this.opts;if(!i)return t;if(!this.normalize||!n)throw Error("Projection refinement requires normalized, preprojected paths");let r=o||[1,1,1],s=e=>(0,S.A)(e,{size:this.inputPositionSize,targetSize:3,transform:e=>n(Array.from(e)).map((e,t)=>e*r[t]),tolerance:i}).sourcePositions;return A(t)?t.map(s):s(t)}normalizeGeometry(e){return this.normalize&&!this.opts.transform?L(e,this.positionSize,this.opts.resolution,this.opts.wrapLongitude):e}getGeometrySize(e){if(A(e)){let t=0;for(let i of e)t+=this.getGeometrySize(i);return t}let t=this.getPathLength(e);return t<2?0:this.isClosed(e)?t<3?0:t+2:t}updateGeometryAttributes(e,t){if(0!==t.geometrySize)if(e&&A(e))for(let i of e){let e=this.getGeometrySize(i);t.geometrySize=e,this.updateGeometryAttributes(i,t),t.vertexStart+=e}else this._updateSegmentTypes(e,t),this._updatePositions(e,t)}_updateSegmentTypes(e,t){let i=this.attributes.segmentTypes,o=!!e&&this.isClosed(e),{vertexStart:n,geometrySize:r}=t;i.fill(0,n,n+r),o?(i[n]=4,i[n+r-2]=4):(i[n]+=1,i[n+r-2]+=2),i[n+r-1]=4}_updatePositions(e,t){let{positions:i}=this.attributes;if(!i||!e)return;let{vertexStart:o,geometrySize:n}=t,r=[,,,];for(let t=o,s=0;s<n;t++,s++)this.getPointOnPath(e,s,r),i[3*t]=r[0],i[3*t+1]=r[1],i[3*t+2]=r[2]}getPathLength(e){return e.length/this.positionSize}getPointOnPath(e,t,i=[]){let{positionSize:o}=this;t*o>=e.length&&(t+=1-e.length/o);let n=t*o;return i[0]=e[n],i[1]=e[n+1],i[2]=3===o&&e[n+2]||0,i}isClosed(e){if(!this.normalize)return!!this.opts.loop;let{positionSize:t}=this,i=e.length-t;return e[0]===e[i]&&e[1]===e[i+1]&&(2===t||e[2]===e[i+2])}}function A(e){return Array.isArray(e[0])}var E=i(6053);let _=`\
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
`,w=[0,0,0,255],C={widthUnits:"meters",widthScale:{type:"number",min:0,value:1},widthMinPixels:{type:"number",min:0,value:0},widthMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},jointRounded:!1,capRounded:!1,miterLimit:{type:"number",min:0,value:4},antialiasing:!1,billboard:!1,_pathType:null,_projectionTolerance:{type:"number",value:0,min:0},_projectionNoCut:!1,getPath:{type:"accessor",value:e=>e.path},getColor:{type:"accessor",value:w},getWidth:{type:"accessor",value:1},rounded:{deprecatedFor:["jointRounded","capRounded"]}},T={enter:(e,t)=>t.length?t.subarray(t.length-e.length):e};function O(e,t){return e===t||!!(e&&t&&e.length===t.length&&e.every((e,i)=>e===t[i]))}class I extends o.A{getShaders(){let{antialiasing:e}=this.props;return super.getShaders({vs:_,fs:b,source:r,plugins:"webgpu"===this.context.device.type?[n]:[],defines:e?{ANTIALIASING:1}:{},modules:[s.A,a.A,l.Ay,f]})}get wrapLongitude(){return!1}getBounds(){return"webgpu"===this.context.device.type?null:this.getAttributeManager()?.getBounds(["vertexPositions"])}getPathProjectionScale(e){let t=this.props.coordinateSystem;if(!this.getAttributeManager()?.getAttributes().instanceDashOffsets)return null;if(e instanceof h.A&&e.zoom>=12&&"meter-offsets"!==t&&"lnglat-offsets"!==t){let i=d.A.getUniforms({viewport:e,coordinateSystem:t,sourceCrs:this.internalState.sourceCrs,coordinateOrigin:this.props.coordinateOrigin,autoWrapLongitude:this.wrapLongitude});return[e.projectionMode,i.coordinateOrigin[1],i.commonOrigin[1],...i.commonUnitsPerWorldUnit,...i.commonUnitsPerWorldUnit2,i.commonUnitsPerMeter[2]]}let i=function(e){if(e.isGeospatial)return null;let{unitsPerMeter:t}=e.distanceScales;return[t[0],t[1],t[2]]}(e);return i?[e.projectionMode,...i]:[e.projectionMode]}shouldUpdateState(e){let{viewport:t}=this.context;return super.shouldUpdateState(e)||this.state?.subdivisionStep!==this.getSubdivisionStep()||!O(this.state?.pathProjectionScale,this.getPathProjectionScale(t))}initializeState(){let e="webgpu"===this.context.device.type;this.getAttributeManager().addInstanced({...e?{pathPositions:{...this.usePositionTransforms(),size:24,type:"float32",transition:!1,accessor:"getPath",update:this.calculateWebGPUPositions,shaderAttributes:{instanceLeftPositions:{size:3,elementOffset:0},instanceStartPositions:{size:3,elementOffset:3},instanceEndPositions:{size:3,elementOffset:6},instanceRightPositions:{size:3,elementOffset:9},instanceLeftPositions64Low:{size:3,elementOffset:12},instanceStartPositions64Low:{size:3,elementOffset:15},instanceEndPositions64Low:{size:3,elementOffset:18},instanceRightPositions64Low:{size:3,elementOffset:21}},noAlloc:!0}}:{vertexPositions:{...this.usePositionTransforms(),size:3,vertexOffset:1,type:"float64",fp64:this.use64bitPositions(),transition:T,accessor:"getPath",update:this.calculatePositions,noAlloc:!0,shaderAttributes:{instanceLeftPositions:{vertexOffset:0},instanceStartPositions:{vertexOffset:1},instanceEndPositions:{vertexOffset:2},instanceRightPositions:{vertexOffset:3}}}},instanceTypes:{size:1,type:e?"float32":"uint8",update:this.calculateSegmentTypes,noAlloc:!0},instanceStrokeWidths:{transform:null,size:1,accessor:"getWidth",transition:!e&&T,defaultValue:1,bufferGroup:"path-instance-data"},instanceColors:{transform:null,size:this.props.colorFormat.length,type:"unorm8",accessor:"getColor",transition:!e&&T,defaultValue:w,bufferGroup:"path-instance-data"},rowIndexes:{size:1,type:"uint32",accessor:(e,{index:t})=>e&&e.__source?e.__source.index:t,bufferGroup:"path-instance-data"}}),this.setState({pathTesselator:new x({fp64:this.use64bitPositions(),isWebGPU:e}),subdivisionStep:this.getSubdivisionStep(),pathProjectionScale:this.getPathProjectionScale(this.context.viewport)})}updateState(e){super.updateState(e);let{props:t,oldProps:i,changeFlags:o}=e,n=this.getAttributeManager(),r=n.attributes;r.instanceStrokeWidths.settings.transform=t._projectionTolerance?R:null,r.instanceColors.settings.transform=t._projectionTolerance?j:null;let{viewport:s}=this.context,a=this.state.subdivisionStep!==this.getSubdivisionStep(),l=this.getPathProjectionScale(s),c=!O(this.state.pathProjectionScale,l),f=o.updateTriggersChanged&&(o.updateTriggersChanged.all||o.updateTriggersChanged.getPath),h=o.projectionChanged||this.state.preproject&&(!(0,p.b)(t.modelMatrix,i.modelMatrix,1)||!(0,p.b)(t.coordinateOrigin,i.coordinateOrigin,1))||f||t._projectionTolerance!==i._projectionTolerance||t._projectionNoCut!==i._projectionNoCut||t._pathType!==i._pathType||t.positionFormat!==i.positionFormat||t.wrapLongitude!==i.wrapLongitude||a;if(o.dataChanged||h){let{pathTesselator:e}=this.state,i=t.data.attributes||{},r=(0,E.A)(this.state.packedCrs);if(t._projectionTolerance&&(!r||!this.usePositionTransforms().transform||t._pathType||i.getPath&&!ArrayBuffer.isView(i.getPath.value??i.getPath)||Object.keys(i).some(e=>"getPath"!==e)))throw Error("Projection refinement requires linear target units, normalized paths and per-object attributes");e.updateGeometry({data:t.data,geometryBuffer:i.getPath,buffers:i,normalize:!t._pathType,loop:"loop"===t._pathType,getGeometry:t.getPath,transform:this.usePositionTransforms().transform?.bind(this),positionFormat:t.positionFormat,wrapLongitude:t.wrapLongitude&&!this.state.preproject&&this.state.sourceCrs?.signature==="WGS84",resolution:t._projectionNoCut?0:this.getSubdivisionStep(),projectionTolerance:t._projectionTolerance,projectionToleranceScale:r??void 0,dataChanged:h?void 0:o.dataChanged}),this.setState({numInstances:e.instanceCount,startIndices:e.vertexStarts,subdivisionStep:this.getSubdivisionStep(),pathProjectionScale:l}),!o.dataChanged||h?n.invalidateAll():c&&n.invalidate("instanceDashOffsets")}else c&&(this.setState({pathProjectionScale:l}),n.invalidate("instanceDashOffsets"));(o.extensionsChanged||t.antialiasing!==i.antialiasing)&&(this.state.model?.destroy(),this.state.model=this._getModel(),n.invalidateAll())}getPickingInfo(e){let t=super.getPickingInfo(e),{index:i}=t,o=this.props.data;return o[0]&&o[0].__source&&(t.object=o.find(e=>e.__source.index===i)),t}disablePickingIndex(e){let t=this.props.data;if(t[0]&&t[0].__source)for(let i=0;i<t.length;i++)t[i].__source.index===e&&this._disablePickingIndex(i);else super.disablePickingIndex(e)}draw({uniforms:e}){let{jointRounded:t,capRounded:i,billboard:o,miterLimit:n,widthUnits:r,widthScale:s,widthMinPixels:a,widthMaxPixels:l}=this.props,c=this.state.model,f={jointType:Number(t),capType:Number(i),billboard:o,widthUnits:u.p5[r],widthScale:s,miterLimit:n,widthMinPixels:a,widthMaxPixels:l};c.shaderInputs.setProps({path:f}),c.draw(this.context.renderPass)}_getModel(){return new g.A(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new P.V2({topology:"triangle-list",attributes:{indices:new Uint16Array([0,1,2,1,4,2,1,3,4,3,5,4]),positions:{value:new Float32Array([0,0,0,-1,0,1,1,-1,1,1,1,0]),size:2}}}),isInstanced:!0})}calculatePositions(e){let{pathTesselator:t}=this.state;e.startIndices=t.vertexStarts,e.value=t.get("positions")}calculateSegmentTypes(e){let{pathTesselator:t}=this.state;e.startIndices=t.vertexStarts,e.value=t.get("segmentTypes")}calculateWebGPUPositions(e){let{pathTesselator:t}=this.state,i=t.get("positions");if(!i){e.value=null;return}let o=t.instanceCount,n=new Float32Array(24*o),r=[-1,0,1,2];for(let e=0;e<o;e++){let t=24*e;for(let s=0;s<4;s++){let a=e+r[s],l=t+3*s;for(let e=0;e<3;e++){let t=a>=0&&a<o?i[3*a+e]:0,r=Math.fround(t);n[l+e]=r,n[l+e+12]=t-r}}}e.startIndices=t.vertexStarts,e.value=n}}I.defaultProps=C,I.layerName="PathLayer";let D=I;function R(e){if(this.props._projectionTolerance&&"number"!=typeof e)throw Error("Projection refinement requires per-object widths");return e}function j(e){if(this.props._projectionTolerance&&("object"==typeof e?.[0]||e?.length>4))throw Error("Projection refinement requires per-object colors");return this.props._projectionTolerance&&"RGB"===this.props.colorFormat&&e?.length===4?e.slice(0,3):e}},6053(e,t,i){function o(e){if(!e||"projected"!==e.coordinateFrame&&"geocentric"!==e.coordinateFrame)return null;let t=e.xUnit.metersPerUnit,i=e.yUnit.metersPerUnit,o=e.zUnit.metersPerUnit;return"number"!=typeof t||!Number.isFinite(t)||t<=0||"number"!=typeof i||!Number.isFinite(i)||i<=0||"number"!=typeof o||!Number.isFinite(o)||o<=0?null:[t,i,o]}function n({data:e,getIndex:t,dataRange:i,replace:o}){let{startRow:r=0,endRow:s=1/0}=i,a=e.length,l=a,c=a;for(let i=0;i<a;i++){let o=t(e[i]);if(l>i&&o>=r&&(l=i),o>=s){c=i;break}}let f=l,h=c-l!==o.length?e.slice(c):void 0;for(let t=0;t<o.length;t++)e[f++]=o[t];if(h){for(let t=0;t<h.length;t++)e[f++]=h[t];e.length=f}return{startRow:l,endRow:l+o.length}}i.d(t,{A:()=>o,J:()=>n})},12116(e,t,i){function o(e,t,i,n,r=[]){let s,a;if(8&i)s=(n[3]-e[1])/(t[1]-e[1]),a=3;else if(4&i)s=(n[1]-e[1])/(t[1]-e[1]),a=1;else if(2&i)s=(n[2]-e[0])/(t[0]-e[0]),a=2;else{if(!(1&i))return null;s=(n[0]-e[0])/(t[0]-e[0]),a=0}for(let i=0;i<e.length;i++)r[i]=(1&a)===i?n[a]:s*(t[i]-e[i])+e[i];return r}function n(e,t){let i=0;return e[0]<t[0]?i|=1:e[0]>t[2]&&(i|=2),e[1]<t[1]?i|=4:e[1]>t[3]&&(i|=8),i}i.d(t,{w:()=>a,M:()=>s});var r=i(46954);function s(e,t){let i,s,{size:a=2,broken:l=!1,gridResolution:f=10,gridOffset:h=[0,0],startIndex:d=0,endIndex:p=e.length}=t||{},u=(p-d)/a,g=[],P=[g],v=(0,r.ah)(e,0,a,d),m=c(v,f,h,[]),y=[];(0,r.VC)(g,v);for(let t=1;t<u;t++){for(s=n(i=(0,r.ah)(e,t,a,d,i),m);s;){var L,S,x;o(v,i,s,m,y);let e=n(y,m);e&&(o(v,y,e,m,y),s=e),(0,r.VC)(g,y),(0,r.C)(v,y),L=m,S=f,8&(x=s)?(L[1]+=S,L[3]+=S):4&x?(L[1]-=S,L[3]-=S):2&x?(L[0]+=S,L[2]+=S):1&x&&(L[0]-=S,L[2]-=S),l&&g.length>a&&(g=[],P.push(g),(0,r.VC)(g,v)),s=n(i,m)}(0,r.VC)(g,i),(0,r.C)(v,i)}return l?P:P[0]}function a(e,t=null,i){if(!e.length)return[];let{size:o=2,gridResolution:r=10,gridOffset:s=[0,0],edgeTypes:h=!1}=i||{},d=[],p=[{pos:e,types:h?Array(e.length/o).fill(1):null,holes:t||[]}],u=[[],[]],g=[];for(;p.length;){let{pos:e,types:t,holes:i}=p.shift();(function(e,t,i,o){let n=1/0,r=-1/0,s=1/0,a=-1/0;for(let o=0;o<i;o+=t){let t=e[o],i=e[o+1];n=t<n?t:n,r=t>r?t:r,s=i<s?i:s,a=i>a?i:a}o[0][0]=n,o[0][1]=s,o[1][0]=r,o[1][1]=a})(e,o,i[0]||e.length,u),g=c(u[0],r,s,g);let a=n(u[1],g);if(a){let n=l(e,t,o,0,i[0]||e.length,g,a),r={pos:n[0].pos,types:n[0].types,holes:[]},s={pos:n[1].pos,types:n[1].types,holes:[]};p.push(r,s);for(let c=0;c<i.length;c++)(n=l(e,t,o,i[c],i[c+1]||e.length,g,a))[0]&&(r.holes.push(r.pos.length),r.pos=f(r.pos,n[0].pos),h&&(r.types=f(r.types,n[0].types))),n[1]&&(s.holes.push(s.pos.length),s.pos=f(s.pos,n[1].pos),h&&(s.types=f(s.types,n[1].types)))}else{let o={positions:e};h&&(o.edgeTypes=t),i.length&&(o.holeIndices=i),d.push(o)}}return d}function l(e,t,i,n,s,a,l){let c,f,h,d=(s-n)/i,p=[],u=[],g=[],P=[],v=[],m=(0,r.ah)(e,d-1,i,n),y=Math.sign(8&l?m[1]-a[3]:m[0]-a[2]),L=t&&t[d-1],S=0,x=0;for(let s=0;s<d;s++)c=(0,r.ah)(e,s,i,n,c),f=Math.sign(8&l?c[1]-a[3]:c[0]-a[2]),h=t&&t[n/i+s],f&&y&&y!==f&&(o(m,c,l,a,v),(0,r.VC)(p,v)&&g.push(L),(0,r.VC)(u,v)&&P.push(L)),f<=0?((0,r.VC)(p,c)&&g.push(h),S-=f):g.length&&(g[g.length-1]=0),f>=0?((0,r.VC)(u,c)&&P.push(h),x+=f):P.length&&(P[P.length-1]=0),(0,r.C)(m,c),y=f,L=h;return[S?{pos:p,types:t&&g}:null,x?{pos:u,types:t&&P}:null]}function c(e,t,i,o){let n=Math.floor((e[0]-i[0])/t)*t+i[0],r=Math.floor((e[1]-i[1])/t)*t+i[1];return o[0]=n,o[1]=r,o[2]=n+t,o[3]=r+t,o}function f(e,t){for(let i=0;i<t.length;i++)e.push(t[i]);return e}},65441(e,t,i){i.d(t,{E:()=>s,I:()=>r});var o=i(12116),n=i(46954);function r(e,t){let{size:i=2,startIndex:n=0,endIndex:r=e.length,normalize:s=!0}=t||{},c=e.slice(n,r);a(c,i,0,r-n);let f=(0,o.M)(c,{size:i,broken:!0,gridResolution:360,gridOffset:[-180,-180]});if(s)for(let e of f)l(e,i);return f}function s(e,t=null,i){let{size:r=2,normalize:c=!0,edgeTypes:f=!1}=i||{};t=t||[];let h=[],d=[],p=0,u=0;for(let o=0;o<=t.length;o++){let s=t[o]||e.length,l=u,c=function(e,t,i,o){let n=-1,r=-1;for(let s=i+1;s<o;s+=t){let t=Math.abs(e[s]);t>n&&(n=t,r=s-1)}return r}(e,r,p,s);for(let t=c;t<s;t++)h[u++]=e[t];for(let t=p;t<c;t++)h[u++]=e[t];a(h,r,l,u),function(e,t,i,o,r=85.051129){let s=e[i],a=e[o-t];if(Math.abs(s-a)>180){let o=(0,n.ah)(e,0,t,i);o[0]+=360*Math.round((a-s)/360),(0,n.VC)(e,o),o[1]=Math.sign(o[1])*r,(0,n.VC)(e,o),o[0]=s,(0,n.VC)(e,o)}}(h,r,l,u,i?.maxLatitude),p=s,d[o]=u}d.pop();let g=(0,o.w)(h,d,{size:r,gridResolution:360,gridOffset:[-180,-180],edgeTypes:f});if(c)for(let e of g)l(e.positions,r);return g}function a(e,t,i,o){let n,r=e[0];for(let s=i;s<o;s+=t){let t=(n=e[s])-r;(t>180||t<-180)&&(n-=360*Math.round(t/360)),e[s]=r=n}}function l(e,t){let i,o=e.length/t;for(let n=0;n<o&&((i=e[n*t])+180)%360==0;n++);let n=-(360*Math.round(i/360));if(0!==n)for(let i=0;i<o;i++)e[i*t]+=n}},40961(e,t,i){i.d(t,{A:()=>o});function o(e,t){let{transform:i,tolerance:o,createEdgeSampler:n,size:r=2,targetSize:s=r,maxSegmentLength:a=1/0,maxDepth:l=16,maxVertices:c=65536}=t;if("function"!=typeof i||void 0!==n&&"function"!=typeof n||!Number.isFinite(o)||o<=0||2!==r&&3!==r||2!==s&&3!==s||!(a>0)||!Number.isFinite(a)&&a!==1/0||!Number.isInteger(l)||l<0||l>30||!Number.isSafeInteger(c)||c<1||c>0xffffffff||!Number.isSafeInteger(e.length)||e.length<0||e.length%r!=0)throw RangeError("Invalid polyline subdivision options or input length");let f=e.length/r;if(f>c)throw RangeError("Polyline exceeds maxVertices");let h=[];for(let t=0;t<e.length;t++){let i=e[t];if(!Number.isFinite(i))throw RangeError("Source positions must be finite");h.push(i)}let d=[],p=[],u=[],g=[];function P(e,t){let o=i(e.slice());if(!o||o.length!==s)throw RangeError("Transform must return a position with targetSize components");let n=Array.from(o);if(!n.every(Number.isFinite))throw RangeError("Transform returned nonfinite coordinates");return{source:e,target:n,fraction:t}}function v(e,t){if(u.length>=c)throw RangeError("Polyline subdivision exceeded maxVertices");for(let t of e.source)d.push(t);for(let t of e.target)p.push(t);u.push(t),g.push(e.fraction)}function m(e,t){let i=e.sample(t);if(!i||i.length!==r)throw RangeError("Invalid source-edge sample size");let o=Array.from(i);if(!o.every(Number.isFinite))throw RangeError("Nonfinite source-edge sample");return o}if(f){let e=P(h.slice(0,r),0);v(e,0);for(let t=1;t<f;t++){let i=P(h.slice(t*r,(t+1)*r),1),s={...e,fraction:0},c=n?.(s.source.slice(),i.source.slice(),t-1);if(n){if(!c||"function"!=typeof c.sample||!Number.isFinite(c.length)||c.length<0)throw RangeError("Invalid source-edge sampler");for(let e of[s,i])if(m(c,e.fraction).some((t,i)=>t!==e.source[i]))throw RangeError("Source-edge sampler endpoints must match input")}!function e(t,i,n,r,s){let c,f=0;for(let e of[.25,.5,.75]){let o=function(e,t,i,o){let n=e.fraction*(1-i)+t.fraction*i;return P(o?m(o,n):e.source.map((e,o)=>e*(1-i)+t.source[o]*i),n)}(t,i,e,s);.5===e&&(c=o),f=Math.max(f,Math.hypot(...o.target.map((o,n)=>o-(t.target[n]*(1-e)+i.target[n]*e))))}let h=s?s.length*(i.fraction-t.fraction):Math.hypot(...t.source.map((e,t)=>e-i.source[t]));if(f<=o&&h<=a)return void v(i,n);if(r>=l)throw RangeError(`Polyline subdivision exceeded maxDepth on input edge ${n}`);e(t,c,n,r+1,s),e(c,i,n,r+1,s)}(s,i,t-1,0,c),e=i}}return{sourcePositions:new Float64Array(d),positions:new Float64Array(p),segmentIndices:new Uint32Array(u),segmentFractions:new Float64Array(g)}}},46954(e,t,i){function o(e,t){let i=t.length,o=e.length;if(o>0){let n=!0;for(let r=0;r<i;r++)if(e[o-i+r]!==t[r]){n=!1;break}if(n)return!1}for(let n=0;n<i;n++)e[o+n]=t[n];return!0}function n(e,t){let i=t.length;for(let o=0;o<i;o++)e[o]=t[o]}function r(e,t,i,o,n=[]){let s=o+t*i;for(let t=0;t<i;t++)n[t]=e[s+t];return n}i.d(t,{C:()=>n,VC:()=>o,ah:()=>r})}}]);