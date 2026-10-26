// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Hadean visual stages are deliberately illustrative, not geological maps.
export const EARTH_FORMATION_MA = 4567;
export const PLATE_MODE_MIN_AGE_MA = 1800;
export function clampTimelineTime(time) {
  if (!Number.isFinite(time)) throw new RangeError('Invalid timeline time');
  return Math.max(-EARTH_FORMATION_MA, Math.min(300, time));
}
export function isEarlyEarth(time, maxAge) {
  return Number.isFinite(time) && time < -maxAge && time >= -EARTH_FORMATION_MA;
}
function smooth01(value) {const t = Math.max(0, Math.min(1, value)); return t*t*(3-2*t);}
// Original procedural art controls, not measured lava coverage or impact rates.
export function earlyEarthMaterial(time, result = {}) {
  const age = -clampTimelineTime(time);
  result.lava = smooth01((age-3950)/400) * (.35+.25*smooth01((age-4400)/167));
  result.bombardment = smooth01((age-3700)/150) * smooth01((4100-age)/150);
  result.water = .85*(1-smooth01((age-3800)/600));
  result.impactTime = (EARTH_FORMATION_MA-age)/12;
  return result;
}
export function planetaryStage(ageMa) {
  if (!Number.isFinite(ageMa) || ageMa < 0 || ageMa > EARTH_FORMATION_MA) return null;
  if (ageMa >= 4530) return {id: 'accretion', label: 'Accretion and early differentiation',
    description: 'Illustrative young Earth; no observed surface geography.'};
  if (ageMa >= 4450) return {id: 'giant-impact', label: 'Moon-forming giant-impact scenarios',
    description: 'Theia collision timing and geometry are uncertain. This is not a simulation.'};
  if (ageMa >= 4000) return {id: 'cooling', label: 'Cooling crust and early water',
    description: 'Zircons constrain early crust; global surface appearance is unknown.'};
  if (ageMa >= 3700 && ageMa < 4000) return {id: 'bombardment', label: 'Late-heavy-bombardment hypothesis',
    description: 'Illustrative asteroid strikes and cooling lava pools; a discrete impact spike remains debated.'};
  return {id: 'pretectonic', label: 'Early Earth without reliable plate maps',
    description: 'No unique reconstruction of ancient continents is available.'};
}
// A normalized, observational or model-derived series contract.
// Never interpolate across absent measurements or combine incompatible models.
export function validateGeologicalSeries(series) {
  if (!series || typeof series !== 'object' || !['impact-flux', 'biodiversity'].includes(series.kind))
    return ['Unsupported series kind'];
  const errors = [];
  const text = value => typeof value === 'string' && value.trim().length > 0;
  if (![series.source, series.license, series.model].every(text)) errors.push('Missing provenance');
  if (!Array.isArray(series.samples) || !series.samples.length) errors.push('No samples');
  else {
    let previous = Infinity;
    for (const sample of series.samples) {
      if (!sample || typeof sample !== 'object' || Array.isArray(sample)) {
        errors.push('Invalid sample');
        continue;
      }
      if (!Number.isFinite(sample.ageMa) || sample.ageMa < 0 ||
          !Number.isFinite(sample.value) || sample.value < 0) errors.push('Invalid sample');
      if (sample.ageMa >= previous) errors.push('Samples must have strictly decreasing ages');
      previous = sample.ageMa;
    }
  }
  if (![series.unit, series.method].every(text)) errors.push('Missing unit or measurement method');
  return errors;
}
export function selectGeologicalSeries(series, kind) {
  return series.filter(item => item.kind === kind && validateGeologicalSeries(item).length === 0);
}
