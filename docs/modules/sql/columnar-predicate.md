# @math.gl/sql/columnar-predicate

Use this entry point when a source or planner works with portable predicate trees.
It includes predicate types, column and parameter discovery, validation, and
parameter binding. It requires neither the SQL parser nor Apache Arrow.

```ts
import {
  bindColumnarPredicateParameters,
  getColumnarPredicateColumns,
  type ParameterizedColumnarPredicate
} from '@math.gl/sql/columnar-predicate';

const predicate: ParameterizedColumnarPredicate = {
  op: '>=',
  args: [{property: 'height'}, {parameter: 'minimum'}]
};

const columns = getColumnarPredicateColumns(predicate); // ['height']
const bound = bindColumnarPredicateParameters(predicate, {minimum: 100});
```

`compileColumnarPredicate(bound, resolveColumn)` resolves each column path to a
row accessor and returns a reusable predicate function. Keep a row only when
the result is `true`. A `null` result represents SQL UNKNOWN, including
comparisons with null or missing values. Bind parameters first and supply
logical values, such as `Date` objects for dates. Use the typed Arrow executor
for explicit casts.
