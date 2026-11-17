# Math Utility Functions

![From v1.0](https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square)

Configuration, numeric comparisons, angle conversions, and array helpers for core math.

## Usage[​](#usage "Direct link to Usage")

```
import {config, equals} from '@math.gl/core';
```

Setting configuration

```
import {config} from '@math.gl/core';

config.EPSILON = 1e-12;

config.debug = true;

config.printRowMajor = true;

config.precision = 4;
```

## Functions[​](#functions "Direct link to Functions")

### configure[​](#configure "Direct link to configure")

`configure(options)`

Merge options into the shared global configuration and return it. Call `configure({})` to read the current configuration.

### checkNumber[​](#checknumber "Direct link to checkNumber")

`checkNumber(value)`

### formatValue[​](#formatvalue "Direct link to formatValue")

`formatValue(value, {precision = config.precision} = {})`

### isArray[​](#isarray "Direct link to isArray")

Returns true if value is either an array or a typed array

`isArray(value)`

Note: does not return true for ArrayBuffers and DataViews

### clone[​](#clone "Direct link to clone")

`clone(array)`

Call the input's `clone()` method when present, otherwise copy it with `slice()`.

### toRadians[​](#toradians "Direct link to toRadians")

`toRadians(degrees)`

Works on single values and vectors

### toDegrees[​](#todegrees "Direct link to toDegrees")

`toDegrees(radians)`

Works on single values and vectors

### safeMod[​](#safemod "Direct link to safeMod")

`safeMod(dividend, divisor)`

Returns a modulo result that follows the sign of the divisor, including when the dividend is negative.

### normalizeAngle[​](#normalizeangle "Direct link to normalizeAngle")

`normalizeAngle(angle, range)`

Normalizes an angle in radians. `range` is either:

* `'zero-to-two-pi'` for the range from 0 to 2π
* `'negative-pi-to-pi'` for the range from -π to π

### equals[​](#equals "Direct link to equals")

`equals(a, b, epsilon)`

* Works on single values and vectors
* Numeric values need to be closer than `config.EPSILON`
* Objects will be compared with their `.equals()` method if present.

### exactEquals[​](#exactequals "Direct link to exactEquals")

`exactEquals(a, b)`

* Works on single values and vectors.
* Numeric values need to be exactly identical
* Objects will be compared with their `.exactEquals()` method if present.

## GLSL equivalents[​](#glsl-equivalents "Direct link to GLSL equivalents")

### radians[​](#radians "Direct link to radians")

`radians(degrees)`

GLSL equivalent: Works on single values and vectors

### degrees[​](#degrees "Direct link to degrees")

`degrees(radians)`

GLSL equivalent: Works on single values and vectors

### clamp[​](#clamp "Direct link to clamp")

`clamp(value, min, max)`

## Remarks[​](#remarks "Direct link to Remarks")

* When setting global configs, you may need to consider the order of code loadint when using `imports` and `requires`

### equals and exactEquals[​](#equals-and-exactequals "Direct link to equals and exactEquals")

`equals(a, b, epsilon?)` compares scalars or arrays with a relative/absolute tolerance. `exactEquals(a, b)` compares values directly. See [floating point](https://visgl.github.io/math.gl/next/docs/modules/core/developer-guide/floating-point.md).
