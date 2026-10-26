// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import gravity = require('@math.gl/earth/normal-gravity');
const field:gravity.LocalNormalGravityField=gravity.NormalGravity.WGS84().evaluate(30,40,0);
field.localAcceleration[2];
