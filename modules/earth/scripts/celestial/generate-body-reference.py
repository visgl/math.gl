#!/usr/bin/env python3
# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
"""Write the stored controls of the solar-system body functions of `@math.gl/earth/celestial`.

The controls come from CSPICE (through SpiceyPy) and pinned NAIF kernels, and from an independent
Python evaluation of the JPL approximate planet elements, parsed from the JPL table text. The script
does not read or run the TypeScript code.

Run it offline, outside CI; it downloads about 33 MB of kernels into a cache directory and checks
their SHA-256 values:

    uv run --no-project --with spiceypy==8.4.0 \
        modules/earth/scripts/celestial/generate-body-reference.py [--cache DIR] [--check]

With `--check` the script writes nothing. It fails when the stored file differs from a new run.
"""

import argparse
import hashlib
import json
import math
import sys
import urllib.request
from pathlib import Path

import spiceypy as spice

ROOT = Path(__file__).resolve().parents[4]
OUTPUT = ROOT / 'modules/earth/celestial/test/data/body-reference.json'

NAIF = 'https://naif.jpl.nasa.gov/pub/naif/generic_kernels'
KERNELS = {
    # IAU WGCCRE 2015 rotation models and radii (Archinal et al. 2018).
    'pck00011.tpc': (
        f'{NAIF}/pck/pck00011.tpc',
        '3dff7b1dbeceaa01f25467767d3fa25816051c85d162d1edf04acb310ee28bb1',
    ),
    # DE440 planetary ephemeris, 1849-12-26 to 2150-01-22.
    'de440s.bsp': (
        f'{NAIF}/spk/planets/de440s.bsp',
        'c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2',
    ),
}

