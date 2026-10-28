// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ProjectionEngineOptions} from '../types';
import type {ProjectionPlugin} from './types';
import type {ProjectionDescriptor} from './projection-descriptor';
type Registration = ProjectionPlugin | ProjectionDescriptor;

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
