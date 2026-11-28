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
# GSW_INVALID_VALUE of `gswteos-10.h`: the value that GSW-C functions return for no result.
GSW_INVALID_VALUE = 9e15
# Small conductivities (mS/cm) and temperatures (deg C) for sp_from_c edge controls at p = 0.
# A cast that starts in air gives such values. GSW-C returns GSW_INVALID_VALUE where the
# extended scale is below 0. The script stores those rows with the value null.
SMALL_CONDUCTIVITIES = [1e-4, 5e-4, 1e-3, 2e-3]
SMALL_CONDUCTIVITY_TEMPERATURES = [0, 20, 35]

CAST_FIELDS = ['sp', 'sa', 't', 'p', 'ct', 'sr_from_sp', 'sa_from_sp', 'deltasa_from_sp',
               'ct_from_t', 'rho', 'sound_speed', 'z_from_p', 'p_from_z', 't_freezing_poly',
               'c_from_sp', 'sp_from_c', 'pt_from_t', 'sigma0', 'alpha', 'beta']
TOLERANCES = ['sr_from_sp', 'sa_from_sp', 'ct_from_t', 'rho', 'sound_speed', 'z_from_p',
              'p_from_z', 't_freezing_poly', 'c_from_sp', 'sp_from_c', 'pt_from_t', 'sigma0', 'n2',
              'p_mid_n2', 'alpha', 'beta']
# Edge functions that store fewer than four inputs. Other functions store four.
INPUT_COUNTS = {'c_from_sp': 3, 'sp_from_c': 3, 'pt_from_t': 4, 'rho_ref': 3}

