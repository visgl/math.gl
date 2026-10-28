// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  MapEngine,
  type MyriahedralPreset,
  type MyriahedralSolid
} from '@math.gl/geospatial/discontinuous';
import {isLand} from '../../geometry/unfolding-polyhedron/geography';

/** Only UI/data adaptation lives here; mesh, cuts, projection and motion are library APIs. */
export function createMyriahedralLayout(level: number, seed: number, mode: string) {
  const solid = mode.startsWith('solid:') ? (mode.slice(6) as MyriahedralSolid) : undefined;
  const preset = solid
    ? 'polyhedral'
    : mode === 'ocean'
      ? 'sealine'
      : mode === 'legacy'
        ? 'cylindric'
        : (mode as MyriahedralPreset);
  const engine = new MapEngine(
    {
      version: 1,
      id: mode,
      definition: {
        type: 'myriahedral',
        preset,
        columns: [24, 48, 72, 96][level],
        solid,
        subdivisions: level,
        centralMeridian: 20 + (seed - 1) * 10
      }
    },
    {
      isLand: ([longitude, latitude]) => isLand(longitude, latitude)
    }
  );
  const layout = engine.motion!;
  return {
    ...layout,
    canRecut: !solid && preset !== 'cylindric' && preset !== 'azimuthal',
    cutLandKm: layout.cutLandRadians! * 6371,
    description: `${solid ?? preset} preset · sampled geography; land connectivity and overlap-free nets are not guaranteed.`
  };
}
