# MathArray

<p class="badges">
  <img src="https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square" alt="From v1.0" />
</p>

`MathArray` is the shared array base for core vectors, matrices, quaternions, and Euler angles. Use a concrete class rather than constructing it directly. Mutating methods return the receiver.


## Copy and access

| Method | Behavior |
| --- | --- |
| `clone()` | Create an independent object of the same class |
| `copy(array)` | Copy components into the receiver |
| `set(...components)` | Set components; argument order depends on the concrete class |
| `fromArray(array, offset = 0)` | Copy components from an array at an offset |
| `toArray(result = [], offset = 0)` | Write components into an output array |

`length` is the JavaScript array element count, not a magnitude method. Vectors expose `len()` and `lengthSquared()` through [Vector](./vector.md).

## Arithmetic

`add()`, `subtract()`, `min()`, `max()`, `clamp()`, `negate()`, `scale()`, and `lerp()` update the receiver. `scale(value)` accepts a scalar or component factors. Concrete classes can override arithmetic semantics; for example, matrix scaling composes a geometric scale transform.

```js
import {Vector3} from '@math.gl/core';

const original = new Vector3(1, 2, 3);
const scaled = original.clone().scale([1, 1, 0]); // [1, 2, 0]
```

## Compare and validate

- `equals(array)` compares components with the configured epsilon.
- `exactEquals(array)` compares components directly.
- `validate()` returns whether the element count is correct and every component is finite.
- `check()` returns the receiver, and throws on invalid values when `config.debug` is enabled.

See [floating point](../developer-guide/floating-point.md) for comparison tolerance.

## Format values

`toString()` formats the object using global configuration. `formatString(options)` accepts formatting options for one call. Concrete classes may customize their output; matrix `toString()` uses `printRowMajor` to choose display order.

See [debugging](../../../developer-guide/debugging.md) for examples and configuration defaults.
