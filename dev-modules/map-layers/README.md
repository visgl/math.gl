# @deck.gl/map-layers (private)

Private staging workspace for reusable deck.gl rendering adapters used by math.gl
examples. It is not published and has no stable public API. Candidate APIs can be
upstreamed to deck.gl after their contracts are exercised by examples.

`MeshBitmapLayer` extends deck.gl's `BitmapLayer` with an optional `mesh` prop:
indexed positions, texture coordinates and draw vertex count in BitmapLayer's
native mesh format. It retains BitmapLayer's image, bounds, coordinate-system,
picking and texture-conversion behavior. Supply positions in the selected deck.gl
coordinate system and UVs appropriate to that conversion mode. Omit the mesh
to use BitmapLayer’s ordinary bounds-based geometry.

Replace the mesh object when geometry changes. The layer refreshes attributes and
draw count even when bounds retain the same identity. Mutating arrays in place is
not detected. Callers own CPU arrays; deck.gl owns GPU resource lifetime.

```ts
import {MeshBitmapLayer} from '@deck.gl/map-layers';
const layer = new MeshBitmapLayer({id: 'surface', mesh, image, bounds});
```

Consumers include zoom-driven-map-morphing and the solar terminator. The latter
adds day/night shaders and chart-specific clipping in its own layers.
Projection calculations and mesh generation stay in math.gl or the application;
this package owns deck.gl adaptation. Solar masks, geological effects and camera
policy remain example-specific. Add further abstractions after identifying a
compatible consumer rather than creating a universal layer in advance.

Run `yarn workspace @deck.gl/map-layers check`; the consumer's build runs this check
in CI. Package exports point to TypeScript source for the workspace/Vite pipeline.
