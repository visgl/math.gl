# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
"""Write the stored TEOS-10 controls for `@math.gl/earth/ocean`.

The script reads a local checkout of GSW-C at the pinned commit. It does not
modify, copy or ship GSW-C source. It writes two kinds of controls:

1. The GSW check casts from `gsw_check_data.h` (GSW MATLAB 3.06.16 values).
2. Edge controls: the script compiles the unmodified GSW-C with a small
   driver and evaluates it at the edges of the declared domain.

Usage, from the repository root:

    python3 modules/earth/scripts/ocean/generate-seawater-reference.py /path/to/GSW-C
    python3 modules/earth/scripts/ocean/generate-seawater-reference.py /path/to/GSW-C --check
"""
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

GSW_C_COMMIT = 'db75c391137173a0e121166e787fcc15fc3c3e7f'
GSW_C_VERSION = 'v3.06.16-0'
OUTPUT = Path(__file__).resolve().parents[2] / 'test/ocean/data/seawater-reference.json'
INVALID = 9e90

CAST_FIELDS = ['sp', 'sa', 't', 'p', 'ct', 'sr_from_sp', 'sa_from_sp', 'deltasa_from_sp',
               'ct_from_t', 'rho', 'sound_speed', 'z_from_p', 'p_from_z', 't_freezing_poly']
TOLERANCES = ['sr_from_sp', 'sa_from_sp', 'ct_from_t', 'rho', 'sound_speed', 'z_from_p',
              'p_from_z', 't_freezing_poly']

DRIVER = r'''
#include <stdio.h>
#include "gswteos-10.h"
int main(void) {
  double a, b, c, d;
  char kind[32];
  while (scanf("%31s %lf %lf %lf %lf", kind, &a, &b, &c, &d) == 5) {
    double value = 0;
    if (kind[0] == 'r') value = gsw_rho(a, b, c);
    else if (kind[0] == 's') value = gsw_sound_speed(a, b, c);
    else if (kind[0] == 'c') value = gsw_ct_from_t(a, b, c);
    else if (kind[0] == 'f') value = gsw_t_freezing_poly(a, b, c);
    else if (kind[0] == 'z') value = gsw_z_from_p(a, b, c, d);
    else if (kind[0] == 'p') value = gsw_p_from_z(a, b, c, d);
    printf("%.17g\n", value);
  }
  return 0;
}
'''


def read_array(header, name):
    match = re.search(r'double\s+%s\[\d+\]\s*=\s*\{([^}]*)\}' % re.escape(name), header)
    return [float(value) for value in match.group(1).replace('\n', ' ').split(',') if value.strip()]


def read_define(header, name):
    return float(re.search(r'#define\s+%s\s+(\S+)' % re.escape(name), header).group(1))


def edge_inputs():
    """Inputs at the edges of the declared domain, inside the oceanographic funnel."""
    rows = []
    for sa, ct, p in [(0, 0.018, 0), (0, 40, 0), (42, -2.3, 0), (42, 40, 0), (35.16504, 0, 0),
                      (5, 30, 400), (35, 31.66, 499), (0.01, 30, 499), (35, 29.9, 500),
                      (42, 28, 1000), (30, 10, 6500), (42, 10, 8000), (30, -1.9, 8000),
                      (40, 2, 8000), (34.5, 1.5, 5500), (20, 25, 2000)]:
        rows.append(('rho', sa, ct, p, 0))
        rows.append(('sound_speed', sa, ct, p, 0))
    for sa, t, p in [(0, 0, 0), (0, 40, 0), (42, -2.3, 0), (42, 40, 0), (35, 2, 8000),
                     (35, -3, 8000), (30, 10, 6500), (5, 30, 400), (20, 25, 2000)]:
        rows.append(('ct_from_t', sa, t, p, 0))
    for sa, p, fraction in [(0, 0, 0), (0, 8000, 1), (42, 0, 0), (42, 8000, 0), (35, 2000, 0.5),
                            (10, 500, 1)]:
        rows.append(('freezing', sa, p, fraction, 0))
    for p, lat, dynamic, geopotential in [(0, 0, 0, 0), (8000, 0, 0, 0), (8000, 90, 0, 0),
                                          (8000, -90, 0, 0), (4000, 45, 0, 0),
                                          (1000, 30, 2.5, 0), (1000, 30, 0, 1.5),
                                          (5000, -60, 10, -3)]:
        rows.append(('z_from_p', p, lat, dynamic, geopotential))
    return rows


