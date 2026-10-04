# Geometry

import GeometryViewer from '@site/src/components/geometry-viewer';

<GeometryViewer inline />

A renderer-independent CPU mesh container. The viewer accepts a `Geometry` instance through
its `geometry` property, or a primitive constructor name and options through `geometryType`
and `geometryProps`.

```typescript
import {Geometry} from '@math.gl/geometry';

const geometry = new Geometry({
  topology: 'triangle-list',
  attributes: {
    POSITION: {size: 3, value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])}
  },
  indices: new Uint16Array([0, 1, 2])
});
```

## Constructor parameters

- `id`: optional identifier, generated when omitted.
- `topology`: point-list, line-list, line-strip, triangle-list or triangle-strip.
- `attributes`: named typed arrays or records with `value`, optional `size`, and metadata.
- `indices`: optional Uint16Array or Uint32Array, directly or wrapped in an attribute record.
- `vertexCount`: optional draw count, otherwise inferred from indices or countable attributes.

`POSITION` and `positions` default to size 3. Indices can alternatively be supplied in
`attributes`. Index bounds are validated against countable attributes.

## Mesh data

`getVertexCount()` returns the draw count (the index count for indexed meshes).
`getAttributes()` returns named attributes and the optional indices record. The same data is
available through `attributes`, `indices`, `topology` and `vertexCount` properties.
`userData` stores application metadata. `unpackIndexedGeometry()` expands indexed attributes
into non-indexed arrays.
