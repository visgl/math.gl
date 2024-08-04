# Array Types

math.gl provides a number of numeric array types.

TypeScript types to simplify working with a mix of typed arrays and standard JavaScript arrays containing numbers.



## Types

### `TypedArray`

Type matching any non-big JavaScript typed array.

### `TypedArrayConstructor`

Type matching constructor for any non-big JavaScript typed array.

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
