# Older-Earth data candidates

Checked 2026-10-26 against the primary repository records and, for Zenodo,
`metadata.license.id` in the release API. These candidates are **not bundled or
loaded by the example**. The current Hadean surface and impact animation remain
illustrative; no global Hadean terrain reconstruction was identified in this search.

| Candidate | Time / content | Release-level license | Potential use |
| --- | --- | --- | --- |
| [Li, Liu and Ernst, supplementary data v1.2](https://zenodo.org/records/10256054) | 2000–540 Ma full-plate reconstruction; GPlates projects, rotations and geotectonic databases. Supplement 10 is about 27.7 MB. | CC-BY-4.0 ([API](https://zenodo.org/api/records/10256054)) | Best candidate to extend the present 1.8 Ga coverage to 2 Ga. Inspect embedded component notices and retain alternative reconstruction scenarios before redistribution. This does not extend maps into the Hadean. |
| [Kadoya et al., Surface environment of the early Earth](https://zenodo.org/records/3579610) | Model output for early-Earth surface environments, with and without impact ejecta, including an LHB scenario. `Article_Data.zip` is 1,875,633 bytes. | CC-BY-4.0 ([API](https://zenodo.org/api/records/3579610)) | Candidate temperature, ocean pH and atmospheric CO2 curves; not geographic terrain. The data archive was inspected: it contains numeric `.dat` files, including `Limit_Tsurf`, `Cum_Tsurf`, pH and pCO2 outputs. Definitions, units, time axes and uncertainty still need validation before plotting. |
| [Valley et al., Jack Hills zircon measurements](https://ecl.earthchem.org/view.php?id=4181) | Zircon ages, oxygen isotopes and trace elements spanning 4.4–3.0 Ga; approximately 198 KB XLSX. DOI 10.60520/IEDA/114181. | CC-BY-4.0 explicitly on the EarthChem record | Observational evidence for early crust and water-related processes. Modern sample locations are not ancient coastlines or a global ocean mask. |
| [Maltese et al., Acasta Gneiss precursor evidence](https://zenodo.org/records/19499338) | Hadean precursor/Archean geochemistry and isotopic measurements, sample documentation and images. | CC-BY-4.0 ([API](https://zenodo.org/api/records/19499338)) | Additional measured constraints for early-crust event annotations; not a global surface reconstruction. Numeric tables can be considered separately from the larger image archive. |

The Kadoya data archive's publisher checksum is
`md5:a4fd80bda06b3aa23583415d6263c932`. The approximately 228 MB source-code
archive was not downloaded. A release license alone does not replace inspection
of component notices, references, scientific units and artifact validation before
publishing a converted dataset.

[Chthonian v0.1](https://zenodo.org/records/18919910) is relevant Hadean impact
model software, but its release declares **GPL-3.0**, so no code was copied into
this MIT example. The [GEOSCRAPE zircon compilation](https://doi.org/10.5880/digis.e.2024.003)
declares **CC-BY-NC-4.0**, so it is not on the permissive redistribution shortlist.

## When did oceans appear?

[Wilde et al. (2001)](https://doi.org/10.1038/35051550) reported a 4,404 ± 8 Ma
zircon whose chemistry indicates interaction of its source materials with liquid
water. This supports an early hydrosphere by roughly 4.4 Ga; it does not measure
the date, area, shape or uninterrupted persistence of a global ocean.
[The newer Jack Hills data release](https://ecl.earthchem.org/view.php?id=4181)
provides open measurements relevant to that evidence.

The displayed condensation sequence therefore grows synthetic seas gradually
through post-impact cooling, with substantial water by the 4.4–4.3 Ga interval.
The coastline pattern, visual timing and coverage are art choices, not a recovered
Hadean map or measured sea-level curve. A separate visual crossfade into the plate
model prevents its first available frame from suddenly replacing the early surface.

## Laurussia versus Laurasia

This example uses **Euramerica (Laurussia)** for the earlier Laurentia–Baltica–Avalonia
landmass around 400 Ma, and **Laurasia** for the later northern portion of Pangaea
in the breakup view around 180 Ma. Older literature sometimes uses overlapping
terminology, but the labels here distinguish those two stages.

References: [USGS reconstruction of Laurussia](https://pubs.usgs.gov/sir/2010/5090/k/sir2010-5090k_text.pdf),
[Laurasia–Gondwana breakup synthesis](https://doi.org/10.1146/annurev.earth.25.1.337).
