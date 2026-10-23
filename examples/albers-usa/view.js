// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Page structure only; controls and drawing have separate modules. */
export function createView(app, {compact = false} = {}) {
  app.classList.add('albers-usa');
  app.classList.toggle('albers-usa-compact', compact);
  app.innerHTML = `<main class="shell">
  ${compact ? '' : '<header><div class="eyebrow">math.gl / projection lab</div><h1>Albers USA</h1><p>Eight independently projected regions. Explore the seams and insets.</p></header>'}
  <section class="workspace" aria-label="Interactive Albers USA map">
    <div class="map-wrap"><svg role="img" aria-label="U.S. states and territories in an Albers projection with seven insets"></svg></div>
    <aside><h2>View</h2><button class="view-toggle" type="button">View globe</button>
      <label class="unfold-control">Unfold <input id="unfold" type="range" min="0" max="100" value="100" aria-label="Unfold globe into Albers USA map" /></label>
      <div class="zoom-controls" aria-label="Map zoom controls"><button type="button" data-zoom="in" aria-label="Zoom in">+</button><button type="button" data-zoom="out" aria-label="Zoom out">−</button><button type="button" data-zoom="reset">Reset zoom</button></div>
      <h2>Coordinate inspector</h2><div class="readout" role="status" aria-live="polite">Move over the map to inspect coordinates</div><h2>Layers</h2>
      <label><input id="states" type="checkbox" checked /> State boundaries</label>
      <label><input id="grid" type="checkbox" /> Show graticule</label>
      <label><input id="frames" type="checkbox" /> Show inset frames</label>
      <div class="details"><h2>How it works</h2><p>The library clips each feature at the region seams, fits all eight regions to the viewport, and returns inverse candidates in visible draw order.</p>
      <p>Alaska is shown at 35% linear scale. The geographic masks include nearby ocean and land; they are not political borders.</p></div>
      <div class="credit">Insets: Puerto Rico (PR), U.S. Virgin Islands (VI), Guam (GU), Northern Mariana Islands (MP), American Samoa (AS).<br />Boundaries: <a href="https://www.naturalearthdata.com/about/terms-of-use/">Natural Earth</a> 1:10m, public domain.</div>
    </aside>
  </section>
</main>`;

  return {
    svg: app.querySelector('svg'),
    readout: app.querySelector('.readout'),
    viewToggle: app.querySelector('.view-toggle'),
    unfold: app.querySelector('#unfold'),
    zoomControls: app.querySelector('.zoom-controls'),
    layers: Object.fromEntries(
      ['states', 'grid', 'frames'].map(id => [id, app.querySelector(`#${id}`)])
    )
  };
}
