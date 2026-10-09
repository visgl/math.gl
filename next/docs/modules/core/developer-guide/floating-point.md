# Floating Point

Rounding can make mathematically equivalent calculations produce slightly different numeric results. Use approximate comparisons for computed coordinates, and exact comparisons when identical stored values are required.

## Compare values[​](#compare-values "Direct link to Compare values")

```
import {equals, exactEquals, Vector3} from '@math.gl/core';



equals(0.1 + 0.2, 0.3); // true with the default tolerance

exactEquals(0.1 + 0.2, 0.3); // false

new Vector3(0.1 + 0.2, 0, 0).equals([0.3, 0, 0]); // true
```

For finite scalar values, `equals()` uses this test:

```
Math.abs(a - b) <= epsilon * Math.max(1, Math.abs(a), Math.abs(b));
```

The default `config.EPSILON` is `1e-12`. Pass an explicit epsilon to `equals(a, b, epsilon)` for a particular comparison. This is a relative tolerance for large magnitudes and an absolute tolerance near zero; it is not a distance threshold in metres.

## Choose storage precision[​](#choose-storage-precision "Direct link to Choose storage precision")

Core classes store JavaScript numbers. Writing results to `Float32Array` or `Float16Array` rounds them to that format's precision. Use `Float64Array` when large coordinates and small differences must be retained, or use a local origin before converting positions to a lower-precision rendering buffer.

Changing `EPSILON` affects comparisons, not arithmetic accuracy. Formatting precision affects displayed strings, not stored coordinates. See [debugging](https://visgl.github.io/math.gl/next/docs/developer-guide/debugging.md) and [array types](https://visgl.github.io/math.gl/next/docs/modules/types/api-reference/array-types.md).
