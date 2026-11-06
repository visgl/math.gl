// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Educational feature index. Ages are approximate, not reconstructed geometries.
// Age intervals are inclusive; Ma is millions of years before present.
export const PALEO_FEATURES = [
  {id: 'transgondwanan', name: 'Transgondwanan Supermountain', type: 'mountain belt', olderMa: 650, youngerMa: 500, note: 'Proposed extensive Gondwanan orogenic system; extent and dates are approximate.'},
  {id: 'central-pangaean', name: 'Central Pangaean Mountains', type: 'mountain belt', olderMa: 320, youngerMa: 250, note: 'Mountain system associated with Pangaea assembly; not a reconstructed summit outline.'},
  {id: 'caledonian', name: 'Caledonian orogen', type: 'mountain belt', olderMa: 490, youngerMa: 390, note: 'Multiple orogenic episodes; dates summarize a complex history.'},
  {id: 'iapetus', name: 'Iapetus Ocean', type: 'ocean', olderMa: 600, youngerMa: 400, note: 'Progressively closed during Paleozoic continental collisions.'},
  {id: 'panthalassa', name: 'Panthalassa', type: 'ocean', olderMa: 300, youngerMa: 66, note: 'Vast ocean surrounding Pangaea; interval here is illustrative, not its full lifespan.'},
  {id: 'tethys', name: 'Tethys Ocean', type: 'ocean', olderMa: 250, youngerMa: 50, note: 'Broad educational interval; Paleo-Tethys and Neo-Tethys must be distinguished in detailed reconstructions.'},
  {id: 'western-interior', name: 'Western Interior Seaway', type: 'sea', olderMa: 100, youngerMa: 66, note: 'Cretaceous epicontinental sea across North America; extent varied greatly.'},
  {id: 'laurentia', name: 'Laurentia', type: 'paleocontinent', olderMa: 1000, youngerMa: 300, note: 'Long-lived continental nucleus; listed interval is a useful viewing window, not formation and extinction dates.'},
  {id: 'baltica', name: 'Baltica', type: 'paleocontinent', olderMa: 600, youngerMa: 420, note: 'Independent continental block before collision with Laurentia; timing is approximate.'}
];
export function featuresAtAge(time, features = PALEO_FEATURES) {
  const age = -time;
  if (age < 0) return [];
  return features.filter(feature => age <= feature.olderMa && age >= feature.youngerMa);
}
export function searchPaleoFeatures(features, query = '') {
  const needle = query.trim().toLocaleLowerCase();
  return needle ? features.filter(feature =>
    [feature.name, feature.type, feature.note].some(value => value.toLocaleLowerCase().includes(needle))
  ) : features;
}
