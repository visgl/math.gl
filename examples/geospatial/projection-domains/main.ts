// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Renderer adapted from visgl/deck.gl PR #10966 (MIT).
import {Deck, OrthographicView, COORDINATE_SYSTEM} from '@deck.gl/core';
import {SolidPolygonLayer, PathLayer} from '@deck.gl/layers';
import {SimpleMeshLayer} from '@deck.gl/mesh-layers';
import {runTask, WorkerPool} from '@math.gl/core/tasks';
import {fixtureColumn, names} from './fixtures.ts';
import {createProjection} from './projections.ts';
import type {ProjectionName} from './projections.ts';
import {projectGeometry} from './pipeline.ts';
import {createRasterMesh} from './raster.ts';
import type {RasterKind} from './raster.ts';
import {mountInfoBox} from '../../common/info-box.js';
import {polygonProvenanceLayers,polygonProvenanceTooltip} from './polygon-provenance.ts';
import {pathProvenanceLayers,provenanceTooltip} from './path-provenance.ts';
import './style.css';

/** Each mount owns its worker pool, controls and renderer, including website navigation. */
export function mountProjectionDomains(root: HTMLElement) {
  root.innerHTML = `<section class="projection-domains"><div class="projection-map"></div><aside>
    <p data-pipeline>GeoArrow → math.gl worker → D3 stream → math.gl triangles → deck.gl.</p>
    <label>Projection<select data-projection><option value="equirectangular">Equirectangular / seam</option><option value="orthographic">Rotated hemisphere</option><option value="interrupted">Interrupted Mollweide</option><option value="path-provenance">Path provenance / continuous dashes</option><option value="polygon-provenance">Polygon boundary provenance / hole</option></select></label>
    <label>Raster<select data-raster><option value="world">360° image</option><option value="rotated">Rotated grid across 180°</option><option value="polar">South-pole-containing grid</option></select></label>
    <label><input type="checkbox" data-vertices checked> Show provenance vertices</label><label><input type="checkbox" data-generated> Show generated polygon boundaries</label><p>The white outline is the projected domain. Hover a polygon for its source row.</p></aside><output data-status aria-live="polite"></output></section>`;
  const status = root.querySelector<HTMLOutputElement>('output')!;
  const projectionSelect = root.querySelector<HTMLSelectElement>('[data-projection]')!;
  const rasterSelect = root.querySelector<HTMLSelectElement>('[data-raster]')!;
  const panelOptions = {title: 'Projection domains', theme: 'sleek-dark', width: 280};
  const disposeInfo = mountInfoBox(root.querySelector('aside'), panelOptions);
  const loadWorker = () => new Worker(new URL('./parse.worker.ts', import.meta.url), {type: 'module'});
  const pool = new WorkerPool({name: 'projection-domains', loadWorker, maxConcurrency: 1, maxQueuedJobs: 2});
  const task = {id: 'projection-domains', name: 'Projection domains', module: 'example', version: '1', options: {}, loadWorker, process: projectGeometry};
  const texture = document.createElement('canvas'); texture.width = texture.height = 256;
  const ctx = texture.getContext('2d')!;
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    ctx.fillStyle = (x + y) % 2 ? '#275d8e' : '#64b5b0'; ctx.fillRect(x * 32, y * 32, 32, 32);
    ctx.fillStyle = 'white'; ctx.fillText(`${x},${y}`, x * 32 + 3, y * 32 + 18);
  }
  let featureIds: Uint32Array = new Uint32Array(), generation = 0, active: AbortController | undefined;
  const deck = new Deck({parent: root.querySelector<HTMLDivElement>('.projection-map')!,
    views: new OrthographicView({flipY: true}), initialViewState: {target: [0, 0, 0], zoom: 0}, controller: true,
    getTooltip: ({index, layer,object}) => polygonProvenanceTooltip(object) || provenanceTooltip(object) || (index >= 0 && layer?.id === 'features' ? names[featureIds[index]] : null)});
  async function update() {
    const request = ++generation; active?.abort(); active = new AbortController();
    const provenanceMode=projectionSelect.value.endsWith('-provenance');
    rasterSelect.disabled=provenanceMode;
    root.querySelector('[data-vertices]')!.parentElement!.hidden=projectionSelect.value!=='path-provenance';
    root.querySelector('[data-generated]')!.parentElement!.hidden=projectionSelect.value!=='polygon-provenance';
    root.querySelector('[data-pipeline]')!.textContent=provenanceMode?'Native math.gl preparation → optional provenance buffers → deck.gl.':'GeoArrow → math.gl worker → D3 stream → math.gl triangles → deck.gl.';
    const name = projectionSelect.value as ProjectionName, kind = rasterSelect.value as RasterKind;
    if(projectionSelect.value==='polygon-provenance'){
      const demo=polygonProvenanceLayers(root.querySelector<HTMLInputElement>('[data-generated]')!.checked);
      deck.setProps({layers:demo.layers});status.textContent='Native math.gl polygon provenance: white original boundaries preserve the hole. Optional orange edges show generated closures; hover for edge class and source ring/segment.';
      root.dataset.ready='polygon-provenance';return;
    }
    if(projectionSelect.value==='path-provenance'){
      const demo=pathProvenanceLayers(root.querySelector<HTMLInputElement>('[data-vertices]')!.checked);
      deck.setProps({layers:demo.layers});status.textContent='Native math.gl provenance: dashes continue in source meters across cuts. Hover vertices for segment, t, distance and endpoint reason. White vertices are original; blue are generated. Color interpolates source timestamps at 0, 2, 5 and 9 hours.';
      root.dataset.ready='path-provenance';return;
    }
    status.textContent = 'Streaming geometry in a worker…';
    try {
      // A fresh native GeoArrow column per request; transfer consumes its backing buffers.
      const {features, domain} = await runTask(task, {column: fixtureColumn(), name}, {
        execution: 'worker', workerPool: pool, inputOwnership: 'transfer', signal: active.signal
      });
      if (request !== generation) return;
      const mesh = createRasterMesh(domain.mesh, createProjection(name), kind);
      featureIds = features.polygonSourceRows;
      const palette = [[255, 168, 70, 200], [220, 80, 120, 200], [160, 110, 240, 200]];
      const colors = new Uint8Array(features.sourceRowIndices.length * 4);
      features.sourceRowIndices.forEach((row, i) => colors.set(palette[row], i * 4));
      deck.setProps({layers: [
        new SimpleMeshLayer({id: 'raster', data: [0], mesh, texture,
          coordinateSystem: COORDINATE_SYSTEM.CARTESIAN, getPosition: [0, 0, 0], getColor: [255, 255, 255], material: false, parameters: {depthCompare: 'always'}}),
        new SolidPolygonLayer({id: 'features', _normalize: false,
          data: {length: featureIds.length, startIndices: features.polygonStarts,
            attributes: {getPolygon: {value: features.positions, size: 2}, indices: features.indices, getFillColor: {value: colors, size: 4}}},
          coordinateSystem: COORDINATE_SYSTEM.CARTESIAN, pickable: true, parameters: {depthCompare: 'always'}}),
        new PathLayer({id: 'domain', data: domain.rings, getPath: d => d,
          coordinateSystem: COORDINATE_SYSTEM.CARTESIAN, getColor: [225, 235, 245], getWidth: 2, widthUnits: 'pixels', parameters: {depthCompare: 'always'}})
      ]});
      status.textContent = `${features.polygonSourceRows.length} polygon pieces; ${features.indices.length / 3} vector triangles; ${mesh.indices.value.length / 3} raster triangles; ${mesh.unresolvedTriangles} unresolved singular triangles omitted.`;
      root.dataset.ready = `${name}/${kind}`;
    } catch (error) {if (request === generation) {status.textContent = `Failed: ${String(error)}`; root.dataset.error = String(error);}}
  }
  projectionSelect.addEventListener('change', update); rasterSelect.addEventListener('change', update);
  root.querySelector('[data-generated]')!.addEventListener('change',update);
  root.querySelector('[data-vertices]')!.addEventListener('change',update);
  void update();
  return async () => {
    generation++; active?.abort();
    projectionSelect.removeEventListener('change', update); rasterSelect.removeEventListener('change', update);
    disposeInfo(); deck.finalize(); root.replaceChildren();
    await pool.destroy();
  };
}
