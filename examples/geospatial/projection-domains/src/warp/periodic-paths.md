# Reference-aware periodic paths

`unwrapPeriodicPath` is a qualified example-owned step before periodic clipping. Its transform
contract is projection-engine agnostic: synchronous native or external operations may supply XY.
The algorithm acts on transform output, not on input longitude or a global `+over` flag. Midpoints
and endpoints select copies relative to local references, with recursive source-edge sampling,
chord-error checks and explicit depth/sample budgets. Returned source points preserve provenance.

```js
const path = unwrapPeriodicPath(sourceEdge, {
  transform: point => converter.forward(point),
  period: worldWidth, axis: 0,
  maxSourceStep: qualifiedSourceStep,
  tolerance: targetTolerance
});
```

The caller must choose a source sampling scale that resolves the transform. Finite samples cannot
rule out arbitrary oscillations. Tests cover rotated Fiji, UTM 60, shifted-meridian Mercator and a
full-period edge whose normalized endpoints coincide. Nonzero winding is reported for closed source
loops: do not close the lifted target path or weld its endpoints automatically. Pole-containing
polygons still require chart decomposition, seam vertex duplication and topology-aware triangulation;
this path recipe does not claim to repair arbitrary meshes. Budget exhaustion or invalid samples
reject the whole request. Adjacent faces should share the same prepared edge and orientation.

See [feedback section 2](https://github.com/mdsumner/sidebyside/blob/main/article/2026-10-13_custom-projections-deckgl.md#2-domain-is-geometry-not-a-lonlat-box).
