// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {DiscontinuousMap, type GeographicPosition, type MapRegion} from './map-layout';
import {coordinates, geographic, angle, RAD} from './math';
import {createGraticule} from './myriahedral/graticule';
import {createLayout, type MeshEdge} from './myriahedral/unfold';
import {
  createSolid,
  center,
  cross,
  dot,
  faceNormal,
  normalize,
  subtract,
  type Polyhedron,
  type Solid,
  type Vec3
} from './myriahedral/mesh';

export type MyriahedralMesh = Polyhedron;
export type MyriahedralSolid = Solid;
export type MyriahedralPreset =
  | 'polyconic'
  | 'cylindric'
  | 'azimuthal'
  | 'hemispheres'
  | 'sealine'
  | 'coastline'
  | 'polyhedral';
export type MyriahedralOptions = {
  /** Independent cut strategy, not an implementation of an analytic namesake. Default cylindric. */
  preset?: MyriahedralPreset;
  /** Multiple of four, 12–96. Default 48. Graticule presets only. */
  columns?: number;
  /** Polyhedral preset only. Default icosahedron. */
  solid?: MyriahedralSolid;
  /** Polyhedral preset only, 0–3. Default 1. Zero keeps the original polygonal faces. */
  subdivisions?: number;
  /** Optional closed, outward-wound, convex planar panels on the unit sphere. */
  mesh?: MyriahedralMesh;
  /** Longitude in degrees for the backbone/secondary join preference. Default 20. */
  centralMeridian?: number;
  /** Positive output scale; default 1. Input and texture coordinates remain spherical. */
  radius?: number;
  /** Required for sealine/coastline. Called with degrees; no bundled geography or network access. */
  isLand?: (position: GeographicPosition) => boolean;
  /** Maximum angular interval for land sampling in degrees; default .25, range [.05, 10]. */
  landSampleStep?: number;
  /** Final retained-join weight override. Higher values are less likely to be cut. */
  edgeWeight?: (edge: Readonly<MyriahedralEdge>, presetWeight: number) => number;
};
export type MyriahedralEdge = {
  vertices: readonly [number, number];
  panels: readonly [number, number];
  midpoint: GeographicPosition;
  arcLength: number;
  landFraction?: number;
};

export const MYRIAHEDRAL_PRESETS: readonly MyriahedralPreset[] = Object.freeze([
  'polyconic',
  'cylindric',
  'azimuthal',
  'hemispheres',
  'sealine',
  'coastline',
  'polyhedral'
]);

/** Build an independent spherical panel net and its rigid unfolding animation.
 * Each call owns its mesh. Geographical costs are sampled once per edge.
 */
