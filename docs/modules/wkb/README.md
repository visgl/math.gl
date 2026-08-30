# @math.gl/wkb

`@math.gl/wkb` provides dependency-free, synchronous codecs for individual WKB, EWKB, and WKT
geometry values. It is the neutral format layer used by `@math.gl/geoarrow`, but has no dependency
on GeoArrow or Apache Arrow.

```typescript
import {parseWKB, writeWKB, parseWKT, formatWKT} from '@math.gl/wkb';

const geometry = parseWKT('POINT Z (1 2 3)');
const bytes = writeWKB(geometry, 'xyz');
const decoded = parseWKB(bytes);

console.log(decoded.dimension); // 'xyz'
console.log(formatWKT(decoded.geometry, decoded.dimension));
```

The shared `WellKnownGeometry` union covers Point, LineString, Polygon, all Multi families, and
nested GeometryCollection values. Semantic dimensions are `xy`, `xyz`, `xym`, and `xyzm`.

The WKB parser supports both endian orders, ISO dimension offsets, and EWKB Z/M/SRID flags. The WKT
parser supports dimension tokens, nested collections, both MultiPoint spellings, and empties. Both
parsers reject malformed or trailing input rather than silently skipping it.

See the [API reference](./api-reference/wkb.md) for contracts, limits, and interoperability
guidance.
