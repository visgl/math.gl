# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
"""Write high-precision controls for the classic sound-speed and absorption equations.

This is an independent evaluation. It does not import or translate the TypeScript code.
Each equation is written here from its source, with coefficients named as the source
names them, and evaluated in 40-digit decimal arithmetic (Python `decimal`).

Usage, from the repository root:

    python3 modules/earth/scripts/ocean/generate-acoustic-reference.py
    python3 modules/earth/scripts/ocean/generate-acoustic-reference.py --check
"""
import json
import sys
from pathlib import Path

from decimal import Decimal, getcontext

getcontext().prec = 40
OUTPUT = Path(__file__).resolve().parents[2] / 'test/ocean/data/acoustic-reference.json'


def m(text):
    return Decimal(str(text))


def sqrt(x):
    return x.sqrt()


def exp(x):
    return x.exp()


def ipow(x, n):
    result = Decimal(1)
    for _ in range(n):
        result *= x
    return result


def power10(x):
    return Decimal(10) ** x


# Chen and Millero (1977) with the Wong and Zhu (1995) ITS-90 coefficients, as NPL prints them.
CM_ITS90 = {
    'C00': '1402.388', 'C01': '5.03830', 'C02': '-5.81090e-2', 'C03': '3.3432e-4',
    'C04': '-1.47797e-6', 'C05': '3.1419e-9', 'C10': '0.153563', 'C11': '6.8999e-4',
    'C12': '-8.1829e-6', 'C13': '1.3632e-7', 'C14': '-6.1260e-10', 'C20': '3.1260e-5',
    'C21': '-1.7111e-6', 'C22': '2.5986e-8', 'C23': '-2.5353e-10', 'C24': '1.0415e-12',
    'C30': '-9.7729e-9', 'C31': '3.8513e-10', 'C32': '-2.3654e-12', 'A00': '1.389',
    'A01': '-1.262e-2', 'A02': '7.166e-5', 'A03': '2.008e-6', 'A04': '-3.21e-8',
    'A10': '9.4742e-5', 'A11': '-1.2583e-5', 'A12': '-6.4928e-8', 'A13': '1.0515e-8',
    'A14': '-2.0142e-10', 'A20': '-3.9064e-7', 'A21': '9.1061e-9', 'A22': '-1.6009e-10',
    'A23': '7.994e-12', 'A30': '1.100e-10', 'A31': '6.651e-12', 'A32': '-3.391e-13',
    'B00': '-1.922e-2', 'B01': '-4.42e-5', 'B10': '7.3637e-5', 'B11': '1.7950e-7',
    'D00': '1.727e-3', 'D10': '-7.9836e-6'}

# UNESCO IPTS-68 coefficients from the SVEL listing of Fofonoff and Millard (1983), p. 49.
CM_IPTS68 = dict(CM_ITS90, **{
    'C01': '5.03711', 'C02': '-5.80852e-2', 'C03': '3.3420e-4', 'C04': '-1.47800e-6',
    'C05': '3.1464e-9', 'C11': '6.8982e-4', 'C12': '-8.1788e-6', 'C13': '1.3621e-7',
    'C14': '-6.1185e-10', 'C21': '-1.7107e-6', 'C22': '2.5974e-8', 'C23': '-2.5335e-10',
    'C24': '1.0405e-12', 'C31': '3.8504e-10', 'C32': '-2.3643e-12', 'A02': '7.164e-5',
    'A03': '2.006e-6', 'A11': '-1.2580e-5', 'A12': '-6.4885e-8', 'A13': '1.0507e-8',
    'A14': '-2.0122e-10', 'A21': '9.1041e-9', 'A22': '-1.6002e-10', 'A23': '7.988e-12',
    'A31': '6.649e-12', 'A32': '-3.389e-13', 'B11': '1.7945e-7'})


