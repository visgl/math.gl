# proj-wasm

A transpiled WebAssembly version of [PROJ](https://github.com/OSGeo/PROJ),
available for use from JavaScript.

This package is part of the [clj-proj](https://github.com/willcohen/clj-proj)
project, which is new. A release can still make breaking changes. See its
[README](https://github.com/willcohen/clj-proj/blob/main/README.md) for more
details.

## Installation

```bash
npm install proj-wasm
```

## Usage

```javascript
import * as proj from 'proj-wasm';

await proj.init();

// A call with no context option makes a context.
const transformer = await proj.projCreateCrsToCrs({
  source_crs: "EPSG:4326",
  target_crs: "EPSG:3857"
});

// EPSG:4326 uses latitude, longitude order.
const coords = await proj.coordArray(1);
await proj.setCoords(coords, [[42.3601, -71.0589, 0, 0]]);
await proj.projTransArray({ p: transformer, direction: proj.PJ_FWD, n: 1, coord: coords });

const [x, y] = await proj.getCoords(coords, 0);
console.log(x, y); // -7910240.56 5215074.24

// In Node.js, stop the workers to let the process exit.
await proj.shutdown();
```

### In a browser

A page loads proj-wasm and its dependencies through an import map. A module
worker does not use the import map, so ffi-wasm gives each worker the URLs
that it needs.

```html
<script type="importmap">
{
  "imports": {
    "squint-cljs/core.js": "https://cdn.jsdelivr.net/npm/squint-cljs@0.14.210/core.js",
    "squint-cljs/src/squint/string.js": "https://cdn.jsdelivr.net/npm/squint-cljs@0.14.210/src/squint/string.js",
    "resource-tracker": "https://cdn.jsdelivr.net/npm/resource-tracker@0.0.1/resource.mjs",
    "worker-router": "https://cdn.jsdelivr.net/npm/@wcohen/worker-router@0.0.2/dist/index.mjs",
    "worker-router/worker-bootstrap": "https://cdn.jsdelivr.net/npm/@wcohen/worker-router@0.0.2/dist/worker-bootstrap.mjs",
    "comlink": "https://cdn.jsdelivr.net/npm/comlink@4.4.2/dist/esm/comlink.mjs",
    "ffi-wasm": "https://cdn.jsdelivr.net/npm/ffi-wasm@0.0.3/dist/ffi-wasm.mjs",
    "proj-wasm": "https://cdn.jsdelivr.net/npm/proj-wasm@0.1.0/dist/proj.mjs"
  }
}
</script>
<script type="module">
  import * as proj from 'proj-wasm';
  await proj.init();
</script>
```

### Names

Each function has a camelCase name and a snake_case name, for example
`projCreateCrsToCrs` and `proj_create_crs_to_crs`. The snake_case names are the
PROJ C names. The snake_case name of a function that changes its argument ends
in `_BANG_`, for example `set_coords_BANG_`.

## API Reference

### Core Functions

- `init(options?)` - Start the worker pool. Call it first.
  - `options.workers` - Number of workers (default: `"auto"`)
- `shutdown()` - Stop the workers. In Node.js, call it to let the process exit.
- `contextCreate()` - Create a PROJ context. A call with no `context` option makes one.
  - To set the network of a context to off, call `projContextSetEnableNetwork({ context, enabled: 0 })`.
- `projCreateCrsToCrs(options)` - Create a transformation between two coordinate reference systems
  - `options.context` - PROJ context (optional)
  - `options.source_crs` - Source CRS (for example, "EPSG:4326")
  - `options.target_crs` - Target CRS (for example, "EPSG:3857")

### Coordinate Handling

- `coordArray(n)` - Create a coordinate array for n coordinates (JS-side Float64Array)
- `setCoords(coords, values)` - Set coordinate values
  - `coords` - Coordinate array created with `coordArray`
  - `values` - Array of [x, y, z, t] coordinate tuples
- `projTransArray(options)` - Transform coordinates
  - `options.p` - The transformer
  - `options.direction` - 1 for forward, -1 for inverse
  - `options.n` - Number of coordinates
  - `options.coord` - The coordinate array object
- `getCoords(coords, idx)` - Returns `[x, y, z, t]` at index `idx`
- `getWorkerCount()` - Returns the number of workers in the pool

### CRS Introspection

Functions that examine CRS structure return plain objects with typed fields. The library reads C output parameters automatically. No heap management is necessary. Return keys agree with the calling convention: camelCase aliases return camelCase keys, and snake_case aliases return snake_case keys.

- `projGetAreaOfUse(options)` / `proj_get_area_of_use(options)` - Get area of use for a PJ object
  - Returns `{ westLonDegree, southLatDegree, eastLonDegree, northLatDegree, areaName }` (camelCase) or `{ west_lon_degree, south_lat_degree, east_lon_degree, north_lat_degree, area_name }` (snake_case), or `null`
- `projEllipsoidGetParameters(options)` - Get ellipsoid parameters
  - Returns `{ semiMajorMetre, semiMinorMetre, isSemiMinorComputed, invFlattening }` or `null`
- `projCsGetAxisInfo(options)` - Get coordinate system axis info
  - Returns `{ name, abbreviation, direction, unitConvFactor, unitName, unitAuthName, unitCode }` or `null`
- `projPrimeMeridianGetParameters(options)` - Get prime meridian parameters
  - Returns `{ longitude, unitConvFactor, unitName }` or `null`
- `projCoordoperationGetMethodInfo(options)` - Get coordinate operation method
  - Returns `{ methodName, methodAuthName, methodCode }` or `null`
- `projUomGetInfoFromDatabase(options)` - Get unit of measure info
  - Returns `{ name, convFactor, category }` or `null`
- `projGridGetInfoFromDatabase(options)` - Get grid file info
  - Returns `{ fullName, packageName, url, directDownload, openLicense, available }` or `null`

### CRS Catalog

`projGetCrsInfoListFromDatabase` returns the CRS catalog as an array of plain
objects. An empty `auth_name` gives all authorities.

```javascript
const ctx = await proj.contextCreate();
const entries = await proj.projGetCrsInfoListFromDatabase({
  context: ctx,
  auth_name: ""
});
```

Each entry has camelCase keys: `authName`, `code`, `name`, `type`,
`deprecated`, `bboxValid`, `westLonDegree`, `southLatDegree`, `eastLonDegree`,
`northLatDegree`, `areaName`, `projectionMethodName`, `celestialBodyName`.

This function has no type filter. To select one kind of CRS, compare
`entry.type` with an exported `PJ_TYPE_*` constant, for example
`proj.PJ_TYPE_PROJECTED_CRS` (15):

```javascript
const projected = entries.filter(e => e.type === proj.PJ_TYPE_PROJECTED_CRS);
```

## License

proj-wasm is under the MIT License. Refer to `LICENSE` in this package.

The package also contains code and data from other projects, for example PROJ
and Emscripten. Refer to
[THIRD-PARTY-NOTICES.md](https://github.com/willcohen/clj-proj/blob/main/THIRD-PARTY-NOTICES.md).
