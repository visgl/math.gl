# @math.gl/core/arrow

![Apache Arrow](data:image/png;base64,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)

`@math.gl/core/arrow` provides utilities for working with binary columnar tabular data in the Apache Arrow format.

## Usage[​](#usage "Direct link to Usage")

```
import * as arrow from 'apache-arrow';

import {IndexedArrowTable, dehydrateArrowTable, hydrateArrowTable} from '@math.gl/core/arrow';



const arrowTable = arrow.tableFromArrays({name: ['alpha', 'beta'], score: [10, 20]});

const selected = new IndexedArrowTable(arrowTable, [1, 0, 1]);

selected.getValue(0, 'name'); // 'beta'



const payload = dehydrateArrowTable(selected.materializeArrowTable(), {copy: 'all'});

const restored = hydrateArrowTable(structuredClone(payload));

restored.numRows; // 3
```

## Features[​](#features "Direct link to Features")

| Feature                                | Support  | Notes                                                                   |
| -------------------------------------- | -------- | ----------------------------------------------------------------------- |
| Indexed tables and vectors             | ✅       | Filter, sort, slice, and gather rows while controlling materialization. |
| Schema validation and column renaming  | ✅       | Preserve field metadata and compatible physical buffers.                |
| Buffer copying and transport           | ✅       | Explicit ownership, hydration/dehydration, and Arrow IPC.               |
| Apache Arrow versions                  | ✅       | Optional peer supporting 17+; compatibility checks exercise 17–21.      |
| Independent utility entries            | ✅       | Matrix, color, and UTF-8 entry points work without Apache Arrow.        |
| Projection and geographic calculations | Separate | Use `@math.gl/geospatial`; CRS metadata remains opaque here.            |

## Why Arrow in math.gl?[​](#why-arrow-in-mathgl "Direct link to Why Arrow in math.gl?")

The vis.gl frameworks are designed to seamlessly produce, interchange, and process binary data in Arrow format. These shared utilities provide schema validation, column renaming, indexed table views, and table transport across those frameworks.

Geometry and GeoArrow processing are available in [`@math.gl/core/arrow`](https://visgl.github.io/math.gl/next/docs/modules/core/arrow/geoarrow.md).

## Installation[​](#installation "Direct link to Installation")

```
npm install @math.gl/core apache-arrow
```

Apache Arrow is an **optional peer dependency**, supporting version 17 and newer. Your application supplies one compatible Arrow installation. The combined `@math.gl/core/arrow` entry point requires Arrow, including its GeoArrow and WKB exports. Matrix, color, and UTF-8 entry points do not require Arrow. Compatibility checks exercise Arrow 17–21 and cross-version IPC.

## Entry points[​](#entry-points "Direct link to Entry points")

| Import                                                                                                               | Purpose                                                     | Apache Arrow required |
| -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------- |
| `@math.gl/core/arrow`                                                                                                | Arrow table/vector views, schemas, copying, and transport   | Yes, 17+              |
| [`@math.gl/core/utf8`](https://visgl.github.io/math.gl/next/docs/modules/core/utf8.md)                  | Byte-oriented string comparison and scalar parsing          | No                    |
| [`@math.gl/core/arrow`](https://visgl.github.io/math.gl/next/docs/modules/core/arrow/geoarrow.md)       | Arrow-native GeoArrow adapters and processing               | Yes, 17+              |
| [`@math.gl/core/arrow`](https://visgl.github.io/math.gl/next/docs/modules/core/arrow/geoarrow-utils.md) | Physical descriptors, geometry kernels, codecs, and streams | Yes, 17+              |
| [`@math.gl/core/arrow`](https://visgl.github.io/math.gl/next/docs/modules/core/arrow/wkb.md)            | WKB/EWKB and WKT parsing, writing, and traversal            | Yes, 17+              |

CRS metadata is retained opaquely; interpretation, projection, and geographic calculations belong in `@math.gl/geospatial`. Task scheduling is provided by the separate `@math.gl/tasks` package.

## API reference[​](#api-reference "Direct link to API reference")

| API                                                                                                                                          | Purpose                                                                          |
| -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [IndexedArrowTable and IndexedArrowVector](https://visgl.github.io/math.gl/next/docs/modules/core/arrow/indexed-arrow-table.md) | Filter, sort, slice, and reorder rows without immediately copying column values. |
| [MappedArrowTable](https://visgl.github.io/math.gl/next/docs/modules/core/arrow/mapped-arrow-table.md)                          | Add string-keyed lookup while retaining indexed transforms.                      |
| [Schema utilities](https://visgl.github.io/math.gl/next/docs/modules/core/arrow/arrow-schema-utils.md)                          | Validate field structure and rename columns while retaining buffers.             |
| [splitArrowBuffers](https://visgl.github.io/math.gl/next/docs/modules/core/arrow/split-arrow-buffers.md)                        | Control ownership of Arrow internal typed-array buffers.                         |
| [Table transport](https://visgl.github.io/math.gl/next/docs/modules/core/arrow/arrow-table-transport.md)                        | Hydrate/dehydrate column buffers or encode/decode full Arrow IPC.                |

The table views are read-only APIs, not deeply immutable snapshots. Treat their backing tables, index arrays, and maps as immutable while views are in use. Transport payloads are a math.gl protocol, not loaders.gl table wrappers.

### Column projection[​](#column-projection "Direct link to Column projection")

Use `projectArrowTable(table, selections)` to select and reorder top-level columns, with optional aliases. The returned table shares the original column buffers and retains field, schema, and batch metadata. Passing an empty selection keeps the original row count.

```
import {projectArrowTable} from '@math.gl/core/arrow';



const projected = projectArrowTable(arrowTable, [

  {column: 'score', as: 'value'},

  'name'

]);
```

### Column inspection[​](#column-inspection "Direct link to Column inspection")

Use `isArrowTable(value)` and `isArrowRecordBatch(value)` to narrow an unknown value to an Apache Arrow `Table` or `RecordBatch`. Both guards recognize native Arrow values from different package copies. `findArrowColumn(table, ['feature', 'position'])` looks up a nested column and returns `null` if the path is missing. Pass a single segment to look up a literal field name that contains a dot. `isNumericArrowType` and `isFixedSizeListArrowType` inspect schema types without reading column values.
