// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {resolveCRSDescriptor} from './crs-descriptor';
import {prepareEngineOptions} from './crs/resolve';
import type {TypeScriptCRSInput} from './crs/spatial-reference';
import {ProjectionTransform} from './typescript-projection';
import type {CRSEngine, CRSDescriptor, GetCRSOptions} from './types';
import type {ProjectionEngineOptions, CreateProjectionOptions} from '../types';
import type {ProjectionPlugin} from './types';
import type {ProjectionDescriptor} from './projection-descriptor';

type Registration = ProjectionPlugin | ProjectionDescriptor;

/** A reusable factory for independent coordinate transforms. */
export class ConfigurableProjectionEngine<P extends Registration = ProjectionPlugin>
  implements CRSEngine
{
  protected readonly options: ProjectionEngineOptions<P>;
  protected useDefinitionSignature: boolean;

  constructor(options: ProjectionEngineOptions<P> = {}) {
    this.options = snapshotEngineOptions(options);
    this.useDefinitionSignature = !hasCRSOverrides(options);
  }

  /** Resolve a CRS and load only its required algorithms before exposing sync conversions. */
  getCRS(definition: TypeScriptCRSInput, options: GetCRSOptions = {}): Promise<CRSDescriptor> {
    return resolveCRSDescriptor(
      this,
      definition,
      this.options,
      options,
      this.useDefinitionSignature
    );
  }

  /** Compile a CRS pair. Lazy descriptors remain unloaded until the transform is used. */
  createProjection(options: CreateProjectionOptions = {}): ProjectionTransform<P> {
    return new ProjectionTransform<P>({...this.options, ...options});
  }

  /** Load only the algorithms required by this CRS pair and return a synchronous transform. */
  async createProjectionAsync(options: CreateProjectionOptions = {}): Promise<ProjectionTransform> {
    return ProjectionTransform.create(await prepareEngineOptions({...this.options, ...options}));
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

/** Custom execution registrations can reinterpret the same input definition. */
export function hasCRSOverrides(options: ProjectionEngineOptions<Registration>): boolean {
  return Boolean(
    options.projections ||
      options.parsers ||
      options.datumCatalogs ||
      options.aliases ||
      options.datumGrids ||
      options.verticalGrids ||
      options.resolver
  );
}
