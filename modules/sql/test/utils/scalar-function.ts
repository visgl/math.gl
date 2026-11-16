// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {vectorFromArray} from 'apache-arrow';
import type {ArrowTableFunction, ArrowTableFunctionPrototype} from '../../src/expressions';

/** Test fixture with equivalent vector and fused scalar implementations. */
export function scalarFunction(
  declaration: {name: string} & Omit<ArrowTableFunctionPrototype, 'evaluate'> &
    Required<Pick<ArrowTableFunctionPrototype, 'evaluateScalar'>>
): ArrowTableFunction {
  return {
    name: declaration.name,
    prototypes: [
      {
        ...declaration,
        evaluate(vectors, {activeRows, length}) {
          return vectorFromArray(
            Array.from({length}, (_, row) => {
              if (!activeRows[row]) return null;
              const values = vectors.map(vector => vector.get(row));
              if (declaration.nullHandling !== 'call' && values.some(value => value === null))
                return null;
              return declaration.evaluateScalar(...values);
            }),
            declaration.result.type
          );
        }
      }
    ]
  };
}
