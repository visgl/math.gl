// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export {Ellipsoid} from '../ellipsoid';
export {EllipsoidTangentPlane} from '../ellipsoid-tangent-plane';
export {isWGS84} from '../type-utils';
export type {SpheroidParameters} from '@math.gl/core/types';
export type {TangentPlaneProjectionMode, TangentPlaneProjection} from '../ellipsoid-tangent-plane';

export {EllipsoidMetrics} from '../ellipsoid-metrics';
export type {AuxiliaryLatitude} from '../ellipsoid-metrics';
export {TriaxialEllipsoid} from '../triaxial';
export type {
  TriaxialCoordinates,
  TriaxialParameters,
  CartesianGeodesicState,
  TriaxialGeodesicLine
} from '../triaxial';
