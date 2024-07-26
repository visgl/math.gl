# Bounds

A common need for geospatial and 3D applications is to be able to express bounds
or extents for a 2D or 3D geometry.

math.gl provides a set of `Bounds*` types. These types could be viewed as a recommendation
for how vis.gl frameworks should represent bounds.
Typing out the definitions directly is sometimes easier and clearer than importing these types from math.gl.

## Types

### `Bounds`

2 or 3 dimensional bounds, expressed as an array of arrays `[[minX, minY], [maxX, maxY]]` or `[[minX, minY, minZ], [maxX, maxY, maxZ]]`.

```ts
export type Bounds =
  | [[number, number], [number, number]]
  | [[number, number, number], [number, number, number]];
```

### `Bounds2D`

2 dimensional bounds, expressed as an array of arrays `[[minX, minY], [maxX, maxY]]`.

```ts
type Bounds2D = [[number, number], [number, number]];
```

### `Bounds3D`

3 dimensional bounds, expressed as an array of arrays `[[minX, minY, minZ], [maxX, maxY, maxZ]]`

```ts
export type Bounds3D = [[number, number, number], [number, number, number]];
```

## Functions

### `is2DBounds()`

```ts
is2DBounds(bounds: Bounds): bounds is Bounds2D
```

Checks if the supplied bounds are 2D and narrows the type to `Bounds2D`.

### `get2DBounds()`

```ts
get2DBounds(bounds: Bounds): Bounds2D`
```

Returns 2D bounds, truncating 3D bounds to 2D if needed.
