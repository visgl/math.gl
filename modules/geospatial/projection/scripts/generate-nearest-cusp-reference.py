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
                point = [10. ** -power, y, 0.]
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
    return {'provenance': {'license': 'MIT', 'precision': 220, 'iterations': 900,
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
