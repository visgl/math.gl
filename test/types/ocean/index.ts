// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {
  getAbsoluteSalinity,
  getBuoyancyFrequencySquared,
  getConductivityFromPracticalSalinity,
  getConservativeTemperature,
  getPotentialDensity,
  getPotentialTemperature,
  getPracticalSalinityFromConductivity,
  getSeaPressureFromHeight,
  getSeawaterSoundSpeed,
  getSoundAbsorptionFrancoisGarrison,
  type BuoyancyFrequencySquared,
  type FrancoisGarrisonAbsorptionOptions,
  type SeaPressureHeightOptions
} from '@math.gl/earth/ocean';

const heightOptions: SeaPressureHeightOptions = {dynamicHeightAnomaly: 0, surfaceGravity: 9.8};
const seaPressure: number = getSeaPressureFromHeight(-1000, 30, heightOptions);
const absoluteSalinity = getAbsoluteSalinity(35);
const conservativeTemperature = getConservativeTemperature(absoluteSalinity, 4, seaPressure);
getSeawaterSoundSpeed(absoluteSalinity, conservativeTemperature, seaPressure);
const absorption: FrancoisGarrisonAbsorptionOptions = {
  frequency: 12000,
  temperature: 4,
  salinity: 35,
  depth: 1000
};
getSoundAbsorptionFrancoisGarrison(absorption);
// @ts-expect-error The absorption functions need a frequency.
getSoundAbsorptionFrancoisGarrison({temperature: 4, salinity: 35, depth: 1000});

const practicalSalinity: number = getPracticalSalinityFromConductivity(42.914, 15, 0);
const conductivity: number = getConductivityFromPracticalSalinity(practicalSalinity, 15, 0);
const potentialTemperature: number = getPotentialTemperature(absoluteSalinity, 4, seaPressure, 0);
const potentialDensity: number = getPotentialDensity(
  absoluteSalinity,
  conservativeTemperature,
  1000
);
const stability: BuoyancyFrequencySquared = getBuoyancyFrequencySquared(
  [35, 35.1],
  [10, 9],
  [0, 100],
  30
);
const frequencySquared: Float64Array = stability.buoyancyFrequencySquared;
const midPressure: Float64Array = stability.midPressure;
conductivity.toFixed(2);
potentialTemperature.toFixed(2);
potentialDensity.toFixed(2);
frequencySquared.fill(0);
midPressure.fill(0);
