#!/usr/bin/env python3
# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
"""Original deterministic path samples from the existing pinned C++ API drivers.
Native generation is offline only; --check verifies provenance without dependencies.
"""
import argparse
import hashlib
import json
import math
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
DEST = ROOT / 'modules/geospatial/test/ellipsoid/geographic-seam-reference.json'
DRIVER = ROOT / 'modules/geospatial/projection/scripts/geographiclib-g56-oracle.cpp'
GEO_DRIVER = ROOT / 'modules/geospatial/projection/scripts/geographiclib-p0-oracle.cpp'
PROJ = ROOT / 'modules/geospatial/test/ellipsoid/geodesic-path-reference.json'
ARCHIVE = '5aaca14cd75f13aa2690273d76e88e8ddf4aeb267d6be2c3e0ba948deb9ceea5'


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def execute(binary, rows, finite_columns=None):
    data = ''.join(' '.join(map(str, row)) + '\n' for row in rows)
    output = subprocess.check_output([binary], input=data, text=True).splitlines()
    assert len(output) == len(rows)
    result = [list(map(float, row.split())) for row in output]
    assert all(math.isfinite(value) for row in result for value in row[:finite_columns])
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--oracle')
    parser.add_argument('--geodesic-oracle')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    provenance = dict(version='2.7', precisionBits=53, archiveSHA256=ARCHIVE,
                      generatorSHA256=digest(Path(__file__)), driverSHA256=digest(DRIVER),
                      geodesicDriverSHA256=digest(GEO_DRIVER), projReferenceSHA256=digest(PROJ))
    if args.check:
        data = json.loads(DEST.read_text())
        assert data['provenance'] == provenance
        assert len(data['rhumb']) == 100 and len(data['geodesic']) == 180
        print('Geographic seam reference provenance passed (280 native controls)')
        return
    if not args.oracle or not args.geodesic_oracle:
        parser.error('Both offline oracle paths are required')
    for binary in [args.oracle, args.geodesic_oracle]:
        assert subprocess.check_output([binary, '--version'], text=True).strip() == '2.7 53'
    paths = []
    for ratio in [.5, .9966471893352525, 1., 1.01, 2.]:
        for start, end in [([170., 20.], [-170., 40.]), ([-170., -30.], [170., 50.]),
                           ([0., 0.], [80., 40.]), ([10., 60.], [30., 60.])]:
            paths.append((6378137., 6378137. * ratio, start, end))
    # Only distance/bearing and endpoint coordinates are controls here. Native
    # Exact rhumb sphere-parallel area may be NaN; G5/analytic area gates remain separate.
    inverses = execute(args.oracle, [['I', a, b, s[1], s[0], e[1], e[0]] for a, b, s, e in paths], finite_columns=2)
    workloads = [(path, inverse, fraction) for path, inverse in zip(paths, inverses)
                 for fraction in [.125, .25, .5, .75, .875]]
    samples = execute(args.oracle, [['D', a, b, s[1], s[0], inverse[1], inverse[0] * fraction]
                                   for (a, b, s, _), inverse, fraction in workloads], finite_columns=2)
    rhumb = [dict(axes=[a, b], start=s, end=e, fraction=f, distance=inv[0], position=[v[1], v[0]])
             for ((a, b, s, e), inv, f), v in zip(workloads, samples)]
    original = json.loads(PROJ.read_text())['cases']

    def query(mode, row, values):
        return [mode, 'S', row['axes'][0], row['axes'][1], 0] + values + [0, 0]
    inverses = execute(args.geodesic_oracle, [query('I', r, [r['start'][1], r['start'][0],
                       r['end'][1], r['end'][0]]) for r in original])
    samples = execute(args.geodesic_oracle, [query('U', r, [r['start'][1], r['start'][0],
                      inverse[2], r['distance'] * r['fraction']]) for r, inverse in zip(original, inverses)])
    geodesic = []
    for row, sample in zip(original, samples):
        def xyz(lon, lat):
            lon, lat = math.radians(lon), math.radians(lat)
            return [math.cos(lon) * math.cos(lat), math.sin(lon) * math.cos(lat), math.sin(lat)]
        native, proj = xyz(sample[1], sample[0]), xyz(*row['position'])
        assert math.sqrt(sum((a-b)**2 for a, b in zip(native, proj))) * row['axes'][0] <= 1e-6
        geodesic.append(dict(row, azimuth=sample[3]))
    header = json.dumps(dict(provenance=provenance), indent=2)[:-2]
    def compact(rows):
        return ',\n'.join('    ' + json.dumps(row, separators=(',', ':')) for row in rows)
    DEST.write_text(header + ',\n  "rhumb": [\n' + compact(rhumb) +
                    '\n  ],\n  "geodesic": [\n' + compact(geodesic) + '\n  ]\n}\n')


if __name__ == '__main__':
    main()
