// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {processGeometry} from './process.mjs';
export const geometryTask = {
  id: 'geoarrow-stream', name: 'GeoArrow geometry stream', module: 'example', version: '1', options: {},
  worker: new URL('./worker.mjs', import.meta.url).href,
  loadWorker: () => new Worker(new URL('./worker.mjs', import.meta.url), {type: 'module'}),
  process: processGeometry
};
