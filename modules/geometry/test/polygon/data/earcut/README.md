# Earcut fixtures

The upstream fixtures and `expected.ts` track
[mapbox/earcut commit 934e54d](https://github.com/mapbox/earcut/tree/934e54d8bed85387330b7acaa5d2f5ba30a460a3)
under its ISC license. `vector-tile-touching-holes.json` is the additional math.gl
regression from #594. Upstream PR #222 is not included.

The suite checks upstream triangle counts and area tolerances, quarter-turn
rotations, and identical output with precomputed areas and typed coordinates in
all three supported projection planes. The nonzero tolerances on invalid or
degenerate upstream fixtures are retained explicitly; they are not a guarantee
that such inputs triangulate correctly.

Run the fixture suite in Node and Chromium:

```sh
yarn vitest run --project node modules/geometry/test/polygon/earcut.spec.ts
yarn vitest run --project headless modules/geometry/test/polygon/earcut.spec.ts
```

The standalone benchmark verifies exact upstream output on every fixture and on
119,680 MVT polygons in fast mode, including precomputed-area output. It checks
zero MVT area deviation and precomputed/projected output parity for balanced mode. It also verifies projected
MVT output, then reports timings for both strategies on MVT inputs, precomputed areas, projected
inputs, stars, and a large convex polygon. The MVT corpus stays in the upstream
checkout rather than duplicating its binary in math.gl.

```sh
git clone https://github.com/mapbox/earcut.git /tmp/earcut-reference
git -C /tmp/earcut-reference checkout 934e54d8bed85387330b7acaa5d2f5ba30a460a3
node test/bench/earcut.mjs /tmp/earcut-reference 3ac1d17fdbb2c29b0df576e175d79272a2975e55
```

Run from the math.gl repository root after `yarn install`. The benchmark bundles
both math.gl revisions from source with the same build settings and alternates
implementations after warmup. Timing results are descriptive, not assertions.
The third argument is the baseline Git revision; it defaults to `origin/master`.