export function createMyriahedralLayout(options: MyriahedralOptions = {}): MyriahedralLayout {
  const preset = options.preset ?? 'cylindric';
  if (!MYRIAHEDRAL_PRESETS.includes(preset)) throw new RangeError('Unknown myriahedral preset');
  const radius = options.radius ?? 1;
  const longitude = options.centralMeridian ?? 20;
  const step = options.landSampleStep ?? 0.25;
  if (!Number.isFinite(radius) || radius <= 0)
    throw new RangeError('Radius must be finite and positive');
  if (!Number.isFinite(longitude)) throw new RangeError('Central meridian must be finite');
  if (!Number.isFinite(step) || step < 0.05 || step > 10)
    throw new RangeError('Land sample step must be within [.05, 10]');
  if ((preset === 'sealine' || preset === 'coastline') && !options.isLand)
    throw new Error('Sealine and coastline require an isLand callback');
  const central = (((((longitude + 180) % 360) + 360) % 360) - 180) * RAD;
  const mesh = options.mesh
    ? snapshotMesh(options.mesh)
    : preset === 'polyhedral'
      ? createSolid(options.solid ?? 'icosahedron', options.subdivisions ?? 1)
      : createGraticule(options.columns ?? 48);
  // Select a stable root near the requested center (north pole for radial nets).
  const target = geographic([
    longitude,
    preset === 'azimuthal' || preset === 'hemispheres' ? 90 : 0
  ]);
  let root = 0;
  for (let i = 1; i < mesh.faces.length; i++)
    if (
      dot(normalize(center(mesh.faces[i].map(v => mesh.vertices[v]))), target) >
      dot(normalize(center(mesh.faces[root].map(v => mesh.vertices[v]))), target) + 1e-12
    )
      root = i;
  [mesh.faces[0], mesh.faces[root]] = [mesh.faces[root], mesh.faces[0]];
  const samples = new Map<string, MyriahedralEdge>();
  const data = (edge: MeshEdge): MyriahedralEdge => {
    const key = `${edge.a}:${edge.b}`;
    let value = samples.get(key);
    if (value) return value;
    const a = mesh.vertices[edge.a],
      b = mesh.vertices[edge.b];
    const arcLength = angle(a, b);
    let landFraction: number | undefined;
    if (options.isLand) {
      const count = Math.max(1, Math.ceil(arcLength / (step * RAD)));
      let hits = 0;
      for (let i = 0; i < count; i++) {
        const t = (i + 0.5) / count;
        const p = a.map(
          (x, k) => x * Math.sin((1 - t) * arcLength) + b[k] * Math.sin(t * arcLength)
        ) as Vec3;
        if (options.isLand(coordinates(p))) hits++;
      }
      landFraction = hits / count;
    }
    value = Object.freeze({
      vertices: Object.freeze([edge.a, edge.b]) as readonly [number, number],
      panels: Object.freeze([...edge.faces]) as readonly [number, number],
      midpoint: Object.freeze(coordinates(normalize(center([a, b])))),
      arcLength,
      landFraction
    });
    samples.set(key, value);
    return value;
  };
  const weight = (edge: MeshEdge) => {
    const a = mesh.vertices[edge.a],
      b = mesh.vertices[edge.b];
    const d = data(edge);
    const lat = d.midpoint[1] * RAD;
    const lon = d.midpoint[0] * RAD;
    const delta = Math.abs(Math.atan2(Math.sin(lon - central), Math.cos(lon - central)));
    const parallel = Math.abs(a[2] - b[2]) < 1e-10;
    const seam = !parallel && Math.abs(Math.abs(lon) - Math.PI) < 1e-8;
    let result: number;
    if (preset === 'polyhedral') {
      // Geographic continuity, then short local joins. Stable input order resolves ties.
      result = (d.landFraction ?? 0) * 10000 - d.arcLength;
    } else if (preset === 'polyconic') {
      // Latitude strips connected along a central meridian.
      result = (parallel ? 0 : 100) - delta - Math.abs(lat) * 0.01;
    } else {
      // Longitude strips connected at the equator, north cap, or both polar caps.
      const anchor =
        preset === 'azimuthal'
          ? Math.PI / 2
          : preset === 'hemispheres'
            ? (Math.sign(lat) * Math.PI) / 2
            : 0;
      result = (parallel ? 100 : 0) - Math.abs(lat - anchor) - delta * 0.01;
      if (preset === 'hemispheres' && parallel && Math.abs(a[2]) < 1e-10) result = -100 - delta;
      if (preset === 'sealine') result += d.landFraction! * 10000;
      if (preset === 'coastline') result += (1 - d.landFraction!) * 10000;
      if (
        (preset === 'cylindric' || preset === 'sealine' || preset === 'coastline') &&
        !parallel &&
        Math.abs(Math.min(a[2], b[2])) < 1e-10
      )
        result = 1e6;
    }
    if (seam && preset !== 'polyhedral') result = -1e9;
    return options.edgeWeight ? options.edgeWeight(d, result) : result;
  };
  const layout = createLayout(mesh, 1, {weight});
  const unscaled = layout.evaluate;
  const evaluate = (amount: number) =>
    unscaled(amount).map(face => face.map(p => p.map(v => v * radius) as Vec3));
  const cutLandRadians = options.isLand
    ? layout.edges.reduce(
        (sum, edge) => sum + (edge.hinge ? 0 : data(edge).arcLength * data(edge).landFraction!),
        0
      )
    : undefined;
  return {...layout, evaluate, preset, radius, cutLandRadians};
}
export type MyriahedralLayout = ReturnType<typeof createLayout> & {
  preset: MyriahedralPreset;
  radius: number;
  /** Undefined without an isLand callback. */
  cutLandRadians?: number;
};

