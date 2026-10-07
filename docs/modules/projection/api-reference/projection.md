# Projection

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.3-blue.svg?style=flat-square" alt="From-v3.3" />
</p>

`Projection` is the ready-to-use math.gl projection engine with all built-in
algorithms and WKT/PROJJSON readers. Its constructor, bound coordinate methods and
static registrations follow the former math.gl wrapper API. For smaller bundles
and instance-local configuration, use [`ProjectionTransform`](./projection-engine.md).

Static aliases and NTv2 grids affect subsequently constructed `Projection` instances.
Existing instances retain their prepared configuration. See the
[migration guide](../developer-guide/support.md) for strict-input and numerical differences from proj4js.

## Usage

Reproject WGS84 coordinates to another CRS

```js
import {Projection} from '@math.gl/projection';

const nad83Proj =
  '+title=NAD83 (long/lat) +proj=longlat +a=6378137.0 +b=6356752.31414036 +ellps=GRS80 +datum=NAD83 +units=degrees';
const projection = new Projection({from: 'WGS84', to: nad83Proj});

const wgs84Position = [21, 78, 5000];
const reprojectedPosition = projection.project(wgs84Position);
```

Define Projection Aliases

```js
import {Projection} from '@math.gl/projection';

Projection.defineProjectionAliases({
  'EPSG:4326': '+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees',
  'EPSG:4269':
    '+title=NAD83 (long/lat) +proj=longlat +a=6378137.0 +b=6356752.31414036 +ellps=GRS80 +datum=NAD83 +units=degrees'
});
const projection = new Projection({from: 'EPSG:4326', to: 'EPSG:4269'});
```

Respect the axis order declared by a coordinate system

```js
const projection = new Projection({
  from: '+proj=longlat +datum=WGS84 +axis=neu',
  to: 'EPSG:3857',
  enforceAxis: true
});

const position = projection.project([37.8, -122.4]);
```

Register an NTv2 datum grid before using it in a projection definition

```js
const grid = await fetch('/grids/local-datum.gsb').then(response => response.arrayBuffer());
Projection.registerDatumGrid('local-datum.gsb', grid);

const projection = new Projection({
  from: '+proj=longlat +ellps=WGS84 +nadgrids=local-datum.gsb +no_defs',
  to: 'WGS84'
});
```

## Static Fields

### `Projection.defineProjectionAliases(projections: {[alias: string]: ReadonlyCRSDefinition})`

Defines projection aliases from authority codes, PROJ strings, WKT strings, or PROJJSON objects.

### `Projection.registerDatumGrid(name: string, grid: ArrayBuffer, options?: DatumGridOptions)`

Registers an NTv2 datum grid that projection definitions can reference with `+nadgrids=<name>`. Set `options.includeErrorFields` to `false` when the grid does not contain latitude and longitude error columns.

## Methods

### `constructor(options: ProjectionOptions)`

Create a new `Projection` instance that can convert between the specified coordinate systems.

- `from` and `to` are `ReadonlyCRSDefinition` values. They can be named coordinate systems, PROJ strings, WKT strings, or the `GeographicCRS`, `GeodeticCRS`, `ProjectedCRS`, and `BoundCRS` PROJJSON object kinds. See the [engine reference](./projection-engine.md) for supported methods and parameters. Both default to `WGS84`.
- `enforceAxis` defaults to `false`. Set it to `true` to respect the axis order declared by the source and destination coordinate systems.

### `project(coord: number[]): number[]`

Transform a coordinate from the source to the target coordinate system.

### `unproject(coord: number[]): number[]`

Transform a coordinate from the target to the source coordinate system.

### `projectTo(coordinate, output)` / `unprojectTo(coordinate, output)`

Write a coordinate into a preallocated number array, `Float32Array` or `Float64Array`
and return the same output object. Exact input/output identity supports in-place use.
The inherited `projectToSync` and `unprojectToSync` methods have the same storage contract.
See [reusable scalar outputs](./projection-engine.md#reusable-scalar-outputs) for capacity,
overlap, rounding, error and lazy-loading behavior.

### `projectFlat(coordinates, dimension = 2)` / `unprojectFlat(coordinates, dimension = 2)`

Transform interleaved `Float32Array` or `Float64Array` records in place and return
the same view. Record widths, precision and failure behavior follow the
[engine flat-array contract](./projection-engine.md#flat-typed-arrays-in-place).
