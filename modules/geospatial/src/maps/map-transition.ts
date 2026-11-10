// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import polygonClipping from 'polygon-clipping';
import type {MapEngine, MapPosition3D} from './map-engine';
import type {GeographicPosition, MapSamplingOptions, MapRegion} from './map-layout';
import {geographic, type Position} from './math';
import {rectangle} from './elastic/geometry';

// Qualified default world formulas with finite coverage and no interior cuts.
// Keep this explicit: a newly registered kernel is not automatically qualified.
// Bertin and Sinu-Mollweide need rotated-chart coverage fixes; Gringorten has
// interior cuts. Singular or folded formulas and parameter overrides remain
// conservative until their endpoint coverage and correspondence are qualified.
const directWorldProjections = new Set([
  'gilbert',
  'aitoff',
  'august',
  'baker',
  'boggs',
  'bromley',
  'collignon',
  'craster',
  'eckert1',
  'eckert2',
  'eckert3',
  'eckert4',
  'eckert5',
  'eckert6',
  'fahey',
  'foucaut',
  'ginzburg4',
  'ginzburg5',
  'ginzburg6',
  'ginzburg8',
  'ginzburg9',
  'homolosine',
  'kavrayskiy7',
  'larrivee',
  'laskowski',
  'miller',
  'mollweide',
  'mt-flat-polar-parabolic',
  'mt-flat-polar-quartic',
  'mt-flat-polar-sinusoidal',
  'natural-earth2',
  'nell-hammer',
  'patterson',
  'robinson',
  'sinusoidal',
  'times',
  'van-der-grinten',
  'van-der-grinten2',
  'van-der-grinten3',
  'van-der-grinten4',
  'wagner4',
  'wagner6',
  'winkel3',
  'bonne',
  'bottomley',
  'cylindrical-equal-area',
  'cylindrical-stereographic',
  'foucaut-sinusoidal',
  'hammer',
  'hill',
  'hufnagel',
  'hyperelliptical',
  'lagrange',
  'loximuthal',
  'wagner7',
  'quartic-authalic',
  'wagner'
]);

export type MapTransitionOptions = {strategy?: 'auto' | 'direct' | 'via-globe'};
export type MapTransitionPart = Readonly<{
  kind: 'line' | 'polygon';
  sourceRegionId?: string;
  targetRegionId?: string;
  sourceCoordinates: readonly (readonly GeographicPosition[])[];
  from: readonly (readonly GeographicPosition[])[];
  to: readonly (readonly GeographicPosition[])[];
}>;
export type MapTransitionFrame = {
  kind: 'line' | 'polygon';
  sourceRegionId?: string;
  targetRegionId?: string;
  coordinates: MapPosition3D[][];
  opacity: number;
};

/** Prepared geographic correspondence. Construct once, evaluate cheaply per frame.
 * Direct morphs preserve cuts, but can overlap or fold at intermediate times. */
export class MapTransitionGeometry {
  readonly parts: readonly MapTransitionPart[];
  constructor(
    parts: MapTransitionPart[],
    readonly strategy: 'direct' | 'via-globe',
    private radius: number
  ) {
    this.parts = Object.freeze(
      parts.map(p =>
        Object.freeze({
          ...p,
          sourceCoordinates: freezeRings(p.sourceCoordinates),
          from: freezeRings(p.from),
          to: freezeRings(p.to)
        })
      )
    );
  }
  evaluate(amount: number): MapTransitionFrame[] {
    validateAmount(amount);
    return this.parts.flatMap(part => {
      const sourcePhase = part.sourceRegionId !== undefined;
      const blend = Math.max(0, Math.min(1, (amount - 0.4) / 0.2));
      const opacity = this.strategy === 'direct' ? 1 : sourcePhase ? 1 - blend : blend;
      if (!opacity) return [];
      const t =
        this.strategy === 'direct'
          ? amount
          : sourcePhase
            ? Math.min(1, amount / 0.4)
            : Math.max(0, (amount - 0.6) / 0.4);
      return [
        {
          kind: part.kind,
          sourceRegionId: part.sourceRegionId,
          targetRegionId: part.targetRegionId,
          opacity,
          coordinates: part.sourceCoordinates.map((ring, j) =>
            ring.map((p, i) => {
              const a = part.from[j][i],
                b = part.to[j][i];
              if (this.strategy === 'direct')
                return [a[0] * (1 - t) + b[0] * t, a[1] * (1 - t) + b[1] * t, 0] as MapPosition3D;
              const globe = geographic(p).map(v => v * this.radius);
              const flat = sourcePhase ? a : b,
                weight = sourcePhase ? 1 - t : t;
              return [
                flat[0] * weight + globe[0] * (1 - weight),
                flat[1] * weight + globe[1] * (1 - weight),
                globe[2] * (1 - weight)
              ] as MapPosition3D;
            })
          )
        }
      ];
    });
  }
}

