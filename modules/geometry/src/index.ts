// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export {Geometry} from './lib/geometry';
export type {
  GeometryProps,
  GeometryAttribute,
  GeometryAttributeInput,
  GeometryAttributes,
  PrimitiveTopology
} from './lib/geometry';
export {HingeTree} from './lib/hinge-tree';
export type {HingePanel} from './lib/hinge-tree';

export {unpackIndexedGeometry} from './lib/geometry-utils';

export {BoxGeometry, CubeGeometry} from './geometries/box-geometry';
export type {BoxGeometryProps, CubeGeometryProps} from './geometries/box-geometry';
export {CapsuleGeometry} from './geometries/capsule-geometry';
export type {CapsuleGeometryProps} from './geometries/capsule-geometry';
export {CylinderGeometry, ConeGeometry} from './geometries/cylinder-geometry';
export type {CylinderGeometryProps, ConeGeometryProps} from './geometries/cylinder-geometry';
export {PlaneGeometry} from './geometries/plane-geometry';
export type {PlaneGeometryProps} from './geometries/plane-geometry';
export {SphereGeometry} from './geometries/sphere-geometry';
export type {SphereGeometryProps} from './geometries/sphere-geometry';
export {TruncatedConeGeometry} from './geometries/truncated-cone-geometry';
export type {TruncatedConeGeometryProps} from './geometries/truncated-cone-geometry';
export {IcoSphereGeometry} from './geometries/ico-sphere-geometry';
export type {IcoSphereGeometryProps} from './geometries/ico-sphere-geometry';

export {PrismGeometry} from './geometries/prism-geometry';
export type {PrismGeometryProps} from './geometries/prism-geometry';

export {RingGeometry} from './geometries/ring-geometry';
export type {RingGeometryProps} from './geometries/ring-geometry';

// Public named exports. Implementations remain in independently tree-shakable files.
export {ParametricGeometry, TorusGeometry, LatheGeometry} from './parametric';
export type {
  ParametricGeometryProps,
  SurfaceSampler,
  TorusGeometryProps,
  LatheGeometryProps
} from './parametric';
export {
  GL,
  GL_TYPE,
  GL_PRIMITIVE,
  GL_PRIMITIVE_MODE,
  GLType,
  isGeometry,
  makeAttributeIterator,
  makePrimitiveIterator,
  computeVertexNormals,
  encodeRGB565,
  decodeRGB565,
  concatTypedArrays,
  octEncodeInRange,
  octEncode,
  octEncodeToVector4,
  octDecodeInRange,
  octDecode,
  octDecodeFromVector4,
  octPackFloat,
  octEncodeFloat,
  octDecodeFloat,
  octPack,
  octUnpack,
  compressTextureCoordinates,
  decompressTextureCoordinates,
  zigZagDeltaDecode,
  emod,
  transformGeometry,
  mergeGeometries,
  weldGeometry,
  getDegenerateTriangles,
  interpolatePackedAttributes
} from './utils/index';
export type {
  TypedArray,
  TypedArrayConstructor,
  Primitive,
  WeldGeometryOptions,
  WeldGeometryResult,
  PackedAttributeType,
  PackedAttributeInterpolation,
  PackedAttribute,
  AttributeInterpolationProvenance,
  PackedAttributeInterpolationOptions
} from './utils/index';
export {
  Curve,
  LineCurve,
  QuadraticBezierCurve,
  CubicBezierCurve,
  HermiteCurve,
  CatmullRomCurve,
  CurveArcLength
} from './curves/index';
export type {CurvePoint, CatmullRomCurveOptions} from './curves/index';
export {
  Polygon,
  getPolygonSignedArea,
  getPolygonWindingDirection,
  forEachSegmentInPolygon,
  modifyPolygonWindingDirection,
  earcut,
  clipPolygon,
  clipPolyline,
  cutPolygonByGrid,
  cutPolylineByGrid,
  cutPolylineByMercatorBounds,
  cutPolygonByMercatorBounds,
  subdividePolyline,
  subdivideTriangleMesh
} from './polygon/index';
export type {
  PolygonWinding,
  WindingDirection,
  SubdividePolylineOptions,
  SubdividedPolyline,
  PolylineEdgeSampler,
  TriangleMesh,
  SubdivideTriangleMeshOptions,
  SubdividedTriangleMesh
} from './polygon/index';
export {
  AxisAlignedBoundingBox,
  BoundingSphere,
  OrientedBoundingBox,
  CullingVolume,
  Plane,
  Ray,
  BoxShape,
  CapsuleShape,
  CylinderShape,
  PlaneShape,
  SphereShape,
  _PerspectiveOffCenterFrustum,
  _PerspectiveFrustum,
  makeBoundingSphereFromPoints,
  makeAxisAlignedBoundingBoxFromPoints,
  makeOrientedBoundingBoxFromPoints,
  computeEigenDecomposition,
  intersectRayBounds,
  intersectRayTriangle,
  getClosestPointOnTriangle,
  intersectOrientedBoxes2D,
  getOrientedBoundingBoxQuaternion,
  makeOrientedBoundingBoxFromQuaternion
} from './culling/index';
export type {
  CullingResult,
  ImplicitShape,
  RayIntersection,
  BoxShapeProps,
  CapsuleShapeProps,
  CylinderShapeProps,
  PlaneShapeProps,
  SphereShapeProps,
  QueryPoint,
  TriangleRayHit,
  OrientedBox2D
} from './culling/index';
export {
  validateQueryPoint,
  validateQueryDistance,
  normalizeQueryDirection,
  getClosestPointsOnSegments,
  getClosestPointsSegmentTriangle
} from './culling/queries';
export type {SegmentClosestPoints, SegmentTriangleClosestPoints} from './culling/queries';
export {BoxIndex, PointIndex, TriangleBVH} from './spatial-index/index';
export type {
  BoxIndexOptions,
  NearestIndexOptions,
  NearestIndexResult,
  RayIndexOptions,
  IndexQueryBudget,
  IndexQueryResult,
  SearchIndexOptions,
  TriangleBVHOptions,
  TriangleQueryResult,
  TriangleRayResult,
  TriangleRayOptions,
  TriangleNearestOptions,
  TriangleSegmentResult
} from './spatial-index/index';

export type {
  Geometry as UtilityGeometry,
  GeometryAttribute as UtilityGeometryAttribute
} from './utils/geometry';

export {clipTriangleMesh} from './polygon/clip-triangle-mesh';
export type {
  MeshClipRegion,
  ClipTriangleMeshOptions,
  ClippedTriangleMesh
} from './polygon/clip-triangle-mesh';

export {composeAttributeProvenance} from './utils/compose-attribute-provenance';
export {qualifySurfaceTransition} from './utils/qualify-surface-transition';
export type {SurfaceTransitionQualification} from './utils/qualify-surface-transition';
