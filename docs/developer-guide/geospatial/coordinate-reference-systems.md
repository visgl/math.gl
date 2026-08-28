# Coordinate Reference Systems

A coordinate tuple such as `[12.49, 41.89]` is not a location by itself. Software also needs to
know what the numbers measure, which earth model they use, their units and order, and—when the
reference frame changes over time—the date at which they apply. A coordinate reference system
(CRS) supplies that context.

This guide explains the CRS model used across math.gl. It also draws an important boundary:
describing a CRS, preserving a CRS serialization, and transforming coordinates are three different
operations.

## The short version

- Use [`@math.gl/crs`](/docs/modules/crs) to type CRS definitions, preserve WKT or PROJ syntax, and
  describe how a dataset references its coordinates.
- Use [`@math.gl/proj4`](/docs/modules/proj4) to execute a supported horizontal, projected,
  geocentric, or datum-grid transformation.
- Use [`@math.gl/geospatial`](/docs/modules/geospatial) for ellipsoid, cartographic/ECEF, and local
  tangent-plane mathematics.
- Use [`@math.gl/geoid`](/docs/modules/geoid) when an application supplies a geoid model for
  ellipsoidal/orthometric height conversion.
- Do not infer a transformation from the presence of metadata. A result is transformed only after
  its coordinates, bounds, origins, and other spatial values have actually been updated.

## What a CRS describes

A CRS combines a coordinate system with a datum or reference frame. Depending on its type, it may
also include a map projection and its parameters.

| Concept | Purpose | Example |
| --- | --- | --- |
| Ellipsoid | Smooth mathematical approximation of the earth | WGS 84 ellipsoid |
| Datum or reference frame | Relates the coordinate system to the earth | World Geodetic System 1984 |
| Coordinate system | Defines axes, directions, order, and units | Ellipsoidal latitude/longitude |
| Projection | Maps a curved reference surface to a plane | Transverse Mercator |
| Vertical datum | Defines the surface from which height or depth is measured | An equipotential gravity surface |
| Coordinate epoch | Time at which coordinates in a dynamic CRS apply | Decimal year `2020.25` |
| Coordinate operation | Defines how coordinates move between references | Projection, grid shift, or Helmert operation |

A coordinate operation is not itself a CRS. WKT and PROJ can serialize operations and pipelines as
well as CRS definitions, so parsing their syntax does not prove that the parsed text represents a
CRS or that an operation is executable.

## Major CRS families

### Geographic CRS

A geographic CRS uses angular coordinates on an ellipsoid. Two-dimensional systems usually store
latitude and longitude; three-dimensional systems add ellipsoidal height. Applications commonly
display these values as longitude/latitude even when the authoritative axis order is
latitude/longitude.

