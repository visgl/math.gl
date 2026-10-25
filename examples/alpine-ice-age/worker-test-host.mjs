// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Node bridge for exercising the actual browser worker entry and structured cloning.
import {parentPort} from 'node:worker_threads';
globalThis.self = {
  postMessage: (data, transfer) => parentPort.postMessage(data, transfer),
  onmessage: null
};
await import('./discontinuous-grid-worker.js');
parentPort.on('message', data => self.onmessage({data}));
