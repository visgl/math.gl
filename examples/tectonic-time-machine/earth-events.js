// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Curated educational event chronology. Ages are approximate and do not
// constitute observed impact coordinates, tectonic reconstructions or simulations.
// Each event includes a source for the scientific interpretation.
export const LAND_PLANTS_AGE_MA = 470;
// Illustrative greening, not a reconstructed vegetation map. Full color arrives
// gradually by the Devonian; older terrain keeps its luminance and relief.
export function vegetationCoverage(time) {
  const fraction = Math.max(0, Math.min(1, (time + LAND_PLANTS_AGE_MA) / 80));
  return fraction * fraction * (3 - 2 * fraction);
}
export const EARTH_EVENTS = [
  {id: 'solar-system', name: 'Formation of the Solar System', ageMa: 4567,
    category: 'planetary', uncertaintyMa: 2, confidence: 'high',
    description: 'Solar System chronology based on primitive meteorite ages; not a direct observation of Earth forming.',
    source: 'Connelly et al. (2012)', url: 'https://doi.org/10.1126/science.1226919'},
  {id: 'theia', name: 'Moon-forming giant impact (Theia)', ageMa: 4500,
    category: 'planetary', uncertaintyMa: 70, confidence: 'scenario',
    description: 'A giant impact is a leading Moon-formation explanation. Timing, impactor size, angle and subsequent accretion remain model dependent.',
    source: 'Canup (2012)', url: 'https://doi.org/10.1126/science.1226073'},
  {id: 'zircons', name: 'Earliest surviving terrestrial zircons', ageMa: 4400,
    category: 'geology', uncertaintyMa: 50, confidence: 'high',
    description: 'Jack Hills zircons record ancient crustal material; interpretations of surface water remain debated.',
    source: 'Wilde et al. (2001)', url: 'https://doi.org/10.1038/35051550'},
  {id: 'early-oceans', name: 'Early surface water and oceans — zircon evidence', ageMa: 4400,
    category: 'environment', uncertaintyMa: 100, confidence: 'high',
    description: 'Zircon isotope evidence supports interaction with liquid water by about 4.4 Ga. The onset, persistence and global ocean extent are uncertain; the visual condensation sequence is illustrative.',
    source: 'Wilde et al. (2001)', url: 'https://doi.org/10.1038/35051550'},
  {id: 'bombardment', name: 'Late heavy bombardment hypothesis', ageMa: 3900,
    category: 'impact', uncertaintyMa: 200, confidence: 'debated',
    description: 'A discrete bombardment spike is contested; a declining impact flux is an alternative. This marker is not an observed global event.',
    source: 'Bottke and Norman (2017)', url: 'https://doi.org/10.1146/annurev-earth-063016-020131'},
  {id: 'great-oxidation', name: 'Great Oxidation Event', ageMa: 2400,
    category: 'environment', uncertaintyMa: 100, confidence: 'high',
    description: 'A prolonged atmospheric oxygenation transition, not a single instantaneous event.',
    source: 'Lyons et al. (2014)', url: 'https://doi.org/10.1038/nature13068'},
  {id: 'sturtian', name: 'Sturtian glaciation', ageMa: 700,
    category: 'climate', olderMa: 717, youngerMa: 660, confidence: 'high',
    description: 'Long Cryogenian glaciation; ice extent and climate interpretation vary by model.',
    source: 'Hoffman et al. (2017)', url: 'https://doi.org/10.1126/sciadv.1600983'},
  {id: 'marinoan', name: 'Marinoan glaciation', ageMa: 640,
    category: 'climate', olderMa: 650, youngerMa: 635, confidence: 'high',
    description: 'Cryogenian glaciation; the event is represented as an interval.',
    source: 'Hoffman et al. (2017)', url: 'https://doi.org/10.1126/sciadv.1600983'},
  {id: 'land-plants', name: 'Emergence of land plants', ageMa: LAND_PLANTS_AGE_MA,
    category: 'life', uncertaintyMa: 30, confidence: 'high',
    description: 'Early land plants appear around the Ordovician. The timing is approximate; greening in this example is illustrative, not reconstructed vegetation coverage.',
    source: 'University of Bristol (2020)', url: 'https://www.bristol.ac.uk/news/2020/january/land-plants.html'},
  {id: 'end-ordovician', name: 'End-Ordovician extinction', ageMa: 444,
    category: 'extinction', uncertaintyMa: 2, confidence: 'high',
    description: 'Major marine extinction associated with rapid climatic and sea-level changes.',
    source: 'International Commission on Stratigraphy', url: 'https://stratigraphy.org/chart'},
  {id: 'late-devonian', name: 'Late Devonian extinction episodes', ageMa: 372,
    category: 'extinction', uncertaintyMa: 13, confidence: 'high',
    description: 'Multiple extinction pulses rather than a single instantaneous catastrophe.',
    source: 'International Commission on Stratigraphy', url: 'https://stratigraphy.org/chart'},
  {id: 'end-permian', name: 'End-Permian extinction', ageMa: 251.9,
    category: 'extinction', uncertaintyMa: 0.2, confidence: 'high',
    description: 'Largest Phanerozoic mass extinction; Siberian Traps volcanism is a major proposed driver.',
    source: 'International Commission on Stratigraphy', url: 'https://stratigraphy.org/chart'},
  {id: 'end-triassic', name: 'End-Triassic extinction', ageMa: 201.4,
    category: 'extinction', uncertaintyMa: 0.5, confidence: 'high',
    description: 'Mass extinction associated with major environmental changes and CAMP volcanism.',
    source: 'International Commission on Stratigraphy', url: 'https://stratigraphy.org/chart'},
  {id: 'chicxulub', name: 'Chicxulub impact and end-Cretaceous extinction', ageMa: 66,
    category: 'extinction', uncertaintyMa: 0.1, confidence: 'high',
    description: 'Impact at the Cretaceous–Paleogene boundary; this is a geographically evidenced impact, unlike Hadean simulated events.',
    source: 'Schulte et al. (2010)', url: 'https://doi.org/10.1126/science.1177265'}
];
export const EVENT_CATEGORIES = ['all', 'planetary', 'impact', 'geology', 'environment', 'climate', 'life', 'extinction'];
export function filterEarthEvents(events, category = 'all', query = '') {
  const needle = query.trim().toLowerCase();
  return events.filter(event =>
    (category === 'all' || event.category === category) &&
    (!needle || [event.name, event.description, event.category].some(text => text.toLowerCase().includes(needle)))
  ).sort((a, b) => b.ageMa - a.ageMa);
}
export function eventIsReconstructable(event, maxAge) {
  return event.ageMa <= maxAge && event.ageMa >= 0;
}
