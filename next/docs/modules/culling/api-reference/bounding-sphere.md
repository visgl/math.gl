# BoundingSphere

![From v3.0](https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square)

A [bounding sphere](https://en.wikipedia.org/wiki/Bounding_sphere) with a center and a radius.

## Usage[​](#usage "Direct link to Usage")

Create a bounding sphere around the unit cube

```
import {BoundingSphere} from '@math.gl/culling';

cont sphere = new BoundingSphere().fromCornerPoints(

  [-0.5, -0.5, -0.5],

  [0.5, 0.5, 0.5]

);
```

Sort bounding spheres from back to front

```
import {BoundingSphere} from '@math.gl/culling';

const spheres = [new BoundingSphere(...), new BoundingSphere(...), ...];

const cameraPosWC = ...;

spheres.sort(

  (a, b) => b.distanceSquaredTo(b, cameraPosWC) - a.distanceSquaredTo(a.cameraPosWC)

);
```

## Inheritance[​](#inheritance "Direct link to Inheritance")

`class BoundingSphere implements` [`BoundingVolume`](https://visgl.github.io/math.gl/next/docs/modules/culling/api-reference/bounding-volume.md).

## Global Functions[​](#global-functions "Direct link to Global Functions")

### `makeBoundingSphereFromPoints(positions : iterator, result? : `BoundingSphere) : BoundingSphere[​](#makeboundingspherefrompointspositions--iterator-result--boundingsphere--boundingsphere "Direct link to makeboundingspherefrompointspositions--iterator-result--boundingsphere--boundingsphere")

Computes a tight-fitting bounding sphere enclosing a list of 3D Cartesian points. The bounding sphere is computed by running two algorithms, a naive algorithm and Ritter's algorithm. The smaller of the two spheres is used to ensure a tight fit.

* `positions` An iterable (e.g. array) of points that the bounding sphere will enclose. Each point must have `x`, `y`, and `z` properties.
* `result` Optional object onto which to store the result.

Returns

* The modified `result` parameter or a new `BoundingSphere` instance if one was not provided.

See [Bounding Sphere computation article](http://blogs.agi.com/insight3d/index.php/2008/02/04/a-bounding/)

## Fields[​](#fields "Direct link to Fields")

### `center : Vector3`[​](#center--vector3 "Direct link to center--vector3")

The center point of the sphere.

### `radius : Number`[​](#radius--number "Direct link to radius--number")

The radius of the sphere.

## Members[​](#members "Direct link to Members")

### `constructor(center : Number[3], radius : Number)`[​](#constructorcenter--number3-radius--number "Direct link to constructorcenter--number3-radius--number")

Creates a new `BoundingSphere`

* `center`=`[0, 0, 0]` The center of the bounding sphere.
* `radius`=`0.0` The radius of the bounding sphere.

### `fromCenterRadius(center : Number[3], radius : Number) : BoundingSphere`[​](#fromcenterradiuscenter--number3-radius--number--boundingsphere "Direct link to fromcenterradiuscenter--number3-radius--number--boundingsphere")

Sets the `BoundingSphere` from center and radius

* `center`=`[0, 0, 0]` The center of the bounding sphere.
* `radius`=`0.0` The radius of the bounding sphere.

### `fromCornerPoints(corner : Number[3], oppositeCorner : Number[3], result? : `BoundingSphere) : BoundingSphere[​](#fromcornerpointscorner--number3-oppositecorner--number3-result--boundingsphere--boundingsphere "Direct link to fromcornerpointscorner--number3-oppositecorner--number3-result--boundingsphere--boundingsphere")

Computes a bounding sphere from the two corner points of an axis-aligned bounding box. The sphere tighly and fully encompases the box.

* `corner` The minimum height over the rectangle.
* `oppositeCorner` The maximum height over the rectangle.

### `fromBoundingSpheres(boundingSpheres : BoundingSphere[]) : BoundingSphere`[​](#fromboundingspheresboundingspheres--boundingsphere--boundingsphere "Direct link to fromboundingspheresboundingspheres--boundingsphere--boundingsphere")

Computes a tight-fitting bounding sphere enclosing the provided array of bounding spheres.

* `boundingSpheres` The array of bounding spheres.

Returns

* The modified `result` parameter or a new `BoundingSphere` instance if none was provided.

### `clone()`[​](#clone "Direct link to clone")

Duplicates a `BoundingSphere` instance.

Returns

* A new `BoundingSphere` instance

### `equals(right : BoundingSphere) Boolean`[​](#equalsright--boundingsphere-boolean "Direct link to equalsright--boundingsphere-boolean")

Compares the provided `BoundingSphere` componentwise and returns `true` if they are equal, `false` otherwise.

* `right` The second `BoundingSphere`.

Returns

* `true` if left and right are equal, `false` otherwise.

### `union(right : BoundingSphere) : BoundingSphere`[​](#unionright--boundingsphere--boundingsphere "Direct link to unionright--boundingsphere--boundingsphere")

Computes a bounding sphere that contains both the this and the `right` bounding spheres.

* `right` The second `BoundingSphere`.

### `expand(point : Number[3]) : BoundingSphere`[​](#expandpoint--number3--boundingsphere "Direct link to expandpoint--number3--boundingsphere")

Computes a bounding sphere by enlarging the provided sphere to contain the provided point.

* `point` A point to enclose in a bounding sphere.

### `intersectPlane(plane : Plane) : CullingResult`[​](#intersectplaneplane--plane--cullingresult "Direct link to intersectplaneplane--plane--cullingresult")

Determines which side of a plane a sphere is located.

* `plane` The plane to test against. Returns
* `'inside'` if the entire sphere is on the side of the plane the normal is pointing
* `'outside'` if the entire sphere is on the opposite side
* `'intersecting'` if the sphere intersects the plane.

### `transform(transform : Number[16]) : BoundingSphere`[​](#transformtransform--number16--boundingsphere "Direct link to transformtransform--number16--boundingsphere")

Applies a 4x4 affine transformation matrix to a bounding sphere.

* `transform` The transformation matrix to apply to the bounding sphere.

### `distanceSquaredTo(point) : Number`[​](#distancesquaredtopoint--number "Direct link to distancesquaredtopoint--number")

Computes the estimated distance squared from the closest point on a bounding sphere to a point.

* `point` The point

Returns

* The estimated distance squared from the bounding sphere to the point.

### `transformWithoutScale(sphere, transform, result)`[​](#transformwithoutscalesphere-transform-result "Direct link to transformwithoutscalesphere-transform-result")

Applies a 4x4 affine transformation matrix to a bounding sphere where there is no scale The transformation matrix is not verified to have a uniform scale of 1. This method is faster than computing the general bounding sphere transform using BoundingSphere.transform.

* BoundingSphere sphere The bounding sphere to apply the transformation to.

* Matrix4 transform The transformation matrix to apply to the bounding sphere.

* `result` Optional object onto which to store the result.

Returns

* The modified `result` parameter or a new `BoundingSphere` instance if none was provided.

@example var modelMatrix = Transforms.eastNorthUpToFixedFrame(positionOnEllipsoid); var boundingSphere = new BoundingSphere(); var newBoundingSphere = BoundingSphere.transformWithoutScale(boundingSphere, modelMatrix);

### `computePlaneDistances (sphere, position, direction, result)`[​](#computeplanedistances-sphere-position-direction-result "Direct link to computeplanedistances-sphere-position-direction-result")

The distances calculated by the vector from the center of the bounding sphere to position projected onto direction plus/minus the radius of the bounding sphere.

If you imagine the infinite number of planes with normal direction, this computes the smallest distance to the closest and farthest planes from position that intersect the bounding sphere.

* `BoundingSphere` `sphere` The bounding sphere to calculate the distance to.
* `Cartesian3` `position` The position to calculate the distance from.
* `Cartesian3` `direction` The direction from position.
* `Interval` \[result] A Interval to store the nearest and farthest distances.

Returns `Interval`- The nearest and farthest distances on the bounding sphere from position in direction.

### `projectTo2D(sphere, projection, result)`[​](#projectto2dsphere-projection-result "Direct link to projectto2dsphere-projection-result")

Creates a bounding sphere in 2D from a bounding sphere in 3D world coordinates.

* `BoundingSphere` sphere The bounding sphere to transform to 2D.

* `Object` \[projection=GeographicProjection] The projection to 2D.

* `result` Optional object onto which to store the result.

Returns

* The modified `result` parameter or a new `BoundingSphere` instance if none was provided.

## Attribution[​](#attribution "Direct link to Attribution")

This class was ported from [Cesium](https://github.com/AnalyticalGraphicsInc/cesium) under the Apache 2 License.
