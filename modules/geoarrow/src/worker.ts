// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GeoArrowColumn} from './types';
import {getGeoArrowTransferList} from './layout';

export {getGeoArrowTransferList} from './layout';
export type {GeoArrowColumn} from './types';

/** A column and the unique borrowed buffers that may be transferred with it. */
export type GeoArrowTransfer = Readonly<{
  column: GeoArrowColumn;
  transferList: ArrayBuffer[];
}>;

/** Prepares an explicit structured-clone transfer payload without detaching any buffers. */
export function prepareGeoArrowTransfer(column: GeoArrowColumn): GeoArrowTransfer {
  return {column, transferList: getGeoArrowTransferList(column)};
}
