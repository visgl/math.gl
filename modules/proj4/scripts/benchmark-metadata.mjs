// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {createHash} from 'node:crypto';
import {readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
/** Fingerprint source inputs without embedding machine-specific checkout paths. */
export function codeFingerprint() {
  const hash = createHash('sha256');
  const root = fileURLToPath(new URL('../../../modules/', import.meta.url));
  function visit(relative) {
    for (const entry of readdirSync(join(root, relative), {withFileTypes: true}).sort((a, b) =>
      a.name.localeCompare(b.name)
    )) {
      const path = join(relative, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile()) hash.update(path + '\0').update(readFileSync(join(root, path)));
    }
  }
  for (const name of ['core', 'crs', 'proj4', 'types']) visit(name + '/src');
  return hash.digest('hex');
}
