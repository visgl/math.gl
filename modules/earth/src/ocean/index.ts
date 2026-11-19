// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export {getReferenceSalinity, getAbsoluteSalinity} from './salinity';
export {
  getConservativeTemperature,
  getSeawaterDensity,
  getSeawaterSoundSpeed,
  getSeawaterFreezingTemperature
} from './seawater-state';
export {getHeightFromSeaPressure, getSeaPressureFromHeight} from './sea-pressure';
export type {SeaPressureHeightOptions} from './sea-pressure';
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
