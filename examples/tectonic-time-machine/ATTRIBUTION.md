# Data attribution

## Cao et al. (2024): CAO2024

The optional runtime dataset is **Earth's tectonic and plate boundary evolution over
1.8 billion years**, by Xianzhi Cao, Alan Collins, Sergei Pisarevsky, Nicolas Flament, Sanzhong Li,
Derrick Hasterok and Dietmar Müller. Select this reconstruction to reach Nuna (Columbia).

- Paper: [Cao et al. (2024), Geoscience Frontiers](https://doi.org/10.1016/j.gsf.2024.101922).
- Licensed dataset: [Zenodo v2.4, record 13628813](https://zenodo.org/records/13628813).
- License: [Creative Commons Attribution 4.0 International (CC-BY-4.0)](https://creativecommons.org/licenses/by/4.0/).
- Snapshot: [deck.gl-data / earth/tectonic-movements/v1/cao2024](https://github.com/visgl/deck.gl-data/tree/master/earth/tectonic-movements/v1/cao2024).
- Geometry and rotations derive from the same pinned v2.4 archive; its complementary
  rotation files cover 0–1000 and 1000–1800 Ma. The Parquet metadata and manifest record
  source hashes and coordinate conventions; the sidecar also records output hashes.

Changes for display: rings are simplified and triangulated, finite rotations are
interpolated between 10 Ma samples, and modern terrain is applied for visual context.
These continental blocks are not reconstructed ancient shorelines or topography.
The example credits the authors, links the dataset and license, and indicates these
changes in its information box. No model dataset is committed to math.gl.

## Müller et al. (2022): MULLER2022

The default reconstruction uses [Müller et al. (2022)](https://doi.org/10.5194/se-13-1127-2022)
rotations and [Merdith et al. (2021)](https://doi.org/10.1016/j.earscirev.2020.103477)
coastline templates, fetched at runtime. See the [model data record](https://zenodo.org/records/13636799)
which licenses the model revision v1.2.4 under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/).
Only its complete optimised mantle rotation file is used. The alternative paleomagnetic
rotation model is excluded. Hosted [Parquet snapshots](https://github.com/visgl/deck.gl-data/tree/master/earth/tectonic-movements/v1/muller2022)
retain source/output hashes, author credit and conversion changes. Geometry and rotations stay paired with this model; they are
not combined with CAO2024's different reference frame.

All example implementation code is original MIT code. No GPlates implementation
code is copied or imported; its software license does not replace the datasets' terms.

## Terrain image attribution

The visualization includes NASA's **Blue Marble: Land Surface, Shallow Water, and Shaded Topography**
(2048 × 1024) as `assets/blue-marble.jpg`, served with the example. The image has separate
source terms recorded in its SPDX sidecar and `LICENSES/LicenseRef-NASA-Imagery.txt`.

Source: https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57752/land_shallow_topo_2048.jpg

Description and credits: [NASA Earth Observatory](https://science.nasa.gov/earth/earth-observatory/the-blue-marble-true-color-global-imagery-at-1km-resolution/).
NASA Goddard Space Flight Center. Image by Reto Stöckli; enhancements by Robert Simmon;
shaded topography based on USGS GTOPO30 data.

NASA makes these images freely available to educators, scientists, museums and the public.
See [NASA imagery guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/).
The image is credited separately from the original MIT example code; no NASA endorsement is implied.

The texture depicts modern terrain, not ancient or future vegetation, mountains or ice.
No elevation is inferred from the image or used to change reconstructed coordinates.
If imagery cannot be loaded, the visualization reports it and uses neutral shaded land.

Ocean motion imports `waterMaterial` from the installed `@luma.gl/shadertools` public API,
the same reusable material used by luma.gl's globe. No upstream shader source is copied.
