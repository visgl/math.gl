# Indexed Arrow views

`IndexedArrowTable` provides a cheap sorted view of an `arrow.Table` without
copying column data. Sorting reorders row indexes; filtering and slicing also
retain the backing column buffers. `IndexedArrowVector` provides the corresponding
column view. Treat backing data and indexes as immutable while a view uses them.

## IndexedArrowTable

`IndexedArrowTable<T>` pairs an `arrow.Table<T>` with raw row indexes in visible
order. `T` is the Arrow column type map. Indexes may repeat, so one backing row can
appear more than once in a view.

### Properties

| Property | Type | Description |
| --- | --- | --- |
| `table` | `arrow.Table<T>` | Backing table in raw row order. Readonly reference. |
| `schema` | `arrow.Schema<T>` | Schema of the backing table. Readonly reference. |
| `indexes` | `Int32Array` | Raw row indexes in visible order. Treat as immutable. |
| `numRows` | `number` | Number of visible rows. Readonly. |
| `numCols` | `number` | Number of backing-table columns. Readonly. |

### Constructor

```typescript
new IndexedArrowTable(arrowTable, indexes);
```

| Parameter | Type | Description |
| --- | --- | --- |
| `arrowTable` | `arrow.Table<T>` | Backing table in raw row order. |
| `indexes` | `readonly number[]` or `Int32Array` | Optional raw row indexes. Omit to expose all rows in raw order. The constructor copies supplied indexes. |

### Static methods

#### fromOwnedIndexes(arrowTable, indexes)

```typescript
IndexedArrowTable.fromOwnedIndexes(arrowTable, indexes);
```

Builds a view from an owned `Int32Array` without copying it. Do not mutate the
array after transferring ownership to the view.

| Parameter | Type | Description |
| --- | --- | --- |
| `arrowTable` | `arrow.Table<T>` | Backing table. |
| `indexes` | `Int32Array` | Valid raw row indexes whose ownership passes to the view. |

### Methods

#### `getRawIndex(rowIndex)`

Returns the raw backing-table row index for a visible row index, or `null` for an invalid visible
index.

#### `get(rowIndex)`

Returns a materialized Arrow row for a visible row index, or `null` for an invalid visible index.

#### `getTemporaryRow(rowIndex)`

Returns a reusable scratch row object for a visible row index. The same object is mutated by the
next `getTemporaryRow()` call on the same indexed table, so copy values you need to retain.

#### `at(rowIndex)`

Reads a row using `Array.prototype.at` semantics. Negative indexes count backward from the end of
the visible view.

#### `getValue(rowIndex, columnName)`

Returns a typed column value for a visible row, or `null` when the row index or column is not
available.

#### `getChild(columnName)`

Returns an `IndexedArrowVector` view for a backing column, or `null` when the column is missing.

#### `slice(begin, end)`

Returns a sliced indexed view over the same backing table.

#### `filter(predicate)`

Returns a filtered indexed view over the same backing table.

#### `sort(compare)`

Returns a sorted indexed view over the same backing table.

#### `concat(...others)`

Concatenates this indexed view with other indexed views sharing an identical Arrow schema. The
result owns a new backing Arrow table and preserves visible row order from each source view.

#### `find(predicate)` and `findIndex(predicate)`

Array-like search helpers over visible rows.

#### `materializeArrowTable()`

Copies the visible rows into a new concrete Arrow table. Physical row gathering preserves union child IDs, nested layouts, and exact scalar
storage without decoding values. Consecutive selections from the same input batch are
compacted into one output batch. Dictionaries and out-of-line view buffers are copied
once per source view and may retain unreferenced values. Visible row order and duplicate indexes are
preserved.

#### `toArray()` and `[Symbol.iterator]()`

Materialize or iterate visible rows in indexed order.

## IndexedArrowVector

`IndexedArrowVector<T>` is the column equivalent of an indexed table. It pairs an
`arrow.Vector<T>` with raw row indexes; `T` is the Arrow data type.

### Properties

| Property | Type | Description |
| --- | --- | --- |
| `vector` | `arrow.Vector<T>` | Backing vector. Readonly reference. |
| `indexes` | `Int32Array` | Raw row indexes in visible order. Treat as immutable. |
| `length` | `number` | Number of visible values. Readonly. |

### Constructor

```typescript
new IndexedArrowVector(vector, indexes);
```

| Parameter | Type | Description |
| --- | --- | --- |
| `vector` | `arrow.Vector<T>` | Backing vector in raw row order. |
| `indexes` | `readonly number[]` or `Int32Array` | Raw row indexes to expose; copied by the constructor. |

### Methods

#### get(rowIndex)

Returns the value at a visible index, or `null` for an invalid index. Nullable
Arrow values remain `null`; dictionary values are resolved by Arrow.

#### at(rowIndex)

Reads a visible value with `Array.prototype.at` semantics. Negative indexes count
backward from the end; invalid indexes return `null`.

#### slice(begin?, end?)

Returns a sliced indexed view over the same backing vector.

#### toArray()

Materializes visible values in indexed order, preserving duplicates and nulls.

#### [Symbol.iterator]()

Iterates visible values in indexed order.

## Indexing concepts

- A **raw row index** identifies a row in the backing table or vector.
- A **visible row index** identifies a position in the indexed view.
- Duplicate raw indexes are preserved.
- Predicates and comparators receive visible indexes; read through the supplied view.

## Usage

```typescript
import * as arrow from 'apache-arrow';
import {IndexedArrowTable} from '@math.gl/arrow';

const arrowTable = new arrow.Table({
  name: arrow.vectorFromArray(['alpha', 'beta', 'gamma'], new arrow.Utf8()),
  score: arrow.vectorFromArray([10, 20, 30], new arrow.Float64())
});

const indexedTable = new IndexedArrowTable(arrowTable, [2, 0]);

indexedTable.get(0)?.name; // 'gamma'
indexedTable.getValue(1, 'score'); // 10
indexedTable.getChild('name')?.toArray(); // ['gamma', 'alpha']
```

## Filtering and Sorting

Predicates and comparators receive visible row indexes. Use `getValue()` to read column values
without materializing row objects.

```typescript
const filteredTable = new IndexedArrowTable(arrowTable).filter(
  (currentTable, rowIndex) => (currentTable.getValue(rowIndex, 'score') ?? 0) >= 20
);

const sortedTable = filteredTable.sort(
  (currentTable, leftRowIndex, rightRowIndex) =>
    (currentTable.getValue(rightRowIndex, 'score') ?? 0) -
    (currentTable.getValue(leftRowIndex, 'score') ?? 0)
);
```

## Column views

```typescript
const nameColumn = indexedTable.getChild('name');

nameColumn?.get(0); // 'gamma'
nameColumn?.at(-1); // 'alpha'
nameColumn?.slice(1).toArray(); // ['alpha']
```
