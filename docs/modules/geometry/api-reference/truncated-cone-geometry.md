# TruncatedConeGeometry

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square" alt="From v4.2" />
</p>

import GeometryViewer from '@site/src/components/geometry-viewer';

<GeometryViewer geometryType="TruncatedConeGeometry" inline />

A general tapered primitive with independent radii, caps and axis. `topRadius` and `bottomRadius` default to zero: supply at least one positive radius. `height` defaults to `1`, both cap flags to `false`, `nradial` to `10`, `nvertical` to `1`, and `verticalAxis` to y.

```typescript
import {TruncatedConeGeometry} from '@math.gl/geometry';

const geometry = new TruncatedConeGeometry({height: 1.5, bottomRadius: 0.7, topRadius: 0.3, topCap: true, bottomCap: true});
```

All primitives also accept `id` and additional `attributes`. Generated meshes expose
`POSITION`, `NORMAL` and `TEXCOORD_0` attributes, triangle-list topology, and typed indices.
See [Geometry](./geometry.md) for the mesh container API.
