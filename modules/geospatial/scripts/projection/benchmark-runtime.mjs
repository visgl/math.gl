// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {existsSync, readFileSync, statSync} from 'node:fs';
import {dirname, join, relative, resolve} from 'node:path';

// Historical measurements keep using that revision's source tree and export map.
const moved = {
  types: ['core', 'types'],
  'geometry-utils': ['geometry', 'utils'],
  curves: ['geometry', 'curves'],
  polygon: ['geometry', 'polygon'],
  culling: ['geometry', 'culling'],
  'spatial-index': ['geometry', 'spatial-index'],
  crs: ['geospatial', 'crs'],
  projection: ['geospatial', 'projection'],
  wkb: ['geospatial', 'wkb'],
  geoarrow: ['geospatial', 'geoarrow'],
  geoid: ['earth', 'geoid'],
  sun: ['earth', 'sun'],
  timezone: ['earth', 'timezone']
};

export async function bundleRuntime(root, entry, outfile, baselineCommit) {
  const cache = new Map();
  // Reject Git tree objects: an extensionless import may name both a source
  // file and a directory. A tree listing is not loadable module source.
  function git(path) {
    if (!cache.has(path)) {
      try {
        cache.set(path, execFileSync('git', ['cat-file', 'blob', baselineCommit + ':' + path], {
          cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']
        }));
      } catch (error) {
        cache.set(path, error);
      }
    }
    const value = cache.get(path);
    if (value instanceof Error) throw value;
    return value;
  }
  let consolidated = true;
  if (baselineCommit) {
    try {git('modules/geospatial/src/projection/index.ts');}
    catch {consolidated = false;}
  }
  let legacy = false;
  if (baselineCommit && !consolidated) {
    try {git('modules/projection/package.json');}
    catch {git('modules/proj4/package.json'); legacy = true;}
  }
  function historicalPath(file) {
    if (!consolidated) {
      for (const [old, [group, leaf]] of Object.entries(moved)) {
        file = file.replace('modules/' + group + '/src/' + leaf + '/', 'modules/' + old + '/src/');
      }
    }
    return legacy ? file.replace(/^modules\/projection\//, 'modules/proj4/')
      .replace('src/lib/projection.ts', 'src/lib/typescript-proj4-projection.ts') : file;
  }
  const sourceResult = file => {
    const path = baselineCommit ? historicalPath(relative(root, file)) : relative(root, file);
    const parts = path.split(/[\\/]/);
    let sideEffects;
    if (parts[0] === 'modules' && parts.length > 2) {
      const manifest = parts.slice(0, 2).join('/') + '/package.json';
      let contents;
      try {contents = baselineCommit ? git(manifest) : readFileSync(join(root, manifest), 'utf8');}
      catch { /* Sources without package metadata retain conservative side effects. */ }
      const metadata = contents ? JSON.parse(contents) : {};
      // Virtual historical modules do not inherit filesystem package metadata.
      // Preserve explicit contracts. Literal lists are used by core; unknown
      // glob patterns stay conservative instead of guessing their semantics.
      if (metadata.sideEffects === false) sideEffects = false;
      else if (Array.isArray(metadata.sideEffects) &&
        metadata.sideEffects.every(pattern => !/[?*\[\]{}!]/.test(pattern))) {
        const packagePath = './' + parts.slice(2).join('/');
        sideEffects = metadata.sideEffects.includes(packagePath);
      }
    }
    return {
      path: baselineCommit ? join(root, path) : file,
      ...(baselineCommit ? {namespace: 'historical'} : {}),
      ...(sideEffects === false ? {sideEffects: false} : {})
    };
  };
  function resolveSource(base) {
    for (const file of [base, base.replace(/\.js$/, '.ts'), base + '.ts', base + '.js', base + '.json', base + '/index.ts']) {
      try {
        if (baselineCommit) git(historicalPath(relative(root, file)));
        else if (!statSync(file).isFile()) continue;
        return sourceResult(file);
      }
      catch { /* Try the next supported source extension. */ }
    }
    throw new Error('Cannot resolve runtime source: ' + base);
  }
  return build({
    entryPoints: [join(root, entry)], outfile, bundle: true, metafile: true,
    format: 'esm', platform: 'browser', target: 'es2020', tsconfigRaw: {},
    plugins: [{
      name: 'historical-runtime-sources',
      setup(builder) {
        builder.onResolve({filter: /^@math\.gl\//}, args => {
          let specifier = args.path;
          if (baselineCommit && !consolidated) {
            for (const [old, [group, leaf]] of Object.entries(moved)) {
              const prefix = '@math.gl/' + group + '/' + leaf;
              if (specifier === prefix || specifier.startsWith(prefix + '/')) {
                specifier = '@math.gl/' + old + specifier.slice(prefix.length);
                break;
              }
            }
          }
          const parts = specifier.split('/');
          const module = parts[1] === 'proj4' ? 'projection' : parts[1];
          const manifestPath = 'modules/' + module + '/package.json';
          const metadata = JSON.parse(baselineCommit
            ? git(historicalPath(manifestPath)) : readFileSync(join(root, manifestPath), 'utf8'));
          const exported = metadata.exports[parts.length > 2 ? './' + parts.slice(2).join('/') : '.'];
          // Private test aliases name source files without widening published package exports.
          if (!exported) return resolveSource(join(root, 'modules', module, 'src', ...parts.slice(2)));
          const target = typeof exported === 'string' ? exported : exported.import;
          return sourceResult(join(root, 'modules', module, target.replace('./dist/', 'src/').replace(/\.js$/, '.ts')));
        });
        if (!baselineCommit) return;
        builder.onResolve({filter: /^\.\.?\//, namespace: 'historical'}, args =>
          resolveSource(resolve(dirname(args.importer), args.path)));
        builder.onResolve({filter: /\/modules\/.*\/src\/.*\.ts$/}, args => resolveSource(args.path));
        builder.onResolve({filter: /^\.\.?\//, namespace: 'file'}, args => {
          const base = resolve(args.resolveDir, args.path);
          if (!/\/modules\/.*\/src\//.test(base)) return;
          return resolveSource(base);
        });
        builder.onLoad({filter: /\.(ts|js|json)$/, namespace: 'historical'}, args => {
          // esbuild's package resolver needs a directory present in this checkout.
          // Relative historical imports still resolve from args.importer above.
          let resolveDir = dirname(args.path);
          while (!existsSync(resolveDir)) resolveDir = dirname(resolveDir);
          return {
            contents: git(historicalPath(relative(root, args.path))).replace(
              /export \{ProjectionEngine, checkProjectionCompatibility\}/,
              'export {ProjectionEngine, ProjectionEngine as ProjectionTransform, checkProjectionCompatibility}'),
            resolveDir,
            loader: args.path.endsWith('.json') ? 'json' : args.path.endsWith('.js') ? 'js' : 'ts'
          };
        });
      }
    }]
  });
}
