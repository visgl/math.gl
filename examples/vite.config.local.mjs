// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import getMathGlSourceAliases from '../scripts/math-gl-source-aliases.cjs';
import {defineConfig, loadConfigFromFile, mergeConfig} from 'vite';

/** Preserve each example's Vite options while developing against workspace source. */
export default defineConfig(async environment => {
  const projectConfig = await loadConfigFromFile(environment, undefined, process.cwd());
  return mergeConfig(projectConfig?.config || {}, {
    // Aliases cover dependency optimization and worker bundles as well as application imports.
    resolve: {
      alias: Object.entries(getMathGlSourceAliases()).map(([name, replacement]) => ({
        find: new RegExp(`^${name.replaceAll('.', '\\.')}(?=$|\\?)`),
        replacement
      }))
    }
  });
});
