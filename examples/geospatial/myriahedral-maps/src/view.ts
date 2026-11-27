// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const markup = `
<main class="myriahedral-map">
  <header><a href="https://math.gl">math.gl / geography</a><span>Experimental · v5.0</span></header>
  <section>
    <div class="intro">
      <p class="eyebrow">A GLOBE IN THOUSANDS OF PIECES</p>
      <h2>Myriahedral maps</h2>
      <p>Explore how the oceans can open while land stays joined.</p>
    </div>
    <select id="solid" aria-label="Solid" hidden><option value="icosahedron">Icosahedron</option></select>
    <div class="unfolding-layout">
      <div class="selectors">
        <label for="subdivision">Resolution</label>
        <select id="subdivision">
          <option value="0">Coarse · 15° grid / solid</option>
          <option value="1">Medium · 7.5° grid / subdivision 1</option>
          <option value="2" selected>Fine · 5° grid / subdivision 2</option>
          <option value="3">Finest · 3.75° grid / subdivision 3</option>
        </select>
        <label for="cuts">Projection preset</label>
        <select id="cuts">
          <optgroup label="Graticule">
            <option value="sealine" selected>Sealine · preserve land joins</option>
            <option value="coastline">Coastline · preserve ocean joins</option>
            <option value="cylindric">Cylindric · meridian strips</option>
            <option value="polyconic">Polyconic · latitude strips</option>
            <option value="azimuthal">Azimuthal · north polar</option>
            <option value="hemispheres">Hemispheres · two polar nets</option>
          </optgroup>
          <optgroup label="Polyhedral / recursive subdivision">
            <option value="solid:tetrahedron">Tetrahedron</option>
            <option value="solid:cube">Cube</option>
            <option value="solid:octahedron">Octahedron</option>
            <option value="solid:dodecahedron">Dodecahedron</option>
            <option value="solid:icosahedron">Icosahedron</option>
          </optgroup>
        </select>
        <button id="recut" type="button">Alternate layout</button>
        <input id="earth" type="checkbox" checked hidden />
        <label for="surface">Surface</label>
        <select id="surface"><option value="land">Land / ocean</option><option value="earth">NASA Blue Marble</option></select>
        <label class="unfolding-check"><input id="edges" type="checkbox" checked /> Show edges</label>
        <div class="unfolding-statistics">
          <p id="summary" class="hint" aria-live="polite"></p>
          <p id="cut-summary" aria-live="polite"></p>
          <p id="notice" aria-live="polite"></p>
          <p>Independent implementation using the reusable myriahedral projection API, a maximum-weight hinge tree,
            and public-domain Natural Earth geography. Land joins are preferred, not guaranteed. Flat nets may overlap.</p>
        </div>
      </div>
      <div class="unfolding-view">
        <canvas aria-label="Interactive Earth with thousands of hinged facets">WebGL 2 is required.</canvas>
        <footer>
          <div class="controls">
            <button id="globe" type="button" aria-pressed="true">Globe</button>
            <input id="unfold" type="range" aria-label="Unfolding" min="0" max="100" step="0.1" value="0" />
            <button id="flat" type="button" aria-pressed="false">Flat</button>
          </div>
        </footer>
        <p class="hint"><span id="surface-status">Land / ocean: Natural Earth (public domain)</span><span id="imagery-status" aria-live="polite"></span> · <a href="https://www.nasa.gov/nasa-brand-center/images-and-media/">Imagery usage</a></p>
      </div>
    </div>
  </section>
</main>`;
