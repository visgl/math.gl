# Arrow DataFrame and GeoDataFrame

**Status:** Draft and experimental prototype

A deck.gl application should be able to load GeoParquet, pick a geometry column, filter features, derive styling attributes, and pass the resulting Arrow table to a layer. An application preparing attributes before adding geometry should be able to use the same table operations.

## API and ownership

Expose `DataFrame` and `GeoDataFrame` from `@math.gl/sql/dataframe`. Both wrap Apache Arrow tables. `GeoDataFrame` specializes `DataFrame` with one active GeoArrow field. `fromArrow` infers the active geometry when exactly one field qualifies. Tables with multiple candidates require an explicit name. Each field keeps its own encoding and CRS metadata.

```ts
import {DataFrame, GeoDataFrame} from '@math.gl/sql/dataframe';

const attributes = DataFrame.fromArrow(table);
const parcels = GeoDataFrame.fromArrow(attributes.toArrow(), {geometry: 'boundary'});
const bounds = parcels.geometry.totalBounds();
const labels = parcels.setGeometry('label_point').select('parcel_id', 'label_point');
const layerData = labels.toArrow();
```

Wrapping, unwrapping, and changing the active geometry share the original table. Column selection returns a plain frame with exactly the selected fields in the requested order and shares their Arrow buffers. `totalBounds` computes an extent in stored coordinates and returns null when there are no coordinates. It delegates to the GeoArrow kernel in `@math.gl/core/arrow`.

## Shared SQL execution

Target at least 90% reuse of math.gl code in apps that use both SQL and frames. Both entry points should use the same expression parsing and binding, relational execution, Arrow kernels, function registry, and worker implementation. Frame code should handle table wrapping, method arguments, and active geometry. Keep imports pointed at the same implementation modules so a bundler can deduplicate them. Measure reuse in a production bundle of the demo app using math.gl bytes attributable to modules in its SQL-only and frame-only dependency graphs. Report overlap and incremental combined bundle size, and check for duplicated engines in emitted chunks.

## Stages

1. Prototype the two wrappers, active geometry validation, bounds, and column selection. Test buffer identity across multiple batches and verify extension and schema metadata survive.
2. Add parameterized `filter` and `withColumns` using the SQL engine. Preserve the active geometry on row filtering and attribute derivation. Reject incompatible replacement of the active field. Reuse buffers for unchanged columns where possible and account for gathers and rebuilt offsets on scattered row selections. Exercise sliced vectors, dictionaries, null and empty geometries, and metadata on filtered results.
3. Build a deck.gl GeoParquet example with parcel boundaries, label points, interactive filtering, derived styling, and picking by stable parcel ID. Pass Arrow tables to the layer. Test the layer's geometry selection when multiple fields are present. Compare direct SQL calls with the frame on the same workload and measure processing time, allocated bytes, and time to draw. Measure renderer conversion separately and verify the code-sharing target before stabilizing the API.
4. Evaluate viewport filtering using cached row envelopes. Define envelope intersection and antimeridian behavior explicitly. Add CRS transforms when a projected dataset warrants them. Use a concrete join workload to choose spatial predicates, indexing, and result cardinality before designing spatial joins.
