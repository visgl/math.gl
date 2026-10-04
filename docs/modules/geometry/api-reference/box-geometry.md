# BoxGeometry

import GeometryViewer from '@site/src/components/geometry-viewer';

<GeometryViewer geometryType="BoxGeometry" inline />

A box centered at the origin. `size` specifies positive total X, Y and Z lengths (default `[1, 1, 1]`).

```typescript
import {BoxGeometry} from '@math.gl/geometry';

const geometry = new BoxGeometry({size: [1.5, 1, 0.75]});
```

All primitives also accept `id` and additional `attributes`. Generated meshes expose
`POSITION`, `NORMAL` and `TEXCOORD_0` attributes, triangle-list topology, and typed indices.
See [Geometry](./geometry.md) for the mesh container API.
