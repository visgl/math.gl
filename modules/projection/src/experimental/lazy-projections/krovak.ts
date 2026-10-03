// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Lazy metadata for the TypeScript projection; the algorithm retains its upstream notices.
import {createProjectionDescriptor} from '../projection-descriptor';
import type {ProjectionDescriptor} from '../projection-descriptor';
export const lazyKrovak: ProjectionDescriptor = /* @__PURE__ */ createProjectionDescriptor(
  {
    name: 'krovak',
    aliases: [
      'Krovak',
      'Krovak Modified',
      'Krovak (North Orientated)',
      'Krovak Modified (North Orientated)'
    ]
  },
  async () => (await import('@math.gl/projection/projections/krovak')).krovak
);
