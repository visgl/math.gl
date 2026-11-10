# @math.gl/arrow

![Apache Arrow](./images/apache-arrow-logo.png)

`@math.gl/arrow` provides utilities for working with binary columnar tabular
data in the Apache Arrow format.

## Usage

```typescript
import * as arrow from 'apache-arrow';
import {IndexedArrowTable, dehydrateArrowTable, hydrateArrowTable} from '@math.gl/arrow';

const arrowTable = arrow.tableFromArrays({name: ['alpha', 'beta'], score: [10, 20]});
const selected = new IndexedArrowTable(arrowTable, [1, 0, 1]);
selected.getValue(0, 'name'); // 'beta'

const payload = dehydrateArrowTable(selected.materializeArrowTable(), {copy: 'all'});
const restored = hydrateArrowTable(structuredClone(payload));
restored.numRows; // 3
```

## Features

| Feature | Support | Notes |
| --- | --- | --- |
| Indexed tables and vectors | ✅ | Filter, sort, slice, and gather rows while controlling materialization. |
| Schema validation and column renaming | ✅ | Preserve field metadata and compatible physical buffers. |
| Buffer copying and transport | ✅ | Explicit ownership, hydration/dehydration, and Arrow IPC. |
| Apache Arrow versions | ✅ | Optional peer supporting 17+; compatibility checks exercise 17–21. |
| Independent utility entries | ✅ | UTF-8, WKB/WKT, and physical GeoArrow descriptors work without Apache Arrow. |
| Projection and geographic calculations | Separate | Use `@math.gl/geospatial`; CRS metadata remains opaque here. |

## Why Arrow in math.gl?

The vis.gl frameworks are designed to seamlessly produce, interchange, and process
binary data in Arrow format. These shared utilities provide schema validation,
column renaming, indexed table views, and table transport across those frameworks.

Geometry and GeoArrow processing are available in
[`@math.gl/arrow/geoarrow`](./geoarrow/README.md).

## Installation

```sh
npm install @math.gl/arrow apache-arrow
```

Apache Arrow is an **optional peer dependency**, supporting version 17 and newer.
Your application supplies one compatible Arrow installation. Importing the package root or `/geoarrow` requires Arrow. The `/utf8`,
`/geoarrow-utils`, and `/wkb` subpaths do not load or require Apache Arrow. The development compatibility checks exercise Arrow 17, 18, 19,
20, and 21, plus IPC interchange between those versions.

## Entry points

| Import | Purpose | Apache Arrow required |
| --- | --- | --- |
| [`@math.gl/arrow/math`](./math/README.md) | Typed SQL numeric functions, null propagation, classified errors | Yes, 17+ |
| [`@math.gl/arrow/color`](./color/README.md) | Typed RGBA, color ramps, bins, and categories | Yes, 17+ |
| `@math.gl/arrow` | Arrow table/vector views, schemas, copying, and transport | Yes, 17+ |
| [`@math.gl/arrow/utf8`](./utf8/README.md) | Byte-oriented string comparison and scalar parsing | No |
| [`@math.gl/arrow/geoarrow`](./geoarrow/README.md) | Arrow-native GeoArrow adapters and processing | Yes, 17+ |
| [`@math.gl/arrow/geoarrow-utils`](./geoarrow-utils/README.md) | Physical descriptors, geometry kernels, codecs, tessellation, and streams | No |
| [`@math.gl/arrow/wkb`](./wkb/README.md) | WKB/EWKB and WKT parsing, writing, and traversal | No |

CRS metadata is retained opaquely; interpretation, projection, and geographic calculations
belong in `@math.gl/geospatial`. Task scheduling is provided by the separate `@math.gl/tasks` package.

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
