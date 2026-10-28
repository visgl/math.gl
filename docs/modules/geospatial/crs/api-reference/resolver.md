# Opt-in CRS resolution

`@math.gl/geospatial/crs` resolves authority identifiers using application-supplied
providers. It has no bundled authority database and performs no network access or coordinate
transformation. Import it explicitly; the CRS root does not load it.

```ts
import {createCRSResolver, createCRSDictionaryProvider} from '@math.gl/geospatial/crs';

const resolver = createCRSResolver({providers: [
  createCRSDictionaryProvider({
    'APP:regional': '+proj=utm +zone=31 +datum=WGS84 +units=m'
  }, {id: 'application', version: '2026-10'})
]});
const {input, lookups} = await resolver.resolve('APP:regional');
// input is a full definition. A projection engine must still validate and execute it.
```

## Providers and lookup results

A `CRSDefinitionProvider` has an `id`, optional catalogue `version`, and
`resolve(identifier)` returning a definition, an alias, or `null`, synchronously or
as a Promise. Providers are tried in order. Only `null` advances to the next provider;
an exception propagates. Provider IDs must be unique within a resolver. Identifier
keys are exact and case-sensitive. A provider owns any authority-specific normalization.

`resolve(input)` accepts the shared `CRSInput`: a definition, `CRSReference`, or
`SpatialReference`. It returns an immutable `{input, lookups}`. Each lookup records
the identifier, provider ID and optional version. WKT, PROJ strings, PROJJSON objects
and opaque definitions pass through without syntax or execution validation. References
honor their declared `representation`; only bare definitions use inference.

For source metadata, the resolved definition becomes primary and the original is
retained in `alternatives`. Existing alternatives, declaration state, provenance,
stored coordinate order, units, coordinate epoch and separate vertical reference
are retained. Known horizontal and vertical identifiers are resolved independently.
Unknown and absent references stay unknown and absent. Resolving a vertical CRS or
epoch does not make a selected transformation engine support it.

Inputs are captured before awaiting providers; dictionary definitions are captured
at provider construction, and provider results are cloned and recursively frozen.
Providers must not change their catalogue during a resolver's lifetime. Construct
a new resolver for a new database revision or configuration.

## Cache and errors

`maxCacheSize` defaults to 128 top-level identifier requests, including pending
requests. Successful and pending requests share a least-recently-used cache;
concurrent requests deduplicate while their key is retained. Eviction can allow
another lookup while an older one is still running. Set zero to disable caching.
Rejections are evicted so a later call can retry. `clear()` evicts all entries but
does not cancel already returned promises or allow their completion to refill the cache.

Alias traversal is bounded by `maxDepth` (default 16), counting hops after the
initial lookup. Zero permits a direct definition lookup but no alias hops. `CRSResolutionError.reason`
is `not-found`, `cycle`, `limit`, or `invalid-result`; `identifier` identifies the
failed lookup. Provider exceptions remain unchanged. The resolver validates the
shape of returned definitions; semantic validity belongs to the consuming engine.

The resolver's lookup provenance is not a universal CRS-equivalence or coordinate-
operation identity. Keep execution caches scoped to their engine and resolver.
