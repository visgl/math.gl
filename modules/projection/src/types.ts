// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  ProjectionTransform,
  ProjectionTransformOptions
} from './experimental/typescript-projection';
import type {ProjectionPlugin} from './experimental/types';
import type {ProjectionDescriptor} from './experimental/projection-descriptor';

type Registration = ProjectionPlugin | ProjectionDescriptor;

/** Reusable projection algorithms, CRS readers, aliases and grids. */
export type ProjectionEngineOptions<P extends Registration = ProjectionPlugin> = Omit<
  ProjectionTransformOptions<P>,
  'from' | 'to'
>;

/** CRS pair and behavior for a single independent transform. */
export type CreateProjectionOptions = Pick<
  ProjectionTransformOptions,
  'from' | 'to' | 'enforceAxis' | 'mode'
>;

/** Backend contract. Import with `import type` from @math.gl/projection/types. */
export interface ProjectionEngine<P extends Registration = ProjectionPlugin> {
  createProjection(
    options?: CreateProjectionOptions
  ): ProjectionInstance<P> | ProjectionInstance<ProjectionDescriptor>;
  createProjectionAsync(options?: CreateProjectionOptions): Promise<ProjectionInstance>;
}

/** Structural transform contract, with no dependency on a concrete class's private state. */
export type ProjectionInstance<P extends Registration = ProjectionPlugin> = Pick<
  ProjectionTransform<P>,
  keyof ProjectionTransform<P>
>;

export type {ProjectionTransform, ProjectionTransformOptions};
export type {ProjectionPlugin, ProjectionPoint} from './experimental/types';
export type {ProjectionDescriptor} from './experimental/projection-descriptor';
