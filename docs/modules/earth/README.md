# @math.gl/earth

The earth group collects Earth model, solar, and timezone utilities. Import the specific utility you
need from its subpath:

```ts
import {Geoid} from '@math.gl/earth/geoid';
import {getSunDirection} from '@math.gl/earth/sun';
import {lookupTimezoneAsync} from '@math.gl/earth/timezone';
```

The group root exports `geoid`, `sun`, and `timezone` namespaces. The existing
`@math.gl/earth/geoid`, `@math.gl/earth/sun`, and `@math.gl/earth/timezone` package imports remain available.

The optional [normal-gravity entry](./api-reference/normal-gravity.md) evaluates
reference ellipsoid potential and acceleration without coefficient datasets.
Import it explicitly from `@math.gl/earth/normal-gravity`.
