import {test, expect} from 'vitest';
import {WebMercatorViewport} from '@math.gl/web-mercator';
import {equals, config} from '@math.gl/core';

import VIEWPORT_PROPS from '../utils/sample-viewports';

test('WebMercatorViewport#imports', () => {
  expect(WebMercatorViewport, 'WebMercatorViewport import ok').toBeTruthy();
});

test('WebMercatorViewport#constructor', () => {
  expect(
    new WebMercatorViewport() instanceof WebMercatorViewport,
    'Created new WebMercatorViewport with default args'
  ).toBeTruthy();
});

test('WebMercatorViewport#constructor - 0 width/height', () => {
  const viewport = new WebMercatorViewport(
    Object.assign({}, VIEWPORT_PROPS.flat, {
      width: 0,
      height: 0
    })
  );
  expect(
    viewport instanceof WebMercatorViewport,
    'WebMercatorViewport constructed successfully with 0 width and height'
  ).toBeTruthy();
});

test('WebMercatorViewport#constructor - camera offset', () => {
  const viewport = new WebMercatorViewport(
    Object.assign({}, VIEWPORT_PROPS.flat, {
      position: [0, 0, 300]
    })
  );
  expect(
    viewport.center[2],
    'WebMercatorViewport constructed successfully with camera offset'
  ).toBeTruthy();
});

test('WebMercatorViewport#equals', () => {
  // TODO - fix types
  const viewport1 = new WebMercatorViewport(VIEWPORT_PROPS.flat);
  const viewport2 = new WebMercatorViewport(VIEWPORT_PROPS.flat);
  const viewport3 = new WebMercatorViewport(Object.assign({}, VIEWPORT_PROPS.flat, {height: 33}));

  expect(viewport1.equals(viewport1), 'Viewport equality correct').toBeTruthy();
  expect(viewport1.equals(viewport2), 'Viewport equality correct').toBeTruthy();
  expect(viewport1.equals(viewport3), 'Viewport equality correct').toBeFalsy();
});

test('WebMercatorViewport.projectFlat', () => {
  config.EPSILON = 1e-6;

  for (const vc in VIEWPORT_PROPS) {
    const viewport = new WebMercatorViewport(VIEWPORT_PROPS[vc]);
    for (const tc in VIEWPORT_PROPS) {
      const {longitude, latitude} = VIEWPORT_PROPS[tc];
      const lnglatIn = [longitude, latitude];
      const xy = viewport.projectFlat(lnglatIn);
      const lnglat = viewport.unprojectFlat(xy);
      console.log(`Comparing [${lnglatIn}] to [${lnglat}]`);
      expect(equals(lnglatIn, lnglat)).toBeTruthy();
    }
  }
});

test('WebMercatorViewport.project#3D', () => {
  config.EPSILON = 1e-6;

  for (const vc in VIEWPORT_PROPS) {
    const viewport = new WebMercatorViewport(VIEWPORT_PROPS[vc]);
    for (const tc in VIEWPORT_PROPS) {
      const {longitude, latitude} = VIEWPORT_PROPS[tc];
      const lnglatZIn = [longitude, latitude, 100];
      const [x, y, z] = viewport.project(lnglatZIn);
      const lnglatZ1 = viewport.unproject([x, y, z]);
      const lnglatZ2 = viewport.unproject([x, y], {targetZ: 100});
      console.log(`Comparing [${lnglatZIn}] to [${lnglatZ1}] & [${lnglatZ2}]`);
      expect(equals(lnglatZIn, lnglatZ1), 'unproject with pixel depth').toBeTruthy();
      expect(equals(lnglatZIn, lnglatZ2), 'unproject with target Z').toBeTruthy();
    }
  }
});

test('WebMercatorViewport.project#2D', () => {
  config.EPSILON = 1e-6;

  for (const vc in VIEWPORT_PROPS) {
    const viewport = new WebMercatorViewport(VIEWPORT_PROPS[vc]);
    for (const tc in VIEWPORT_PROPS) {
      const {longitude, latitude} = VIEWPORT_PROPS[tc];
      const lnglatIn = [longitude, latitude];

      let xy = viewport.project(lnglatIn, {topLeft: true});
      let lnglat = viewport.unproject(xy, {topLeft: true});
      console.log(`Comparing [${lnglatIn}] to [${lnglat}]`);
      expect(equals(lnglatIn, lnglat), 'project with top-left coordinates').toBeTruthy();

      xy = viewport.project(lnglatIn, {topLeft: false});
      lnglat = viewport.unproject(xy, {topLeft: false});
      console.log(`Comparing [${lnglatIn}] to [${lnglat}]`);
      expect(equals(lnglatIn, lnglat), 'project with bottom-left coordinates').toBeTruthy();
    }
  }
});

test('WebMercatorViewport.getLocationAtPoint', () => {
  config.EPSILON = 1e-6;
  const TEST_POS = [200, 200];

  for (const vc in VIEWPORT_PROPS) {
    const viewport = new WebMercatorViewport(VIEWPORT_PROPS[vc]);
    for (const tc in VIEWPORT_PROPS) {
      const lngLat = [VIEWPORT_PROPS[tc].longitude, VIEWPORT_PROPS[tc].latitude];

      const [newLng, newLat] = viewport.getLocationAtPoint({lngLat, pos: TEST_POS});

      const newViewport = new WebMercatorViewport(
        Object.assign({}, VIEWPORT_PROPS[vc], {
          longitude: newLng,
          latitude: newLat
        })
      );

      const xy = newViewport.project(lngLat);

      console.log(`Comparing [${TEST_POS}] to [${xy}]`);
      expect(equals(TEST_POS, xy)).toBeTruthy();
    }
  }
});
