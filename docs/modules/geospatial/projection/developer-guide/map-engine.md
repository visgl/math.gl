# Rendering maps with MapEngine

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

`MapEngine` gives a renderer one geometry interface for ordinary maps, interrupted
world maps, regional insets, and unfolding polyhedra. A `MapDescription` stores the
map choice and its parameters; the engine constructs its charts, splits geometry
at boundaries, fits the layout, and returns inverse candidates for picking.
The renderer supplies drawing, cameras, data loading, and animation timing.

Use this API for **maps with geographic coverage and layout**. Use
[`ProjectionEngine`](./projection-engine.md) for CRS coordinate transformations.
`MapEngine` takes spherical longitude/latitude in degrees, not an arbitrary CRS,
and does not convert datums or model ellipsoidal Earth geometry.

## Start with a description

```typescript
import {MapEngine, type MapDescription} from '@math.gl/geospatial/discontinuous';

const description: MapDescription = {
  version: 1,
  id: 'usa',
  title: 'United States and territories',
  definition: {type: 'albers-usa', includeTerritories: true}
};
const map = new MapEngine(description);
const viewport = map.fit({width: 960, height: 600, padding: 24});

const honolulu = map.projectPoint([-157.86, 21.31]);
if (honolulu) {
  const pixel = viewport.project(honolulu.position);
  const candidates = map.pick(viewport, pixel);
  // candidates[0] is the topmost chart candidate, with longitude/latitude.
}
```

Descriptions contain plain data and can be stored as JSON. The engine snapshots
them at construction; construct another engine to change the map. Keep an engine
while the user pans or resizes. `fit()` reuses its cached static layout and
preserves relative inset sizes and spacing.

The same code can use these definitions:

| Map | `definition` | What the renderer receives |
| --- | --- | --- |
| Mercator | `{type: 'mercator'}` | Finite latitude coverage, an antimeridian cut, continuous internal chart joins |
| Goode homolosine | `{type: 'goode'}` | Land-oriented northern and southern lobes, split lines and polygons |
| Albers USA | `{type: 'albers-usa', includeTerritories: true}` | A main region and seven independently scaled insets |
| Myriahedral | `{type: 'myriahedral', preset: 'polyconic', columns: 24}` | Static panel charts plus rigid hinge motion |

The existing `interrupted-homolosine` definition retains the earlier independent
six-lobe layout. `goode` selects the land-oriented arrangement with two northern
and four southern lobes. One wide lobe is represented by two continuously joined
computational charts; chart count is not necessarily visual lobe count.

## Render the returned pieces

```typescript
const parts = map.projectPolygon([
  [[-120, 30], [-90, 30], [-90, 45], [-120, 45]]
]);
const screenPolygons = parts.map(part => ({
  regionId: part.regionId,
  rings: part.coordinates.map(ring => ring.map(viewport.project)),
  sourceRings: part.sourceCoordinates
}));
```

Draw or triangulate each returned polygon separately, preserving its holes.
Never concatenate pieces across cuts. Lines follow the same rule. Every output
vertex has a corresponding geographic `sourceCoordinates` entry for texturing,
sampling data, or moving the geometry onto a sphere.

Inputs use minor great-circle edges. Densify source parallels or other intended
curves before projection. Polygon inputs must fit inside an open hemisphere;
partition global polygons before calling the engine. The engine does not
triangulate arbitrary polygons or ingest whole GeoJSON collections.

## Insets, picking, and raster resolution

Draw regions in `viewport.regions` order (back to front), using their `label`,
`kind`, `bounds`, optional `frame`, and `outlines`. Frames are presentation hints,
not clipping rectangles or a requirement to draw boxes. `map.pick(viewport, pixel)`
returns candidates in the reverse order. Empty space returns an empty array;
overlapping panels can return more than one candidate. Apply renderer visibility
and occlusion rules before accepting a hit.

Zoom the fitted map as one layout. If zoom is a separate camera or SVG transform,
undo it before calling `pick`, and multiply pixel-scale estimates by that zoom.
Do not fit each inset independently: that would lose the map's intended spacing
and relative scales.

