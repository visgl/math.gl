# DGGS Function Libraries

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square" alt="From-v4.2" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Experimental" />
</p>

Import optional Discrete Global Grid System function tables from `@math.gl/expressions/dggs`.

```ts
import {ExpressionFunctionRegistry, compile} from '@math.gl/expressions';
import {DGGS_FUNCTION_LIBRARY} from '@math.gl/expressions/dggs';

const registry = new ExpressionFunctionRegistry([DGGS_FUNCTION_LIBRARY]);
const evaluate = compile('getGeohashBoundary(hash)', {registry});

evaluate({hash: '9q8yy'});
```

## `GEOHASH_FUNCTION_LIBRARY`

- `getGeohashLngLat`
- `getGeohashBounds`
- `getGeohashBoundary`
- `getGeohashBoundaryFlat`

## `QUADKEY_FUNCTION_LIBRARY`

- `getQuadkeyLngLat`
- `quadkeyToWorldBounds`
- `getQuadkeyBoundary`
- `getQuadkeyBoundaryFlat`

## `S2_FUNCTION_LIBRARY`

- `getS2IndexFromToken`
- `getS2TokenFromIndex`
- `getS2ChildIndex`
- `getS2BoundaryFlat`

S2 index functions use JavaScript `bigint` values.

## `DGGS_FUNCTION_LIBRARY`

Combines the GeoHash, Quadkey, and S2 tables into one registration-ready table.

The individual constants allow applications to include only the DGGS systems they expose to expressions.
