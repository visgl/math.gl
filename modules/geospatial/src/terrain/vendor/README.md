<!-- SPDX-License-Identifier: MIT -->
<!-- SPDX-FileCopyrightText: Copyright (c) vis.gl contributors -->

# Delatin backend provenance

`delatin.js` is the implementation used by loaders.gl's terrain loader, copied from
`modules/terrain/src/lib/delatin/index.ts` at loaders.gl commit
`2a9a5ef3094c972617f8208c8cda41c5b24507c0`.
It is based on Michael Fogleman and Vladimir Agafonkin's Delatin algorithm and
retains their ISC license in `DELATIN-LICENSE.txt`; vis.gl changes retain MIT terms.

The initial transfer changes the source header, removes TypeScript-only suppression
comments, uses a `.js` extension, and applies repository formatting. Algorithm code
is otherwise unchanged. The adjacent public `../delatin.ts` adapter adds capacity
checks, independent nodal-error measurement and plain-array output. This internal
class is not exported as application API and is imported only by the Delatin entry.

Vendoring the existing implementation enables loaders.gl to remove its copy after
upgrading and preserves synchronous CommonJS consumption without requiring an ESM-only
runtime dependency. This does not claim to track the latest upstream Delatin release.
