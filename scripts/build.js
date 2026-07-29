import {spawnSync} from 'node:child_process';
import {readdir, readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import esbuild from 'esbuild';
import {rewriteModuleSpecifiers} from './rewrite-module-specifiers.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const modulesRoot = path.join(repoRoot, 'modules');
const modulePackages = [];

for (const entry of await readdir(modulesRoot, {withFileTypes: true})) {
  if (!entry.isDirectory()) {
    continue;
  }

  const moduleDirectory = path.join(modulesRoot, entry.name);
  try {
    const packageJson = JSON.parse(
      await readFile(path.join(moduleDirectory, 'package.json'), 'utf8')
    );
    modulePackages.push({moduleDirectory, packageJson});
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }
}

const moduleDirectories = modulePackages.map(({moduleDirectory}) => moduleDirectory);
const projects = moduleDirectories.map(moduleDirectory =>
  path.relative(repoRoot, path.join(moduleDirectory, 'tsconfig.json'))
);

const result = spawnSync('tsc', ['--build', ...projects], {
  cwd: repoRoot,
  stdio: 'inherit'
});

if (result.error) {
  throw result.error;
}
if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

await rewriteModuleSpecifiers(moduleDirectories);

for (const {moduleDirectory, packageJson} of modulePackages) {
  const entryPoints = getCommonJSEntryPoints(packageJson.exports);

  for (const entryPoint of entryPoints) {
    await esbuild.build({
      entryPoints: [path.resolve(moduleDirectory, entryPoint.input)],
      outfile: path.resolve(moduleDirectory, entryPoint.output),
      bundle: true,
      format: 'cjs',
      target: 'node16',
      packages: 'external',
      sourcemap: true,
      logLevel: 'info'
    });
  }
}

function getCommonJSEntryPoints(exportsField) {
  const entryPoints = [];
  visitExport(exportsField);
  return entryPoints;

  function visitExport(value) {
    if (!value || typeof value !== 'object') {
      return;
    }
    if (typeof value.import === 'string' && typeof value.require === 'string') {
      entryPoints.push({input: value.import, output: value.require});
      return;
    }
    for (const nestedValue of Object.values(value)) {
      visitExport(nestedValue);
    }
  }
}
