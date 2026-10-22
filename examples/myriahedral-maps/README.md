# Myriahedral maps

An independent experimental globe-to-net example with 288–4,608 graticule panels,
resolution and unfolding controls, meridian/continent cut comparison,
Natural Earth land/ocean colors, optional NASA textures, dark back faces, coordinate picking, and overlap diagnostics.

Run from the repository root:

```sh
node node_modules/vite/bin/vite.js examples/myriahedral-maps --config examples/myriahedral-maps/vite.config.ts
node node_modules/vite/bin/vite.js build examples/myriahedral-maps --config examples/myriahedral-maps/vite.config.ts
```

Shared geometry, cutting, picking and WebGL code live in `../unfolding-polyhedron`.
No code or imagery from Nico Belmonte's demonstration is used. This is a rigid
polyhedral unfolding, not an implementation of a specific published cartographic
projection or an overlap optimizer. Switching strategies keeps the same seed and mesh.

NASA Blue Marble is loaded online; a colored surface remains available if imagery
fails. See [imagery terms](../unfolding-polyhedron/IMAGERY.md) and the bundled
[Natural Earth land-mask provenance](../unfolding-polyhedron/data/README.md).


The default replaces the earlier randomly branching icosahedral net. An open
equatorial backbone keeps the Americas west of Africa and Eurasia east of it;
land preference and directional ties create coherent ocean strips. The camera
fits sampled poses once, so unfolding does not continually recenter the view.

Visual target: the graticule Sealine view in
[Nico Belmonte's demonstration](https://philogb.github.io/page/myriahedral/), inspected
October 22, 2026 at closed, intermediate and flat poses. No source code or static
assets from that demo are used. This does not reproduce its exact cuts or all modes.
