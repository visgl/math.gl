# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
"""Regenerate optional grids from the checksum-pinned GeographicLib archive."""
import hashlib
import json
from pathlib import Path
import sys
import tarfile

DATA = Path(__file__).resolve().parents[1] / 'data'
manifest = json.loads((DATA / 'geoid-manifest.json').read_text())
archive = Path(sys.argv[1])
assert hashlib.sha256(archive.read_bytes()).hexdigest() == manifest['sourceSha256']
with tarfile.open(archive) as source:
    original = source.extractfile('geoids/egm96-15.pgm').read()
_, pixels = original.split(b'65535\n', 1)
assert len(pixels) == 1440 * 721 * 2
preview = b'P5\n# Description WGS84 EGM96, 1-degree preview grid\n# Offset -108\n# Scale 0.003\n# Origin 90N 0E\n360 181\n65535\n'
preview += b''.join(pixels[(y * 1440 + x) * 2:(y * 1440 + x) * 2 + 2]
                    for y in range(0, 721, 4) for x in range(0, 1440, 4))
for name, content in [('geoid-egm96-hi.pgm', original), ('geoid-egm96-low.pgm', preview)]:
    assert hashlib.sha256(content).hexdigest() == manifest['files'][name]['sha256']
    (DATA / name).write_bytes(content)
print('Regenerated both EGM96 grids; checksums match manifest.')
