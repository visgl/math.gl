# LngLatRectangle

![From v4.2](https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square)

A longitude-latitude rectangle on an ellipsoid. Angular values are stored in radians.

## Usage[​](#usage "Direct link to Usage")

```
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

Because `east` is smaller than `west`, this example crosses the antimeridian and has a width of 20 degrees.

## Fields[​](#fields "Direct link to Fields")

### west : Number[​](#west--number "Direct link to west : Number")

The westernmost longitude in radians.

### south : Number[​](#south--number "Direct link to south : Number")

The southernmost latitude in radians.

### east : Number[​](#east--number "Direct link to east : Number")

The easternmost longitude in radians.

### north : Number[​](#north--number "Direct link to north : Number")

The northernmost latitude in radians.

### width : Number[​](#width--number "Direct link to width : Number")

The rectangle width in radians, accounting for antimeridian crossing.

## Methods[​](#methods "Direct link to Methods")

### constructor(west : Number, south : Number, east : Number, north : Number)[​](#constructorwest--number-south--number-east--number-north--number "Direct link to constructor(west : Number, south : Number, east : Number, north : Number)")

Creates a longitude-latitude rectangle.

### LngLatRectangle.center(rectangle : LngLatRectangle, result? : Vector3) : Vector3[​](#lnglatrectanglecenterrectangle--lnglatrectangle-result--vector3--vector3 "Direct link to LngLatRectangle.center(rectangle : LngLatRectangle, result? : Vector3) : Vector3")

Computes the rectangle center. The returned vector contains longitude, latitude, and a zero height.

* `rectangle` - The rectangle whose center should be computed.
* `result` - Optional `Vector3` in which to store the result.

Returns the supplied `result` or a new `Vector3`.
