// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {inferCRSRepresentation} from '@math.gl/crs';
import type {CRSParser} from './types';
import {object, readStructuredCRS} from './structured';
/** Opt-in execution adapter for @math.gl/crs's readonly PROJJSON CRS union. */
export const projJSONCRSParser: CRSParser = {
  name: 'projjson',
  canParse: definition => inferCRSRepresentation(definition) === 'projjson',
  parse: (definition, options) => readStructuredCRS(object(definition), options)
};
