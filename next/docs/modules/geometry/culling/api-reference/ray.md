# Ray

![From v4.2](https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square)

A ray that extends infinitely from an origin in one direction.

## Usage[​](#usage "Direct link to Usage")

```
import {Vector3} from '@math.gl/core';

import {Plane, Ray} from '@math.gl/geometry/culling';



const ray = new Ray(new Vector3(0, 0, 0), new Vector3(1, 0, 0));

const plane = new Plane([1, 0, 0], -10);

const intersection = plane.intersectWithRay(ray);
```

## Fields[​](#fields "Direct link to Fields")

### origin : Vector3[​](#origin--vector3 "Direct link to origin : Vector3")

The ray origin.

### direction : Vector3[​](#direction--vector3 "Direct link to direction : Vector3")

The constructor normalizes a supplied nonzero direction. An omitted or zero direction remains zero and is not a valid direction for the standalone ray query kernels.

## Methods[​](#methods "Direct link to Methods")

### constructor(origin? : Vector3, direction? : Vector3)[​](#constructororigin--vector3-direction--vector3 "Direct link to constructor(origin? : Vector3, direction? : Vector3)")

Creates a ray. The constructor clones both inputs and normalizes `direction`. Omitted inputs default to zero vectors.

* `origin` - Optional ray origin.
* `direction` - Optional ray direction.

#### `at(t, result?)`[​](#att-result "Direct link to att-result")

Evaluates the ray at a nonnegative distance. Writes into the optional result vector.

#### `closestPointTo(point, result?)`[​](#closestpointtopoint-result "Direct link to closestpointtopoint-result")

Returns the closest point on the ray, clamping projections behind its origin.

#### `distanceTo(point)`[​](#distancetopoint "Direct link to distancetopoint")

Returns Euclidean distance from a point to the ray.

#### `transform(matrix)`[​](#transformmatrix "Direct link to transformmatrix")

Transforms the ray in place and renormalizes its direction. Subsequent class parameters are distances in the new space. Use standalone `transformRay()` to preserve the original parameterization instead.

## Query functions[​](#query-functions "Direct link to Query functions")

The class stores the ray; triangle and bounds intersections are separate functions:

```
import {intersectRayTriangle} from '@math.gl/geometry/culling';



const hit = intersectRayTriangle(

  [0.25, 0.25, 1], [0, 0, -1],

  [0, 0, 0], [1, 0, 0], [0, 1, 0]

);

// hit: {t: 1, barycentric: [0.5, 0.25, 0.25]}
```

The kernel accepts numeric arrays directly and does not normalize the direction. Its `t` parameter is a distance only for a unit direction; no hit returns `null`. See [query functions](https://visgl.github.io/math.gl/next/docs/modules/geometry/culling/api-reference/queries.md) for bounds, closest-point and segment queries, and [analytic shapes](https://visgl.github.io/math.gl/next/docs/modules/geometry/culling/api-reference/shapes.md) for shape-specific intersections.
