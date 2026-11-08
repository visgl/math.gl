// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Optional serialized-format bridge. The parser implementation lives in @math.gl/arrow/wkb. */
export {
  decodeGeoArrowWKB,
  decodeGeoArrowWKT,
  encodeGeoArrowWKB,
  encodeGeoArrowWKT,
  getGeoArrowWKBVertexCount
} from './codecs';
export type {DecodeGeoArrowWKBOptions} from './codecs';
