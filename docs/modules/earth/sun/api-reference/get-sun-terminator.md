{/* SPDX-License-Identifier: MIT */}
{/* SPDX-FileCopyrightText: Copyright (c) vis.gl contributors */}

# getSunTerminator

Returns the geometric solar-altitude outline and the direction toward the Sun.
Use it to draw sunset or twilight boundaries and to mask night imagery on a map or globe.

```ts
import { getSunTerminator } from "@math.gl/earth/sun";
import type { SunTerminator, SunTerminatorOptions } from "@math.gl/earth/sun";

const boundary = getSunTerminator(new Date(), {
  altitude: -6,
  resolution: 360,
});
// boundary.geometry: GeoJSON MultiLineString in longitude/latitude degrees
// boundary.sunDirection: Earth-fixed unit vector toward the Sun
// boundary.altitude: -6 (degrees)
```

## Parameters

| Parameter            | Default  | Meaning                                                               |
| -------------------- | -------- | --------------------------------------------------------------------- |
| `timestamp`          | Required | Unix milliseconds or a valid JavaScript `Date`.                       |
| `options.altitude`   | `0`      | Solar altitude in degrees, between −18 and 0 inclusive.               |
| `options.resolution` | `360`    | Integer number of circle segments, at least 8, before seam splitting. |

Use 0° for the geometric day/night boundary, −6° for the end of civil twilight,
−12° for the end of nautical twilight, and −18° for astronomical darkness.
Invalid dates, nonfinite values, out-of-range altitudes and invalid resolutions throw `RangeError`.

## Result

`SunTerminator` contains `geometry`, `sunDirection` and `altitude`. The geometry
uses GeoJSON longitude/latitude ordering, with longitudes in [−180, 180]. Paths
are split at the antimeridian and poles, inserting exact intersections. Split
endpoints refer to the same spherical point; a pole may have different limiting
longitudes on each adjoining path. The segment count can increase during splitting.
This is an outline, not a filled night polygon.

`sunDirection` uses Earth-fixed axes: +X at longitude 0°, latitude 0°; +Y at
90°E on the equator; +Z at the north pole. It points **toward** the Sun, unlike
`getSunDirection`'s local light-propagation vector. It is also distinct from
deck.gl's globe axes. For longitude λ and latitude φ in radians, compute:

```ts
const normal = [
  Math.cos(phi) * Math.cos(lambda),
  Math.cos(phi) * Math.sin(lambda),
  Math.sin(phi),
];
const dot = normal.reduce(
  (sum, value, i) => sum + value * boundary.sunDirection[i],
  0,
);
const isDark = dot < Math.sin((boundary.altitude * Math.PI) / 180);
```

Boundary points satisfy equality. At 0° the boundary is a great circle; negative
thresholds describe smaller circles enclosing the dark region. Geometry covers
the entire sphere; clip it to the supported latitude range when displaying a
Web Mercator map.

## Accuracy and rendering

This uses the same lightweight solar model as `getSunPosition`, on a spherical
Earth without atmospheric refraction, terrain obstruction, solar disk radius or
observer elevation. The 0° boundary is therefore not an observed sunrise/sunset
prediction. Resolution controls sampling, not astronomical accuracy. Interpolated
segments approximate the analytical circle; inserted seam points lie on it.

The [solar terminator example](/examples/sun-terminator) shares the direction and
threshold with an example-local deck.gl bitmap shader. It blends paired NASA GIBS
day/night images with an adjustable fade entirely on the dark side (six degrees
by default). A bundled whole-world overview remains
visible while detail tiles load. The example uses feathering instead of drawing
the outline; the API geometry is available for applications that need a line.
The mask follows the surface-normal dot-product approach used in
[kepler.gl's atmosphere layer](https://github.com/keplergl/kepler.gl/blob/c28fc49b5415e5315b0bbc359923de583f9e37f0/src/deckgl-layers/src/globe/atmosphere-layer.ts),
without importing its atmospheric scattering implementation.
