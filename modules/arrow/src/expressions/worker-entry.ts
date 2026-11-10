// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {initializeTaskWorker} from '@math.gl/tasks';
import {createArrowExpressionTask} from './worker';

// Default worker for primitive expressions. Applications can provide their own module worker
// with a local registry by initializing createArrowExpressionTask({registry}) instead.
void initializeTaskWorker(createArrowExpressionTask());
