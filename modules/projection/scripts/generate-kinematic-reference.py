# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
# Original authored epoch pipelines; independent PROJ expectations, never math.gl.
import hashlib
import json
import math
from pathlib import Path
import pyproj
from pyproj.enums import TransformDirection
assert pyproj.__version__ == '3.7.2'
assert pyproj.proj_version_str == '9.5.1'
pyproj.network.set_network_enabled(False)
root = Path(__file__).resolve().parent.parent / 'test' / 'fixtures'
source = root / 'kinematic-pipeline-cases.json'
sha = lambda data: hashlib.sha256(data).hexdigest()
reference = dict(pyproj=pyproj.__version__, proj=pyproj.proj_version_str,
                 source=source.name, sourceSHA256=sha(source.read_bytes()),
                 generatorSHA256=sha(Path(__file__).read_bytes()), cases=[])
def api_input(point, units):
    return [math.degrees(value) if units[i] == 'rad' else value for i, value in enumerate(point[:3])]
def api_output(point, units):
    return [math.radians(value) if units[i] == 'rad' else value for i, value in enumerate(point[:3])]
for case in json.loads(source.read_text())['cases']:
    transform = pyproj.Transformer.from_pipeline('+proj=pipeline ' + case['pipeline'])
    rows = []
    for point, epoch in zip(case['points'], case['epochs']):
        # PROJ's fourth coordinate is time. math.gl's fourth coordinate is M;
        # supply time separately and reattach untouched measures after the oracle call.
        forward = list(transform.transform(*api_input(point, case['input']['units']), tt=epoch, errcheck=True))
        assert forward[3] == epoch
        inverse = list(transform.transform(*forward[:3], tt=epoch, direction=TransformDirection.INVERSE, errcheck=True))
        assert inverse[3] == epoch
        rows.append(dict(input=point, epoch=epoch,
                         forward=api_output(forward, case['outputUnits']) + point[3:],
                         inverse=api_output(inverse, case['input']['units']) + point[3:]))
    reference['cases'].append(dict(id=case['id'], results=rows))
(root / 'kinematic-pipeline-reference.json').write_text(json.dumps(reference, indent=2) + '\n')
print('Generated', len(reference['cases']), 'independent kinematic pipelines')
