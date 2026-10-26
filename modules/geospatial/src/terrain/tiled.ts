// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {validateTileMatrix, type TileMatrix, type TileMatrixSet} from '../tile-matrix';
import {HeightField} from './height-field';
import {
  TerrainSampleStatus as Status,
  type TerrainArray,
  type TerrainDiagonal,
  type TerrainSample,
  type TerrainSampleOptions
} from './types';

export type TerrainTileId = {
  readonly matrixId: string;
  readonly column: number;
  readonly row: number;
};

export type TerrainHaloChange = TerrainTileId & {readonly resident: boolean};
export type TerrainTileUpdate = {
  revision: string;
  tiles?: readonly TerrainTile[];
  remove?: readonly TerrainTileId[];
};

export type TerrainTile = TerrainTileId & {
  heights: TerrainArray;
  validity?: Uint8Array;
};

export type TiledHeightFieldProps = {
  /** All matrices must use the same local metric XY frame. CRS is provenance only. */
  matrixSet: TileMatrixSet;
  /** Cell-registered, tightly packed rasters, sized exactly as matrix.tileSize. */
  tiles: readonly TerrainTile[];
  revision: string;
  diagonal?: TerrainDiagonal;
  heightReference?: string;
};

export type TiledTerrainSample = TerrainSample & {
  revision: string;
  /** Actual matrix used, including on failure. */
  matrixId: string;
  fallback: boolean;
};

type TileData = {heights: TerrainArray; validity: Uint8Array};
type Halo = {field: HeightField};

/** Immutable resident-tile snapshot. Builds one-cell halos for coherent seam sampling. */
export class TiledHeightField {
  readonly revision: string;
  readonly heightReference: string;
  private readonly crs: string;
  private changes: readonly TerrainHaloChange[] = Object.freeze([]);
  private readonly diagonal: TerrainDiagonal;
  private readonly matrices: readonly TileMatrix[];
  private readonly tiles = new Map<string, TileData>();
  private readonly halos = new Map<string, Halo>();

  constructor(props: TiledHeightFieldProps) {
    if (typeof props.revision !== 'string') throw new Error('Terrain revision must be a string');
    this.revision = props.revision;
    this.crs = props.matrixSet.crs;
    this.diagonal = props.diagonal ?? '00-11';
    if (this.diagonal !== '00-11' && this.diagonal !== '10-01')
      throw new Error('Unknown terrain diagonal');
    this.heightReference = props.heightReference ?? 'unknown';
    this.matrices = props.matrixSet.matrices.map(matrix => {
      validateTileMatrix(matrix);
      if (matrix.variableMatrixWidths?.length)
        throw new Error('Terrain does not yet support coalesced tile rows');
      if (matrix.tileSize.some((size, axis) => size * matrix.matrixSize[axis] < 2))
        throw new Error('Terrain matrices need at least two samples per axis');
      return {
        ...matrix,
        origin: [...matrix.origin] as [number, number],
        tileSize: [...matrix.tileSize] as [number, number],
        matrixSize: [...matrix.matrixSize] as [number, number]
      };
    });
    if (
      !this.matrices.length ||
      new Set(this.matrices.map(matrix => matrix.id)).size !== this.matrices.length
    )
      throw new Error('Terrain requires unique matrix identifiers');
    for (const tile of props.tiles) {
      const matrix = this.validateTileId(tile);
      const key = tileKey(tile.matrixId, tile.column, tile.row);
      if (this.tiles.has(key)) throw new Error('Duplicate terrain tile');
      this.tiles.set(key, copyTileData(tile, matrix));
    }
    for (const tile of props.tiles)
      this.buildHalo(this.getMatrix(tile.matrixId), tile.column, tile.row, props.diagonal);
    this.changes = freezeChanges(
      props.tiles.map(tile => ({
        matrixId: tile.matrixId,
        column: tile.column,
        row: tile.row,
        resident: true
      }))
    );
  }

