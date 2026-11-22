// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Deck, MapView} from '@deck.gl/core';
import {ScatterplotLayer} from '@deck.gl/layers';
import {
  Field,
  FixedSizeList,
  Float64,
  Int32,
  List,
  Schema,
  Table,
  Utf8,
  vectorFromArray
} from 'apache-arrow';
import {createProjectionEngine} from '@math.gl/geospatial/projection-core';
import {mercator} from '@math.gl/geospatial/projection-projections-merc';
import {ST_WITHIN} from '@math.gl/geospatial/st-functions';
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

/** Defines adjacent demonstration regions as planar polygons split at the seam. */
function makeRegions() {
  const xy = new FixedSizeList(2, new Field('xy', new Float64()));
  const polygon = new List(new Field('rings', new List(new Field('vertices', xy))));
  const schema = new Schema([
    new Field('name', new Utf8()),
    new Field(
      'boundary',
      polygon,
      true,
      new Map([
        ['ARROW:extension:name', 'geoarrow.polygon'],
        ['ARROW:extension:metadata', JSON.stringify({crs: 'EPSG:4326', crs_type: 'authority_code'})]
      ])
    )
  ]);
  const boundaries = [
    [179.9, 180],
    [-180, -179.9]
  ].map(([west, east]) => [
    [
      [west, -16.08],
      [east, -16.08],
      [east, -15.92],
      [west, -15.92],
      [west, -16.08]
    ]
  ]);
  return GeoDataFrame.fromArrow(
    new Table(schema, {
      name: vectorFromArray(['East of 180°W', 'West of 180°E'], new Utf8()),
      boundary: vectorFromArray(boundaries, polygon)
    })
  );
}

const source = GeoDataFrame.fromArrow(makeProjectedPoints());
const startReprojection = performance.now();
const geographic = source.toCRS('EPSG:4326', {engine});
const reprojection = document.querySelector('#reprojection');
reprojection.textContent =
  'EPSG:3857 → EPSG:4326 · ' + (performance.now() - startReprojection).toFixed(1) + ' ms';
const startJoin = performance.now();
const input = geographic
  .sjoin(makeRegions(), {predicate: ST_WITHIN, rightPrefix: 'region_'})
  .select('id', 'score', 'geometry', 'region_name')
  .toArrow();
document.querySelector('#spatial-join').textContent =
  'Point-in-polygon join · ' + (performance.now() - startJoin).toFixed(1) + ' ms';
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
      const regions = batch.getChild('region_name');
      return new ScatterplotLayer({
        id: `points-${index}`,
        data: {
          length: batch.numRows,
          attributes: {getPosition: {value: positions, size: 2}}
        },
        getRadius: (_, {index: row}) => radii.get(row),
        getFillColor: (_, {index: row}) =>
          regions.get(row) === 'East of 180°W' ? [91, 220, 196, 170] : [251, 174, 102, 180],
        radiusMinPixels: 1,
        pickable: true,
        onClick: info => {
          if (info.index >= 0)
            result.textContent = `Point ${ids.get(info.index)} · ${regions.get(info.index)}`;
        }
      });
    })
  });
}

minimum.addEventListener('input', scheduleUpdate);
processor.addEventListener('change', scheduleUpdate);
