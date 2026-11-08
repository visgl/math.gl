# splitArrowBuffers

`splitArrowBuffers` rebuilds Apache Arrow JS objects so sliced internal typed-array buffers are
copied into standalone `ArrayBuffer`s. Internal typed arrays that already span their full backing
`ArrayBuffer` are reused by default.

This isolates sliced typed-array views before transferring their buffers. Whole-buffer views
are still shared with the input by default; use `copy: 'all'` when the original table must remain
usable after transfer.

## Usage

```ts
import {splitArrowBuffers} from '@math.gl/arrow';

const transferSafeTable = splitArrowBuffers(arrowTable);
// Use the rebuilt arrowTable locally, or dehydrate it before posting across a worker boundary.
```

## API

```ts
splitArrowBuffers(input, options);
```

`input` may be an Apache Arrow JS `Table`, `RecordBatch`, `Vector`, or `Data` instance. The return
value is a new real Arrow object of the same kind.

`options.copy` controls copying:

| Value      | Behavior                                                                 |
| ---------- | ------------------------------------------------------------------------ |
| `'none'`   | Never copy typed arrays                                                  |
| `'sliced'` | Default. Copy only typed arrays that view a larger backing `ArrayBuffer` |
| `'all'`    | Copy every Arrow internal typed array                                    |

## Compatibility Alias

`splitArrowTableBuffers(arrowTable, options)` is available as a table-only alias.

## Notes

`splitArrowBuffers` does not collect transfer lists and does not rehydrate serialized Arrow objects.
It only isolates Arrow internal buffers so later transfer-list collection can safely transfer binary
data without detaching unrelated memory.

Use `copy: 'none'` only when the sender owns the relevant backing buffers, is done with the source
table, no other live data depends on those buffers, and any unrelated bytes in the full backing
`ArrayBuffer`s are safe to expose to the receiver.

Structured cloning an Arrow instance does not preserve its prototypes. For worker
transport, use [dehydrateArrowTable and hydrateArrowTable](./arrow-table-transport.md).
