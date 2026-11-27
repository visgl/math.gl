// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {MAX_PRACTICAL_SALINITY, PRACTICAL_SALINITY_SCALE} from './constants';
import {checkRange} from './domain';

/**
 * Returns Reference Salinity from Practical Salinity: `SR = (35.16504 / 35) × SP`.
 *
 * Reference: IOC, SCOR and IAPSO (2010), the TEOS-10 manual. GSW counterpart:
 * `gsw_SR_from_SP`.
 * @param practicalSalinity - Practical Salinity SP (PSS-78), unitless, from 0 to 42.
 * @returns Reference Salinity SR, g/kg.
 * @throws {RangeError} When the input is not finite or is outside the domain.
 */
export function getReferenceSalinity(practicalSalinity: number): number {
  checkRange('practicalSalinity', practicalSalinity, 0, MAX_PRACTICAL_SALINITY);
  return PRACTICAL_SALINITY_SCALE * practicalSalinity;
}

/**
 * Returns Absolute Salinity: `SA = SR + δSA`.
 *
 * The subpath has no Absolute Salinity Anomaly atlas. The default anomaly is 0, so the
 * result is Reference Salinity. In the open ocean the atlas anomaly is at most about
 * 0.03 g/kg. Pass an atlas or measured `absoluteSalinityAnomaly` for a better value.
 * The Baltic Sea uses a different relation in GSW and is not covered by this function.
 *
 * Reference: TEOS-10 manual, section 2.5. GSW counterpart: `gsw_SA_from_SP`, which reads
 * the SAAR atlas from longitude, latitude and pressure.
 * @param practicalSalinity - Practical Salinity SP (PSS-78), unitless, from 0 to 42.
 * @param absoluteSalinityAnomaly - δSA, g/kg, finite; default 0.
 * @returns Absolute Salinity SA, g/kg.
 * @throws {RangeError} When an input is not finite or is outside the domain.
 */
export function getAbsoluteSalinity(
  practicalSalinity: number,
  absoluteSalinityAnomaly = 0
): number {
  checkRange('absoluteSalinityAnomaly', absoluteSalinityAnomaly, -1, 1);
  return getReferenceSalinity(practicalSalinity) + absoluteSalinityAnomaly;
}
