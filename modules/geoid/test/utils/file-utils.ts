// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import fs from 'fs';

export async function openFile(filePath: string): Promise<Uint8Array | null> {
  let data: Uint8Array | null = null;
  if (fs && 'promises' in fs) {
    data = await fs.promises.readFile(filePath);
  } else if (typeof fetch !== 'undefined') {
    const request = await fetch(filePath);
    data = new Uint8Array(await request.arrayBuffer());
  }
  return data;
}
