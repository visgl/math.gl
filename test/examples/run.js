// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {existsSync, readdirSync, readFileSync} from 'node:fs';
import {dirname, join, relative, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';

const directory = fileURLToPath(new URL('.', import.meta.url));
const root = fileURLToPath(new URL('../../', import.meta.url));
const args = process.argv.slice(2);
const list = args.includes('--list');
const [mode = 'all', filter = ''] = args.filter(arg => arg !== '--list');
if (!['all', 'node', 'browser'].includes(mode) || args.filter(arg => arg !== '--list').length > 2) {
  throw new Error('Usage: node test/examples/run.js [all|node|browser] [filter] [--list]');
}

function filesIn(folder) {
  return readdirSync(folder, {withFileTypes: true}).flatMap(entry => {
    const path = join(folder, entry.name);
    return entry.isDirectory() ? filesIn(path) : [path];
  });
}

const moduleDirectories = readdirSync(join(root, 'modules'))
  .map(name => join(root, 'modules', name, 'test', 'examples'))
  .filter(path => existsSync(path));
const files = [directory, ...moduleDirectories].flatMap(filesIn).sort();
// Module suites mirror examples/<module>/<application>; root checks are shared infrastructure.
function examplePath(path) {
  const parts = relative(root, path).split(sep);
  return parts[0] === 'modules'
    ? [parts[1], ...parts.slice(4)].join('/')
    : relative(directory, path).split(sep).join('/');
}
const matches = path => examplePath(path).includes(filter);
const nodeTests =
  mode === 'browser'
    ? []
    : files.filter(path => /\.test\.(?:js|mjs|ts)$/.test(path) && matches(path));
// A run-browser entry owns its fixtures and subordinate scripts (the solar demo).
const browserTests =
  mode === 'node'
    ? []
    : files.filter(
        path => /(?:^|[/\\])(?:browser-test|run-browser)\.mjs$/.test(path) && matches(path)
      );
const typeConfigs = files.filter(
  path =>
    path.endsWith(`${sep}tsconfig.json`) &&
    nodeTests.some(test => test.startsWith(dirname(path) + sep))
);
if (!nodeTests.length && !browserTests.length)
  throw new Error(`No example checks match "${filter}"`);

async function run(label, executable, arguments_) {
  // This CLI reports which example owns a failing subprocess.
  // biome-ignore lint/suspicious/noConsole: Progress labels are the test runner's output.
  console.log(`\n${label}`);
  const code = await new Promise((resolve, reject) => {
    const child = spawn(executable, arguments_, {cwd: root, stdio: 'inherit'});
    child.on('error', reject);
    child.on('close', resolve);
  });
  if (code !== 0) throw new Error(`${label} failed (${code ?? 'terminated'})`);
}

const built = new Set();
async function build(project) {
  if (built.has(project)) return;
  const pkg = JSON.parse(readFileSync(join(root, 'examples', project, 'package.json'), 'utf8'));
  await run(`Build: ${project}`, 'yarn', ['workspace', pkg.name, 'build']);
  built.add(project);
}

if (list) {
  // biome-ignore lint/suspicious/noConsole: List the discovered checks without executing them.
  console.log(
    [join(directory, 'check-boundaries.js'), ...typeConfigs, ...nodeTests, ...browserTests]
      .map(path => relative(root, path))
      .join('\n')
  );
} else {
  await run('Example import boundaries', process.execPath, [
    join(directory, 'check-boundaries.js')
  ]);
  // Preserve application build coverage when CI selects only Node workflows.
  const nodeProjects = new Set(
    nodeTests
      .map(path => examplePath(path).split('/'))
      .filter(parts => parts.length >= 3)
      .map(parts => parts.slice(0, 2).join('/'))
  );
  for (const project of nodeProjects) await build(project);
  for (const config of typeConfigs) {
    await run(`Type check: ${relative(directory, dirname(config))}`, process.execPath, [
      join(root, 'node_modules/typescript/bin/tsc'),
      '--project',
      config
    ]);
  }
  if (nodeTests.length) {
    await run(`Node example checks (${nodeTests.length} files)`, process.execPath, [
      '--experimental-strip-types',
      '--test',
      ...nodeTests
    ]);
  }
  for (const script of browserTests) {
    const parts = examplePath(script).split('/');
    const project = parts.slice(0, 2).join('/');
    // Preview-based checks need dist; the solar harness builds its own test pages.
    if (!script.endsWith(`${sep}run-browser.mjs`)) await build(project);
    await run(`Browser: ${relative(directory, script)}`, process.execPath, [script]);
  }
}
