# View and Projection Matrices

A view matrix expresses world coordinates relative to a camera. A projection matrix maps those camera coordinates to homogeneous clip coordinates. Compose them as `projection * view` to transform a world-space point.

## Create a view matrix

`lookAt()` takes the camera position, its target, and an up direction:

```js
import {Matrix4} from '@math.gl/core';

const view = new Matrix4().lookAt({
  eye: [0, 0, 5],
  center: [0, 0, 0],
  up: [0, 1, 0]
});
```

The camera looks along negative Z in view space. Choose distinct `eye` and `center` positions, and an up vector that is not parallel to the viewing direction.

## Choose a projection

| Method | Use it for |
| --- | --- |
| `perspective({fovy, aspect, near, far})` | Objects that appear smaller with distance |
| `ortho({left, right, bottom, top, near, far})` | A view box with constant apparent scale |
| `orthographic({fovy, aspect, focalDistance, near, far})` | An orthographic view matching a perspective view at a chosen distance |

`fovy` is the vertical field of view in radians; `aspect` is width divided by height. Use a positive near distance and a far distance beyond it for a conventional perspective camera.

```js
const projection = new Matrix4().perspective({
  fovy: Math.PI / 3,
  aspect: 800 / 600,
  near: 0.1,
  far: 1000
});
const viewProjection = projection.clone().multiplyRight(view);
const clip = viewProjection.transform([1, 2, 0, 1]);
const ndc = [clip[0] / clip[3], clip[1] / clip[3], clip[2] / clip[3]];
```

## Clip coordinates and depth

The core projection matrices use the OpenGL/WebGL depth convention: normalized device coordinates span -1 to 1 in X, Y, and Z. A renderer using a different depth range needs an appropriate conversion. On the CPU, divide XYZ by W only when W is nonzero; `Matrix4.transform()` preserves the homogeneous result.

Keep the near and far planes close to the visible range when possible to improve depth-buffer precision. Matrix storage is column-major; multiplication order and coordinate conventions matter independently of how a matrix is printed.

See [Matrix4](../api-reference/matrix4.md) for projection options and [WebMercatorViewport](../../web-mercator/api-reference/web-mercator-viewport.md) for a geographic map camera.
