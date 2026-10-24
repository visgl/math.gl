// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  DiscontinuousMap,
  type GeographicPosition,
  type MapBounds,
  type MapRegion,
  type MapSamplingOptions
} from './map-layout';
import {
  getMapLayout,
  fitMapLayout,
  pickMapLayout,
  type MapLayout,
  type MapViewportOptions
} from './layout';
import {
  createAirOceanMap,
  createGoodeMap,
  createInterruptedSinusoidalMap,
  createInterruptedMollweideMap,
  createInterruptedHomolosineMap
} from './presets';
import {createAlbersUsaMap} from './albers-usa';
import {createMyriahedralMap, type MyriahedralOptions, type MyriahedralLayout} from './myriahedral';
import {MercatorMap} from './mercator-map';
import {createPeirceQuincuncialMap, createBerghausMap} from './quincuncial-star';
import {geographic} from './math';

/** Serializable chart: runtime projection callbacks are resolved by key. */
export type MapChartDescription = Omit<MapRegion, 'project' | 'unproject'> & {projection: string};
export type MapDefinition =
  | {type: 'peirce-quincuncial'; centralMeridian?: number}
  | {type: 'berghaus'; centralMeridian?: number; lobes?: number}
  | {type: 'mercator'; centralMeridian?: number; maxLatitude?: number}
  | {
      type:
        | 'goode'
        | 'interrupted-sinusoidal'
        | 'interrupted-mollweide'
        | 'interrupted-homolosine'
        | 'air-ocean';
    }
  | {type: 'albers-usa'; includeTerritories?: boolean}
  | ({type: 'myriahedral'} & Omit<MyriahedralOptions, 'radius' | 'isLand' | 'edgeWeight'>)
  | {type: 'custom'; charts: readonly MapChartDescription[]};
/** Data only. All inputs are spherical longitude/latitude in degrees. */
export type MapDescription = {
  version: 1;
  id: string;
  title?: string;
  /** Positive output scale; default 1. Does not select an ellipsoidal datum. */
  radius?: number;
  attribution?: readonly string[];
  definition: MapDefinition;
};
export type MapEngineOptions = {
  projections?: Readonly<Record<string, Pick<MapRegion, 'project' | 'unproject'>>>;
  isLand?: MyriahedralOptions['isLand'];
  edgeWeight?: MyriahedralOptions['edgeWeight'];
  sampling?: MapSamplingOptions;
};
export type MapCapabilities = Readonly<{
  hasCuts: boolean;
  hasInsets: boolean;
  /** More than one connected component of the sampled continuous-join graph. */
  disjoint: boolean;
  hinged: boolean;
  globe: true;
}>;
export type MapState = {type: 'map' | 'globe'} | {type: 'hinge'; amount: number};
export type MapPosition3D = [number, number, number];
export type MapTransitionPlan = Readonly<{
  strategy: 'direct' | 'via-globe';
  reason: string;
  /** Geometry is re-split for the destination; correspondence uses source coordinates. */
  resplit: boolean;
  coverage: 'preserve' | 'fade-unmatched';
  sourceHinge: boolean;
  targetHinge: boolean;
}>;

/** Snapshot plain data without silently dropping callbacks, NaN or Infinity. */
function snapshot<T>(value: T): T {
  if (
    value === undefined ||
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean'
  )
    return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return Object.freeze(value.map(snapshot)) as T;
  if (typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype)
    return Object.freeze(
      Object.fromEntries(Object.entries(value).map(([key, item]) => [key, snapshot(item)]))
    ) as T;
  throw new Error(
    'MapDescription must contain only finite JSON data; pass callbacks in MapEngineOptions'
  );
}

/** One spherical chart pipeline for ordinary, interrupted, inset and hinged maps. */
export class MapEngine {
  readonly description: Readonly<MapDescription>;
  readonly capabilities: MapCapabilities;
  readonly motion?: MyriahedralLayout;
  private readonly map: DiscontinuousMap;
  private readonly sampling: MapSamplingOptions;
  private cachedLayout?: MapLayout;
  private flat?: number[][][];

