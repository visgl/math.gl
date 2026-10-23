# @math.gl/earth

The earth group collects Earth model, solar, and timezone utilities. Import the specific utility you
need from its subpath:

```ts
import {JulianDate} from '@math.gl/earth/celestial';
import {Geoid} from '@math.gl/earth/geoid';
import {getSunDirection} from '@math.gl/earth/sun';
import {lookupTimezoneAsync} from '@math.gl/earth/timezone';
```

The group root exports `celestial`, `geoid`, `sun`, and `timezone` namespaces. The existing
`@math.gl/earth/geoid`, `@math.gl/earth/sun`, and `@math.gl/earth/timezone` package imports remain available.

See [celestial](./celestial/README.md) for explicit time scales and rotation/state snapshots.
