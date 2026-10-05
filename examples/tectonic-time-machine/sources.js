// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Published ranges are explicit: the service's CAO metadata has an erroneous BigTime value.
export const DEFAULT_SOURCE = 'CAO2024';
export const FUTURE_END = 300;
export const DATA_SOURCES = {
  CAO2024: {
    id: 'CAO2024',
    label: 'Cao et al. (2024) · 1.8 billion years',
    maxAge: 1800,
    citation: 'Cao et al. (2024)',
    reference: 'https://doi.org/10.1016/j.gsf.2024.101922',
    dataset: 'https://zenodo.org/records/13628813',
    license: 'CC-BY-4.0',
    geometry: 'continental blocks',
    frame: 'Paleomagnetic reference frame',
    url: 'https://repo.gplates.org/webdav/pmm/cao2024/ContinentalPolygons.zip',
    archiveEntry: 'ContinentalPolygons/shapes_continents.gpmlz',
    sha256: '5b024724d95f476427ee71c90afb086265aa13845210e08326b026400c0f01bd'
  },
  MULLER2022: {
    id: 'MULLER2022',
    label: 'Müller et al. (2022) · 1 billion years',
    maxAge: 1000,
    citation: 'Müller et al. (2022)',
    reference: 'https://doi.org/10.5194/se-13-1127-2022',
    dataset: 'https://zenodo.org/records/13636799',
    license: 'Source data terms',
    geometry: 'coastline templates',
    frame: 'Mantle reference frame',
    url: 'https://raw.githubusercontent.com/GPlates/gplates-web-service/2b2bb1e25737668d4d3ec3d5d1c327279f30279e/django/GWS/data/deprecated/MODELS/MULLER2022/shapes_coastlines_Merdith_et_al_v2.gpmlz'
  }
};
export function sourceFor(id) {
  const source = Object.hasOwn(DATA_SOURCES, id) && DATA_SOURCES[id];
  if (!source) throw new Error(`Unknown reconstruction source: ${id}`);
  return source;
}
export function clampTime(time, maxAge) {
  return Math.max(-maxAge, Math.min(FUTURE_END, time));
}
export function rotationBracket(time, maxAge) {
  if (!Number.isFinite(time) || time < -maxAge || time > FUTURE_END)
    throw new RangeError('Time outside reconstruction range');
  const age = Math.max(0, -time),
    low = Math.floor(age / 10) * 10;
  return [low, age === low ? low : Math.min(maxAge, low + 10)];
}
/** Fetch one bounded 200 Ma window, not the entire deep-time history. */
export function rotationWindow(time, maxAge) {
  rotationBracket(time, maxAge);
  const age = Math.max(0, -time);
  // At a boundary, prepare the younger window so forward playback can continue.
  const start = Math.min(Math.max(0, Math.ceil(age / 200) - 1) * 200, maxAge - 200);
  const end = Math.min(maxAge, start + 200);
  return Array.from({length: (end - start) / 10 + 1}, (_, i) => start + i * 10);
}
