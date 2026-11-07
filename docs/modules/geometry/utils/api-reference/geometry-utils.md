# Geometry utilities

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square" alt="From v4.2" />
</p>

## Geometry types

`Geometry` is the minimal indexed or non-indexed geometry shape accepted by this module.
Attributes may store typed arrays in either `value` or legacy `values` fields.

## Primitive iteration

#### `makeAttributeIterator(values, size)`

Iterates over fixed-size typed-array elements.

#### `makePrimitiveIterator(geometry)`

Iterates over points, lines, or triangles and dereferences optional
indices. It supports point, line-list, line-strip, line-loop, triangle-list, triangle-strip, and
triangle-fan modes.

## Vertex normals

#### `computeVertexNormals(geometry)`

Calculates smooth, area-weighted normals for indexed or non-indexed
triangle geometry. Triangle strips and triangle fans are supported.

## Component types and typed arrays

`GLType` converts between WebGL-compatible component constants and typed-array constructors.

#### `concatTypedArrays(arrays)`

Concatenates the visible bytes of typed-array views.

## Packed attributes

[`interpolatePackedAttributes`](./interpolate-packed-attributes.md) reconstructs interleaved
vertex records from original-vertex provenance. It preserves storage encodings, handles offset
views, and requires explicit linear or flat policies for every declared field.

#### `encodeRGB565(rgb)`

Converts 8-bit RGB components to a packed RGB565 number.

#### `decodeRGB565(rgb565, target?)`

Decodes a packed RGB565 number into 8-bit RGB components, writing into `target` when supplied.

#### `octEncodeInRange(vector, rangeMaximum, result)`

Octahedrally encodes a normalized vector into two unsigned components in the requested range.

#### `octEncode(vector, result)`

Encodes a normalized vector into two components in the range 0–255.

#### `octEncodeToVector4(vector, result)`

Encodes a normalized vector into four 8-bit octahedral components.

#### `octDecodeInRange(x, y, rangeMaximum, result)`

Decodes two unsigned octahedral components from the requested range into a normalized vector.

#### `octDecode(x, y, result)`

Decodes two components in the range 0–255 into a normalized vector.

#### `octDecodeFromVector4(encoded, result)`

Decodes four 8-bit octahedral components into a normalized vector.

#### `octPackFloat(encoded)`

Packs two 8-bit components into one number.

#### `octEncodeFloat(vector)`

Encodes a normalized vector into a packed number.

#### `octDecodeFloat(value, result)`

Decodes a packed number into a normalized vector.

#### `octPack(v1, v2, v3, result)`

Packs three normalized vectors into two numbers.

#### `octUnpack(packed, v1, v2, v3)`

Unpacks two numbers into three normalized vectors.

#### `compressTextureCoordinates(textureCoordinates)`

Packs normalized UV coordinates into one number.

#### `decompressTextureCoordinates(compressed, result)`

Unpacks UV coordinates into the supplied result.

#### `zigZagDeltaDecode(uBuffer, vBuffer, heightBuffer?)`

Decodes quantized zigzag delta buffers in place. The height buffer is optional.
