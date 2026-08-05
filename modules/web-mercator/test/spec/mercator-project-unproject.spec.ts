import {test, expect} from 'vitest';
import {WebMercatorViewport} from '@math.gl/web-mercator';
import {config, equals} from '@math.gl/core';

const viewportProps = {
  latitude: 37.75,
  longitude: -122.43,
  zoom: 11.5,
  pitch: 30,
  bearing: 0,
  width: 800,
  height: 600
};

const TEST_CASES = [
  {
    title: 'project (center)',
    func: 'project',
    input: [-122.43, 37.75],
    expected: [400, 300]
  },
  {
    title: 'unproject (center)',
    func: 'unproject',
    input: [400, 300],
    expected: [-122.43, 37.75]
  },
  {
    title: 'project (corner)',
    func: 'project',
    input: [-122.55, 37.83],
    expected: [-1.329741801625046, 6.796120915775314]
  },
  {
    title: 'unproject (corner)',
    func: 'unproject',
    input: [0, 0],
    expected: [-122.55024809579456, 37.832294933238586]
  }
];

test('Viewport constructor', () => {
  const viewport = new WebMercatorViewport(viewportProps);

  expect(viewport, 'Viewport construction successful').toBeTruthy();

  const viewportState = {};
  Object.keys(viewportProps).forEach(key => {
    viewportState[key] = viewport[key];
  });

  expect(viewportState, 'Viewport props assigned').toEqual(viewportProps);
});

test('Viewport projection', () => {
  config.EPSILON = 1e-7;
  const viewport = new WebMercatorViewport(viewportProps);
  TEST_CASES.forEach(({title, func, input, expected}) => {
    const output = viewport[func](input);
    expect(equals(output, expected), `viewport.${func}(${title})`).toBeTruthy();
  });
});

test('Viewport projection#topLeft', () => {
  const viewport = new WebMercatorViewport(viewportProps);

  const topLeft = viewport.unproject([0, 0], {topLeft: true});
  const bottomLeft = viewport.unproject([0, viewport.height], {topLeft: true});

  expect(
    topLeft[1] > bottomLeft[1],
    'topLeft latitude is north of bottomLeft latitude'
  ).toBeTruthy();

  const topLeft2 = viewport.unproject([0, viewport.height], {topLeft: false});
  const bottomLeft2 = viewport.unproject([0, 0], {topLeft: false});

  expect(topLeft, 'topLeft true/false match').toEqual(topLeft2);
  expect(bottomLeft, 'bottomLeft true/false match').toEqual(bottomLeft2);
});
