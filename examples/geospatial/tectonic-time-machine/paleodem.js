// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original display adapter; Scotese/Wright source data retain CC-BY-4.0 attribution.
import {createParquetReader} from './parquet-stream.js';
import {snapshotRequest} from './snapshot-request.js';

const COMMIT = 'eaa2649826c795492ee89a2632d863788545f2a2';
const PATH = `visgl/deck.gl-data/${COMMIT}/earth/paleogeography/v1/paleodem`;
export const PALEODEM = {
  manifest: `https://raw.githubusercontent.com/${PATH}/manifest.json`,
  data: `https://media.githubusercontent.com/media/${PATH}/paleodem.parquet`,
  dataset: 'https://doi.org/10.5281/zenodo.5460860'
};

export function terrainBracket(time, result = {}) {
  if (!Number.isFinite(time) || time > 0 || time < -540) return null;
  const age = Math.max(0, -time);
  const younger = Math.floor(age / 5) * 5;
  const older = Math.ceil(age / 5) * 5;
  result.younger = younger;
  result.older = older;
  result.blend = older === younger ? 0 : (age - younger) / 5;
  return result;
}

export function validateTerrainManifest(manifest) {
  const file = manifest.files?.find(entry => entry.path === 'paleodem.parquet');
  if (manifest.license !== 'CC-BY-4.0' || manifest.version !== 'v2' ||
      manifest.sourceSha256 !== 'db43e6261411ff468c9030ca240778a73f224bf34bf8186c735477e41454c873' ||
      file?.bytes !== 3111980 || file.rowGroups !== 109 || manifest.rowGroups?.length !== 109)
    throw new Error('Unexpected PaleoDEM snapshot provenance');
  for (let index = 0; index < 109; index++) {
    const group = manifest.rowGroups[index];
    if (group.index !== index || group.ageMa !== index * 5 ||
        !((group.width === 361 && group.height === 181) ||
          (group.width === 360 && group.height === 180)) ||
        group.rows !== group.width * group.height ||
        JSON.stringify(group.bbox) !== JSON.stringify([-180, 91 - group.height, group.width - 181, 90]))
      throw new Error('Unexpected PaleoDEM source grid');
  }
  return manifest;
}

/** Decode elevation only. Dimensions/order come from the pinned source manifest. */
export async function loadPaleoTerrain({signal, workerUrl, fetchFile = fetch, readBatches,
  onUpdate = () => {}}) {
  const manifest = validateTerrainManifest(await snapshotRequest(PALEODEM.manifest,
    {signal, fetchFile}, async response => {
      if (!response.ok) throw new Error(`PaleoDEM manifest returned HTTP ${response.status}`);
      return response.json();
    }));
  const read = readBatches || createParquetReader(fetchFile, {workerUrl});
  const frames = new Map();
  const pending = new Map();
  let desired = null;
  const bracketScratch = {}, pose = {};
  const oldest = {younger: 540, older: 540};
  let running = false;
  let failed = false;
  async function frame(age) {
    if (frames.has(age)) return frames.get(age);
    if (pending.has(age)) return pending.get(age);
    const group = manifest.rowGroups[age / 5];
    const operation = (async () => {
      const elevation = new Float32Array(group.rows);
      let offset = 0;
      for await (const batch of read(PALEODEM.data, {
        signal, columns: ['elevation_m'], rowGroups: [group.index], byteLength: manifest.files[0].bytes
      })) {
        const values = batch.data.getChild('elevation_m');
        if (!values || offset + values.length > elevation.length)
          throw new Error('Invalid PaleoDEM elevation batch');
        for (let i = 0; i < values.length; i++) {
          const value = values.get(i);
          if (!Number.isFinite(value) || value === null) throw new Error('Invalid PaleoDEM height');
          elevation[offset++] = value;
        }
      }
      signal.throwIfAborted();
      if (offset !== elevation.length) throw new Error('Incomplete PaleoDEM grid');
      const result = {age, width: group.width, height: group.height,
        size: new Float32Array([group.width, group.height]), elevation};
      frames.set(age, result);
      onUpdate();
      return result;
    })();
    pending.set(age, operation);
    try {return await operation;} finally {pending.delete(age);}
  }
  // One decode at a time. Re-evaluate the requested age after each grid, so seeks
  // take priority over lookahead. The cache holds 28 MB of elevation, not JS rows.
  async function fill() {
    if (running || failed) return;
    running = true;
    try {
      while (!signal.aborted && desired) {
        const {younger, older} = desired;
        const ages = [younger, older];
        for (let age = younger - 5; age >= 0; age -= 5) ages.push(age);
        for (let age = older + 5; age <= 540; age += 5) ages.push(age);
        const next = ages.find(age => !frames.has(age));
        if (next === undefined) break;
        await frame(next);
      }
    } catch (error) {
      if (!signal.aborted) {failed = true; onUpdate(error);}
    } finally {running = false;}
  }
  return {
    get(time) {
      const bracket = terrainBracket(time, bracketScratch);
      desired = bracket || (time < -540 ? oldest : null);
      void fill();
      if (!bracket) return null;
      const a = frames.get(bracket.younger), b = frames.get(bracket.older);
      if (!a || !b) return null;
      pose.a = a; pose.b = b; pose.blend = bracket.blend;
      return pose;
    },
    get failed() {return failed;}
  };
}
