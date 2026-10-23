# Albers USA

A focused example of the experimental `@math.gl/geospatial/discontinuous` API.
It renders public-domain Natural Earth 1:10m U.S. state polygons through
`createAlbersUsaMap`, fits the complete layout with `fitMapLayout`, and uses
`pickMapLayout` for region-aware coordinate inspection. Run with
`yarn workspace math.gl-albers-usa start`.

The **View globe** button and **Unfold** slider animate the same projected
feature vertices between geographic globe positions and their fitted inset
positions. A bundled public-domain Natural Earth 1:110m land layer provides
global context on the globe. Reduced-motion preferences make the toggle instant.
Inset label font sizes adapt to the fitted frame width.
The default map omits graticules and inset frames; both remain optional
inspection overlays. Labels stay visible without frames.

The Albers USA preset uses broad spherical masks and a 0.35 linear scale for
Alaska. It is an illustrative composite, not a political clip or a reproduction
of D3's exact `geoAlbersUsa` arrangement. The source file
`assets/us-states.json` contains the 50 states and District of Columbia,
selected without coordinate changes from [Natural Earth's 1:10m admin-1
GeoJSON](https://github.com/nvkelso/natural-earth-vector/blob/ca96624a56bd078437bca8184e78163e5039ad19/geojson/ne_10m_admin_1_states_provinces.geojson),
plus Puerto Rico, the U.S. Virgin Islands, Guam, the Northern Mariana Islands,
and American Samoa from the matching [admin-0 country
GeoJSON](https://github.com/nvkelso/natural-earth-vector/blob/ca96624a56bd078437bca8184e78163e5039ad19/geojson/ne_10m_admin_0_countries.geojson).
Natural Earth data is [public domain](https://www.naturalearthdata.com/about/terms-of-use/).
