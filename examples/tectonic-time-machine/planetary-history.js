// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Hadean visual stages are deliberately illustrative, not geological maps.
export const EARTH_FORMATION_MA = 4567;
export const PLATE_MODE_MIN_AGE_MA = 1800;
export function planetaryStage(ageMa) {
  if (!Number.isFinite(ageMa) || ageMa < 0 || ageMa > EARTH_FORMATION_MA) return null;
  if (ageMa >= 4530) return {id: 'accretion', label: 'Accretion and early differentiation',
    description: 'Illustrative young Earth; no observed surface geography.'};
  if (ageMa >= 4450) return {id: 'giant-impact', label: 'Moon-forming giant-impact scenarios',
    description: 'Theia collision timing and geometry are uncertain. This is not a simulation.'};
  if (ageMa >= 4000) return {id: 'cooling', label: 'Cooling crust and early water',
    description: 'Zircons constrain early crust; global surface appearance is unknown.'};
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
