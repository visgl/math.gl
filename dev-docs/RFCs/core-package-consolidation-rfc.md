# RFC: Consolidate core capabilities and organize public subpaths

- Status: Draft
- Date: November 17, 2026
- Baseline: master at `c6813233ae6d0235c456497ead342a306ef1a0e4`

## Summary

Move `@math.gl/arrow` into focused `@math.gl/core` subpaths, move `@math.gl/web-mercator` into `@math.gl/geospatial/web-mercator`, and expose matrix math, colors, scales, and LUTs through focused core entry points. Apache Arrow becomes an optional peer dependency of core, installed by applications that use Arrow-dependent capabilities.

DGGS remains a separate package; moving its grid systems into geospatial or changing their dependency contracts is deferred. Tasks also remains separate.

This reduces the active release set from nine packages to seven: core, geometry, geospatial, earth, dggs, sql, and tasks. Package consolidation must preserve independent runtime and declaration loading for consumers that only need matrix math.

## Current structure

Master contains nine packages, currently declaring version `5.0.0-beta.11`. Core has a single root export. Arrow has root, `/utf8`, `/geoarrow`, `/geoarrow-utils`, and `/wkb` exports and depends on core, geometry, and tasks; Apache Arrow is a peer dependency. Tasks has no package dependencies and carries browser substitutions for Node worker/process implementations. Web-mercator depends on core. Geometry depends on core. Geospatial and SQL depend on Arrow and tasks as well as core and geometry; geospatial also depends on web-mercator.

Color and scale capabilities currently span geometry and SQL. Geometry's `/color` exposes `ColorLUT`, `createColorLUTSampler`, and `applyColorLUT`. SQL's `/scales` mixes reusable scale specifications, compilation, palettes, color conversions, and sketches with SQL expression parsing. Its `/arrow-scales` adds column-oriented integration.

These are the actual consolidation sources; this proposal does not assume the older standalone types, polygon, culling, CRS, or projection packages still exist.

## Goals

- Reduce package publishing and dependency coordination.
- Give foundational capabilities clear, independently usable import paths.
- Let applications supply one compatible Apache Arrow runtime.
- Share color, scale, and LUT algorithms across SQL, geometry, and renderers.
- Preserve browser workers, Node workers, ESM, CommonJS, and TypeScript support.

Changing numerical algorithms, task execution semantics, SQL syntax, or the Apache Arrow minimum supported version is outside this proposal.

## Public entry points

All paths below use the existing scoped npm package names. `math.gl/core/matrix` is conceptual shorthand; the published import is `@math.gl/core/matrix`. This RFC does not restore the unscoped `math.gl` package.

| Entry point | Responsibility |
| --- | --- |
| `@math.gl/core` | Existing foundational root API, retained for compatibility |
| `@math.gl/core/matrix` | Vectors, matrices, quaternions, Euler rotations, poses, and related transforms |
| `@math.gl/core/color` | Color encodings, conversions, interpolation, scales, palettes, and LUT construction/sampling |
| `@math.gl/tasks` | Existing separate task scheduling and worker package |
| `@math.gl/core/arrow` | Arrow tables, vectors, schemas, column utilities, GeoArrow descriptors/adapters/kernels, and WKB integration |
| `@math.gl/core/utf8` | Existing Arrow UTF-8 utilities |
| `@math.gl/sql/scales` | SQL scale parsing, domain resolution, compilation, and numeric/color Arrow evaluation |
| `@math.gl/geometry/arrow` | GeoArrow tessellation requiring geometry algorithms |
| `@math.gl/geospatial/web-mercator` | Existing standalone Web Mercator API |

Use four focused core subpaths: `/matrix`, `/color`, `/utf8`, and `/arrow`. Combine reusable colors, scales, palettes, and LUTs under `/color`. Combine general Arrow utilities, GeoArrow, and WKB/Arrow integration under `/arrow`; internal implementation directories do not require separate public exports. There are no separate core `/geoarrow`, `/geoarrow-utils`, `/wkb-arrow`, or `/scales-arrow` exports. Specialized SQL scale APIs live in `@math.gl/sql/scales`.

The matrix entry point exposes the established class API and related low-level functions without importing Arrow, task scheduling, color tables, or worker code. Root compatibility exports reference the same implementations, preserving constructor identity. New optional integrations are not added to the root barrel.

## Dependency direction and cycle prevention

Core must have no dependency on geometry, SQL, geospatial, or the two retired packages (arrow and web-mercator). Tasks remains a separate package with its existing API, workers, and browser mappings. Core may retain a dependency on `@math.gl/tasks` where the moved Arrow implementation requires it; matrix and ordinary color/scale/LUT entry points must not import Arrow or task implementations.

