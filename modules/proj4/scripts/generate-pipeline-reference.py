# math.gl
# SPDX-License-Identifier: MIT
# Copyright (c) vis.gl contributors
# Original authored pipelines; PROJ supplies expectations, never math.gl/proj4js.
import math
import hashlib
import json
from pathlib import Path
import tempfile
import pyproj
from pyproj.enums import TransformDirection
assert pyproj.__version__ == '3.7.2'
assert pyproj.proj_version_str == '9.5.1'
pyproj.network.set_network_enabled(False)
root = Path(__file__).resolve().parent.parent / 'test' / 'fixtures'
source = root / 'operation-pipeline-cases.json'
sha = lambda data: hashlib.sha256(data).hexdigest()
vertical = bytes(json.loads((root / 'vertical-grid-reference.json').read_text())['gridBytes'])
horizontal = (root / 'real-grids' / 'BETA2007.gsb').read_bytes()
reference = dict(pyproj=pyproj.__version__, proj=pyproj.proj_version_str,
                 source=source.name, sourceSHA256=sha(source.read_bytes()),
                 generatorSHA256=sha(Path(__file__).read_bytes()),
                 verticalSHA256=sha(vertical), horizontalSHA256=sha(horizontal), cases=[])
with tempfile.TemporaryDirectory() as temp:
    vertical_path, horizontal_path = Path(temp) / 'local.gtx', Path(temp) / 'horizontal.gsb'
    vertical_path.write_bytes(vertical)
    horizontal_path.write_bytes(horizontal)
    for case in json.loads(source.read_text())['cases']:
        pipeline = '+proj=pipeline ' + case['pipeline'].replace('{vertical}', str(vertical_path)).replace('{horizontal}', str(horizontal_path))
        transform = pyproj.Transformer.from_pipeline(pipeline)
        # pyproj presents angular pipeline endpoints in degrees by default,
        # including raw-radian endpoints. Adapt only the API boundary, never equations.
        units = list(case['input']['units'])
        for step in case['steps']:
            inverse_step = step.get('inverse', False)
            if step['type'] == 'unitconvert':
                for key, indices in [('xy', [0, 1]), ('z', [2])]:
                    if key in step:
                        for index in indices:
                            units[index] = step[key]['from' if inverse_step else 'to']
            elif step['type'] == 'axisswap':
                order = step['order'] + ([3] if len(step['order']) == 2 else [])
                if inverse_step:
                    reversed_order = [0, 0, 0]
                    for target, index in enumerate(order):
                        reversed_order[abs(index) - 1] = target + 1
                    order = reversed_order
                units = [units[abs(index) - 1] for index in order]
            elif step['type'] == 'projection':
                units[:2] = ['rad', 'rad'] if inverse_step else ['m', 'm']
            elif step['type'] == 'cart':
                units = ['rad', 'rad', 'm'] if inverse_step else ['m', 'm', 'm']
        def api_input(point, endpoint_units):
            return [math.degrees(value) if endpoint_units[i] == 'rad' else value
                    for i, value in enumerate(point[:3])] + point[3:]
        def api_output(point, endpoint_units):
            return [math.radians(value) if endpoint_units[i] == 'rad' else value
                    for i, value in enumerate(point[:3])] + point[3:]
        rows = []
        for point in case['points']:
            forward = api_output(list(transform.transform(*api_input(point, case['input']['units']), errcheck=True)), units)
            inverse = api_output(list(transform.transform(*api_input(forward, units), direction=TransformDirection.INVERSE, errcheck=True)), case['input']['units'])
            rows.append(dict(input=point, forward=forward, inverse=inverse))
        reference['cases'].append(dict(id=case['id'], results=rows))
(root / 'operation-pipeline-reference.json').write_text(json.dumps(reference, indent=2) + '\n')
print('Generated', len(reference['cases']), 'independent pipeline configurations')