  /** Number of resident source tiles. */
  get tileCount(): number {
    return this.tiles.size;
  }

  /** Halos to upload or evict relative to the preceding snapshot; initial snapshots list all tiles. */
  get haloChanges(): readonly TerrainHaloChange[] {
    return this.changes;
  }

  /** Copy-on-write update. Only changed sources and resident one-tile neighborhoods rebuild halos.
   * Old snapshots keep their original source buffers and halos. Map copying is O(resident tiles).
   */
  withTiles(update: TerrainTileUpdate): TiledHeightField {
    if (typeof update.revision !== 'string' || update.revision === this.revision)
      throw new Error('Terrain updates require a different revision string');
    const replacements = new Map<string, TileData>();
    const touched = new Map<string, TerrainTileId>();
    for (const tile of [...(update.tiles ?? []), ...(update.remove ?? [])]) {
      this.validateTileId(tile);
      const key = tileKey(tile.matrixId, tile.column, tile.row);
      if (touched.has(key))
        throw new Error('Terrain update contains duplicate or conflicting tile identifiers');
      touched.set(key, tile);
    }
    for (const tile of update.tiles ?? [])
      replacements.set(
        tileKey(tile.matrixId, tile.column, tile.row),
        copyTileData(tile, this.getMatrix(tile.matrixId))
      );
    const next = new TiledHeightField({
      matrixSet: {crs: this.crs, matrices: this.matrices},
      tiles: [],
      revision: update.revision,
      diagonal: this.diagonal,
      heightReference: this.heightReference
    });
    for (const [key, tile] of this.tiles) next.tiles.set(key, tile);
    for (const [key, halo] of this.halos) next.halos.set(key, halo);
    const affected = new Map<string, TerrainHaloChange>();
    for (const [key, tile] of touched) {
      if (replacements.has(key)) next.tiles.set(key, replacements.get(key)!);
      else {
        if (!next.tiles.delete(key)) continue;
        next.halos.delete(key);
      }
      for (let row = tile.row - 1; row <= tile.row + 1; row++)
        for (let column = tile.column - 1; column <= tile.column + 1; column++) {
          affected.set(tileKey(tile.matrixId, column, row), {
            matrixId: tile.matrixId,
            column,
            row,
            resident: false
          });
        }
    }
    const changes: TerrainHaloChange[] = [];
    for (const [key, tile] of affected) {
      if (next.tiles.has(key)) {
        next.buildHalo(next.getMatrix(tile.matrixId), tile.column, tile.row, this.diagonal);
        changes.push({...tile, resident: true});
      } else if (this.tiles.has(key)) changes.push(tile);
    }
    next.changes = freezeChanges(changes);
    return next;
  }

  /** Independent finite halo buffers for workers or GPU upload; missing values use validity zero.
   * Origin is the first sample center in local meters. No GPU resources are created.
   */
  copyTileHalo(
    matrixId: string,
    column: number,
    row: number
  ):
    | {
        width: number;
        height: number;
        heights: TerrainArray;
        validity: Uint8Array;
        origin: readonly [number, number];
        columnStep: readonly [number, number];
        rowStep: readonly [number, number];
        revision: string;
        diagonal: TerrainDiagonal;
        registration: 'vertex';
        heightReference: string;
      }
    | undefined {
    const matrix = this.getMatrix(matrixId);
    const halo = this.halos.get(tileKey(matrixId, column, row));
    if (!halo) return undefined;
    const dy =
      (matrix.resolutionY ?? matrix.resolution) * (matrix.cornerOfOrigin === 'topLeft' ? -1 : 1);
    return {
      ...halo.field.copyData(),
      width: halo.field.width,
      height: halo.field.height,
      origin: [
        matrix.origin[0] +
          (column * matrix.tileSize[0] + halo.field.origin[0] - 0.5) * matrix.resolution,
        matrix.origin[1] + (row * matrix.tileSize[1] + halo.field.origin[1] - 0.5) * dy
      ],
      columnStep: [matrix.resolution, 0],
      rowStep: [0, dy],
      revision: this.revision,
      diagonal: this.diagonal,
      registration: 'vertex',
      heightReference: this.heightReference
    };
  }

