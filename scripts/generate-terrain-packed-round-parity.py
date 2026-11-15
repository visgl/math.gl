# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

"""Generate packed rotating round-contact cases with analytical witnesses."""

import hashlib
import json
import math
from pathlib import Path
import struct

FIXTURES = Path(__file__).resolve().parents[1] / "modules/geospatial/test/terrain/fixtures"
SIZE = 5
SEAM = 2


def crop(source, scenario):
    """Find a supported seam maximum or a whole nodata cell inside a DEM crop."""
    width = source["width"]
    for row in range(source["height"] - SIZE + 1):
        for col in range(width - SIZE + 1):
            heights = [
                source["heights"][(row + y) * width + col + x]
                for y in range(SIZE)
                for x in range(SIZE)
            ]
            valid = [value for value in heights if value is not None]
            if not valid:
                continue
            if scenario == "seam":
                # Require incident triangles on both sides of the seam.
                matches = (
                    heights[12] == max(valid)
                    and all(heights[i] is not None for i in (6, 7, 11, 13, 17, 18))
                    and len(set(valid)) > 1
                )
            else:
                matches = all(heights[i] is None for i in (12, 13, 17, 18))
            if matches:
                return [col, row, SIZE, SIZE], heights, valid
    raise ValueError(f"No suitable {scenario} crop")


def float_word(value):
    """Return an IEEE 754 binary32 word as an unsigned integer."""
    return struct.unpack("<I", struct.pack("<f", value))[0]


def make_fixture(name, scenario):
    """Build two independently indexed tiles and the reference motions."""
    source = json.loads((FIXTURES / f"{name}-streaming.json").read_text())
    raster = (FIXTURES / f"{name.split('-')[0]}.tif").read_bytes()
    if hashlib.sha256(raster).hexdigest() != source["sha256"]:
        raise ValueError(f"Source raster hash mismatch for {name}")
    window, heights, valid = crop(source, scenario)
    origin = math.floor(min(valid)) - 0.123456789
    tiles = []
    for col in (0, SEAM):
        samples = [heights[y * SIZE + x] for y in range(SIZE) for x in range(col, col + 3)]
        tiles.append({
            "origin": [col, 0, origin],
            "heights": samples,
            "heightWords": [float_word(v - origin if v is not None else 0) for v in samples],
            "validity": [int(v is not None) for v in samples],
        })

    seam = scenario == "seam"
    # The packed maximum is the highest point on either tile. At half time the
    # leading axis point is directly above it, at exactly one radius clearance.
    # Before half time the entire axis is higher than maximum + radius.
    z = struct.unpack("<f", struct.pack("<f", max(valid) - origin))[0]
    target = SEAM if seam else SEAM + 0.5
    reach = 0.125
    pivot = [target - reach, target, z + 1.125]

    def endpoint(offset):
        """Choose a starting position 45 degrees before the target direction."""
        diagonal = offset / math.sqrt(2)
        return [pivot[0] + diagonal, pivot[1] - diagonal, pivot[2]]

    cases = []
    for shape in ("sphere", "capsule"):
        cases.append({
            "shape": shape,
            "start": endpoint(reach),
            "end": endpoint(reach if shape == "sphere" else reach - 0.0625),
            "pivot": pivot,
            "rotation": [0, 0, math.sqrt(0.5), math.sqrt(0.5)],
            "translation": [0, 0, -2 if seam else -(z + 2)],
            "radius": reach,
            "expected": (
                {"status": "hit", "fraction": 0.5, "witness": [SEAM, SEAM, z]}
                if seam else {"status": "miss"}
            ),
        })
    return {
        "source": name,
        "sourceSha256": source["sha256"],
        "scenario": scenario,
        "pixelWindow": window,
        "tiles": tiles,
        "cases": cases,
    }


if __name__ == "__main__":
    corpus = {
        "version": 1,
        "header": [1, 3, 5, 0, 0, 15, 0, 0],
        "transform": [1, 0, 0, 1, 1, 0, 0, 1],
        "tolerances": {"fraction": 1e-5, "witnessMeters": 0.003},
        "fixtures": [
            make_fixture("pacific", "seam"),
            make_fixture("sierra-nodata", "seam"),
            make_fixture("sierra-nodata", "nodata"),
        ],
    }
    (FIXTURES / "packed-round-contact-parity.json").write_text(
        json.dumps(corpus, indent=2, allow_nan=False) + "\n"
    )