**Canonical example:** [EPSG:4326 — WGS 84](https://epsg.org/crs_4326/index.html) is a
two-dimensional geographic CRS whose authoritative axes are latitude and longitude in degrees.
Many web APIs store the same coordinates as `[longitude, latitude]`, which is why CRS axis order
and array order must be tracked separately.

### Geocentric CRS

A geocentric CRS uses cartesian X/Y/Z axes whose origin is near the earth's center of mass.
Earth-centered, earth-fixed (ECEF) coordinates are useful for globe rendering and global 3D
datasets because they avoid a single planar projection.

**Canonical example:** [EPSG:4978 — WGS 84 geocentric](https://epsg.org/crs_4978/index.html) uses
earth-centered X, Y, and Z axes measured in metres. It describes the same WGS 84 earth model as
familiar longitude/latitude CRSs, but its coordinate tuples are cartesian positions rather than
angles.

### Projected CRS

A projected CRS applies a map projection to a geographic CRS and normally uses linear easting and
northing coordinates. Projection parameters, datum, units, and area of use are all part of the
definition. Two projected CRSs with similar names are not necessarily interchangeable.

**Canonical example:** [EPSG:32633 — WGS 84 / UTM zone 33N](https://epsg.org/crs_32633/index.html)
uses a Transverse Mercator projection and stores easting and northing in metres. Its zone is
designed for the northern hemisphere between 12°E and 18°E; using it outside that area increases
distortion even though the formulas still produce numbers.

### Vertical CRS

A vertical CRS describes height or depth independently of horizontal position. Orthometric height
is related to a gravity-defined surface such as a geoid; ellipsoidal height is measured from an
ellipsoid. Terrain-relative and scene-relative heights are application placement modes, not
vertical CRSs.

**Canonical example:** [EPSG:5773 — EGM96 height](https://epsg.org/crs_5773/index.html) is a
vertical CRS with one upward, gravity-related height axis measured in metres. Its zero-height
surface approximates mean sea level using the EGM96 gravity model; it is not interchangeable with
WGS 84 ellipsoidal height.

### Compound and bound CRS

A compound CRS combines compatible components, commonly a horizontal CRS and a vertical CRS. A
bound CRS additionally records a preferred transformation from a source CRS to a hub CRS. Neither
form guarantees that a particular runtime supports every component or transformation.

**Canonical examples:** [EPSG:9707 — WGS 84 + EGM96 height](https://epsg.org/crs_9707/index.html)
is a compound CRS combining the EPSG:4326 horizontal component with the EPSG:5773 vertical
component. A typical WKT2 `BOUNDCRS` instead wraps ETRS89 (EPSG:4258) as the source, WGS 84
(EPSG:4326) as the hub, and a specific coordinate operation between them; the operation is part of
the bound definition rather than a generic property of ETRS89.

### Dynamic CRS and coordinate epochs

A dynamic reference frame changes with time. Coordinates in such a frame can require a coordinate
epoch, expressed as a decimal year, to be interpreted or transformed correctly. The coordinate
epoch belongs to the coordinate values. It is distinct from a reference frame's definition epoch
and must not be silently discarded or replaced with the current date.

**Canonical example:** [EPSG:7912 — ITRF2014](https://epsg.org/crs_7912/index.html) is a dynamic
geographic 3D CRS whose reference frame has definition epoch `2010.0`. Coordinates observed at
epoch `2020.25` still use EPSG:7912, but must carry `coordinateEpoch: 2020.25` so a time-dependent
operation can account for motion since the frame epoch.

## Axis order is not array order

Three different orders are often conflated:

1. **Authoritative axis order** is declared by the CRS definition.
2. **Stored component order** is the order used by a file, protocol, or in-memory array.
3. **Display or API order** is the convention expected by an application or library.

For example, `EPSG:4326` has latitude/longitude authoritative axis order, while `OGC:CRS84` uses
longitude/latitude. Many JavaScript APIs nevertheless accept both as conventional `[x, y]` or
`[longitude, latitude]` arrays. Code should record the stored order and make any normalization
explicit instead of assuming that an identifier determines array layout.

`SpatialReference.coordinateOrder` describes stored arrays. It does not rewrite the axes inside a
WKT or PROJJSON definition.

## CRS representations

The same CRS may be carried in several representations. Preservation and semantic interpretation
have different requirements.

| Representation | Example | Self-contained | math.gl treatment |
| --- | --- | --- | --- |
| Authority identifier | `EPSG:4326` | No | Typed as `CRSIdentifier`; never resolved over the network |
| OGC URN or URL | `urn:ogc:def:crs:EPSG::4326` | No | Typed as an identifier |
| WKT1 / WKT2 | `GEOGCRS["WGS 84", ...]` | Usually | Value-preserving syntax AST plus profile validation |
| PROJ string | `+proj=utm +zone=32 +datum=WGS84` | Not always | Ordered parameter AST; pipelines and duplicates retained |
| PROJJSON | `{type: "GeographicCRS", ...}` | Usually | Strict generated semantic object types |
| Opaque string | Producer-specific text | Unknown | Preserved without claiming a known syntax |
| Implicit default | Established by a format specification | No serialized value | Recorded as a default state with provenance |

`CRSIdentifier`, `WKTCRSDefinition`, and `PROJStringDefinition` are documentation-oriented string
aliases. TypeScript cannot determine a string's syntax from those aliases at runtime. Use the
corresponding parser, an explicit representation supplied by the format, or
`inferCRSRepresentation()` when conservative syntax classification is sufficient.

## Syntax preservation versus semantic models

`@math.gl/crs` uses strict PROJJSON v0.7 as its typed semantic CRS object model. WKT and PROJ use
syntax trees instead:

- A `WKTCRSAst` retains keyword spelling, brackets versus parentheses, value order, repeated
  elements, unknown vendor nodes, numeric lexemes, and escaped strings.
- A `PROJStringAst` retains parameter order, duplicate parameters, flags, quoted values, pipeline
  steps, and global pipeline parameters.

This split is intentional. A lossless syntax parser can preserve input that it does not fully
understand. Converting every vendor WKT or PROJ pipeline into PROJJSON would require semantic
interpretation, registry data, operation selection, and sometimes external grid resources.

```ts
import {
  encodePROJString,
  encodeWKTCRS,
  parsePROJString,
  parseWKTCRS,
  validateWKTCRS
} from '@math.gl/crs';

const wkt = parseWKTCRS('GEOGCRS["WGS 84",ID["EPSG",4326]]');
const issues = validateWKTCRS(wkt, {profile: 'wkt2:2019'});
const compactWkt = encodeWKTCRS(wkt);

const pipeline = parsePROJString(
  '+proj=pipeline +ellps=GRS80 +step +proj=unitconvert +xy_in=deg +xy_out=rad'
);
const canonicalPipeline = encodePROJString(pipeline);
```

Encoding may normalize insignificant whitespace. It does not normalize numeric values, keyword
spelling, delimiter choice, parameter order, repeated elements, or unknown extensions.

## Describing a dataset's spatial reference

A bare `CRSDefinition` answers “what definition do I have?” It cannot answer whether the source
explicitly declared that definition, inherited it from a specification default, declared the CRS
unknown, or supplied no metadata. `SpatialReference` records those distinctions without adding a
registry or transformation engine.

```ts
import {createSpatialReference} from '@math.gl/crs';

const spatialReference = createSpatialReference({
  crs: {
    state: 'explicit',
    definition: 'GEOGCRS["WGS 84",ID["EPSG",4326]]',
    representation: 'wkt',
    provenance: 'metadata',
    alternatives: [{definition: 'EPSG:4326', representation: 'identifier'}]
  },
  coordinateEpoch: 2020.25,
  coordinateFrame: 'geographic',
  coordinateOrder: ['x', 'y'],
  units: ['degree', 'degree']
});
```

The returned descriptor is immutable. Arrays and PROJJSON definitions are cloned and recursively
frozen, allowing it to be shared safely between loaders, caches, renderers, and query interfaces.

### CRS states

`SpatialReference.crs` is a discriminated union:

| State | Meaning | Has a definition? |
| --- | --- | --- |
| `explicit` | A usable definition was supplied directly | Yes |
| `default` | A format or protocol specification establishes the definition | Yes |
| `unknown` | The source explicitly says the CRS is unknown | No |
| `absent` | The source supplied no CRS information | No |

Unknown and absent are deliberately different. Neither may be replaced by WGS84 merely because a
consumer prefers geographic coordinates. A specification-defined default should be represented as
`default`, not rewritten as if it had appeared explicitly in the source.

### Provenance

Each CRS reference records how its state was established:

- `metadata` — read from source metadata;
- `format-default` — established by a format or protocol specification;
- `caller-override` — supplied by an application to repair or override source metadata;
- `legacy-assumption` — retained compatibility behavior that should be visible to consumers;
- `unknown` — provenance could not be determined.

Provenance is attached to the CRS reference rather than the entire descriptor because horizontal
and vertical components may come from different sources.

### Preferred and alternate definitions

A source may carry both WKT and an authority code. Choosing one as the preferred definition should
not discard the other:

```ts
const crs = {
  state: 'explicit' as const,
  definition: 'EPSG:3857',
  representation: 'identifier' as const,
  provenance: 'metadata' as const,
  alternatives: [
    {definition: 'PROJCRS["WGS 84 / Pseudo-Mercator", ...]', representation: 'wkt' as const}
  ]
};
```

Alternatives mean that the source presents the values as equivalent. math.gl preserves that claim;
it does not prove semantic equivalence by comparing strings.

### Conservative representation inference

`inferCRSRepresentation()` recognizes PROJJSON objects, common WKT roots, PROJ strings containing
a `proj` parameter, authority-like identifiers, OGC URNs, and URLs. Free-form strings are returned
as `opaque`.

```ts
import {inferCRSRepresentation} from '@math.gl/crs';

inferCRSRepresentation('EPSG:4326'); // 'identifier'
inferCRSRepresentation('GEOGCRS["WGS 84"]'); // 'wkt'
inferCRSRepresentation('+proj=longlat +datum=WGS84'); // 'proj-string'
inferCRSRepresentation('producer supplied description'); // 'opaque'
```

Inference is syntactic. It does not validate WKT, parse a pipeline, contact an authority registry,
or establish that a definition names a real CRS.

## From definition to transformation

A robust transformation workflow needs more than two strings:

1. Discover and preserve the source CRS and coordinate epoch.
2. Identify the actual stored component order and units.
3. Select an operation supported for the source and target CRS, area, epoch, and required accuracy.
4. Register any required datum grids or geoid model explicitly.
5. Transform all relevant spatial values—not only vertex positions.
6. Report the output CRS, order, units, epoch, and transformation accuracy or limitations.

Bounds deserve particular care. Nonlinear projections cannot generally be bounded by transforming
only two corners. Applications may need edge sampling, geometry-derived bounds, antimeridian-aware
logic, or projection-specific methods. Z and M components must be preserved or transformed under an
explicit contract.

`@math.gl/proj4` wraps proj4js for supported coordinate transformations:

```ts
import {Proj4Projection} from '@math.gl/proj4';

const projection = new Proj4Projection({from: 'EPSG:4326', to: 'EPSG:3857'});
const webMercatorPosition = projection.project([12.49, 41.89]);
```

Support is intentionally narrower than `CRSDefinition`. For example, a valid compound or vertical
PROJJSON object may not be executable by proj4js. Parsing or typing a definition is never a promise
that `@math.gl/proj4` can transform it.

## Vertical coordinates

Horizontal reprojection and vertical datum conversion are separate operations. A geoid model can
relate ellipsoidal height `h`, orthometric height `H`, and geoid undulation `N`:

```text
h = H + N
H = h - N
```

The model must be sampled at the appropriate geographic position. `@math.gl/geoid` parses and
interpolates application-supplied models; it does not download them. A geoid is not terrain, and it
cannot resolve terrain-relative or scene-relative placement.

## Deterministic and browser-safe behavior

`@math.gl/crs` has no runtime dependencies and performs no network access. It does not silently
download authority definitions, datum grids, velocity models, or geoid files. Applications should
register transformation resources explicitly so browser and server behavior remains deterministic
and licensing or accuracy choices remain under application control.

## Integration guidance

Libraries that load, process, or render spatial data should follow these rules:

- Preserve the original format metadata even when exposing a normalized `SpatialReference`.
- Keep a source's preferred and alternate representations instead of overwriting one with another.
- Represent specification defaults, explicit unknown values, and omitted values distinctly.
- Store coordinate epochs separately from CRS definition epochs.
- Record stored component order rather than inferring array order from an authority identifier.
- Do not claim reprojection until coordinates and dependent spatial metadata have been updated.
- Reject requested but unsupported transformations explicitly instead of returning source
  coordinates under a target CRS label.
- Keep column-specific CRS metadata for table formats that allow multiple geometry columns.
- Separate server-side CRS negotiation from client-side coordinate transformation.

These principles allow loaders.gl, deck.gl, and other consumers to share the same CRS vocabulary
without forcing every package to depend on one transformation implementation.

### Common integration patterns

Different data families expose CRS information at different scopes. A neutral descriptor should
supplement their native metadata rather than flattening those differences:

| Data family | Typical CRS scope | Integration concern |
| --- | --- | --- |
| Feature files | Dataset or geometry layer | Sidecar files and vendor WKT must remain available |
| Columnar tables | Individual geometry column | Each geometry column can have its own CRS and epoch |
| Raster grids | Coverage plus grid geometry | Warping also changes resolution, sampling, bounds, and affine transforms |
| Point clouds | Dataset, coordinate record, and vertical component | Scale/offset and vertical records are part of interpretation |
| Tiled 3D data | Tileset, bounding volume, or local frame | Local/ECEF transforms and height placement are not ordinary 2D reprojection |
| Web services | Request/response negotiation | Server-side CRS selection is distinct from client-side transformation |
| Fixed-CRS formats | Established by specification | Record a `default` state instead of fabricating source metadata |

When a format can contain more than one spatial field, attach one `SpatialReference` to each field
or layer. A single dataset-level value is only appropriate when the format guarantees that all
spatial values share it.

## Scope and deliberate limitations

`@math.gl/crs` provides definitions, syntax codecs, and spatial-reference descriptors. It does not
provide:

- authority-registry lookup;
- semantic CRS equivalence;
- automatic WKT or PROJ conversion to PROJJSON;
- coordinate-operation selection;
- transformation execution;
- implicit datum-grid, velocity-model, or geoid downloads;
- terrain or scene elevation placement.

Those boundaries keep the package small, dependency-free, browser-safe, and useful to libraries
that need to exchange CRS metadata without agreeing on one execution engine.

## Standards and further reading

- [OGC Abstract Specification Topic 2: Referencing by coordinates](https://docs.ogc.org/as/18-005r5/18-005r5.html)
- [OGC WKT2:2019 / ISO 19162:2019](https://docs.ogc.org/is/18-010r7/18-010r7.html)
- [PROJJSON specification](https://proj.org/en/stable/specifications/projjson.html)
- [PROJ coordinate operations](https://proj.org/en/stable/operations/index.html)
- [PROJ pipelines](https://proj.org/en/stable/operations/pipeline.html)
