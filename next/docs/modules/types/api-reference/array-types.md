# Array Types

![From v3.6](https://img.shields.io/badge/From-v3.6-blue.svg?style=flat-square)

math.gl provides a number of numeric array types.

TypeScript types to simplify working with a mix of typed arrays and standard JavaScript arrays containing numbers.

## Float16 support[​](#float16-support "Direct link to Float16 support")

math.gl includes `Float16Array` in its public array types, but does not install or polyfill the global `Float16Array` constructor.

Use `NativeFloat16ArrayConstructor` to detect native or polyfilled support. Use `getFloat16ArrayConstructor()` when an application can use `Uint16Array` as a fallback containing encoded IEEE 754 binary16 bit patterns. The fallback does not encode numeric assignments or decode values when read.

`NativeFloat16ArrayConstructor` is captured when `@math.gl/types` is evaluated. Applications using a polyfill must install it before importing `@math.gl/types`.

## Types[​](#types "Direct link to Types")

### `TypedArray`[​](#typedarray "Direct link to typedarray")

Type matching any non-big JavaScript typed array.

This includes `Float16Array` even when the current JavaScript runtime does not provide its constructor.

### `TypedArrayConstructor`[​](#typedarrayconstructor "Direct link to typedarrayconstructor")

Type matching constructor for any non-big JavaScript typed array.

This includes `Float16ArrayConstructor` as a type. It does not install a runtime constructor.

### `BigTypedArray`[​](#bigtypedarray "Direct link to bigtypedarray")

Type matching any big JavaScript typed array.

### `BigTypedArrayConstructor`[​](#bigtypedarrayconstructor "Direct link to bigtypedarrayconstructor")

Type matching constructor for any big JavaScript typed array.

### `NumberArray`[​](#numberarray "Direct link to numberarray")

A classic JavaScript array containing numbers. Included for completeness, it is recommended to just use the type `number[]` in this case.

### `NumberArray2-NumberArray16`[​](#numberarray2-numberarray16 "Direct link to numberarray2-numberarray16")

JavaScript number arrays of specific lengths.

### `NumericArray`[​](#numericarray "Direct link to numericarray")

Type matching any classic JavaScript array containing numbers or any non-big typed array.

This includes `Float16Array` as part of the `TypedArray` union.

### `NumericArray2-NumericArray16`[​](#numericarray2-numericarray16 "Direct link to numericarray2-numericarray16")

Types matching number arrays of specific lengths or typed arrays.

## Utilities[​](#utilities "Direct link to Utilities")

### `isUint16Array(value: unknown): value is Uint16Array`[​](#isuint16arrayvalue-unknown-value-is-uint16array "Direct link to isuint16arrayvalue-unknown-value-is-uint16array")

Checks the intrinsic element type of an unsigned 16-bit typed array. Works across JavaScript realms, including iframe and Node VM arrays, and supports subviews. Rejects signed integers, floats, DataViews, and objects with forged constructors or `Symbol.toStringTag` properties.

### `isFloat16Array(value: unknown): value is Float16Array`[​](#isfloat16arrayvalue-unknown-value-is-float16array "Direct link to isfloat16arrayvalue-unknown-value-is-float16array")

Checks for a native Float16Array using the same realm-independent element-type check. Does not require a Float16Array constructor in the caller's realm and does not install a polyfill. A Uint16Array containing encoded IEEE 754 binary16 bits returns false: those bits need decoding before they represent numeric floats.

### `isTypedArray(value: unknown): value as TypedArray`[​](#istypedarrayvalue-unknown-value-as-typedarray "Direct link to istypedarrayvalue-unknown-value-as-typedarray")

Checks if a value is a typed array.

Remarks:

* Avoids type narrowing problems with `ArrayBuffer.isView()` (which accepts `DataViews` that do not support array methods).

### `isNumberArray(value: unknown): value as NumberArray`[​](#isnumberarrayvalue-unknown-value-as-numberarray "Direct link to isnumberarrayvalue-unknown-value-as-numberarray")

Checks if a value is a classic JavaScript array of numbers.

Remarks:

* Only the type of the first element in a standard array is checked to be a `number`.

### `isNumericArray(value: unknown): value as NumericArray`[​](#isnumericarrayvalue-unknown-value-as-numericarray "Direct link to isnumericarrayvalue-unknown-value-as-numericarray")

Checks if a value is either a classic JavaScript array of numbers or a typed array.

Remarks:

* Avoids type narrowing problems with `ArrayBuffer.isView()` (which accepts `DataViews` that do not support array methods).
* Only the type of the first element in a standard array is checked to be a `number`.

### `NativeFloat16ArrayConstructor: TypedArrayConstructor | undefined`[​](#nativefloat16arrayconstructor-typedarrayconstructor--undefined "Direct link to nativefloat16arrayconstructor-typedarrayconstructor--undefined")

The native `Float16Array` constructor, or `undefined` when the current JavaScript runtime does not provide it. The value is captured when `@math.gl/types` is evaluated.

### `getFloat16ArrayConstructor(): TypedArrayConstructor`[​](#getfloat16arrayconstructor-typedarrayconstructor "Direct link to getfloat16arrayconstructor-typedarrayconstructor")

Returns the native `Float16Array` constructor when available and `Uint16Array` otherwise. The fallback stores encoded IEEE 754 binary16 bit patterns and does not provide native float16 numeric semantics.

### `isFloat16ArrayConstructor(value: unknown): boolean`[​](#isfloat16arrayconstructorvalue-unknown-boolean "Direct link to isfloat16arrayconstructorvalue-unknown-boolean")

Returns `true` when the value matches `NativeFloat16ArrayConstructor`. Returns `false` for the `Uint16Array` fallback.
