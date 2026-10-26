// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {isEarlyEarth} from './planetary-history.js';
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
    name: 'Euramerica (Laurussia)',
    detail: 'Earlier Laurentia–Baltica–Avalonia landmass · about 400 Ma',
    fade: [-440, -415, -390, -345]
  },
  {time: -300, name: 'Pangaea', detail: 'A global supercontinent', fade: [-345, -305, -265, -220]},
  {
    time: -180,
    name: 'Laurasia & Gondwana',
    detail: 'Later Pangaea breakup: Laurasia north, Gondwana south',
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
export const EARLY_EARTH_CHAPTERS = [
  {time: -4500, name: 'Earth–Theia impact', detail: 'Moon-forming hypothesis · illustrative global flash',
    illustrative: true, fade: [-4501, -4500, -4495, -4488]},
  {time: -4475, name: 'A young Moon', detail: 'Debris gathers and cools · illustrative orbital vignette',
    illustrative: true, fade: [-4490, -4480, -4455, -4445]},
  {time: -4430, name: 'The first seas', detail: 'Steam condenses into rain · illustrative, ocean onset uncertain',
    illustrative: true, fade: [-4445, -4440, -4425, -4415]},
  {time: -4400, name: 'Hadean Earth', detail: 'Rocky crust, lava lakes and emerging seas · illustrative',
    illustrative: true, fade: [-4415, -4410, -4250, -4100]},
  {time: -3900, name: 'Late heavy bombardment', detail: 'Hypothetical impacts and cooling lava pools · illustrative',
    illustrative: true, fade: [-4100, -3980, -3830, -3700]}
];
export const TIMELINE_CHAPTERS = [...EARLY_EARTH_CHAPTERS, ...LANDMASS_CHAPTERS, ...SNOWBALL_CHAPTERS];
/** Ice advances from the poles as each event fades in and retreats as it fades out. */
export function snowballCoverage(time) {
  return Math.max(...SNOWBALL_CHAPTERS.map(chapter => chapterOpacity(chapter, time)));
}
const present = {time: 0, name: 'Present'};
export function timelineMilestones(scenario, maxAge = 500) {
  return [
    ...TIMELINE_CHAPTERS.filter(c => c.time < 0 && (c.illustrative || -c.time <= maxAge)).sort((a, b) => a.time - b.time),
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

/** Keep each ice-edge transition readable without changing its geological dates. */
export function glaciationPlaybackSpeed(time, requestedSpeed, enabled = true) {
  if (!enabled) return requestedSpeed;
  const nearEdge = SNOWBALL_CHAPTERS.some(({fade: [start, formed, held, end]}) =>
    (time >= start - 2 && time <= formed + 1) || (time >= held - 1 && time <= end + 2)
  );
  return nearEdge ? Math.min(requestedSpeed, 0.75) : requestedSpeed;
}

// Readable event windows are art/playback choices, not geological durations.
export const PLAYBACK_FOCUS = [
  {name: 'Theia impact and cooling', fade: [-4520, -4510, -4430, -4420], speed: 4},
  {name: 'Emerging oceans', fade: [-4470, -4435, -4320, -4250], speed: 12},
  {name: 'Late heavy bombardment', fade: [-4100, -4000, -3800, -3700], speed: 12}
];
export function playbackFocus(time) {
  return PLAYBACK_FOCUS.find(event => chapterOpacity(event, time) > 0);
}
/** Accelerate quiet deep time, linger at events, and land exactly on data coverage. */
export function timelinePlaybackSpeed(time, requestedSpeed, maxAge, glaciations = true) {
  const early = isEarlyEarth(time, maxAge);
  let speed = early ? requestedSpeed * 5 : glaciationPlaybackSpeed(time, requestedSpeed, glaciations);
  for (const event of PLAYBACK_FOCUS) {
    const weight = chapterOpacity(event, time);
    speed += (Math.min(speed, event.speed)-speed)*weight;
  }
  return early ? Math.min(speed, (-maxAge-time)*20) : speed;
}