def evaluate_edges(gsw_c, rows):
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        (tmp / 'driver.c').write_text(DRIVER)
        executable = tmp / 'driver'
        subprocess.run(['cc', '-O0', '-ffp-contract=off', '-I', str(gsw_c), str(tmp / 'driver.c'),
                        str(gsw_c / 'gsw_oceanographic_toolbox.c'), str(gsw_c / 'gsw_saar.c'),
                        '-lm', '-o', str(executable)], check=True)
        lines = []
        for kind, a, b, c, d in rows:
            lines.append('%s %r %r %r %r' % (kind, a, b, c, d))
        # Height controls feed the computed height back into gsw_p_from_z.
        first = subprocess.run([str(executable)], input='\n'.join(lines) + '\n',
                               capture_output=True, text=True, check=True).stdout.split()
        values = [float(value) for value in first]
        inverse = [('p_from_z', values[i], row[2], row[3], row[4])
                   for i, row in enumerate(rows) if row[0] == 'z_from_p']
        second = subprocess.run(
            [str(executable)], input='\n'.join('%s %r %r %r %r' % row for row in inverse) + '\n',
            capture_output=True, text=True, check=True).stdout.split()
    controls = []
    for (kind, a, b, c, d), value in zip(rows, values):
        controls.append({'function': kind, 'inputs': [a, b, c, d], 'value': value})
    for (kind, a, b, c, d), value in zip(inverse, second):
        controls.append({'function': kind, 'inputs': [a, b, c, d], 'value': float(value)})
    return controls


def main():
    gsw_c = Path(sys.argv[1]).resolve()
    commit = subprocess.run(['git', '-C', str(gsw_c), 'rev-parse', 'HEAD'], capture_output=True,
                            text=True, check=True).stdout.strip()
    assert commit == GSW_C_COMMIT, 'GSW-C checkout must be at %s, found %s' % (GSW_C_COMMIT, commit)
    header = (gsw_c / 'gsw_check_data.h').read_text()
    cast_m = int(read_define(header, 'cast_m'))
    lat_cast, lon_cast = read_array(header, 'lat_cast'), read_array(header, 'long_cast')
    arrays = {name: read_array(header, name) for name in CAST_FIELDS}
    casts = []
    for index in range(len(arrays['p'])):
        if any(abs(arrays[name][index]) >= INVALID for name in CAST_FIELDS):
            continue
        row = {name: arrays[name][index] for name in CAST_FIELDS}
        row['cast'] = index // cast_m
        row['lat'] = lat_cast[index // cast_m]
        row['lon'] = lon_cast[index // cast_m]
        casts.append(row)
    reference = {
        'source': {
            'library': 'GSW-C',
            'repository': 'https://github.com/TEOS-10/GSW-C',
            'commit': GSW_C_COMMIT,
            'version': GSW_C_VERSION,
            'checkData': 'gsw_check_data.h (GSW MATLAB 3.06.16 check values)',
            'note': 'Casts: stored GSW check values. Edges: unmodified GSW-C compiled offline.',
            't_freezing_poly': 'GSW check values use saturation_fraction = 0.5.'
        },
        'tolerances': {name: read_define(header, name + '_ca') for name in TOLERANCES},
        'casts': casts,
        'edges': evaluate_edges(gsw_c, edge_inputs())
    }
    text = json.dumps(reference, indent=1) + '\n'
    if '--check' in sys.argv:
        assert OUTPUT.read_text() == text, 'Stored seawater controls differ from GSW-C output'
        print('Stored seawater controls match GSW-C %s.' % GSW_C_VERSION)
    else:
        OUTPUT.write_text(text)
        print('Wrote %d cast levels and %d edge controls to %s'
              % (len(casts), len(reference['edges']), OUTPUT))


if __name__ == '__main__':
    main()
