# @math.gl/sql/columnar-predicate

Use this entry point when a source or planner works with portable predicate trees. It includes predicate types, column and parameter discovery, validation, and parameter binding. It requires neither the SQL parser nor Apache Arrow.

```
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
