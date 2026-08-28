# @math.gl/crs

Proj4-independent coordinate reference system definitions shared by math.gl integrations.

PROJJSON is an OSGeo/PROJ specification, not an independently published OGC or ISO standard. It
is designed as a lossless JSON encoding of OGC WKT2:2019 / ISO 19162:2019 and is referenced by OGC
standards. This package uses strict PROJJSON v0.7 as its semantic CRS object model. Authority codes,
PROJ strings, WKT2, WKT1, and vendor WKT dialects remain string serializations. WKT and PROJ
syntax trees preserve the serializations without claiming semantic conversion to PROJJSON.

```ts
import {parsePROJString, parseWKTCRS} from '@math.gl/crs';
import type {CRSDefinition, PROJJSONCRS} from '@math.gl/crs';

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
import {createSpatialReference} from '@math.gl/crs';

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
`@math.gl/crs/projjson.schema.json`. It is the source of truth for the checked-in generated
TypeScript declarations. This package has no runtime dependencies. Its runtime APIs parse, encode,
and validate serialization syntax only: they do not perform registry lookup, semantic equivalence,
coordinate transformation, or general conversion between WKT, PROJ, and PROJJSON.

See the [PROJJSON specification](https://proj.org/en/stable/specifications/projjson.html).
See the math.gl [Coordinate Reference Systems guide](https://math.gl/docs/developer-guide/geospatial/coordinate-reference-systems)
for representations, epochs, axis order, vertical CRS, and transformation guidance.
