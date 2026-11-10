# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

"""Regenerate independent exact-map fixtures (not needed to run tests).

Install numpy and pyproj==3.8.0 in a temporary environment. Download the CC0
new_projection.py from https://doi.org/10.5281/zenodo.4661351, then run:
  python generate-exact-reference.py /path/to/new_projection.py
Only replace JAX's NumPy import; execute the author's equations unchanged.
PROJ 9.8.1 uses its legacy Snyder implementation, independent of math.gl's
vector construction. For Gray–Fuller use generate-gray-fuller-reference.mjs.
"""
import json
import pathlib
import sys
import numpy as np
import pyproj

root = pathlib.Path(__file__).parent
points = [[lon, lat] for lon in [-167, -120, -73, -20, 25, 64, 101, 154]
          for lat in [-81, -52, -21, 14, 43, 77]]
namespace = {}
exec(pathlib.Path(sys.argv[1]).read_text().replace("import jax.numpy as np", "import numpy as np"), namespace)
a = np.array(points) * np.pi / 180
x, y = namespace["new_projection"](a[:, 0], a[:, 1])

def save(name, source, values):
    (root / f"{name}-reference.json").write_text(json.dumps({
        "source": source,
        "samples": [{"source": p, "expected": list(q)} for p, q in zip(points, values)]
    }, indent=2) + "\n")

save("petroff", "Matthew A. Petroff, Zenodo 4661351/new_projection.py (CC0), evaluated with NumPy; original polar aspect", zip(x, y))
projection = pyproj.Proj("+proj=isea +R=1 +orient=pole")
save("isea", f"PROJ {pyproj.proj_version_str}, +proj=isea +R=1 +orient=pole", [projection(*p) for p in points])
