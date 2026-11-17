# MappedArrowTable

`MappedArrowTable` provides a cheap key-value map view of an `arrow.Table` without copying column data. `MappedArrowTable<T>` extends [`IndexedArrowTable<T>`](https://visgl.github.io/math.gl/next/docs/modules/arrow/indexed-arrow-table.md), where `T` is the Arrow column type map. Mapped transforms preserve visible keys and duplicate entries; keyed lookup resolves the last visible occurrence of a key.

## Properties[​](#properties "Direct link to Properties")

| Property                     | Type                  | Description                                                                                    |
| ---------------------------- | --------------------- | ---------------------------------------------------------------------------------------------- |
| `rowIndexMap`                | `Map<string, number>` | Key-to-raw-row map owned by the view; duplicate keys use last-wins lookup. Treat as immutable. |
| `rowKeys`                    | `string[]`            | Keys in visible row order, including duplicates. Treat as immutable.                           |
| `table`, `schema`, `indexes` | Inherited             | Backing Arrow data, schema, and visible-to-raw index mapping.                                  |
| `numRows`, `numCols`         | `number`              | Visible row count and backing column count. Readonly.                                          |

## Constructor[​](#constructor "Direct link to Constructor")

```
new MappedArrowTable(arrowTable, rowIndexMap);
```

| Parameter     | Type                          | Description                                          |
| ------------- | ----------------------------- | ---------------------------------------------------- |
| `arrowTable`  | `arrow.Table<T>`              | Backing table in raw row order.                      |
| `rowIndexMap` | `ReadonlyMap<string, number>` | String-key-to-raw-row mapping; copied into the view. |

## Methods[​](#methods "Direct link to Methods")

### `getRowIndex(rowKey)`[​](#getrowindexrowkey "Direct link to getrowindexrowkey")

Returns the raw backing-table row index for a mapped key, or `null` when the key is absent.

### `getRowKey(rowIndex)`[​](#getrowkeyrowindex "Direct link to getrowkeyrowindex")

Returns the mapped key for a visible row index, or `null` when the index is invalid.

### `getByKey(rowKey)`[​](#getbykeyrowkey "Direct link to getbykeyrowkey")

Returns a materialized Arrow row for a mapped key, or `null` when the key is absent.

### `atMapped(rowIndex)`[​](#atmappedrowindex "Direct link to atmappedrowindex")

Reads a mapped row using `Array.prototype.at` semantics. Negative indexes count backward from the end of the visible mapped view.

### `slice(begin, end)`[​](#slicebegin-end "Direct link to slicebegin-end")

Returns a sliced mapped view over the same backing table and preserves mapped key entries.

### `filter(predicate)`[​](#filterpredicate "Direct link to filterpredicate")

Returns a filtered mapped view over the same backing table and preserves mapped key entries.

### `sort(compare)`[​](#sortcompare "Direct link to sortcompare")

Returns a sorted mapped view over the same backing table and preserves mapped key entries.

### `concat(...others)`[​](#concatothers "Direct link to concatothers")

Concatenates this mapped view with other mapped views sharing an identical Arrow schema. The result owns a new backing Arrow table, preserves visible mapped-row order including duplicate keys, and keeps last-wins keyed lookup behavior.

All other `IndexedArrowTable` methods, including `getValue()`, `getChild()`, `materializeArrowTable()`, `toArray()`, and iteration, are inherited.

## Key Semantics[​](#key-semantics "Direct link to Key Semantics")

* `rowKeys` stores keys in visible row order.
* Duplicate keys are preserved in visible row order.
* Keyed lookups are **last-wins**. If the same key appears multiple times, `getRowIndex(key)` and `getByKey(key)` resolve to the last visible occurrence.

## Usage[​](#usage "Direct link to Usage")

```
import {MappedArrowTable} from '@math.gl/arrow';



const rowIndexMap = new Map([

  ['gamma', 2],

  ['alpha', 0]

]);



const mappedTable = new MappedArrowTable(arrowTable, rowIndexMap);



mappedTable.getByKey('gamma')?.name; // 'gamma'

mappedTable.getRowIndex('alpha'); // 0

mappedTable.getRowKey(1); // 'alpha'
```

## Filtering and Sorting[​](#filtering-and-sorting "Direct link to Filtering and Sorting")

Mapped transforms preserve key entries instead of collapsing them into a plain indexed table.

```
const filteredTable = mappedTable.filter(

  (currentTable, rowIndex) => (currentTable.getValue(rowIndex, 'score') ?? 0) >= 20

);



const sortedTable = filteredTable.sort(

  (currentTable, leftRowIndex, rightRowIndex) =>

    (currentTable.getValue(rightRowIndex, 'score') ?? 0) -

    (currentTable.getValue(leftRowIndex, 'score') ?? 0)

);
```
