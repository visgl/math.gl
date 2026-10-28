// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createWorker} from '@math.gl/core/tasks';
import {projectGeometry} from './pipeline.ts';
await createWorker(projectGeometry);
