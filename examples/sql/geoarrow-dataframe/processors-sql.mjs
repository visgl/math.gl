// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {queryArrowSQL} from '@math.gl/sql/query';

/** Processes the same GeoArrow table using a SQL statement. */
export function processSQL(input, parameters) {
  return queryArrowSQL(
    'SELECT id, score, geometry, score * 2.0 + 20.0 AS radius FROM points WHERE score >= :minimum',
    new Map([['points', input]]),
    {parameters}
  );
}

export const processors = {SQL: processSQL};
