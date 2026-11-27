// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {AttributeInterpolationProvenance} from './interpolate-packed-attributes';

/** Compose child→intermediate and intermediate→original barycentric provenance.
 * Interpolate attributes only after composition, avoiding repeated integer rounding.
 * More than three distinct contributors rejects: this contract describes source
 * triangles, not arbitrary sparse blending. Zero-weight indices are ignored.
 */
export function composeAttributeProvenance(
  parent: AttributeInterpolationProvenance,
  child: AttributeInterpolationProvenance,
  options: {maxVertices?: number} = {}
): {sourceVertexIndices: Uint32Array; sourceVertexWeights: Float64Array} {
  const limit = options.maxVertices ?? 65536;
  if (!Number.isSafeInteger(limit) || limit < 0 || limit > 0xffffffff)
    throw new RangeError('Invalid provenance vertex limit');
  validate(parent);
  validate(child, parent.sourceVertexIndices.length / 3);
  if (child.sourceVertexIndices.length / 3 > limit)
    throw new RangeError('Provenance composition exceeded maxVertices');
  const indices = new Uint32Array(child.sourceVertexIndices.length);
  const weights = new Float64Array(indices.length);
  for (let vertex = 0; vertex < indices.length / 3; vertex++) {
    const contributors = new Map<number, number>();
    for (let j = 0; j < 3; j++) {
      const weight = child.sourceVertexWeights[3 * vertex + j];
      if (!weight) continue;
      const intermediate = child.sourceVertexIndices[3 * vertex + j];
      for (let k = 0; k < 3; k++) {
        const w = weight * parent.sourceVertexWeights[3 * intermediate + k];
        if (!w) continue;
        const index = parent.sourceVertexIndices[3 * intermediate + k];
        contributors.set(index, (contributors.get(index) ?? 0) + w);
      }
    }
    if (contributors.size > 3)
      throw new RangeError('Composed vertex spans multiple source triangles');
    const sum = Array.from(contributors.values()).reduce((a, b) => a + b, 0);
    let slot = 3 * vertex;
    for (const [index, weight] of contributors) {
      indices[slot] = index;
      weights[slot++] = weight / sum;
    }
  }
  return {sourceVertexIndices: indices, sourceVertexWeights: weights};
}

function validate(p: AttributeInterpolationProvenance, count = 0x100000000) {
  if (
    !Number.isSafeInteger(p.sourceVertexIndices.length) ||
    p.sourceVertexIndices.length < 0 ||
    p.sourceVertexIndices.length % 3 ||
    p.sourceVertexIndices.length !== p.sourceVertexWeights.length
  )
    throw new RangeError('Invalid provenance lengths');
  for (let i = 0; i < p.sourceVertexIndices.length; i += 3) {
    let sum = 0;
    for (let j = 0; j < 3; j++) {
      const w = p.sourceVertexWeights[i + j],
        index = p.sourceVertexIndices[i + j];
      if (
        !Number.isFinite(w) ||
        w < 0 ||
        w > 1 ||
        (w > 0 && (!Number.isSafeInteger(index) || index < 0 || index >= count))
      )
        throw new RangeError('Invalid provenance contributor');
      sum += w;
    }
    if (Math.abs(sum - 1) > 1e-10) throw new RangeError('Provenance weights must sum to one');
  }
}
