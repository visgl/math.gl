# Matrix

![From v3.0](https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square)

`Matrix` is the shared base for [Matrix3](https://visgl.github.io/math.gl/next/docs/modules/core/api-reference/matrix3.md) and [Matrix4](https://visgl.github.io/math.gl/next/docs/modules/core/api-reference/matrix4.md). It extends [MathArray](https://visgl.github.io/math.gl/next/docs/modules/core/api-reference/math-array.md) and stores elements in column-major order.

## Elements and columns[​](#elements-and-columns "Direct link to Elements and columns")

| Method                           | Behavior                                          |
| -------------------------------- | ------------------------------------------------- |
| `getElement(row, column)`        | Read an element by zero-based row and column      |
| `setElement(row, column, value)` | Write an element and return the receiver          |
| `getColumn(column, result?)`     | Copy a column into a supplied result or new array |
| `setColumn(column, values)`      | Copy values into a column and return the receiver |

Array storage uses `column * rank + row` as the element index. Row/column accessors take row first regardless of storage order.

## Formatting[​](#formatting "Direct link to Formatting")

`toString()` displays values by row when `config.printRowMajor` is true, or in storage order otherwise. Display order does not change matrix storage or multiplication semantics.
