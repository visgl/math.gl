// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {dirname, join, relative, resolve} from 'node:path';

/** Use the same workload with sources and export maps from each runtime's revision. */
export async function bundleRuntime(root, entry, outfile, baselineCommit) {
  const sources = new Map();
  const git = path => {
    if (sources.has(path)) {
      const cached = sources.get(path);
      if (cached instanceof Error) throw cached;
      return cached;
    }
    try {
      const contents = execFileSync('git', ['show', baselineCommit + ':' + path], {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
      });
      sources.set(path, contents);
      return contents;
    } catch (error) {
      sources.set(path, error);
      throw error;
    }
  };
  let legacy = false;
  if (baselineCommit) {
    try {
      git('modules/projection/package.json');
    } catch {
      git('modules/proj4/package.json');
      legacy = true;
    }
  }
  const historicalPath = path =>
    legacy
      ? path
          .replace(/^modules\/projection\//, 'modules/proj4/')
          .replace('src/lib/projection.ts', 'src/lib/typescript-proj4-projection.ts')
      : path;
  const sourceResult = path => ({
    path,
    ...(baselineCommit && /\/modules\/.*\/src\//.test(path) ? {namespace: 'historical'} : {})
  });
  await build({
    entryPoints: [join(root, entry)],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    tsconfigRaw: {},
    plugins: [
      {
        name: 'historical-runtime-sources',
        setup(builder) {
          builder.onResolve({filter: /^@math\.gl\//}, args => {
            const parts = args.path.split('/');
            // Historical lazy descriptors may still refer to the former package name.
            const module = parts[1] === 'proj4' ? 'projection' : parts[1];
            const manifestPath = 'modules/' + module + '/package.json';
            const metadata = JSON.parse(
              baselineCommit
                ? git(historicalPath(manifestPath))
                : readFileSync(join(root, manifestPath), 'utf8')
            );
            const exported =
              metadata.exports[parts.length > 2 ? './' + parts.slice(2).join('/') : '.'];
            if (!exported) throw new Error('Cannot resolve runtime export: ' + args.path);
            const path = join(
              root,
              'modules',
              module,
              (typeof exported === 'string' ? exported : exported.import)
                .replace('./dist/', 'src/')
                .replace(/\.js$/, '.ts')
            );
            return sourceResult(path);
          });
          if (!baselineCommit) return;
          builder.onResolve({filter: /^\.\.?\//, namespace: 'historical'}, args => {
            const base = resolve(dirname(args.importer), args.path);
            for (const path of [
              base,
              base.replace(/\.js$/, '.ts'),
              base + '.ts',
              base + '.json',
              base + '/index.ts'
            ]) {
              try {
                git(historicalPath(relative(root, path)));
                return sourceResult(path);
              } catch {
                /* Try the next supported source extension. */
              }
            }
            throw new Error('Cannot resolve historical source: ' + args.path);
          });
          builder.onResolve({filter: /\/modules\/.*\/src\/.*\.ts$/}, args =>
            sourceResult(args.path)
          );
          // Workload files stay in the working tree so both runtimes perform identical work.
          builder.onResolve({filter: /^\.\.?\//, namespace: 'file'}, args => {
            const base = resolve(args.resolveDir, args.path);
            if (!/\/modules\/.*\/src\//.test(base)) return;
            for (const path of [
              base,
              base.replace(/\.js$/, '.ts'),
              base + '.ts',
              base + '/index.ts'
            ]) {
              try {
                git(historicalPath(relative(root, path)));
                return sourceResult(path);
              } catch {
                /* Try the next supported source extension. */
              }
            }
            throw new Error('Cannot resolve historical source: ' + args.path);
          });
          builder.onLoad({filter: /\.(ts|js|json)$/, namespace: 'historical'}, args => ({
            contents: git(historicalPath(relative(root, args.path))),
            resolveDir: dirname(args.path),
            loader: args.path.endsWith('.json') ? 'json' : args.path.endsWith('.js') ? 'js' : 'ts'
          }));
        }
      }
    ]
  });
}
