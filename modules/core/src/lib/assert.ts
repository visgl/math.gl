// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export function assert(condition: unknown, message?: string): void {
  if (!condition) {
    throw new Error(`math.gl assertion ${message}`);
  }
}
