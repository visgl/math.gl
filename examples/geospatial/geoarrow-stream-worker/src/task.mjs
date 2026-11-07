// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {processGeometry} from './process.mjs';
export const geometryTask = {
  id: 'geoarrow-stream',
  worker: {
    ...(typeof process !== 'undefined' && process.versions?.node
      ? {url: new URL('./worker.mjs', import.meta.url)}
      : {create: () => new Worker(new URL('./worker.mjs', import.meta.url), {type: 'module'})}),
    capabilities: {atomic: true, streaming: false}
  },
  process: processGeometry
};