```typescript
const samplingRegions = map.getSamplingRegions(viewport);
for (const region of samplingRegions) {
  // Each chart has its own source boundary and fitted pixel bounds.
  const chart = map.regions.find(chart => chart.id === region.id)!;
  const pixelsPerRadian = region.getPixelScale(chart.interior);
  // Select source tiles per chart, using multiple scale samples where necessary.
}
```

The scale pair measures longitude and latitude coordinate radians, not ground
distance or Web Mercator zoom. A tile provider must convert these to its own tile
matrix, account for projection distortion, and sample more than the center of a
large chart. Mercator also has a latitude limit in its definition; its spherical
computational boundaries include the excluded polar caps. Use `projectPoint` to
test visible coverage. These descriptors do not fetch tiles, infer a tileset, or
increase the resolution of source data. Magnifying low-resolution terrain cannot
reveal Hawaii if the source data never resolved it.

## Use the same geometry on a globe or hinged surface

```typescript
const panels = new MapEngine({
  version: 1,
  id: 'polyconic',
  definition: {type: 'myriahedral', preset: 'polyconic', columns: 24}
});
const frame = panels.evaluate({type: 'hinge', amount: 0.5});
const point = frame.projectPoint([10, 30]); // {regionId, position: [x, y, z]}

// Reuse clipped/tessellated static geometry throughout the animation:
const staticPoint = panels.projectPoint([10, 30])!;
const animated = frame.projectPlacedPoint(staticPoint.position, staticPoint.regionId);
```

Evaluate once per animation frame and reuse the result for all vertices. The map
frame returns `[x, y, 0]`; the globe frame returns a sphere with +X at 0° longitude,
+Y at 90° east, and +Z at the north pole. Both scale with `description.radius`.
Globe geometry retains the map's coverage and chart splits; it does not restore
geography omitted from an Albers composite.

Hinge amount 0 is the **closed faceted surface**, not a smooth sphere. Amount 1
matches the flat map. Hinge coordinates use the net's root-panel frame, which
differs from the canonical globe frame. Ice Age Explorer supplies camera
alignment and an initial sphere-to-facet deformation; the engine supplies the
rigid panel transform. These separate operations should not be confused with
interpolating two unrelated flat projections.

## Plan transitions before animating

```typescript
const route = map.planTransitionTo(panels);
// route.strategy === 'via-globe'
// route.resplit === true; route.coverage === 'fade-unmatched'
```

The initial planner is conservative: reusing the same engine is `direct`;
different engines use `via-globe`, even if their descriptions look similar.
The plan is a recommendation, not an animation executor. A renderer retains
source coordinates, returns to a common sphere, re-splits for the target charts,
then enters the target layout. Fade coverage that only exists at one endpoint.
Hinged endpoints additionally need sphere/facet alignment and deformation.
Avoid interpolating vertex arrays by index across independently cut meshes.

`hasCuts`, `disjoint`, `hasInsets`, and `hinged` are separate capabilities. A
cut globe net can remain connected, and an inset can overlap another region.
These flags help select rendering behavior; they do not prove that an arbitrary
interpolation is free of folds or overlaps.

## Supply geography and custom projections separately

Land masks and projection functions are runtime dependencies, not JSON:

```typescript
const oceanCuts = new MapEngine({
  version: 1,
  id: 'ocean-cuts',
  definition: {type: 'myriahedral', preset: 'sealine', columns: 24}
}, {
  isLand: ([longitude, latitude]) => landMaskContains(longitude, latitude)
});
```

Here `landMaskContains` is an application-provided geographic lookup. No land
dataset or network request is bundled in the engine. A custom description names
projection bindings in its charts; provide their forward/inverse functions in
the constructor's `projections` dictionary. Keep those callbacks stable for the
engine's lifetime. See the [reference](../api-reference/map-engine.md) for
the chart contract and all methods.

## Migrate existing examples

