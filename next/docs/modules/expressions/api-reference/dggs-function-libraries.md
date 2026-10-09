# DGGS Function Libraries

![From-v4.2](https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square)![Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

Import optional Discrete Global Grid System function tables from `@math.gl/expressions/dggs`.

```
import {ExpressionFunctionRegistry, compile} from '@math.gl/expressions';

import {DGGS_FUNCTION_LIBRARY} from '@math.gl/expressions/dggs';



const registry = new ExpressionFunctionRegistry([DGGS_FUNCTION_LIBRARY]);

const evaluate = compile('getGeohashBoundary(hash)', {registry});



evaluate({hash: '9q8yy'});
```

## `GEOHASH_FUNCTION_LIBRARY`[​](#geohash_function_library "Direct link to geohash_function_library")

* `getGeohashLngLat`
* `getGeohashBounds`
* `getGeohashBoundary`
* `getGeohashBoundaryFlat`

## `QUADKEY_FUNCTION_LIBRARY`[​](#quadkey_function_library "Direct link to quadkey_function_library")

* `getQuadkeyLngLat`
* `quadkeyToWorldBounds`
* `getQuadkeyBoundary`
* `getQuadkeyBoundaryFlat`

## `S2_FUNCTION_LIBRARY`[​](#s2_function_library "Direct link to s2_function_library")

* `getS2IndexFromToken`
* `getS2TokenFromIndex`
* `getS2ChildIndex`
* `getS2BoundaryFlat`

S2 index functions use JavaScript `bigint` values.

## `DGGS_FUNCTION_LIBRARY`[​](#dggs_function_library "Direct link to dggs_function_library")

Combines the GeoHash, Quadkey, and S2 tables into one registration-ready table.

The individual constants allow applications to include only the DGGS systems they expose to expressions.
