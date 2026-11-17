// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {DATASETS} from './sources.ts';
export async function loadClimate(signal?: AbortSignal): Promise<Climate> {
  const response = await fetch(DATASETS.climate, {signal});
  if (!response.ok) throw new Error(`Climate data: HTTP ${response.status}`);
  return response.json();
}
function interpolate(rows: readonly (readonly [number, number])[], age: number): number | null {
  if (age < rows[0][0] || age > rows.at(-1)![0]) return null;
  const upper = rows.findIndex(row => row[0] >= age);
  if (upper === 0 || rows[upper][0] === age) return rows[upper][1];
  const a = rows[upper - 1],
    b = rows[upper];
  return a[1] + ((age - a[0]) / (b[0] - a[0])) * (b[1] - a[1]);
}
export function climateAt(age: number, climate: Climate) {
  const temperature = interpolate(climate.temperature, age);
  return {
    temperature: temperature === null ? null : temperature - climate.temperature[0][1],
    albedo: interpolate(climate.albedo, age)
  };
}

export type Climate = {temperature: [number, number][]; albedo: [number, number][]};
