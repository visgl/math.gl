// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GeoDataFrame} from '@math.gl/sql/dataframe';

/** Processes the GeoArrow table through the DataFrame API. */
export function processDataFrame(input, parameters, bounds) {
  return GeoDataFrame.fromArrow(input)
    .filterViewport(bounds, {wrapLongitude: true})
    .filter('score >= :minimum', {parameters})
    .withColumns({radius: 'score * 2.0 + 20.0'})
    .toArrow();
}

export const processors = {DataFrame: processDataFrame};
