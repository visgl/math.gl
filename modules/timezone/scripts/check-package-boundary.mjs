// math.gl
// SPDX-License-Identifier: MIT
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {gzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';

const require = createRequire(import.meta.url);
const toolsRequire = createRequire(require.resolve('@vis.gl/dev-tools'));
const {build} = toolsRequire('esbuild');
const directory = await mkdtemp(join(tmpdir(), 'math-gl-timezone-'));
const table = input => input.includes('@photostructure/tz-lookup');
const options = {
  bundle: true,
  tsconfigRaw: {},
  format: 'esm',
  platform: 'browser',
  minify: true,
  write: false,
  metafile: true,
  splitting: true,
  outdir: directory
};

try {
  for (const [name, source] of Object.entries({
    offset: "export {getTimezoneOffset} from '@math.gl/timezone';",
    lazy: "export {lookupTimezoneAsync} from '@math.gl/timezone';",
    sync: "export {lookupTimezone} from '@math.gl/timezone/lookup';"
  })) {
    const result = await build({
      ...options,
      splitting: name === 'lazy',
      stdin: {contents: source, resolveDir: process.cwd(), sourcefile: `${name}.js`}
    });
    const outputs = Object.values(result.metafile.outputs);
    const entry = outputs.find(output => output.entryPoint === `${name}.js`);
    assert.ok(entry, `${name}: entry output must exist`);
    if (name === 'offset') {
      assert.ok(!outputs.some(output => Object.keys(output.inputs).some(table)), 'offset must exclude lookup data');
      assert.equal(outputs.length, 1);
    } else if (name === 'lazy') {
      assert.ok(!Object.keys(entry.inputs).some(table), 'lazy entry must exclude lookup data');
      assert.ok(outputs.some(output => Object.keys(output.inputs).some(table)), 'lookup chunk required');
      assert.ok(entry.imports.some(item => item.kind === 'dynamic-import'), 'preserve dynamic import');
    } else {
      assert.ok(Object.keys(result.metafile.inputs).some(table), 'sync lookup must include data');
    }
    for (const file of result.outputFiles) {
      console.log(`${name}: ${file.contents.length} bytes minified, ${gzipSync(file.contents).length} bytes gzip (${file.path.split('/').pop()})`);
    }
  }
  // Exercise the actual package exports in fresh processes under different host timezones.
  for (const timezone of ['UTC', 'Pacific/Honolulu', 'Asia/Tokyo']) {
    execFileSync(process.execPath, ['--input-type=module', '-e', `
      import assert from 'node:assert/strict';
      import {getTimezoneOffset, lookupTimezoneAsync} from '@math.gl/timezone';
      import {lookupTimezone} from '@math.gl/timezone/lookup';
      assert.equal(getTimezoneOffset('America/New_York', Date.parse('2024-07-15T12:00:00Z')), -240);
      assert.equal(lookupTimezone([-74.006, 40.7128]), 'America/New_York');
      assert.equal(await lookupTimezoneAsync([-74.006, 40.7128]), 'America/New_York');
    `], {env: {...process.env, TZ: timezone}});
  }
  execFileSync(process.execPath, ['-e', `
    const assert = require('node:assert/strict');
    const root = require('@math.gl/timezone');
    assert.ok(!Object.keys(require.cache).some(path => path.includes('@photostructure/tz-lookup')));
    assert.equal(root.getTimezoneOffset('Asia/Kathmandu', 0), 330);
    const {lookupTimezone} = require('@math.gl/timezone/lookup');
    assert.equal(lookupTimezone([-74.006, 40.7128]), 'America/New_York');
    root.lookupTimezoneAsync([-74.006, 40.7128]).then(zone => assert.equal(zone, 'America/New_York'));
  `]);
} finally {
  await rm(directory, {recursive: true, force: true});
}
