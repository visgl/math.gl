# Geographic tile queries

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

```typescript
import {getGeographicTile, getGeographicTileBounds, getGeographicTileRanges}
  from '@math.gl/geospatial';

getGeographicTile(175, 20, 3); // {x: 7, y: 3, level: 3}
getGeographicTileBounds({x: 7, y: 3, level: 3}); // [135, 0, 180, 22.5]
getGeographicTileRanges([170, -10, -170, 10], 3);
// [{minX: 0, maxX: 0, minY: 3, maxY: 4},
//  {minX: 7, maxX: 7, minY: 3, maxY: 4}]
```

The helpers define an equal-angle geographic quadtree: one world tile at level zero,
with `2 ** level` columns and rows. X increases eastward from longitude -180; Y
increases southward from latitude 90. Levels are integers from 0 through 30.
Coordinates and bounds are in degrees. This grid is not Web Mercator XYZ and does
not claim compatibility with a particular tile protocol's root layout.

## getGeographicTile(longitude, latitude, level)

Returns `{x, y, level}` for a finite longitude in [-180, 180] and latitude in [-90, 90].
Interior grid edges belong to the tile east or south of the edge. The outer east
and south edges belong to the last column and row. Longitude -180 addresses the
first column; +180 addresses the last. Longitudes are not implicitly normalized.

## getGeographicTileBounds(tile)

Returns `[west, south, east, north]`. Tile coordinates must be integers inside the
level's grid. Bounds never cross the antimeridian and can feed geographic requests
or conversion to Cartesian bounds using `makeOBBFromRegion`.

## getGeographicTileRanges(bounds, level)

Returns at most two disjoint, inclusive integer ranges `{minX, maxX, minY, maxY}`
sorted by minX. Input `[west, south, east, north]` uses the same degree bounds
contract as `splitGlobeBounds`: west > east indicates an antimeridian crossing;
[-180, south, 180, north] covers all longitudes. Wrapped ranges that overlap or
are adjacent on coarse grids are merged. Empty seam fragments are omitted when
the query has positive longitude extent.

Positive-area queries include tiles with positive overlap, excluding neighbors
that only touch the outer query edge. Zero-width or zero-height queries use point
edge ownership on that axis. Both seam spellings remain explicit for a zero-width
[180, south, -180, north] query.

Construction takes constant space and time, including level 30. Callers decide
whether and how to enumerate the potentially enormous result. These helpers cover
geographic rectangles; they do not calculate viewport footprints, prioritize tile
requests, manage streaming, or implement geographic-distance nearest queries.

## Cartesian adapters

Convert degree bounds and heights to a geodetic region before creating an OBB:

```typescript
import {makeOBBFromRegion} from '@math.gl/geospatial';
const [west, south, east, north] = getGeographicTileBounds(tile);
const radians = Math.PI / 180;
const box = makeOBBFromRegion([
  west * radians, south * radians, east * radians, north * radians, 0, 1000
]);
```

The height interval is application supplied. Index construction and storage belong
in a spatial index; tile refinement and cache policy belong in the tile system.
