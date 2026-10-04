# Culling playground

One interactive frustum-culling example using `CullingVolume.computeVisibility()` with
`BoundingSphere`, `AxisAlignedBoundingBox` and `OrientedBoundingBox`.
Move/resize the selected volume, rotate the oriented box, or change vertical FOV.
Green means inside, amber intersecting, and red outside. The optional hide toggle culls
outside objects from rendering. Counts include the selected volume and eight reference spheres.

The six inward-facing planes match the blue frustum outline: test camera at `[0, 0, 3]`,
looking down −Z, aspect 1.3, near 0.7 and far 6. The luma.gl orbit camera is a separate
observer so changing the view never changes classification.

Run `yarn start` or `yarn build`. The viewer reuses the geometry example's luma.gl renderer
with per-vertex colors and live mesh updates that preserve the orbit camera.
