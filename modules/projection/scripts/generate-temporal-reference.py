# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
# Original Decimal/Newton temporal oracle; no external model data or implementation.
import argparse
import hashlib
import importlib.util
import json
from decimal import Decimal as D, localcontext
from pathlib import Path

ROOT = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('spatial_oracle', ROOT / 'generate-deformation-stress-reference.py')
oracle = importlib.util.module_from_spec(spec)
spec.loader.exec_module(oracle)
OUTPUT = ROOT.parent / 'test/fixtures/temporal-reference.json'

def coefficient(source, target):
    def relaxation(t):
        return D(0) if t <= 2015 else 1 - (-(t - 2015) / 2).exp()
    return (target - source) + D('.2') * (target - source) * ((source - 2010) + (target - source) / 2) + 3 * (int(target >= 2015) - int(source >= 2015)) + 2 * (relaxation(target) - relaxation(source))

def generate():
    cases = []
    with localcontext() as ctx:
        ctx.prec = 90
        for name, a, b in [('WGS84', D(6378137), D('6356752.314245179')), ('sphere', D(10), D(10)), ('flattened', D(10), D(5))]:
            points = [[a * D('1.1'), D(0), D(0)], [a * D('.8'), a * D('.8'), b * D('.4')], [-a * D('.9'), a * D('.3'), -b * D('.8')], [a * D('1e-6'), -a * D('1e-6'), b * D('1.2')]]
            for point_index, values in enumerate(points):
                # Qualify exact binary64 input/epoch values used by production.
                point = [D.from_float(float(v)) for v in values]
                for pair in [(2010,2020),(2020,2010),(2015,2015),(2014,2015),(2015,2014),(2014.999999,2015.000001),(2000,2030),(2030,2000)]:
                    source,target = [D.from_float(float(v)) for v in pair]
                    weight = coefficient(source,target)
                    forward = oracle.forward(point,a,b,weight)
                    inverse_input = [v + D('.013') * (i+1) for i,v in enumerate(point)]
                    inverse,iterations,residual = oracle.inverse(inverse_input,a,b,weight)
                    cases.append({'id': f'{name}-{point_index}-{pair[0]}-{pair[1]}', 'a':float(a),'b':float(b),'input':[float(v) for v in point], 'sourceEpoch':float(source),'targetEpoch':float(target),'forward':[float(v) for v in forward],'inverseInput':[float(v) for v in inverse_input],'inverse':[float(v) for v in inverse],'coefficient':float(weight),'inverseIterations':iterations,'inverseResidual':str(residual)})
    return {'schemaVersion':1,'generatorSHA256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'spatialOracleSHA256':hashlib.sha256((ROOT/'generate-deformation-stress-reference.py').read_bytes()).hexdigest(),'oracle':'90-digit Decimal normal solver and independent coupled Newton inverse; authored nonlinear spatial amplitudes, velocity, acceleration, right-continuous step and exponential relaxation','epochRange':[2000,2030],'toleranceMeters':5e-8,'cases':cases}

if __name__ == '__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
    result=json.dumps(generate(),indent=2)+'\n'
    if args.check:
        assert OUTPUT.read_text()==result,'Regenerate temporal reference'
        print('96 independent temporal references match generator')
    else:OUTPUT.write_text(result)
