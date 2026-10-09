# Polygon

![From v1.1](https://img.shields.io/badge/From-v1.1-blue.svg?style=flat-square)

Allows an array of points (whether closed or non-closed) to be treated as a Polygon.

Implements the [Shoelace formula](https://en.wikipedia.org/wiki/Shoelace_formula) for determining the area and winding direction of an arbitrary polygon.

## Usage[​](#usage "Direct link to Usage")

```
import {Polygon} from '@math.gl/polygon';
```

## Methods[​](#methods "Direct link to Methods")

### constructor[​](#constructor "Direct link to constructor")

Creates a new Polygon object.

> The polygon object will reference the provided points, assuming them to not be modified for the lifetime of the Polygon object.

### getSignedArea[​](#getsignedarea "Direct link to getSignedArea")

Returns the area with a sign indicating the winding direction.

`polygon.getSignedArea()`

### getArea[​](#getarea "Direct link to getArea")

`polygon.getArea()`

Note:

* A convenience method that returns `Math.abs(polygon.getSignedArea())`.

### getWindingDirection[​](#getwindingdirection "Direct link to getWindingDirection")

Returns the direction of the polygon path.

`polygon.getWindingDirection()`

* Returns `'clockwise'`, `'counter-clockwise'`, or `'none'` for a degenerate polygon.

### forEachSegment[​](#foreachsegment "Direct link to forEachSegment")

Lets the application iterate over each segment.

`polygon.forEachSegment((p1, p2) => ...);`

### modifyWindingDirection[​](#modifywindingdirection "Direct link to modifyWindingDirection")

Checks winding direction of the polygon and reverses the polygon in case if opposite winding direction. Note: points of the polygon are modified in-place.

* `direction` is `'clockwise'` or `'counter-clockwise'`.

`polygon.modifyWindingDirection(direction);`

Returns:

Returns true if the winding direction was changed.

## Remarks[​](#remarks "Direct link to Remarks")

* To avoid having to copy a non-closed path to be able to treat it as a polygon (by adding a copy of the first vertex to then end of the path), instead we define a `forEachSegment` iteration method that makes sure the last segment is iterated over.
