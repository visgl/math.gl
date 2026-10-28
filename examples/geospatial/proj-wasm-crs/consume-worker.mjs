// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createWorker} from '@math.gl/core/tasks';
await createWorker(data => {
  const bounds = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
  for (let i = 0; i < data.positions.length; i++) {
    const axis = i % 3, value = data.positions[i];
    bounds[axis] = Math.min(bounds[axis], value);
    bounds[axis + 3] = Math.max(bounds[axis + 3], value);
  }
  return {...data, bounds};
});
