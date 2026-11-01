// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {initializeTaskWorker} from '../../../dist/tasks/index.js';
await initializeTaskWorker({id: 'failing-preload', async preload() {throw new Error('nested preload failed');}});
