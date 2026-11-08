# Arrow utilities

![Apache Arrow](./images/apache-arrow-logo.png)

`@math.gl/core/arrow` provides utilities for working with binary columnar tabular
data in the Apache Arrow format.

## Why Arrow in math.gl?

The vis.gl frameworks are designed to seamlessly produce, interchange, and process
binary data in Arrow format. These shared utilities provide schema validation,
column renaming, indexed table views, and table transport across those frameworks.

Geometry and GeoArrow processing are available in
[`@math.gl/geospatial/geoarrow`](../../geospatial/geoarrow/README.md).

## Installation

```sh
npm install @math.gl/core apache-arrow
```

Apache Arrow is an **optional peer dependency**, supporting version 17 and newer.
Your application supplies one compatible Arrow installation. Importing this
subpath requires Arrow; the core root, UTF-8 helpers, and other independent core
subpaths do not. The development compatibility checks exercise Arrow 17, 18, 19,
20, and 21, plus IPC interchange between those versions.

```typescript
import * as arrow from 'apache-arrow';
import {IndexedArrowTable, dehydrateArrowTable, hydrateArrowTable} from '@math.gl/core/arrow';

const table = arrow.tableFromArrays({name: ['alpha', 'beta'], score: [10, 20]});
const selected = new IndexedArrowTable(table, [1, 0, 1]);
selected.getValue(0, 'name'); // 'beta'

const payload = dehydrateArrowTable(selected.materializeArrowTable(), {copy: 'all'});
const restored = hydrateArrowTable(structuredClone(payload));
restored.numRows; // 3
```

## API reference

| API | Purpose |
| --- | --- |
| [IndexedArrowTable and IndexedArrowVector](./indexed-arrow-table.md) | Filter, sort, slice, and reorder rows without immediately copying column values. |
| [MappedArrowTable](./mapped-arrow-table.md) | Add string-keyed lookup while retaining indexed transforms. |
| [Schema utilities](./arrow-schema-utils.md) | Validate field structure and rename columns while retaining buffers. |
| [splitArrowBuffers](./split-arrow-buffers.md) | Control ownership of Arrow internal typed-array buffers. |
| [Table transport](./arrow-table-transport.md) | Hydrate/dehydrate column buffers or encode/decode full Arrow IPC. |

The table views are read-only APIs, not deeply immutable snapshots. Treat their
backing tables, index arrays, and maps as immutable while views are in use.
Transport payloads are a math.gl protocol, not loaders.gl table wrappers.
