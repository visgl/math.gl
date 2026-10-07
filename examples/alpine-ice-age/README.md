# Alpine Ice Age

Animate the last Alpine glacial cycle from **119 ka to the present** using the
published PISM output of Seguinot and colleagues. Switch between oblique relief and
a map, scrub the ice-area chart, change playback speed or vertical exaggeration,
and reveal terrain colors beneath the ice. Playback stops at the present.

## Run

From the repository root, run `yarn workspace math.gl-alpine-ice-age start`.
Use `yarn workspace math.gl-alpine-ice-age build` for a standalone build and
`yarn workspace math.gl-alpine-ice-age test` for dataset/interpolation checks.

## Data and attribution

Julien Seguinot, Susan Ivy-Ochs, Guillaume Jouvet, Matthias Huss, Martin Funk and
Frank Preusser (2018), [Modelling last glacial cycle ice dynamics in the Alps](https://doi.org/10.5194/tc-12-3265-2018),
The Cryosphere 12, 3265–3285.

[Alpine ice sheet glacial cycle simulations continuous variables, version 3](https://doi.org/10.5281/zenodo.7802275),
Julien Seguinot (2023). Source file: `alpcyc.2km.epic.pp.ex.1ka.nc`.
The dataset and the derived assets in `data/` retain their
[Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/)
license. The example code is MIT. No glacier solver is bundled.

The selected simulation uses EPICA temperature forcing and palaeo-precipitation
reduction. The 2 km source is sampled at alternate grid nodes (4 km) for display;
all 120 published 1 ka snapshots are retained. Bed elevations and ice
thickness are rounded to integer metres. Bedrock uses the present model snapshot
and is held fixed; the isostatic bed changes in the source are not animated.
Coordinates retain the model's UTM zone 32 frame. Place names provide modern
orientation and do not imply ancient settlement.

Ice thickness is linearly interpolated between 1 ka samples. Intermediate margins
are visualization, not additional model output. The terrain-reveal option blends
terrain colors into the ice surface; it does not simulate optical transmission.
Relief exaggeration applies to both bedrock and ice. The timeline's LGM chapter
at 24 ka is an approximate reference, not a claim that all lobes peaked together.
Günz, Mindel and Riss are outside this dataset and are not represented.

Area and volume use the original 2 km source grid, not the display mesh. Ice area
counts cells with thickness above 10 m; volume sums thickness times 4 km². Values
between snapshots interpolate these totals and are model estimates, not field
measurements. Grid-cell areas use the nominal model spacing.

## Reproduce the browser asset

Download the source file linked above, then use a temporary Python environment:

```sh
python -m pip install -r examples/alpine-ice-age/scripts/requirements.txt
python examples/alpine-ice-age/scripts/prepare-data.py /path/to/alpcyc.2km.epic.pp.ex.1ka.nc
```

The converter verifies the published MD5 before reading data and records the
source SHA-256 and compressed-asset SHA-256 in `data/manifest.json`. The asset
contains little-endian Int16 bedrock followed by time-major Uint16 thickness,
gzip-compressed with a deterministic timestamp. Its browser decoder validates
length before constructing typed-array views. The source NetCDF is not committed.

The terrain mesh uses math.gl `Vector3` operations for surface normals and deck.gl
for the Cartesian orbit view, mesh shading, place labels and picking-free display.
