# Parametric geometry

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

import Example from '@site/src/components/parametric-geometry';

<Example inline interactive height={540} />

```typescript
import {TorusGeometry, LatheGeometry, ParametricGeometry} from '@math.gl/geometry/parametric';
const ring = new TorusGeometry({majorRadius: 2, minorRadius: 0.5});
const vase = new LatheGeometry({points: [[0.5, -1], [0.8, 0], [0.6, 1]]});
const wave = new ParametricGeometry({sample: (u, v) => [u, v, Math.sin(u * 6) * 0.2]});
```

This optional subpath returns ordinary `Geometry` instances with Float32 `POSITION`,
`NORMAL` and `TEXCOORD_0`, indexed triangle lists, and Uint16 or Uint32 indices as
needed. It has no rendering-engine dependency. The root geometry entry does not
import these generators. All constructors accept `id` and attribute overrides.

## TorusGeometry

Defaults: `majorRadius: 1`, `minorRadius: 0.3`, `majorSegments: 48`,
`minorSegments: 24`, `arc: 2π`. Both radii must be positive and the minor radius
must be smaller than the major radius. At least three segments per axis are
required. The torus revolves around Y, with outward analytic normals. Arc is in
(0, 2π]; partial sweeps have open ends.

## LatheGeometry

`points` is an ordered profile of at least two `[radius, height]` pairs, with finite
values and nonnegative radii. Consecutive points must differ. `segments` defaults
to 48 (minimum 3); `phiStart` defaults to 0, and `phiLength` to 2π. Sweeps rotate
around Y in the negative angular direction viewed from +Y, matching the surface
parameter winding. An ascending cylindrical profile produces outward normals.
Profile normals average adjacent segment directions for smooth shading.

There are no automatic caps. Profiles touching the axis can produce collapsed
triangles at that axis; self-crossing or reversing profiles are not repaired.

## ParametricGeometry

`sample(u, v)` returns a finite triple over normalized [0,1]². `uSegments` and
`vSegments` default to 32 and must be positive integers. Optional `normal(u, v)`
returns an analytic normal, which is normalized. Otherwise finite differences
estimate smooth-surface normals with a parameter step of 1e-5 and one-sided
sampling at open boundaries. Winding follows ∂P/∂u × ∂P/∂v.

`periodicU` and `periodicV` default to false. A periodic axis wraps sampling and
copies its first position/normal to the UV-1 seam. The sampler must define a
smooth periodic surface on that axis. Singular derivatives yield zero normals;
discontinuous samples need an explicit normal callback or separate meshes.
Positions must be representable as finite Float32 values. Generators do not
validate manifoldness or repair self-intersections.

## Define a surface in the gallery

Choose **Function** and enter a JavaScript function `(u, v, a) => [x, y, z]`.
`u` and `v` range from 0 to 1, and `a` follows the shape-parameter slider.
Use **Apply function** to rebuild the surface. Wave, saddle and helicoid starters
provide editable examples. Syntax errors and nonfinite or incorrectly shaped samples
show feedback while retaining the previous surface. Functions run locally in a Web
Worker, which is terminated if a build exceeds three seconds, keeping the controls
responsive even if a function loops indefinitely.
