// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {initializeTaskWorker} from '@math.gl/tasks';
import {processGeometry} from './process.mjs';
await initializeTaskWorker({id: 'geoarrow-stream', process: processGeometry});
