# Datum and height grids

## Load datum-grid data separately

Projection code and datum-grid data have separate lifecycles. Fetch grid files and
decode them before creating an instance; coordinate transforms then stay synchronous.
The application chooses the grid source, caching, and error handling.

```typescript title="grid-projection.ts"
import {ProjectionEngine, parseNTv2Grid} from '@math.gl/projection';

export async function createGridProjection(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Could not load datum grid: ' + response.status);
  const grid = parseNTv2Grid(await response.arrayBuffer());
  return new ProjectionEngine({
    from: '+proj=longlat +ellps=clrk66 +nadgrids=regional.gsb',
    to: 'EPSG:4326',
    datumGrids: {'regional.gsb': grid}
  });
}
```

Use a grid intended for the declared source ellipsoid and datum transformation;
`regional.gsb` is a registration key, not a built-in dataset. The engine performs no
implicit fetches. Reuse prepared grids and projection instances for multiple batches.

For supported horizontal GeoTIFF grids, `loadGeoTIFFGrid(decodedTIFF)` prepares the
object returned by a separately chosen TIFF reader. The adapter imports no TIFF
library. That reader and its workers have their own bundle costs and can also be
loaded on demand. See [datum grids](./projection-engine.md#horizontal-datum-grids)
for band conventions, ownership, coverage, and inverse-edge behavior. Explicit vertical
height conversion is described below; time-dependent operations use the explicit [pipeline API](projection-pipeline.md).

## Convert geoid heights

Register a prepared `VerticalGrid` under the name used by `+geoidgrids`. A source grid
converts gravity-related height **H** to ellipsoidal height **h** using **h = H + N**;
a destination grid applies **H = h - N**. The supplied offsets **N** are geoid undulations
in metres. Source conversion runs before the horizontal datum transformation; destination
conversion runs after it. Each grid is sampled in its own CRS's horizontal datum, at
Greenwich longitude and geographic latitude. These are explicit stages following
[PROJ's vertical-grid convention](https://proj.org/en/stable/operations/transformations/vgridshift.html).

```typescript
import {ProjectionEngine} from '@math.gl/projection/core';
import {parseGTXGrid} from '@math.gl/projection/grids/gtx';

const response = await fetch('/grids/local.gtx');
if (!response.ok) throw new Error('Could not load vertical grid');
const local = parseGTXGrid(await response.arrayBuffer());
const projection = new ProjectionEngine({
  from: '+proj=longlat +datum=WGS84 +geoidgrids=local',
  to: 'EPSG:4979',
  verticalGrids: {local}
});
const positions = new Float64Array([12, 41, 100, 7]);
projection.projectFlat(positions, 4); // height changes; measure 7 is preserved
```

Choose a model whose horizontal datum, vertical datum, tide convention and area of use
match your data. The key `local` is an application registration name, not an EPSG vertical
CRS or an automatically selected model. An ellipsoid alone does not enable a horizontal
datum shift: declare the datum or explicit `+towgs84` parameters when a shift is needed.

`Projection`, `ProjectionEngine` and `LazyProjection` accept the same per-instance
`verticalGrids` map. Load grid data before constructing the projection. Lazy projection
algorithms can still preload separately. No file, network request, TIFF decoder or geoid
model is imported implicitly. The optional readers can themselves be dynamically imported.

For an already loaded `@math.gl/geoid` model, use the structural adapter:

```typescript
import {createGeoidGrid} from '@math.gl/projection/grids/vertical';

// geoid is a previously prepared @math.gl/geoid Geoid instance.
const verticalGrids = {local: createGeoidGrid(geoid)};
```

The adapter calls `getHeight(latitudeDegrees, longitudeDegrees)` and retains the model's
interpolation and ownership rules. It adds no runtime dependency on `@math.gl/geoid`.
`createVerticalGrid({origin, step, size, offsets, noData})` instead snapshots a regular
bilinear grid. Origin and positive spacing are degrees; rows run south to north and
columns west to east. `parseGTXGrid(ArrayBuffer)` snapshots big-endian float32 metre
offsets from the [GTX format](https://gdal.org/en/stable/drivers/raster/gtx.html).
Its conventional -88.8888 sentinel, non-finite nodes, and values outside ±1000 metres
are treated as nodata, consistent with PROJ's GTX reader.

Both snapshot readers include the outer nodes and do not extrapolate. Longitudes can
be expressed in equivalent 360-degree turns, including bounded grids crossing the
antimeridian. A missing global seam cell is not synthesized; the grid must cover the
requested coordinate. A nodata corner with nonzero interpolation weight makes that
sample uncovered. Ordered `+geoidgrids=regional,global` lists try the first covering
grid. Prefix an optional registration with `@`; use an explicit final `null` for a
zero-offset fallback. Missing required registrations fail construction; uncovered
coordinates and non-finite custom offsets throw during transformation.

Vertical transformations require XYZ or XYZM, including flat arrays; M and later
ordinates remain measures. `+vunits`/`+vto_meter` and requested axes are applied around
the metre-based height stage. A failing flat record is left unchanged along with all
later records; earlier records may have completed. A vertical grid cannot be attached
to a geocentric or identity CRS or combined with lossy horizontal extraction.

This API supports explicit vertical-grid transformations.
Compound/vertical WKT or PROJJSON execution, dynamic datum interpretation and
automatic EPSG operation lookup remain outside the supported subset. Optional
[operation selection](operation-catalog.md) filters application-reviewed candidates. Explicit typed pipelines and
coordinate epochs are available through the optional [pipeline API](projection-pipeline.md).

### Vertical GeoTIFF geoid models

`loadVerticalGeoTIFFGrid` prepares the geoid subset of
[PROJ Geodetic TIFF Grids](https://proj.org/en/stable/specifications/geodetictiffgrids.html).
Use it for modern GeoTIFF geoid models; `loadGeoTIFFGrid` remains the separate adapter
for horizontal latitude/longitude shifts. Both receive a decoded TIFF object and import
no TIFF decoder. Fetching, compression and worker choices belong to the application.

The reader also accepts a plain `VerticalGridGeoTIFFData` dataset, structurally
compatible with loaders.gl's `GeoTIFFRasterLoader` output. Pass the decoded dataset
directly to `loadVerticalGeoTIFFGrid(dataset)`. It preserves original band indices,
so band zero must be included. Image order, unscaled samples, per-image/per-band
GDAL metadata, GeoKeys, nodata and geometry tags have the same validation as the
geotiff.js input. No runtime dependency on loaders.gl is added.

```typescript
import {ProjectionEngine} from '@math.gl/projection/core';
import {loadVerticalGeoTIFFGrid} from '@math.gl/projection/grids/vertical-geotiff';
import {fromArrayBuffer} from 'geotiff'; // separately installed, application-owned decoder

const response = await fetch('/grids/local-geoid.tif');
if (!response.ok) throw new Error('Could not load geoid grid');
const geoid = await loadVerticalGeoTIFFGrid(
  await fromArrayBuffer(await response.arrayBuffer())
);
const projection = new ProjectionEngine({
  from: '+proj=longlat +datum=WGS84 +geoidgrids=geoid',
  to: 'EPSG:4979',
  verticalGrids: {geoid}
});
projection.project([12, 41, 100]); // synchronous after grid preparation
```

The adapter requires geographic degree coordinates, explicit PixelIsPoint or PixelIsArea,
positive north-up pixel spacing, and one tiepoint. PixelIsArea is shifted to cell centres;
nonzero tiepoint pixel indices are honored. Explicit non-Greenwich prime meridians,
rotated/projected rasters, overviews and masks are rejected. It does not transform or
resolve the interpolation CRS: the application must verify the file's geographic datum
and longitude reference match the CRS supplied to the projection.

Dataset metadata must declare `TYPE=VERTICAL_OFFSET_GEOGRAPHIC_TO_VERTICAL`, and band
zero must declare `DESCRIPTION=geoid_undulation`. Its unit must be `metre` (also the
default if absent). Raw nodata is compared in the decoded band precision (including float32 rounding)
before `raw * SCALE + OFFSET`; absent scale
and offset default to 1 and 0. Only band zero is decoded, so optional uncertainty bands
are excluded. Horizontal, velocity, ellipsoidal-height-offset and vertical-to-vertical
grids are rejected, as are requested non-bilinear interpolation and non-metre bands.

Prepared offsets are copied. TIFF objects and decoded arrays can be released after
loading. Multiple images must be ordered parent before nested child, or have disjoint
interiors; later images take precedence, including on a shared edge. A child's uncovered
or nodata sample falls back to an earlier covering image. This is an explicit fallback
policy, not a promise of matching every PROJ subgrid-selection edge case. Bounded
antimeridian grids use equivalent longitudes; no missing seam cells are synthesized.

Independent tests decode seven small authored files using `geotiff` and compare with
PROJ 9.5.1: point/area registration, Deflate, big-endian scaled int16, nonzero tiepoints,
nested grids, nodata and antimeridian sampling. See [validation](../independent-validation.md#vertical-geotiff-format-qualification)
for scope. The adapter and decoder can both be dynamically imported; normal core and
projection bundles do not retain this reader.