def chen_millero(k, S, T, P_dbar):
    c = {name: m(value) for name, value in k.items()}
    S, T, P = m(S), m(T), m(P_dbar) / Decimal(10)
    def row(prefix, i, n):
        return sum(c['%s%d%d' % (prefix, i, j)] * ipow(T, j) for j in range(n))
    Cw = sum(row('C', i, n) * ipow(P, i) for i, n in [(0, 6), (1, 5), (2, 5), (3, 3)])
    A = sum(row('A', i, n) * ipow(P, i) for i, n in [(0, 5), (1, 5), (2, 4), (3, 3)])
    B = c['B00'] + c['B01'] * T + (c['B10'] + c['B11'] * T) * P
    D = c['D00'] + c['D10'] * P
    return Cw + A * S + B * S ** m('1.5') + D * S ** 2


# Del Grosso (1974) NRL II with the Wong and Zhu (1995) ITS-90 coefficients; P in kg/cm².
DG = {'C000': '1402.392', 'CT1': '0.5012285e1', 'CT2': '-0.551184e-1', 'CT3': '0.221649e-3',
      'CS1': '0.1329530e1', 'CS2': '0.1288598e-3', 'CP1': '0.1560592', 'CP2': '0.2449993e-4',
      'CP3': '-0.8833959e-8', 'CST': '-0.1275936e-1', 'CTP': '0.6353509e-2',
      'CT2P2': '0.2656174e-7', 'CTP2': '-0.1593895e-5', 'CTP3': '0.5222483e-9',
      'CT3P': '-0.4383615e-6', 'CS2P2': '-0.1616745e-8', 'CST2': '0.9688441e-4',
      'CS2TP': '0.4857614e-5', 'CSTP': '-0.3406824e-3'}


def del_grosso(S, T, P_dbar):
    c = {name: m(value) for name, value in DG.items()}
    S, T, P = m(S), m(T), m(P_dbar) / m('9.80665')
    return (c['C000'] + c['CT1'] * T + c['CT2'] * T ** 2 + c['CT3'] * T ** 3
            + c['CS1'] * S + c['CS2'] * S ** 2 + c['CP1'] * P + c['CP2'] * P ** 2 + c['CP3'] * P ** 3
            + c['CST'] * S * T + c['CTP'] * T * P + c['CT2P2'] * T ** 2 * P ** 2
            + c['CTP2'] * T * P ** 2 + c['CTP3'] * T * P ** 3 + c['CT3P'] * T ** 3 * P
            + c['CS2P2'] * S ** 2 * P ** 2 + c['CST2'] * S * T ** 2 + c['CS2TP'] * S ** 2 * T * P
            + c['CSTP'] * S * T * P)


def mackenzie(S, T, D):
    S, T, D = m(S), m(T), m(D)
    return (m('1448.96') + m('4.591') * T - m('5.304e-2') * T ** 2 + m('2.374e-4') * T ** 3
            + m('1.340') * (S - 35) + m('1.630e-2') * D + m('1.675e-7') * D ** 2
            - m('1.025e-2') * T * (S - 35) - m('7.139e-13') * T * D ** 3)


def francois_garrison(f_hz, T, S, D, pH, c=None):
    f, T, S, D, pH = m(f_hz) / 1000, m(T), m(S), m(D), m(pH)
    c = m('1412') + m('3.21') * T + m('1.19') * S + m('0.0167') * D if c is None else m(c)
    theta = 273 + T
    A1 = m('8.86') / c * power10(m('0.78') * pH - 5)
    f1 = m('2.8') * sqrt(S / 35) * power10(4 - 1245 / theta)
    A2 = m('21.44') * S / c * (1 + m('0.025') * T)
    P2 = 1 - m('1.37e-4') * D + m('6.2e-9') * D ** 2
    f2 = m('8.17') * power10(8 - 1990 / theta) / (1 + m('0.0018') * (S - 35))
    if T <= 20:
        A3 = m('4.937e-4') - m('2.59e-5') * T + m('9.11e-7') * T ** 2 - m('1.50e-8') * T ** 3
    else:
        A3 = m('3.964e-4') - m('1.146e-5') * T + m('1.45e-7') * T ** 2 - m('6.5e-10') * T ** 3
    P3 = 1 - m('3.83e-5') * D + m('4.9e-10') * D ** 2
    return (A1 * f1 * f ** 2 / (f1 ** 2 + f ** 2) + A2 * P2 * f2 * f ** 2 / (f2 ** 2 + f ** 2)
            + A3 * P3 * f ** 2)


