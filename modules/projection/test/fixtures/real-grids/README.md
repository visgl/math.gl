# Real horizontal grid fixtures

These files are test data under their original redistribution terms, **not** the
math.gl source-code license. They are not included in the published npm package.

The two GeoTIFFs are unmodified files from
[OSGeo/PROJ-data commit cdab44864a36a9f3c3e90a36637c5d8a86e624c6](https://github.com/OSGeo/PROJ-data/tree/cdab44864a36a9f3c3e90a36637c5d8a86e624c6).
Exact download URLs and SHA-256 hashes are in `../real-grid-cases.json` and are
checked offline in CI and in the Node/Chromium tests. `ca_nrc_README.txt` and
`de_adv_README.txt` preserve the accompanying upstream provenance/license notices.

| File | Origin and operation | Redistribution terms |
| --- | --- | --- |
| `ca_nrc_NA83SCRS.tif` | Natural Resources Canada, Canadian Geodetic Survey. Quebec NAD83 to NAD83(CSRS) 1997; EPSG operation 9241. Fourteen nested images, converted from NTv2 by PROJ-data. | [Open Government Licence – Canada](https://open.canada.ca/en/open-government-licence-canada). Contains information licensed under the Open Government Licence – Canada. |
| `de_adv_BETA2007.tif` | AdV, distributed through BKG. German DHDN to ETRS89; one image, converted from NTv2 by PROJ-data. | The accompanying upstream notice states: “Free redistribution is allowed and welcome.” |

These are horizontal latitude/longitude offset grids in arcseconds. Tests explicitly
apply their numeric shifts; they do not imply arbitrary WGS84 epoch equivalence or
perform automatic EPSG operation selection. Coverage is limited to these datasets
and the loader's documented band/metadata conventions.

To restore the pinned bytes, run `node modules/proj4/scripts/check-native-reference.mjs --download-grids`.
Downloads are opt-in and must match the checked-in hashes before being written.
Ordinary CI runs the same script without that flag and needs no network or Python.


`BETA2007.gsb` is the original-format AdV/BKG NTv2 grid, retrieved unchanged from
[proj4js v2.22.0](https://github.com/proj4js/proj4js/blob/v2.22.0/test/BETA2007.gsb).
It retains the BETA2007 redistribution terms documented above and in
`de_adv_README.txt`; inclusion in proj4js does not relabel the grid as MIT code.
Its own immutable source URL/hash and independently generated PROJ outputs are in
the real-grid manifests. The NTv2 and GeoTIFF variants are both exercised, including
outer nodes, shifted inverses and explicit fallback behavior.
