# @math.gl/geospatial/terrain

Experimental renderer-independent height fields, sampling, derivatives, and regular
terrain meshes. The main entry point has no runtime imports from other packages.
Mesh construction is available separately from `@math.gl/geospatial/terrain/geometry`.

```ts
import {HeightField, TerrainSampleStatus} from '@math.gl/geospatial/terrain';
import {HeightFieldGeometry} from '@math.gl/geospatial/terrain/geometry';

const field = new HeightField({
  width: 2,
  height: 2,
  heights: new Float32Array([0, 2, 1, 4]),
  columnStep: [10, 0],
  rowStep: [0, 10],
  registration: 'vertex',
  heightReference: 'local-survey'
});

const sample = field.sample(5, 5);
if (sample.status === TerrainSampleStatus.VALID) {
  console.log(sample.height); // 1.75 meters, using bilinear interpolation
}

const mesh = new HeightFieldGeometry(field);
// POSITION is relative to mesh.origin; NORMAL is a smooth shading normal.
// Use field.sample(x, y, {interpolation: 'triangle'}) for the mesh's linear surface.
```

The main entry uses affine local Cartesian coordinates and heights in
meters, with Z up. The optional `/terrain/geographic` entry adds longitude/latitude
queries and physical east/north derivatives for geographic and Web Mercator rasters.
The `/terrain/tiled` entry adds cell-registered local-metric tile snapshots, seam
sampling, residency-aware fallback, incremental snapshot updates and transferable halo buffers.
The `/terrain/packed` entry adds a versioned f32/u32 upload layout with byte and
height-error budgets and validated CPU reconstruction. Shader implementations, GPU
resources and compute graph integration belong in luma.gl; math.gl contains no
shader code. No entry converts
height references. Input arrays are copied; missing samples are stored as finite zeros
with a separate mask. Query status must be checked before using a result.

See the [API and numerical contract](../../../docs/modules/geospatial/terrain/README.md) and
[implementation roadmap](../../../dev-docs/terrain-roadmap.md).

The optional `/terrain/surface` entry adds indexed triangle surfaces, barycentric
height sampling, explicit halfedge topology and BVH ray/segment/nearest queries.
Bounded query variants report completion and work counts; sphere queries return
face/edge/vertex contacts with explicit work and contact-capacity limits.
Segment-clearance and capsule queries cover the full axis, including interior
contacts missed by endpoint-only sphere tests. They do not report first-impact time.
`/terrain/bounds` adds conservative min/max hierarchies over height-field cells.
These are CPU/data APIs; shader and device execution stay in luma.gl.
