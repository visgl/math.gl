# @math.gl/core/arrow

![Apache Arrow](./images/apache-arrow-logo.png)

`@math.gl/core/arrow` provides utilities for working with binary columnar tabular
data in the Apache Arrow format.

## Usage

```typescript
import * as arrow from 'apache-arrow';
import {IndexedArrowTable, dehydrateArrowTable, hydrateArrowTable} from '@math.gl/core/arrow';

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
| Independent utility entries | ✅ | Matrix, color, and UTF-8 entry points work without Apache Arrow. |
| Projection and geographic calculations | Separate | Use `@math.gl/geospatial`; CRS metadata remains opaque here. |

## Why Arrow in math.gl?

The vis.gl frameworks are designed to seamlessly produce, interchange, and process
binary data in Arrow format. These shared utilities provide schema validation,
column renaming, indexed table views, and table transport across those frameworks.

Geometry and GeoArrow processing are available in
[`@math.gl/core/arrow`](./geoarrow/README.md).

## Installation

```sh
npm install @math.gl/core apache-arrow
```

Apache Arrow is an **optional peer dependency**, supporting version 17 and newer.
Your application supplies one compatible Arrow installation. The combined `@math.gl/core/arrow` entry point requires Arrow, including its GeoArrow and WKB exports. Matrix, color, and UTF-8 entry points do not require Arrow. Compatibility checks exercise Arrow 17–21 and cross-version IPC.

## Entry points

| Import | Purpose | Apache Arrow required |
| --- | --- | --- |
| `@math.gl/core/arrow` | Arrow table/vector views, schemas, copying, and transport | Yes, 17+ |
| [`@math.gl/core/utf8`](../utf8/README.md) | Byte-oriented string comparison and scalar parsing | No |
| [`@math.gl/core/arrow`](./geoarrow/README.md) | Arrow-native GeoArrow adapters and processing | Yes, 17+ |
| [`@math.gl/core/arrow`](./geoarrow-utils/README.md) | Physical descriptors, geometry kernels, codecs, and streams | Yes, 17+ |
| [`@math.gl/core/arrow`](./wkb/README.md) | WKB/EWKB and WKT parsing, writing, and traversal | Yes, 17+ |

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

### Column projection

Use `projectArrowTable(table, selections)` to select and reorder top-level
columns, with optional aliases. The returned table shares the original column
buffers and retains field, schema, and batch metadata. Passing an empty
selection keeps the original row count.

```typescript
import {projectArrowTable} from '@math.gl/core/arrow';

const projected = projectArrowTable(arrowTable, [
  {column: 'score', as: 'value'},
  'name'
]);
```

### Column inspection

Use `isArrowTable(value)` and `isArrowRecordBatch(value)` to narrow an unknown
value to an Apache Arrow `Table` or `RecordBatch`. Both guards recognize native
Arrow values from different package copies.
`findArrowColumn(table, ['feature', 'position'])` looks up a nested column and
returns `null` if the path is missing. Pass a single segment to look up a
literal field name that contains a dot. `isNumericArrowType` and
`isFixedSizeListArrowType` inspect schema types without reading column values.
