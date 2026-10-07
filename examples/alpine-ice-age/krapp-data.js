// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import { ParquetSource } from "math.gl-parquet-loader";
import { DATASETS } from "./sources.js";
export const KRAPP_CHAPTERS = [
  { age: 650, name: "Günz" },
  { age: 450, name: "Mindel" },
  { age: 160, name: "Riss" },
  { age: 20, name: "Würm" },
  { age: 0, name: "Present" },
];
export function krappPhase(age) {
  if (age >= 620 && age <= 676) return "Günz";
  if (age >= 424 && age <= 478) return "Mindel";
  if (age >= 130 && age <= 191) return "Riss";
  if (age >= 11.7 && age <= 115) return "Würm";
  return "";
}
// Aggregate four native 0.5° cells to one 1° display cell. Pole vertices
// repeat the adjacent strip; area is integrated on the native spherical grid.
export function maskFrame(mask) {
  if (mask.length !== 720 * 360)
    throw new Error("Unexpected Krapp mask dimensions");
  const count = 360 * 181,
    ice = new Float32Array(count),
    bed = new Float32Array(count);
  let area = 0;
  const rad = Math.PI / 180,
    radius = 6371.0088;
  for (let y = 0; y < 360; y++) {
    const cellArea =
      radius ** 2 *
      0.5 *
      rad *
      (Math.sin((-89.5 + y * 0.5) * rad) - Math.sin((-90 + y * 0.5) * rad));
    for (let x = 0; x < 720; x++) {
      const value = mask[y * 720 + x];
      if (![0, 1, 2].includes(value))
        throw new Error("Unexpected Krapp mask class");
      if (value === 2) area += cellArea;
      const i = Math.floor(y / 2) * 360 + Math.floor(x / 2);
      ice[i] += value === 2 ? 0.25 : 0;
      bed[i] += value === 0 ? -250 : 25;
    }
  }
  ice.set(ice.subarray(179 * 360, 180 * 360), 180 * 360);
  bed.set(bed.subarray(179 * 360, 180 * 360), 180 * 360);
  return { ice, bed, area };
}
export async function loadKrappSimulation(
  signal,
  onProgress = () => {},
  { worker = true } = {},
) {
  let source;
  try {
    const response = await fetch(DATASETS.krappManifest, {
      signal: AbortSignal.any([signal, AbortSignal.timeout(30000)]),
    });
    if (!response.ok)
      throw new Error(`Krapp manifest: HTTP ${response.status}`);
    const manifest = await response.json();
    if (manifest.id !== "krapp2021" || manifest.rowGroupIndex?.length !== 800)
      throw new Error("Unexpected Krapp inventory");
    const selected = manifest.rowGroupIndex.filter(
      (g) => g.ageKa % 5 === 0 || g.ageKa === 799,
    );
    const count = 360 * 181,
      ice = new Float32Array(count * selected.length),
      bed = new Float32Array(ice.length);
    const areaKm2 = [],
      ages = [];
    const workerUrl = worker
      ? (await import("math.gl-parquet-loader/worker")).default
      : undefined;
    const bytes = manifest.files.find(
      (file) => file.path === "grids.parquet",
    ).bytes;
    source = new ParquetSource(DATASETS.krapp, {
      core: {
        worker,
        fetch: async (url, options) => {
          const response = await fetch(url, {
            ...options,
            signal: AbortSignal.any([signal, AbortSignal.timeout(30000)]),
          });
          // GitHub serves byte ranges but does not expose Content-Range through CORS.
          const range = new Headers(options?.headers).get("Range");
          const match = range?.match(/^bytes=(\d+)-(\d+)$/);
          if (response.status === 206 && match) {
            const data = await response.arrayBuffer();
            if (data.byteLength !== Number(match[2]) - Number(match[1]) + 1)
              throw new Error("Incomplete Parquet range");
            return new Response(data, {
              status: 206,
              headers: {
                "Content-Range": `bytes ${match[1]}-${match[2]}/${bytes}`,
              },
            });
          }
          return response;
        },
      },
      parquet: { workerUrl },
    });
    for (const [index, group] of selected.entries()) {
      signal.throwIfAborted();
      const mask = new Int16Array(group.rows);
      let offset = 0;
      for await (const batch of source.read({
        columns: ["mask"],
        rowGroups: [group.rowGroup],
        batchSize: group.rows,
        signal,
      })) {
        const values = batch.data.getChild("mask");
        for (let row = 0; row < batch.data.numRows; row++)
          mask[offset++] = values.get(row);
      }
      if (offset !== group.rows)
        throw new Error("Incomplete Krapp mask snapshot");
      const frame = maskFrame(mask);
      ice.set(frame.ice, index * count);
      bed.set(frame.bed, index * count);
      areaKm2.push(frame.area);
      ages.push(group.ageKa);
      onProgress(`${index + 1}/${selected.length} ice-mask snapshots`);
    }
    return {
      maskModel: true,
      count,
      ice,
      bed,
      manifest: {
        width: 360,
        height: 181,
        ages,
        areaKm2,
        volumeKm3: ages.map(() => null),
      },
    };
  } catch (error) {
    if (signal.aborted) return null;
    console.warn("Krapp masks unavailable", error);
    onProgress("Earlier masks unavailable; using PaleoMIST");
    return null;
  } finally {
    await source?.close();
  }
}
