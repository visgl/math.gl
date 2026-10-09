# Ray

![From v4.2](https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square)

A ray that extends infinitely from an origin in one direction.

## Usage[​](#usage "Direct link to Usage")

```
import {Vector3} from '@math.gl/core';

import {Plane, Ray} from '@math.gl/culling';



const ray = new Ray(new Vector3(0, 0, 0), new Vector3(1, 0, 0));

const plane = new Plane([1, 0, 0], -10);

const intersection = plane.intersectWithRay(ray);
```

## Fields[​](#fields "Direct link to Fields")

### origin : Vector3[​](#origin--vector3 "Direct link to origin : Vector3")

The ray origin.

### direction : Vector3[​](#direction--vector3 "Direct link to direction : Vector3")

The normalized ray direction.

## Methods[​](#methods "Direct link to Methods")

### constructor(origin? : Vector3, direction? : Vector3)[​](#constructororigin--vector3-direction--vector3 "Direct link to constructor(origin? : Vector3, direction? : Vector3)")

Creates a ray. The constructor clones both inputs and normalizes `direction`. Omitted inputs default to zero vectors.

* `origin` - Optional ray origin.
* `direction` - Optional ray direction.
