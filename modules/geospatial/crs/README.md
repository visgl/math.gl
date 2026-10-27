# @math.gl/geospatial/crs

Proj4-independent coordinate reference system definitions shared by math.gl integrations.

PROJJSON is an OSGeo/PROJ specification, not an independently published OGC or ISO standard. It
is designed as a lossless JSON encoding of OGC WKT2:2019 / ISO 19162:2019 and is referenced by OGC
standards. This package uses strict PROJJSON v0.7 as its semantic CRS object model. Authority codes,
PROJ strings, WKT2, WKT1, and vendor WKT dialects remain string serializations. WKT and PROJ
syntax trees preserve the serializations without claiming semantic conversion to PROJJSON.

```ts
import {parsePROJString, parseWKTCRS} from '@math.gl/geospatial/crs';
import type {CRSDefinition, PROJJSONCRS} from '@math.gl/geospatial/crs';

const authorityCode: CRSDefinition = 'EPSG:4326';
const projString: CRSDefinition = '+proj=longlat +datum=WGS84 +no_defs';
const projjson: PROJJSONCRS = {
  type: 'GeographicCRS',
  name: 'WGS 84',
  datum: {
    name: 'World Geodetic System 1984',
    ellipsoid: {
      name: 'WGS 84',
      semi_major_axis: 6378137,
      inverse_flattening: 298.257223563
    }
  }
};

const wkt = parseWKTCRS('GEOGCRS["WGS 84",ID["EPSG",4326]]');
const proj = parsePROJString('+proj=longlat +datum=WGS84 +no_defs');
```

`SpatialReference` adds format-neutral discovery state around those definitions. It distinguishes
explicit definitions, specification defaults, explicitly unknown CRS values, and absent metadata;
it can also retain alternate representations, coordinate epoch, coordinate frame, stored
component order, and units.

```ts
import {createSpatialReference} from '@math.gl/geospatial/crs';

const spatialReference = createSpatialReference({
  crs: {
    state: 'explicit',
    definition: 'EPSG:4326',
    representation: 'identifier',
    provenance: 'metadata'
  },
  coordinateFrame: 'geographic',
  coordinateOrder: ['x', 'y']
});
```

The official PROJJSON v0.7 JSON Schema is vendored unchanged under its MIT license and exported as
`@math.gl/geospatial/crs/projjson.schema.json`. It is the source of truth for the checked-in generated
TypeScript declarations. This package has no runtime dependencies. Its runtime APIs parse, encode,
and validate serialization syntax and identify already-resolved metadata. They do not perform registry lookup, semantic equivalence,
coordinate transformation, or general conversion between WKT, PROJ, and PROJJSON.

The `ProjectionTransform` in `@math.gl/geospatial/projection/core` directly accepts
these readonly definitions, `CRSReference`, and `SpatialReference` descriptors. Its optional
WKT/PROJJSON adapters use this package's types and parsers; execution support is checked
by `checkProjectionCompatibility`. Unknown/absent metadata remains unresolved.
See the [projection API](https://math.gl/docs/modules/geospatial/projection/api-reference/typescript-projection)
for the supported transformation subset and storage-order behavior.

See the [PROJJSON specification](https://proj.org/en/stable/specifications/projjson.html).
See the math.gl [Coordinate Reference Systems guide](https://math.gl/docs/modules/geospatial/crs/developer-guide/coordinate-reference-systems)
for representations, epochs, axis order, vertical CRS, and transformation guidance.

`linearUnits` provides names and metre conversion factors keyed by PROJ unit
identifier. For example, `linearUnits.ft` is `{name: 'feet', metersPerUnit: 0.3048}`.

`getCRSSignature(metadata)` returns a deterministic signature for resolved
`CRSMetadata`. It tracks projection parameters, ellipsoid, effective axis order,
units, and horizontal extraction. Parameter order and object identity do not
matter. This is an identity of resolved execution conventions, not a semantic
equivalence test for arbitrary CRS definitions. Projection descriptors use this
result as `signature` when structured input or overrides require resolved metadata;
default string definitions retain the original string.

Import `getCRSSignature`, `linearUnits`, `CRSMetadata` and `CRSUnit` from
`@math.gl/geospatial/crs` when only resolved metadata is needed. This entry keeps
WKT/PROJ syntax readers out of the initial graph of code-split applications.
