# polygon-utils

![From v3.6](https://img.shields.io/badge/From-v3.6-blue.svg?style=flat-square)

A set of polygon-related utility functions. Utility functions are available for flat arrays and for arrays of points. Note: the \*Points set of functions is used for arrays of points, and is separated for performance and backwards compatibility reasons.

## Usage[​](#usage "Direct link to Usage")

```
import {getPolygonWindingDirection} from '@math.gl/polygon';
```

## Types[​](#types "Direct link to Types")

### WindingDirection[​](#windingdirection "Direct link to WindingDirection")

`'clockwise' | 'counter-clockwise' | 'none'`

### PolygonParams[​](#polygonparams "Direct link to PolygonParams")

`PolygonParams`

Fields:

* `start` (number) - Start index of the polygon in the array of positions. Defaults to 0.
* `end` (number) - End index of the polygon in the array of positions. Defaults to number of positions.
* `size` (Number) - Size of a point, 2 (XZ) or 3 (XYZ). Defaults to 2. Affects only polygons stored in flat arrays.
* `isClosed` (Boolean) - Indicates that the first point of the polygon is equal to the last point, and additional checks should be ommited.
* `plane` ('xy' | 'yz' | 'xz') - The 2D projection plane on which to calculate the area of a 3D polygon. Default `'xy'`.

## Functions[​](#functions "Direct link to Functions")

### modifyPolygonWindingDirection[​](#modifypolygonwindingdirection "Direct link to modifyPolygonWindingDirection")

Checks winding direction of the polygon and reverses the polygon in case if opposite winding direction. Note: points are modified in-place.

`modifyPolygonWindingDirection(points, direction, params)`

Arguments:

* `points` (Array|TypedArray) - a flat array of the points that define the polygon.
* `direction` (`'clockwise' | 'counter-clockwise'`) - Requested winding direction.
* `options` (PolygonParams) - Polygon parameters.

Returns:

Returns true if the winding direction was changed.

### getPolygonSignedArea[​](#getpolygonsignedarea "Direct link to getPolygonSignedArea")

Returns signed area of the polygon.

`getPolygonSignedArea(points, options, plane)`

Arguments:

* `points` (Array|TypedArray) - a flat array of the points that define the polygon.
* `options` (PolygonParams, optional) - Polygon parameters.

Returns:

Signed area of the polygon.

### getPolygonWindingDirection[​](#getpolygonwindingdirection "Direct link to getPolygonWindingDirection")

Returns winding direction of the polygon.

`getPolygonWindingDirection(points, options)`

Arguments:

* `points` (Array|TypedArray) - a flat array of the points that define the polygon.
* `options` (PolygonParams) - Polygon parameters.

Returns:

* `'clockwise'`, `'counter-clockwise'`, or `'none'` for a degenerate polygon.

### forEachSegmentInPolygon[​](#foreachsegmentinpolygon "Direct link to forEachSegmentInPolygon")

Calls visitor callback for each segment in the polygon.

`forEachSegmentInPolygon(points, (p1x, p1y, p2x, p2y, ind1, ind2) => ...), options`

Arguments:

* `points` (Array\[]|TypedArray\[]) - a flat array of the points that define the polygon.
* `visitor` (SegmentVisitorFlat) - a callback to call for each segment of the polygon.
* `options` (PolygonParams) - Polygon parameters.

### modifyPolygonWindingDirectionPoints[​](#modifypolygonwindingdirectionpoints "Direct link to modifyPolygonWindingDirectionPoints")

Checks winding direction of the polygon and reverses the polygon in case if opposite winding direction. Note: points are modified in-place.

`modifyPolygonWindingDirectionPoints(points, direction, options)`

Arguments:

* `points` (Array\[]|TypedArray\[]) - an array of the points that define the polygon.
* `direction` (`'clockwise' | 'counter-clockwise'`) - Requested winding direction.
* `options` (PolygonParams) - Polygon parameters.

Returns:

Returns true if the winding direction was changed.

### getPolygonSignedAreaPoints[​](#getpolygonsignedareapoints "Direct link to getPolygonSignedAreaPoints")

Returns signed area of the polygon.

`getPolygonSignedAreaPoints(points, options)`

Arguments:

* `points` (Array\[]|TypedArray\[]) - an array of the points that define the polygon.
* `options` (PolygonParams) - Polygon parameters.

Returns:

Signed area of the polygon.

### getPolygonWindingDirectionPoints[​](#getpolygonwindingdirectionpoints "Direct link to getPolygonWindingDirectionPoints")

Returns winding direction of the polygon.

`getPolygonWindingDirectionPoints(points, options)`

Arguments:

* `points` (Array\[]|TypedArray\[]) - an array of the points that define the polygon.
* `options` (PolygonParams) - Polygon parameters.

Returns:

* `'clockwise'`, `'counter-clockwise'`, or `'none'` for a degenerate polygon.

### forEachSegmentInPolygonPoints[​](#foreachsegmentinpolygonpoints "Direct link to forEachSegmentInPolygonPoints")

Calls visitor callback for each segment in the polygon.

`forEachSegmentInPolygonPoints(points, (p1, p2, ind1, ind2) => ..., options)`

Arguments:

* `points` (Array\[]|TypedArray\[]) - an array of the points that define the polygon.
* `visitor` (SegmentVisitor) - a callback to call for each segment of the polygon.
* `options` (PolygonParams) - Polygon parameters.