| Previous operation | Shared engine operation |
| --- | --- |
| Choose between several `create…Map()` factories | `new MapEngine(description, bindings)` |
| `getMapLayout(map)` | `map.getLayout()` (cached) |
| `fitMapLayout(layout, options)` | `map.fit(options)` |
| `pickMapLayout(map, fitted, pixel)` | `map.pick(fitted, pixel)` |
| Reconstruct flat-to-posed panel transforms | `map.evaluate({type: 'hinge', amount}).projectPlacedPoint(xy, id)` |
| Inspect a myriahedral map's `.layout` | `map.motion` |

Albers USA, the myriahedral demo, and Ice Age Explorer use this API. Their
renderers retain SVG/WebGL drawing, textures, camera motion, and field sampling.
The lower-level factories remain supported for callers that only need a static
map or the geometry layout itself.

## Choosing a named projection

<span class="badge">From v5.0 · Experimental</span>

Use `{type: 'projection', projection: 'robinson'}` or another name from
`MAP_PROJECTIONS` for the [projection families and presets](../../discontinuous/projection-catalog.md).
The same rendering code also handles regional visibility caps, interrupted
Sinu-Mollweide's oblique cuts, and quincuncial layouts. Use `getLayout()` / `fit()`
to measure visible coverage, and keep every returned region-local piece and its
source coordinates. Do not assume every catalog map covers the entire globe or
has a globally unique inverse.

## Prepare feature buffers for a renderer

<span class="badge">From v5.0 · Experimental</span>

`prepareFeatures()` provides a framework-independent boundary between geographic
preparation and rendering. It preserves original feature indices while splitting
geometry into chart-local parts. It also separates filled polygon rings from
original polygon outlines, so a renderer does not draw a false border along a cut.

```typescript
const features = [{
  id: 'region',
  properties: {color: [220, 140, 60]},
  geometry: {
    type: 'Polygon' as const,
    coordinates: [[[170, 10], [-170, 10], [-170, 30], [170, 30]]]
  }
}];
const prepared = map.prepareFeatures(features);

for (let i = 0; i < prepared.paths.parts.length; i++) {
  const part = prepared.paths.parts[i];
  const positions = prepared.paths.positions.subarray(
    2 * prepared.paths.pathStarts[i],
    2 * prepared.paths.pathStarts[i + 1]
  );
  const feature = features[part.featureIndex];
  // Draw this XY path with feature.properties.color.
  // Keep it separate from adjacent paths, even if they share a featureIndex.
}

const fills = prepared.polygons;
for (let i = 0; i < fills.parts.length; i++) {
  const rings = [];
  for (let r = fills.polygonStarts[i]; r < fills.polygonStarts[i + 1]; r++) {
    rings.push(fills.positions.subarray(2 * fills.ringStarts[r], 2 * fills.ringStarts[r + 1]));
  }
  // Triangulate and fill rings together, retaining holes. Do not stroke these
  // rings: the original boundary paths above carry the intended outlines.
}
```

Return `features[part.featureIndex]` when a generated part is picked. Use
`prepared.regionIds[part.regionIndex]` and the engine for chart-specific geographic
inversion. Points follow the engine's default ownership rule; lines/polygons can
produce several parts. Application IDs are optional and need not be unique.

Prepare when the data, map or sampling policy changes. Style-only updates can use
the original feature indices without repeating clipping. If preparation runs in
a worker, construct an engine from its description there and transfer the output
buffers back. Scheduling, cancellation, batching and caching belong to the caller;
`mapId` alone is not a sufficient cache key. XY buffers are map units, so a GPU
renderer must bind them in a compatible Cartesian view and preserve precision.

The [Elastic example](../../elastic-maps.md) uses this contract for its static
polygon, including outlines that stop at cuts. This is groundwork for a future
deck.gl geometry provider. A full integration still needs per-vertex attribute
provenance, path-cap and dash policies at chart joins, screen-space sampling,
interior surface meshes, and compatible animation topology. Existing transition
ring correspondence does not by itself provide a triangulated globe surface.
