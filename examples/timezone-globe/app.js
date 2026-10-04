// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Deck, _GlobeView as GlobeView} from '@deck.gl/core';
import {GeoJsonLayer, SolidPolygonLayer} from '@deck.gl/layers';
import {getTimezoneOffset, getTimezoneLabel, isTimezoneSupported} from '@math.gl/timezone';

let nextInstance = 0;

/** Mounts a globe in its own container and returns its cleanup function. */
export function mountTimezoneGlobe(root, {lowUrl, hiUrl}) {
  const instanceId = 'timezone-globe-' + nextInstance++;
  root.innerHTML = `    <canvas data-role="globe" aria-label="Interactive timezone globe"></canvas>
    <aside>
      <h1>One globe, many clocks</h1>
      <p>Drag to rotate. Scroll to zoom. Hover to see local time.</p>
      <label for="${instanceId}-day">Date at 12:00 UTC <output data-role="date"></output></label>
      <input data-role="day" id="${instanceId}-day" type="range" min="0" max="364" value="0" />
      <label for="${instanceId}-resolution">Geometry</label>
      <select data-role="resolution" id="${instanceId}-resolution">
        <option value="low">Low · whole globe</option>
        <option value="hi">High · closer look</option>
      </select>
      <p data-role="status" role="status">Loading timezone boundaries…</p>
      <div class="legend"></div>
      <div class="legend-labels">
        <span>UTC−12</span><span>UTC</span><span>UTC+14</span>
      </div>
      <p class="credits">
        Approximate boundaries ©
        <a href="https://www.openstreetmap.org/copyright"
          >OpenStreetMap contributors</a
        >, via
        <a href="https://github.com/evansiroky/timezone-boundary-builder"
          >Timezone Boundary Builder</a
        >. <a href="https://opendatacommons.org/licenses/odbl/1-0/">ODbL</a>.
      </p>
    </aside>
`;
  const day = root.querySelector('[data-role="day"]');
  const resolution = root.querySelector('[data-role="resolution"]');
  const status = root.querySelector('[data-role="status"]');
  const year = new Date().getUTCFullYear();
  const start = Date.UTC(year, 0, 1, 12);
  const dayCount = (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86400000;
  day.max = String(dayCount - 1);
  day.value = String(Math.floor((Date.now() - Date.UTC(year, 0, 1)) / 86400000));
  let instant;
  let data;
  let offsets = new Map();
  let request = 0;
  const cache = new Map();
  const abort = new AbortController();

  // A fixed offset-to-hue scale shared with the legend, including half/quarter hours.
  function color(offset) {
    if (offset === null) return [110, 120, 130, 255];
    const hue = ((1 - (offset + 720) / 1560) * 240) / 60;
    const chroma = 0.65 * (1 - Math.abs(2 * 0.55 - 1));
    const x = chroma * (1 - Math.abs((hue % 2) - 1));
    const channels =
      hue < 1
        ? [chroma, x, 0]
        : hue < 2
          ? [x, chroma, 0]
          : hue < 3
            ? [0, chroma, x]
            : [0, x, chroma];
    return [...channels.map(value => Math.round((value + 0.55 - chroma / 2) * 255)), 255];
  }

  const deck = new Deck({
    canvas: root.querySelector('[data-role="globe"]'),
    parent: root,
    views: new GlobeView({id: 'globe', controller: true, resolution: 3}),
    initialViewState: {
      longitude: -25,
      latitude: 25,
      zoom: 1.5,
      minZoom: -1,
      maxZoom: 8
    },
    getTooltip: ({object}) => {
      if (!object) return null;
      const tzid = object.properties.tzid;
      const offset = offsets.get(tzid);
      if (offset === null) return {text: `${tzid}\nTimezone unavailable in this browser`};
      const sign = offset < 0 ? '−' : '+';
      const absolute = Math.abs(offset);
      const utc = `UTC${sign}${String(Math.floor(absolute / 60)).padStart(2, '0')}:${String(absolute % 60).padStart(2, '0')}`;
      const local = new Intl.DateTimeFormat(undefined, {
        timeZone: tzid,
        dateStyle: 'medium',
        timeStyle: 'medium'
      }).format(instant);
      return {
        text: `${tzid}\n${utc} · ${getTimezoneLabel(tzid, instant)}\n${local}`
      };
    }
  });

  function render() {
    instant = start + Number(day.value) * 86400000;
    root.querySelector('[data-role="date"]').textContent = new Date(instant)
      .toISOString()
      .slice(0, 10);
    offsets = new Map(
      (data?.features || []).map(feature => {
        const tzid = feature.properties.tzid;
        return [tzid, isTimezoneSupported(tzid) ? getTimezoneOffset(tzid, instant) : null];
      })
    );
    deck.setProps({
      layers: [
        new SolidPolygonLayer({
          id: 'earth',
          data: [
            [
              [-180, 90],
              [0, 90],
              [180, 90],
              [180, -90],
              [0, -90],
              [-180, -90]
            ]
          ],
          getPolygon: polygon => polygon,
          getFillColor: [25, 40, 55],
          pickable: false
        }),
        new GeoJsonLayer({
          id: 'timezones',
          data,
          pickable: true,
          autoHighlight: true,
          filled: true,
          stroked: true,
          getLineColor: [15, 25, 40, 180],
          lineWidthMinPixels: 0.5,
          getFillColor: feature => color(offsets.get(feature.properties.tzid)),
          updateTriggers: {getFillColor: instant}
        })
      ]
    });
  }

  async function loadGeometry() {
    const token = ++request;
    const level = resolution.value;
    status.textContent = 'Loading timezone boundaries…';
    try {
      if (!cache.has(level)) {
        const response = await fetch(level === 'low' ? lowUrl : hiUrl, {signal: abort.signal});
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        cache.set(level, await response.json());
      }
      if (token !== request) return;
      data = cache.get(level);
      render();
      status.textContent = `${data.features.length} regions · ${year}`;
    } catch (error) {
      if (token === request) status.textContent = `Could not load geometry: ${error.message}`;
    }
  }
  day.addEventListener('input', render);
  resolution.addEventListener('change', loadGeometry);
  render();
  loadGeometry();
  return () => {
    request++;
    abort.abort();
    day.removeEventListener('input', render);
    resolution.removeEventListener('change', loadGeometry);
    deck.finalize();
    root.replaceChildren();
  };
}
