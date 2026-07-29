# Array Types

math.gl provides a number of numeric array types.

TypeScript types to simplify working with a mix of typed arrays and standard JavaScript arrays containing numbers.

## Types

### `TypedArray`

Type matching any non-big JavaScript typed array.

This includes `Float16Array`. math.gl provides type support but does not polyfill the
`Float16Array` runtime constructor; applications must check that the constructor is available
before creating instances.

### `TypedArrayConstructor`

Type matching constructor for any non-big JavaScript typed array.

This includes `Float16ArrayConstructor` as a type. It does not add `Float16Array` to runtimes
where that constructor is unavailable.

### `BigTypedArray`

Type matching any big JavaScript typed array.

### `BigTypedArrayConstructor`

Type matching constructor for any big JavaScript typed array.

### `NumberArray`

A classic JavaScript array containing numbers. Included for completeness, it is recommended to just use the type `number[]` in this case.

### `NumberArray2-NumberArray16`

JavaScript number arrays of specific lengths.

### `NumericArray`

Type matching any classic JavaScript array containing numbers or any non-big typed array.

This includes `Float16Array` as part of the `TypedArray` union.

### `NumericArray2-NumericArray16`

Types matching number arrays of specific lengths or typed arrays.

## Utilities

### `isTypedArray(value: unknown): value as TypedArray`

Checks if a value is a typed array.

Remarks:

- Avoids type narrowing problems with `ArrayBuffer.isView()` (which accepts `DataViews` that do not support array methods).

### `isNumberArray(value: unknown): value as NumberArray`

Checks if a value is a classic JavaScript array of numbers.

Remarks:

- Only the type of the first element in a standard array is checked to be a `number`.

### `isNumericArray(value: unknown): value as NumericArray`

Checks if a value is either a classic JavaScript array of numbers or a typed array.

Remarks:

- Avoids type narrowing problems with `ArrayBuffer.isView()` (which accepts `DataViews` that do not support array methods).
- Only the type of the first element in a standard array is checked to be a `number`.

### `NativeFloat16ArrayConstructor`

The native `Float16Array` constructor, or `undefined` when the current JavaScript runtime does not
provide it.

### `getFloat16ArrayConstructor()`

Returns the native `Float16Array` constructor when available and `Uint16Array` otherwise. The
fallback stores float16 bit patterns; it does not provide native float16 numeric semantics.

### `isFloat16ArrayConstructor(value: unknown)`

Returns `true` when the value is the native `Float16Array` constructor for the current runtime.
