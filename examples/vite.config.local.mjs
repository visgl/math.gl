// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {existsSync, readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {getOcularConfig} from '@vis.gl/dev-tools';
import {defineConfig, loadConfigFromFile, mergeConfig} from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));

/** Preserve each example's Vite options while developing against workspace source. */
export default defineConfig(async environment => {
  const {aliases} = await getOcularConfig({root});
  const sourceAliases = new Map();
  for (const [name, sourceDirectory] of Object.entries(aliases)) {
    if (!name.startsWith('@math.gl/') || name.endsWith('/test')) continue;
    const moduleRoot = dirname(sourceDirectory);
    const {exports} = JSON.parse(readFileSync(resolve(moduleRoot, 'package.json'), 'utf8'));
    for (const [endpoint, entry] of Object.entries(exports)) {
      const published = typeof entry === 'string' ? entry : entry.import;
      const source = typeof entry === 'object' && entry.source;
      // Grouped endpoints and data exports do not always match src/<endpoint>.
      const target = source || published.replace(/^\.\/dist\//, './src/').replace(/\.js$/, '.ts');
      const replacement = resolve(moduleRoot, target);
      if (!existsSync(replacement)) throw new Error(`Missing source for ${name}/${endpoint}`);
      const specifier = endpoint === '.' ? name : name + endpoint.slice(1);
      sourceAliases.set(specifier, replacement);
    }
  }
  const projectConfig = await loadConfigFromFile(
    environment,
    resolve(process.cwd(), 'vite.config.js')
  );
  const sourcePlugin = () => ({
    name: 'math-gl-local-source',
    enforce: 'pre',
    resolveId(id, importer) {
      // deck.gl dependencies retain their installed math.gl version.
      if (importer?.includes('/node_modules/')) return;
      const query = id.indexOf('?');
      const specifier = query < 0 ? id : id.slice(0, query);
      const replacement = sourceAliases.get(specifier);
      if (replacement) {
        return this.resolve(replacement + (query < 0 ? '' : id.slice(query)), importer, {
          skipSelf: true
        });
      }
    }
  });
  return mergeConfig(projectConfig?.config || {}, {
    plugins: [sourcePlugin()],
    // Worker bundles need the same source resolution as their parent application.
    worker: {plugins: () => [sourcePlugin()]}
  });
});
