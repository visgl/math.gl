# Ray

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square" alt="From v4.2" />
</p>

A ray that extends infinitely from an origin in one direction.

## Usage

```js
import {Vector3} from '@math.gl/core';
import {Plane, Ray} from '@math.gl/geometry/culling';

const ray = new Ray(new Vector3(0, 0, 0), new Vector3(1, 0, 0));
const plane = new Plane([1, 0, 0], -10);
const intersection = plane.intersectWithRay(ray);
```

## Fields

### origin : Vector3

The ray origin.

### direction : Vector3

The constructor normalizes a supplied nonzero direction. An omitted or zero direction
remains zero and is not a valid direction for the standalone ray query kernels.

## Methods

### constructor(origin? : Vector3, direction? : Vector3)

Creates a ray. The constructor clones both inputs and normalizes `direction`. Omitted inputs default
to zero vectors.

- `origin` - Optional ray origin.
- `direction` - Optional ray direction.

#### `at(t, result?)`

Evaluates the ray at a nonnegative distance. Writes into the optional result vector.

#### `closestPointTo(point, result?)`

Returns the closest point on the ray, clamping projections behind its origin.

#### `distanceTo(point)`

Returns Euclidean distance from a point to the ray.

#### `transform(matrix)`

Transforms the ray in place and renormalizes its direction. Subsequent class parameters are distances in the new space. Use standalone `transformRay()` to preserve the original parameterization instead.

## Query functions

The class stores the ray; triangle and bounds intersections are separate functions:

```js
import {intersectRayTriangle} from '@math.gl/geometry/culling';

const hit = intersectRayTriangle(
  [0.25, 0.25, 1], [0, 0, -1],
  [0, 0, 0], [1, 0, 0], [0, 1, 0]
);
// hit: {t: 1, barycentric: [0.5, 0.25, 0.25]}
```

The kernel accepts numeric arrays directly and does not normalize the direction.
Its `t` parameter is a distance only for a unit direction; no hit returns `null`.
See [query functions](./queries.md) for bounds, closest-point and segment queries,
and [analytic shapes](./shapes.md) for shape-specific intersections.
