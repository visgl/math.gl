// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import { DATA_COMMIT } from "./sources.js";
const hosted = `https://github.com/visgl/deck.gl-data/tree/${DATA_COMMIT}/earth/glaciations/v1`;
export const ALPINE_SOURCES = [
  {
    id: "alpine",
    title: "Alpine glacier simulation",
    credit: "Seguinot et al. (2018)",
    creators:
      "Dataset: Julien Seguinot (2023), version 3. Study: Julien Seguinot, Susan Ivy-Ochs, Guillaume Jouvet, Matthias Huss, Martin Funk and Frank Preusser (2018).",
    dataset: "https://zenodo.org/records/7802275",
    paper: "https://doi.org/10.5194/tc-12-3265-2018",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    hosted: `${hosted}/alpine`,
    changes:
      "2 km source grid sampled to 4 km for display. Ice thickness is quantized to metres and snapshots interpolate. Relief is exaggerated; terrain-reveal colors are illustrative.",
  },
];
export const GLOBAL_SOURCES = [
  {
    id: "paleomist",
    title: "PaleoMIST 1.0 ice-sheet reconstruction",
    credit: "Gowan et al. (2021)",
    creators:
      "Dataset: Evan J. Gowan (2019), corrected April 2021 grids. Study: Gowan et al. (2021).",
    dataset: "https://doi.pangaea.de/10.1594/PANGAEA.905800",
    paper: "https://doi.org/10.1038/s41467-021-21469-w",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    hosted: `${hosted}/paleomist`,
    changes:
      "Corrected April 2021 grids, minimal North American MIS 3 scenario. Metre-quantized 1° grid with duplicate longitude seam removed. 2,500-year snapshots interpolate; terrain-reveal colors are illustrative.",
  },
  {
    id: "climate",
    title: "Temperature and land-ice radiative forcing",
    credit: "Köhler et al. (2015)",
    creators:
      "Peter Köhler, Bas de Boer, Anna S. von der Heydt, Lennert B. Stap and Roderik S. W. van de Wal (2015).",
    dataset: "https://doi.pangaea.de/10.1594/PANGAEA.855449",
    paper: "https://doi.org/10.5194/cp-11-1801-2015",
    license: "CC BY 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
    hosted: `${hosted}/koehler2015`,
    changes:
      "0–120 ka subset. Temperature variant 1 rebased to its 0 ka sample. Linear interpolation; albedo forcing unavailable below 2 ka. Independent climate model, not calculated from the displayed ice sheets.",
  },
];

export const OSF_SOURCES = [
  {
    id: "batchelor2019",
    title: "Northern Hemisphere Quaternary ice-sheet extents",
    credit: "Batchelor et al. (2019)",
    creators:
      "Christine L. Batchelor, Martin Margold, Mario Krapp, Della K. Murton, April S. Dalton, Philip L. Gibbard, Chris R. Stokes, Julian B. Murton and Andrea Manica (2019).",
    dataset: "https://osf.io/7jen3/",
    paper: "https://doi.org/10.1038/s41467-019-11601-2",
    license: "Dataset license undeclared",
    licenseUrl: "https://api.osf.io/v2/nodes/7jen3/",
    changes:
      "MIS 16, 12 and 6 best-estimate outlines fetched directly from OSF. Rasterized to 1° display coverage; approximate footprint area. No inferred thickness or volume. Stage reconstructions switch discretely; Alpine name correlations are approximate.",
  },
  {
    ...GLOBAL_SOURCES[0],
    title: "Present-day background bedrock",
    changes:
      "The present-day PaleoMIST bedrock grid is used as background only; it is not a reconstruction of earlier Quaternary terrain.",
  },
];

export const KRAPP_SOURCES = [
  {
    id: "krapp2021",
    title: "Global ice/ocean/land masks",
    credit: "Krapp et al. (2021)",
    dataset: "https://osf.io/8n43x/",
    paper: "https://doi.org/10.1038/s41597-021-01009-3",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    hosted: `${hosted}/krapp2021`,
    changes:
      "Native 0.5° masks aggregated to 1° display coverage; 5,000-year snapshots with linear visual interpolation. Area integrated on the native grid. No thickness or volume. Regional ice-age labels are approximate correlations.",
  },
];
