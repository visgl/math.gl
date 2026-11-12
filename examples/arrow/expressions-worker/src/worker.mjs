// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {initializeTaskWorker} from '@math.gl/tasks';
import {createArrowExpressionTask} from '@math.gl/expressions/arrow/worker';
await initializeTaskWorker(createArrowExpressionTask());
