# Myriahedral maps

An independent experimental globe-to-net example with 288–4,608 graticule panels,
resolution and unfolding controls, six graticule presets and all five Platonic solids,
Natural Earth land/ocean colors, optional NASA textures, dark back faces, coordinate picking, and overlap diagnostics.

## Read the source

Start with `layout.ts` for the `MapDescription` and `MapEngine` construction.
`app.ts` connects that layout builder and the land texture to the shared example
controller. `view.ts` contains only the controls' markup.

The shared files in `../unfolding-polyhedron` have separate responsibilities:

- `app.ts`: control events, playback, orbit gestures, and tooltip presentation.
- `scene.ts`: evaluates poses, fits the camera, and passes positions to the renderer.
- `renderer.ts`: WebGL resources, shaders, textures, and drawing. Imagery status
  is reported through a callback rather than written into the UI.
- `picking.ts`: maps a rendered panel hit back to geographic coordinates.

The scene takes a layout and plain view state; it does not query controls. There
is no second implementation of the myriahedral cutting or unfolding algorithms
in the UI.

Run from the repository root:

```sh
node node_modules/vite/bin/vite.js examples/myriahedral-maps --config examples/myriahedral-maps/vite.config.ts
node node_modules/vite/bin/vite.js build examples/myriahedral-maps --config examples/myriahedral-maps/vite.config.ts
```

Mesh generation, cutting, static projection, and animation use
`@math.gl/geospatial/discontinuous`. The controller, camera scene, picking, and
WebGL renderer are shared with `../unfolding-polyhedron`.
No code or imagery from Nico Belmonte's demonstration is used. This is a rigid
polyhedral unfolding, not an implementation of a specific published cartographic
projection or an overlap optimizer. Graticule presets share a mesh at a given resolution; solid presets use their own meshes.

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
