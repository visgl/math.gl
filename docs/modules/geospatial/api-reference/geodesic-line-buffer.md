# Packed geodesic and rhumb line sampling

`GeodesicLineBuffer` and `RhumbLineBuffer` sample a prepared line into caller-owned
`Float64Array` storage. They stage results before committing, so a nonfinite input,
missing field, domain failure or nonfinite result leaves the caller's output
unchanged. Preparation allocates staging once; capacity is fixed and at most one
million samples.

```ts
import {EllipsoidGeodesic} from '@math.gl/geospatial';
import {GeodesicLineBuffer} from '@math.gl/geospatial';
const geodesic = new EllipsoidGeodesic({
  semiMajorAxis: 6378137, semiMinorAxis: 6356752.314245179
});
const line = geodesic.line(30, 20, 40, {unrollLongitude: true});
const sampler = new GeodesicLineBuffer(line, 3);
const output = sampler.positions([0, 1000, 2000], new Float64Array(24));
```

`positions(distances, output)` writes the first `distances.length × stride`
values and returns `output`; remaining output values are untouched. Input/output
aliasing is supported because all inputs are consumed before committing. Shared
storage is rejected. Samplers snapshot the line methods and layout, are
non-reentrant, and expose frozen `capacity`, `fields` and `stride` metadata.

| Sampler | Default interleaved fields |
| --- | --- |
| Geodesic | `lat2, lon2, azi2, s12, a12, m12, M12, M21` |
| Rhumb | `lat2, lon2, azi12, s12` |

Angles are degrees, distance/reduced length use the line's axis units, and scales
are dimensionless. Construction with `{area: true}` appends `S12` in squared axis
units; the supplied line must have been created with area enabled. Signed distance,
longitude unrolling, pole failures and qualified shape domains come from the line.
The samplers do not silently change solver or widen its support profile.

Buffers reuse result storage with built-in series geodesic and rhumb lines.
Scalar `position` still returns independent objects. Exact/custom lines work
through the ordinary allocating fallback. Internal numerical kernels may still
allocate; reusable public storage is not a universal allocation-free claim.

## Measured scope

The [recorded Node experiment](https://github.com/visgl/math.gl/blob/master/modules/geospatial/test/qualification/line-buffer-node.json)
compares identical fields and distances before timing, rotates sample order and
includes staging/commit costs. It records spread/instability flags and V8 sampled
allocation estimates. Reusable geodesic results reduce allocation estimates in
this workload, but staging and validation have a throughput cost. No geodesic or
rhumb speedup is claimed. Rhumb integration allocations still dominate. These
are host/workload observations, not portable allocation guarantees.

Run `node modules/geospatial/scripts/benchmark-line-buffers.mjs --points 2048
--samples 11 --allocations --output /tmp/line-buffers.json` to reproduce. Profiling
runs after timing, uses V8 heap sampling, and may include runtime overhead or miss
allocations. Prepared outputs and staging are excluded from operation timing but
consume persistent memory: roughly `capacity × stride × 8` bytes of internal
staging, in addition to the caller's output. Existing G7 native controls gate
packed outputs at the existing distance/angle/scale budgets before performance
claims. The optional entry retains no projection or geodesic kernel by itself.
