// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createCoordinateTooltip} from '../../../common/coordinate-tooltip.js';

/** Page structure only; controls and drawing have separate modules. */
export function createView(app, {compact = false} = {}) {
  app.classList.add('albers-usa');
  app.classList.toggle('albers-usa-compact', compact);
  app.innerHTML = `<main class="shell">
  ${compact ? '' : '<header><div class="eyebrow">math.gl / projection lab</div><h1>Albers USA</h1><p>Eight independently projected regions. Explore the seams and insets.</p></header>'}
  <section class="workspace" aria-label="Interactive Albers USA map">
    <div class="map-wrap">
      <svg role="img" aria-label="U.S. states and territories in an Albers projection with seven insets"></svg>
    <aside class="layer-controls">
      <label><input id="states" type="checkbox" checked /> State boundaries</label>
      <label><input id="grid" type="checkbox" /> Show graticule</label>
      <label><input id="frames" type="checkbox" /> Show inset frames</label>
      <details class="details"><summary>How it works</summary><p>The library clips each feature at the region seams, fits all eight regions to the viewport, and returns inverse candidates in visible draw order.</p>
      <p>Alaska is shown at 35% linear scale. The geographic masks include nearby ocean and land; they are not political borders.</p>
      <div class="credit">Insets: Puerto Rico (PR), U.S. Virgin Islands (VI), Guam (GU), Northern Mariana Islands (MP), American Samoa (AS).<br />Boundaries: <a href="https://www.naturalearthdata.com/about/terms-of-use/">Natural Earth</a> 1:10m, public domain.</div>
      </details>
    </aside>
      <div class="zoom-controls" role="group" aria-label="Map zoom controls">
        <button type="button" data-zoom="in" aria-label="Zoom in" title="Zoom in"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14" /></svg></button>
        <button type="button" data-zoom="out" aria-label="Zoom out" title="Zoom out"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14" /></svg></button>
        <button type="button" data-zoom="reset" aria-label="Reset zoom" title="Reset zoom"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 15-6-6 6-6M3 9h12a6 6 0 0 1 0 12h-3" /></svg></button>
      </div>
    </div>
    <div class="slider-row"><div class="unfold-panel">
      <div class="unfold-control" role="group" aria-label="Map unfolding">
        <button type="button" data-unfold="globe" aria-pressed="false">Globe</button>
        <input id="unfold" type="range" min="0" max="100" value="100" aria-label="Unfold globe into Albers USA map" />
        <button type="button" data-unfold="unfolded" aria-pressed="true">Unfolded</button>
      </div>
    </div></div>
  </section>
</main>`;

  return {
    svg: app.querySelector('.map-wrap > svg'),
    tooltip: createCoordinateTooltip(app.querySelector('.map-wrap')),
    globeButton: app.querySelector('[data-unfold="globe"]'),
    unfoldedButton: app.querySelector('[data-unfold="unfolded"]'),
    unfold: app.querySelector('#unfold'),
    zoomControls: app.querySelector('.zoom-controls'),
    layers: Object.fromEntries(
      ['states', 'grid', 'frames'].map(id => [id, app.querySelector(`#${id}`)])
    )
  };
}
