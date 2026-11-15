// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Task} from '@math.gl/tasks';
import type {TerrainMixedHaloSnapshot} from '../terrain/mixed-halo-update';
import type {TerrainMixedVertexTile} from '../terrain/mixed-vertex-halos';
import type {HeightFieldProps, TerrainArray} from '../terrain/types';

type TileAddress = Pick<TerrainMixedVertexTile, 'column' | 'row' | 'spacing'>;
type TerrainResidencyTimings = {
  applyEditsMs: number;
  updateHalosMs: number;
  prepareDeltaMs: number;
  processMs: number;
};
type ResidentHalo = TerrainMixedHaloSnapshot['tiles'][number];
export type TerrainResidencyEdit =
  | {type: 'upsert'; tile: TerrainMixedVertexTile}
  | {type: 'remove'; address: TileAddress}
  | {
      type: 'samples';
      address: TileAddress;
      /** Row-major sample indices. Null marks nodata. */
      samples: readonly {index: number; height: number | null}[];
    };

export type TerrainResidencyTypes = {
  initialization: {maxSamples?: number; maxTileTests?: number; maxDependencyTests?: number};
  state: {
    limits: TerrainResidencyTypes['initialization'];
    snapshot: TerrainMixedHaloSnapshot | null;
    revision: number;
  };
  input:
    | {revision: number; edits: readonly TerrainResidencyEdit[]; measureStages?: boolean}
    | {type: 'snapshot'};
  output: {
    revision: number;
    tiles: ResidentHalo[];
    removed: string[];
    error?: string;
    timings?: TerrainResidencyTimings;
  };
};

/** Address lookup retained with an immutable source layout, not rebuilt per sample batch. */
const sourceIndexes = new WeakMap<TerrainMixedHaloSnapshot, Map<string, number>>();

const addressKey = ({spacing, column, row}: TileAddress) => `${spacing}/${column}/${row}`;

function sameArray(a: ArrayLike<number>, b: ArrayLike<number>): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (!Object.is(a[i], b[i])) return false;
  return true;
}

function sameHalo(a: ResidentHalo, b: ResidentHalo): boolean {
  if (a === b) return true;
  const af = a.field;
  const bf = b.field;
  const keys = Object.keys(af) as (keyof typeof af)[];
  return (
    keys.length === Object.keys(bf).length &&
    keys.every(key => {
      const left = af[key];
      const right = bf[key];
      if (typeof left === 'object' && typeof right === 'object') return sameArray(left, right);
      return Object.prototype.hasOwnProperty.call(bf, key) && Object.is(left, right);
    }) &&
    sameArray(a.statuses, b.statuses)
  );
}

/** Copy already validated resident samples once, preserving precision and nodata normalization. */
function copyResidentSamples(field: HeightFieldProps): {
  heights: TerrainArray;
  validity: Uint8Array;
} {
  const {width, height, offset = 0, stride = width} = field;
  const heights =
    field.heights instanceof Float64Array
      ? new Float64Array(width * height)
      : new Float32Array(width * height);
  const validity = new Uint8Array(heights.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const input = offset + y * stride + x;
      const output = y * width + x;
      const value = field.heights[input];
      if (Number.isFinite(value) && (!field.validity || field.validity[input] !== 0)) {
        heights[output] = value;
        validity[output] = 1;
      }
    }
  }
  return {heights, validity};
}

/** Compare halo addresses in the order used by the incremental builder. */
function compareAddress(a: TileAddress, b: TileAddress): number {
  return a.spacing - b.spacing || a.column - b.column || a.row - b.row;
}

/** Compute changed outputs with a linear merge over sorted snapshots. */
function changedHalos(previous: readonly ResidentHalo[], next: readonly ResidentHalo[]) {
  const changed: ResidentHalo[] = [];
  let index = 0;
  for (let i = 0; i < next.length; i++) {
    const tile = next[i];
    while (index < previous.length && compareAddress(previous[index], tile) < 0) index++;
    const prior = previous[index];
    if (!prior || (prior !== tile && (compareAddress(prior, tile) !== 0 || !sameHalo(prior, tile))))
      changed.push(tile);
  }
  return changed;
}

