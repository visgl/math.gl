// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {WebMercatorViewport} from '@deck.gl/core';
import {SharedTile2DLayer, sharedTile2DDeckAdapter} from '@deck.gl-community/geo-layers';
import {getCutViewports, getCutRegions, isCutMap} from './view-adapter.ts';
import {getMap} from './view-adapter.ts';

const geographicReference = new WebMercatorViewport({width: 1, height: 1});

/** Adapt the published shared tiler to a cut map's geographic sampling views. */
export function createCutTileAdapter(getMap, {pixelRatio = 1} = {}) {
  let selectedRegions = new Map();
  return {
    getTileIndices(context) {
      const id = getMap(context.viewState);
      selectedRegions = new Map();
      if (!id) return [];
      if (!isCutMap(id)) {
        if (!context.viewState.isGeospatial || context.viewState.zoom < 3) return [];
        return sharedTile2DDeckAdapter.getTileIndices({...context, zoomOffset: -1});
      }
      const sampling = getCutViewports(id, context.viewState, {pixelRatio});
      // Small insets become crisp first, before filling the much larger mainland.
      sampling.sort((a, b) => (a.id.endsWith('-hawaii') ? -1 : b.id.endsWith('-hawaii') ? 1 : 0));
      const selected = new Map();
      const regions = getCutRegions(id);
      for (const viewport of sampling) {
        const part = regions.find(r => viewport.id === 'sample-' + id + '-' + r.id)?.index ?? 0;
        for (const index of sharedTile2DDeckAdapter.getTileIndices({
          ...context,
          viewState: viewport,
          zoomOffset: 0
        })) {
          const subdivisions = 2 ** Math.max(0, Math.min(3, context.maxZoom ?? 3) - index.z);
          const zoom = Math.max(Math.min(3, context.maxZoom ?? 3), index.z);
          const n = 2 ** zoom;
          for (let y = 0; y < subdivisions; y++)
            for (let x = 0; x < subdivisions; x++) {
              const row = index.y * subdivisions + y;
              if (row < 0 || row >= n) continue;
              const wrapped = {z: zoom, x: (((index.x * subdivisions + x) % n) + n) % n, y: row};
              const key = wrapped.z + '/' + wrapped.x + '/' + wrapped.y;
              selected.set(key, wrapped);
              const previous = selectedRegions.get(key);
              selectedRegions.set(key, {index: wrapped, mask: (previous?.mask || 0) | (1 << part)});
            }
        }
      }
      return [...selected.values()];
    },
    getTilePartMask(tile, tileset) {
      const index = tile.index;
      let mask = selectedRegions.get(index.z + '/' + index.x + '/' + index.y)?.mask || 0;
      for (const selected of selectedRegions.values()) {
        if (selected.index.z <= index.z) continue;
        const scale = 2 ** (selected.index.z - index.z);
        if (
          Math.floor(selected.index.x / scale) === index.x &&
          Math.floor(selected.index.y / scale) === index.y &&
          !tileset.getTile(selected.index)?.isLoaded
        )
          mask |= selected.mask;
      }
      return mask;
    },
    getTileBoundingBox(context, index) {
      return sharedTile2DDeckAdapter.getTileBoundingBox(
        {...context, viewState: geographicReference},
        index
      );
    }
  };
}

/** The shared tiler handles selection; geometry is already projected into the cut map. */
export class CutTileLayer extends SharedTile2DLayer {
  static layerName = 'CutTileLayer';
  getSubLayerPropsByTile(
    tile
  ): Partial<import('@deck.gl/core').LayerProps> & {allowedParts: number} {
    return {
      allowedParts:
        (this.state.tileset.adapter as ReturnType<typeof createCutTileAdapter>).getTilePartMask?.(
          tile,
          this.state.tileset
        ) ?? 0xffffffff
    };
  }
  filterSubLayer(context) {
    return super.filterSubLayer({...context, cullRect: null});
  }
}

const meshes = new WeakMap();
export function getCutTileMesh(id, tile, content) {
  let cache = meshes.get(content);
  if (!cache) {
    cache = new Map();
    meshes.set(content, cache);
  }
  if (cache.has(id)) return cache.get(id);
  const {west, south, east, north} = tile.bbox;
  const mesh = prepareMapSurface(getMap(id), {
    textureBounds: [west, south, east, north],
    textureProjection: 'mercator',
    // Keep a fixed tessellation budget per tile at every zoom.
    maxAngularStep: [(east - west) / 16, (north - south) / 16]
  });
  cache.set(id, mesh);
  return mesh;
}

import {prepareMapSurface} from '@math.gl/geospatial/maps';
