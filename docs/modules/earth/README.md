# @math.gl/earth

Earth models, sunlight, astronomy, and timezones, available as named exports from the package root.

```typescript
import {Geoid, getSunPosition, getMoonPosition} from '@math.gl/earth';
```

## API

| Topic | Root exports |
| --- | --- |
| [Geoid](./geoid/README.md) | `Geoid`, `parsePGM`, `createGeoidFromGrid` |
| [Sun](./sun/README.md) | Solar and lunar positions, daylight, sky lighting, and observer utilities |
| [Timezone](./timezone/README.md) | Geographic timezone lookup and local calendar calculations |

The root also exports `geoid`, `sun`, and `timezone` namespaces. The `/sun` and `/timezone` entry points provide focused imports. Star-catalog data is available separately from [`@math.gl/earth/sun/stars`](./sun/api-reference/stars.md).

Load optional geoid grids and timezone geometry explicitly; importing the root does not automatically fetch these datasets.
