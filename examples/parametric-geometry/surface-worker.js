// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {ParametricGeometry} from '@math.gl/geometry/parametric';
self.onmessage = ({data: {source, segments, amount}}) => {
  try {
    const sample = new Function(`"use strict"; return (${source});`)();
    if (typeof sample !== 'function') throw new Error('Enter a function: (u, v, a) => [x, y, z].');
    const geometry = new ParametricGeometry({
      uSegments: segments,
      vSegments: segments,
      sample: (u, v) => sample(u, v, amount)
    });
    const buffers = [
      ...Object.values(geometry.attributes).map(attribute => attribute.value.buffer),
      geometry.indices.value.buffer
    ];
    self.postMessage(
      {
        geometry: {
          topology: geometry.topology,
          attributes: geometry.attributes,
          indices: geometry.indices
        }
      },
      buffers
    );
  } catch (error) {
    self.postMessage({error: error.message || 'Unable to sample the function.'});
  }
};
