// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {initializeTaskWorker} from '@math.gl/core/tasks';
await initializeTaskWorker({
  id: 'echo',
  process(input) {
    if (input.crash) process.exit(1);
    return input;
  }
});
