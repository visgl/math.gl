// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {INTERSECTION} from './constants';

export {AxisAlignedBoundingBox} from './lib/bounding-volumes/axis-aligned-bounding-box';
export {BoundingSphere} from './lib/bounding-volumes/bounding-sphere';
export {OrientedBoundingBox} from './lib/bounding-volumes/oriented-bounding-box';
export {CullingVolume} from './lib/culling-volume';
export {Plane} from './lib/plane';
export {Ray} from './lib/ray';

export type {ImplicitShape, RayIntersection} from './lib/shapes/implicit-shape';
export {BoxShape} from './lib/shapes/box-shape';
export type {BoxShapeProps} from './lib/shapes/box-shape';
export {CapsuleShape} from './lib/shapes/capsule-shape';
export type {CapsuleShapeProps} from './lib/shapes/capsule-shape';
export {CylinderShape} from './lib/shapes/cylinder-shape';
export type {CylinderShapeProps} from './lib/shapes/cylinder-shape';
export {PlaneShape} from './lib/shapes/plane-shape';
export type {PlaneShapeProps} from './lib/shapes/plane-shape';
export {SphereShape} from './lib/shapes/sphere-shape';
export type {SphereShapeProps} from './lib/shapes/sphere-shape';

export {PerspectiveOffCenterFrustum as _PerspectiveOffCenterFrustum} from './lib/perspective-off-center-frustum';
export {PerspectiveFrustum as _PerspectiveFrustum} from './lib/perspective-frustum';

export {makeBoundingSphereFromPoints} from './lib/algorithms/bounding-sphere-from-points';
export {
  makeAxisAlignedBoundingBoxFromPoints,
  makeOrientedBoundingBoxFromPoints
} from './lib/algorithms/bounding-box-from-points';
export {computeEigenDecomposition} from './lib/algorithms/compute-eigen-decomposition';
