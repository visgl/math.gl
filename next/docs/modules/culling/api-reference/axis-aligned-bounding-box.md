# AxisAlignedBoundingBox

![From v3.0](https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square)

An `AxisAlignedBoundingBox` is a closed and convex cuboid that is aligned with the orthogonal axes.

# Usage

`AxisAlignedBoundingBox` can be created using two corners of the box:

```
import {AxisAlignedBoundingBox} from '@math.gl/culling';



const box = new AxisAlignedBoundingBox([-1, -1, -1], [1, 1, 1]);
```

Or from a collection of points:

```
import {makeAxisAlignedBoundingBoxFromPoints} from '@math.gl/culling';



const box = makeAxisAlignedBoundingBoxFromPoints([

  [2, 0, 0],

  [-2, 0, 0]

]);
```

## Inheritance[​](#inheritance "Direct link to Inheritance")

`class AxisAlignedBoundingBox implements` [`BoundingVolume`](https://visgl.github.io/math.gl/next/docs/modules/culling/api-reference/bounding-volume.md).

## Global Functions[​](#global-functions "Direct link to Global Functions")

### `makeAxisAlignedBoundingBoxFromPoints(positions : Array`\[3]\[], result? : AxisAlignedBoundingBox) : AxisAlignedBoundingBox[​](#makeaxisalignedboundingboxfrompointspositions--array3-result--axisalignedboundingbox--axisalignedboundingbox "Direct link to makeaxisalignedboundingboxfrompointspositions--array3-result--axisalignedboundingbox--axisalignedboundingbox")

Computes an instance of an `AxisAlignedBoundingBox` of the given positions.

* `positions` List of `Vector3` points that the bounding box will enclose.
* `result` Optional object onto which to store the result.

## Fields[​](#fields "Direct link to Fields")

### `center: Vector3 = [0, 0, 0]`[​](#center-vector3--0-0-0 "Direct link to center-vector3--0-0-0")

The center position of the box.

### `halfDiagonal: Vector3`[​](#halfdiagonal-vector3 "Direct link to halfdiagonal-vector3")

The positive diagonal vector.

### `minimum: Vector3`[​](#minimum-vector3 "Direct link to minimum-vector3")

The minimum corner of the bounding box.

### `maximum: Vector3`[​](#maximum-vector3 "Direct link to maximum-vector3")

The maximum corner of the bounding box.

## Methods[​](#methods "Direct link to Methods")

### `constructor(minimum = [0, 0, 0], maximum = [0, 0, 0])`[​](#constructorminimum--0-0-0-maximum--0-0-0 "Direct link to constructorminimum--0-0-0-maximum--0-0-0")

### `constructor`[​](#constructor "Direct link to constructor")

* `minimum=Vector3.ZERO`: `Vector3` The minimum corner of the box, i.e. `[xMin, yMin, zMin]`.
* `maximum=Vector3.ZERO`: `Vector3` The maximum corner of the box, i.e. `[xMax, yMax, zMax]`.

### `clone() : AxisAlignedBoundingBox`[​](#clone--axisalignedboundingbox "Direct link to clone--axisalignedboundingbox")

Duplicates a `AxisAlignedBoundingBox` instance.

Returns

* A new `AxisAlignedBoundingBox` instance.

### `equals(right : AxisAlignedBoundingBox) : Boolean`[​](#equalsright--axisalignedboundingbox--boolean "Direct link to equalsright--axisalignedboundingbox--boolean")

Compares the provided `AxisAlignedBoundingBox` componentwise and returns `true` if they are equal, `false` otherwise.

* `right` The second `AxisAlignedBoundingBox`

Returns

* `true` if left and right are equal, `false` otherwise.

### `intersectPlane(plane : Plane) : CullingResult`[​](#intersectplaneplane--plane--cullingresult "Direct link to intersectplaneplane--plane--cullingresult")

Determines which side of a plane the axis-aligned bounding box is located.

* `plane` The plane to test against.

Returns

* `'inside'` if the entire box is on the side of the plane the normal is pointing
* `'outside'` if the entire box is on the opposite side, and
* `'intersecting'` if the box intersects the plane.

### `distanceTo(point : Number[3]) : Number`[​](#distancetopoint--number3--number "Direct link to distancetopoint--number3--number")

Computes the estimated distance from the closest point on a bounding box to a point.

* `point` The point

Returns

* The estimated distance from the bounding sphere to the point.

### `distanceSquaredTo(point : Number[3]) : Number`[​](#distancesquaredtopoint--number3--number "Direct link to distancesquaredtopoint--number3--number")

Computes the estimated distance squared from the closest point on a bounding box to a point.

* `point` The point

Returns

* The estimated distance squared from the bounding sphere to the point.
