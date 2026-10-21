// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {createLayout, type MeshEdge} from './layout';
import {landArc, oceanWeight} from './geography';
import {createDymaxion} from './dymaxion';
import {edgeKey, type Polyhedron} from './polyhedra';

export type CutMode = 'legacy' | 'ocean' | 'dymaxion';
/** Compare every strategy against the legacy tree on the SAME mesh and seed. */
export function createCutLayout(input: Polyhedron, seed: number, mode: CutMode) {
  const preset = mode === 'dymaxion' ? createDymaxion() : undefined;
  const mesh = preset?.mesh || input;
  const exposure = new Map<string, number>();
  const land = (edge: MeshEdge) => {
    const key = edgeKey(edge.a, edge.b);
    if (!exposure.has(key))
      exposure.set(key, landArc(mesh.vertices[edge.a], mesh.vertices[edge.b]));
    return exposure.get(key)!;
  };
  const baseline = createLayout(mesh, seed);
  const layout =
    mode === 'legacy'
      ? baseline
      : createLayout(
          mesh,
          seed,
          preset
            ? {joins: preset.joins}
            : {
                weight: (edge, legacy) => oceanWeight(land(edge), legacy, mesh.faces.length)
              }
        );
  const cutLandKm = (edges: MeshEdge[]) =>
    edges.reduce((sum, e) => sum + (e.hinge ? 0 : land(e) * 6371), 0);
  return {...layout, cutLandKm: cutLandKm(layout.edges), baselineLandKm: cutLandKm(baseline.edges)};
}
