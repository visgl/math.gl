# projectBounds

Project a finite 2D/3D box through a prepared synchronous transform. Unlike projecting only
corners, the sampling lattice includes edges, faces and interiors. No projection engine,
renderer or Arrow runtime is imported.

```ts
import {projectBounds} from '@math.gl/geometry';

const result = projectBounds([minimum, maximum], {
  transform: position => projection.projectSync(position),
  subdivisions: 8,
  maxSamples: 262144
});
if (result.status === 'sampled') {
  // An approximate envelope for view fitting; do not cull objects with it.
  fitView(result.bounds);
}
```

#### Parameters

| Parameter | Meaning |
| --- | --- |
| `sourceBounds` | Ordered finite minimum/maximum XY or XYZ vectors with finite extents |
| `options.transform` | Synchronous source-to-target callback receiving a fresh source array |
| `options.targetSize` | 2 or 3 output components; defaults to source dimension |
| `options.subdivisions` | Positive safe integer subdivisions on each nonzero source axis; default 8 |
| `options.maxSamples` | Positive safe integer cap on transform calls; default 262144 |
| `options.lipschitz` | Optional caller-qualified global constant for each output component |

The complete lattice uses `(subdivisions + 1)` samples per nonzero axis. Degenerate axes use
one sample. The sample budget is checked before calling the transform. Bounds are detached
arrays; inputs are unchanged. Empty, reversed, nonfinite or unrepresentable source extents,
invalid dimensions, invalid constants and exhausted budgets throw `RangeError`. Callback
exceptions propagate unchanged.

#### Result

| `status` | `bounds` | Intended use |
| --- | --- | --- |
| `'sampled'` | Sample minimum/maximum vectors | Approximate fitting or diagnostics, never conservative culling |
| `'conservative'` | Inflated minimum/maximum vectors | Enclosure conditional on the caller's global Lipschitz contract |
| `'invalid'` | `null` | A null/nonfinite sample or unrepresentable enclosure; no partial bounds are published |

`sampleCount` reports transform calls, including an invalid sample. There is no implicit
filtering of invalid points and no automatic repair, wrapping, seam splitting or domain clipping.

#### Qualifying an enclosure

For each target component `f[i]`, supply a finite nonnegative constant `L[i]` satisfying
`abs(f[i](p) - f[i](q)) <= L[i] * distance(p, q)` for **every** pair of points in the entire
source box. The transform must also be finite and continuous throughout that box. For an affine
transform, each row's Euclidean norm supplies its component constant. For a nonlinear transform,
qualify an analytical derivative bound or a trusted external enclosure over the full box.
Pointwise numerical Jacobians, sampled errors and fitting residuals do not establish that contract.

Every point is within half a cell diagonal of a lattice node. The function therefore expands
each sampled output range by `L[i]` times that covering radius, with floating-point guards for
source placement and output arithmetic. More subdivisions reduce this overestimate. For example,
`([x, y]) => [x, sin(2 * PI * x)]` over `[0, 1] × [0, 0]` accepts `[1, 2 * PI]`, while a coarse
sample-only envelope can miss the sine peaks entirely. Caller-supplied constants are a
precondition, not an independently verified certificate.

Split antimeridian crossings, projection cuts and invalid regions before calling. A finite set
of valid samples does not prove that unsampled points are valid. If the full-box contract is
unknown, omit `lipschitz`, keep the result marked sampled and disable conservative culling rather
than treating an estimated envelope as guaranteed. For known affine bounds, prefer existing
exact affine bounds transforms. This helper does not fit an oriented box or infer a CRS domain.
