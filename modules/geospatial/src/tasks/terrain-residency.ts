// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Task} from '@math.gl/tasks';
import type {TerrainMixedHaloSnapshot} from '../terrain/mixed-halo-update';
import type {TerrainMixedVertexTile} from '../terrain/mixed-vertex-halos';

type TileAddress = Pick<TerrainMixedVertexTile, 'column' | 'row' | 'spacing'>;
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
  input: {revision: number; edits: readonly TerrainResidencyEdit[]} | {type: 'snapshot'};
  output: {revision: number; tiles: ResidentHalo[]; removed: string[]};
};

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

/** Keep mixed halo sources and outputs resident across serialized edit batches. */
export const TerrainResidencyTask = {
  id: 'terrain-residency',
  initialize(limits): TerrainResidencyTypes['state'] {
    return {limits: {...limits}, snapshot: null, revision: 0};
  },
  async process(input, _options, context) {
    const state = context.state;
    if ('type' in input) {
      if (input.type !== 'snapshot') throw new Error('Unknown terrain residency request');
      return {
        revision: state.revision,
        tiles: structuredClone(state.snapshot?.tiles ?? []),
        removed: []
      };
    }
    if (input.revision !== state.revision) throw new Error('Stale terrain residency revision');

    const [{updateTerrainMixedVertexTileHalos}, {HeightField}] = await Promise.all([
      import('../terrain/mixed-halo-update'),
      import('../terrain/height-field')
    ]);
    context.throwIfAborted();
    const sources = new Map(state.snapshot?.sources.map(tile => [addressKey(tile), tile]));
    // Several edits to a tile in one batch share one private copy.
    const writable = new Map<string, ReturnType<InstanceType<typeof HeightField>['copyData']>>();
    for (const edit of input.edits) {
      if (edit.type === 'upsert') {
        const key = addressKey(edit.tile);
        sources.set(key, structuredClone(edit.tile));
        writable.delete(key);
        continue;
      }
      const key = addressKey(edit.address);
      if (edit.type === 'remove') {
        sources.delete(key);
        writable.delete(key);
        continue;
      }
      if (edit.type !== 'samples') throw new Error('Unknown terrain residency edit');
      const source = sources.get(key);
      if (!source) throw new Error('Terrain sample edit requires a resident tile');
      if (!edit.samples.length) continue;
      let data = writable.get(key);
      if (!data) {
        const copied = new HeightField(source.field).copyData();
        data = {heights: copied.heights, validity: copied.validity};
        writable.set(key, data);
        sources.set(key, {
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
        if (!Number.isFinite(data.heights[index])) throw new Error('Terrain sample edit overflow');
        data.validity[index] = height === null ? 0 : 1;
      }
    }
    const next = updateTerrainMixedVertexTileHalos(
      state.snapshot,
      [...sources.values()],
      state.limits
    );
    const old = new Map(state.snapshot?.tiles.map(tile => [addressKey(tile), tile]));
    // Copy outgoing buffers so transfer cannot detach the resident snapshot.
    const tiles = structuredClone(
      next.tiles.filter(tile => {
        const prior = old.get(addressKey(tile));
        return !prior || !sameHalo(prior, tile);
      })
    );
    context.throwIfAborted();
    state.snapshot = next;
    state.revision++;
    return {revision: state.revision, tiles, removed: next.removed};
  }
} satisfies Task<TerrainResidencyTypes>;
