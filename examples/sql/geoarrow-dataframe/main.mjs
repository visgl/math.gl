// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Deck, MapView} from '@deck.gl/core';
import {ScatterplotLayer} from '@deck.gl/layers';
import {Field, FixedSizeList, Float64, Int32, Schema, Table, vectorFromArray} from 'apache-arrow';
import {createProjectionEngine} from '@math.gl/geospatial/projection-core';
import {mercator} from '@math.gl/geospatial/projection-projections-merc';
import {GeoDataFrame} from '@math.gl/sql/dataframe';
import {processors} from './processors.mjs';

const engine = createProjectionEngine({projections: [mercator]});

/** Builds a deterministic native GeoArrow point fixture in Web Mercator meters. */
function makeProjectedPoints() {
  const project = engine.createProjection({from: 'EPSG:4326', to: 'EPSG:3857'});
  const ids = Array.from({length: 20000}, (_, index) => index);
  const point = new FixedSizeList(2, new Field('xy', new Float64()));
  const schema = new Schema([
    new Field('id', new Int32()),
    new Field('score', new Int32()),
    new Field(
      'geometry',
      point,
      true,
      new Map([
        ['ARROW:extension:name', 'geoarrow.point'],
        ['ARROW:extension:metadata', JSON.stringify({crs: 'EPSG:3857', crs_type: 'authority_code'})]
      ])
    )
  ]);
  return new Table(schema, {
    id: vectorFromArray(ids, new Int32()),
    score: vectorFromArray(
      ids.map(id => (id * 31) % 100),
      new Int32()
    ),
    geometry: vectorFromArray(
      ids.map(id => {
        const longitude = 179.91255 + (id % 160) * 0.0011;
        return project.projectSync([
          longitude >= 180 ? longitude - 360 : longitude,
          -16.07 + Math.floor(id / 160) * 0.0011
        ]);
      }),
      point
    )
  });
}

const source = GeoDataFrame.fromArrow(makeProjectedPoints());
const startReprojection = performance.now();
const input = source.toCRS('EPSG:4326', {engine}).toArrow();
const reprojection = document.querySelector('#reprojection');
reprojection.textContent =
  'EPSG:3857 → EPSG:4326 · ' + (performance.now() - startReprojection).toFixed(1) + ' ms';
const minimum = document.querySelector('#minimum');
const processor = document.querySelector('#processor');
const result = document.querySelector('#result');
for (const name of Object.keys(processors)) {
  processor.add(new Option(name));
}

let updatePending = false;

/** Coalesces camera changes and reads the viewport after deck.gl applies the view state. */
function scheduleUpdate() {
  if (updatePending) return;
  updatePending = true;
  requestAnimationFrame(() => {
    updatePending = false;
    if (deck.isInitialized) update();
  });
}

const deck = new Deck({
  canvas: 'map',
  views: new MapView({repeat: true}),
  controller: true,
  initialViewState: {longitude: 180, latitude: -16, zoom: 10, minZoom: 1},
  onLoad: scheduleUpdate,
  onResize: scheduleUpdate,
  onViewStateChange: scheduleUpdate
});

/** Uploads the retained GeoArrow coordinate buffers using deck.gl binary attributes. */
function update() {
  const viewport = deck.getViewports()[0];
  if (!viewport) return;
  const bounds = viewport.getBounds();
  const parameters = {minimum: Number(minimum.value)};
  const start = performance.now();
  const table = processors[processor.value](input, parameters, bounds);
  const elapsed = performance.now() - start;
  result.textContent = `${table.numRows.toLocaleString()} points · ${elapsed.toFixed(1)} ms processing`;
  deck.setProps({
    layers: table.batches.map((batch, index) => {
      // Arrow slices the fixed-size-list child values view to its logical start.
      // Limit the borrowed view to the batch length, since backing buffers can be padded.
      const {values} = batch.getChild('geometry').data[0].children[0];
      const positions = values.subarray(0, batch.numRows * 2);
      const ids = batch.getChild('id');
      const radii = batch.getChild('radius');
      return new ScatterplotLayer({
        id: `points-${index}`,
        data: {
          length: batch.numRows,
          attributes: {getPosition: {value: positions, size: 2}}
        },
        getRadius: (_, {index: row}) => radii.get(row),
        getFillColor: [91, 220, 196, 170],
        radiusMinPixels: 1,
        pickable: true,
        onClick: info => {
          if (info.index >= 0) result.textContent = `Point ${ids.get(info.index)}`;
        }
      });
    })
  });
}

minimum.addEventListener('input', scheduleUpdate);
processor.addEventListener('change', scheduleUpdate);
