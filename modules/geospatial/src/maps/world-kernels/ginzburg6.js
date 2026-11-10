// math.gl
// SPDX-License-Identifier: ISC
// SPDX-FileCopyrightText: Copyright 2013-2021 Mike Bostock
// Adapted from d3-geo-projection 4.0.0; see ../D3-LICENSE.txt.
// Display factories removed; numeric kernel retained for MapEngine.

import ginzburgPolyconicRaw from './ginzburgPolyconic.js';
import {pi} from './math.js';

export var ginzburg6Raw = ginzburgPolyconicRaw(
  (5 / 6) * pi,
  -0.62636,
  -0.0344,
  0,
  1.3493,
  -0.05524,
  0,
  0.045
);
