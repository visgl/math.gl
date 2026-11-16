# Terrain cutouts and paired skirts

A cutout splits an indexed terrain surface into a removable patch and the
surrounding terrain. Both pieces follow the source relief. Along the cut, the
patch gets an outward-facing wall and the remainder gets a wall facing into
the opening. A lifted neighborhood, watershed, or other map selection should
fit back into the same opening when its lift returns to zero.

## First implementation

1. Add a standalone terrain split function for a rectangle or one convex
   polygon in the mesh's local Cartesian XY frame. Accept upward-facing indexed
   XYZ terrain and optional work and output budgets. Reject invalid polygons
   and meshes with overlapping XY triangle interiors, nonmanifold edges,
   inconsistent winding, or T-junctions explicitly. Disconnected components
   and holes are allowed. Export the function from the
   terrain and geospatial entry points and verify selective imports.
2. Partition source triangles into inside and outside fragments in one
   operation. Compute cut intersections once and reuse their XY and interpolated
   Z on both sides. Retain source triangle and vertex interpolation provenance
   for draped attributes. Deduplicate shared intersections by source topology
   and cut features, without merging unrelated coincident components. Reuse
   vertex IDs along every shared interior fragment edge within each output,
   including triangulation diagonals. Reuse
   clipping predicates where practical. The existing positive clipper can extract
   a patch but does not produce the complement or shared vertex IDs. Use
   Float64 for clipping and output positions, including for Float32 input.
   Compute both sides from the exact stored input coordinates. Retriangulate
   fragments when possible to avoid thin triangles. Reject the entire split
   if a retained fragment still fails the same relative XY degeneracy test
   used by `TerrainSurface`. Remove redundant collinear boundary vertices
   only when both incident fragments can remove them consistently. A
   zero-area touch emits no face. Never silently drop a positive-area sliver,
   which could leave a crack. Validate any later Float32 conversion separately.
3. Return detached patch and remainder meshes and paired, directed cut edges
   with vertex IDs in each mesh. An edge is a paired cut only when both sides have
   terrain coverage. Preserve tile edges and nodata boundaries and join cut
   chains only where the input topology supports it. Allow empty and disconnected
   results. Use deterministic ownership when the polygon runs along a source edge.
4. Compose the split with `createTerrainSkirt` on each piece, supplying only
   that piece's cut edges. Skip empty pieces and pieces with no paired cut
   edges. Translate the patch before building its skirt; keep
   the remainder in place. Each wall follows its owning mesh's opposite boundary
   winding. Use separate positive `height` values for the two sides, or use
   the same proposed `baseZ` option on each side. Specify exactly one of
   `height` or `baseZ` per skirt. A finite local `baseZ` uses
   per-vertex vertical distances and must lie strictly below every selected
   top vertex. Keep walls identifiable as visual geometry so height sampling and
   physical contacts can use the underlying surface independently. Map each skirt vertex through
   `sourceVertexIndices` to its parent split vertex, then use that vertex’s
   source triangle and interpolation weights to recover draped attributes.
5. Add a terrain example with a rectangle and an oblique polygon, a lift
   slider, and visibility toggles for each skirt. Include an edge diagnostic
   so a user can inspect the seam at zero lift and both faces under backface
   culling. Leave map rendering and extrusion styling to the consumer.

## Acceptance tests

- Split an analytical inclined plane across source triangle interiors, vertices,
  and shared edges. The pieces conserve projected area and have disjoint
  interiors. Compare summed areas with relative error at most `1e-10`
  on the analytical fixtures, using the source area as the denominator. Every paired endpoint has the same pre-lift XYZ.
- Check cuts that miss, enclose, or touch the mesh; cross an existing nodata
  hole; or produce disconnected patches. Run miss and enclose through split and
  skirt composition. Touch-only intersections emit no wall.
  Existing boundaries without terrain on both sides remain unskirted.
- Check patch and remainder wall orientation with outward-facing normals, distinct
  depths, and a common base after a nonzero lift. Reject nonfinite `baseZ`,
  a base at or above a selected top vertex, and simultaneous `height` and
  `baseZ`. At zero lift the top surfaces
  reconstruct the original terrain. If both walls are coincident at zero lift,
  the example hides them to avoid rendering overlap.
- Exercise near-vertex and nearly collinear cuts with Float32 and Float64
  inputs. Verify valid shared-edge adjacency or an explicit sliver rejection,
  including a cut whose positive-area fragment would collapse in Float32.
- Check preserved winding and interpolation provenance, degenerate inputs,
  large coordinates in a local frame, index promotion, and explicit budget
  failures. Run terrain and geometry tests, example checks, and published-package
  tree-shaking probes.

## Follow-up

Support concave polygons, holes, and multiple segment IDs using a general planar
partition with shared boundaries. Internal edges introduced during polygon
decomposition must never become skirts. Add tile-cut reconciliation so cuts
stitch across independently clipped and mixed-resolution tiles. Geographic cuts
need an explicit projected or local frame and topology preparation at periodic
seams before they reach the planar splitter.
