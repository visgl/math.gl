// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  DataType,
  Field,
  FixedSizeList,
  Uint8,
  vectorFromArray,
  type Vector,
  type Table
} from 'apache-arrow';
import {
  compileBivariateColorScale,
  type BivariateColorScaleSpec,
  type ResolvedBivariateColorScale
} from '@math.gl/core/color';
import {compileArrowExpression} from '../arrow/compiler';
import type {
  ArrowExpression,
  ArrowExpressionEvaluationOptions,
  ArrowExpressionOptions
} from '../arrow/types';

/** An Arrow bivariate projection and the exact scale used to color its rows. */
export type CompiledArrowBivariateScale = Readonly<{
  scale: ResolvedBivariateColorScale;
  /** Yields one nullable packed RGBA8 value per input row. */
  evaluateTable(table: Table, options?: ArrowExpressionEvaluationOptions): Vector;
}>;

/** Binds two numeric expressions to a packed RGBA8 projection. */
export function compileArrowBivariateScale(
  xExpression: ArrowExpression,
  yExpression: ArrowExpression,
  spec: BivariateColorScaleSpec,
  options: ArrowExpressionOptions
): CompiledArrowBivariateScale {
  const x = compileArrowExpression(xExpression, options);
  const y = compileArrowExpression(yExpression, options);
  for (const {
    outputField: {type}
  } of [x, y]) {
    if (!DataType.isInt(type) && !DataType.isFloat(type) && !DataType.isNull(type))
      throw new Error('Bivariate color scale requires two numeric expressions');
  }
  const scale = compileBivariateColorScale(spec);
  const type = new FixedSizeList(4, new Field('channel', new Uint8(), false));
  return {
    scale,
    evaluateTable(table, evaluation = {}) {
      const xs = x.evaluateTable(table, evaluation);
      const ys = y.evaluateTable(table, evaluation);
      const values = Array.from({length: table.numRows}, (_, row) => {
        if (evaluation.activeRows && !evaluation.activeRows[row]) return null;
        const xValue = xs.get(row);
        const yValue = ys.get(row);
        return (
          scale
            .sample(
              xValue === null ? null : Number(xValue),
              yValue === null ? null : Number(yValue)
            )
            ?.map(channel => Math.round(Math.max(0, Math.min(1, channel)) * 255)) ?? null
        );
      });
      evaluation.signal?.throwIfAborted();
      return vectorFromArray(values, type);
    }
  };
}
