// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {initializeTaskWorker} from '@math.gl/tasks';
import {projectGeometry} from './pipeline.ts';
await initializeTaskWorker({id: 'projection-domains', process: projectGeometry});
