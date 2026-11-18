// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export {
  validateScaleSpec,
  createResolvedScale
} from './scale-types';
export type {
  ScaleColor,
  ScaleValue,
  ScaleDomain,
  ScaleRange,
  ScaleColorEncoding,
  ScaleSpec,
  ResolvedScaleDescriptor,
  ResolvedScale
} from './scale-types';

export {parseSQLScaleExpression, parseSQLScaleAST} from './parse-sql-scale';
export type {ParsedSQLScale} from './parse-sql-scale';

export {compileResolvedScale} from './compile-scale';
export {resolvePalette, listScalePalettes} from './palettes';

export {ScaleQuantileSketch} from './quantile-sketch';

export {
  convertScaleColor,
  decodeSRGB,
  encodeSRGB,
  packFloat16,
  unpackFloat16,
  packRGBA16F
} from './hdr-colors';

export * from './arrow-scales';
