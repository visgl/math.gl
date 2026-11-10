// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
export type SurfaceMesh = {
  positions: Float64Array | Float32Array;
  texCoords: Float32Array;
  indices: Uint32Array;
  vertexCount: number;
  bounds?: number[];
  destination?: Float32Array;
  lifetime?: Float32Array;
  pieceCenters?: Float32Array;
  pieceAngles?: Float32Array;
  partIds?: Float32Array;
};