def ainslie_mccolm(f_hz, T, S, D, pH):
    f, T, S, z, pH = m(f_hz) / 1000, m(T), m(S), m(D) / 1000, m(pH)
    f1 = m('0.78') * sqrt(S / 35) * exp(T / 26)
    f2 = 42 * exp(T / 17)
    return (m('0.106') * f1 * f ** 2 / (f1 ** 2 + f ** 2) * exp((pH - 8) / m('0.56'))
            + m('0.52') * (1 + T / 43) * (S / 35) * f2 * f ** 2 / (f2 ** 2 + f ** 2) * exp(-z / 6)
            + m('0.00049') * f ** 2 * exp(-(T / 27 + z / 17)))


def value(x):
    return float(x)


def main():
    controls = {'chenMillero': [], 'delGrosso': [], 'mackenzie': [], 'francoisGarrison': [],
                'ainslieMcColm': []}
    for S, T, P in [(0, 0, 0), (40, 40, 10000), (35, 10, 1000), (35, 2, 5000), (0, 40, 0),
                    (20, 25, 2500), (38, 15, 10000), (34.7, 1.5, 4000)]:
        controls['chenMillero'].append({'inputs': [S, T, P], 'value': value(chen_millero(CM_ITS90, S, T, P))})
    for S, T, P in [(30, 0, 0), (40, 30, 9806.65), (35, 10, 1000), (35, 2, 5000), (30, 30, 0),
                    (38, 15, 8000), (34.7, 1.5, 4000)]:
        controls['delGrosso'].append({'inputs': [S, T, P], 'value': value(del_grosso(S, T, P))})
    for S, T, D in [(35, 25, 1000), (30, -2, 0), (40, 30, 8000), (35, 10, 1000), (34.7, 1.5, 4000),
                    (38, 15, 6000)]:
        controls['mackenzie'].append({'inputs': [S, T, D], 'value': value(mackenzie(S, T, D))})
    for f, T, S, D, pH, c in [(12000, 4, 35, 1000, 8, None), (100000, 10, 35, 0, 8, None),
                              (400000, 20, 35, 50, 8, None), (400000, 20.5, 35, 50, 8, None),
                              (200, -2, 0, 0, 7.7, None), (1e6, 30, 40, 10000, 8.3, None),
                              (38000, 15, 34, 200, 8.1, 1505.25)]:
        controls['francoisGarrison'].append({'inputs': [f, T, S, D, pH, c],
                                             'value': value(francois_garrison(f, T, S, D, pH, c))})
    for f, T, S, D, pH in [(12000, 4, 35, 1000, 8), (100000, 10, 35, 0, 8), (400000, 20, 35, 50, 8),
                           (100, -6, 5, 0, 7.7), (1e6, 35, 50, 7000, 8.3), (38000, 15, 34, 200, 8.1)]:
        controls['ainslieMcColm'].append({'inputs': [f, T, S, D, pH],
                                          'value': value(ainslie_mccolm(f, T, S, D, pH))})
    reference = {
        'source': 'Independent 40-digit decimal evaluation of the published equations.',
        'unescoCheckValue': {
            'source': 'Fofonoff and Millard (1983), UNESCO Tech. Pap. Mar. Sci. 44, SVEL listing, p. 49',
            'inputs': [40, 40, 10000], 'temperatureScale': 'IPTS-68', 'printed': 1731.995,
            'highPrecision': value(chen_millero(CM_IPTS68, 40, 40, 10000))},
        'controls': controls}
    text = json.dumps(reference, indent=1) + '\n'
    if '--check' in sys.argv:
        assert OUTPUT.read_text() == text, 'Stored acoustic controls differ from the evaluation'
        print('Stored acoustic controls match the high-precision evaluation.')
    else:
        OUTPUT.write_text(text)
        print('Wrote %s' % OUTPUT)


if __name__ == '__main__':
    main()
