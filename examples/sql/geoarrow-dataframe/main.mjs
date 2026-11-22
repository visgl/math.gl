// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Deck} from '@deck.gl/core';
import {ScatterplotLayer} from '@deck.gl/layers';
import {Field, FixedSizeList, Float64, Int32, Schema, Table, vectorFromArray} from 'apache-arrow';
import {processors} from './processors.mjs';

/** Builds a deterministic native GeoArrow point fixture with stable IDs. */
function makePoints() {
  const ids = Array.from({length: 20000}, (_, index) => index);
  const point = new FixedSizeList(2, new Field('xy', new Float64()));
  const schema = new Schema([
    new Field('id', new Int32()),
    new Field('score', new Int32()),
    new Field('geometry', point, true, new Map([['ARROW:extension:name', 'geoarrow.point']]))
  ]);
  return new Table(schema, {
    id: vectorFromArray(ids, new Int32()),
    score: vectorFromArray(
      ids.map(id => (id * 31) % 100),
      new Int32()
    ),
    geometry: vectorFromArray(
      ids.map(id => [-122.515 + (id % 160) * 0.0011, 37.69 + Math.floor(id / 160) * 0.0011]),
      point
    )
  });
}

const input = makePoints();
const minimum = document.querySelector('#minimum');
const processor = document.querySelector('#processor');
const result = document.querySelector('#result');
for (const name of Object.keys(processors)) {
  processor.add(new Option(name));
}

const deck = new Deck({
  canvas: 'map',
  controller: true,
  initialViewState: {longitude: -122.43, latitude: 37.76, zoom: 11}
});

/** Uploads the retained GeoArrow coordinate buffers using deck.gl binary attributes. */
function update() {
  const parameters = {minimum: Number(minimum.value)};
  const start = performance.now();
  const table = processors[processor.value](input, parameters);
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

minimum.addEventListener('input', update);
processor.addEventListener('change', update);
update();
