# ProjectionEngine

`ProjectionEngine` is a reusable factory interface. Each engine holds projection plugins,
CRS readers, aliases and grids; each `createProjection()` call creates an independent
transform for a specific CRS pair.

```ts
import type { ProjectionEngine } from "@math.gl/projection/types";
import { projectionEngine } from "@math.gl/projection";

const engine: ProjectionEngine = projectionEngine;
const mercator = engine.createProjection({ from: "WGS84", to: "EPSG:3857" });
const utm = engine.createProjection({ from: "WGS84", to: "EPSG:32631" });
await mercator.project([12, 55]);
await utm.project([12, 55]);
```

The `/types` entry exports only types. An `import type` adds no runtime code to a bundle.
The default `projectionEngine` includes the built-in projection catalogue, compatibility
readers and named datum catalogue. For selective imports, configure your own engine:

```ts
import { createProjectionEngine } from "@math.gl/projection/core";
import { mercator } from "@math.gl/projection/projections/merc";

const engine = createProjectionEngine({ projections: [mercator] });
const projection = engine.createProjection({ to: "EPSG:3857" });
```

`CustomProjectionEngine`, `CRSProjectionEngine` and `LazyCRSProjectionEngine`
implement this interface. The eager catalogue is available as `projectionEngine`;
the lazy catalogue as `lazyProjectionEngine`. Both lazy exports are available
from `@math.gl/projection/projections/lazy`.

## Engine configuration

`createProjectionEngine({projections, parsers, aliases, datumCatalogs, datumGrids,
verticalGrids, enforceAxis, mode})` snapshots the registration arrays, alias definitions
and grid maps. Plugins and prepared grid data are shared. Engines have no source or target
CRS and no coordinate methods.

## createProjection(options)

Accepts `from`, `to`, `enforceAxis` and `mode`. Source and target default to `WGS84`;
behavior defaults to the engine configuration. Eager engines return a
[projection instance](projection-transform.md) with scalar, flat-buffer and reusable-output
methods. Instances have independent compiled transforms and scratch storage.

The `LazyCRSProjectionEngine` returns a deferred projection synchronously. Creation
loads no algorithms. Use `await projection.preload()` before calling `projectSync()`
or `unprojectSync()`, or let the async coordinate methods load on first use.

With eager plugins, coordinate methods are synchronous. With lazy descriptors, construction
does not load algorithms; coordinate methods load them on first use and return promises.
The descriptor cache shares loading across transforms created by the same engine.

## createProjectionAsync(options)

Loads only the algorithms required by the CRS pair and returns a synchronous projection
instance. Unrelated registered descriptors remain unloaded. Rejected loads can be retried.

## Migration

Replace `new ProjectionEngine({from, to, projections, ...})` with
`createProjectionEngine({projections, ...}).createProjection({from, to})`.
Direct construction of a single transform is available as `new ProjectionTransform(...)`.
The `Projection` and `LazyProjection` convenience classes retain their existing APIs.


## Lazy creation and warm-up

```ts
import {LazyCRSProjectionEngine} from '@math.gl/projection/projections/lazy';

const engine = new LazyCRSProjectionEngine();
const deferred = engine.createProjection({to: 'EPSG:3857'}); // synchronous; no loading
await deferred.preload();
const point = deferred.projectSync([12, 55]);

const ready = await engine.createProjectionAsync({to: 'EPSG:32631'});
const utm = ready.project([12, 55]); // synchronous
```
