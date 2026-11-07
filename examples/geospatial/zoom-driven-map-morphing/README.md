# Zoom Driven Map Morphing

A deck.gl prototype for exploring a globe-to-Web-Mercator transition driven by zoom. Run `yarn workspace math.gl-zoom-driven-map-morphing start` from the repository root.

To run against workspace source, use `yarn workspace math.gl-zoom-driven-map-morphing start-local`. The application, projection adapter, styles, and imagery live in `src/`.

Scroll to zoom and drag to change the center. The sliders configure the midpoint and width of the transition. Hover the gold city markers to exercise deck.gl color picking while the shape changes. The globe and the flat map share a center-relative east/north/up coordinate frame, and zoom determines the smooth blend without a timer. The example uses independently derived math, not Mapbox implementation code.

The example is an early integration prototype. It uses a fixed geographic mesh rebuilt on camera changes, a single NASA Blue Marble overview, and center-anchored zoom. Its drag is approximate, polar caps are clipped, and marker occlusion is approximate. It does not yet provide geographic picking, pointer-anchored zoom, adaptive tessellation, high-resolution tiles, or a reusable deck.gl viewport. The example uses the public [geocentric and Mercator projection plugins](https://github.com/visgl/math.gl/tree/master/modules/geospatial/src/projection) with a local adapter that centers, scales, and blends their output.

The overview JPEG is hosted in [deck.gl-data](https://github.com/visgl/deck.gl-data/tree/master/earth/nasa-blue-marble).

Imagery: [NASA Blue Marble](https://science.nasa.gov/earth/earth-observatory/blue-marble/).
