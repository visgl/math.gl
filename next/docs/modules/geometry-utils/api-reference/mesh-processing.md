# Triangle mesh processing

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

```
import {transformGeometry, mergeGeometries, weldGeometry, getDegenerateTriangles}

  from '@math.gl/geometry-utils';
```

These operations accept the module's minimal `Geometry` shape: `mode: GL.TRIANGLES`, packed typed-array attributes, and optional indices. Positions use `POSITION` or `positions` with size 3. Each other attribute needs an explicit size and the same vertex count. Both `value` and legacy `values` storage are accepted. Interleaved and constant attributes are not supported. Values must be finite and indices valid. Outputs have fresh buffers and Uint32 indices; inputs are never modified.

## transformGeometry(geometry, matrix)[​](#transformgeometrygeometry-matrix "Direct link to transformGeometry(geometry, matrix)")

Accepts a finite affine column-major 4×4 matrix. Positions become Float64 values. `NORMAL` or `normals` uses the inverse transpose and normalization. Size-4 `TANGENT` uses the linear transform, orthogonalization against the transformed normal when present, and normalization. Reflection flips tangent handedness and triangle winding. Normals and tangents require an invertible transform. Auxiliary attributes retain their storage types. Projective matrices are rejected.

## mergeGeometries(geometries)[​](#mergegeometriesgeometries "Direct link to mergeGeometries(geometries)")

Concatenates one or more triangle meshes and offsets their indices. Attribute names, sizes and typed-array constructors must match. Nonindexed meshes receive sequential indices. The merged output retains all attributes.

## weldGeometry(geometry, options?)[​](#weldgeometrygeometry-options "Direct link to weldGeometry(geometry, options?)")

Returns `{geometry, vertexMap, removedVertices}`. `vertexMap` maps each original vertex row to its output row. The default compares complete attribute tuples exactly, preserving UV seams, hard normal edges and differing colors. The first matching row is retained.

`positionGridSize` defaults to zero. A positive value compares positions rounded to that grid while comparing all other attributes exactly. This is quantization, not a radius search: nearby points across grid boundaries can remain separate. Original coordinates of the first row are retained. Welding can create degenerate triangles; it does not remove them or unused vertices.

## getDegenerateTriangles(geometry, areaEpsilon = 0)[​](#getdegeneratetrianglesgeometry-areaepsilon--0 "Direct link to getDegenerateTriangles(geometry, areaEpsilon = 0)")

Returns a Uint32Array of triangle numbers in draw order whose area is at most the finite, nonnegative threshold. The default detects zero-area triangles, including repeated indices and collinear vertices. Use a threshold in squared coordinate units to include near-degenerate triangles. This reports triangles without changing them.
