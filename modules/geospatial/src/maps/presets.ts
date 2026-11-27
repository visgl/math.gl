// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {createH3FaceMap} from './h3-face-map';

import {createElasticMap} from './elastic/map';

import {DiscontinuousMap, type MapBounds, type MapRegion} from './map-layout.js';

import {
  createInterruptedMap,
  createAirOceanMap,
  createGoodeMap,
  createInterruptedSinusoidalMap,
  createInterruptedMollweideMap,
  createInterruptedHomolosineMap,
  createGoodeOceanMap,
  createInterruptedBoggsMap,
  createInterruptedSinuMollweideMap,
  createInterruptedQuarticAuthalicMap,
  createInterruptedMollweideHemispheresMap
} from './preset-kernels';
import {createGrayFullerMap} from './preset-kernels';
import {createPetroffMap} from './petroff';
import {createIcosahedralSnyderMap, createDodecahedralSnyderMap} from './snyder';
import {createProjectionMap} from './projection-catalog';
import {createRegionalMap} from './regional-map';
import {createWorldMap} from './world-map';
import {createHealpixMap} from './healpix';
import {createAlbersUsaMap} from './albers-usa';
import {createMyriahedralMap, MyriahedralMap, restoreMyriahedralLayout} from './myriahedral';
import {MercatorMap} from './mercator-map';
import {
  createPeirceQuincuncialMap,
  createBerghausMap,
  createGingeryMap,
  createGuyouMap,
  createGringortenQuincuncialMap
} from './quincuncial-star';
import {createButterflyMap, createCollignonButterflyMap, createWatermanMap} from './polyhedral';

import type {MapPreset, MapDefinitionFor} from './map-engine';

export const elasticMapPreset: MapPreset = {
  type: 'elastic',
  create(definition, radius, options) {
    const d = definition as MapDefinitionFor<'elastic'>;
    return createElasticMap(d.data, {radius});
  }
};

export const projectionMapPreset: MapPreset = {
  type: 'projection',
  create(definition, radius, options) {
    const d = definition as MapDefinitionFor<'projection'>;
    return createProjectionMap({...d, radius});
  }
};

export const regionalMapPreset: MapPreset = {
  type: 'regional',
  create(definition, radius, options) {
    const d = definition as MapDefinitionFor<'regional'>;
    return createRegionalMap({...d, radius});
  }
};

export const worldMapPreset: MapPreset = {
  type: 'world',
  create(definition, radius, options) {
    const d = definition as MapDefinitionFor<'world'>;
    return createWorldMap({...d, radius});
  }
};

export const h3MapPreset: MapPreset = {
  type: 'h3',
  create(definition, radius, options) {
    return createH3FaceMap({radius});
  }
};

export const grayFullerMapPreset: MapPreset = {
  type: 'gray-fuller',
  create(definition, radius, options) {
    return createGrayFullerMap({radius});
  }
};

export const petroffMapPreset: MapPreset = {
  type: 'petroff',
  create(definition, radius, options) {
    const d = definition as MapDefinitionFor<'petroff'>;
    return createPetroffMap({...d, radius});
  }
};

export const iseaMapPreset: MapPreset = {
  type: 'isea',
  create(definition, radius, options) {
    return createIcosahedralSnyderMap({radius});
  }
};

export const dseaMapPreset: MapPreset = {
  type: 'dsea',
  create(definition, radius, options) {
    return createDodecahedralSnyderMap({radius});
  }
};

export const healpixMapPreset: MapPreset = {
  type: 'healpix',
  create(definition, radius, options) {
    const d = definition as MapDefinitionFor<'healpix'>;
    return createHealpixMap({...d, radius});
  }
};

export const gingeryMapPreset: MapPreset = {
  type: 'gingery',
  create(definition, radius, options) {
    const d = definition as MapDefinitionFor<'gingery'>;
    return createGingeryMap({...d, radius});
  }
};

export const interruptedMapPreset: MapPreset = {
  type: 'interrupted',
  create(definition, radius, options) {
    const d = definition as MapDefinitionFor<'interrupted'>;
    return createInterruptedMap({...d, radius});
  }
};

export const guyouMapPreset: MapPreset = {
  type: 'guyou',
  create(definition, radius, options) {
    const d = definition as MapDefinitionFor<'guyou'>;
    return createGuyouMap({...d, radius});
  }
};

export const gringortenQuincuncialMapPreset: MapPreset = {
  type: 'gringorten-quincuncial',
  create(definition, radius, options) {
    const d = definition as MapDefinitionFor<'gringorten-quincuncial'>;
    return createGringortenQuincuncialMap({...d, radius});
  }
};

export const butterflyMapPreset: MapPreset = {
  type: 'butterfly',
  create(definition, radius, options) {
    return createButterflyMap({radius});
  }
};

export const collignonButterflyMapPreset: MapPreset = {
  type: 'collignon-butterfly',
  create(definition, radius, options) {
    return createCollignonButterflyMap({radius});
  }
};

export const watermanMapPreset: MapPreset = {
  type: 'waterman',
  create(definition, radius, options) {
    return createWatermanMap({radius});
  }
};

export const goodeOceanMapPreset: MapPreset = {
  type: 'goode-ocean',
  create(definition, radius, options) {
    return createGoodeOceanMap({radius});
  }
};

