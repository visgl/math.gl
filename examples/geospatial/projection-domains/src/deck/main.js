// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {Deck, _CustomProjectionView as CustomProjectionView} from '@deck.gl/core';
import {PathLayer, ScatterplotLayer} from '@deck.gl/layers';

const projections = {
  albers: '+proj=aea +lat_1=29.5 +lat_2=45.5 +lat_0=23 +lon_0=-96 +datum=WGS84 +units=m',
  mercator: '+proj=merc +datum=WGS84 +units=m'
};
const cities = [
  {name: 'San Francisco', position: [-122.42, 37.77]},
  {name: 'New York', position: [-74.01, 40.71]},
  {name: 'Mexico City', position: [-99.13, 19.43]},
  {name: 'Vancouver', position: [-123.12, 49.28]}
];
const paths = [];
for (let longitude = -140; longitude <= -50; longitude += 10) {
  paths.push(Array.from({length: 51}, (_, i) => [longitude, i + 10]));
}
for (let latitude = 10; latitude <= 60; latitude += 10) {
  paths.push(Array.from({length: 91}, (_, i) => [i - 140, latitude]));
}
const status = document.querySelector('#status');
const select = document.querySelector('#projection');
const deck = new Deck({
  canvas: document.querySelector('#map'),
  views: new CustomProjectionView({id: 'projection', crs: projections.albers, controller: true}),
  initialViewState: {center: [-96, 38, 0], zoom: 3},
  layers: [
    new PathLayer({
      id: 'graticule',
      data: paths,
      getPath: path => path,
      coordinateSystem: 'wgs84',
      getColor: [90, 170, 210],
      getWidth: 1,
      widthUnits: 'pixels'
    }),
    new ScatterplotLayer({
      id: 'cities',
      data: cities,
      getPosition: city => city.position,
      coordinateSystem: 'wgs84',
      getFillColor: [255, 180, 80],
      getRadius: 6,
      radiusUnits: 'pixels',
      pickable: true
    })
  ],
  getTooltip: ({object}) => object?.name,
  onAfterRender: () => {
    status.textContent = 'Ready — coordinates projected by math.gl';
  },
  onError: error => {
    status.textContent = error.message;
  }
});
select.addEventListener('change', () => {
  status.textContent = 'Switching projection…';
  deck.setProps({
    views: new CustomProjectionView({
      id: 'projection',
      crs: projections[select.value],
      controller: true
    })
  });
});
window.addEventListener('pagehide', event => {
  if (!event.persisted) deck.finalize();
});