  /** Queries never mix resolutions. Only absent residency permits coarser fallback. */
  sample(
    x: number,
    y: number,
    options: TerrainSampleOptions & {matrixId: string; fallback?: 'none' | 'coarser'}
  ): TiledTerrainSample {
    const requested = this.getMatrix(options.matrixId);
    if (
      options.fallback !== undefined &&
      options.fallback !== 'none' &&
      options.fallback !== 'coarser'
    )
      throw new Error('Unknown terrain fallback');
    const candidates = [requested];
    if (options.fallback === 'coarser')
      candidates.push(
        ...this.matrices
          .filter(
            matrix =>
              matrix.resolution >= requested.resolution &&
              (matrix.resolutionY ?? matrix.resolution) >=
                (requested.resolutionY ?? requested.resolution) &&
              (matrix.resolution > requested.resolution ||
                (matrix.resolutionY ?? matrix.resolution) >
                  (requested.resolutionY ?? requested.resolution))
          )
          .sort(
            (a, b) =>
              a.resolution - b.resolution ||
              (a.resolutionY ?? a.resolution) - (b.resolutionY ?? b.resolution) ||
              (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
          )
      );
    let result = this.sampleMatrix(requested, x, y, options);
    for (let i = 1; result.status === Status.NOT_RESIDENT && i < candidates.length; i++) {
      const candidate = this.sampleMatrix(candidates[i], x, y, options);
      // A smaller coarse extent is not evidence of missing fine source data.
      if (candidate.status !== Status.OUTSIDE_DOMAIN) result = candidate;
    }
    return {
      ...result,
      revision: this.revision,
      matrixId: result.matrixId,
      fallback: result.matrixId !== requested.id
    };
  }

  private sampleMatrix(
    matrix: TileMatrix,
    x: number,
    y: number,
    options: TerrainSampleOptions
  ): TerrainSample & {matrixId: string} {
    const invalid = (status: TerrainSample['status']) => ({
      status,
      gradientStatus: status,
      height: 0,
      gradientX: 0,
      gradientY: 0,
      normalX: 0,
      normalY: 0,
      normalZ: 0,
      matrixId: matrix.id
    });
    const interpolation = options.interpolation ?? 'bilinear';
    if (!['nearest', 'bilinear', 'triangle'].includes(interpolation))
      throw new Error('Unknown terrain interpolation');
    if (!Number.isFinite(x) || !Number.isFinite(y)) return invalid(Status.INVALID_INPUT);
    const [width, height] = matrix.tileSize;
    const dy =
      (matrix.resolutionY ?? matrix.resolution) * (matrix.cornerOfOrigin === 'topLeft' ? -1 : 1);
    let u = (x - matrix.origin[0]) * (1 / matrix.resolution);
    let v = (y - matrix.origin[1]) * (1 / dy);
    if (!Number.isFinite(u) || !Number.isFinite(v)) return invalid(Status.NUMERIC_ERROR);
    const tolerance =
      8 * Number.EPSILON * Math.max(width * matrix.matrixSize[0], height * matrix.matrixSize[1]);
    const toleranceU =
      tolerance +
      (4 * Number.EPSILON * Math.abs(x) + 4 * Number.EPSILON * Math.abs(matrix.origin[0])) /
        matrix.resolution;
    const toleranceV =
      tolerance +
      (4 * Number.EPSILON * Math.abs(y) + 4 * Number.EPSILON * Math.abs(matrix.origin[1])) /
        Math.abs(dy);
    if (
      u < 0.5 - toleranceU ||
      v < 0.5 - toleranceV ||
      u > width * matrix.matrixSize[0] - 0.5 + toleranceU ||
      v > height * matrix.matrixSize[1] - 0.5 + toleranceV
    )
      return invalid(Status.OUTSIDE_DOMAIN);
    u = Math.max(0.5, Math.min(width * matrix.matrixSize[0] - 0.5, u));
    v = Math.max(0.5, Math.min(height * matrix.matrixSize[1] - 0.5, v));
    const gridU = u - 0.5;
    const gridV = v - 0.5;
    const c = Math.min(Math.floor(gridU), width * matrix.matrixSize[0] - 2);
    const r = Math.min(Math.floor(gridV), height * matrix.matrixSize[1] - 2);
    const first = this.diagonal === '00-11' ? gridV - r <= gridU - c : gridU - c + gridV - r <= 1;
    const a = [c, r];
    const b = [c + 1, r];
    const cc = [c, r + 1];
    const d = [c + 1, r + 1];
    const taps =
      interpolation === 'nearest'
        ? [[Math.floor(gridU + 0.5), Math.floor(gridV + 0.5)]]
        : interpolation === 'bilinear'
          ? [a, b, cc, d]
          : first
            ? [a, b, this.diagonal === '00-11' ? d : cc]
            : [this.diagonal === '00-11' ? a : b, cc, d];
    let missing = false;
    const values: number[] = [];
    for (const [column, row] of taps) {
      const tileColumn = Math.floor(column / width);
      const tileRow = Math.floor(row / height);
      const tile = this.tiles.get(tileKey(matrix.id, tileColumn, tileRow));
      if (!tile) {
        missing = true;
        continue;
      }
      const index = (row - tileRow * height) * width + column - tileColumn * width;
      if (!tile.validity[index]) return invalid(Status.NO_DATA);
      values.push(tile.heights[index]);
    }
    if (missing) return invalid(Status.NOT_RESIDENT);
    if (interpolation === 'nearest')
      return {...invalid(Status.VALID), height: values[0], gradientStatus: Status.UNAVAILABLE};
    // Use exactly the fractions and footprint selected above. Re-normalizing into a
    // halo can round a point across a diagonal and change validity or contact normals.
    const fu = gridU - c;
    const fv = gridV - r;
    const [za, zb, zc, zd] = values;
    const result = invalid(Status.VALID);
    if (interpolation === 'bilinear') {
      result.height = (1 - fv) * ((1 - fu) * za + fu * zb) + fv * ((1 - fu) * zc + fu * zd);
      result.gradientX = (1 - fv) * (zb - za) + fv * (zd - zc);
      result.gradientY = (1 - fu) * (zc - za) + fu * (zd - zb);
    } else if (first) {
      result.gradientX = zb - za;
      result.gradientY = this.diagonal === '00-11' ? zc - zb : zc - za;
      result.height =
        this.diagonal === '00-11'
          ? (1 - fu) * za + (fu - fv) * zb + fv * zc
          : (1 - fu - fv) * za + fu * zb + fv * zc;
    } else {
      result.gradientX = zc - zb;
      result.gradientY = this.diagonal === '00-11' ? zb - za : zc - za;
      result.height =
        this.diagonal === '00-11'
          ? (1 - fv) * za + fu * zc + (fv - fu) * zb
          : (1 - fv) * za + (1 - fu) * zb + (fu + fv - 1) * zc;
    }
    if (!Number.isFinite(result.height)) return invalid(Status.NUMERIC_ERROR);
    if (result.gradientStatus === Status.VALID) {
      result.gradientX /= matrix.resolution;
      result.gradientY /= dy;
      const scale = Math.max(1, Math.abs(result.gradientX), Math.abs(result.gradientY));
      if (!Number.isFinite(scale)) {
        result.gradientStatus = Status.NUMERIC_ERROR;
        result.gradientX = result.gradientY = result.normalX = result.normalY = result.normalZ = 0;
      } else {
        const length = Math.hypot(result.gradientX / scale, result.gradientY / scale, 1 / scale);
        result.normalX = -result.gradientX / scale / length;
        result.normalY = -result.gradientY / scale / length;
        result.normalZ = 1 / scale / length;
      }
    }
    return {...result, matrixId: matrix.id};
  }

  private buildHalo(
    matrix: TileMatrix,
    column: number,
    row: number,
    diagonal?: TerrainDiagonal
  ): void {
    const [width, height] = matrix.tileSize;
    const left = column > 0 ? 1 : 0;
    const top = row > 0 ? 1 : 0;
    const right = column < matrix.matrixSize[0] - 1 ? 1 : 0;
    const bottom = row < matrix.matrixSize[1] - 1 ? 1 : 0;
    const haloWidth = width + left + right;
    const haloHeight = height + top + bottom;
    const heights = new Float64Array(haloWidth * haloHeight);
    const validity = new Uint8Array(heights.length);
    for (let y = -top; y < height + bottom; y++)
      for (let x = -left; x < width + right; x++) {
        const globalX = column * width + x;
        const globalY = row * height + y;
        const ownerX = Math.floor(globalX / width);
        const ownerY = Math.floor(globalY / height);
        const tile = this.tiles.get(tileKey(matrix.id, ownerX, ownerY));
        const index = (y + top) * haloWidth + x + left;
        if (tile) {
          const source = (globalY - ownerY * height) * width + globalX - ownerX * width;
          heights[index] = tile.heights[source];
          validity[index] = tile.validity[source];
        }
      }
    this.halos.set(tileKey(matrix.id, column, row), {
      field: new HeightField({
        width: haloWidth,
        height: haloHeight,
        origin: [1 - left, 1 - top],
        heights,
        validity,
        diagonal
      })
    });
  }

  private validateTileId(tile: TerrainTileId): TileMatrix {
    const matrix = this.getMatrix(tile.matrixId);
    if (
      !Number.isInteger(tile.column) ||
      !Number.isInteger(tile.row) ||
      tile.column < 0 ||
      tile.row < 0 ||
      tile.column >= matrix.matrixSize[0] ||
      tile.row >= matrix.matrixSize[1]
    )
      throw new Error('Terrain tile index is outside its matrix');
    return matrix;
  }

  private getMatrix(id: string): TileMatrix {
    const matrix = this.matrices.find(candidate => candidate.id === id);
    if (!matrix) throw new Error(`Unknown terrain matrix: ${id}`);
    return matrix;
  }
}

function tileKey(id: string, column: number, row: number): string {
  return JSON.stringify([id, column, row]);
}

function copyTileData(tile: TerrainTile, matrix: TileMatrix): TileData {
  const [width, height] = matrix.tileSize;
  if (
    tile.heights.length !== width * height ||
    (tile.validity && tile.validity.length !== width * height)
  )
    throw new Error('Terrain tile buffers must match tileSize');
  if (
    !(tile.heights instanceof Float32Array || tile.heights instanceof Float64Array) ||
    (tile.validity !== undefined && !(tile.validity instanceof Uint8Array))
  )
    throw new Error('Invalid terrain tile buffer types');
  const heights = new Float64Array(width * height);
  const validity = new Uint8Array(width * height);
  for (let index = 0; index < heights.length; index++) {
    if (Number.isFinite(tile.heights[index]) && (!tile.validity || tile.validity[index])) {
      heights[index] = tile.heights[index];
      validity[index] = 1;
    }
  }
  return {heights, validity};
}

function freezeChanges(changes: TerrainHaloChange[]): readonly TerrainHaloChange[] {
  changes.sort(
    (a, b) =>
      (a.matrixId < b.matrixId ? -1 : a.matrixId > b.matrixId ? 1 : 0) ||
      a.row - b.row ||
      a.column - b.column
  );
  return Object.freeze(changes.map(change => Object.freeze(change)));
}
