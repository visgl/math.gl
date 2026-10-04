# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
# Original authored GTX fixture and independent PROJ oracle, no upstream code/data copied.
import hashlib
import json
from pathlib import Path
import struct
import tempfile

import pyproj
from pyproj.enums import TransformDirection

assert pyproj.__version__ == '3.7.2'
assert pyproj.proj_version_str == '9.5.1'
pyproj.network.set_network_enabled(False)
root = Path(__file__).resolve().parent.parent / 'test' / 'fixtures'
source = root / 'vertical-grid-cases.json'
inputs = json.loads(source.read_text())
grid = inputs['grid']
width, height = grid['size']
raw = struct.pack('>ddddii', grid['origin'][1], grid['origin'][0],
                  grid['step'][1], grid['step'][0], height, width)
raw += struct.pack('>' + 'f' * len(grid['offsets']), *grid['offsets'])
sha = lambda data: hashlib.sha256(data).hexdigest()
reference = dict(pyproj=pyproj.__version__, proj=pyproj.proj_version_str,
                 source=source.name, sourceSHA256=sha(source.read_bytes()),
                 generatorSHA256=sha(Path(__file__).read_bytes()),
                 gridSHA256=sha(raw), gridBytes=list(raw), cases=[])
with tempfile.TemporaryDirectory() as temp:
    path = Path(temp) / 'authored.gtx'
    path.write_bytes(raw)
    for case in inputs['cases']:
        pipeline = '+proj=pipeline ' + case['pipeline'].replace('{grid}', str(path))
        transform = pyproj.Transformer.from_pipeline(pipeline)
        rows = []
        for point in case['points']:
            forward = list(transform.transform(*point, errcheck=True))
            inverse = list(transform.transform(*forward, direction=TransformDirection.INVERSE,
                                                errcheck=True))
            rows.append(dict(input=point, forward=forward, inverse=inverse))
        reference['cases'].append(dict(id=case['id'], results=rows))
(root / 'vertical-grid-reference.json').write_text(json.dumps(reference, indent=2) + '\n')
print('Generated', len(reference['cases']), 'independent vertical-grid cases')
