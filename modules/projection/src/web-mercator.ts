// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original minimal spherical Web Mercator implementation.
import type {
  ProjectionEngine,
  PreparedProjection,
  CreateProjectionOptions,
  ProjectionCoordinate,
  ProjectionOutput,
  ProjectionArray
} from './types';
import {validateScalarOutput, writeScalarOutput} from './experimental/scalar-output';

const RADIUS = 6378137;
const RADIANS = Math.PI / 180;
const FLOAT32_MAX = 3.4028234663852886e38;

function wrap(longitude: number): number {
  if (Math.abs(longitude) <= Math.PI) return longitude;
  const circle = 2 * Math.PI;
  return ((((longitude + Math.PI) % circle) + circle) % circle) - Math.PI;
}

type CRS = 'WGS84' | 'EPSG:4326' | 'EPSG:3857';
function crs(input: CreateProjectionOptions['from']): CRS {
  if (input === undefined) return 'WGS84';
  if (input === 'WGS84' || input === 'EPSG:4326' || input === 'EPSG:3857') return input;
  throw new Error('WebMercatorProjectionEngine supports only WGS84, EPSG:4326 and EPSG:3857');
}

/** Minimal WGS84 / EPSG:3857 factory, without CRS readers, grids or datum transforms. */
export class WebMercatorProjectionEngine implements ProjectionEngine {
  createProjection(options: CreateProjectionOptions = {}): PreparedProjection {
    if (options.mode !== undefined && options.mode !== 'strict' && options.mode !== 'horizontal')
      throw new Error('Invalid projection mode');
    return new WebMercatorTransform(crs(options.from), crs(options.to));
  }
  async createProjectionAsync(options: CreateProjectionOptions = {}): Promise<PreparedProjection> {
    return this.createProjection(options);
  }
}

class WebMercatorTransform implements PreparedProjection {
  readonly lossy = false;
  private readonly point = {x: 0, y: 0, z: 0};
  constructor(
    private readonly from: CRS,
    private readonly to: CRS
  ) {
    this.project = this.project.bind(this);
    this.unproject = this.unproject.bind(this);
    this.projectTo = this.projectTo.bind(this);
    this.unprojectTo = this.unprojectTo.bind(this);
    this.projectFlat = this.projectFlat.bind(this);
    this.unprojectFlat = this.unprojectFlat.bind(this);
    this.projectSync = this.project;
    this.unprojectSync = this.unproject;
    this.projectToSync = this.projectTo;
    this.unprojectToSync = this.unprojectTo;
    this.projectFlatSync = this.projectFlat;
    this.unprojectFlatSync = this.unprojectFlat;
  }
  async preload(): Promise<void> {}
  project(coordinate: readonly number[]): number[] {
    return this.projectTo(coordinate, new Array<number>(coordinate.length));
  }
  unproject(coordinate: readonly number[]): number[] {
    return this.unprojectTo(coordinate, new Array<number>(coordinate.length));
  }
  projectTo<T extends ProjectionOutput>(coordinate: ProjectionCoordinate, output: T): T {
    return this.scalar(coordinate, output, this.from, this.to);
  }
  unprojectTo<T extends ProjectionOutput>(coordinate: ProjectionCoordinate, output: T): T {
    return this.scalar(coordinate, output, this.to, this.from);
  }
  projectFlat<T extends ProjectionArray>(coordinates: T, dimension = 2): T {
    return this.flat(coordinates, dimension, this.from, this.to);
  }
  unprojectFlat<T extends ProjectionArray>(coordinates: T, dimension = 2): T {
    return this.flat(coordinates, dimension, this.to, this.from);
  }
  projectSync: PreparedProjection['project'];
  unprojectSync: PreparedProjection['unproject'];
  projectToSync: PreparedProjection['projectTo'];
  unprojectToSync: PreparedProjection['unprojectTo'];
  projectFlatSync: PreparedProjection['projectFlat'];
  unprojectFlatSync: PreparedProjection['unprojectFlat'];

  private run(x: number, y: number, z: number, from: CRS, to: CRS): void {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z))
      throw new Error('Projection requires finite XYZ coordinates');
    if (from !== 'EPSG:3857' && Math.abs(y) > 90)
      throw new Error('Coordinate outside geographic domain');
    if (from !== to && !(from !== 'EPSG:3857' && to !== 'EPSG:3857')) {
      if (from === 'EPSG:3857') {
        x = x / RADIUS / RADIANS;
        x = ((((x + 180) % 360) + 360) % 360) - 180;
        y = Math.atan(Math.sinh(y / RADIUS)) / RADIANS;
      } else {
        if (Math.abs(y) >= 90) throw new Error('Coordinate outside Web Mercator projection domain');
        x = wrap(x * RADIANS) * RADIUS;
        y = (Math.asinh(Math.tan(y * RADIANS)) + 0) * RADIUS;
      }
    }
    if (!Number.isFinite(x) || !Number.isFinite(y))
      throw new Error('Projected coordinate is not finite');
    this.point.x = x;
    this.point.y = y;
    this.point.z = z;
  }
  private scalar<T extends ProjectionOutput>(
    coordinate: ProjectionCoordinate,
    output: T,
    from: CRS,
    to: CRS
  ): T {
    validateScalarOutput(coordinate, output, coordinate.length);
    if (coordinate.length < 2) throw new Error('Projection requires at least two ordinates');
    this.run(coordinate[0], coordinate[1], coordinate.length >= 3 ? coordinate[2] : 0, from, to);
    return writeScalarOutput(coordinate, output, this.point, coordinate.length);
  }
  private flat<T extends ProjectionArray>(
    coordinates: T,
    dimension: number,
    from: CRS,
    to: CRS
  ): T {
    if (!(coordinates instanceof Float32Array || coordinates instanceof Float64Array))
      throw new Error('Flat coordinates require Float32Array or Float64Array');
    if (!Number.isSafeInteger(dimension) || dimension < 2 || coordinates.length % dimension)
      throw new Error('Invalid flat coordinate dimension');
    const float32 = coordinates instanceof Float32Array;
    for (let offset = 0; offset < coordinates.length; offset += dimension) {
      this.run(
        coordinates[offset],
        coordinates[offset + 1],
        dimension >= 3 ? coordinates[offset + 2] : 0,
        from,
        to
      );
      if (float32 && (Math.abs(this.point.x) > FLOAT32_MAX || Math.abs(this.point.y) > FLOAT32_MAX))
        throw new Error('Projected coordinate exceeds Float32 range');
      coordinates[offset] = this.point.x;
      coordinates[offset + 1] = this.point.y;
    }
    return coordinates;
  }
}
