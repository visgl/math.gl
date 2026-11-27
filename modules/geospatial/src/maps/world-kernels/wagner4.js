// math.gl
// SPDX-License-Identifier: ISC
// SPDX-FileCopyrightText: Copyright 2013-2021 Mike Bostock
// Adapted from d3-geo-projection 4.0.0; see ../D3-LICENSE.txt.
// Display factories removed; numeric kernel retained for MapEngine.

import {sqrt, pi} from './math.js';
import {mollweideBromleyRaw} from './mollweide.js';

var A = 4 * pi + 3 * sqrt(3),
  B = 2 * sqrt((2 * pi * sqrt(3)) / A);

export var wagner4Raw = mollweideBromleyRaw((B * sqrt(3)) / pi, B, A / 6);
