# CapsuleGeometry

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square" alt="From v4.2" />
</p>

import GeometryViewer from '@site/src/components/geometry-viewer';

<GeometryViewer geometryType="CapsuleGeometry" inline />

The convex hull of endpoint spheres on the Y axis. `height` is the positive distance between sphere centers (default `1`). `radiusBottom` and `radiusTop` default to `0.5`; at least one must be positive. `nradial`, `ncap` and `nvertical` control tessellation (defaults `10`, `5` and `1`).

```typescript
import {CapsuleGeometry} from '@math.gl/geometry';

const geometry = new CapsuleGeometry({height: 1, radiusBottom: 0.4, radiusTop: 0.4});
```

All primitives also accept `id` and additional `attributes`. Generated meshes expose
`POSITION`, `NORMAL` and `TEXCOORD_0` attributes, triangle-list topology, and typed indices.
See [Geometry](./geometry.md) for the mesh container API.
