# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
# SPDX-FileComment: Original Decimal normal-footpoint oracle; no upstream code or model data.
"""Regenerate exact-binary-input references using only the Python standard library.

For positive radii, lambda > -min(r_i^2) makes the constrained distance Hessian
positive definite. The monotone surface equation has one root in this interval
when a coordinate along a shortest axis is nonzero. This certifies the unique
nearest footpoint, independently of the production Hannover/Newton iterations.
Angles are deliberately omitted: tests derive them from the reference unit normal.
"""
import argparse
from decimal import Decimal as D, localcontext
import json
from pathlib import Path

DESTINATION = Path(__file__).resolve().parents[1] / 'test/fixtures/interior-reference.json'


def nearest(radii, xyz):
    # Reference the stored binary64 input, not its ideal pre-rounding construction.
    axes = [D.from_float(v) for v in radii]
    point = [D.from_float(v) for v in xyz]
    scale = max(axes)
    axes = [v / scale for v in axes]
    point = [v / scale for v in point]
    squares = [v * v for v in axes]
    lower = -min(squares)
    upper = max(D(1), sum(v * v for v in point).sqrt())
    for _ in range(320):
        multiplier = (lower + upper) / 2
        norm = sum((r * p / (r * r + multiplier)) ** 2 for r, p in zip(axes, point))
        if norm > 1:
            lower = multiplier
        else:
            upper = multiplier
    multiplier = (lower + upper) / 2
    foot = [r2 * p / (r2 + multiplier) for r2, p in zip(squares, point)]
    residual = abs(sum(q * q / r2 for q, r2 in zip(foot, squares)) - 1)
    assert residual < D('1e-60'), residual
    assert multiplier > -min(squares)
    gradient = [q / r2 for q, r2 in zip(foot, squares)]
    length = sum(v * v for v in gradient).sqrt()
    return {
        'footpoint': [float(q * scale) for q in foot],
        'normal': [float(v / length) for v in gradient],
        'height': float(multiplier * length * scale),
        'surfaceResidual': float(residual),
        'multiplierOverMaxRadiusSquared': float(multiplier),
    }


def generate():
    cases = []
    with localcontext() as ctx:
        ctx.prec = 110
        normals = [
            ('north', [D('.36'), D('.48'), D('.8')]),
            ('south', [D('-.36'), D('.48'), D('-.8')]),
        ]
        t = D('1e-6')
        near = 2 * t / (1 + t * t)
        far = (1 - t * t) / (1 + t * t)
        normals += [('near-pole', [near, D(0), far]), ('near-equator', [far, D(0), near])]
        shapes = [
            ('earth-ratio', ['1', '1', '.9966471893352525']),
            ('flattened', ['1', '1', '.5']),
            ('flat', ['1', '1', '.1']),
            ('very-flat', ['1', '1', '.000001']),
            ('prolate', ['1', '1', '1.5']),
            ('triaxial', ['1', '1.2', '1.5']),
        ]
        for label, ratios in shapes:
            for scale in ['1', '6378137']:
                axes = [D(v) * D(scale) for v in ratios]
                for depth in ['.01', '.5', '.9', '.999999']:
                    multiplier = -min(r * r for r in axes) * D(depth)
                    for direction, normal in normals:
                        # Every shortest axis must have a nonzero input component
                        # for the oracle interval to contain an interior root.
                        if not any(n != 0 and r == min(axes) for r, n in zip(axes, normal)):
                            continue
                        support = sum((r * n) ** 2 for r, n in zip(axes, normal)).sqrt()
                        xyz = [float((r * r + multiplier) * n / support) for r, n in zip(axes, normal)]
                        radii = [float(r) for r in axes]
                        reference = nearest(radii, xyz)
                        ordinary = label in ['earth-ratio', 'flattened']
                        geo_qualified = D(depth) <= D('.5') and label != 'very-flat'
                        cases.append({
                            'id': '/'.join([label, scale, depth, direction]),
                            'shape': label,
                            'radii': radii,
                            'xyz': xyz,
                            'qualified': {
                                'geospatial': geo_qualified,
                                'projection': ordinary and D(depth) <= D('.5'),
                            },
                            'reference': reference,
                        })
        # Probe both sides of the equatorial cusp, with nonzero Z so the nearest
        # normal is unique, despite other stationary normal representations.
        for x in ['.749999', '.75', '.750001']:
            for z in ['1e-12', '-1e-12']:
                xyz = [float(x), 0.0, float(z)]
                radii = [1.0, 1.0, .5]
                cases.append({
                    'id': 'cusp/' + x + '/' + z,
                    'shape': 'flattened',
                    'radii': radii,
                    'xyz': xyz,
                    'qualified': {'geospatial': False, 'projection': False},
                    'reference': nearest(radii, xyz),
                })
    return {
        'provenance': {
            'author': 'vis.gl contributors',
            'license': 'MIT',
            'method': 'Original monotone Lagrange-multiplier bisection with Decimal precision 110 and 320 updates; no production conversion code imported.',
            'inputs': 'Exact stored binary64 axes and coordinates; references recomputed after input rounding.',
            'certificate': 'Surface residual < 1e-60 and lambda > -min(radii squared), certifying a unique nearest footpoint.',
            'scope': 'Sampled qualification only. Unqualified cases measure limitations; they do not establish a supported domain.',
        },
        'cases': cases,
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    data = generate()
    header = json.dumps({'provenance': data['provenance']}, indent=2, allow_nan=False)
    rows = ',\n'.join('    ' + json.dumps(row, allow_nan=False) for row in data['cases'])
    text = header[:-2] + ',\n  "cases": [\n' + rows + '\n  ]\n}\n'
    if args.check:
        assert DESTINATION.read_text() == text, 'Regenerate interior-reference.json'
        print('Independent interior reference is reproducible')
    else:
        DESTINATION.write_text(text)
        print('Wrote', DESTINATION)