Arrow currently imports `earcut` from geometry in `geoarrow-utils/tessellate.ts` and `geoarrow-utils/stream-tessellate.ts`. Move those geometry-dependent operations to `@math.gl/geometry/arrow`. Preserve the standalone kernels and descriptors in core. Do not solve the dependency cycle by making core depend on geometry or by duplicating triangulation.

After consolidation, geometry depends on core; SQL depends on core and geometry; geospatial depends on core, geometry, and SQL where currently necessary. Earth, DGGS, and tasks retain their existing boundaries. Internal core references use relative imports, avoiding self-references through the package export map.

## Apache Arrow as an optional peer

Core declares:

```json
{
  "peerDependencies": {
    "apache-arrow": ">=17.0.0"
  },
  "peerDependenciesMeta": {
    "apache-arrow": {"optional": true}
  }
}
```

Core does not list Apache Arrow in `dependencies` or `optionalDependencies`, or bundle a private copy. The optional peer declaration allows applications to omit Arrow without asking the package manager to install it automatically. Applications using Arrow-dependent entry points install it explicitly:

```sh
npm install @math.gl/core apache-arrow
```

An optional peer permits installation without Apache Arrow; it does not make an Arrow-dependent import work without the runtime. Document that boundary and provide an actionable missing-peer error where loading is explicitly lazy. Static Arrow entry points may fail through normal module resolution. SQL keeps a required Apache Arrow peer where its execution API requires it. Other packages exposing Arrow-dependent features must declare and document their own peer contract rather than assuming a transitive peer supplies the runtime.

The combined `core/arrow` entry point requires the application-provided Apache Arrow runtime. Matrix math, UTF-8 helpers, and ordinary color/scale/LUT algorithms remain usable without it. Runtime-independent GeoArrow/WKB implementation files may remain independent internally, but this RFC does not promise a separate public import for them without Arrow.

Generated declarations for the core root and non-Arrow subpaths must not transitively resolve Apache Arrow declarations. Use direct declaration entry points and avoid exporting Arrow types from shared root types. Apache Arrow remains a development dependency for repository compilation and tests.

## Color, scales, and LUT ownership

Move reusable scale types, validation, resolved-scale compilation, palettes, color encoding conversions, and generic quantile sketches out of SQL into core. Move LUT types and ordinary array sampling from geometry/color into core/color. Keep existing names and behavior during relocation.

Consolidate SQL scale parsing and Arrow evaluation under `@math.gl/sql/scales`, merging the current `/scales` and `/arrow-scales` entry points. This specialized API supports numeric outputs (such as radii or widths) as well as colors, so `/scales` describes its scope better than `/color-scales`.

Keep `parseSQLScaleExpression`, `parseSQLScaleAST`, `compileArrowScale`, `bindArrowScale`, `compileArrowScales`, scale-expression compiler integration, and their SQL-facing types in SQL. The implementation imports SQL expression parsing and compilation; moving it wholesale into core would introduce a forbidden dependency. SQL owns expression-driven extent/category/percentile/quantile resolution, streaming-domain integration, schema binding, and evaluation into numeric or encoded RGBA Arrow vectors with row/null preservation.

SQL delegates reusable color and scale algorithms to core/color. Extract general-purpose Arrow statistics or vector helpers into core/arrow only when they have a reusable contract independent of SQL expressions. Generic accumulation/sketch algorithms may live in core/color; SQL-specific domain orchestration remains in sql/scales.

Specify color encoding, interpolation, missing-value behavior, clamping, and LUT precision through the existing contracts. Consolidation must not silently change those contracts or palette contents. Preserve conformance fixtures and document one canonical owner for each exported type.

## Web Mercator migration

Move the full current Web Mercator API to geospatial/web-mercator, preserving names and behavior. Resolve imports inside geospatial relatively; code moved from web-mercator must not import the geospatial root. Update projection/web-mercator integration to use the moved implementation without creating a second implementation or constructor identity.

This intentionally trades a small standalone installation for fewer packages. Installing geospatial continues to install its declared dependencies even when an application uses only this subpath. Verify bundled code isolation separately from installed package size and document that distinction.

## Compatibility and rollout

1. Add the new core entry points and move shared color/scale/LUT foundations. Preserve existing core root imports.
2. Preserve the tasks workspace and update integration imports only where Arrow relocation requires it; retain its browser mappings, workers, licenses, and notices.
3. Move Arrow foundations into core, extract geometry-dependent tessellation, and establish the optional-peer and declaration boundaries.
4. Move Web Mercator into geospatial and update all internal dependencies.
5. Update examples, docs, benchmarks, tests, workspace configuration, build entry lists, and downstream migration guidance. Remove the two old workspaces from the active release set after consumers migrate.

