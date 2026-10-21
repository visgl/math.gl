# Package ownership

- `@math.gl/core`: array-based vectors, matrices, quaternions, Euler angles and poses. Canonical exports: `modules/core/src/index.ts`; documentation: `docs/modules/core/README.md`.
- `@math.gl/core/types`: shared numeric-array and bounds types; not a replacement for package-specific declarations.
- `@math.gl/web-mercator`: map projection utilities and viewport/camera math. It does not render a map.
- `@math.gl/geospatial`: ellipsoid, globe, geographic tile and tangent-plane math.
- `@math.gl/geospatial/crs`: coordinate reference system representation. `@math.gl/geospatial/projection` owns coordinate transformations and projection engines; inspect their public entry points and documented optional subpaths before selecting an engine.
- `@math.gl/earth/geoid`: geoid grid parsing and height offsets; distinguish ellipsoidal from orthometric height.
- `@math.gl/geometry`: geometry construction; `@math.gl/geometry/utils`: geometry processing; `@math.gl/geometry/culling`: bounding volumes and spatial queries; `@math.gl/geometry/polygon`: documented polygon/polyline operations.
- `@math.gl/dggs`: cell decoding across grid systems. Specify the grid and resolution; cell identifiers are not interchangeable.
- `@math.gl/geospatial/wkb` and `@math.gl/geospatial/geoarrow`: binary geometry and columnar geometry layouts. Preserve offsets, dimensionality and buffer ownership.
- `@math.gl/earth/sun` and `@math.gl/earth/timezone`: astronomical and timezone calculations. Verify time units, timezone handling and optional data requirements.

Consult each module's `package.json`, `src/index.ts`, tests, and `docs/modules/<module>` pages for exact APIs and maturity. Internal helpers and experimental APIs are not guarantees of stable application support.
