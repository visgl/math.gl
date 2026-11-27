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
import {arrowScaleValue} from './arrow-domains';
import type {
  ArrowExpression,
  ArrowExpressionEvaluationOptions,
  ArrowExpressionOptions
} from '../arrow/types';

/** An Arrow bivariate projection and the exact scale used to color its rows. */
export type CompiledArrowBivariateScale = Readonly<{
  /** Exact sampler and two-axis legend descriptor used for the packed output. */
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
  /** Bound first numeric input expression. */
  const x = compileArrowExpression(xExpression, options);
  /** Bound second numeric input expression. */
  const y = compileArrowExpression(yExpression, options);
  for (const {
    outputField: {type}
  } of [x, y]) {
    if (!DataType.isInt(type) && !DataType.isFloat(type) && !DataType.isNull(type))
      throw new Error('Bivariate color scale requires two numeric expressions');
  }
  const scale = compileBivariateColorScale(spec);
  /** Non-null four-channel RGBA8 child type. */
  const type = new FixedSizeList(4, new Field('channel', new Uint8(), false));
  return {
    scale,
    evaluateTable(table, evaluation = {}) {
      /** Evaluated x values in logical row order. */
      const xs = x.evaluateTable(table, evaluation);
      /** Evaluated y values in logical row order. */
      const ys = y.evaluateTable(table, evaluation);
      /** Packed color tuples and validity for the projected column. */
      const values = Array.from({length: table.numRows}, (_, row) => {
        if (evaluation.activeRows && !evaluation.activeRows[row]) return null;
        /** Numeric ordinates, rejecting unsafe integers before converting them. */
        const xValue = arrowScaleValue(xs.get(row)) as number | null;
        const yValue = arrowScaleValue(ys.get(row)) as number | null;
        return (
          scale
            .sample(xValue, yValue)
            ?.map(channel => Math.round(Math.max(0, Math.min(1, channel)) * 255)) ?? null
        );
      });
      evaluation.signal?.throwIfAborted();
      return vectorFromArray(values, type);
    }
  };
}