| Existing import | Replacement |
| --- | --- |
| `@math.gl/core` matrix APIs | Existing root remains valid; focused imports use `@math.gl/core/matrix` |
| `@math.gl/tasks` | Unchanged; remains a separate package |
| `@math.gl/arrow` | `@math.gl/core/arrow` |
| `@math.gl/arrow/utf8` | `@math.gl/core/utf8` |
| `@math.gl/arrow/geoarrow` | `@math.gl/core/arrow` |
| `@math.gl/arrow/geoarrow-utils` | `@math.gl/core/arrow`, except tessellation |
| `@math.gl/arrow/wkb` | `@math.gl/core/arrow` |
| GeoArrow tessellation from arrow/geoarrow-utils | `@math.gl/geometry/arrow` |
| `@math.gl/web-mercator` | `@math.gl/geospatial/web-mercator` |
| `@math.gl/geometry/color` LUT APIs | `@math.gl/core/color` |
| Generic APIs from `@math.gl/sql/scales` | `@math.gl/core/color` |
| `@math.gl/sql/arrow-scales` | `@math.gl/sql/scales` |

SQL scale parsing and Arrow scale evaluation stay together in SQL; migration documentation must list moved symbols rather than directing every `/scales` import to core. Temporary re-exports from surviving packages may ease migration. Retired package names may receive a final compatibility/deprecation release, but retaining their workspaces indefinitely would defeat the release-count goal. Schedule removals within the v5 prerelease cycle if feasible; otherwise follow the applicable major-version compatibility policy.

Preserve attribution files from Arrow and update export maps for types/import/require. Keep task worker asset resolution and browser substitutions in the separate tasks package. Do not mark worker entry scripts as side-effect-free merely because ordinary math modules are.

## Validation and acceptance criteria

- Seven active public workspace packages, including tasks, with no dependency on retired Arrow or web-mercator packages.
- No core-to-geometry/SQL/geospatial cycle and no SQL-parser dependency in core.
- Packed-package installation fixtures with no Apache Arrow can import core, matrix, color (including scales and LUTs), UTF-8, tasks, and runtime-independent geometry utilities; verify both JavaScript and TypeScript consumption. The combined core/arrow entry point is excluded from this no-peer fixture.
- A second fixture installs Apache Arrow and exercises moved table/vector operations, GeoArrow adapters, Arrow scales, the consolidated sql/scales API (including numeric output, RGBA formats, quantiles, nulls, and batch evaluation), and geometry tessellation. Check the minimum supported Arrow version and the repository's development version.
- ESM and CommonJS consume the new public paths from built packages; consumer declarations resolve without source aliases or workspace dependency leakage.
- Browser bundle checks for matrix and color entry points exclude Apache Arrow, SQL, geometry tessellation, Node built-ins, and worker initialization.
- Existing task tests cover worker startup, cancellation, transfer ownership, streaming, and browser/Node execution after Arrow integration changes; worker URLs resolve from packed packages.
- Existing numerical, scale conformance, LUT, GeoArrow/WKB, and Web Mercator suites retain behavior. Compare representative output and bundle sizes before and after relocation.
- Upgrade documentation, examples, licenses, and publication configuration match the final export map.

## Alternatives and open decisions

Keeping Arrow separate provides a stronger installation boundary, but retains another package in the coordinated release set. An optional peer plus isolated public entry points is the proposed compromise. Moving all geometry algorithms into core would eliminate the current cycle at the cost of erasing the geometry boundary; extract the small tessellation integration instead.

Implementation review should finalize symbol-level ownership for mixed scale barrels, the exact matrix low-level export list, and the duration of compatibility aliases. These details do not change the proposed seven-package destination or the optional-peer requirement.

## Example and documentation organization

Group examples by their owning published package at `examples/<package>/<example>`. Arrow/GeoArrow/WKB examples belong under core, SQL expression and expression-worker examples under sql, and Web Mercator examples under geospatial. Keep two-level workspace discovery, update website source imports and test paths, and preserve public gallery URLs. Move Arrow docs under core/arrow and Web Mercator docs under geospatial/web-mercator, with redirects from their old documentation URLs.

The combined Arrow API retains descriptor-kernel names. To disambiguate vector wrappers, export `getGeoArrowVectorBounds`, `getGeoArrowVectorRowBounds`, `getGeoArrowVectorVertexCount`, `mapGeoArrowVectorCoordinates`, and `rewindGeoArrowVector`. Update vector consumers explicitly rather than silently changing the meaning of an existing descriptor operation.
