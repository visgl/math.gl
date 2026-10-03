// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Authored synthetic grids: analytically checkable, no third-party grid data or network access.
import type {DatumGridGeoTIFF, DatumGridGeoTIFFImage} from '@math.gl/proj4/experimental';
export type GridFixture = {
  name?: string;
  parent?: string;
  origin?: [number, number];
  step?: number;
  size?: number;
  /** West-positive longitude and latitude shifts in arcseconds, at west-positive degree nodes. */
  shift?: (x: number, y: number) => [number, number];
};
export function makeNTv2(
  subgrids: GridFixture[] = [{}],
  little = true,
  errors = true
): ArrayBuffer {
  const stride = errors ? 16 : 8;
  const buffer = new ArrayBuffer(
    176 + subgrids.reduce((sum, g) => sum + 176 + (g.size || 4) ** 2 * stride, 0)
  );
  const view = new DataView(buffer);
  const text = (offset: number, value: string) => {
    for (let i = 0; i < 8; i++) view.setUint8(offset + i, (value[i] || ' ').charCodeAt(0));
  };
  const integer = (offset: number, label: string, value: number) => {
    text(offset, label);
    view.setInt32(offset + 8, value, little);
  };
  const real = (offset: number, label: string, value: number) => {
    text(offset, label);
    view.setFloat64(offset + 8, value, little);
  };
  integer(0, 'NUM_OREC', 11);
  integer(16, 'NUM_SREC', 11);
  integer(32, 'NUM_FILE', subgrids.length);
  text(48, 'GS_TYPE');
  text(56, 'SECONDS');
  text(64, 'VERSION');
  text(72, 'TEST');
  text(80, 'SYSTEM_F');
  text(88, 'TEST');
  text(96, 'SYSTEM_T');
  text(104, 'WGS84');
  real(112, 'MAJOR_F', 6378137);
  real(128, 'MINOR_F', 6356752.314245179);
  real(144, 'MAJOR_T', 6378137);
  real(160, 'MINOR_T', 6356752.314245179);
  let offset = 176;
  for (const grid of subgrids) {
    const size = grid.size || 4,
      step = grid.step || 1,
      [x, y] = grid.origin || [0, 0];
    text(offset, 'SUB_NAME');
    text(offset + 8, grid.name || 'TEST');
    text(offset + 16, 'PARENT');
    text(offset + 24, grid.parent || 'NONE');
    real(offset + 64, 'S_LAT', y * 3600);
    real(offset + 80, 'N_LAT', (y + (size - 1) * step) * 3600);
    real(offset + 96, 'E_LONG', x * 3600);
    real(offset + 112, 'W_LONG', (x + (size - 1) * step) * 3600);
    real(offset + 128, 'LAT_INC', step * 3600);
    real(offset + 144, 'LONG_INC', step * 3600);
    integer(offset + 160, 'GS_COUNT', size * size);
    for (let row = 0; row < size; row++)
      for (let col = 0; col < size; col++) {
        const delta = (grid.shift || ((lon, lat) => [2 + lon * 4, 1 + lat * 3]))(
          x + col * step,
          y + row * step
        );
        const node = offset + 176 + (row * size + col) * stride;
        view.setFloat32(node, delta[1], little);
        view.setFloat32(node + 4, delta[0], little);
        if (errors) {
          view.setFloat32(node + 8, 0.1, little);
          view.setFloat32(node + 12, 0.2, little);
        }
      }
    offset += 176 + size * size * stride;
  }
  return buffer;
}
export function makeGeoTIFF(
  images: GridFixture[] = [{}],
  v3 = false,
  nodata?: number
): DatumGridGeoTIFF {
  return {
    async getImageCount() {
      return images.length;
    },
    async getImage(index): Promise<DatumGridGeoTIFFImage> {
      const grid = images[index],
        size = grid.size || 4,
        step = grid.step || 1,
        [x, y] = grid.origin || [0, 0];
      const lat = new Float64Array(size * size),
        lon = new Float64Array(size * size);
      for (let row = 0; row < size; row++)
        for (let col = 0; col < size; col++) {
          const delta = (grid.shift || ((west, north) => [2 + west * 4, 1 + north * 3]))(
            x + (size - 1 - col) * step,
            y + (size - 1 - row) * step
          );
          lat[row * size + col] = delta[1];
          lon[row * size + col] = -delta[0];
        }
      return {
        getWidth: () => size,
        getHeight: () => size,
        getBoundingBox: () => [-x - (size - 1) * step, y - step, -x + step, y + (size - 1) * step],
        fileDirectory: v3 ? {getValue: () => [step, step, 0]} : {ModelPixelScale: [step, step, 0]},
        readRasters: async () => [lat, lon],
        getGDALNoData: () => nodata ?? null
      };
    }
  };
}
