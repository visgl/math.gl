# LngLatRectangle

A longitude-latitude rectangle on an ellipsoid. Angular values are stored in radians.

## Usage

```js
import {toRadians} from '@math.gl/core';
import {LngLatRectangle} from '@math.gl/geospatial';

const rectangle = new LngLatRectangle(
  toRadians(170),
  toRadians(-10),
  toRadians(-170),
  toRadians(10)
);

const center = LngLatRectangle.center(rectangle);
```

Because `east` is smaller than `west`, this example crosses the antimeridian and has a width of
20 degrees.

## Fields

### west : Number

The westernmost longitude in radians.

### south : Number

The southernmost latitude in radians.

### east : Number

The easternmost longitude in radians.

### north : Number

The northernmost latitude in radians.

### width : Number

The rectangle width in radians, accounting for antimeridian crossing.

## Methods

### constructor(west : Number, south : Number, east : Number, north : Number)

Creates a longitude-latitude rectangle.

### LngLatRectangle.center(rectangle : LngLatRectangle, result? : Vector3) : Vector3

Computes the rectangle center. The returned vector contains longitude, latitude, and a zero height.

- `rectangle` - The rectangle whose center should be computed.
- `result` - Optional `Vector3` in which to store the result.

Returns the supplied `result` or a new `Vector3`.