BODIES = ['sun', 'mercury', 'venus', 'earth', 'moon', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']
# Days of TT from J2000.0 inside the supported range of the rotation functions (1900 to 2100).
ROTATION_DAYS = [-36524, -18262.75, -0.5, 0, 0.25, 1234.5678, 9792.5, 20000.125, 36525]
# The ephemeris targets of the bodies (barycenters for the outer planets; their offset from the
# planet is below 1e-6 of the distance to the Sun).
SPK_TARGET = {
    'mercury': 'MERCURY', 'venus': 'VENUS', 'earth': 'EARTH', 'moon': 'MOON',
    'mars': 'MARS BARYCENTER', 'jupiter': 'JUPITER BARYCENTER', 'saturn': 'SATURN BARYCENTER',
    'uranus': 'URANUS BARYCENTER', 'neptune': 'NEPTUNE BARYCENTER',
}
PLANETS = {
    'Mercury': 'mercury', 'Venus': 'venus', 'EM Bary': 'earth-moon-barycenter', 'Mars': 'mars',
    'Jupiter': 'jupiter', 'Saturn': 'saturn', 'Uranus': 'uranus', 'Neptune': 'neptune',
}
PLANET_SPK = {
    'mercury': 'MERCURY BARYCENTER', 'venus': 'VENUS BARYCENTER',
    'earth-moon-barycenter': 'EARTH BARYCENTER', 'mars': 'MARS BARYCENTER',
    'jupiter': 'JUPITER BARYCENTER', 'saturn': 'SATURN BARYCENTER',
    'uranus': 'URANUS BARYCENTER', 'neptune': 'NEPTUNE BARYCENTER',
}

# The tables of https://ssd.jpl.nasa.gov/planets/approx_pos.html (E. M. Standish and J. G.
# Williams), as the page prints them.
TABLE_1 = """
Mercury   0.38709927      0.20563593      7.00497902      252.25032350     77.45779628     48.33076593
          0.00000037      0.00001906     -0.00594749   149472.67411175      0.16047689     -0.12534081
Venus     0.72333566      0.00677672      3.39467605      181.97909950    131.60246718     76.67984255
          0.00000390     -0.00004107     -0.00078890    58517.81538729      0.00268329     -0.27769418
EM Bary   1.00000261      0.01671123     -0.00001531      100.46457166    102.93768193      0.0
          0.00000562     -0.00004392     -0.01294668    35999.37244981      0.32327364      0.0
Mars      1.52371034      0.09339410      1.84969142       -4.55343205    -23.94362959     49.55953891
          0.00001847      0.00007882     -0.00813131    19140.30268499      0.44441088     -0.29257343
Jupiter   5.20288700      0.04838624      1.30439695       34.39644051     14.72847983    100.47390909
         -0.00011607     -0.00013253     -0.00183714     3034.74612775      0.21252668      0.20469106
Saturn    9.53667594      0.05386179      2.48599187       49.95424423     92.59887831    113.66242448
         -0.00125060     -0.00050991      0.00193609     1222.49362201     -0.41897216     -0.28867794
Uranus   19.18916464      0.04725744      0.77263783      313.23810451    170.95427630     74.01692503
         -0.00196176     -0.00004397     -0.00242939      428.48202785      0.40805281      0.04240589
Neptune  30.06992276      0.00859048      1.77004347      -55.12002969     44.96476227    131.78422574
          0.00026291      0.00005105      0.00035372      218.45945325     -0.32241464     -0.00508664
"""
TABLE_2A = """
Mercury   0.38709843      0.20563661      7.00559432      252.25166724     77.45771895     48.33961819
          0.00000000      0.00002123     -0.00590158   149472.67486623      0.15940013     -0.12214182
Venus     0.72332102      0.00676399      3.39777545      181.97970850    131.76755713     76.67261496
         -0.00000026     -0.00005107      0.00043494    58517.81560260      0.05679648     -0.27274174
EM Bary   1.00000018      0.01673163     -0.00054346      100.46691572    102.93005885     -5.11260389
         -0.00000003     -0.00003661     -0.01337178    35999.37306329      0.31795260     -0.24123856
Mars      1.52371243      0.09336511      1.85181869       -4.56813164    -23.91744784     49.71320984
          0.00000097      0.00009149     -0.00724757    19140.29934243      0.45223625     -0.26852431
Jupiter   5.20248019      0.04853590      1.29861416       34.33479152     14.27495244    100.29282654
         -0.00002864      0.00018026     -0.00322699     3034.90371757      0.18199196      0.13024619
Saturn    9.54149883      0.05550825      2.49424102       50.07571329     92.86136063    113.63998702
         -0.00003065     -0.00032044      0.00451969     1222.11494724      0.54179478     -0.25015002
Uranus   19.18797948      0.04685740      0.77298127      314.20276625    172.43404441     73.96250215
         -0.00020455     -0.00001550     -0.00180155      428.49512595      0.09266985      0.05739699
Neptune  30.06952752      0.00895439      1.77005520      304.22289287     46.68158724    131.78635853
          0.00006447      0.00000818      0.00022400      218.46515314      0.01009938     -0.00606302
"""
TABLE_2B = """
Jupiter   -0.00012452    0.06064060   -0.35635438   38.35125000
Saturn     0.00025899   -0.13434469    0.87320147   38.35125000
Uranus     0.00058331   -0.97731848    0.17689245    7.67025000
Neptune   -0.00041348    0.68346318   -0.10162547    7.67025000
"""
OBLIQUITY_DEG = 23.43928
TABLE_1_DAYS = (-73048, 18263)
TABLE_2_DAYS = (-1825871, 365243)


def parse_elements(text):
    lines = [line for line in text.strip('\n').split('\n') if line.strip()]
    table = {}
    for first, second in zip(lines[0::2], lines[1::2]):
        name = first[:9].strip()
        table[PLANETS[name]] = [float(v) for v in first[9:].split()] + [float(v) for v in second.split()]
    return table


def parse_extra(text):
    table = {}
    for line in text.strip('\n').split('\n'):
        name, *values = line.split()
        table[PLANETS[name]] = [float(v) for v in values]
    return table


ELEMENTS_1 = parse_elements(TABLE_1)
ELEMENTS_2 = parse_elements(TABLE_2A)
EXTRA_2 = parse_extra(TABLE_2B)


def standish(planet, days, frame):
    """Heliocentric position, au, from the JPL procedure, with Kepler solved to machine precision."""
    use_1 = TABLE_1_DAYS[0] <= days <= TABLE_1_DAYS[1]
    el = (ELEMENTS_1 if use_1 else ELEMENTS_2)[planet]
    t = days / 36525.0
    a, e, inc, lon, peri, node = (el[k] + el[k + 6] * t for k in range(6))
    w = peri - node
    m = lon - peri
    if not use_1 and planet in EXTRA_2:
        b, c, s, f = EXTRA_2[planet]
        m += b * t * t + c * math.cos(math.radians(f * t)) + s * math.sin(math.radians(f * t))
    m = math.fmod(m, 360.0)
    if m > 180:
        m -= 360
    if m < -180:
        m += 360
    # The JPL iteration in degrees, with e* = (180 / pi) e, run to convergence.
    estar = math.degrees(e)
    big_e = m + estar * math.sin(math.radians(m))
    for _ in range(100):
        dm = m - (big_e - estar * math.sin(math.radians(big_e)))
        de = dm / (1 - e * math.cos(math.radians(big_e)))
        big_e += de
        if abs(de) < 1e-13:
            break
    xp = a * (math.cos(math.radians(big_e)) - e)
    yp = a * math.sqrt(1 - e * e) * math.sin(math.radians(big_e))
    cw, sw = math.cos(math.radians(w)), math.sin(math.radians(w))
    cn, sn = math.cos(math.radians(node)), math.sin(math.radians(node))
    ci, si = math.cos(math.radians(inc)), math.sin(math.radians(inc))
    x = (cw * cn - sw * sn * ci) * xp + (-sw * cn - cw * sn * ci) * yp
    y = (cw * sn + sw * cn * ci) * xp + (-sw * sn + cw * cn * ci) * yp
    z = (sw * si) * xp + (cw * si) * yp
    if frame == 'ecliptic':
        return [x, y, z]
    ce, se = math.cos(math.radians(OBLIQUITY_DEG)), math.sin(math.radians(OBLIQUITY_DEG))
    return [x, ce * y - se * z, se * y + ce * z]


def column_major(rows):
    return [rows[r][c] for c in range(3) for r in range(3)]


def fetch(cache, name):
    url, digest = KERNELS[name]
    path = cache / name
    if not path.exists():
        cache.mkdir(parents=True, exist_ok=True)
        print(f'Downloading {url}', file=sys.stderr)
        urllib.request.urlretrieve(url, path)
    actual = hashlib.sha256(path.read_bytes()).hexdigest()
    if digest is not None and actual != digest:
        raise SystemExit(f'{name}: SHA-256 {actual} does not match the pin {digest}')
    return path, actual


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache', type=Path, default=Path.home() / '.cache/mathgl-celestial')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()

    provenance = {}
    for name in KERNELS:
        path, digest = fetch(args.cache, name)
        spice.furnsh(str(path))
        provenance[name] = {'url': KERNELS[name][0], 'sha256': digest}

    rotation = []
    for body in BODIES:
        frame = f'IAU_{body.upper()}'
        for days in ROTATION_DAYS:
            et = days * 86400.0
            matrix = spice.pxform('J2000', frame, et)
            state = spice.sxform('J2000', frame, et)
            rate = [[state[3 + r][c] for c in range(3)] for r in range(3)]
            w, colatitude, node = spice.m2eul(matrix, 3, 1, 3)
            rotation.append({
                'body': body,
                'days': days,
                'poleRightAscension': (math.degrees(node) - 90) % 360,
                'poleDeclination': 90 - math.degrees(colatitude),
                'primeMeridian': math.degrees(w) % 360,
                'rotation': column_major(matrix),
                'rotationRate': column_major(rate),
            })

    # Subsolar points: the Sun position from DE440 (geometric), the frame from pck00011.
    subsolar = []
    for body, target in SPK_TARGET.items():
        frame = f'IAU_{body.upper()}'
        for days in [-18262.75, 0.25, 9792.5, 20000.125]:
            et = days * 86400.0
            sun, _ = spice.spkpos('SUN', et, 'J2000', 'NONE', target)
            fixed = spice.mxv(spice.pxform('J2000', frame, et), sun)
            _, longitude, latitude = spice.reclat(fixed)
            subsolar.append({
                'body': body,
                'days': days,
                'sunPosition': list(sun),
                'longitude': math.degrees(longitude),
                'latitude': math.degrees(latitude),
            })

    # The JPL elements: an independent evaluation at dates in both tables, and DE440 positions
    # for the error gate.
    elements_days = [-1825871, -1000000.5, -500000, -73048.5, -73048, -36524, 0, 9792.5, 18263,
                     18263.5, 100000.25, 365243]
    elements = []
    for planet in ELEMENTS_1:
        for days in elements_days:
            elements.append({
                'planet': planet,
                'days': days,
                'equatorial': standish(planet, days, 'equatorial'),
                'ecliptic': standish(planet, days, 'ecliptic'),
            })
    # DE440 heliocentric positions in the mean ecliptic and equinox of J2000 (ECLIPJ2000), every
    # 1000 days plus an offset, 1850 to 2050 (the overlap of de440s and Table 1).
    ephemeris = []
    for planet, target in PLANET_SPK.items():
        days = -54787.3
        while days <= TABLE_1_DAYS[1]:
            position, _ = spice.spkpos(target, days * 86400.0, 'ECLIPJ2000', 'NONE', 'SUN')
            ephemeris.append({'planet': planet, 'days': round(days, 6),
                              'ecliptic': [v / 149597870.7 for v in position]})
            days += 1000.0

    reference = {
        'description': 'Stored controls of the solar-system body functions of @math.gl/earth/celestial.',
        'generator': 'modules/earth/scripts/celestial/generate-body-reference.py',
        'cspice': spice.tkvrsn('TOOLKIT'),
        'kernels': provenance,
        'elementsSource': 'https://ssd.jpl.nasa.gov/planets/approx_pos.html (Standish and Williams)',
        'timeArgument': 'days of TT from J2000.0; SPICE evaluates them as TDB seconds (days * 86400)',
        'rotation': rotation,
        'subsolar': subsolar,
        'elements': elements,
        'ephemeris': ephemeris,
    }
    text = json.dumps(reference, indent=1) + '\n'
    if args.check:
        if not OUTPUT.exists() or OUTPUT.read_text() != text:
            raise SystemExit(f'{OUTPUT} is stale. Run the generator without --check.')
        print('Stored controls are current.')
        return
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(text)
    print(f'Wrote {OUTPUT}')


if __name__ == '__main__':
    main()
