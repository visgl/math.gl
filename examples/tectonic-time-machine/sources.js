// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Immutable CC-BY-4.0 snapshots, with matching geometry and finite rotations.
const SNAPSHOT = 'https://media.githubusercontent.com/media/visgl/deck.gl-data/6b82e2df927725dc54ba729267204498d4ac6c74/earth/tectonic-movements/v1';
export const DEFAULT_SOURCE = 'MULLER2022';
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
    version: '2.4',
    referenceFrame: 'Paleomagnetic',
    snapshot: `${SNAPSHOT}/cao2024`,
    manifest: `${SNAPSHOT.replace('media.githubusercontent.com/media', 'raw.githubusercontent.com')}/cao2024/manifest.json`
  },
  MULLER2022: {
    id: 'MULLER2022',
    label: 'Müller et al. (2022) · 1 billion years',
    maxAge: 1000,
    citation: 'Müller et al. (2022)',
    reference: 'https://doi.org/10.5194/se-13-1127-2022',
    dataset: 'https://zenodo.org/records/13636799',
    license: 'CC-BY-4.0',
    geometry: 'coastline templates',
    frame: 'Optimised mantle reference frame',
    version: '1.2.4',
    referenceFrame: 'Optimised mantle',
    snapshot: `${SNAPSHOT}/muller2022`,
    manifest: `${SNAPSHOT.replace('media.githubusercontent.com/media', 'raw.githubusercontent.com')}/muller2022/manifest.json`
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
