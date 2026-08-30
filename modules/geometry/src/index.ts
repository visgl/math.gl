// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {Geometry} from './lib/geometry';
export type {
  GeometryProps,
  GeometryAttribute,
  GeometryAttributeInput,
  GeometryAttributes,
  PrimitiveTopology
} from './lib/geometry';
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
