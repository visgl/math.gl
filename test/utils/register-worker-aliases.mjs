// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {statSync} from 'node:fs';
import {registerHooks} from 'node:module';

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      const alias = /^@math\.gl\/([^/]+)\/(.+)$/.exec(specifier);
      if (error.code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED' || !alias) throw error;

      // Keep public exports authoritative; only private test subpaths use this fallback.
      const base = new URL(`../../modules/${alias[1]}/dist/${alias[2]}`, import.meta.url);
      for (const url of [base, new URL(`${base.href}.js`), new URL(`${base.href}/index.js`)]) {
        try {
          if (statSync(url).isFile()) return {url: url.href, shortCircuit: true};
        } catch {
          // Try the next supported built-file layout before preserving Node's error.
        }
      }
      throw error;
    }
  }
});
