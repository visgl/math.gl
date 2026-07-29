# Ray

A ray that extends infinitely from an origin in one direction.

## Usage

```js
import {Vector3} from '@math.gl/core';
import {Plane, Ray} from '@math.gl/culling';

const ray = new Ray(new Vector3(0, 0, 0), new Vector3(1, 0, 0));
const plane = new Plane([1, 0, 0], -10);
const intersection = plane.intersectWithRay(ray);
```

## Fields

### origin : Vector3

The ray origin.

### direction : Vector3

The normalized ray direction.

## Methods

### constructor(origin? : Vector3, direction? : Vector3)

Creates a ray. The constructor clones both inputs and normalizes `direction`. Omitted inputs default
to zero vectors.

- `origin` - Optional ray origin.
- `direction` - Optional ray direction.
