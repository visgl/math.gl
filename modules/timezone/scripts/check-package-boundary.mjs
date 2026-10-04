// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
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
const temporal = input => input.includes('@js-temporal/polyfill') || input.includes('node_modules/jsbi');
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
    calendar: "export {getLocalDateTime, getTimezoneLabel, isTimezoneSupported} from '@math.gl/timezone';",
    temporal: "export {getStartOfDay, getTimezoneTransitions, localDateTimeToInstant} from '@math.gl/timezone/temporal';",
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
    const includes = predicate => outputs.some(output => Object.keys(output.inputs).some(predicate));
    if (name !== 'temporal') {
      assert.ok(!includes(temporal), `${name}: must exclude Temporal compatibility dependency`);
    }
    if (name === 'offset' || name === 'calendar') {
      assert.ok(!outputs.some(output => Object.keys(output.inputs).some(table)), 'offset must exclude lookup data');
      assert.equal(outputs.length, 1);
    } else if (name === 'lazy') {
      assert.ok(!Object.keys(entry.inputs).some(table), 'lazy entry must exclude lookup data');
      assert.ok(outputs.some(output => Object.keys(output.inputs).some(table)), 'lookup chunk required');
      assert.ok(entry.imports.some(item => item.kind === 'dynamic-import'), 'preserve dynamic import');
    } else if (name === 'temporal') {
      assert.ok(includes(temporal), 'temporal entry must include its compatibility dependency');
      assert.ok(!includes(table), 'temporal entry must exclude geographic lookup data');
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
      import {getTimezoneOffset, getLocalDateTime, getTimezoneLabel, isTimezoneSupported, lookupTimezoneAsync} from '@math.gl/timezone';
      import {getStartOfDay, getTimezoneTransitions, localDateTimeToInstant} from '@math.gl/timezone/temporal';
      import {lookupTimezone} from '@math.gl/timezone/lookup';
      assert.equal(getTimezoneOffset('America/New_York', Date.parse('2024-07-15T12:00:00Z')), -240);
      assert.equal(getLocalDateTime('Asia/Kathmandu', Date.parse('2024-12-31T20:00:00Z')).year, 2025);
      assert.equal(isTimezoneSupported('America/New_York'), true);
      assert.equal(getTimezoneLabel('America/New_York', Date.parse('2024-07-15T12:00:00Z')), 'Eastern Daylight Time');
      assert.equal(getStartOfDay('America/New_York', Date.parse('2024-03-10T12:00:00Z')), Date.parse('2024-03-10T05:00:00Z'));
      assert.equal(localDateTimeToInstant('UTC', {year: 2024, month: 1, day: 1}), Date.parse('2024-01-01T00:00:00Z'));
      assert.equal(getTimezoneTransitions('America/New_York', Date.parse('2024-01-01'), Date.parse('2025-01-01')).length, 2);
      assert.equal(lookupTimezone([-74.006, 40.7128]), 'America/New_York');
      assert.equal(await lookupTimezoneAsync([-74.006, 40.7128]), 'America/New_York');
    `], {env: {...process.env, TZ: timezone}});
  }
  execFileSync(process.execPath, ['-e', `
    const assert = require('node:assert/strict');
    const root = require('@math.gl/timezone');
    assert.ok(!Object.keys(require.cache).some(path => path.includes('@photostructure/tz-lookup') || path.includes('@js-temporal/polyfill')));
    assert.equal(root.getLocalDateTime('UTC', 0).year, 1970);
    const originalIntl = globalThis.Intl;
    const originalTemporal = globalThis.Temporal;
    const calendar = require('@math.gl/timezone/temporal');
    assert.equal(globalThis.Intl, originalIntl);
    assert.equal(globalThis.Temporal, originalTemporal);
    assert.equal(calendar.getStartOfDay('UTC', 0), 0);
    assert.equal(calendar.localDateTimeToInstant('UTC', {year: 1970, month: 1, day: 1}), 0);
    assert.deepEqual(calendar.getTimezoneTransitions('UTC', 0, 1), []);
    assert.equal(root.getTimezoneOffset('Asia/Kathmandu', 0), 330);
    const {lookupTimezone} = require('@math.gl/timezone/lookup');
    assert.equal(lookupTimezone([-74.006, 40.7128]), 'America/New_York');
    root.lookupTimezoneAsync([-74.006, 40.7128]).then(zone => assert.equal(zone, 'America/New_York'));
  `]);
} finally {
  await rm(directory, {recursive: true, force: true});
}
