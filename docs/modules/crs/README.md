# CRS Definitions

`@math.gl/crs` provides lightweight, proj4-independent TypeScript definitions for coordinate
reference systems. It has no runtime dependencies.

## Installation

```bash
npm install @math.gl/crs
```

## Definition model

`CRSDefinition` accepts either a string serialization or a strict PROJJSON CRS object:

```ts
import type {CRSDefinition, PROJJSONCRS} from '@math.gl/crs';

const authorityCode: CRSDefinition = 'EPSG:4326';
const projString: CRSDefinition = '+proj=longlat +datum=WGS84 +no_defs';
const wkt2: CRSDefinition = 'GEOGCRS["WGS 84", /* ... */]';

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
```

The string aliases (`CRSIdentifier`, `WKTCRSDefinition`, and `PROJStringDefinition`) document
intent but are all structurally `string`. This package does not infer or validate a string's
syntax.

## PROJJSON and WKT

[PROJJSON](https://proj.org/en/stable/specifications/projjson.html) is maintained by the OSGeo PROJ
project. It is not independently an OGC or ISO standard; it is designed as a lossless JSON encoding
of OGC WKT2:2019 / ISO 19162:2019 and is referenced by OGC standards.

Strict PROJJSON v0.7 is the canonical semantic object model in `@math.gl/crs`. WKT remains a string
serialization. Software that semantically parses WKT2 should normalize it to `PROJJSONCRS`. WKT1
and vendor dialects remain opaque strings because lossless PROJJSON normalization is not guaranteed.

## API

- `CRSDefinition<T extends PROJJSONCRS = PROJJSONCRS>` — a string definition or PROJJSON object.
- `PROJJSONCRS` — generated from the official v0.7 schema's `#/definitions/crs`.
- `PROJJSONCRSType` — all top-level PROJJSON CRS type literals.
- `PROJJSONCRSByType<T>` — the discriminated subset for one or more top-level types.
- `PROJJSON_SCHEMA_VERSION` — `'0.7'`.
- `PROJJSON_SCHEMA_URL` — the canonical official schema URL.

The official MIT-licensed schema is vendored unchanged and can be imported or resolved through
`@math.gl/crs/projjson.schema.json`. It is the runtime validation source of truth. The package does
not add a second Zod schema or a runtime validator API.
