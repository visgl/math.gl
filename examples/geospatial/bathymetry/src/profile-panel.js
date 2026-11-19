// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

const WIDTH = 260,
  HEIGHT = 240,
  LEFT = 44,
  RIGHT = 10,
  TOP = 18,
  BOTTOM = 26;

/** SVG chart and summary for one sound-speed profile; depth increases downward. */
export function createSoundProfileMarkup(result, {longitude, latitude, seafloorDepth, frequency}) {
  const {levels, minimum, verticalLoss, truncated} = result;
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
  <p data-role="absorption">Absorption at ${kHz}: ${surface.absorption.toFixed(3)} dB/km at the surface, ${levels.at(-1).absorption.toFixed(3)} dB/km at ${Math.round(bottom)} m. One-way vertical loss to ${Math.round(bottom)} m: ${verticalLoss.toFixed(1)} dB.</p>
  ${truncated ? '<p>The profile data end above this seafloor.</p>' : ''}`;
}

export function renderSoundProfile(element, result, location) {
  element.innerHTML = createSoundProfileMarkup(result, location);
}
