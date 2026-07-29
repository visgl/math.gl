# Math Utility Functions

GLSL math function equivalents. Work on both single values and vectors.

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

### checkNumber

`checkNumber(value)`

### formatValue

`formatValue(value, precision = config.precision || 4)`

### isArray

Returns true if value is either an array or a typed array

`isArray(value)`

Note: does not return true for ArrayBuffers and DataViews

### clone

`clone(array)If the array has a clone function, calls it, otherwise returns a copy`

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

### sin

`sin(radians)`

GLSL equivalent: Works on single values and vectors

### cos

`cos(radians)`

GLSL equivalent: Works on single values and vectors

### tan

`tan(radians)`

GLSL equivalent: Works on single values and vectors

### asin

`asin(radians)`

GLSL equivalent: Works on single values and vectors

### acos

`acos(radians)`

GLSL equivalent: Works on single values and vectors

### atan

`atan(radians)`

### clamp

`clamp(value, min, max)`

## Remarks

- When setting global configs, you may need to consider the order of code loadint when using `imports` and `requires`
