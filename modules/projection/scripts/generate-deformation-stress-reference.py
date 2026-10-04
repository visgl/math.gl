# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
# Original Decimal normal-footpoint and Newton deformation oracle; no upstream code/data.
import argparse
import hashlib
import json
from decimal import Decimal, localcontext
from pathlib import Path

D = Decimal
ROOT = Path(__file__).resolve().parent.parent / 'test' / 'fixtures'
OUTPUT = ROOT / 'deformation-stress-reference.json'


def normal(point, a, b):
    x, y, z = point
    p2 = x * x + y * y
    if a == b:
        radius = (p2 + z * z).sqrt()
        return [v / radius for v in point]
    if p2 == 0:
        return [D(0), D(0), D(1) if z > 0 else D(-1)]
    if z == 0:
        p = p2.sqrt()
        assert p > (a * a - b * b) / a, 'Equatorial evolute is outside this profile'
        return [x / p, y / p, D(0)]
    aa, bb = a * a, b * b
    def surface(t):
        return aa * p2 / (t + aa) ** 2 + bb * z * z / (t + bb) ** 2 - 1
    lo = -bb + bb * D('1e-55')
    hi = max(a, (p2 + z * z).sqrt()) ** 2
    while surface(hi) > 0:
        hi *= 2
    assert surface(lo) > 0 and surface(hi) < 0
    for _ in range(240):
        mid = (lo + hi) / 2
        if surface(mid) > 0:
            lo = mid
        else:
            hi = mid
    t = (lo + hi) / 2
    assert abs(surface(t)) < D('1e-50')
    raw = [x / (aa + t), y / (aa + t), z / (bb + t)]
    length = sum(v * v for v in raw).sqrt()
    return [v / length for v in raw]


def velocity(point, a, b):
    x, y, z = normal(point, a, b)
    # An authored nonlinear, spatially variable fixed-space field, expressed as ENU by tests.
    return [D('.03') * x + D('.004') * (1 + y * z),
            D('.03') * y + D('.003') * x * z,
            D('.03') * z + D('.002') * x * y]


def forward(point, a, b, dt):
    return [v + dt * speed for v, speed in zip(point, velocity(point, a, b))]


def linear_solve(matrix, rhs):
    rows = [row[:] + [value] for row, value in zip(matrix, rhs)]
    for col in range(3):
        pivot = max(range(col, 3), key=lambda row: abs(rows[row][col]))
        rows[col], rows[pivot] = rows[pivot], rows[col]
        divisor = rows[col][col]
        assert divisor != 0
        rows[col] = [v / divisor for v in rows[col]]
        for row in range(3):
            if row != col:
                factor = rows[row][col]
                rows[row] = [v - factor * pivot_v for v, pivot_v in zip(rows[row], rows[col])]
    return [row[3] for row in rows]


def inverse(target, a, b, dt):
    # Independent coupled Newton solve; production instead uses bounded fixed-point updates.
    guess = target[:]
    epsilon = max(a, D(1)) * D('1e-20')
    for iteration in range(16):
        mapped = forward(guess, a, b, dt)
        residual = [value - wanted for value, wanted in zip(mapped, target)]
        if max(abs(v) for v in residual) < D('1e-40'):
            return guess, iteration, max(abs(v) for v in residual)
        columns = []
        for axis in range(3):
            plus, minus = guess[:], guess[:]
            plus[axis] += epsilon
            minus[axis] -= epsilon
            fplus, fminus = forward(plus, a, b, dt), forward(minus, a, b, dt)
            columns.append([(v - w) / (2 * epsilon) for v, w in zip(fplus, fminus)])
        step = linear_solve([[columns[j][i] for j in range(3)] for i in range(3)], residual)
        guess = [v - delta for v, delta in zip(guess, step)]
    raise RuntimeError('Independent Newton oracle did not converge')


