// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export {getReferenceSalinity, getAbsoluteSalinity} from './salinity';
export {
  getPracticalSalinityFromConductivity,
  getConductivityFromPracticalSalinity
} from './conductivity';
export {
  getConservativeTemperature,
  getSeawaterDensity,
  getSeawaterSoundSpeed,
  getSeawaterFreezingTemperature
} from './seawater-state';
export {getPotentialTemperature, getPotentialDensity} from './potential-properties';
export {getHeightFromSeaPressure, getSeaPressureFromHeight} from './sea-pressure';
export type {SeaPressureHeightOptions} from './sea-pressure';
export {getBuoyancyFrequencySquared} from './water-column';
export type {BuoyancyFrequencySquared} from './water-column';
export {
  getSoundSpeedChenMillero,
  getSoundSpeedDelGrosso,
  getSoundSpeedMackenzie
} from './sound-speed';
export {
  getSoundAbsorptionFrancoisGarrison,
  getSoundAbsorptionAinslieMcColm
} from './sound-absorption';
export type {SoundAbsorptionOptions, FrancoisGarrisonAbsorptionOptions} from './sound-absorption';
export {getTideHeight, getTidalNodeFactor, getTidalEquilibriumArgument} from './tide';
export type {TidalConstituent, TidalConstituentName, TideHeightOptions} from './tide';
