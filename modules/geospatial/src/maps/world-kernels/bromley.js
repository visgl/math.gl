// math.gl
// SPDX-License-Identifier: ISC
// SPDX-FileCopyrightText: Copyright 2013-2021 Mike Bostock
// Adapted from d3-geo-projection 4.0.0; see ../D3-LICENSE.txt.
// Display factories removed; numeric kernel retained for MapEngine.

import {pi} from './math.js';
import {mollweideBromleyRaw} from './mollweide.js';

export var bromleyRaw = mollweideBromleyRaw(1, 4 / pi, pi);
