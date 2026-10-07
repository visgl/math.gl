# SphereGeometry

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square" alt="From v4.2" />
</p>

import GeometryViewer from '@site/src/components/geometry-viewer';

<GeometryViewer geometryType="SphereGeometry" inline />

A latitude/longitude sphere centered at the origin. Positive `radius` defaults to `0.5`. `nlat` and `nlong` default to `10` and control latitude and longitude segments.

```typescript
import {SphereGeometry} from '@math.gl/geometry';

const geometry = new SphereGeometry({radius: 0.75, nlat: 16, nlong: 24});
```

All primitives also accept `id` and additional `attributes`. Generated meshes expose
`POSITION`, `NORMAL` and `TEXCOORD_0` attributes, triangle-list topology, and typed indices.
See [Geometry](./geometry.md) for the mesh container API.
