// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {queryArrowSQL} from '@math.gl/sql/query';
import {MOD} from '@math.gl/sql/math-functions';

/** Processes the same GeoArrow table using a SQL statement. */
export function processSQL(input, parameters, [west, south, east, north]) {
  return queryArrowSQL(
    `SELECT id, score, geometry, region_name, score * 2.0 + 20.0 AS radius
     FROM points
     WHERE score >= :minimum AND geometry[2] >= :south AND geometry[2] <= :north
       AND MOD(MOD(geometry[1] - :west, 360.0) + 360.0, 360.0) <= :width`,
    new Map([['points', input]]),
    {parameters: {...parameters, west, south, north, width: east - west}, functions: [MOD]}
  );
}

export const processors = {SQL: processSQL};
