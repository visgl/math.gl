// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Reproduce the optional datasets from the pinned, unmodified text fixtures.
// Run after building @math.gl/geospatial. No downloads or optimizer required.
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {parseElasticMap} from '../modules/geospatial/dist/discontinuous.js';
const root=fileURLToPath(new URL('../',import.meta.url));
for(const [roman,name] of [['I','elasticI'],['II','elasticII'],['III','elasticIII']]){
  const data=parseElasticMap(readFileSync(`${root}modules/geospatial/test/discontinuous/fixtures/elastic/elastic-${roman}.txt`,'utf8'));
  const output=`${root}modules/geospatial/src/discontinuous/elastic/${name}.ts`;
  writeFileSync(output,`// math.gl\n// SPDX-License-Identifier: Unlicense\n// SPDX-FileCopyrightText: Justin Kunimune\n// Published Elastic dataset, revision 88808a7c0fe92b42d6e5f903549cd7cfcbd26f3b.\n// Generated from projection/elastic-${roman}.txt; see UNLICENSE.txt.\nimport type {ElasticMapData} from './data';\nexport const ${name}: ElasticMapData = ${JSON.stringify(data)};\n`);
  execFileSync(process.execPath,[`${root}node_modules/@biomejs/biome/bin/biome`,'format','--write',output],{cwd:root,stdio:'inherit'});
}
