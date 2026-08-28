# Proj4Projection

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.3-blue.svg?style=flat-square" alt="From-v3.3" />
</p>

## Usage

Reproject WGS84 coordinates to another CRS

```js
import {Proj4Projection} from '@math.gl/proj4';

const nad83Proj =
  '+title=NAD83 (long/lat) +proj=longlat +a=6378137.0 +b=6356752.31414036 +ellps=GRS80 +datum=NAD83 +units=degrees';
const projection = new Proj4Projection({from: 'WGS84', to: nad83Proj});

const wgs84Position = [21, 78, 5000];
const reprojectedPosition = projection.project(wgs84Position);
```

Define Projection Aliases

```js
import {Proj4Projection} from '@math.gl/proj4';

Proj4Projection.defineProjectionAliases({
  'EPSG:4326': '+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees',
  'EPSG:4269':
    '+title=NAD83 (long/lat) +proj=longlat +a=6378137.0 +b=6356752.31414036 +ellps=GRS80 +datum=NAD83 +units=degrees'
});
const projection = new Proj4Projection({from: 'EPSG:4326', to: 'EPSG:4269'});
```

Respect the axis order declared by a coordinate system

```js
const projection = new Proj4Projection({
  from: '+proj=longlat +datum=WGS84 +axis=neu',
  to: 'EPSG:3857',
  enforceAxis: true
});

const position = projection.project([37.8, -122.4]);
```

Register an NTv2 datum grid before using it in a projection definition

```js
const grid = await fetch('/grids/local-datum.gsb').then(response => response.arrayBuffer());
Proj4Projection.registerDatumGrid('local-datum.gsb', grid);

const projection = new Proj4Projection({
  from: '+proj=longlat +ellps=WGS84 +nadgrids=local-datum.gsb +no_defs',
  to: 'WGS84'
});
```

## Static Fields

### `Proj4Projection.defineProjectionAliases(projections: {[alias: string]: Proj4CRSDefinition})`

Defines projection aliases from authority codes, PROJ strings, WKT strings, or PROJJSON objects.

### `Proj4Projection.registerDatumGrid(name: string, grid: ArrayBuffer, options?: Proj4DatumGridOptions)`

Registers an NTv2 datum grid that projection definitions can reference with `+nadgrids=<name>`. Set `options.includeErrorFields` to `false` when the grid does not contain latitude and longitude error columns.

## CRS compatibility utilities

### `checkProj4CRSCompatibility(definition, options?)`

Checks whether a broad `ReadonlyCRSDefinition` can be constructed by proj4js. Mutable
`CRSDefinition` values and deeply readonly definitions from `SpatialReference` are both accepted.
It returns a structured result with `status` set to `supported`, `unsupported`, or `unknown`, along
with `checked`, `lossy`, an optional CRS `type`, and a stable `reason` code.

For serialized WKT and PROJ strings, `options.serialized` can be `probe` (the default), `unknown`,
or `accept`. Probing constructs a proj4js converter but does not transform any coordinates.

### `toProj4CRSDefinition(definition, options?)`

Narrows a broad readonly CRS definition to `Proj4CRSDefinition`. Supported object definitions are
returned unchanged, and serialized definitions are passed through unchanged. Unsupported object
types throw `Proj4CRSCompatibilityError` in the default `strict` mode.

Set `options.mode` to `horizontal` to explicitly extract the single Proj4-compatible horizontal
component from a `CompoundCRS`. This is lossy and rejects compounds with no or multiple eligible
horizontal components.

## Methods

### `constructor(options: Proj4ProjectionOptions)`

Create a new `Proj4Projection` instance that can convert between the specified coordinate systems.

- `from` and `to` are `Proj4CRSDefinition` values. They can be named coordinate systems, PROJ strings, WKT strings, or the `GeographicCRS`, `GeodeticCRS`, `ProjectedCRS`, and `BoundCRS` PROJJSON object kinds supported by proj4js 2.20.9. Both default to `WGS84`.
- `enforceAxis` defaults to `false`. Set it to `true` to respect the axis order declared by the source and destination coordinate systems.

### `project(coord: number[]): number[]`

Project a coordinate project from first to second coordinate system

### `unproject(coord: number[]): number[]`

Project a coordinate project from second to first coordinate system
