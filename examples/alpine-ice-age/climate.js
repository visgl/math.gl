// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import climate from "./assets/climate.json" with { type: "json" };
function interpolate(rows, age) {
  if (age < rows[0][0] || age > rows.at(-1)[0]) return null;
  const upper = rows.findIndex((row) => row[0] >= age);
  if (upper === 0 || rows[upper][0] === age) return rows[upper][1];
  const a = rows[upper - 1],
    b = rows[upper];
  return a[1] + ((age - a[0]) / (b[0] - a[0])) * (b[1] - a[1]);
}
export function climateAt(age) {
  const temperature = interpolate(climate.temperature, age);
  return {
    temperature:
      temperature === null ? null : temperature - climate.temperature[0][1],
    albedo: interpolate(climate.albedo, age),
  };
}
