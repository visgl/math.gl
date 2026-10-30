# Spatial Reference

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square" alt="From v4.2" />
</p>

`@math.gl/geospatial/crs` provides a format-neutral descriptor for reporting how a dataset's coordinates are
referenced. It preserves discovery state and representation without performing a transformation.

For concepts, examples, and integration guidance, see the
[Coordinate Reference Systems developer guide](/docs/modules/geospatial/crs/developer-guide/coordinate-reference-systems).

## `SpatialReference`

```ts
type SpatialReference = Readonly<{
  crs: CRSReference;
  vertical?: CRSReference;
  coordinateEpoch?: number;
  coordinateFrame: 'geographic' | 'geocentric' | 'projected' | 'local' | 'unknown';
  coordinateOrder: readonly string[];
  units?: readonly string[];
}>;
```

`crs` is the primary horizontal or compound CRS. `vertical` is available when a source declares a
separate vertical CRS. `coordinateOrder` describes the source array layout and is independent of
the authoritative axis order in the CRS definition.

## `CRSReference`

`CRSReference` is a discriminated union of `KnownCRSReference` and `UnresolvedCRSReference`.

A known reference has an explicit or specification-defaulted definition:

```ts
type KnownCRSReference = Readonly<{
  state: 'explicit' | 'default';
  definition: ReadonlyCRSDefinition;
  representation: SpatialReferenceRepresentation;
  provenance: SpatialReferenceProvenance;
  alternatives?: readonly SpatialReferenceAlternative[];
}>;
```

An unresolved reference distinguishes explicitly unknown from absent metadata:

```ts
type UnresolvedCRSReference = Readonly<{
  state: 'unknown' | 'absent';
  provenance: SpatialReferenceProvenance;
}>;
```

## `createSpatialReference()`

Creates an immutable descriptor, supplying normalized defaults for omitted fields.

```ts
createSpatialReference(options?: CreateSpatialReferenceOptions): SpatialReference
```

PROJJSON definitions and descriptor-owned arrays are cloned and recursively frozen. A non-finite
coordinate epoch throws. The function does not parse or resolve CRS definitions.

```ts
const spatialReference = createSpatialReference({
  crs: {
    state: 'default',
    definition: 'OGC:CRS84',
    representation: 'identifier',
    provenance: 'format-default'
  },
  coordinateFrame: 'geographic',
  coordinateOrder: ['x', 'y'],
  units: ['degree', 'degree']
});
```

## `inferCRSRepresentation()`

Classifies a `CRSDefinition` using conservative syntax checks.

```ts
inferCRSRepresentation(definition: ReadonlyCRSDefinition): SpatialReferenceRepresentation
```

It recognizes PROJJSON objects, common WKT roots, PROJ strings with a `proj` parameter,
authority-like identifiers, OGC URNs, and URLs. Other strings are returned as `opaque`. It does not
validate syntax, resolve an identifier, or establish semantic equivalence.

## `normalizeCRSIdentifier()`

Changes known spellings of one authority CRS identifier to the form `AUTHORITY:CODE`.

```ts
normalizeCRSIdentifier(identifier: CRSIdentifier): CRSIdentifier
```

Use this function to compare identifiers that have different spellings. For example, a tile matrix
set can give `http://www.opengis.net/def/crs/EPSG/0/32619`, and a view can give `EPSG:32619`.

| Input | Result |
| --- | --- |
| `epsg:32619` | `EPSG:32619` |
| `urn:ogc:def:crs:EPSG::32619` | `EPSG:32619` |
| `http://www.opengis.net/def/crs/EPSG/0/32619` | `EPSG:32619` |
| `CRS:84`, `urn:ogc:def:crs:OGC:1.3:CRS84` | `OGC:CRS84` |
| `urn:ogc:def:crs:EPSG:6.6:4326` | unchanged |
| `WGS84`, WKT, PROJ strings | unchanged |

Rules:

- The known authority prefixes EPSG, OGC, ESRI and IAU accept case-insensitive input aliases.
  Known OGC codes CRS84, CRS83, CRS27 and CRS84h use their registered spelling; other authority
  and code spellings are preserved. This convenience does not imply that registry identifiers
  are generally case-insensitive.
- The function changes the WMS 1.3 codes `CRS:84`, `CRS:83` and `CRS:27` to `OGC:CRS84`,
  `OGC:CRS83` and `OGC:CRS27`.
- The function removes a URN or URI version only in these cases:
  - The version is empty.
  - The version is `0`.
  - The version is `1.3` and the code is OGC `CRS84`, `CRS83` or `CRS27`. The OGC register
    publishes these three codes only at version 1.3.
- The function returns all other versioned identifiers unchanged. Thus a versioned identifier does
  not compare equal to an unversioned identifier.
- The function returns unknown strings unchanged.

The function does not make different registry entries equal. `EPSG:4326` and `OGC:CRS84` stay
different, because their axis orders are different. `EPSG:900913` stays different from
`EPSG:3857`. The function does not resolve definitions. It does not make datums equal, and it does
not change axis order.

For example, `http://www.opengis.net/def/crs/OGC/0/CRS84h` becomes `OGC:CRS84h`,
while `OGC:CustomCase` keeps its code spelling.

Keep the original identifier of the source in the metadata. Use the result only to compare
identifiers.

## Representation values

`SpatialReferenceRepresentation` is one of:

- `identifier`
- `wkt`
- `proj-string`
- `projjson`
- `opaque`

For a defaulted reference, `representation` describes the normalized definition selected by the
adapter. The `default` state and `format-default` provenance record that the source did not
serialize that value.

## State values

`SpatialReferenceState` is one of:

- `explicit`
- `default`
- `unknown`
- `absent`

Only `explicit` and `default` references contain a definition. Narrow on `state` before accessing
`definition`, `representation`, or `alternatives`.

`ReadonlyCRSDefinition` is a serialized string or a deeply readonly PROJJSON object. Mutable
PROJJSON inputs remain assignable to this type, while descriptors returned by
`createSpatialReference()` prevent both top-level and nested mutation at compile time and runtime.

## Provenance values

`SpatialReferenceProvenance` is one of:

- `metadata`
- `format-default`
- `caller-override`
- `legacy-assumption`
- `unknown`

## Coordinate-frame values

`SpatialReferenceCoordinateFrame` is one of:

- `geographic`
- `geocentric`
- `projected`
- `local`
- `unknown`

The frame describes stored coordinates. It is intentionally broader than PROJJSON CRS types so a
loader can report local coordinate systems that do not have a conventional CRS definition.
