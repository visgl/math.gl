# CRS Definitions

`@math.gl/crs` provides lightweight, proj4-independent TypeScript definitions and syntax codecs
for coordinate reference systems. It has no runtime dependencies and is browser-safe.

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
intent but are all structurally `string`. Call the appropriate parser when syntax needs to be
inspected or validated.

## PROJJSON and WKT

[PROJJSON](https://proj.org/en/stable/specifications/projjson.html) is maintained by the OSGeo PROJ
project. It is not independently an OGC or ISO standard; it is designed as a lossless JSON encoding
of OGC WKT2:2019 / ISO 19162:2019 and is referenced by OGC standards.

Strict PROJJSON v0.7 is the canonical semantic object model in `@math.gl/crs`. The WKT and PROJ
ASTs are syntax models: they preserve ordering, duplicates, number lexemes, delimiter choice, and
unknown extensions without claiming semantic equivalence or universal PROJJSON conversion.

## WKT syntax

`parseWKTCRS` parses WKT1 and WKT2 serializations, including common GDAL and ESRI extensions, into
a discriminated `WKTCRSAst`. Parsing is tolerant by default. `validateWKTCRS` can check a WKT1,
WKT2:2015, or WKT2:2019 profile, and `strict: true` makes parsing reject validation issues.

```ts
import {encodeWKTCRS, parseWKTCRS, validateWKTCRS} from '@math.gl/crs';

const ast = parseWKTCRS('GEOGCRS["WGS 84",ID["EPSG",4326]]');
const issues = validateWKTCRS(ast, {profile: 'wkt2:2019'});
const compact = encodeWKTCRS(ast);
const pretty = encodeWKTCRS(ast, {format: 'pretty'});
```

The parser preserves keyword spelling, bracket or parenthesis delimiters, value order, repeated
elements, unknown nodes, and the source lexeme for each number. `WKTCRSSyntaxError` reports a
zero-based source offset and one-based line and column.

## PROJ string syntax

`parsePROJString` parses ordinary definitions and pipelines into an ordered `PROJStringAst`.
Duplicate parameters, flags, quoted values, global pipeline parameters, and `step` separators are
preserved. `encodePROJString` emits canonical leading `+` signs and normalized whitespace.

```ts
import {encodePROJString, parsePROJString} from '@math.gl/crs';

const ast = parsePROJString('+proj=pipeline +ellps=GRS80 +step +proj=unitconvert +xy_in=deg');
const text = encodePROJString(ast);
```

Shell command-line syntax and PROJ resource or init-file parsing are intentionally outside the
scope of this codec.

## API

- `CRSDefinition<T extends PROJJSONCRS = PROJJSONCRS>` — a string definition or PROJJSON object.
- `PROJJSONCRS` — generated from the official v0.7 schema's `#/definitions/crs`.
- `PROJJSONCRSType` — all top-level PROJJSON CRS type literals.
- `PROJJSONCRSByType<T>` — the discriminated subset for one or more top-level types.
- `PROJJSON_SCHEMA_VERSION` — `'0.7'`.
- `PROJJSON_SCHEMA_URL` — the canonical official schema URL.
- `WKTCRSAst`, `WKTCRSNode`, `WKTCRSValue` — value-preserving WKT syntax tree types.
- `parseWKTCRS`, `encodeWKTCRS`, `validateWKTCRS` — WKT syntax codec and profile validation.
- `PROJStringAst`, `PROJParameter` — ordered PROJ syntax tree types.
- `parsePROJString`, `encodePROJString` — ordinary definition and pipeline syntax codec.

The official MIT-licensed schema is vendored unchanged and can be imported or resolved through
`@math.gl/crs/projjson.schema.json`. It is the PROJJSON runtime validation source of truth. The
package does not add a second Zod schema. It also does not perform coordinate transformations,
authority-registry lookup, semantic CRS comparison, or WKT/PROJ-to-PROJJSON conversion.
