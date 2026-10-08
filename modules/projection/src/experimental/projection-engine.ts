// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {ProjectionTransform} from './typescript-projection';
import type {ProjectionEngine, ProjectionEngineOptions, CreateProjectionOptions} from '../types';
import type {ProjectionPlugin} from './types';
import type {ProjectionDescriptor} from './projection-descriptor';

type Registration = ProjectionPlugin | ProjectionDescriptor;

/** A reusable factory for independent coordinate transforms. */
export class ConfigurableProjectionEngine<P extends Registration = ProjectionPlugin>
  implements ProjectionEngine
{
  protected readonly options: ProjectionEngineOptions<P>;

  constructor(options: ProjectionEngineOptions<P> = {}) {
    this.options = snapshotEngineOptions(options);
  }

  /** Compile a CRS pair. Lazy descriptors remain unloaded until the transform is used. */
  createProjection(options: CreateProjectionOptions = {}): ProjectionTransform<P> {
    return new ProjectionTransform<P>({...this.options, ...options});
  }

  /** Load only the algorithms required by this CRS pair and return a synchronous transform. */
  async createProjectionAsync(options: CreateProjectionOptions = {}): Promise<ProjectionTransform> {
    return ProjectionTransform.create({...this.options, ...options});
  }
}

/** Create an engine with an explicit, tree-shakeable set of plugins and readers. */
export function createProjectionEngine<P extends Registration = ProjectionPlugin>(
  options: ProjectionEngineOptions<P> = {}
): ConfigurableProjectionEngine<P> {
  return new ConfigurableProjectionEngine(options);
}

/** Copy registration containers while retaining owned plugin and grid data. */
export function snapshotEngineOptions<P extends Registration>(
  options: ProjectionEngineOptions<P>
): ProjectionEngineOptions<P> {
  return {
    ...options,
    projections: options.projections && [...options.projections],
    parsers: options.parsers && [...options.parsers],
    datumCatalogs: options.datumCatalogs && [...options.datumCatalogs],
    aliases: options.aliases && JSON.parse(JSON.stringify(options.aliases)),
    datumGrids: options.datumGrids && {...options.datumGrids},
    verticalGrids: options.verticalGrids && {...options.verticalGrids}
  };
}
