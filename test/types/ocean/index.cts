// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import ocean = require('@math.gl/earth/ocean');
const speed: number = ocean.getSoundSpeedMackenzie(35, 10, 1000);
ocean.getSoundAbsorptionAinslieMcColm({frequency: 1e5, temperature: 10, salinity: 35, depth: 0, pH: 8});
speed.toFixed(2);
const practicalSalinity: number = ocean.getPracticalSalinityFromConductivity(42.914, 15, 0);
const conductivity: number = ocean.getConductivityFromPracticalSalinity(practicalSalinity, 15, 0);
const potentialTemperature: number = ocean.getPotentialTemperature(35.16504, 4, 100);
const potentialDensity: number = ocean.getPotentialDensity(35.16504, 4, 1000);
const stability: ocean.BuoyancyFrequencySquared = ocean.getBuoyancyFrequencySquared([35, 35.1], [10, 9], [0, 100], [30, 30]);
const nSquared: Float64Array = stability.buoyancyFrequencySquared;
conductivity.toFixed(2);
potentialTemperature.toFixed(2);
potentialDensity.toFixed(2);
nSquared.fill(0);
