// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Chart size and margins, in SVG units. */
const WIDTH = 260,
  HEIGHT = 240,
  LEFT = 44,
  RIGHT = 10,
  TOP = 18,
  BOTTOM = 26;

/** SVG chart and summary for one sound-speed profile; depth increases downward. */
export function createSoundProfileMarkup(result, {longitude, latitude, seafloorDepth, frequency}) {
  const {levels, minimum, verticalLoss, levelsWithoutAbsorption, truncated} = result;
  const speeds = levels.map(level => level.soundSpeed);
  const low = Math.floor(Math.min(...speeds) - 2),
    high = Math.ceil(Math.max(...speeds) + 2);
  const bottom = levels.at(-1).depth || 1;
  const x = speed => LEFT + ((speed - low) / (high - low)) * (WIDTH - LEFT - RIGHT);
  const y = depth => TOP + (depth / bottom) * (HEIGHT - TOP - BOTTOM);
  const points = levels.map(
    level => `${x(level.soundSpeed).toFixed(1)},${y(level.depth).toFixed(1)}`
  );
  const kHz = `${frequency / 1000} kHz`;
  const surface = levels[0];
  /** Absorption of one level, or a gap outside the Francois–Garrison range. */
  const absorption = level =>
    level.absorption === null ? 'no value' : `${level.absorption.toFixed(3)} dB/km`;
  const loss =
    verticalLoss === null
      ? 'One-way vertical loss: no value.'
      : `One-way vertical loss to ${Math.round(bottom)} m: ${verticalLoss.toFixed(1)} dB${levelsWithoutAbsorption ? ', partial: it omits the intervals without absorption' : ''}.`;
  const gaps = levelsWithoutAbsorption
    ? `<p data-role="absorption-domain">Absorption is outside the Francois–Garrison range at ${levelsWithoutAbsorption} ${levelsWithoutAbsorption === 1 ? 'level' : 'levels'}.</p>`
    : '';
  const channel =
    minimum.depth > 0 && minimum.depth < bottom
      ? `Minimum ${minimum.soundSpeed.toFixed(1)} m/s at ${Math.round(minimum.depth)} m: the deep sound channel axis.`
      : `Minimum ${minimum.soundSpeed.toFixed(1)} m/s at ${minimum.depth === 0 ? 'the surface' : 'the bottom of the profile'}: no deep sound channel here.`;
  return `<p><strong>${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°</strong> · ETOPO1 seafloor ${Math.round(seafloorDepth)} m</p>
  <svg data-role="profile-chart" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="100%" role="img" aria-label="Sound speed from the surface to ${Math.round(bottom)} m">
    <line class="axis" x1="${LEFT}" y1="${TOP}" x2="${WIDTH - RIGHT}" y2="${TOP}"/>
    <line class="axis" x1="${LEFT}" y1="${TOP}" x2="${LEFT}" y2="${HEIGHT - BOTTOM}"/>
    <text x="${LEFT}" y="12">${low}</text><text x="${WIDTH - RIGHT}" y="12" text-anchor="end">${high} m/s</text>
    <text x="${LEFT - 4}" y="${TOP + 4}" text-anchor="end">0 m</text>
    <text x="${LEFT - 4}" y="${HEIGHT - BOTTOM + 4}" text-anchor="end">${Math.round(bottom)}</text>
    <line class="seafloor" x1="${LEFT}" y1="${y(bottom)}" x2="${WIDTH - RIGHT}" y2="${y(bottom)}"/>
    <polyline class="profile" points="${points.join(' ')}"/>
    <line class="minimum" x1="${LEFT}" y1="${y(minimum.depth)}" x2="${WIDTH - RIGHT}" y2="${y(minimum.depth)}"/>
    <circle data-role="minimum-marker" class="minimum" cx="${x(minimum.soundSpeed)}" cy="${y(minimum.depth)}" r="4"/>
  </svg>
  <p data-role="minimum">${channel}</p>
  <p data-role="absorption">Absorption at ${kHz}: ${absorption(surface)} at the surface, ${absorption(levels.at(-1))} at ${Math.round(bottom)} m. ${loss}</p>
  ${gaps}
  ${truncated ? '<p>The profile data end above this seafloor.</p>' : ''}`;
}

/**
 * Replace the content of `element` with the chart and summary of one profile.
 * The markup holds only numbers that this module formats.
 * @param {HTMLElement} element
 * @param {ReturnType<import('./sound-profile.js').computeSoundProfile>} result
 * @param {{longitude: number, latitude: number, seafloorDepth: number, frequency: number}} location
 */
export function renderSoundProfile(element, result, location) {
  element.innerHTML = createSoundProfileMarkup(result, location);
}
