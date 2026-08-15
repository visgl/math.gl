// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import Ajv from 'ajv';
import {expect, test} from 'vitest';

import schema from '../schemas/projjson.schema.json';
import {officialPROJJSONCRSExamples} from './projjson-fixtures';

const ajv = new Ajv({strict: false});
ajv.addSchema(schema);
const validateCRS = ajv.getSchema(`${schema.$id}#/definitions/crs`);

if (!validateCRS) {
  throw new Error('The vendored PROJJSON schema does not expose #/definitions/crs');
}

test('PROJJSON schema validates official CRS examples', () => {
  for (const definition of officialPROJJSONCRSExamples) {
    const valid = validateCRS(definition);
    expect(
      valid,
      `${definition.type} example is invalid: ${ajv.errorsText(validateCRS.errors)}`
    ).toBe(true);
  }
});

test('PROJJSON CRS schema rejects malformed and non-CRS objects', () => {
  expect(validateCRS({type: 'GeographicCRS', name: 'Missing datum'})).toBe(false);
  expect(
    validateCRS({
      type: 'Ellipsoid',
      name: 'WGS 84',
      semi_major_axis: 6378137,
      inverse_flattening: 298.257223563
    })
  ).toBe(false);
});