export const interruptedBoggsMapPreset: MapPreset = {
  type: 'interrupted-boggs',
  create(definition, radius, options) {
    return createInterruptedBoggsMap({radius});
  }
};

export const interruptedSinuMollweideMapPreset: MapPreset = {
  type: 'interrupted-sinu-mollweide',
  create(definition, radius, options) {
    return createInterruptedSinuMollweideMap({radius});
  }
};

export const interruptedQuarticAuthalicMapPreset: MapPreset = {
  type: 'interrupted-quartic-authalic',
  create(definition, radius, options) {
    return createInterruptedQuarticAuthalicMap({radius});
  }
};

export const interruptedMollweideHemispheresMapPreset: MapPreset = {
  type: 'interrupted-mollweide-hemispheres',
  create(definition, radius, options) {
    return createInterruptedMollweideHemispheresMap({radius});
  }
};

export const peirceQuincuncialMapPreset: MapPreset = {
  type: 'peirce-quincuncial',
  create(definition, radius, options) {
    const d = definition as MapDefinitionFor<'peirce-quincuncial'>;
    return createPeirceQuincuncialMap({...d, radius});
  }
};

export const berghausMapPreset: MapPreset = {
  type: 'berghaus',
  create(definition, radius, options) {
    const d = definition as MapDefinitionFor<'berghaus'>;
    return createBerghausMap({...d, radius});
  }
};

export const mercatorMapPreset: MapPreset = {
  type: 'mercator',
  create(definition, radius, options) {
    const d = definition as MapDefinitionFor<'mercator'>;
    return new MercatorMap(radius, d.centralMeridian, d.maxLatitude);
  }
};

export const goodeMapPreset: MapPreset = {
  type: 'goode',
  create(definition, radius, options) {
    return createGoodeMap({radius});
  }
};

export const interruptedSinusoidalMapPreset: MapPreset = {
  type: 'interrupted-sinusoidal',
  create(definition, radius, options) {
    return createInterruptedSinusoidalMap({radius});
  }
};

export const interruptedMollweideMapPreset: MapPreset = {
  type: 'interrupted-mollweide',
  create(definition, radius, options) {
    return createInterruptedMollweideMap({radius});
  }
};

export const interruptedHomolosineMapPreset: MapPreset = {
  type: 'interrupted-homolosine',
  create(definition, radius, options) {
    return createInterruptedHomolosineMap({radius});
  }
};

export const airOceanMapPreset: MapPreset = {
  type: 'air-ocean',
  create(definition, radius, options) {
    return createAirOceanMap({radius});
  }
};

export const albersUsaMapPreset: MapPreset = {
  type: 'albers-usa',
  create(definition, radius, options) {
    const d = definition as MapDefinitionFor<'albers-usa'>;
    return createAlbersUsaMap({
      radius,
      includeTerritories: d.includeTerritories
    });
  }
};

export const myriahedralMapPreset: MapPreset = {
  type: 'myriahedral',
  create(definition, radius, options) {
    const d = definition as MapDefinitionFor<'myriahedral'>;

    const map = createMyriahedralMap({
      ...d,
      radius,
      isLand: options.isLand,
      edgeWeight: options.edgeWeight
    });
    return map;
  },
  restore: prepared => new MyriahedralMap({}, restoreMyriahedralLayout(prepared))
};

export const customMapPreset: MapPreset = {
  type: 'custom',
  create(definition, radius, options) {
    const d = definition as MapDefinitionFor<'custom'>;
    return new DiscontinuousMap(
      d.charts.map(chart => {
        const projection = options.projections?.[chart.projection];
        if (!projection) throw new Error(`Missing projection binding: ${chart.projection}`);
        // Custom bindings return unit-radius local coordinates; placement is
        // specified in unit-radius map coordinates, then scaled uniformly.
        const placement = (chart.placement ?? [1, 0, 0, 1, 0, 0]).map(
          v => v * radius
        ) as unknown as MapRegion['placement'];
        const layout = chart.layout
          ? {
              ...chart.layout,
              frame: chart.layout.frame?.map(v => v * radius) as unknown as MapBounds | undefined
            }
          : undefined;
        return {...chart, ...projection, placement, layout};
      })
    );
  }
};

/** Explicit opt-in to the complete catalogue. Prefer individual presets. */
export const mapPresets: readonly MapPreset[] = [
  elasticMapPreset,
  projectionMapPreset,
  regionalMapPreset,
  worldMapPreset,
  h3MapPreset,
  grayFullerMapPreset,
  petroffMapPreset,
  iseaMapPreset,
  dseaMapPreset,
  healpixMapPreset,
  gingeryMapPreset,
  interruptedMapPreset,
  guyouMapPreset,
  gringortenQuincuncialMapPreset,
  butterflyMapPreset,
  collignonButterflyMapPreset,
  watermanMapPreset,
  goodeOceanMapPreset,
  interruptedBoggsMapPreset,
  interruptedSinuMollweideMapPreset,
  interruptedQuarticAuthalicMapPreset,
  interruptedMollweideHemispheresMapPreset,
  peirceQuincuncialMapPreset,
  berghausMapPreset,
  mercatorMapPreset,
  goodeMapPreset,
  interruptedSinusoidalMapPreset,
  interruptedMollweideMapPreset,
  interruptedHomolosineMapPreset,
  airOceanMapPreset,
  albersUsaMapPreset,
  myriahedralMapPreset,
  customMapPreset
];
