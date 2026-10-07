// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
export function tectonicSources(source) {
  const entries = [
    {
      id: source.id,
      title: "Plate geometry and finite rotations",
      credit: source.citation,
      creators:
        source.id === "CAO2024"
          ? "Xianzhi Cao, Alan Collins, Sergei Pisarevsky, Nicolas Flament, Sanzhong Li, Derrick Hasterok and Dietmar Müller (2024)."
          : "R. Dietmar Müller, Nicolas Flament, John Cannon, Michael G. Tetley, Simon E. Williams, Xianzhi Cao, Ömer F. Bodur, Sabin Zahirovic and Andrew Merdith (2022).",
      dataset: source.dataset,
      paper: source.reference,
      license: "CC BY 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
      hosted: source.snapshot.replace(
        "https://media.githubusercontent.com/media/visgl/deck.gl-data/",
        "https://github.com/visgl/deck.gl-data/tree/",
      ),
      changes:
        "Lossless Parquet conversion; geometry simplified for display and rotations interpolated. Present-day templates are carried as rigid blocks. Future motion and glaciation shading are illustrative.",
    },
  ];
  if (source.id === "MULLER2022")
    entries.push({
      id: "merdith",
      title: "Coastline templates",
      credit: "Merdith et al. (2021)",
      dataset: source.dataset,
      paper: "https://doi.org/10.1016/j.earscirev.2020.103477",
      license: "CC BY 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
      changes:
        "Coastline geometry supplied within the Müller model archive and simplified for display.",
    });
  entries.push({
    id: "blue-marble",
    title: "Modern terrain imagery",
    credit: "NASA Blue Marble",
    creators:
      "Reto Stöckli and Robert Simmon / NASA Earth Observatory; topography: USGS.",
    dataset:
      "https://science.nasa.gov/earth/earth-observatory/the-blue-marble-true-color-global-imagery-at-1km-resolution/",
    license: "NASA imagery use guidelines",
    licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
    changes:
      "Resampled modern imagery carried with the plate templates; ancient terrain and vegetation are not reconstructed.",
  });
  return entries;
}
