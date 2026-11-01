// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {initializeTaskWorker} from '@math.gl/core/tasks';
import {transformTask} from './task.mjs';
await initializeTaskWorker(transformTask);
