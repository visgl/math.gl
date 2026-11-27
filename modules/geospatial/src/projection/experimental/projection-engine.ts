// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {resolveCRSDescriptor} from './crs-descriptor';
import {hasCRSOverrides, snapshotEngineOptions} from './engine-options';
import {prepareEngineOptions, prepareCRSInput} from './crs/resolve';
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
      this.useDefinitionSignature,
      this.options.resolver ? prepareCRSInput : undefined
    );
  }

  /** Compile a CRS pair. Lazy descriptors remain unloaded until the transform is used. */
  createProjection(options: CreateProjectionOptions = {}): ProjectionTransform<P> {
    return new ProjectionTransform<P>({...this.options, ...options});
  }

  /** Load only the algorithms required by this CRS pair and return a synchronous transform. */
  async createProjectionAsync(options: CreateProjectionOptions = {}): Promise<ProjectionTransform> {
    const config = {...this.options, ...options};
    return ProjectionTransform.create(
      config.resolver ? await prepareEngineOptions(config) : config
    );
  }
}

/** Create an engine with an explicit, tree-shakeable set of plugins and readers. */
export function createProjectionEngine<P extends Registration = ProjectionPlugin>(
  options: ProjectionEngineOptions<P> = {}
): ConfigurableProjectionEngine<P> {
  return new ConfigurableProjectionEngine(options);
}

export {hasCRSOverrides} from './engine-options';
