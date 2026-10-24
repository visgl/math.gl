// math.gl
// SPDX-License-Identifier: ISC
// SPDX-FileCopyrightText: Copyright 2013-2021 Mike Bostock
// Adapted from d3-geo-projection 4.0.0; see ../D3-LICENSE.txt.
// Display factories removed; numeric kernel retained for MapEngine.

import ginzburgPolyconicRaw from './ginzburgPolyconic.js';

export var ginzburg4Raw = ginzburgPolyconicRaw(
  2.8284,
  -1.6988,
  0.75432,
  -0.18071,
  1.76003,
  -0.38914,
  0.042555
);
