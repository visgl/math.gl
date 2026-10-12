# RingGeometry

<!-- -->

Loading <!-- -->RingGeometry<!-- -->…

⛶⛶ Explore fullscreen

A solid annulus centered at the origin, with height along Y. Partial sweeps form ring segments closed by planar end faces. Inner and outer walls use smooth radial normals; the top, bottom and segment ends have separate flat normals.

```
import {RingGeometry} from '@math.gl/geometry';



const segment = new RingGeometry({

  innerRadius: 0.45, outerRadius: 0.9, height: 0.35,

  startAngle: Math.PI / 4, sweepAngle: Math.PI * 1.5

});
```

| Property      | Default | Meaning                                                |
| ------------- | ------- | ------------------------------------------------------ |
| `innerRadius` | `0.5`   | Positive inner radius, smaller than the outer radius.  |
| `outerRadius` | `1`     | Positive outer radius.                                 |
| `height`      | `0.1`   | Positive total height centered on Y=0.                 |
| `segments`    | `48`    | Integer subdivisions across the sweep, at least three. |
| `startAngle`  | `0`     | Finite start angle in radians.                         |
| `sweepAngle`  | `2π`    | Positive sweep in radians, at most 2π.                 |

Angles begin on +X and rotate toward −Z. Full annuli have no radial end faces. Generated meshes use indexed `triangle-list` topology and Float32 `POSITION`, `NORMAL` and `TEXCOORD_0` attributes. `id` and additional attribute overrides are supported. These are CPU buffers for any renderer; no GPU resources are created.
