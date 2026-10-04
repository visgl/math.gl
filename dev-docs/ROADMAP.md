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
Three-radius/interior geometry and future local-frame convergence retain separate contracts.

## Sun and sky

The [six-tranche sun and sky roadmap](../docs/modules/sun/roadmap.md) tracks shared
coordinates, visibility, atmosphere, celestial appearance, stars, and accuracy/performance
tiers. The sky and bright-star APIs are delivered; observational calibration, shared
star visibility and formal tier budgets remain follow-ups.
