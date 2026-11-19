// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import ocean = require('@math.gl/earth/ocean');
const speed: number = ocean.getSoundSpeedMackenzie(35, 10, 1000);
ocean.getSoundAbsorptionAinslieMcColm({frequency: 1e5, temperature: 10, salinity: 35, depth: 0, pH: 8});
speed.toFixed(2);
