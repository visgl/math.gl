// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {NormalizedCRS} from './experimental/crs/types';

/** Publisher-owned identity for an algorithm's coordinate semantics, not its display name. */
export type ProjectionAlgorithmIdentity = {
  readonly id: string;
  /** Increment when equations, defaults, wrapping, domain or height behavior change. */
  readonly version: number;
};

/** Resolved execution metadata without callbacks or borrowed grid payloads. */
export type ProjectionCRSDescription = Omit<NormalizedCRS, 'datum' | 'parameters'> & {
  /** PROJ flags have null values, preserving presence through JSON serialization. */
  readonly parameters: Readonly<Record<string, string | null>>;
  readonly algorithm?: ProjectionAlgorithmIdentity;
  readonly datum: {
    readonly ellipsoid: NormalizedCRS['ellipsoid'];
    readonly towgs84?: readonly number[];
    readonly grids?: readonly {
      readonly name: string;
      readonly optional: boolean;
      readonly loaded: boolean;
    }[];
  };
};

/** Ordered scalar stages. Parameters and units are resolved in source/target CRS metadata. */
export type ProjectionTransformStage =
  | 'input-axis'
  | 'discard-height'
  | 'input-scale'
  | 'source-inverse'
  | 'input-height-scale'
  | 'geographic-domain-check'
  | 'source-prime-meridian'
  | 'source-vertical-grid'
  | 'datum'
  | 'target-vertical-grid'
  | 'target-prime-meridian'
  | 'longitude-wrap'
  | 'target-forward'
  | 'output-scale'
  | 'output-height-scale'
  | 'restore-height'
  | 'output-axis';

export type ProjectionDirectionDescription = {
  readonly inputAxis: string;
  readonly outputAxis: string;
  readonly requiresInputZ: boolean;
  readonly geocentricOutput: boolean;
  readonly stages: readonly ProjectionTransformStage[];
};

/** Versioned math.gl pipeline semantics; a capability description, not an accuracy guarantee. */
export type ProjectionTransformDescription = {
  readonly version: 1;
  readonly source: ProjectionCRSDescription;
  readonly target: ProjectionCRSDescription;
  readonly forward: ProjectionDirectionDescription;
  readonly inverse: ProjectionDirectionDescription;
  readonly lossy: boolean;
  /** False when algorithm or resource semantics are not fully identified. */
  readonly complete: boolean;
  readonly opaqueReasons: readonly ('source-algorithm' | 'target-algorithm' | 'grid-resource')[];
};
