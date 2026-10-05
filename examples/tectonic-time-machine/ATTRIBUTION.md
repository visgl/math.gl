# Terrain image attribution

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
