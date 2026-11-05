# Regenerating timezone geometry

To regenerate the [optional timezone datasets](../../data/timezone/README.md), use
[`generate-geometry.py`](./generate-geometry.py), then validate the assets with
[`check-geometry.py`](./check-geometry.py).

Use Python 3.10+ and Node.js. Run these commands from the repository root,
installing build tools outside the package:

```sh
python3 -m venv /tmp/timezone-tools
/tmp/timezone-tools/bin/pip install -r modules/earth/scripts/timezone/geometry-requirements.txt
npm install --prefix /tmp/timezone-node mapshaper@0.6.113
/tmp/timezone-tools/bin/python modules/earth/scripts/timezone/generate-geometry.py \
  --mapshaper /tmp/timezone-node/node_modules/.bin/mapshaper
/tmp/timezone-tools/bin/python modules/earth/scripts/timezone/check-geometry.py
```

The generator checks the pinned upstream ZIP checksum before extracting data.
Use `--archive /path/to/timezones-with-oceans.geojson.zip` for offline generation.
Build tools are not runtime dependencies. Update the pinned release and
checksum deliberately when refreshing the data; review the regenerated geometry.
