# @math.gl/geospatial/projection-types

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

[`Projection`](./api-reference/projection.md) describes a transformation between a source and target CRS.
Create one through a [`ProjectionEngine`](./api-reference/projection-engine.md).

```typescript
import type { Projection, ProjectionEngine } from "@math.gl/geospatial/projection-types";
import { projectionEngine } from "@math.gl/geospatial/projection";

const engine: ProjectionEngine = projectionEngine;
const projection: Projection = engine.createProjection({ to: "EPSG:3857" });
const meters = await projection.project([12, 55]);
const longitudeLatitude = await projection.unproject(meters);
```

The `/types` entry point exports only types, so `import type` adds no runtime code. Applications can accept this contract without depending on a particular engine.
