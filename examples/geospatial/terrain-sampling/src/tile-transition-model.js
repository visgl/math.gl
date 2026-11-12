// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {
  HeightField,
  TerrainSampleStatus,
  createTerrainLodMorph,
  evaluateTerrainLodMorph,
  coordinateTerrainLodMorphs,
  createTerrainMesh,
  createTerrainMixedVertexTileHalos,
  createTerrainGradientGrid
} from '@math.gl/geospatial';

function sample(field, x, y) {
  if (!field) return undefined;
  const value = field.sample(x, y, {interpolation: 'triangle'});
  return value.status === TerrainSampleStatus.VALID ? value.height : undefined;
}

/** One physical scene drives the mesh, morph profile, and native-resolution derivatives. */
export function createTileTransitionScene({
  ratio,
  surface,
  factor,
  independent,
  coarseFactor,
  fineFactor,
  coordinate,
  resident,
  missing,
  method,
  sectionY
}) {
  const height =
    surface === 'plane'
      ? (x, y) => 3 + 0.2 * x + 0.1 * y
      : (x, y) => 3 + 0.2 * x + Math.sin(y * 0.7) + Math.cos(x * 0.4);
  const make = (column, spacing, morphFactor) => {
    const fieldAt = step => {
      const size = 8 / step + 1;
      const heights = Float64Array.from({length: size * size}, (_, i) =>
        height(column + (i % size) * step, Math.floor(i / size) * step)
      );
      if (missing && column < 0 && step === spacing * 2) heights[size - 1] = NaN;
      return new HeightField({
        width: size,
        height: size,
        heights,
        origin: [column, 0],
        columnStep: [step, 0],
        rowStep: [0, step]
      });
    };
    const source = fieldAt(spacing),
      coarse = fieldAt(spacing * 2);
    return {
      column,
      row: 0,
      spacing,
      factor: morphFactor,
      source,
      morph: createTerrainLodMorph(source, coarse, {ratio: 2})
    };
  };
  const prepared = [
    ...(resident ? [make(-8, ratio, independent ? coarseFactor : factor)] : []),
    make(0, 1, independent ? fineFactor : factor)
  ];
  const raw = prepared.map(t => ({
    column: t.column,
    row: 0,
    spacing: t.spacing,
    field: {
      ...evaluateTerrainLodMorph(t.morph, t.factor),
      width: t.morph.width,
      height: t.morph.height,
      origin: t.morph.origin,
      columnStep: t.morph.columnStep,
      rowStep: t.morph.rowStep,
      diagonal: t.morph.diagonal,
      heightReference: t.morph.heightReference
    }
  }));
  const coordinated = coordinate ? coordinateTerrainLodMorphs(prepared) : null;
  const materialize = tiles =>
    tiles.map(t => {
      const field = new HeightField(t.field);
      return {...t, field, mesh: createTerrainMesh(field)};
    });
  const rawTiles = materialize(raw);
  const tiles = materialize(coordinated?.tiles || raw);
  // Retain native stencil spacing after the coordinator densifies geometry to its common lattice.
  const native = prepared.map(source => {
    const displayed = tiles.find(t => t.column === source.column);
    const size = 8 / source.spacing + 1;
    return {
      column: source.column,
      row: 0,
      spacing: source.spacing,
      field: {
        width: size,
        height: size,
        origin: [source.column, 0],
        columnStep: [source.spacing, 0],
        rowStep: [0, source.spacing],
        heights: Float64Array.from(
          {length: size * size},
          (_, i) =>
            displayed.field.getHeight(
              ((i % size) * source.spacing) / displayed.spacing,
              (Math.floor(i / size) * source.spacing) / displayed.spacing
            ) ?? NaN
        )
      }
    };
  });
  const haloTiles = createTerrainMixedVertexTileHalos(native).tiles;
  const gradients = native.map(source => {
    const halo = haloTiles.find(t => t.column === source.column);
    const own = new HeightField(source.field),
      width = halo.field.width;
    const heights = halo.field.heights.slice(),
      validity = halo.field.validity.slice();
    // Halos supply outside samples, but must not silently repair an uncoordinated tile's interior.
    for (let y = 0; y < own.height; y++)
      for (let x = 0; x < own.width; x++) {
        const value = own.getHeight(x, y),
          i = (y + 1) * width + x + 1;
        heights[i] = value ?? 0;
        validity[i] = value === undefined ? 0 : 1;
      }
    const grid = createTerrainGradientGrid(new HeightField({...halo.field, heights, validity}), {
      method
    });
    const at = (x, y) => {
      if (!Number.isInteger(x) || !Number.isInteger(y)) return null;
      const i = (y + 1) * width + x + 1;
      return grid.statuses[i] === TerrainSampleStatus.VALID
        ? {x: grid.gradients[i * 2], y: grid.gradients[i * 2 + 1]}
        : null;
    };
    const nodes = Array.from({length: own.width * own.height}, (_, i) => {
      const x = i % own.width,
        y = Math.floor(i / own.width);
      return {x: source.column + x * source.spacing, y: y * source.spacing, gradient: at(x, y)};
    });
    return {...source, at, nodes};
  });
  const fine = tiles.find(t => t.column === 0),
    coarse = tiles.find(t => t.column < 0);
  const fineGrad = gradients.find(t => t.column === 0),
    coarseGrad = gradients.find(t => t.column < 0);
  const seam = Array.from({length: 7}, (_, i) => {
    const y = i + 1;
    return {
      y,
      fine: fineGrad.at(0, y),
      coarse: coarseGrad?.at(coarseGrad.field.width - 1, y / ratio) ?? null,
      coarseNode: Boolean(coarseGrad && y % ratio === 0)
    };
  });
  const section = tiles.map(tile => {
    const original = prepared.find(t => t.column === tile.column),
      rawTile = rawTiles.find(t => t.column === tile.column);
    return {
      column: tile.column,
      samples: Array.from({length: 33}, (_, i) => {
        const x = tile.column + i / 4;
        return {
          x,
          fine: sample(original.source, x, sectionY),
          raw: sample(rawTile.field, x, sectionY),
          displayed: sample(tile.field, x, sectionY)
        };
      })
    };
  });
  const a = sample(coarse?.field, 0, sectionY),
    b = sample(fine.field, 0, sectionY);
  const rawA = sample(rawTiles.find(t => t.column < 0)?.field, 0, sectionY),
    rawB = sample(rawTiles.find(t => t.column === 0)?.field, 0, sectionY);
  return {
    tiles,
    gradients,
    seam,
    section,
    gap: a === undefined || b === undefined ? null : Math.abs(a - b),
    rawGap: rawA === undefined || rawB === undefined ? null : Math.abs(rawA - rawB),
    adjustment: coordinated?.maxHeightAdjustment ?? 0
  };
}
