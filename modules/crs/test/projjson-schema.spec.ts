// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import Ajv from 'ajv';
import test from 'tape-promise/tape';

import {officialPROJJSONCRSExamples} from './projjson-fixtures';

const schema = JSON.parse(
  readFileSync(new URL('../schemas/projjson.schema.json', import.meta.url), 'utf8')
);
const ajv = new Ajv({strict: false});
ajv.addSchema(schema);
const validateCRS = ajv.getSchema(`${schema.$id}#/definitions/crs`);

if (!validateCRS) {
  throw new Error('The vendored PROJJSON schema does not expose #/definitions/crs');
}

test('PROJJSON schema validates official CRS examples', t => {
  for (const definition of officialPROJJSONCRSExamples) {
    const valid = validateCRS(definition);
    t.ok(valid, `${definition.type} example is valid`);
    if (!valid) {
      t.comment(ajv.errorsText(validateCRS.errors));
    }
  }
  t.end();
});

test('PROJJSON CRS schema rejects malformed and non-CRS objects', t => {
  t.notOk(validateCRS({type: 'GeographicCRS', name: 'Missing datum'}), 'rejects a malformed CRS');
  t.notOk(
    validateCRS({
      type: 'Ellipsoid',
      name: 'WGS 84',
      semi_major_axis: 6378137,
      inverse_flattening: 298.257223563
    }),
    'rejects a valid non-CRS PROJJSON object'
  );
  t.end();
});
