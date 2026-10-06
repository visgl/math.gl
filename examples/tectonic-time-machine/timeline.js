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
const present = {time: 0, name: 'Present'};
export function timelineMilestones(scenario, maxAge = 500) {
  return [
    ...LANDMASS_CHAPTERS.filter(c => c.time < 0 && -c.time <= maxAge),
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