/** A static seam-aware projection with the same panel IDs and layout as its animation.
 * Radial/gnomonic mapping is locally approximate, not equal-area or conformal.
 */
export class MyriahedralMap extends DiscontinuousMap {
  readonly layout: MyriahedralLayout;
  constructor(options: MyriahedralOptions = {}) {
    const layout = createMyriahedralLayout(options);
    super(regions(layout));
    this.layout = layout;
  }
}

/** Create a reusable static projection; use map.layout.evaluate(t) for unfolding. */
export function createMyriahedralMap(options: MyriahedralOptions = {}): MyriahedralMap {
  return new MyriahedralMap(options);
}

function regions(layout: MyriahedralLayout): MapRegion[] {
  const flat = layout.evaluate(1);
  return layout.mesh.faces.map((face, i) => {
    const origin = [...layout.mesh.vertices[face[0]]] as Vec3;
    const x = normalize(subtract(layout.mesh.vertices[face[1]], origin));
    const normal = faceNormal(layout.mesh, face),
      y = cross(normal, x);
    const height = dot(normal, origin);
    const fx = normalize(subtract(flat[i][1], flat[i][0]));
    const radius = layout.radius;
    return {
      id: `panel-${i}`,
      boundary: face.map(v => coordinates(layout.mesh.vertices[v])),
      interior: coordinates(normalize(center(face.map(v => layout.mesh.vertices[v])))),
      placement: [
        radius * fx[0],
        radius * fx[1],
        -radius * fx[1],
        radius * fx[0],
        flat[i][0][0],
        flat[i][0][1]
      ],
      project: p => {
        const direction = geographic(p);
        const point = direction.map(v => (v * height) / dot(normal, direction)) as Vec3;
        return [dot(subtract(point, origin), x), dot(subtract(point, origin), y)];
      },
      unproject: ([u, v]) =>
        coordinates(normalize(origin.map((c, k) => c + u * x[k] + v * y[k]) as Vec3))
    };
  });
}

function snapshotMesh(input: MyriahedralMesh): MyriahedralMesh {
  if (!input.vertices?.length || !input.faces?.length || input.faces.length > 20000)
    throw new Error('Expected a nonempty mesh with at most 20000 panels');
  const mesh = {
    vertices: input.vertices.map(v => [...v] as Vec3),
    faces: input.faces.map(f => [...f])
  };
  if (
    mesh.vertices.some(
      v => v.length !== 3 || !v.every(Number.isFinite) || Math.abs(Math.hypot(...v) - 1) > 1e-8
    )
  )
    throw new Error('Mesh vertices must lie on the unit sphere');
  for (const face of mesh.faces) {
    if (
      face.length < 3 ||
      new Set(face).size !== face.length ||
      face.some(v => !Number.isInteger(v) || v < 0 || v >= mesh.vertices.length)
    )
      throw new Error('Invalid panel indices');
    const normal = faceNormal(mesh, face),
      origin = mesh.vertices[face[0]];
    if (
      !normal.every(Number.isFinite) ||
      dot(normal, origin) <= 1e-8 ||
      face.some(v => Math.abs(dot(normal, subtract(mesh.vertices[v], origin))) > 1e-8)
    )
      throw new Error('Panels must be planar and outward-wound');
    for (let i = 0; i < face.length; i++) {
      const a = mesh.vertices[face[i]],
        b = mesh.vertices[face[(i + 1) % face.length]];
      if (
        angle(a, b) < 1e-10 ||
        angle(a, b) >= Math.PI - 1e-8 ||
        face.some(v => dot(cross(a, b), mesh.vertices[v]) < -1e-8)
      )
        throw new Error('Panels must be convex with nondegenerate minor-arc edges');
    }
  }
  return mesh;
}
