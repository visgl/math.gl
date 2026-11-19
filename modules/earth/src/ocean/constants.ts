// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Standard Ocean Reference Salinity S_SO, g/kg (IOC, SCOR and IAPSO 2010). */
export const STANDARD_OCEAN_SALINITY = 35.16504;

/** Ratio of Reference Salinity to Practical Salinity, u_PS = S_SO / 35, g/kg. */
export const PRACTICAL_SALINITY_SCALE = STANDARD_OCEAN_SALINITY / 35;

/** Celsius zero point T0, K. */
export const CELSIUS_ZERO = 273.15;

/** The "specific heat" c_p0 that defines Conservative Temperature, J/(kg K) (TEOS-10 manual, section 3.3). */
export const CONSERVATIVE_HEAT_CAPACITY = 3991.86795711963;

/** Pascals in one decibar. */
export const PASCALS_PER_DECIBAR = 1e4;

/** Largest sea pressure, dbar, of the oceanographic funnel of Roquet et al. (2015). */
export const MAX_SEA_PRESSURE = 8000;

/** Largest Absolute Salinity, g/kg, of the oceanographic funnel of Roquet et al. (2015). */
export const MAX_ABSOLUTE_SALINITY = 42;

/** Largest Practical Salinity accepted by the salinity conversions. */
export const MAX_PRACTICAL_SALINITY = 42;

/** Lowest in-situ temperature, °C (ITS-90), accepted by the Gibbs-function evaluations. */
export const MIN_TEMPERATURE = -3;

/** Highest in-situ or Conservative Temperature, °C (ITS-90), of the oceanographic funnel. */
export const MAX_TEMPERATURE = 40;
