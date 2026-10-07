// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import datums from './experimental/crs/datum-table';
import type {DatumCatalogPlugin} from './experimental/crs/types';

/** Complete regional datum catalogue. WGS84 and NAD83 are provided by the engine. */
export const datumCatalog: DatumCatalogPlugin = Object.freeze({
  name: 'regional-datums',
  datums: Object.freeze(datums)
});

export type {DatumDefinition, DatumCatalogPlugin} from './experimental/crs/types';
