# Discrete Global Grids

Discrete global grid systems are powerful tools that enables us to convert geospatial data into a common, easy-to-analyze form.

## Why DGGS support in math.gl?

There is value in having access to a common set of minimal, pluggable, and interchangeable decoders for DGGS and DGGS-like global grid encodings.

Today there are multiple advanced DGGS grid systems that offer different tradeoffs, and it is not unusual for an application to consume data encoded in one or more systems.

This requires integrating independent DGGS libraries with different API conventions and terminology. These libraries can also be large dependencies, and bundling complications such as WebAssembly can add work for implementers and maintainers.

## Scope

The DGGS support in math.gl is intentionally limited to decoding cell indexes or tokens into center points (lng/lat) or cell boundary polygons, plus detecting conventional cell-column names. This compact contract is designed to power the DGGS-oriented layer in deck.gl-community (currently named [`GlobalGridLayer`](https://github.com/visgl/deck.gl-community/tree/master/modules/geo-layers/src/global-grid-layer)).

- Encoding (lng/lat to cell index) may be supported in a future version.
- Advanced operations (parent/child and neighbor calculation, polygon fills, compaction, traversal, metrics, etc.) are out of scope. The goal is to keep these decoders small rather than duplicate complete DGGS libraries.

For a comprehensive abstraction across DGGS implementations and the OGC API - DGGS surface, see [DGGAL, the Discrete Global Grid Abstraction Library](https://dggal.org/). `@math.gl/dggs` is not intended to compete with or reproduce that broader project.

## Cell-column detection

`findDGGSCellColumn(columnNames)` recognizes conventional GeoHash, Quadkey, and S2 column names. It returns the original column name together with its decoder, or `null` when no unique match is available. This lets table- and layer-oriented code infer the common case without guessing from cell values.

## Supported Grid Systems

| DGGS                                                | Module          | Functionality                   |
| --------------------------------------------------- | --------------- | ------------------------------- |
| ![GeoHash](../../images/dggs/geohash.png 'GeoHash') | `@math.gl/dggs` | Get geometry of GeoHash tokens. |
| ![QuadKey](../../images/dggs/quadkey.png 'QuadKey') | `@math.gl/dggs` | Get geometry of QuadKey tokens  |
| ![S2](../../images/dggs/s2.png 'S2')                | `@math.gl/dggs` | Get geometry of S2 tokens.      |
| ![H3](../../images/dggs/h3.png 'H3')                | `h3-js` \*      | Get geometry of H3 tokens.      |

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
