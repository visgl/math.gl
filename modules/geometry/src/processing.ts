// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export * from './utils';
export {unpackIndexedGeometry} from './lib/geometry-utils';
export {composeAttributeProvenance} from './utils/compose-attribute-provenance';
export {qualifySurfaceTransition} from './utils/qualify-surface-transition';
export type {SurfaceTransitionQualification} from './utils/qualify-surface-transition';
export {projectBounds} from './utils/project-bounds';
export type {
  ProjectionSourceBounds,
  ProjectBoundsOptions,
  ProjectedBoundsResult
} from './utils/project-bounds';
export {projectTextureCoordinates} from './utils/project-texture-coordinates';
export type {ProjectTextureCoordinatesOptions} from './utils/project-texture-coordinates';

export type {GeometryAttribute as UtilityGeometryAttribute} from './utils/geometry';

export {anyBoundsOverlap, type Bounded} from './utils/bounds-overlap';
export {triangulateDelaunay} from './utils/triangulate-delaunay';
