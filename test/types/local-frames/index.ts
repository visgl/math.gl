// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {Vector2, Vector3, Matrix4, Quaternion} from '@math.gl/core';
import {
  Ellipsoid,
  LocalReferenceFrame,
  EllipsoidTangentPlane,
  type LocalReferenceFrameOptions,
  type HeadingPitchRoll,
  type TangentPlaneProjection,
  type TangentPlaneProjectionMode
} from '@math.gl/geospatial';
import {LocalReferenceFrame as RootFrame} from '@math.gl/geospatial';
const options: LocalReferenceFrameOptions = {
  ellipsoid: Ellipsoid.WGS84,
  axes: ['north', 'east', 'down'] as const
};
const frame: RootFrame = new LocalReferenceFrame(new Float64Array([6378137, 0, 0]), options);
const v: Vector3 = frame.localToFixedPoint(new Float32Array([1, 2, 3]), new Vector3());
frame.fixedToLocalPoint(v, v);
frame.localToFixedVector(v, v);
frame.fixedToLocalVector(v, v);
const pose: HeadingPitchRoll = {heading: 0.2, pitch: 0.3, roll: 0.4};
const matrix: Matrix4 = frame.headingPitchRollToFixedFrame(pose, new Matrix4());
const quaternion: Quaternion = frame.headingPitchRollQuaternion(pose, new Quaternion());
const optional: Quaternion | undefined = frame.velocityQuaternion(v, quaternion);
const extracted: HeadingPitchRoll = frame.fixedFrameToHeadingPitchRoll(matrix);
const inverse: Matrix4 = frame.fixedToLocalMatrix;
const plane = new EllipsoidTangentPlane(new Float64Array([6378137, 0, 0]));
const mode: TangentPlaneProjectionMode = 'radial';
const surface: Vector3 | undefined = plane.projectPointOntoEllipsoid(
  new Float64Array([1, 2]),
  mode,
  v
);
const point: Vector2 = plane.projectPointToNearestOnPlane(v, new Vector2());
const radial: Vector2 | undefined = plane.projectPointRadiallyOntoPlane(v, point);
const packed: TangentPlaneProjection = plane.projectPointsFlat(
  new Float64Array([1, 2, 3]),
  mode,
  new Float64Array(2)
);
// @ts-expect-error Axis names are geographic directions.
new LocalReferenceFrame([1, 2, 3], {axes: ['east', 'north', 'vertical']});
// @ts-expect-error Quaternion is not a point output.
frame.localToFixedPoint([1, 2, 3], new Quaternion());
// @ts-expect-error Packed outputs require Float64 storage.
plane.projectPointsFlat(new Float32Array([1, 2, 3]), mode, new Float32Array(2));
void [optional, extracted, inverse, surface, radial, packed];

const batch: Float64Array = frame.localToFixedPointsFlat(new Float32Array([1, 2, 3]));
frame.fixedToLocalPointsFlat(batch, batch);
frame.localToFixedVectorsFlat(batch, batch);
frame.fixedToLocalVectorsFlat(batch, batch);
// @ts-expect-error Packed frame outputs require Float64 storage.
frame.localToFixedPointsFlat(batch, new Float32Array(3));

import {eastNorthUpToFixedFrame, localFrameToFixedFrame} from '@math.gl/geospatial';
import {
  getOrientedBoundingBoxQuaternion,
  makeOrientedBoundingBoxFromQuaternion
} from '@math.gl/geometry/culling';
const enu: Matrix4 = eastNorthUpToFixedFrame(Ellipsoid.WGS84, [6378137, 0, 0]);
const reused: number[] = localFrameToFixedFrame(
  Ellipsoid.WGS84,
  'north',
  'east',
  'down',
  [6378137, 0, 0],
  []
);
const box = makeOrientedBoundingBoxFromQuaternion([1, 2, 3], [4, 5, 6], [0, 0, 0, 1]);
const orientation: Quaternion = getOrientedBoundingBoxQuaternion(box);
void [enu, reused, orientation];
// @ts-expect-error Frame methods were replaced by standalone functions.
Ellipsoid.WGS84.eastNorthUpToFixedFrame([6378137, 0, 0]);
// @ts-expect-error Quaternion access is now a standalone function.
box.quaternion;
