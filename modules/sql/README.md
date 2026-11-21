# @math.gl/sql

A lightweight SQL query engine for Apache Arrow tables.

```bash
npm install @math.gl/sql apache-arrow
```

```ts
import {tableFromArrays} from 'apache-arrow';
import {queryArrowSQL} from '@math.gl/sql/query';

const orders = tableFromArrays({quantity: new Int32Array([2, 1, 3])});
const result = queryArrowSQL(
  'SELECT SUM(quantity) AS units FROM orders',
  new Map([['orders', orders]])
);
console.log(result.getChild('units')?.get(0)); // 6n
```

Query native Arrow tables, compute columns, aggregate record batches, or run structured queries
in workers. Apache Arrow 17 or later is required for execution. The `/parser` and `/expressions`
entry points work without Arrow. Optional `/math-functions` and `/color-functions` entries
provide typed query functions.

See the [SQL documentation](https://math.gl/docs/modules/sql) for the supported SQL subset,
streaming APIs, worker execution, and examples.
