# Zoom Driven Map Morphing

A deck.gl prototype for exploring a globe-to-Web-Mercator transition driven by zoom. Run `yarn workspace math.gl-zoom-driven-map-morphing start` from the repository root, or `npx vite examples/web-mercator/zoom-driven-map-morphing` when the workspace has not been bootstrapped.

Scroll to zoom and drag to change the center. The sliders configure the midpoint and width of the transition. Hover the gold city markers to exercise deck.gl color picking while the shape changes. The globe and the flat map share a center-relative east/north/up coordinate frame, and zoom determines the smooth blend without a timer. The example uses independently derived math, not Mapbox implementation code.

The example is an early integration prototype. It uses a fixed geographic mesh rebuilt on camera changes, a single NASA Blue Marble overview, and center-anchored zoom. Its drag is approximate, polar caps are clipped, texture seams may leave a narrow gap, and marker occlusion is approximate. It does not yet provide geographic picking, pointer-anchored zoom, adaptive tessellation, high-resolution tiles, or a reusable deck.gl viewport. The projection API remains experimental.

Imagery: [NASA Blue Marble](https://science.nasa.gov/earth/earth-observatory/blue-marble/).
