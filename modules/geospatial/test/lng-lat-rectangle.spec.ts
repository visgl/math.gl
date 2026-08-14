import {test, expect} from 'vitest';
import {Vector3, toRadians, _MathUtils, equals} from '@math.gl/core';
import {LngLatRectangle} from '@math.gl/geospatial';

test('LngLatRectangle stores its bounds and computes its center and width', () => {
  const rectangle = new LngLatRectangle(
    toRadians(-20),
    toRadians(-10),
    toRadians(40),
    toRadians(30)
  );
  const result = new Vector3();

  expect(LngLatRectangle.center(rectangle, result), 'returns the supplied result').toBe(result);
  expect(equals(result, [toRadians(10), toRadians(10), 0], _MathUtils.EPSILON15)).toBe(true);
  expect(equals(rectangle.width, toRadians(60), _MathUtils.EPSILON15)).toBe(true);
});

test('LngLatRectangle handles a rectangle crossing the antimeridian', () => {
  const rectangle = new LngLatRectangle(
    toRadians(170),
    toRadians(-10),
    toRadians(-170),
    toRadians(10)
  );

  const center = LngLatRectangle.center(rectangle);
  expect(equals(Math.abs(center.x), Math.PI, _MathUtils.EPSILON15)).toBe(true);
  expect(equals([center.y, center.z], [0, 0])).toBe(true);
  expect(equals(rectangle.width, toRadians(20), _MathUtils.EPSILON15)).toBe(true);
});
