// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createWorker} from '@math.gl/core/task-runtime';
await createWorker((input, options) => input.map(value => value * (options.scale ?? 2)));
