// math.gl
// SPDX-License-Identifier: ISC
// SPDX-FileCopyrightText: Copyright 2013-2021 Mike Bostock
// Adapted from d3-geo-projection 4.0.0; see ../D3-LICENSE.txt.
// Display factories removed; numeric kernel retained for MapEngine.

import ginzburgPolyconicRaw from './ginzburgPolyconic.js';

export var ginzburg9Raw = ginzburgPolyconicRaw(
  2.6516,
  -0.76534,
  0.19123,
  -0.047094,
  1.36289,
  -0.13965,
  0.031762
);
