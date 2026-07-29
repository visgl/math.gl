import test from 'tape-promise/tape';
import {Vector3, toRadians, _MathUtils} from '@math.gl/core';
import {LngLatRectangle} from '@math.gl/geospatial';
import {tapeEquals, tapeEqualsEpsilon} from 'test/utils/tape-assertions';

test('LngLatRectangle stores its bounds and computes its center and width', (t) => {
  const rectangle = new LngLatRectangle(
    toRadians(-20),
    toRadians(-10),
    toRadians(40),
    toRadians(30)
  );
  const result = new Vector3();

  t.equals(LngLatRectangle.center(rectangle, result), result, 'returns the supplied result');
  tapeEqualsEpsilon(t, result, [toRadians(10), toRadians(10), 0], _MathUtils.EPSILON15);
  tapeEqualsEpsilon(t, rectangle.width, toRadians(60), _MathUtils.EPSILON15);
  t.end();
});

test('LngLatRectangle handles a rectangle crossing the antimeridian', (t) => {
  const rectangle = new LngLatRectangle(
    toRadians(170),
    toRadians(-10),
    toRadians(-170),
    toRadians(10)
  );

  const center = LngLatRectangle.center(rectangle);
  tapeEqualsEpsilon(t, Math.abs(center.x), Math.PI, _MathUtils.EPSILON15);
  tapeEquals(t, [center.y, center.z], [0, 0]);
  tapeEqualsEpsilon(t, rectangle.width, toRadians(20), _MathUtils.EPSILON15);
  t.end();
});
