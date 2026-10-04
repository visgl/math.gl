# PlaneGeometry

import GeometryViewer from '@site/src/components/geometry-viewer';

<GeometryViewer geometryType="PlaneGeometry" inline />

A finite plane in XZ, with its front face and normal pointing +Y. Positive finite `sizeX` and `sizeZ` are required. `nx` and `nz` control subdivisions, both defaulting to `1`.

```typescript
import {PlaneGeometry} from '@math.gl/geometry';

const geometry = new PlaneGeometry({sizeX: 2, sizeZ: 2, nx: 6, nz: 6});
```

All primitives also accept `id` and additional `attributes`. Generated meshes expose
`POSITION`, `NORMAL` and `TEXCOORD_0` attributes, triangle-list topology, and typed indices.
See [Geometry](./geometry.md) for the mesh container API.
