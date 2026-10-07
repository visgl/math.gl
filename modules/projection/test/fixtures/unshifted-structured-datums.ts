// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {DatumCatalogPlugin} from '@math.gl/projection/core';
import names from './unshifted-structured-datum-names.json';

// Historical equation-only fixtures used these unmatched datum labels with an
// explicit ellipsoid and no shift. This test-only catalogue preserves that intent;
// it does not qualify these real-world reference systems for datum conversion.
export const unshiftedStructuredDatums: DatumCatalogPlugin = {
  name: 'fixture-ellipsoid-only-datums',
  datums: Object.fromEntries(names.map(name => [name, {}]))
};
