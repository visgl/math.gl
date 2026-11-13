// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
declare module 'cdt2d' {
  export default function triangulate(
    points: [number, number][],
    edges: [number, number][],
    options?: {exterior?: boolean; delaunay?: boolean}
  ): [number, number, number][];
}