/** Keep mixed halo sources and outputs resident across serialized edit batches. */
export const TerrainResidencyTask = {
  id: 'terrain-residency',
  initialize(limits): TerrainResidencyTypes['state'] {
    return {limits: {...limits}, snapshot: null, revision: 0};
  },
  async process(input, _options, context): Promise<TerrainResidencyTypes['output']> {
    const state = context.state;
    if ('type' in input) {
      if (input.type !== 'snapshot') throw new Error('Unknown terrain residency request');
      return {
        revision: state.revision,
        tiles: structuredClone(state.snapshot?.tiles ?? []),
        removed: []
      };
    }
    const start = input.measureStages ? performance.now() : 0;
    try {
      if (input.revision !== state.revision) throw new Error('Stale terrain residency revision');

      const {updateTerrainMixedVertexTileHalos} = await import('../terrain/mixed-halo-update');
      context.throwIfAborted();
      const priorSources = state.snapshot?.sources ?? [];
      let sourceIndex = state.snapshot && sourceIndexes.get(state.snapshot);
      if (!sourceIndex) {
        sourceIndex = new Map();
        for (let i = 0; i < priorSources.length; i++)
          sourceIndex.set(addressKey(priorSources[i]), i);
      }
      // Sample-only transactions copy one reference array. Structural edits lazily
      // create a map; neither path mutates the committed snapshot on rejection.
      const resident = priorSources.slice();
      let structural: Map<string, TerrainMixedVertexTile> | undefined;
      const getSource = (key: string) =>
        structural ? structural.get(key) : resident[sourceIndex.get(key)!];
      const setSource = (key: string, tile: TerrainMixedVertexTile) => {
        if (structural) structural.set(key, tile);
        else resident[sourceIndex.get(key)!] = tile;
      };
      const editLayout = () => {
        if (!structural) {
          structural = new Map();
          for (const tile of resident) structural.set(addressKey(tile), tile);
        }
        return structural;
      };
      // Several edits to a tile in one batch share one private copy.
      const writable = new Map<string, ReturnType<typeof copyResidentSamples>>();
      for (const edit of input.edits) {
        if (edit.type === 'upsert') {
          const key = addressKey(edit.tile);
          editLayout().set(key, structuredClone(edit.tile));
          writable.delete(key);
          continue;
        }
        const key = addressKey(edit.address);
        if (edit.type === 'remove') {
          editLayout().delete(key);
          writable.delete(key);
          continue;
        }
        if (edit.type !== 'samples') throw new Error('Unknown terrain residency edit');
        const source = getSource(key);
        if (!source) throw new Error('Terrain sample edit requires a resident tile');
        if (!edit.samples.length) continue;
        let data = writable.get(key);
        if (!data) {
          // Upserts in this transaction have not passed halo validation yet.
          data = structural
            ? new (await import('../terrain/height-field')).HeightField(source.field).copyData()
            : copyResidentSamples(source.field);
          writable.set(key, data);
          setSource(key, {
            ...source,
            field: {...source.field, ...data, offset: 0, stride: source.field.width}
          });
        }
        for (const {index, height} of edit.samples) {
          if (
            !Number.isSafeInteger(index) ||
            index < 0 ||
            index >= data.heights.length ||
            (height !== null && !Number.isFinite(height))
          ) {
            throw new Error('Invalid terrain sample edit');
          }
          data.heights[index] = height ?? 0;
          if (!Number.isFinite(data.heights[index]))
            throw new Error('Terrain sample edit overflow');
          data.validity[index] = height === null ? 0 : 1;
        }
      }
      const applied = input.measureStages ? performance.now() : 0;
      const next = updateTerrainMixedVertexTileHalos(
        state.snapshot,
        structural ? [...structural.values()] : resident,
        state.limits
      );
      const updated = input.measureStages ? performance.now() : 0;
      // Both snapshots are in address order. Unchanged halos retain object identity.
      const tiles = structuredClone(changedHalos(state.snapshot?.tiles ?? [], next.tiles));
      context.throwIfAborted();
      if (!structural) sourceIndexes.set(next, sourceIndex);
      state.snapshot = next;
      state.revision++;
      const result: TerrainResidencyTypes['output'] = {
        revision: state.revision,
        tiles,
        removed: next.removed
      };
      if (input.measureStages) {
        const finish = performance.now();
        result.timings = {
          applyEditsMs: applied - start,
          updateHalosMs: updated - applied,
          prepareDeltaMs: finish - updated,
          processMs: finish - start
        };
      }
      return result;
    } catch (error) {
      context.throwIfAborted();
      // A rejected transaction preserves the initialized handle on both task transports.
      return {
        revision: state.revision,
        tiles: [],
        removed: [],
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
} satisfies Task<TerrainResidencyTypes>;
