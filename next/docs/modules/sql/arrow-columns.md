# Creating Arrow columns

`createArrowColumns` builds a new table from named expressions. The input keeps its original schema and values, even when an output uses an existing column name.

```
import {createArrowColumns} from '@math.gl/sql/arrow';

import {parseSQLExpression} from '@math.gl/sql/parser';



const {table} = createArrowColumns(input, {

  magnitude: parseSQLExpression('magnitude'),

  doubled: parseSQLExpression('magnitude * 2')

});
```

Opt into scale preparation to draw a legend with the domain used for coloring.

```
import {scaleProjectionOperation} from '@math.gl/sql/scales';



const {table: colored, columnMetadata} = createArrowColumns(input, {

  color: parseSQLExpression("SCALE_COLOR(magnitude, DOMAIN(magnitude), PALETTE('Blues'))")

}, {operations: [scaleProjectionOperation]});



for (const entry of columnMetadata.color) {

  renderLegend(entry.scale.descriptor);

}
```

Output rows retain input order and columns follow the expression record's key order. Each metadata list describes that column's expression, with outer calls before nested calls and siblings in expression order. Ordinary columns have an empty list. Both arms of a conditional contribute metadata, even when an arm selects no rows. Sampling respects the selected rows.

Each scale occurrence resolves once against the complete input and shares its sampler across batches. The metadata belongs to that result. Call again with new input to refresh data-derived domains. Supply additional Arrow functions through `options.functions`.
