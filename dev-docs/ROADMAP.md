# Roadmap

## 3D Primitives

- Add a submodule with the geometry primitives from luma.gl.

### Geometry Processing

- Provide a library for CPU side geometry processing, for calculating normals, ray casting etc.
- There is initial code in `@loaders.gl/math` that should be cleaned up and moved to math.gl.

### Improved Columnar Table Support

- Geometries are essentially columnar tables, emphasize this further to simplify integration with columnar table systems, primarily ArrowJS.

### GPU Powered Math?

- TBA

## Interoperability and Framework Independence

- An ambition is that math.gl should be able to serve a general purpose 3D math library, enabling the creation of framework-independent 3D and Geospatial code that interoperates with a variety of frameworks.
- math.gl modules (such as geospatial math) should be usable by applications using other frameworks, without having to use the core math.gl classes.

## Ellipsoid convergence

The [ellipsoid convergence plan](./ellipsoid-convergence.md) starts with shared
geometry adapters and cross-module qualification. The numerical follow-up improves
near-pole latitude, bounds surface inversion and qualifies allocation costs. Qualified sphere/oblate conversions now share an optional numeric leaf after
expanded boundary, ownership, allocation, setup and selective bundle qualification.
Sphere/oblate local frames now share an original optional numeric basis, preserving
Cartesian-gradient versus geodetic normals, pole conventions and reused outputs.
Three-radius/interior geometry retains separate contracts.

The [GeographicLib SOTA tranche list](./geographiclib-roadmap.md) prioritizes
remaining correctness/domain gaps (P0), core geometry capabilities (P1), and
extended domains and optional models (P2).

## Geospatial frames and paths

The [tranched geospatial roadmap](./geospatial-roadmap.md) records the existing
master baseline, C1–C3 merged in [PR #277](https://github.com/visgl/math.gl/pull/277),
and the remaining path subdivision, seams, rhumb, precision and celestial-frame work.
PR implementation, merge/release status and numerical qualification are tracked
separately. The next integration tranche reuses the existing geodesic solver.

## Sun and sky

The [six-tranche sun and sky roadmap](./sun-roadmap.md) tracks shared
coordinates, visibility, atmosphere, celestial appearance, stars, and accuracy/performance
tiers. The sky and bright-star APIs are delivered; observational calibration, shared
star visibility and formal tier budgets remain follow-ups.

## Projection engine

The [projection roadmap](./projection-roadmap.md) tracks numerical, bulk-operation and
performance work. Historical measurements remain in the
[performance development history](./projection-performance-history.md).
