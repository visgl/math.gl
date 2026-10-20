# BoundingVolume (Interface)

![From v3.5](https://img.shields.io/badge/From-v3.5-blue.svg?style=flat-square)

An interface defining common operations for bounding volumes (i.e. `BoundingSphere`, `AxisAlignedBoundingBox`, `OrientedBoundingBox`).

## Global Functions[​](#global-functions "Direct link to Global Functions")

## Members[​](#members "Direct link to Members")

### intersectPlane(plane : Plane) : CullingResult[​](#intersectplaneplane--plane--cullingresult "Direct link to intersectPlane(plane : Plane) : CullingResult")

Determines which side of a plane a sphere is located.

* `plane` The plane to test against. Returns
* `'inside'` if the entire sphere is on the side of the plane the normal is pointing
* `'outside'` if the entire sphere is on the opposite side
* `'intersecting'` if the sphere intersects the plane.

### transform(transform : Number\[16]) : BoundingSphere[​](#transformtransform--number16--boundingsphere "Direct link to transform(transform : Number\[16]) : BoundingSphere")

Applies a 4x4 affine transformation matrix to a bounding sphere.

* `transform` The transformation matrix to apply to the bounding sphere.

### distanceSquaredTo(point) : Number[​](#distancesquaredtopoint--number "Direct link to distanceSquaredTo(point) : Number")

Computes the estimated distance squared from the closest point on a bounding sphere to a point.

* `point` The point

Returns

* The estimated distance squared from the bounding sphere to the point.

<!-- -->

## Attribution[​](#attribution "Direct link to Attribution")

This class was ported from [Cesium](https://github.com/AnalyticalGraphicsInc/cesium) under the Apache 2 License.
