# Spatial Reference

`@math.gl/crs` provides a format-neutral descriptor for reporting how a dataset's coordinates are
referenced. It preserves discovery state and representation without performing a transformation.

For concepts, examples, and integration guidance, see the
[Coordinate Reference Systems developer guide](/docs/developer-guide/geospatial/coordinate-reference-systems).

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
  definition: CRSDefinition;
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
inferCRSRepresentation(definition: CRSDefinition): SpatialReferenceRepresentation
```

It recognizes PROJJSON objects, common WKT roots, PROJ strings with a `proj` parameter,
authority-like identifiers, OGC URNs, and URLs. Other strings are returned as `opaque`. It does not
validate syntax, resolve an identifier, or establish semantic equivalence.

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
