// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {BitmapMesh} from '@deck.gl/map-layers';

export type SurfaceMesh = BitmapMesh & {
  bounds?: number[];
  destination?: Float32Array;
  lifetime?: Float32Array;
  pieceCenters?: Float32Array;
  pieceAngles?: Float32Array;
  partIds?: Float32Array;
};
