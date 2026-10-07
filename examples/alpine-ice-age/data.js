// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
export function sampleAt(ages, age) {
  const value = Math.max(ages.at(-1), Math.min(ages[0], age));
  let index = 0;
  while (index < ages.length - 2 && ages[index + 1] > value) index++;
  return { index, fraction: (ages[index] - value) / (ages[index] - ages[index + 1]) };
}
export function interpolateField(values, count, ages, age, output = new Float32Array(count)) {
  const { index, fraction } = sampleAt(ages, age);
  for (let i = 0; i < count; i++)
    output[i] =
      values[index * count + i] * (1 - fraction) + values[(index + 1) * count + i] * fraction;
  return output;
}
export async function loadSimulation(signal) {
  const manifestResponse = await fetch(new URL('./data/manifest.json', import.meta.url), {
    signal
  });
  if (!manifestResponse.ok) throw new Error(`Dataset manifest: HTTP ${manifestResponse.status}`);
  const manifest = await manifestResponse.json();
  const response = await fetch(new URL('./data/alpine.bin.gz', import.meta.url), { signal });
  if (!response.ok) throw new Error(`Glacier data: HTTP ${response.status}`);
  const raw = await new Response(
    response.body.pipeThrough(new DecompressionStream('gzip'))
  ).arrayBuffer();
  const count = manifest.width * manifest.height;
  if (raw.byteLength !== count * 2 * (1 + manifest.ages.length))
    throw new Error('Glacier dataset has an unexpected length');
  return {
    manifest,
    bed: new Int16Array(raw, 0, count),
    ice: new Uint16Array(raw, count * 2),
    count
  };
}
export async function loadGlobalSimulation(signal) {
  const response = await fetch(new URL('./data/global-manifest.json', import.meta.url), { signal });
  if (!response.ok) throw new Error(`Global manifest: HTTP ${response.status}`);
  const manifest = await response.json();
  const asset = await fetch(new URL('./data/global.bin.gz', import.meta.url), { signal });
  if (!asset.ok) throw new Error(`Global ice data: HTTP ${asset.status}`);
  const raw = await new Response(
    asset.body.pipeThrough(new DecompressionStream('gzip'))
  ).arrayBuffer();
  const count = manifest.width * manifest.height,
    length = count * manifest.ages.length;
  if (raw.byteLength !== length * 4) throw new Error('Global dataset has an unexpected length');
  return {
    manifest,
    count,
    bed: new Int16Array(raw, 0, length),
    ice: new Uint16Array(raw, length * 2)
  };
}
