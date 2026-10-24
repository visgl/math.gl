// math.gl
// SPDX-License-Identifier: ISC
// SPDX-FileCopyrightText: Copyright 2010-2024 Mike Bostock
// Adapted from d3-geo 3.1.1; see ./D3-GEO-LICENSE.txt.

import {abs, epsilon} from './math.js';

export default function (a, b) {
  return abs(a[0] - b[0]) < epsilon && abs(a[1] - b[1]) < epsilon;
}
