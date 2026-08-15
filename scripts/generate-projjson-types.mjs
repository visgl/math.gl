// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import process from 'node:process';
import {compile} from 'json-schema-to-typescript';

const schemaPath = resolve('modules/crs/schemas/projjson.schema.json');
const outputPath = resolve('modules/crs/src/projjson-types.ts');
const check = process.argv.includes('--check');

const source = await readFile(schemaPath, 'utf8');
const schema = JSON.parse(source);
const crsSchema = {
  ...schema,
  title: 'PROJJSONCRS',
  oneOf: schema.definitions.crs.oneOf
};

const generated = await compile(crsSchema, 'PROJJSONCRS', {
  bannerComment: `// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Generated from PROJJSON v0.7. Do not edit by hand.
// Source: https://proj.org/schemas/v0.7/projjson.schema.json`,
  style: {
    singleQuote: true,
    semi: true
  },
  unreachableDefinitions: false
});

if (check) {
  const current = await readFile(outputPath, 'utf8');
  if (current !== generated) {
    console.error('Generated PROJJSON types are out of date. Run yarn generate:projjson-types.');
    process.exitCode = 1;
  }
} else {
  await writeFile(outputPath, generated);
}
