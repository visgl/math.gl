# Arrow table transport

Use column-buffer transport for worker hops between matching Apache Arrow JS
versions. Use full Arrow IPC when the sender and receiver may use different
compatible Arrow versions, or when interoperating with another Arrow implementation.
Neither path uses a loaders.gl schema or table wrapper.

## Column-buffer transport

```typescript
import {dehydrateArrowTable, hydrateArrowTable} from '@math.gl/arrow';

const payload = dehydrateArrowTable(table, {copy: 'all'});
const restored = hydrateArrowTable(structuredClone(payload));
```

`dehydrateArrowTable(table, options?)` returns a plain `DehydratedArrowTable`:

- `transport: 'arrow-js'` and `version: 1` identify this math.gl protocol.
- `schema` is a **schema-only Arrow IPC stream**. Arrow itself encodes field types,
  names, nullability, metadata, dictionary types/IDs, union IDs, and timezone data.
- `metadataVersion` preserves the original schema's metadata-version value.
- `batches` contain plain recursive descriptors with offsets, lengths, null counts,
  typed-array buffer slots, children, and dictionary value chunks. Column values
  are not converted to IPC or JavaScript rows.

`hydrateArrowTable(payload)` reconstructs a real Arrow table from those buffers.
It accepts trusted payloads from this protocol and rejects unknown protocol
versions. It makes no column-buffer copies; retain exclusive ownership if the
result will be mutated. Generic schema type maps are not inferred from runtime
payloads; validate the hydrated table against your application's schema when needed.

The format depends on Arrow JS buffer layouts. Use matching Arrow JS versions on
both sides. It is not a persistent file format or a wire-compatible replacement
for loaders.gl's transport payloads.

## Copying and transfer ownership

The options are the same as [splitArrowBuffers](./split-arrow-buffers.md):

| `copy` | Ownership |
| --- | --- |
| `'sliced'` (default) | Copies typed arrays that occupy only part of their backing buffer. Full-buffer views may still alias the source. |
| `'all'` | Copies every column-buffer view, allowing those copies to be transferred without detaching the source table. |
| `'none'` | Reuses every column buffer. Transfer detaches the sender's corresponding source buffers. |

`structuredClone(payload)` copies buffers by default. To avoid another copy when
posting to a worker, collect the unique transferable `ArrayBuffer`s from the
payload, including its schema bytes, and supply that transfer list. Buffer
splitting does not collect a transfer list. Never transfer a source-owned buffer
that the sender still needs. SharedArrayBuffers are not transferable.

## Full Arrow IPC

```typescript
import {serializeArrowTableToIPC, deserializeArrowTableFromIPC} from '@math.gl/arrow';

const payload = serializeArrowTableToIPC(table);
const restored = deserializeArrowTableFromIPC(payload);
// Raw Uint8Array or ArrayBuffer IPC bytes are also accepted.
```

`serializeArrowTableToIPC` returns `SerializedArrowTableIPC`, containing
`transport: 'arrow-ipc'` and `data: Uint8Array`. It serializes the entire table,
including schema, batches, and dictionaries. This costs additional encoding work
but provides Arrow's standard interchange format. A receiver must support the
Arrow types used by the sender; a newer runtime does not make newer types readable
by an older runtime.
