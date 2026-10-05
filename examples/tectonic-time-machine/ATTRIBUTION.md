# Data attribution

## Cao et al. (2024): CAO2024

The optional runtime dataset is **Earth's tectonic and plate boundary evolution over
1.8 billion years**, by Xianzhi Cao, Alan Collins, Sergei Pisarevsky, Nicolas Flament, Sanzhong Li,
Derrick Hasterok and Dietmar Müller. The example defaults to this reconstruction.

- Paper: [Cao et al. (2024), Geoscience Frontiers](https://doi.org/10.1016/j.gsf.2024.101922).
- Licensed dataset: [Zenodo v2.4, record 13628813](https://zenodo.org/records/13628813).
- License: [Creative Commons Attribution 4.0 International (CC-BY-4.0)](https://creativecommons.org/licenses/by/4.0/).
- Geometry served by GPlates: [ContinentalPolygons.zip](https://repo.gplates.org/webdav/pmm/cao2024/ContinentalPolygons.zip),
  entry `ContinentalPolygons/shapes_continents.gpmlz`.
- Rotations: [GPlates quaternion service](https://gwsdoc.gplates.org/rotation/quaternions/),
  explicitly selecting `CAO2024`.

License verification: the Zenodo record's license metadata is `cc-by-4.0` and the
archive README adds no conflicting restrictions. The decompressed GPlates continental
geometry was compared byte-for-byte with `1.8Ga_model_GSF/shapes_continents.gpmlz`
in that licensed record. They match. The GPlates ZIP revision is pinned by SHA-256
`5b024724d95f476427ee71c90afb086265aa13845210e08326b026400c0f01bd`;
changed geometry is rejected until the revision and its license can be checked again.

Changes for display: rings are simplified and triangulated, finite rotations are
interpolated between 10 Ma samples, and modern terrain is applied for visual context.
These continental blocks are not reconstructed ancient shorelines or topography.
The example credits the authors, links the dataset and license, and indicates these
changes in its information box. No model dataset is committed to math.gl.

## Müller et al. (2022): MULLER2022

The alternative reconstruction uses [Müller et al. (2022)](https://doi.org/10.5194/se-13-1127-2022)
rotations and [Merdith et al. (2021)](https://doi.org/10.1016/j.earscirev.2020.103477)
coastline templates, fetched at runtime. See the [model data record](https://zenodo.org/records/13636799)
for source data terms. Geometry and rotations stay paired with this model; they are
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
