// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {initializeTaskWorker} from '../../../dist/tasks/index.js';
await initializeTaskWorker({id: 'blocked-preload', preload: () => new Promise(() => {})});
