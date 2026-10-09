# Debugging

Enable core validation during development to catch invalid numeric values close to the operation that produced them.

## Validate core objects[​](#validate-core-objects "Direct link to Validate core objects")

```
import {configure, Vector3} from '@math.gl/core';



configure({debug: true});

const position = new Vector3(1, 2, 3);

position.scale(NaN); // Throws when the resulting vector is checked
```

Debug checks are disabled by default. Mutating core methods call `check()`, which validates the element count and finite numeric values when debug mode is enabled. Call `vector.validate()` to inspect validity without throwing. Some setters and class-specific validation also check inputs independently of debug mode. These checks do not establish that an input has the right units or coordinate system.

Configuration is shared globally, including between copies of core. Set `configure({debug: false})` for performance measurements and production code where these checks are unnecessary.

## Format values[​](#format-values "Direct link to Format values")

Use `toString()` for the configured format, or `formatString()` for a single call:

```
configure({precision: 6, printTypes: true});

const vector = new Vector3(1 / 3, 2, 3);

console.log(vector.toString()); // Vector3[0.333333, 2, 3]

console.log(vector.formatString({precision: 3, printTypes: false}));
```

| Option          | Default | Effect                                                               |
| --------------- | ------- | -------------------------------------------------------------------- |
| `precision`     | `4`     | Significant digits in formatted numbers                              |
| `printTypes`    | `false` | Include the class name                                               |
| `printDegrees`  | `false` | Format Euler angles in degrees                                       |
| `printRowMajor` | `true`  | Display matrices by row, without changing their column-major storage |

Formatting changes the displayed string, not the stored values. See [core utilities](https://visgl.github.io/math.gl/next/docs/modules/core/api-reference/utilities.md) for configuration and comparison helpers.
