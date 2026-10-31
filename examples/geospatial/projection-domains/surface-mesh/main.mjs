// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {Deck, OrbitView, COORDINATE_SYSTEM} from '@deck.gl/core';
import {PolygonLayer, PathLayer, ScatterplotLayer} from '@deck.gl/layers';
import {mountInfoBox} from '../../../common/info-box.js';
import {prepareSurfacePatch, evaluateSurfacePatch, pickSurfacePatch} from './recipe.mjs';
import '../style.css';
export function mountSurfaceMesh(root) {
  root.innerHTML = `<section class="projection-domains"><div class="projection-map"></div><aside><p>A pre-triangulated geographic patch keeps original-source barycentric ancestry through two refinement stages. Surface colors interpolate explicitly; categories stay flat.</p><label>Flat → globe patch<input data-pose type="range" min="0" max="1" step="0.01" value="0.7"></label><label><input data-walls type="checkbox" checked> Show source-boundary walls</label><label><input data-normals type="checkbox"> Show posed normals</label><p>White boundaries are real source edges. Orange coverage and purple computational joins never create side walls. Hover triangles to inspect original triangle identity.</p><p>The base morph qualifies only this convex XY graph with linear vertex trajectories. Extrusion is a static illustration. Global globe morphs, changing topology, smooth-surface error and arbitrary extrusion remain unqualified.</p></aside><output data-status aria-live="polite"></output></section>`;
  const disposeInfo = mountInfoBox(root.querySelector('aside'), {
    title: 'Prepared surface provenance',
    theme: 'sleek-dark',
    width: 300
  });
  const mesh = prepareSurfacePatch(),
    deck = new Deck({
      parent: root.querySelector('.projection-map'),
      views: new OrbitView({orbitAxis: 'Z'}),
      initialViewState: {target: [0, 0, -30], rotationX: 25, rotationOrbit: 0, zoom: 0},
      controller: true,
      getTooltip: ({object}) =>
        object?.sourceTriangle !== undefined
          ? `Source triangle ${object.sourceTriangle}; temperature ${object.temperature.toFixed(2)}; category 7`
          : null
    });
  const pose = root.querySelector('[data-pose]'),
    walls = root.querySelector('[data-walls]'),
    normals = root.querySelector('[data-normals]');
  function update() {
    try {
      const amount = Number(pose.value),
        frame = evaluateSurfacePatch(mesh, amount, walls.checked ? 0.04 : 0),
        point = id => Array.from(frame.positions.slice(id * 3, id * 3 + 3), v => v * 700),
        triangles = [],
        view = new DataView(mesh.attributes.buffer);
      for (let i = 0; i < mesh.indices.length; i += 3) {
        const ids = Array.from(mesh.indices.slice(i, i + 3)),
          temperature = ids.reduce((s, id) => s + view.getFloat64(id * 16, true), 0) / 3;
        triangles.push({
          polygon: ids.map(point),
          sourceTriangle: mesh.sourceTriangles[i / 3],
          temperature,
          color: [60 + temperature * 10, 180 - temperature * 5, 220 - temperature * 7]
        });
      }
      const paths = frame.boundary.map(({a, b, kind}) => ({
        path: [point(a), point(b)],
        color:
          kind === 'source'
            ? [245, 245, 245]
            : kind === 'coverage'
              ? [255, 160, 50]
              : [190, 110, 255]
      }));
      if (normals.checked)
        for (let i = 0; i < mesh.flat.length / 3; i += 4) {
          const p = point(i);
          paths.push({
            path: [p, p.map((v, k) => v + frame.normals[i * 3 + k] * 25)],
            color: [80, 255, 150]
          });
        }
      const hit = pickSurfacePatch(mesh, frame, [0, 0, 2], [0, 0, -1]);
      deck.setProps({
        layers: [
          new PolygonLayer({
            id: 'surface-triangles',
            data: triangles,
            getPolygon: d => d.polygon,
            getFillColor: d => d.color,
            stroked: false,
            pickable: true,
            coordinateSystem: COORDINATE_SYSTEM.CARTESIAN
          }),
          new PolygonLayer({
            id: 'surface-source-walls',
            data: frame.walls,
            getPolygon: p => p.map(q => q.map(v => v * 700)),
            getFillColor: [80, 120, 170],
            stroked: false,
            coordinateSystem: COORDINATE_SYSTEM.CARTESIAN
          }),
          new PathLayer({
            id: 'surface-boundaries',
            data: paths,
            getPath: d => d.path,
            getColor: d => d.color,
            getWidth: 2,
            widthUnits: 'pixels',
            coordinateSystem: COORDINATE_SYSTEM.CARTESIAN
          }),
          new ScatterplotLayer({
            id: 'surface-ray-hit',
            data: hit ? [hit.position.map(v => v * 700)] : [],
            getPosition: p => p,
            getRadius: 5,
            radiusUnits: 'pixels',
            getFillColor: [255, 80, 80],
            coordinateSystem: COORDINATE_SYSTEM.CARTESIAN
          })
        ]
      });
      root.querySelector('[data-status]').textContent =
        `${mesh.indices.length / 3} triangles; ${mesh.flat.length / 3} vertices; continuous base qualification: ${mesh.qualification.scope}; ${frame.walls.length} source walls; center ray source ${hit ? hit.sourcePosition.map(v => v.toFixed(4)).join(', ') : 'miss'}. Shared topology; posed normals and ray intersections recomputed.`;
      root.dataset.ready = 'surface';
      delete root.dataset.error;
    } catch (error) {
      root.dataset.error = String(error);
      root.querySelector('[data-status]').textContent = String(error);
    }
  }
  for (const input of [pose, walls, normals]) input.addEventListener('input', update);
  update();
  return async () => {
    for (const input of [pose, walls, normals]) input.removeEventListener('input', update);
    deck.finalize();
    disposeInfo();
    root.replaceChildren();
  };
}
