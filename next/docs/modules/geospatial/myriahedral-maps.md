# Myriahedral maps

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)![Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

<!-- -->

Unfold a globe into a geographically organized net: the Americas on the left, Africa in the center, Eurasia on the right, and ocean regions opening into strips. The default high-contrast land/ocean view makes the cuts easier to follow; NASA Blue Marble remains available under **Surface**.

Loading <!-- -->Myriahedral maps<!-- -->…

⛶

## Explore the cuts[​](#explore-the-cuts "Direct link to Explore the cuts")

Choose **Facets** for a 15°, 7.5°, 5°, or 3.75° graticule (288–4,608 panels). **Unfold** moves from a closed globe to a planar net; **Play** animates it. The camera stays fixed through the motion. **Flat view** faces the unfolded net; drag to orbit, or **Reset view** to restore the north-up view. Hover to inspect the original longitude and latitude on either side of a cut.

Compare **Continents · ocean cuts** with **Meridian strips** on the same mesh. **Alternate layout** changes the secondary join preference. **Show edges** reveals the graticule. Back faces are darkened to distinguish them during unfolding.

## How it works[​](#how-it-works "Direct link to How it works")

The mesh is generated from longitude and latitude, with shared vertices at the antimeridian and poles. Its cells are planar trapezoids, with triangular caps. An open equatorial chain of hinges establishes a west-to-east backbone; the remaining joins favor land and then north–south strips. The date-line seam stays open. A maximum spanning tree gives one connected net without hinge cycles.

Geography weights use independently sampled great-circle arcs against the bundled Natural Earth land polygons. The algorithm is a heuristic, not a global optimizer for overlaps or continent connectivity. The experimental [HingeTree](https://visgl.github.io/math.gl/next/docs/modules/geometry/api-reference/hinge-tree.md) composes exact rotations around shared edges. Panels stay rigid and joined throughout the motion; the animation is evaluated directly rather than interpolating stored vertex frames.

Land/ocean colors are rasterized locally from Natural Earth polygons. NASA texture coordinates likewise come from the original sphere, so geography stays attached as the panels unfold. The framing is calculated from sampled poses once per layout or orbit, preventing the map from recentering and changing scale at every frame.

## Limits and sources[​](#limits-and-sources "Direct link to Limits and sources")

The visual reference is the graticule **Sealine** view in [Nico Belmonte's demonstration](https://philogb.github.io/page/myriahedral/). Our graticule, tree, root, framing, land texture, and animation are independently generated. No mesh tables, imagery, presets, source code, or animation frames were copied from that demonstration. The layout follows the same broad arrangement, not its exact coastline cuts or every projection mode. It shares math.gl's [unfolding utilities](https://visgl.github.io/math.gl/next/docs/modules/geometry/unfolding-earth.md).

Land preference does not guarantee intact continents or an overlap-free net. The example reports positive-area face overlaps in the final net; it does not check collisions during motion. The coarse land mask and sampled edge weights can miss small islands or narrow coastlines. Finer grids cost more CPU and GPU time, especially when selecting a new tree.

This animated rigid-panel example is separate from the static [discontinuous projection API](https://visgl.github.io/math.gl/next/docs/modules/geospatial/discontinuous.md). It does not yet expose its unfolding as a static `DiscontinuousMap` preset.

The default Natural Earth land/ocean view works offline. Optional NASA Blue Marble is loaded online from GIBS with attribution; geometry and land masks remain usable if imagery is unavailable. See the [imagery terms](https://github.com/visgl/math.gl/blob/master/examples/unfolding-polyhedron/IMAGERY.md), [land-mask provenance](https://github.com/visgl/math.gl/blob/master/examples/unfolding-polyhedron/data/README.md), and [example source](https://github.com/visgl/math.gl/tree/master/examples/myriahedral-maps).
