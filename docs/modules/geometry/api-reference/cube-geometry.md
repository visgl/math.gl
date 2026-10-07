# CubeGeometry

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

import GeometryViewer from '@site/src/components/geometry-viewer';

<GeometryViewer geometryType="CubeGeometry" inline />

An equal-sided box centered at the origin. `size` is a positive total side length (default `1`).

```typescript
import {CubeGeometry} from '@math.gl/geometry';

const geometry = new CubeGeometry({size: 1});
```

All primitives also accept `id` and additional `attributes`. Generated meshes expose
`POSITION`, `NORMAL` and `TEXCOORD_0` attributes, triangle-list topology, and typed indices.
See [Geometry](./geometry.md) for the mesh container API.