/** A renderer owns time, easing, camera fitting and picking during motion. */
export class MapTransition {
  readonly strategy: 'direct' | 'via-globe';
  readonly reason: string;
  constructor(
    readonly source: MapEngine,
    readonly target: MapEngine,
    options: MapTransitionOptions = {}
  ) {
    const requested = options.strategy ?? 'auto';
    if (!['auto', 'direct', 'via-globe'].includes(requested))
      throw new Error('Unknown transition strategy');
    const compatible = source === target || (fullCoverage(source) && fullCoverage(target));
    if (requested === 'direct' && !compatible)
      throw new Error(
        'Direct morph requires complete supported geographic coverage; use auto or via-globe'
      );
    this.strategy = requested === 'via-globe' ? 'via-globe' : compatible ? 'direct' : 'via-globe';
    this.reason =
      this.strategy === 'direct'
        ? 'Geometry is refined against both maps before interpolating corresponding geographic positions.'
        : 'Coverage or surface topology requires separate source and destination geometry through the globe.';
  }
  projectPoint(position: GeographicPosition, amount: number): MapPosition3D | null {
    validateAmount(amount);
    const a = this.source.projectPoint(position),
      b = this.target.projectPoint(position);
    if (this.strategy === 'direct')
      return a && b
        ? [
            a.position[0] * (1 - amount) + b.position[0] * amount,
            a.position[1] * (1 - amount) + b.position[1] * amount,
            0
          ]
        : null;
    const hit = amount < 0.5 ? a : b;
    if (!hit) return null;
    const t = amount < 0.5 ? Math.max(0, 1 - amount / 0.4) : Math.max(0, (amount - 0.6) / 0.4);
    const globe = geographic(position).map(v => v * this.globeRadius);
    return [
      hit.position[0] * t + globe[0] * (1 - t),
      hit.position[1] * t + globe[1] * (1 - t),
      globe[2] * (1 - t)
    ];
  }
  private get globeRadius() {
    return Math.max(this.source.description.radius ?? 1, this.target.description.radius ?? 1);
  }
  prepareLine(
    line: readonly GeographicPosition[],
    options?: MapSamplingOptions
  ): MapTransitionGeometry {
    const first = this.source.projectLine(line, options),
      last = this.target.projectLine(line, options);
    const parts: MapTransitionPart[] = [];
    if (this.strategy === 'direct' && this.source === this.target) {
      for (const p of first)
        parts.push({
          kind: 'line',
          sourceRegionId: p.regionId,
          targetRegionId: p.regionId,
          sourceCoordinates: [p.sourceCoordinates],
          from: [p.coordinates],
          to: [p.coordinates]
        });
    } else if (this.strategy === 'direct') {
      for (const a of first)
        for (const b of this.target.projectLine(a.sourceCoordinates, options)) {
          const source = this.source.regions.find(r => r.id === a.regionId)!;
          parts.push({
            kind: 'line',
            sourceRegionId: a.regionId,
            targetRegionId: b.regionId,
            sourceCoordinates: [b.sourceCoordinates],
            from: [b.sourceCoordinates.map(p => placed(source, p))],
            to: [b.coordinates]
          });
        }
    } else {
      for (const p of first)
        parts.push({
          kind: 'line',
          sourceRegionId: p.regionId,
          sourceCoordinates: [p.sourceCoordinates],
          from: [p.coordinates],
          to: [p.coordinates]
        });
      for (const p of last)
        parts.push({
          kind: 'line',
          targetRegionId: p.regionId,
          sourceCoordinates: [p.sourceCoordinates],
          from: [p.coordinates],
          to: [p.coordinates]
        });
    }
    return new MapTransitionGeometry(parts, this.strategy, this.globeRadius);
  }
  preparePolygon(
    rings: readonly (readonly GeographicPosition[])[],
    options?: MapSamplingOptions
  ): MapTransitionGeometry {
    const first = this.source.projectPolygon(rings, options),
      last = this.target.projectPolygon(rings, options),
      parts: MapTransitionPart[] = [];
    if (this.strategy === 'direct' && this.source === this.target) {
      for (const p of first)
        parts.push({
          kind: 'polygon',
          sourceRegionId: p.regionId,
          targetRegionId: p.regionId,
          sourceCoordinates: p.sourceCoordinates,
          from: p.coordinates,
          to: p.coordinates
        });
    } else if (this.strategy === 'direct') {
      // Intersect the already sampled geographic rings. Re-interpreting a
      // clipped cut boundary as new great-circle input would bend that boundary
      // and can create invalid slivers at a chart's pole or antimeridian.
      for (const a of first) {
        const source = this.source.regions.find(r => r.id === a.regionId)!;
        const left = geographicRings(a.sourceCoordinates);
        const center = left[0][0][0];
        for (const b of last) {
          const target = this.target.regions.find(r => r.id === b.regionId)!;
          const right = geographicRings(b.sourceCoordinates, center);
          for (const rings of polygonClipping.intersection(left, right)) {
            const coordinates = rings as Position[][];
            parts.push({
              kind: 'polygon',
              sourceRegionId: a.regionId,
              targetRegionId: b.regionId,
              sourceCoordinates: coordinates,
              from: coordinates.map(r => r.map(p => placed(source, p))),
              to: coordinates.map(r => r.map(p => placed(target, p)))
            });
          }
        }
      }
    } else {
      for (const p of first)
        parts.push({
          kind: 'polygon',
          sourceRegionId: p.regionId,
          sourceCoordinates: p.sourceCoordinates,
          from: p.coordinates,
          to: p.coordinates
        });
      for (const p of last)
        parts.push({
          kind: 'polygon',
          targetRegionId: p.regionId,
          sourceCoordinates: p.sourceCoordinates,
          from: p.coordinates,
          to: p.coordinates
        });
    }
    return new MapTransitionGeometry(parts, this.strategy, this.globeRadius);
  }
}
function placed(region: MapRegion, p: GeographicPosition): Position {
  const q = region.project(p),
    [a, b, c, d, x, y] = region.placement ?? [1, 0, 0, 1, 0, 0];
  const result: Position = [a * q[0] + c * q[1] + x, b * q[0] + d * q[1] + y];
  if (!result.every(Number.isFinite))
    throw new Error('Undefined projection in common transition coverage');
  return result;
}
function freezeRings(rings: readonly (readonly GeographicPosition[])[]) {
  return Object.freeze(
    rings.map(r => Object.freeze(r.map(p => Object.freeze([...p]) as GeographicPosition)))
  );
}
function validateAmount(t: number) {
  if (!Number.isFinite(t) || t < 0 || t > 1)
    throw new Error('Transition amount must be within [0,1]');
}
const coverageCache = new WeakMap<MapEngine, boolean>();
function fullCoverage(map: MapEngine): boolean {
  const cached = coverageCache.get(map);
  if (cached !== undefined) return cached;
  const d = map.description.definition;
  let covered = false;
  if (d.type === 'elastic') {
    const world = rectangle(-180, -90, 180, 90);
    let completeSections = true;
    const domains = d.data.sections.map(s => {
      const domain = s.complement
        ? polygonClipping.difference(world, [s.boundary as Position[]])
        : polygonClipping.intersection(world, [s.boundary as Position[]]);
      // Include only cells with four defined corners. Merge contiguous row runs
      // before clipping to avoid treating interpolation holes as valid coverage.
      const runs: Position[][][] = [];
      for (let y = 0; y < s.rows - 1; y++) {
        let start = -1;
        for (let x = 0; x < s.columns; x++) {
          const valid =
            x < s.columns - 1 &&
            [
              y * s.columns + x,
              y * s.columns + x + 1,
              (y + 1) * s.columns + x,
              (y + 1) * s.columns + x + 1
            ].every(i => s.values[2 * i] !== null);
          if (valid && start < 0) start = x;
          if (!valid && start >= 0) {
            runs.push(
              rectangle(
                -180 + (360 * start) / (s.columns - 1),
                -90 + (180 * y) / (s.rows - 1),
                -180 + (360 * x) / (s.columns - 1),
                -90 + (180 * (y + 1)) / (s.rows - 1)
              )
            );
            start = -1;
          }
        }
      }
      const valid = runs.length ? polygonClipping.union(runs[0], ...runs.slice(1)) : [];
      if (!valid.length || polygonClipping.difference(domain, valid).length)
        completeSections = false;
      return valid.length ? polygonClipping.intersection(domain, valid) : [];
    });
    // Multiple placements of the same geography need a correspondence policy,
    // not a Cartesian product of charts. Keep those maps on the globe route.
    const overlaps = domains.some((domain, i) =>
      domains.slice(i + 1).some(other => polygonClipping.intersection(domain, other).length > 0)
    );
    covered =
      completeSections && !overlaps && polygonClipping.difference(world, ...domains).length === 0;
  } else if (d.type === 'world') {
    covered =
      directWorldProjections.has(d.projection) && Object.keys(d.parameters ?? {}).length === 0;
  }
  coverageCache.set(map, covered);
  return covered;
}

function geographicRings(
  rings: readonly (readonly GeographicPosition[])[],
  center?: number
): Position[][] {
  return rings.map(ring => {
    let previous = center ?? ring[0][0];
    return ring.map(([lon, lat]) => {
      const x = lon + 360 * Math.round((previous - lon) / 360);
      previous = x;
      return [Math.round(x * 1e9) / 1e9, Math.round(lat * 1e9) / 1e9];
    });
  });
}
