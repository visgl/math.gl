# @math.gl/earth

Earth models, sunlight, astronomy, and timezones, available as named exports from the package root.

## Usage[​](#usage "Direct link to Usage")

```
import {Geoid, getSunPosition, getMoonPosition} from '@math.gl/earth';
```

## Features[​](#features "Direct link to Features")

| Feature                    | Support | Notes                                                                      |
| -------------------------- | ------- | -------------------------------------------------------------------------- |
| Geoid models               | ✅      | Parse grids and compute height offsets; load optional datasets explicitly. |
| Sun, Moon, and sky         | ✅      | Observer-based positions, illumination, and lighting calculations.         |
| Timezone calculations      | ✅      | Geographic lookup and local calendar operations.                           |
| Automatic dataset fetching | ❌      | Applications control data loading and ownership.                           |

## API[​](#api "Direct link to API")

| Topic                                                                                        | Root exports                                                              |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [Geoid](https://visgl.github.io/math.gl/next/docs/modules/earth/geoid.md)       | `Geoid`, `parsePGM`, `createGeoidFromGrid`                                |
| [Sun](https://visgl.github.io/math.gl/next/docs/modules/earth/sun.md)           | Solar and lunar positions, daylight, sky lighting, and observer utilities |
| [Timezone](https://visgl.github.io/math.gl/next/docs/modules/earth/timezone.md) | Geographic timezone lookup and local calendar calculations                |

The root also exports `geoid`, `sun`, and `timezone` namespaces. The `/sun` and `/timezone` entry points provide focused imports. Star-catalog data is available separately from [`@math.gl/earth/sun/stars`](https://visgl.github.io/math.gl/next/docs/modules/earth/sun/api-reference/stars.md).

Load optional geoid grids and timezone geometry explicitly; importing the root does not automatically fetch these datasets.
