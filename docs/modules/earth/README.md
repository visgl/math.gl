# @math.gl/earth

Earth models, sunlight, astronomy, time zones, and ocean calculations. Import each API from its feature subpath.

## Features

| Feature | Support | Notes |
| --- | --- | --- |
| Geoid models | ✅ | Parse grids and compute height offsets; load optional datasets explicitly. |
| Sun, Moon, and sky | ✅ | Observer-based positions, illumination, and lighting calculations. |
| Timezone calculations | ✅ | Geographic lookup and local calendar operations. |
| Seawater and underwater acoustics | ✅ | Optional `/ocean` entry point: TEOS-10 subset, classic sound-speed and absorption equations. |
| Automatic dataset fetching | ❌ | Applications control data loading and ownership. |

## Entry points

| Import | Description |
| --- | --- |
| [`@math.gl/earth/geoid`](./geoid/README.md) | Parse geoid grids and compute height offsets. |
| [`@math.gl/earth/sun`](./sun/README.md) | Solar and lunar positions, daylight, observer geometry, and sky lighting. |
| [`@math.gl/earth/sun-stars`](./sun-stars.md) | Star catalog and galactic calculations. |
| [`@math.gl/earth/timezone`](./timezone/README.md) | Geographic timezone lookup and local calendar calculations. |
| [`@math.gl/earth/ocean`](./ocean/README.md) | Seawater state, underwater sound speed, and absorption. |

Load optional geoid grids and timezone geometry explicitly when your application needs them.
