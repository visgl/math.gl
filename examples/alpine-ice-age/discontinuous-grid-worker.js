// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import { discontinuousGrid } from "./discontinuous-views.js";

self.onmessage = ({ data: { view, step } }) => {
  try {
    const { map, ...grid } = discontinuousGrid(view, step);
    // MapEngine owns functions; only geometry and layout data cross the boundary.
    self.postMessage(grid, [grid.positions.buffer, grid.indices.buffer]);
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};
