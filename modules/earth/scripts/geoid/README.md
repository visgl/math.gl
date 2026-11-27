# Regenerating EGM96 grids

To regenerate the [optional EGM96 grids](../../data/geoid/README.md), run
[`generate-data.py`](./generate-data.py) from the repository root with the
GeographicLib archive recorded in the [data manifest](../../data/geoid/geoid-manifest.json):

```sh
python3 modules/earth/scripts/geoid/generate-data.py /path/to/egm96-15.tar.bz2
```

The generator checks the pinned archive checksum before reading it and verifies
both output checksums against the manifest.
