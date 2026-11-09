# projectTextureCoordinates

Generate texture coordinates for packed CPU positions using an already prepared synchronous source-to-image transform. Import from `@math.gl/geometry`; no projection engine, Arrow runtime or renderer is loaded by this helper.

```
import {projectTextureCoordinates} from '@math.gl/geometry';



const texCoords = projectTextureCoordinates(positions, {

  size: 3,

  transform: position => projection.projectSync(position),

  bounds: [left, bottom, right, top],

  origin: 'top-left'

});
```

Prepare `projection` separately. Its output coordinates and `bounds` must use the same CRS, axis order and units. The helper also works with identity, affine or application-defined transforms.

#### Parameters[​](#parameters "Direct link to Parameters")

| Parameter           | Meaning                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| `positions`         | Packed finite XY or XYZ numbers, including typed-array subviews                                         |
| `options.size`      | Components per source vertex: 2 or 3; default 3                                                         |
| `options.transform` | Synchronous callback receiving a fresh source array and returning at least two finite image coordinates |
| `options.bounds`    | Finite image rectangle `[left, bottom, right, top]`, with positive finite width and height              |
| `options.origin`    | `'top-left'` (default) or `'bottom-left'`                                                               |

#### Returns[​](#returns "Direct link to Returns")

A detached `Float64Array` containing two coordinates per source vertex in the original order. For top-left textures, `u = (x - left) / width` and `v = (top - y) / height`. Bottom-left textures use `v = (y - bottom) / height`. Values outside the image remain outside `[0, 1]`; choose wrapping/clamping in the renderer. Empty input returns an empty array without calling the transform. The input is not changed and no index stream is generated or rewritten.

#### Errors and limits[​](#errors-and-limits "Direct link to Errors and limits")

Invalid layouts, image rectangles, nonfinite source coordinates, null/nonfinite transformed XY, and nonrepresentable UVs throw `RangeError`. Callback exceptions propagate. Failed vertices are never dropped from a mesh. Output is published only when every vertex succeeds.

This is UV generation, not mesh reprojection or UV unwrapping. Resolve projection cuts and domain boundaries explicitly; refine a mesh before generating UVs when needed, or carry existing UVs through refinement with `interpolatePackedAttributes`. Forward geometric error and inverse UV error are different quantities. See [Projecting Raster Meshes](https://visgl.github.io/math.gl/next/docs/modules/geospatial/crs/developer-guide/raster-mesh-preparation.md) for refinement, clipping and provenance policies. Asynchronous engines must be prepared before calling this function or sampled through an application-managed asynchronous pipeline.
