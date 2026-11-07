# @math.gl/earth

Earth models, sunlight, astronomy, and timezones, available as named exports from the package root.

```
import {Geoid, getSunPosition, getMoonPosition} from '@math.gl/earth';
```

## API[​](#api "Direct link to API")

| Topic                                                                                        | Root exports                                                              |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [Geoid](https://visgl.github.io/math.gl/next/docs/modules/earth/geoid.md)       | `Geoid`, `parsePGM`, `createGeoidFromGrid`                                |
| [Sun](https://visgl.github.io/math.gl/next/docs/modules/earth/sun.md)           | Solar and lunar positions, daylight, sky lighting, and observer utilities |
| [Timezone](https://visgl.github.io/math.gl/next/docs/modules/earth/timezone.md) | Geographic timezone lookup and local calendar calculations                |

The root also exports `geoid`, `sun`, and `timezone` namespaces. The `/sun` and `/timezone` entry points provide focused imports. Star-catalog data is available separately from [`@math.gl/earth/sun/stars`](https://visgl.github.io/math.gl/next/docs/modules/earth/sun/api-reference/stars.md).

Load optional geoid grids and timezone geometry explicitly; importing the root does not automatically fetch these datasets.