DRIVER = r'''
#include <stdio.h>
#include <string.h>
#include "gswteos-10.h"
int main(void) {
  double a, b, c, d;
  char kind[32];
  while (scanf("%31s %lf %lf %lf %lf", kind, &a, &b, &c, &d) == 5) {
    double value = 0;
    if (!strcmp(kind, "rho") || !strcmp(kind, "rho_ref")) value = gsw_rho(a, b, c);
    else if (!strcmp(kind, "sound_speed")) value = gsw_sound_speed(a, b, c);
    else if (!strcmp(kind, "ct_from_t")) value = gsw_ct_from_t(a, b, c);
    else if (!strcmp(kind, "freezing")) value = gsw_t_freezing_poly(a, b, c);
    else if (!strcmp(kind, "z_from_p")) value = gsw_z_from_p(a, b, c, d);
    else if (!strcmp(kind, "p_from_z")) value = gsw_p_from_z(a, b, c, d);
    else if (!strcmp(kind, "c_from_sp")) value = gsw_c_from_sp(a, b, c);
    else if (!strcmp(kind, "sp_from_c")) value = gsw_sp_from_c(a, b, c);
    else if (!strcmp(kind, "pt_from_t")) value = gsw_pt_from_t(a, b, c, d);
    else value = 9e90;
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
    # PSS-78 conductivity at the practical-salinity edges (0.01, 1, 1.99, 2, 2.01, 35, 42).
    for sp in [0.01, 1, 1.99, 2, 2.01, 35, 42]:
        for t in [-2, 0, 20, 35]:
            for p in [0, 5000, 10000]:
                rows.append(('c_from_sp', sp, t, p, 0))
    # Potential temperature: cold deep level, warm surface level and SA 0, at four references.
    for sa, t, p in [(34.9, 1.5, 8000), (36, 30, 0), (0, 10, 2000)]:
        for p_ref in [0, 1000, 4000, 10000]:
            rows.append(('pt_from_t', sa, t, p, p_ref))
    # Density at a reference pressure, at three points inside the funnel.
    for sa, ct in [(35, 10), (34.7, 2), (36, 25)]:
        for p_ref in [1000, 2000, 4000]:
            rows.append(('rho_ref', sa, ct, p_ref, 0))
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
        # Keep only conductivities that GSW-C returns as finite values.
        kept = [(row, value) for row, value in zip(rows, values)
                if not (row[0] == 'c_from_sp' and not abs(value) < INVALID)]
        rows = [row for row, _ in kept]
        values = [value for _, value in kept]
        inverse = [('p_from_z', values[i], row[2], row[3], row[4])
                   for i, row in enumerate(rows) if row[0] == 'z_from_p']
        # Feed each conductivity back into gsw_sp_from_c.
        inverse += [('sp_from_c', values[i], row[2], row[3], 0)
                    for i, row in enumerate(rows) if row[0] == 'c_from_sp']
        second = subprocess.run(
            [str(executable)], input='\n'.join('%s %r %r %r %r' % row for row in inverse) + '\n',
            capture_output=True, text=True, check=True).stdout.split()
        small = [('sp_from_c', c, t, 0, 0) for c in SMALL_CONDUCTIVITIES
                 for t in SMALL_CONDUCTIVITY_TEMPERATURES]
        third = subprocess.run(
            [str(executable)], input='\n'.join('%s %r %r %r %r' % row for row in small) + '\n',
            capture_output=True, text=True, check=True).stdout.split()
    # Keep the O1 controls first, in their original order, then the O6a controls.
    new_kinds = ('c_from_sp', 'pt_from_t', 'rho_ref')
    rows_all = list(zip(rows, values))
    ordered = ([x for x in rows_all if x[0][0] not in new_kinds]
               + [(r, v) for r, v in zip(inverse, second) if r[0] == 'p_from_z']
               + [x for x in rows_all if x[0][0] in new_kinds]
               + [(r, v) for r, v in zip(inverse, second) if r[0] == 'sp_from_c'])
    # A stored value must be a GSW-C result, not the driver sentinel or GSW_INVALID_VALUE.
    for row, value in ordered:
        assert abs(float(value)) < GSW_INVALID_VALUE, 'GSW-C gives no value for %r' % (row,)
    controls = []
    for (kind, a, b, c, d), value in ordered:
        controls.append({'function': kind, 'inputs': [a, b, c, d][:INPUT_COUNTS.get(kind, 4)],
                         'value': float(value)})
    # Small-conductivity controls: null where GSW-C returns GSW_INVALID_VALUE.
    for (kind, a, b, c, d), value in zip(small, third):
        value = float(value)
        assert abs(value) < GSW_INVALID_VALUE or value == GSW_INVALID_VALUE, \
            'Unexpected GSW-C value %r for %r' % (value, (kind, a, b, c))
        controls.append({'function': kind, 'inputs': [a, b, c],
                         'value': value if value != GSW_INVALID_VALUE else None})
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
    # N-squared: three casts of `cast_mpres_m` levels; the valid values are a prefix of each cast.
    mpres_m = int(read_define(header, 'cast_mpres_m'))
    n2_values, p_mid_values = read_array(header, 'n2'), read_array(header, 'p_mid_n2')
    nsquared = []
    for cast in range(len(n2_values) // mpres_m):
        window = slice(cast * mpres_m, (cast + 1) * mpres_m)
        valid = [i for i in range(mpres_m)
                 if abs(n2_values[window][i]) < INVALID and abs(p_mid_values[window][i]) < INVALID]
        nsquared.append({'cast': cast, 'n2': [n2_values[window][i] for i in valid],
                         'p_mid': [p_mid_values[window][i] for i in valid]})
    reference = {
        'source': {
            'library': 'GSW-C',
            'repository': 'https://github.com/TEOS-10/GSW-C',
            'commit': GSW_C_COMMIT,
            'version': GSW_C_VERSION,
            'checkData': 'gsw_check_data.h (GSW MATLAB 3.06.16 check values)',
            'note': 'Casts: stored GSW check values. Edges: unmodified GSW-C compiled offline.',
            't_freezing_poly': 'GSW check values use saturation_fraction = 0.5.',
            'invalid': 'An edge value of null: GSW-C returns GSW_INVALID_VALUE (no result).'
        },
        'tolerances': {name: read_define(header, name + '_ca') for name in TOLERANCES},
        'casts': casts,
        'nsquared': nsquared,
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
