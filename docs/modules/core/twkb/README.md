---
sidebar_label: twkb
---

# @math.gl/core/twkb

Import `parseTWKB` and `writeTWKB` from `@math.gl/core/twkb`. This entry point works without
Apache Arrow. The codec accepts buffer views and all seven TWKB geometry families.

```typescript
import {parseTWKB, writeTWKB} from '@math.gl/core/twkb';

const bytes = writeTWKB({type: 'Point', coordinates: [1.25, 2.5]}, {precision: 2});
const {geometry, dimension} = parseTWKB(bytes);
```

Encoding quantizes coordinates at the requested decimal precision. Use `dimension: 'xym'` to
encode a three-ordinate measured geometry. The decoder restores implicit polygon ring closure,
preserves collection-member dimensions, and consumes optional size, bounds, and ID attributes.
The writer emits the geometry payload without optional attributes.
