# Qualify a deformation model

A deformation model's numerical behavior, physical accuracy and data authority
are separate questions. math.gl provides an offline development harness for
checking an application-owned model against independently prepared coordinates.
It does not distribute authoritative velocity models, infer their reference frames,
or download model data.

## Authored stress profile

The existing PROJ reference corpus has 16 configurations and 64 coordinate/epoch
pairs using an authored velocity TIFF. A second corpus adds **108 independent
cases** for a nonlinear spatial field on WGS84, a sphere and a 2:1 flattened
spheroid. It includes both hemispheres, cardinal and near/exact polar positions,
dateline-adjacent points, surface/elevated coordinates, positive/negative/zero
intervals, fractional epochs and a 200-year Earth-sized diagnostic interval.
The declared numerical allowance is **1 micrometre in fixed XYZ metres** for
forward results, inverse results and inverse-forward closure.

The reference generator uses 80-digit standard-library Decimal arithmetic. A
bracketed normal-footpoint solve determines the ellipsoid normal from each exact
stored binary64 input; a coupled Newton solve determines independently perturbed
inverse targets. This differs from the production model's fixed-point inverse.
Each inverse reference retains its iteration count and a forward residual below
1e-40 metres. Generator and report hashes make the fixture reproducible. No
upstream implementation, observed model data or Python runtime dependency is added.

The authored fixed-space field uses geodetic unit-normal components `(nx, ny, nz)`:

```text
vx = 0.03 nx + 0.004 (1 + ny nz)
vy = 0.03 ny + 0.003 nx nz
vz = 0.03 nz + 0.002 nx ny
```

All velocities are metres/year. The test sampler expresses this field in ENU;
the independent oracle works directly in fixed XYZ. This is synthetic stress data,
not a real geodetic model or a claim of global inverse uniqueness.

Bulk tests additionally cover mixed source epochs, XYZ/XYZM/later ordinates,
Float32/64 views, exact preservation of M/epoch buffers/tails, output reuse and
application sampler exceptions. Float64 outputs are checked against the independent
references. Float32's rounded input is a different point: scalar/bulk comparisons
qualify rounding and ownership without claiming the Float64 accuracy allowance.

```sh
python3 modules/projection/scripts/generate-deformation-stress-reference.py --check
node modules/projection/scripts/qualify-deformation-stress.mjs --output /tmp/deformation.json
node modules/projection/scripts/qualify-deformation-stress.mjs --browser chromium --output /tmp/deformation-chromium.json
```

The report records maximum errors, every case, reference/engine source hashes,
provenance, numerical allowances and environment. CI qualifies the authored corpus
in Node, Chromium, Firefox and WebKit and retains the reports as artifacts.

## Application-owned models and references

Run the development script against a **local** module exporting synchronous
`createModel(referenceCase)`, returning a prepared `DeformationModel`. The factory
can use `createDeformationModel` and a reviewed grid, or an application model with
the same forward/inverse contract. References and models remain outside math.gl's
package. The script is available from a repository checkout, not an npm subpath.

```sh
node modules/projection/scripts/qualify-deformation-stress.mjs \
  --model /absolute/path/reviewed-model.mjs \
  --reference /absolute/path/independent-reference.json \
  --output /tmp/reviewed-model-qualification.json
```

The JSON contract is:

```json
{
  "schemaVersion": 1,
  "distanceUnit": "m",
  "velocityUnit": "m/year",
  "epochRange": [2000, 2030],
  "forwardToleranceMeters": 0.000001,
  "inverseToleranceMeters": 0.000001,
  "provenance": {
    "authority": "Application-reviewed reference authority",
    "version": "Pinned reference version",
    "reference": "Independent reference method or citation",
    "license": "Reviewed model and reference data terms",
    "modelRevision": "Pinned model revision"
  },
  "cases": [{
    "id": "independently-prepared-case",
    "sourceEpoch": 2010,
    "targetEpoch": 2020,
    "input": [4000000, 1000000, 4800000],
    "forward": [4000000.1, 1000000.2, 4800000.3],
    "inverseInput": [4000001, 1000002, 4800003],
    "inverse": [4000000.9, 1000001.8, 4800002.7]
  }]
}
```

These coordinates illustrate the schema; replace them with independently computed
results for the reviewed model. Both allowance fields currently must match. The
harness rejects missing provenance, inconsistent units, epochs outside the declared
interval, non-finite coordinates and numerical mismatches. It records the local
factory entry's hash; imported factory dependencies remain application-owned and
must also be pinned. No network fetch is performed by the harness.

Passing sampled reference cases does not establish physical accuracy, reference
independence, licensing rights or coverage outside those cases. Review model/frame
identity, ellipsoid, grid registration, spatial and temporal bounds, nodata policy,
data terms and independent allowances before using a real model. The numerical
allowance is distinct from the dataset's claimed observational accuracy.

## Spatial nonlinearity and temporal limits

The built-in model allows a spatially variable ENU sampler and evaluates velocity
at the source position for the whole interval. Its inverse solves that exact forward
map. Applying two shorter intervals resamples at an intermediate position and can
produce a different result: it is not a trajectory integrator.

A static velocity does not execute time-varying rates or event offsets. For example,
a rate `0.01 + 0.002(t − 2010)` metres/year integrated from 2010 to 2020, plus a
0.1 metre event, yields 0.3 metres; a static 0.01 metre/year sampler yields 0.1.
An explicit epoch alone does not select or execute those components. The optional [temporal model](./temporal-models.md) now executes explicit rate,
acceleration, step and relaxation components. Authoritative real-model certification
remains application-owned; each model needs reviewed forward, inverse, temporal
and failure contracts.

## Pinned assets and reviewed operation metadata

The local reference JSON can additionally include an `operation` candidate using
the [operation catalogue](./operation-selection.md) contract, plus `assets`:

```json
{"assets": [{
  "kind": "model", "id": "app:reviewed-model", "revision": "v1",
  "path": "./reviewed-model.bin", "sha256": "<exact 64 lowercase hex digits>"
}]}
```

Kinds are `model`, `grid` and `module`. Paths resolve relative to the local reference
file. Every declared asset is read and checked against its exact SHA256; duplicate
kind/id/revision identities, missing files and mismatches fail. Model/grid entries
supply readiness identities; module entries pin additional factory dependencies.
An operation candidate requires the manifest, even when no data assets are needed.
The application must list every relevant imported factory dependency: the harness
does not discover dependency graphs or assert that a list is complete.

Each reference case then supplies `sourceCRS`, `targetCRS`, `area` and matching
`sourceMetadata`/`targetMetadata` when used by the candidate. The harness selects
the candidate against each case's complete original source/target epoch interval
and required exact assets before executing numerical comparisons. Gaps, different
frame epochs, missing model revisions and invalid terms are rejected. Case areas
are supplied reviewed extents, not inferred from geocentric XYZ. The report retains
asset identities/content hashes and reviewed operation metadata along with the
existing factory/reference/source hashes and numerical errors.

This strengthens reproducibility and contract checks for **application-owned**
real-model qualification. It does not bundle an authoritative dataset, certify
physical model accuracy or verify legal permission. Keep the sample locations,
CRS/frame/height meaning and observational accuracy independently reviewed.