  constructor(description: MapDescription, options: MapEngineOptions = {}) {
    this.description = snapshot(description);
    if (description.version !== 1 || typeof description.id !== 'string' || !description.id)
      throw new Error('Expected MapDescription version 1 and a nonempty id');
    const radius = description.radius ?? 1;
    if (!Number.isFinite(radius) || radius <= 0)
      throw new Error('Radius must be finite and positive');
    this.sampling = {...options.sampling};
    const d = this.description.definition;
    switch (d.type) {
      case 'peirce-quincuncial':
        this.map = createPeirceQuincuncialMap({...d, radius});
        break;
      case 'berghaus':
        this.map = createBerghausMap({...d, radius});
        break;
      case 'mercator':
        this.map = new MercatorMap(radius, d.centralMeridian, d.maxLatitude);
        break;
      case 'goode':
        this.map = createGoodeMap({radius});
        break;
      case 'interrupted-sinusoidal':
        this.map = createInterruptedSinusoidalMap({radius});
        break;
      case 'interrupted-mollweide':
        this.map = createInterruptedMollweideMap({radius});
        break;
      case 'interrupted-homolosine':
        this.map = createInterruptedHomolosineMap({radius});
        break;
      case 'air-ocean':
        this.map = createAirOceanMap({radius});
        break;
      case 'albers-usa':
        this.map = createAlbersUsaMap({radius, includeTerritories: d.includeTerritories});
        break;
      case 'myriahedral': {
        const map = createMyriahedralMap({
          ...d,
          radius,
          isLand: options.isLand,
          edgeWeight: options.edgeWeight
        });
        this.map = map;
        this.motion = map.layout;
        break;
      }
      case 'custom':
        this.map = new DiscontinuousMap(
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
                  frame: chart.layout.frame?.map(v => v * radius) as unknown as
                    | MapBounds
                    | undefined
                }
              : undefined;
            return {...chart, ...projection, placement, layout};
          })
        );
        break;
      default:
        throw new Error('Unknown map definition');
    }
    const groups = new Map(this.regions.map(r => [r.id, r.id]));
    for (const seam of this.seams)
      if (seam.kind === 'join') {
        const first = groups.get(seam.regions[0]);
        for (const id of seam.regions.slice(1)) {
          const previous = groups.get(id);
          for (const [key, group] of groups) if (group === previous) groups.set(key, first!);
        }
      }
    this.capabilities = Object.freeze({
      hasCuts: this.seams.some(s => s.kind === 'cut'),
      hasInsets: this.regions.some(r => r.layout?.kind === 'inset'),
      disjoint: new Set(groups.values()).size > 1,
      hinged: Boolean(this.motion),
      globe: true
    });
  }
  get regions() {
    return this.map.regions;
  }
  get seams() {
    return this.map.seams;
  }
  findRegions(position: GeographicPosition) {
    return this.map.findRegions(position);
  }
  projectPoint(position: GeographicPosition, regionId?: string) {
    return this.map.projectPoint(position, regionId);
  }
  unprojectPoint(position: GeographicPosition, regionId?: string) {
    return this.map.unprojectPoint(position, regionId);
  }
  projectLine(line: readonly GeographicPosition[], options?: MapSamplingOptions) {
    return this.map.projectLine(line, {...this.sampling, ...options});
  }
  projectPolygon(rings: readonly (readonly GeographicPosition[])[], options?: MapSamplingOptions) {
    return this.map.projectPolygon(rings, {...this.sampling, ...options});
  }
  getLayout() {
    this.cachedLayout ??= getMapLayout(this.map, this.sampling);
    return this.cachedLayout;
  }
  fit(options: MapViewportOptions) {
    return fitMapLayout(this.getLayout(), options);
  }
  pick(viewport: ReturnType<typeof fitMapLayout>, pixel: GeographicPosition) {
    return pickMapLayout(this.map, viewport, pixel);
  }
  /** One sampling footprint per chart. Tile fetching and LOD selection remain renderer work. */
  getSamplingRegions(viewport: ReturnType<typeof fitMapLayout>) {
    return viewport.regions.map(region => ({
      ...region,
      boundary: this.regions.find(r => r.id === region.id)!.boundary,
      pixelsPerMapUnit: viewport.scale,
      /** Local pixel lengths per longitude/latitude radian, or null at a singularity/outside coverage. */
      getPixelScale: (position: GeographicPosition): [number, number] | null => {
        const origin = this.projectPoint(position, region.id);
        if (!origin) return null;
        const step = 1e-5;
        const scale = [0, 1].map(axis => {
          for (const sign of [1, -1]) {
            const p: [number, number] = [...position];
            p[axis] += sign * step;
            if (Math.abs(p[1]) > 90) continue;
            const next = this.projectPoint(p, region.id);
            if (next)
              return (
                (Math.hypot(
                  next.position[0] - origin.position[0],
                  next.position[1] - origin.position[1]
                ) *
                  viewport.scale) /
                ((step * Math.PI) / 180)
              );
          }
          return NaN;
        });
        return scale.every(Number.isFinite) ? (scale as [number, number]) : null;
      }
    }));
  }
  /** Freeze a pose once per animation frame; reuse for every vertex in that frame. */
  evaluate(state: MapState = {type: 'map'}) {
    state = {...state};
    const radius = this.description.radius ?? 1;
    if (!['map', 'globe', 'hinge'].includes(state.type)) throw new Error('Unknown map state');
    if (
      state.type === 'hinge' &&
      (!this.motion || !Number.isFinite(state.amount) || state.amount < 0 || state.amount > 1)
    )
      throw new Error('Hinge state requires a hinged map and amount in [0, 1]');
    const transforms = new Map<
      string,
      {origin: number[]; flat: number[]; u: number[]; v: number[]}
    >();
    if (state.type === 'hinge') {
      this.flat ??= this.motion!.evaluate(1);
      const flat = this.flat;
      const posed = this.motion!.evaluate(state.amount);
      flat.forEach((f, i) => {
        const p = posed[i];
        const edgeScale = Math.hypot(f[1][0] - f[0][0], f[1][1] - f[0][1]);
        const ax = (f[1][0] - f[0][0]) / edgeScale,
          ay = (f[1][1] - f[0][1]) / edgeScale;
        // Meshes may have collinear boundary subdivisions. Pick a full basis.
        const j = f.findIndex(
          q =>
            Math.abs(ax * ((q[1] - f[0][1]) / edgeScale) - ay * ((q[0] - f[0][0]) / edgeScale)) >
            1e-12
        );
        if (j < 0) throw new Error('Degenerate panel frame');
        const bx = (f[j][0] - f[0][0]) / edgeScale,
          by = (f[j][1] - f[0][1]) / edgeScale,
          determinant = ax * by - ay * bx;
        transforms.set(this.regions[i].id, {
          origin: p[0],
          flat: f[0],
          u: p[0].map(
            (_, k) =>
              (((p[1][k] - p[0][k]) / edgeScale) * by - ((p[j][k] - p[0][k]) / edgeScale) * ay) /
              determinant
          ),
          v: p[0].map(
            (_, k) =>
              (((p[j][k] - p[0][k]) / edgeScale) * ax - ((p[1][k] - p[0][k]) / edgeScale) * bx) /
              determinant
          )
        });
      });
    }
    const projectPlacedPoint = (xy: GeographicPosition, regionId: string): MapPosition3D | null => {
      if (!xy.every(Number.isFinite)) throw new Error('Expected finite map coordinates');
      if (state.type === 'globe') {
        const hit = this.unprojectPoint(xy, regionId)[0];
        return hit ? (geographic(hit.position).map(v => v * radius) as MapPosition3D) : null;
      }
      if (state.type === 'map')
        return this.regions.some(r => r.id === regionId) ? [xy[0], xy[1], 0] : null;
      const f = transforms.get(regionId);
      return f
        ? (f.origin.map(
            (v, k) => v + f.u[k] * (xy[0] - f.flat[0]) + f.v[k] * (xy[1] - f.flat[1])
          ) as MapPosition3D)
        : null;
    };
    const projectPoint = (position: GeographicPosition, regionId?: string) => {
      const hit = this.projectPoint(position, regionId);
      if (!hit) return null;
      const point =
        state.type === 'globe'
          ? (geographic(position).map(v => v * radius) as MapPosition3D)
          : projectPlacedPoint(hit.position, hit.regionId)!;
      return {regionId: hit.regionId, position: point};
    };
    return Object.freeze({
      projectPoint,
      projectPlacedPoint,
      projectLine: (line: readonly GeographicPosition[], options?: MapSamplingOptions) =>
        this.projectLine(line, options).map(part => ({
          ...part,
          coordinates: part.coordinates.map((p, i) =>
            state.type === 'globe'
              ? (geographic(part.sourceCoordinates[i]).map(v => v * radius) as MapPosition3D)
              : projectPlacedPoint(p, part.regionId)!
          )
        })),
      projectPolygon: (
        rings: readonly (readonly GeographicPosition[])[],
        options?: MapSamplingOptions
      ) =>
        this.projectPolygon(rings, options).map(part => ({
          ...part,
          coordinates: part.coordinates.map((ring, j) =>
            ring.map((p, i) =>
              state.type === 'globe'
                ? (geographic(part.sourceCoordinates[j][i]).map(v => v * radius) as MapPosition3D)
                : projectPlacedPoint(p, part.regionId)!
            )
          )
        }))
    });
  }
  /** Conservative recommendation, not a camera animation or a topology morph. */
  planTransitionTo(target: MapEngine): MapTransitionPlan {
    const same = this === target;
    return Object.freeze({
      strategy: same ? 'direct' : 'via-globe',
      reason: same
        ? 'The compiled chart topology and coverage are unchanged.'
        : 'Re-split geometry on the shared spherical reference before entering the target layout.',
      resplit: !same,
      coverage: same ? 'preserve' : 'fade-unmatched',
      sourceHinge: Boolean(this.motion),
      targetHinge: Boolean(target.motion)
    });
  }
}
