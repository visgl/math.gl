// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test} from 'node:test';
import {execFileSync} from 'node:child_process';

test('TaskRunner example validates automatic and explicit worker lifetimes', () => {
  execFileSync(process.execPath, [new URL('../../../../../examples/tasks/task-runner/src/main.mjs', import.meta.url).pathname], {stdio: 'inherit'});
});

test('TaskRunner example consumes the provided geospatial task catalog', () => {
  execFileSync(process.execPath, [new URL('../../../../../examples/tasks/task-runner/src/geospatial.mjs', import.meta.url).pathname], {stdio: 'inherit'});
});
