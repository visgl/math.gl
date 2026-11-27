// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {processDataFrame} from './processors-dataframe.mjs';
import {processSQL} from './processors-sql.mjs';

export const processors = {DataFrame: processDataFrame, SQL: processSQL};
