# Discrete Global Grids

Discrete global grid systems are powerful tools that enables us to convert geospatial data into a common, easy-to-analyze form.

## Why DGGS in math.gl

Today there are multiple DGGS grid systems, and it is not unusual for an application to have to work with
more than one DGGS. This can require working with a set of independent DGGS libraries with large API surfaces and subtly different API conventions, which can be taxing for implementors and maintainers.

We found that there is a value in having a common set of small, easy-to-use DGGS libraries that work with common API conventions.

## Goals

The DGGS support in math.gl is currently focused on decoding cell indexes or tokens into center points (lng/lat) or cell boundary polygons.

Encoding (lng/lat to cell index) and advanced operations (child/neighbor calculation, polygon fills etc) are not currently included. Some basic encoding may be included in the future, however it is a goal to keep these libraries fairly small, and the intention is not to eventually fully duplicate large existing DGGS libraries.

## Supported Grid Systems

| DGGS                                                | Module                  | Functionality                   |
| --------------------------------------------------- | ----------------------- | ------------------------------- |
| ![GeoHash](../../images/dggs/geohash.png 'GeoHash') | `@math.gl/dggs-geohash` | Get geometry of GeoHash tokens. |
| ![QuadKey](../../images/dggs/quadkey.png 'QuadKey') | `@math.gl/dggs-quadkey` | Get geometry of QuadKey tokens  |
| ![S2](../../images/dggs/s2.png 'S2')                | `@math.gl/dggs-s2`      | Get geometry of S2 tokens.      |
| ![H3](../../images/dggs/h3.png 'H3')                | `h3-js` \*              | Get geometry of H3 tokens.      |

Note that `h3-js` is not a `math.gl` library. For H3 it is recommended to work directly with the H3 JavaScript bindings.

## H3 API Conventions

In terms of API design and nomenclature, the golden standard for DGGS systems at this time is arguably [H3](https://h3geo.org), in terms of functionality, number of languages and platforms supported, community activity etc.

Rather than expose the original function names as in the existing JavaScript libraries for each DGGS, math.gl applies API naming convention based on the H3 API.

| Function               | **H3**                  | S2                  | QuadKey                  | GeoHash                  |
| ---------------------- | ----------------------- | ------------------- | ------------------------ | ------------------------ |
| Get cell center        | **`getH3LngLat`**       | `getS2LngLat`       | `getQuadKeyLngLat`       | `getGeoHashLngLat`       |
| Get cell boundary      | **`getH3Boundary`**     | `getS2Boundary`     | `getQuadKeyBoundary`     | `getGeoHashBoundary`     |
| Get cell boundary flat | **`getH3BoundaryFlat`** | `getS2BoundaryFlat` | `getQuadKeyBoundaryFlat` | `getGeoHashBoundaryFlat` |

## Comparison of DGGS Systems

| Characteristic    | **H3**     | S2          | QuadKey     | GeoHash     |
| ----------------- | ---------- | ----------- | ----------- | ----------- |
| Cell shape        | Hexagon    | "square"    | square      | square      |
| Cell area         | "constant" | varies      | varies      | varies      |
| Neighbor distance | "constant" | 1 or 1.4... | 1 or 1.4... | 1 or 1.4... |
| Child cells       | 7          | 4           | 4           | 4           |
| Exact hierarchy   | No         | Yes         | Yes         | Yes         |

### H3

H3 is now widely used across the geospatial industry (it was initially developed at Uber).
While not directly supported by math.gl, H3 is in fact the DGGS we would recommend for most applications.

- Extensive, optimized, evolving API.
- Superb cross-language support.
- Equal distance between neighboring cells
- Similar size between all cells.
- K-ring formation for filtering and convolutions

Downsides:

- More complex projection math.

### S2

S2 works well when exact aggregation and subdivision are needed but has some disadvantages when e.g. neighbor cell calculations are important

### GeoHash

[Geohash](http://en.wikipedia.org/wiki/Geohash) is common choice in the open source word.

Good cross-language support.

### QuadKey

Bing Maps uses a [quadkey](http://msdn.microsoft.com/en-us/library/bb259689.aspx.) structure as their tiling scheme. Here is an overview of the concept

- Quadtrees are more predictable in that each level spans a square (at least in terms of coordinates), whereas in geohash representation sometimes squares sometimes rectangles are spanned.