def generate():
    cases = []
    shapes = [('WGS84', D('6378137'), D('6356752.314245179')),
              ('sphere', D(10), D(10)), ('flattened', D(10), D(5))]
    near = D('1e-8')
    normals = [[D(1), D(0), D(0)], [D(-1), D(0), D(0)], [D(0), D(1), D(0)],
               [D(0), D(-1), D(0)], [D(0), D(0), D(1)], [D(0), D(0), D(-1)],
               [D('.36'), D('.48'), D('.8')], [D('-.36'), D('.48'), D('-.8')],
               [D('-.6'), D('-.8'), D(0)], [near, D(0), (1 - near * near).sqrt()],
               [-near, D(0), -(1 - near * near).sqrt()],
               [-(1 - near * near).sqrt(), -near, D(0)]]
    for name, a, b in shapes:
        for i, n in enumerate(normals):
            for j, height in enumerate([D(0), a / 10, a]):
                gamma = (a * a * (n[0] ** 2 + n[1] ** 2) + b * b * n[2] ** 2).sqrt()
                point = [a * a * n[0] / gamma + height * n[0],
                         a * a * n[1] / gamma + height * n[1],
                         b * b * n[2] / gamma + height * n[2]]
                # Oracle consumes exact stored binary64 XYZ, not ideal support points.
                stored = [float(v) for v in point]
                point = [D.from_float(v) for v in stored]
                source, target = (2010, 2020) if j == 0 else ((2020, 2010) if j == 1 else (2000, 2000))
                if name == 'WGS84' and j == 2:
                    source, target = 1900, 2100
                if j == 0:
                    source = [2010, 2011, 2015.5, 2020][i % 4]
                elif j == 1:
                    source = [2020, 2019.25, 2015, 2010][i % 4]
                dt = D(target - source)
                result = forward(point, a, b, dt)
                # A separate inverse target, beyond merely undoing a forward reference.
                probe = [v + a * delta for v, delta in zip(point, [D('.001'), D('-.0007'), D('.0009')])]
                inverse_input = [float(v) for v in probe]
                inverse_point, iterations, residual = inverse([D.from_float(v) for v in inverse_input], a, b, dt)
                cases.append(dict(id=f'{name}-{i}-{j}', shape=name, a=float(a), b=float(b),
                                  sourceEpoch=source, targetEpoch=target,
                                  input=stored + [i + .25], forward=[float(v) for v in result] + [i + .25],
                                  inverseInput=inverse_input + [-i - .5], inverse=[float(v) for v in inverse_point] + [-i - .5],
                                  inverseOracleIterations=iterations, inverseResidual=str(residual)))
    return dict(schemaVersion=1, description='Original authored nonlinear spatial field, not an authoritative geodetic model',
                generatorSHA256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                oracle='80-digit Decimal normal-footpoint bisection and coupled Newton inversion of the forward field; exact binary64 inputs',
                provenance=dict(authority='math.gl authored qualification', version='1', license='MIT',
                                reference='generate-deformation-stress-reference.py', modelRevision='nonlinear-normal-field-v1'),
                distanceUnit='m', velocityUnit='m/year', epochRange=[1900, 2100],
                forwardToleranceMeters=1e-6, inverseToleranceMeters=1e-6, cases=cases)


if __name__ == '__main__':
    args = argparse.ArgumentParser()
    args.add_argument('--check', action='store_true')
    options = args.parse_args()
    with localcontext() as context:
        context.prec = 80
        report = generate()
        rows = report.pop('cases')
        header = json.dumps(report, indent=2)
        contents = header[:-2] + ',\n  "cases": [\n' + ',\n'.join('    ' + json.dumps(row) for row in rows) + '\n  ]\n}\n'
    if options.check:
        assert OUTPUT.read_text() == contents, 'Deformation reference must be regenerated'
        print('Authored deformation stress reference reproduced exactly')
    else:
        OUTPUT.write_text(contents)
        print('Generated authored nonlinear deformation references')
