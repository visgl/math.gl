// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Approximate chapter dates are educational cues, not measured assembly boundaries.
export const LANDMASS_CHAPTERS = [
  {
    time: -1600,
    name: 'Nuna',
    detail: 'Also called Columbia · an early supercontinent',
    fade: [-1700, -1630, -1540, -1400]
  },
  {
    time: -930,
    name: 'Rodinia',
    detail: 'A Precambrian supercontinent',
    fade: [-1070, -970, -900, -800]
  },
  {
    time: -500,
    name: 'Gondwana',
    detail: 'Southern continents assembled',
    fade: [-530, -500, -480, -440]
  },
  {
    time: -400,
    name: 'Laurussia',
    detail: 'Laurentia · Baltica · Avalonia',
    fade: [-440, -415, -390, -345]
  },
  {time: -300, name: 'Pangaea', detail: 'A global supercontinent', fade: [-345, -305, -265, -220]},
  {
    time: -180,
    name: 'Laurasia & Gondwana',
    detail: 'Pangaea separates into northern and southern landmasses',
    fade: [-210, -185, -160, -115]
  },
  {
    time: 250,
    name: 'Atlantic assembly',
    detail: 'Illustrative future supercontinent',
    scenario: 'atlantic',
    fade: [190, 240, 260, 300]
  },
  {
    time: 250,
    name: 'Polar assembly',
    detail: 'Illustrative future supercontinent',
    scenario: 'polar',
    fade: [190, 240, 260, 300]
  }
];
// Approximate Cryogenian intervals, not reconstructed ice boundaries.
// Hoffman et al. (2017), https://doi.org/10.1126/sciadv.1600983
export const SNOWBALL_CHAPTERS = [
  {time: -700, name: 'Snowball Earth · Sturtian',
    detail: 'Approx. 717–660 Ma · illustrative global ice cover',
    fade: [-717, -714, -663, -660]},
  {time: -640, name: 'Snowball Earth · Marinoan',
    detail: 'Approx. 650–635 Ma · illustrative global ice cover',
    fade: [-650, -648, -637, -635]}
];
export const TIMELINE_CHAPTERS = [...LANDMASS_CHAPTERS, ...SNOWBALL_CHAPTERS];
/** Ice advances from the poles as each event fades in and retreats as it fades out. */
export function snowballCoverage(time) {
  return Math.max(...SNOWBALL_CHAPTERS.map(chapter => chapterOpacity(chapter, time)));
}
const present = {time: 0, name: 'Present'};
export function timelineMilestones(scenario, maxAge = 500) {
  return [
    ...TIMELINE_CHAPTERS.filter(c => c.time < 0 && -c.time <= maxAge).sort((a, b) => a.time - b.time),
    present,
    LANDMASS_CHAPTERS.find(c => c.scenario === scenario) ||
      LANDMASS_CHAPTERS.find(c => c.scenario === 'atlantic')
  ];
}
function smoothstep(t) {
  return t * t * (3 - 2 * t);
}
/** Visibility follows geological time, so pauses and seeks do not restart a wall-clock animation. */
export function chapterOpacity(chapter, time, scenario) {
  if (!Number.isFinite(time) || (chapter.scenario && chapter.scenario !== scenario)) return 0;
  const [start, formed, held, end] = chapter.fade;
  if (time <= start || time >= end) return 0;
  if (time < formed) return smoothstep((time - start) / (formed - start));
  if (time <= held) return 1;
  return 1 - smoothstep((time - held) / (end - held));
}
