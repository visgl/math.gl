# Geometry utilities

## Geometry types

`Geometry` is the minimal indexed or non-indexed geometry shape accepted by this module.
Attributes may store typed arrays in either `value` or legacy `values` fields.

## Primitive iteration

`makeAttributeIterator(values, size)` iterates over fixed-size typed-array elements.

`makePrimitiveIterator(geometry)` iterates over points, lines, or triangles and dereferences optional
indices. It supports point, line-list, line-strip, line-loop, triangle-list, triangle-strip, and
triangle-fan modes.

## Vertex normals

`computeVertexNormals(geometry)` calculates smooth, area-weighted normals for indexed or non-indexed
triangle geometry. Triangle strips and triangle fans are supported.

## Component types and typed arrays

`GLType` converts between WebGL-compatible component constants and typed-array constructors.
`concatTypedArrays(arrays)` concatenates the visible bytes of typed-array views.

## Packed attributes

`encodeRGB565` and `decodeRGB565` convert 8-bit RGB colors to and from RGB565.

The `oct*` functions encode and decode normalized vectors using octahedral encoding.
`compressTextureCoordinates` and `decompressTextureCoordinates` pack normalized UV coordinates.
`zigZagDeltaDecode` decodes quantized delta buffers in place.
