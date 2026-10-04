# CylinderGeometry

import GeometryViewer from '@site/src/components/geometry-viewer';

<GeometryViewer geometryType="CylinderGeometry" inline />

A closed Y-aligned cylinder, including tapered cylinders. `height` defaults to `2`; `radiusTop` and `radiusBottom` default to `0.5`. At least one radius must be positive. `nradial` and `nvertical` default to `10` and `1`.

```typescript
import {CylinderGeometry} from '@math.gl/geometry';

const geometry = new CylinderGeometry({height: 1.5, radiusBottom: 0.5, radiusTop: 0.5});
```

All primitives also accept `id` and additional `attributes`. Generated meshes expose
`POSITION`, `NORMAL` and `TEXCOORD_0` attributes, triangle-list topology, and typed indices.
See [Geometry](./geometry.md) for the mesh container API.
