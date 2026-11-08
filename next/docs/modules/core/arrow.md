# Arrow utilities

`@math.gl/core/arrow` provides schema validation, column renaming, indexed table views, and table transport for Apache Arrow JS. It is independent of loaders.gl and its schema model. Geometry and GeoArrow processing belong in the geospatial module.

## Installation[​](#installation "Direct link to Installation")

```
npm install @math.gl/core apache-arrow
```

Apache Arrow is an **optional peer dependency**, supporting version 17 and newer. Your application supplies one compatible Arrow installation. Importing this subpath requires Arrow; the core root, UTF-8 helpers, and other independent core subpaths do not. The development compatibility checks exercise Arrow 17, 18, 19, 20, and 21, plus IPC interchange between those versions.

```
import * as arrow from 'apache-arrow';

import {IndexedArrowTable, dehydrateArrowTable, hydrateArrowTable} from '@math.gl/core/arrow';



const table = arrow.tableFromArrays({name: ['alpha', 'beta'], score: [10, 20]});

const selected = new IndexedArrowTable(table, [1, 0, 1]);

selected.getValue(0, 'name'); // 'beta'



const payload = dehydrateArrowTable(selected.materializeArrowTable(), {copy: 'all'});

const restored = hydrateArrowTable(structuredClone(payload));

restored.numRows; // 3
```

## API reference[​](#api-reference "Direct link to API reference")

| API                                                                                                                                          | Purpose                                                                          |
| -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [IndexedArrowTable and IndexedArrowVector](https://visgl.github.io/math.gl/next/docs/modules/core/arrow/indexed-arrow-table.md) | Filter, sort, slice, and reorder rows without immediately copying column values. |
| [MappedArrowTable](https://visgl.github.io/math.gl/next/docs/modules/core/arrow/mapped-arrow-table.md)                          | Add string-keyed lookup while retaining indexed transforms.                      |
| [Schema utilities](https://visgl.github.io/math.gl/next/docs/modules/core/arrow/arrow-schema-utils.md)                          | Validate field structure and rename columns while retaining buffers.             |
| [splitArrowBuffers](https://visgl.github.io/math.gl/next/docs/modules/core/arrow/split-arrow-buffers.md)                        | Control ownership of Arrow internal typed-array buffers.                         |
| [Table transport](https://visgl.github.io/math.gl/next/docs/modules/core/arrow/arrow-table-transport.md)                        | Hydrate/dehydrate column buffers or encode/decode full Arrow IPC.                |

The table views are read-only APIs, not deeply immutable snapshots. Treat their backing tables, index arrays, and maps as immutable while views are in use. Transport payloads are a math.gl protocol, not loaders.gl table wrappers.
