# @math.gl/earth

The earth group collects Earth model, solar, and timezone utilities. Specific utilities are available
from their subpaths.

## Feature support

Earth-model, observational-sky, and civil-time capabilities, including the limits of optional physical models.

Support describes the public API in the current repository. Notes identify limits and experimental features.

| Feature | math.gl support | Notes |
| --- | --- | --- |
| Geoid height grids and interpolation | ✅ Implemented | [Geoid APIs](./geoid/README.md) parse/query optional GeographicLib-style grid data. |
| Sun, Moon and planetary sky state | ✅ Implemented | [Sun/sky APIs](./sun/README.md) provide observer coordinates, lighting approximations and celestial appearance helpers. |
| Bright-star catalogs and rendering data | ✅ Implemented | Optional catalog data, proper-motion helpers and star-layer records keep data and rendering integration explicit. |
| Timezone lookup and civil-calendar arithmetic | ✅ Implemented | [Timezone APIs](./timezone/README.md) combine approximate geography with runtime timezone rules and explicit local-time disambiguation. |
| Explicit UT1/TT sky contexts | ✅ Implemented | Reusable sky contexts and snapshots accept explicit time-scale inputs within their documented ephemeris/model scope. |
| Globally calibrated visibility/lighting tiers | ◐ Partial | Shared sky models are implemented; observational calibration, star visibility integration and tier budgets remain in the [sun roadmap](https://github.com/visgl/math.gl/blob/master/dev-docs/sun-roadmap.md). |
| Gravity/magnetic spherical-harmonic models | ❌ Not implemented | No general coefficient-backed gravity or geomagnetic field engine; optional Earth models are [G11 scope/design work](https://github.com/visgl/math.gl/blob/master/dev-docs/geographiclib-roadmap.md). |
| Qualified ICRF/ITRF/TEME state transformations | ❌ Not implemented | Full versioned Earth-orientation/time providers and state-vector frame derivatives remain [celestial-frame roadmap work](https://github.com/visgl/math.gl/blob/master/dev-docs/geospatial-roadmap.md). |

## Usage

```ts
import {Geoid} from '@math.gl/earth';
import {getSunDirection} from '@math.gl/earth/sun';
import {lookupTimezoneAsync} from '@math.gl/earth/timezone';
```

The group root exports `geoid`, `sun`, and `timezone` namespaces. The existing
`@math.gl/earth`, `@math.gl/earth/sun`, and `@math.gl/earth/timezone` package imports remain available.
