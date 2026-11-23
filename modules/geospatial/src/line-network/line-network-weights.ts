// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {LineNetwork, LineNetworkEdgeWeight} from './build-line-network';

/** Routing cost policy for a network whose topology has already been built. */
export type LineNetworkWeightOptions = {
  /** Multiplier for each source path's physical edge lengths. */
  pathWeightFactors?: ArrayLike<number>;
  /** Computes the cost of each edge. Requires includePathFractions at build time. */
  edgeWeight?: LineNetworkEdgeWeight;
};

/** Creates Float32 weights indexed by edge ID. Defaults to physical edge length. */
export function createLineNetworkWeights(
  network: Pick<
    LineNetwork,
    'edgePath' | 'edgeLength' | 'edgePathStartFraction' | 'edgePathEndFraction'
  >,
  {pathWeightFactors, edgeWeight}: LineNetworkWeightOptions = {}
): Float32Array {
  const {edgePath, edgeLength, edgePathStartFraction, edgePathEndFraction} = network;
  if (pathWeightFactors && edgeWeight)
    throw new Error('Specify pathWeightFactors or edgeWeight, not both');
  if (edgeWeight && (!edgePathStartFraction || !edgePathEndFraction)) {
    throw new Error('A custom edgeWeight requires includePathFractions');
  }
  const weights = new Float32Array(edgeLength.length);
  for (let edge = 0; edge < weights.length; edge++) {
    const path = edgePath[edge]!;
    const length = edgeLength[edge]!;
    const weight = edgeWeight
      ? edgeWeight(path, edgePathStartFraction![edge]!, edgePathEndFraction![edge]!, length)
      : length * (pathWeightFactors ? pathWeightFactors[path]! : 1);
    if (!(weight >= 0)) throw new RangeError('Edge weights must be zero or positive');
    weights[edge] = weight;
  }
  return weights;
}
