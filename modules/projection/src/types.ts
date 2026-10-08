// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ProjectionTransformOptions} from './experimental/typescript-projection';
import type {ProjectionPlugin} from './experimental/types';
import type {ProjectionDescriptor} from './experimental/projection-descriptor';
import type {ProjectionCoordinate, ProjectionOutput} from './experimental/scalar-output';
import type {ProjectionArray} from './experimental/typescript-projection';

type Registration = ProjectionPlugin | ProjectionDescriptor;

/** Reusable projection algorithms, CRS readers, aliases and grids. */
export type ProjectionEngineOptions<P extends Registration = ProjectionPlugin> = Omit<
  ProjectionTransformOptions<P>,
  'from' | 'to'
>;

/** CRS pair and behavior for an independent transform. */
export type CreateProjectionOptions = Pick<
  ProjectionTransformOptions,
  'from' | 'to' | 'enforceAxis' | 'mode'
>;

/** Backend-independent factory; import from the runtime-free /types entry point. */
export interface ProjectionEngine {
  createProjection(options?: CreateProjectionOptions): Projection;
  createProjectionAsync(options?: CreateProjectionOptions): Promise<PreparedProjection>;
}

/** A CRS-pair transform. Sync methods never load algorithms; preload deferred transforms first. */
export interface Projection {
  readonly lossy?: boolean;
  preload(): Promise<unknown>;
  project(coordinate: readonly number[]): number[] | Promise<number[]>;
  unproject(coordinate: readonly number[]): number[] | Promise<number[]>;
  projectTo<T extends ProjectionOutput>(
    coordinate: ProjectionCoordinate,
    output: T
  ): T | Promise<T>;
  unprojectTo<T extends ProjectionOutput>(
    coordinate: ProjectionCoordinate,
    output: T
  ): T | Promise<T>;
  projectFlat<T extends ProjectionArray>(coordinates: T, dimension?: number): T | Promise<T>;
  unprojectFlat<T extends ProjectionArray>(coordinates: T, dimension?: number): T | Promise<T>;
  projectSync(coordinate: readonly number[]): number[];
  unprojectSync(coordinate: readonly number[]): number[];
  projectToSync<T extends ProjectionOutput>(coordinate: ProjectionCoordinate, output: T): T;
  unprojectToSync<T extends ProjectionOutput>(coordinate: ProjectionCoordinate, output: T): T;
  projectFlatSync<T extends ProjectionArray>(coordinates: T, dimension?: number): T;
  unprojectFlatSync<T extends ProjectionArray>(coordinates: T, dimension?: number): T;
}

/** A prepared transform whose ordinary coordinate methods are synchronous too. */
export interface PreparedProjection extends Projection {
  project(coordinate: readonly number[]): number[];
  unproject(coordinate: readonly number[]): number[];
  projectTo<T extends ProjectionOutput>(coordinate: ProjectionCoordinate, output: T): T;
  unprojectTo<T extends ProjectionOutput>(coordinate: ProjectionCoordinate, output: T): T;
  projectFlat<T extends ProjectionArray>(coordinates: T, dimension?: number): T;
  unprojectFlat<T extends ProjectionArray>(coordinates: T, dimension?: number): T;
}

export type {ProjectionCoordinate, ProjectionOutput, ProjectionArray};
export type {ProjectionTransformOptions};
export type {ProjectionPlugin, ProjectionPoint} from './experimental/types';
export type {ProjectionDescriptor} from './experimental/projection-descriptor';
