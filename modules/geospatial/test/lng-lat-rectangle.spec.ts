import test from 'tape-promise/tape';
import {LngLatRectangle} from '@math.gl/geospatial';

test('LngLatRectangle', (t) => {
  t.ok(new LngLatRectangle(0, 0, 0, 0));
  t.end();
});
