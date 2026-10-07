# Temporal deformation models

A coordinate can move between observation epochs because of a steady velocity,
a changing rate, an event or relaxation after an event. The optional
`@math.gl/projection/temporal` entry supplies `createTemporalDeformationModel` for
an explicit combination of these effects. Applications supply and review the
spatial fields, ellipsoid, reference frame, data terms and validity interval.
There are no bundled model datasets, inferred frame changes or implicit downloads.

## Combine rates and events

This authored example produces 0.3 metres of eastward displacement from 2010 to
2020 at the equator: 0.1 from velocity, 0.1 from acceleration and 0.1 from an event.
The fields are examples, not an observed geodetic model.

```typescript
import {createTemporalDeformationModel} from '@math.gl/projection/temporal';
import {ProjectionPipeline} from '@math.gl/projection/pipeline';
import type {ProjectionPoint} from '@math.gl/projection/core';

function eastField(amplitude: number) {
  return {
    sample(longitude: number, latitude: number, output: ProjectionPoint) {
      output.x = amplitude; // east
      output.y = 0;         // north
      output.z = 0;         // up
      return true;
    }
  };
}
const model = createTemporalDeformationModel({
  epochRange: [2010, 2030],
  components: [
    {id: 'rate', field: eastField(0.01), units: 'm/year',
     timeFunction: {type: 'velocity'}},
    {id: 'changing-rate', field: eastField(0.002), units: 'm/year^2',
     timeFunction: {type: 'acceleration', referenceEpoch: 2010}},
    {id: 'event', field: eastField(0.1), units: 'm',
     timeFunction: {type: 'step', epoch: 2015}}
  ]
});
const pipeline = new ProjectionPipeline({
  input: {space: 'geocentric', units: ['m', 'm', 'm']},
  steps: [{type: 'deformation', model, sourceEpoch: 2010, targetEpoch: 2020}]
});
const coordinates = new Float64Array([6378137, 0, 0, 8]);
pipeline.projectFlatSync(coordinates, 4); // ECEF metres; M stays 8
pipeline.unprojectFlatSync(coordinates, 4); // solves the original 2010 → 2020 map
```

A field's `sample(longitude, latitude, output)` receives angles in radians and
writes all three finite ENU amplitudes into the reusable `ProjectionPoint`.
Incomplete outputs and asynchronous results are rejected. Return `false` for
missing coverage or nodata. Field methods are captured at construction; fields
remain application-owned, so review any mutable data they access. Component IDs
must be nonempty and unique. Component lists and law parameters are snapshotted.
Model loops reuse the existing point and numeric locals without explicit
per-coordinate arrays or small objects.

## Temporal laws and units

Let `s` and `t` be the source and target decimal years. Each ENU field is multiplied
by the following coefficient before the components are summed:

| `timeFunction` | Required field units | Interval coefficient |
| --- | --- | --- |
| `{type: 'velocity'}` | `m/year` | `t − s` |
| `{type: 'acceleration', referenceEpoch: r}` | `m/year^2` | `((t − r)² − (s − r)²) / 2` |
| `{type: 'step', epoch: e}` | `m` | `H(t ≥ e) − H(s ≥ e)` |
| `{type: 'exponential', epoch: e, timeConstantYears: τ}` | `m` | `F(t) − F(s)`, where `F(u) = 0` for `u ≤ e`, otherwise `1 − exp(−(u − e)/τ)` |

Acceleration adds the change relative to the specified reference epoch; combine
it with a velocity component to express a reference rate. The event is
right-continuous: an interval ending exactly at the event includes the step; an
interval beginning there does not repeat it. Exponential amplitudes are eventual
displacements, with positive finite relaxation time in years. Stable coefficient
differences preserve small relaxation changes without subtracting nearly equal
exponentials. Reversed intervals reverse the temporal coefficients.

All components sample the **same source position**. Their ENU displacements are
summed and rotated once into fixed XYZ metres. This is a source-sampled propagation
map, not numerical trajectory integration. Chaining intervals can change results
because an intermediate position changes the sampled spatial field. These laws
are deliberately bounded; seasonal, piecewise-table and other functions need an
explicit future contract or an application-supplied `DeformationModel`.

## Epochs, coverage and inverse behavior

Both epochs must lie within the inclusive `epochRange`; neither comes from M or
the current date. Finite laws, fields, coefficients and outputs are required.
All fields must cover the source even for zero-duration or zero-coefficient
intervals: model coverage is their intersection. The ellipsoid defaults to WGS84
and must match the application's reviewed frame.

`model.inverse(point, s, t)` solves `source + displacement(source, s, t) = point`
using the **original source/target pair**. It is different from evaluating a
negative displacement at the endpoint. Temporal models use a damped Newton solve,
a centred numerical displacement Jacobian, at most 16 updates and 12 halving trials
per update. The stopping criterion is a fixed-XYZ forward residual of 1e-8 metres.
This numerical threshold is not a claim about observational model accuracy.
Stencil/trial positions need coverage; singular or nonconvergent inverses fail.
Failure restores the input XYZ. The existing [static velocity model](developer-guide/deformation-models.md)
keeps its current fixed-point inverse and multiplication order.

## Independent qualification

An original standard-library Python oracle uses 90-digit Decimal arithmetic and
a coupled root solve. **96 cases** combine all four laws on WGS84, a sphere and a
flattened spheroid, with forward and separately perturbed inverse targets, event
endpoints, fractional/positive/negative/zero intervals and polar positions. The
sampled allowance is **5e-8 metres in fixed XYZ**. Tests additionally check both
float precisions, mixed epoch buffers, preserved M, recursion and failure recovery.
Float32 scalar/bulk agreement qualifies rounding, not this Float64 allowance.
The same reference qualification runs in Node tests and three browser CI jobs.

```sh
python3 modules/projection/scripts/generate-temporal-reference.py --check
yarn exec vitest run --project node modules/projection/test/lib/temporal.spec.ts
```

These are original synthetic fields and references, with no new third-party
implementation or model data. Qualify real fields separately using the
[application model harness](deformation-qualification.md). The vocabulary of
rates and event functions also appears in [OGC deformation model guidance](https://docs.ogc.org/as/22-010r4/22-010r4.html);
this API does not parse or claim conformance with that format.
