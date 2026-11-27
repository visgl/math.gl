// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {
  getAbsoluteSalinity,
  getConservativeTemperature,
  getSeaPressureFromHeight,
  getSeawaterSoundSpeed,
  getSoundAbsorptionFrancoisGarrison,
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
