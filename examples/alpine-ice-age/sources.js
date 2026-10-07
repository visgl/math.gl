// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
export const DATA_COMMIT = '2a69f8a6e01e22c7c6649244a1577c20c74a02ae';
const path = `visgl/deck.gl-data/${DATA_COMMIT}/earth/glaciations/v1`;
const raw = `https://raw.githubusercontent.com/${path}`;
const media = `https://media.githubusercontent.com/media/${path}`;
export const DATASETS = {
  alpineManifest: `${raw}/alpine/preview-manifest.json`,
  alpine: `${media}/alpine/alpine.bin.gz`,
  globalManifest: `${raw}/paleomist/preview-manifest.json`,
  global: `${media}/paleomist/global.bin.gz`,
  climate: `${raw}/koehler2015/climate.json`
};
