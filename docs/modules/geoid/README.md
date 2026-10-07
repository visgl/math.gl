# Overview

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.4-blue.svg?style=flat-square" alt="From v3.4" />
</p>

The `@math.gl/geoid` module evaluates geoid heights from Earth gravity model grids.

import GeoidGlobe from '@site/src/components/geoid-globe';

## Geoid globe

<GeoidGlobe inline />

[Open the live example](/examples/geoid-globe) to rotate the globe, inspect signed
heights, and compare grid resolutions and interpolation methods.

## Geoid height

The geoid approximates an equipotential surface near mean sea level. Its height
**N** relative to the WGS84 ellipsoid varies around the globe. It is not terrain
elevation. Ellipsoidal height **h** and orthometric height **H** satisfy **h = H + N**.
`geoid.getHeight(latitude, longitude)` returns N in meters.

## Optional EGM96 data

| Package export                       | Grid                     | Size    |
| ------------------------------------ | ------------------------ | ------- |
| `@math.gl/geoid/geoid-egm96-low.pgm` | 1° preview, 360 × 181    | 130 KB  |
| `@math.gl/geoid/geoid-egm96-hi.pgm`  | 15′ original, 1440 × 721 | 2.08 MB |

Data remain separate from the JavaScript entry point. The low grid is downsampled
for visualization; use the high grid for height conversion. The original grid's
interpolation error estimates do not apply to the preview.

With a bundler supporting asset URL imports (such as Vite):

```js
import { parsePGM } from "@math.gl/geoid";
import gridUrl from "@math.gl/geoid/geoid-egm96-hi.pgm?url";

const response = await fetch(gridUrl);
if (!response.ok) throw new Error(`Grid request failed: ${response.status}`);
const geoid = parsePGM(new Uint8Array(await response.arrayBuffer()), {
  cubic: true,
});
const N = geoid.getHeight(51.5, 0); // latitude, longitude; meters
```

In Node.js, resolve the asset with
`import.meta.resolve('@math.gl/geoid/geoid-egm96-hi.pgm')` and read it using
`readFile` from `node:fs/promises`. Other GeographicLib PGM grids can also be passed
to `parsePGM`.

## Attribution

NGA EGM96 model data are public domain. The grids come from
[GeographicLib](https://geographiclib.sourceforge.io/C++/doc/geoid.html); the package
includes provenance, generation instructions, and checksum metadata in `data/`.

The JavaScript implementation is a port of selected GeographicLib 1.50.1 code,
copyright Charles Karney, under the MIT license.
