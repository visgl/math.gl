# Math Utility Functions

<p class="badges">
  <img src="https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square" alt="From v1.0" />
</p>

Configuration, numeric comparisons, angle conversions, and array helpers for core math.


## Usage

```js
import {config, equals} from '@math.gl/core';
```

Setting configuration

```js
import {config} from '@math.gl/core';
config.EPSILON = 1e-12;
config.debug = true;
config.printRowMajor = true;
config.precision = 4;
```

## Functions

### configure

`configure(options)`

Merge options into the shared global configuration and return it. Call `configure({})` to read the current configuration.

### checkNumber

`checkNumber(value)`

### formatValue

`formatValue(value, {precision = config.precision} = {})`

### isArray

Returns true if value is either an array or a typed array

`isArray(value)`

Note: does not return true for ArrayBuffers and DataViews

### clone

`clone(array)`

Call the input's `clone()` method when present, otherwise copy it with `slice()`.

### toRadians

`toRadians(degrees)`

Works on single values and vectors

### toDegrees

`toDegrees(radians)`

Works on single values and vectors

### safeMod

`safeMod(dividend, divisor)`

Returns a modulo result that follows the sign of the divisor, including when the dividend is
negative.

### normalizeAngle

`normalizeAngle(angle, range)`

Normalizes an angle in radians. `range` is either:

- `'zero-to-two-pi'` for the range from 0 to 2π
- `'negative-pi-to-pi'` for the range from -π to π

### equals

`equals(a, b, epsilon)`

- Works on single values and vectors
- Numeric values need to be closer than `config.EPSILON`
- Objects will be compared with their `.equals()` method if present.

### exactEquals

`exactEquals(a, b)`

- Works on single values and vectors.
- Numeric values need to be exactly identical
- Objects will be compared with their `.exactEquals()` method if present.

## GLSL equivalents

### radians

`radians(degrees)`

GLSL equivalent: Works on single values and vectors

### degrees

`degrees(radians)`

GLSL equivalent: Works on single values and vectors

### clamp

`clamp(value, min, max)`

## Remarks

- When setting global configs, you may need to consider the order of code loadint when using `imports` and `requires`

### equals and exactEquals

`equals(a, b, epsilon?)` compares scalars or arrays with a relative/absolute tolerance. `exactEquals(a, b)` compares values directly. See [floating point](../developer-guide/floating-point.md).
