// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {existsSync, readFileSync} from 'node:fs';
import {join, relative} from 'node:path';

/** Identical source resolution/bundling for historical and candidate runtimes. */
export async function bundleRuntime(root, entry, outfile, baselineCommit) {
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
            const parts = args.path.split('/'),
              module = parts[1],
              subpath = parts.slice(2).join('/');
            const metadata = JSON.parse(
              readFileSync(join(root, 'modules', module, 'package.json'), 'utf8')
            );
            const entry = metadata.exports[subpath ? './' + subpath : '.'];
            const source = join(
              root,
              'modules',
              module,
              (typeof entry === 'string' ? entry : entry.import)
                .replace('./dist/', 'src/')
                .replace(/\.js$/, '.ts')
            );
            if (!existsSync(source)) throw new Error('Cannot resolve runtime source: ' + args.path);
            return {path: source};
          });
          if (baselineCommit)
            builder.onLoad({filter: /\/modules\/.*\/src\/.*\.(ts|json)$/}, args => ({
              contents: execFileSync(
                'git',
                ['show', baselineCommit + ':' + relative(root, args.path)],
                {cwd: root, encoding: 'utf8'}
              ),
              loader: args.path.endsWith('.json') ? 'json' : 'ts'
            }));
        }
      }
    ]
  });
}
