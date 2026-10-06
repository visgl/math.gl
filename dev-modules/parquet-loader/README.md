# Tectonic Parquet adapter

Private workspace isolating loaders.gl 5.0.0-alpha.9 from deck.gl's loaders.gl v4 dependencies.
The example uses the selective `ParquetSource` API with `core.worker: true`. It streams selected
row groups and columns and delegates decompression and Arrow conversion to the packaged
TypeScript source worker. The worker URL is resolved from the pinned package by the bundler;
there is no decoder CDN dependency or custom worker implementation.

ZSTD decoding uses the browser's built-in implementation when available and its pure JavaScript
fzstd fallback otherwise; no zstd-codec module is injected. The worker reports transferable
Arrow batches, which the example converts into packed quaternion buffers.

`compress-utils` supplies optional compression modules that the browser bundler resolves through
loaders.gl's codec exports. Those alternative codecs are not invoked by the ZSTD reader.
