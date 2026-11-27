# Earth imagery

Source: **NASA Blue Marble**, served by NASA's Global Imagery Browse Services
(GIBS). The example reuses `../../common/blue-marble.js` and its world image request:

- Service: <https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi>
- Layer: `BlueMarble_ShadedRelief_Bathymetry`
- Request: WMS 1.1.1, EPSG:4326, bounds `[-180,-90,180,90]`, JPEG, 1024 × 512.
- Product: [Blue Marble: Next Generation, topography and bathymetry](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-topography-bathymetry/).
- Attribution displayed in the example: **Earth imagery: NASA Blue Marble**.

## Reuse terms

[NASA Images and Media Usage Guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/)
(accessed October 21, 2026) state that NASA imagery generally is not subject to
copyright in the United States, permit educational/informational use including
computer graphical simulations and web pages, and request acknowledgment of
NASA. Third-party copyrighted material is excluded from that permission.
This example uses NASA's Blue Marble layer for an informational visualization
and does not imply NASA endorsement. NASA imagery is not relicensed under this
repository's MIT software license; NASA's media guidelines govern its reuse.

The image is loaded directly from GIBS without editing; no image binary is
redistributed in this example. No imagery or implementation code from Nico
Belmonte's demonstration is used.
