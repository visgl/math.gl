# Package ownership

- `@math.gl/core`: array-based vectors, matrices, quaternions, Euler angles and poses. Canonical exports: `modules/core/src/index.ts`; documentation: `docs/modules/core/README.md`.
- `@math.gl/types`: shared numeric-array and bounds types; not a replacement for package-specific declarations.
- `@math.gl/web-mercator`: map projection utilities and viewport/camera math. It does not render a map.
- `@math.gl/geospatial`: ellipsoid, globe, geographic tile and tangent-plane math.
- `@math.gl/crs`: coordinate reference system representation. `@math.gl/projection` owns coordinate transformations and projection engines; inspect their public entry points and documented optional subpaths before selecting an engine.
- `@math.gl/geoid`: geoid grid parsing and height offsets; distinguish ellipsoidal from orthometric height.
- `@math.gl/geometry`: geometry construction; `@math.gl/geometry-utils`: geometry processing; `@math.gl/culling`: bounding volumes and spatial queries; `@math.gl/polygon`: documented polygon/polyline operations.
- `@math.gl/dggs`: cell decoding across grid systems. Specify the grid and resolution; cell identifiers are not interchangeable.
- `@math.gl/wkb` and `@math.gl/geoarrow`: binary geometry and columnar geometry layouts. Preserve offsets, dimensionality and buffer ownership.
- `@math.gl/sun` and `@math.gl/timezone`: astronomical and timezone calculations. Verify time units, timezone handling and optional data requirements.

Consult each module's `package.json`, `src/index.ts`, tests, and `docs/modules/<module>` pages for exact APIs and maturity. Internal helpers and experimental APIs are not guarantees of stable application support.
