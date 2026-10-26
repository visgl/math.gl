// math.gl
// SPDX-License-Identifier: ISC
// SPDX-FileCopyrightText: Copyright 2010-2024 Mike Bostock
// Adapted from d3-geo 3.1.1; see ./D3-GEO-LICENSE.txt.

import noop from './noop.js';

export default function () {
  var lines = [],
    line;
  return {
    point: function (x, y, m) {
      line.push([x, y, m]);
    },
    lineStart: function () {
      lines.push((line = []));
    },
    lineEnd: noop,
    rejoin: function () {
      if (lines.length > 1) lines.push(lines.pop().concat(lines.shift()));
    },
    result: function () {
      var result = lines;
      lines = [];
      line = null;
      return result;
    }
  };
}
