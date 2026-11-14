// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {initializeTaskWorker} from '@math.gl/tasks';
import {createArrowQueryTask} from './query-worker';

void initializeTaskWorker(createArrowQueryTask());
