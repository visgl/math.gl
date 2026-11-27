// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";
// Pass an installed d3-geo-projection@4.0.0 src/index.js. No runtime dependency.
const d3 = await import(pathToFileURL(process.argv[2]).href);
const entries = {
  healpix: "geoHealpix",
  gingery: "geoGingery",
  guyou: "geoGuyou",
  "gringorten-quincuncial": "geoGringortenQuincuncial",
  butterfly: "geoPolyhedralButterfly",
  "collignon-butterfly": "geoPolyhedralCollignon",
  waterman: "geoPolyhedralWaterman",
  "interrupted-boggs": "geoInterruptedBoggs",
  "interrupted-quartic-authalic": "geoInterruptedQuarticAuthalic",
  "interrupted-mollweide-hemispheres": "geoInterruptedMollweideHemispheres",
};
const points = [
  [12, 23],
  [45, 15],
  [-35, -25],
  [100, 60],
  [-140, 32],
  [-120, -50],
  [170, -35],
  [80, -70],
  [-20, 70],
];
const cases = Object.entries(entries).map(([type, name]) => {
  const projection = d3[name]()
    .rotate(
      type.includes("hemispheres") || type.includes("quartic")
        ? [20, 0]
        : [0, 0, 0],
    )
    .center([0, 0])
    .scale(1)
    .translate([0, 0])
    .angle(0);
  return {
    type,
    samples: points.map((source) => {
      const [x, y] = projection(source);
      return {
        source,
        expected:
          type === "healpix"
            ? [(x * Math.PI) / 2, (-y * Math.PI) / 2]
            : [x, -y],
      };
    }),
  };
});
// Explicit equatorial cut configurations, not D3's oblique Sinu-Mollweide preset.
for (const [type, raw, limits, rotation, yOffset] of [
  [
    "interrupted-sinu-mollweide",
    d3.geoSinuMollweideRaw,
    [
      [
        [-180, -100, -40],
        [-40, 30, 180],
      ],
      [
        [-180, -160, -100],
        [-100, -60, -20],
        [-20, 20, 80],
        [80, 140, 180],
      ],
    ],
    0,
    0.0528035274542,
  ],
  [
    "goode-ocean",
    d3.geoHomolosineRaw,
    [
      [
        [-180, -140, -90],
        [-90, -10, 60],
        [60, 130, 180],
      ],
      [
        [-180, -110, -60],
        [-60, 20, 90],
        [90, 150, 180],
      ],
    ],
    160,
    0,
  ],
]) {
  const lobes = limits.map((row, h) =>
    row.map(([w, c, e]) => [
      [w, 0],
      [c, h ? -90 : 90],
      [e, 0],
    ]),
  );
  const projection = d3
    .geoInterrupt(raw, lobes)
    .rotate([rotation, 0])
    .center([0, 0])
    .scale(1)
    .translate([0, 0]);
  cases.push({
    type,
    samples: points.map((source) => {
      const [x, y] = projection(source);
      return { source, expected: [x, -y + yOffset] };
    }),
  });
}
writeFileSync(
  new URL("./segmented-reference.json", import.meta.url),
  JSON.stringify(
    {
      reference:
        "d3-geo-projection 4.0.0; scale 1, center/translate/angle zero; screen Y negated; HEALPix output rescaled by pi/2 to PROJ units; equatorial aspect except -20° central meridian for paired hemispheres",
      cases,
    },
    null,
    2,
  ) + "\n",
);
