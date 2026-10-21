#!/usr/bin/env python3
# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
# Original high-precision evaluation of Van der Grinten algebra, no runtime imports.
from decimal import Decimal as D, localcontext
with localcontext() as context:
    context.prec = 80
    pi = D('3.141592653589793238462643383279502884197169399375105820974944592307816406286')
    longitude, latitude = D.from_float(1.5755094960331917), D.from_float(.8000990655273199)
    dlon = (longitude - 10) * pi / 180
    sin = 2 * abs(latitude) / 180
    cos = (1 - sin * sin).sqrt()
    al = abs(pi / dlon - dlon / pi) / 2
    g = cos / (sin + cos - 1)
    m = g * (2 / sin - 1)
    aa, mm, gg = al * al, m * m, g * g
    x = pi * 6378137 * (al * (g - mm) + (aa * (g - mm)**2 - (mm + aa) * (gg - mm)).sqrt()) / (mm + aa)
    q = aa + g
    y = pi * 6378137 * (m * q - al * ((mm + aa) * (aa + 1) - q * q).sqrt()) / (mm + aa)
    assert abs(-x - D('-937791.50327233874368253280718629')) < D('1e-23')
    assert abs(y - D('89069.24762322956935849563848581')) < D('1e-23')
    print('Independent 80-digit Van der Grinten regression verified:', -x, y)
