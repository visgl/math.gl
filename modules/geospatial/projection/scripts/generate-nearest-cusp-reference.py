# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
# SPDX-FileComment: Original high-precision cusp controls; no upstream code or fixtures.
"""Independent stored-binary64-input cusp controls, using standard-library Decimal."""
import argparse
from decimal import localcontext
import importlib.util
import json
import math
from pathlib import Path

HERE = Path(__file__).resolve().parent
DESTINATION = HERE.parent / 'test/fixtures/nearest-cusp-reference.json'
spec = importlib.util.spec_from_file_location('interior_oracle', HERE / 'generate-interior-reference.py')
oracle = importlib.util.module_from_spec(spec)
spec.loader.exec_module(oracle)


def generate():
    rows = []
    with localcontext() as ctx:
        ctx.prec = 220
        for power in [15, 60, 120, 150]:
            for y in [math.nextafter(1.5, 0), 1.5, math.nextafter(1.5, 2)]:
                axes = [1., 2., 3.]
                point = [float('1e-' + str(power)), y, 0.]
                base = oracle.nearest(axes, point, iterations=900)
                # Exact sign/permutation symmetries preserve stored binary64 inputs
                # and the positive-definite certificate; solve each base only once.
                for permutation in [(0, 1, 2), (2, 0, 1), (1, 2, 0)]:
                    radii = [axes[i] for i in permutation]
                    for sign in [-1, 1]:
                        xyz = [point[i] * sign for i in permutation]
                        reference = dict(base)
                        for key in ['footpoint', 'normal']:
                            reference[key] = [base[key][i] * sign for i in permutation]
                        rows.append({'radii': radii, 'xyz': xyz, 'reference': reference})
        # Multidirectional exact cusps and adjacent stored binary64 inputs.
        # For (1,4,16), normalized non-short-axis components are 3/5 and 4/5.
        for axes, horizontal in [([1., 4., 4.], [2.25, 3.]),
                                 ([1., 4., 16.], [2.25, 12.75])]:
            for scale in [1., 6378137.]:
                radii0 = [r * scale for r in axes]
                for power in [15, 60, 120, 150]:
                    for y in [math.nextafter(horizontal[0], 0), horizontal[0],
                              math.nextafter(horizontal[0], math.inf)]:
                        point = [float('1e-' + str(power)) * scale, y * scale,
                                 horizontal[1] * scale]
                        base = oracle.nearest(radii0, point, iterations=900)
                        for permutation in [(0, 1, 2), (2, 0, 1), (1, 2, 0)]:
                            radii = [radii0[i] for i in permutation]
                            for sign in [-1, 1]:
                                xyz = [point[i] * sign for i in permutation]
                                reference = dict(base)
                                for key in ['footpoint', 'normal']:
                                    reference[key] = [base[key][i] * sign for i in permutation]
                                rows.append({'radii': radii, 'xyz': xyz, 'reference': reference})
        # Oblate cusp inputs also exercise the shared cartographic inverse.
        for power in [15, 60, 120, 150]:
            radii = [2., 2., 1.]
            for xy in [[1.5, 0.], [.9, 1.2]]:
                xyz = xy + [float('1e-' + str(power))]
                rows.append({'radii': radii, 'xyz': xyz,
                             'reference': oracle.nearest(radii, xyz, iterations=900)})
        # Unique solutions on the zero shortest-axis plane, outside the cusp.
        for axes, point0 in [([1., 4., 4.], [0., math.nextafter(2.25, math.inf), 3.]),
                               ([1., 4., 16.], [0., math.nextafter(2.25, math.inf), 12.75]),
                               ([13., 13., 6.5], [math.nextafter(3.75, math.inf), 9., 0.])]:
            for scale in [1., 6378137.]:
                radii0 = [r * scale for r in axes]
                point = [v * scale for v in point0]
                base = oracle.nearest(radii0, point, iterations=900)
                for permutation in [(0, 1, 2), (2, 0, 1), (1, 2, 0)]:
                    for sign in [-1, 1]:
                        reference = dict(base)
                        for key in ['footpoint', 'normal']:
                            reference[key] = [base[key][i] * sign for i in permutation]
                        rows.append({'radii': [radii0[i] for i in permutation],
                                     'xyz': [point[i] * sign for i in permutation],
                                     'reference': reference})
        with localcontext() as extreme:
            extreme.prec = 440
            for scale in [1., 6378137.]:
                for power in [300, 320]:
                    radii = [2 * scale, 2 * scale, scale]
                    xyz = [1.5 * scale, 0., float('1e-' + str(power))]
                    rows.append({'radii': radii, 'xyz': xyz,
                                 'reference': oracle.nearest(radii, xyz, iterations=1600)})
            # Subnormal products are rounded before a floating residual sees them.
            tiny = math.nextafter(1e-320, math.inf)
            for scale in [.125, .1]:
                radii0 = [scale, 2 * scale, 3 * scale]
                point = [tiny, 1.5 * scale, 0.]
                base = oracle.nearest(radii0, point, iterations=1600)
                for permutation in [(0, 1, 2), (2, 0, 1), (1, 2, 0)]:
                    for sign in [-1, 1]:
                        reference = dict(base)
                        for key in ['footpoint', 'normal']:
                            reference[key] = [base[key][i] * sign for i in permutation]
                        rows.append({'radii': [radii0[i] for i in permutation],
                                     'xyz': [point[i] * sign for i in permutation],
                                     'reference': reference})
            radii = [.2, .2, .1]
            xyz = [.15, 0., tiny]
            rows.append({'radii': radii, 'xyz': xyz,
                         'reference': oracle.nearest(radii, xyz, iterations=1600)})
            # Cancellation in p-a must retain the low bits of the cusp gap.
            for x in [1.8999999999999995, 1.8999999999999992, 1.9]:
                for sign in [-1., 1.]:
                    radii = [10., 10., 9.]
                    xyz = [x, 0., sign * 1e-320]
                    rows.append({'radii': radii, 'xyz': xyz,
                                 'reference': oracle.nearest(radii, xyz, iterations=1600)})
    return {'provenance': {'license': 'MIT', 'precision': 220, 'iterations': 900, 'extremePrecision': 440, 'extremeIterations': 1600,
            'method': 'Original Decimal bisection from exact stored binary64 inputs; positive-definite multiplier certificate.'}, 'cases': rows}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    text = json.dumps(generate(), indent=2, allow_nan=False) + '\n'
    if args.check:
        assert DESTINATION.read_text() == text, 'Regenerate nearest-cusp-reference.json'
        print('Independent nearest-cusp reference is reproducible')
    else:
        DESTINATION.write_text(text)
        print('Wrote', DESTINATION)
