# Geometry utilities

![From v4.2](https://img.shields.io/badge/From-v4.2-blue.svg?style=flat-square)

## Geometry types[​](#geometry-types "Direct link to Geometry types")

`Geometry` is the minimal indexed or non-indexed geometry shape accepted by this module. Attributes may store typed arrays in either `value` or legacy `values` fields.

## Primitive iteration[​](#primitive-iteration "Direct link to Primitive iteration")

#### `makeAttributeIterator(values, size)`[​](#makeattributeiteratorvalues-size "Direct link to makeattributeiteratorvalues-size")

Iterates over fixed-size typed-array elements.

#### `makePrimitiveIterator(geometry)`[​](#makeprimitiveiteratorgeometry "Direct link to makeprimitiveiteratorgeometry")

Iterates over points, lines, or triangles and dereferences optional indices. It supports point, line-list, line-strip, line-loop, triangle-list, triangle-strip, and triangle-fan modes.

## Vertex normals[​](#vertex-normals "Direct link to Vertex normals")

#### `computeVertexNormals(geometry)`[​](#computevertexnormalsgeometry "Direct link to computevertexnormalsgeometry")

Calculates smooth, area-weighted normals for indexed or non-indexed triangle geometry. Triangle strips and triangle fans are supported.

## Component types and typed arrays[​](#component-types-and-typed-arrays "Direct link to Component types and typed arrays")

`GLType` converts between WebGL-compatible component constants and typed-array constructors.

#### `concatTypedArrays(arrays)`[​](#concattypedarraysarrays "Direct link to concattypedarraysarrays")

Concatenates the visible bytes of typed-array views.

## Packed attributes[​](#packed-attributes "Direct link to Packed attributes")

[`interpolatePackedAttributes`](https://visgl.github.io/math.gl/next/docs/modules/geometry/utils/api-reference/interpolate-packed-attributes.md) reconstructs interleaved vertex records from original-vertex provenance. It preserves storage encodings, handles offset views, and requires explicit linear or flat policies for every declared field.

#### `encodeRGB565(rgb)`[​](#encodergb565rgb "Direct link to encodergb565rgb")

Converts 8-bit RGB components to a packed RGB565 number.

#### `decodeRGB565(rgb565, target?)`[​](#decodergb565rgb565-target "Direct link to decodergb565rgb565-target")

Decodes a packed RGB565 number into 8-bit RGB components, writing into `target` when supplied.

#### `octEncodeInRange(vector, rangeMaximum, result)`[​](#octencodeinrangevector-rangemaximum-result "Direct link to octencodeinrangevector-rangemaximum-result")

Octahedrally encodes a normalized vector into two unsigned components in the requested range.

#### `octEncode(vector, result)`[​](#octencodevector-result "Direct link to octencodevector-result")

Encodes a normalized vector into two components in the range 0–255.

#### `octEncodeToVector4(vector, result)`[​](#octencodetovector4vector-result "Direct link to octencodetovector4vector-result")

Encodes a normalized vector into four 8-bit octahedral components.

#### `octDecodeInRange(x, y, rangeMaximum, result)`[​](#octdecodeinrangex-y-rangemaximum-result "Direct link to octdecodeinrangex-y-rangemaximum-result")

Decodes two unsigned octahedral components from the requested range into a normalized vector.

#### `octDecode(x, y, result)`[​](#octdecodex-y-result "Direct link to octdecodex-y-result")

Decodes two components in the range 0–255 into a normalized vector.

#### `octDecodeFromVector4(encoded, result)`[​](#octdecodefromvector4encoded-result "Direct link to octdecodefromvector4encoded-result")

Decodes four 8-bit octahedral components into a normalized vector.

#### `octPackFloat(encoded)`[​](#octpackfloatencoded "Direct link to octpackfloatencoded")

Packs two 8-bit components into one number.

#### `octEncodeFloat(vector)`[​](#octencodefloatvector "Direct link to octencodefloatvector")

Encodes a normalized vector into a packed number.

#### `octDecodeFloat(value, result)`[​](#octdecodefloatvalue-result "Direct link to octdecodefloatvalue-result")

Decodes a packed number into a normalized vector.

#### `octPack(v1, v2, v3, result)`[​](#octpackv1-v2-v3-result "Direct link to octpackv1-v2-v3-result")

Packs three normalized vectors into two numbers.

#### `octUnpack(packed, v1, v2, v3)`[​](#octunpackpacked-v1-v2-v3 "Direct link to octunpackpacked-v1-v2-v3")

Unpacks two numbers into three normalized vectors.

#### `compressTextureCoordinates(textureCoordinates)`[​](#compresstexturecoordinatestexturecoordinates "Direct link to compresstexturecoordinatestexturecoordinates")

Packs normalized UV coordinates into one number.

#### `decompressTextureCoordinates(compressed, result)`[​](#decompresstexturecoordinatescompressed-result "Direct link to decompresstexturecoordinatescompressed-result")

Unpacks UV coordinates into the supplied result.

#### `zigZagDeltaDecode(uBuffer, vBuffer, heightBuffer?)`[​](#zigzagdeltadecodeubuffer-vbuffer-heightbuffer "Direct link to zigzagdeltadecodeubuffer-vbuffer-heightbuffer")

Decodes quantized zigzag delta buffers in place. The height buffer is optional.
