# Arrow-backed GeoArrow table

Run from the repository root after installing dependencies and building math.gl:

```sh
yarn build
yarn workspace math.gl-geoarrow-table start
```

The example constructs a small Arrow table locally, discovers its GeoArrow field,
borrows its coordinate buffers, computes bounds, maps coordinates without changing
the original, and converts the descriptors back to Arrow. It needs no fixture
files, loader, network service, or rendering framework.

`@math.gl/geospatial/geoarrow` works with real Arrow objects and requires Arrow 17+.
`@math.gl/geospatial/geoarrow-utils` works with physical descriptors and remains
Arrow-independent. The example's null row survives the adapter round trip.
