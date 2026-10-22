#!/usr/bin/env python3
# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
# SPDX-FileComment: Original high-precision evaluation of published projection equations; no upstream implementation copied.
"""Independent 80-digit pole references. Temporary tooling: mpmath 1.3.0 only.

Inverse expectations start from the exact stored binary64 projected coordinates,
not the original geographic point. PROJ comparison errors are retained separately.
"""
import hashlib
import json
from pathlib import Path
import mpmath as mp
import pyproj
assert mp.__version__ == '1.3.0'
assert pyproj.__version__ == '3.7.2' and pyproj.proj_version_str == '9.5.1'
pyproj.network.set_network_enabled(False)
mp.mp.dps = 80
D = mp.mpf
pi = mp.pi
deg = pi / 180
root = Path(__file__).resolve().parents[1] / 'test/fixtures'
rows = []


def parameters(definition):
    tokens = dict(t[1:].split('=', 1) for t in definition.split() if '=' in t)
    get = lambda k, default='0': D(tokens.get(k, default))
    a = get('R', '6378137')
    f = D(0) if 'R' in tokens else 1 / D('298.257223563')
    return tokens, a, mp.sqrt(f * (2 - f)), get('lat_0') * deg, get('lon_0') * deg, get('x_0'), get('y_0'), get('k_0', '1')


def q(e, phi):
    if not e:
        return 2 * mp.sin(phi)
    s = mp.sin(phi)
    return (1 - e * e) * (s / (1 - e * e * s * s) + mp.atanh(e * s) / e)


def auth(e, phi):
    return mp.asin(max(-1, min(1, q(e, phi) / q(e, pi / 2))))


def unauth(e, beta):
    if not e:
        return beta
    target = q(e, pi / 2) * mp.sin(abs(beta))
    lo, hi = D(0), pi / 2
    for _ in range(180):
        mid = (lo + hi) / 2
        if q(e, mid) < target:
            lo = mid
        else:
            hi = mid
    return mp.sign(beta) * (lo + hi) / 2


def conformal(e, phi):
    return 2 * mp.atan(mp.exp(mp.asinh(mp.tan(phi)) - e * mp.atanh(e * mp.sin(phi)))) - pi / 2


def unconformal(e, chi):
    lat = chi
    t = mp.tan(pi / 4 + chi / 2)
    for _ in range(30):
        lat = 2 * mp.atan(t * mp.exp(e * mp.atanh(e * mp.sin(lat)))) - pi / 2
    return lat


def direction(s0, c0, sinz, cosz, x, y, radius):
    vertical = cosz * s0 + y * sinz * c0 / radius
    meridian = cosz * c0 - y * sinz * s0 / radius
    east = x * sinz / radius
    return mp.atan2(vertical, mp.hypot(east, meridian)), mp.atan2(east, meridian)


def setup(definition):
    tokens, a, e, lat0, lon0, x0, y0, k = parameters(definition)
    method = tokens['proj']
    if method == 'laea':
        qp = q(e, pi / 2)
        beta0 = mp.sign(lat0)*pi/2 if abs(abs(lat0)-pi/2)<D("1e-70") else auth(e, lat0)
        radius = mp.sqrt(qp / 2)
        dd = D(1) if abs(abs(lat0)-pi/2)<D("1e-70") else mp.cos(lat0) / (mp.sqrt(1-e*e*mp.sin(lat0)**2)*radius*mp.cos(beta0))
        return tokens, a, e, beta0, lon0, x0, y0, a * radius * dd, a * radius / dd
    if method == 'sterea':
        C = mp.sqrt(1+e*e*mp.cos(lat0)**4/(1-e*e))
        chi0 = mp.asin(mp.sin(lat0)/C)
        scale = 2*a*k*mp.sqrt(1-e*e)/(1-e*e*mp.sin(lat0)**2)
        return tokens, a, e, chi0, lon0, x0, y0, scale, scale
    if method == 'stere':
        chi0 = conformal(e, lat0) if e else lat0
        scale = 2 * a * k * (mp.cos(lat0) / (mp.sqrt(1-e*e*mp.sin(lat0)**2)*mp.cos(chi0)) if e else 1)
        return tokens, a, e, chi0, lon0, x0, y0, scale, scale
    return tokens, a, e, lat0, lon0, x0, y0, a, a


def forward(definition, point):
    t, a, e, origin, lon0, x0, y0, sx, sy = setup(definition)
    lon, lat = [D(v)*deg for v in point]
    lam = (lon - lon0 + pi) % (2*pi) - pi
    if t['proj'] == 'moll':
        target = pi*(1-mp.sin(abs(lat)))
        lo, hi = D(0), pi
        for _ in range(180):
            v = (lo+hi)/2
            if v-mp.sin(v)<target:
                lo=v
            else:
                hi=v
        v = (lo+hi)/2
        return [x0+2*mp.sqrt(2)*a/pi*lam*mp.sin(v/2), y0+mp.sign(lat)*mp.sqrt(2)*a*mp.cos(v/2)]
    if t['proj'] == 'qsc':
        lat = mp.atan2((1-e*e)*mp.sin(lat), mp.cos(lat))
        north = origin > 0
        phi = pi/2-lat if north else pi/2+lat
        # Restrict the high-precision polar QSC samples to the central sector.
        theta = lam if north else -lam
        mu = mp.atan(12/pi*(theta+mp.acos(mp.sin(theta)/mp.sqrt(2))-pi/2))
        radius = mp.sqrt((1-mp.cos(phi))/(mp.cos(mu)**2*(1-mp.cos(mp.atan(1/mp.cos(theta))))))
        x, y = radius*mp.cos(mu), radius*mp.sin(mu)
        return [(a*y if north else -a*y)+x0, (-a*x if north else a*x)+y0]
    if t['proj'] == 'sterea':
        raw0 = D(t['lat_0'])*deg
        C = mp.sqrt(1+e*e*mp.cos(raw0)**4/(1-e*e))
        logK = mp.log(mp.tan(pi/4+origin/2))-C*(mp.asinh(mp.tan(raw0))-e*mp.atanh(e*mp.sin(raw0)))
        lam *= C
        beta = 2*mp.atan(mp.exp(logK+C*(mp.asinh(mp.tan(lat))-e*mp.atanh(e*mp.sin(lat)))))-pi/2
    else:
        beta = auth(e, lat) if t['proj'] == 'laea' else (conformal(e, lat) if e else lat)
    denom = 1 + mp.sin(origin)*mp.sin(beta) + mp.cos(origin)*mp.cos(beta)*mp.cos(lam)
    if t['proj'] == 'aeqd':
        distance = mp.acos(max(-1,min(1,denom-1)))
        scale = distance/mp.sin(distance) if distance else D(1)
    else:
        scale = mp.sqrt(2/denom) if t['proj'] == 'laea' else 1/denom
    return [x0+sx*scale*mp.cos(beta)*mp.sin(lam), y0+sy*scale*(mp.cos(origin)*mp.sin(beta)-mp.sin(origin)*mp.cos(beta)*mp.cos(lam))]


def inverse(definition, point):
    t, a, e, origin, lon0, x0, y0, sx, sy = setup(definition)
    x, y = (D(point[0])-x0)/sx, (D(point[1])-y0)/sy
    radius = mp.hypot(x, y)
    if t['proj'] == 'moll':
        ratio = abs(y)/mp.sqrt(2)
        if ratio>1:
            return None
        v = 2*mp.acos(ratio)
        latitude = mp.sign(y)*(pi/2-2*mp.asin(mp.sqrt((v-mp.sin(v))/(2*pi))))
        longitude = pi*x/(2*mp.sqrt(2)*mp.sin(v/2))
        return [(lon0+longitude)/deg, latitude/deg]
    if t['proj'] == 'qsc':
        mu = mp.atan2(x if origin > 0 else -x, -y if origin > 0 else y)
        z = pi/12*mp.tan(mu)
        theta = mp.atan(mp.sin(z)/(mp.cos(z)-1/mp.sqrt(2)))
        delta = mp.cos(mu)**2*radius**2*(1-mp.cos(mp.atan(1/mp.cos(theta))))
        angle = 2*mp.asin(mp.sqrt(delta/2))
        lat = pi/2-angle if origin > 0 else angle-pi/2
        lat = mp.atan2(mp.sin(lat),(1-e*e)*mp.cos(lat))
        return [(lon0+(theta if origin > 0 else -theta))/deg, lat/deg]
    if not radius:
        return [lon0/deg, origin/deg]
    if t['proj'] == 'laea':
        if radius > 2:
            return None
        angle = 2*mp.asin(radius/2)
    elif t['proj'] == 'aeqd':
        angle = radius
    else:
        angle = 2*mp.atan(radius)
    beta, lam = direction(mp.sin(origin),mp.cos(origin),mp.sin(angle),mp.cos(angle),x,y,radius)
    if t['proj'] == 'sterea':
        raw0 = D(t['lat_0'])*deg
        C = mp.sqrt(1+e*e*mp.cos(raw0)**4/(1-e*e))
        logK = mp.log(mp.tan(pi/4+origin/2))-C*(mp.asinh(mp.tan(raw0))-e*mp.atanh(e*mp.sin(raw0)))
        chi = 2*mp.atan(mp.exp((mp.log(mp.tan(pi/4+beta/2))-logK)/C))-pi/2
        lat = unconformal(e,chi)
        lam /= C
    else:
        lat = unauth(e,beta) if t['proj']=='laea' else unconformal(e,beta) if e else beta
    return [(lon0+lam)/deg,lat/deg]


def native_definition(definition):
    # datum=none is a math.gl chain policy, not a native PROJ datum name.
    operation = definition.replace(' +datum=none','')
    if '+ellps=' not in operation and '+R=' not in operation:
        operation += ' +ellps=WGS84'
    return operation


def add(definition, point, do_inverse=True):
    xy = [float(v) for v in forward(definition, point)]
    # Evaluate the inverse from the rounded stored x/y, independently.
    inv = inverse(definition, xy) if do_inverse else None
    operation = native_definition(definition)
    proj = pyproj.Proj(operation)
    native = proj(*point, errcheck=True)
    row = dict(definition=definition, oracle=operation, input=point, forward=xy,
               nativeForward=list(native), forwardTolerance=2e-7)
    if inv:
        row['inverse'] = [float(v) for v in inv]
        row['inverseTolerance'] = 2e-10
        row['nativeInverse'] = list(proj(*xy, inverse=True, errcheck=True))
    rows.append(row)


for shape in ['+ellps=WGS84', '+R=6371000']:
    for origin in [-90,-45,0,45,90]:
        definition = f'+proj=laea +lat_0={origin} +lon_0=15 +x_0=100 +y_0=200 {shape}'
        for lat in [-90,-89.999999,-89.9999,-45,45,89.9999,89.999999,90]:
            if abs(origin)==90 and lat == -origin:
                continue
            add(definition,[30,lat], abs(origin)!=90 or lat*origin>0)
    for origin in [-45,45]:
        definition = f'+proj=stere +lat_0={origin} +lon_0=15 +x_0=100 +y_0=200 {shape}'
        for lat in [-89.999999,-89.9999,89.9999,89.999999]:
            add(definition,[30,lat])
for origin in [-45,45]:
    for lat in [-89.999999,-89.9999,89.9999,89.999999]:
        add(f'+proj=aeqd +lat_0={origin} +lon_0=15 +x_0=100 +y_0=200 +R=6371000',[30,lat])

for shape in ['+ellps=WGS84', '+R=6371000']:
    for lat in [-90,-89.99999999,-89.999999,-89.9999,-80,0,80,89.9999,89.999999,89.99999999,90]:
        add(f'+proj=moll +lon_0=10 {shape}',[30,lat],abs(lat)!=90)

for lon in [-179,-120,10,100,179]:
    for lat in [-80,-45,0,45,80]:
        add('+proj=moll +lon_0=10 +x_0=0 +y_0=0 +datum=none',[lon,lat])

native_composition = []
for parameters_text in ['+o_lat_p=45 +o_lon_p=-90','+o_lat_p=0 +o_lon_p=0','+o_alpha=30 +o_lon_c=10 +o_lat_c=40','+o_lon_1=10 +o_lat_1=20 +o_lon_2=40 +o_lat_2=50']:
    definition = '+proj=ob_tran +o_proj=moll '+parameters_text+' +lon_0=12 +datum=none'
    transformer = pyproj.Transformer.from_pipeline('+proj=pipeline +step +proj=unitconvert +xy_in=deg +xy_out=rad +step '+native_definition(definition))
    for point in [[20,30],[-40,-20],[80,60]]:
        native_composition.append(dict(definition=definition,oracle=native_definition(definition),input=point,forward=list(transformer.transform(*point,errcheck=True))))

native_source = root/'native-proj-cases.json'
for case in json.loads(native_source.read_text())['cases']:
    if case['definition'].startswith('+proj=moll '):
        for point in case['points']:
            add(case['definition'],point)

for origin in [-90,90]:
    definition=f'+proj=qsc +lat_0={origin} +ellps=WGS84'
    for lat in [origin,mp.sign(origin)*D('89.999999'),mp.sign(origin)*D('89.9999'),mp.sign(origin)*D(89)]:
        add(definition,[20,float(lat)])

for lat in [-89.999999,-89.9999,89.9999,89.999999]:
    add('+proj=sterea +lat_0=52 +lon_0=5 +k_0=0.9999 +x_0=155000 +y_0=463000 +ellps=WGS84',[30,lat])

# Independently invert the exact PROJ binary64 audit inputs for spherical AEQD.
audit=json.loads((root/'pole-audit-reference.json').read_text())
for case in audit['cases']:
    if case['id'] not in ['aeqd-45-sphere','aeqd--45-sphere']:
        continue
    for row in case['results']:
        if abs(row['input'][1])==90 and row.get('forward'):
            inv=inverse(case['definition'],row['forward'])
            rows.append(dict(definition=case['definition'],input=row['input'],forward=row['forward'],
                             inverse=[float(v) for v in inv],inverseTolerance=2e-10,forwardTolerance=2e-7,
                             nativeInverse=row['inverse'],inverseOnly=True))
# Re-evaluate the exact original audit findings, preserving their binary64 inverse inputs.
review_path = root/'pole-audit-review.json'
review = json.loads(review_path.read_text())
for case in review['cases']:
    if case['algorithm'] not in ['laea','stere','sterea','aeqd']:
        continue
    native_case = next(c for c in audit['cases'] if c['id']==case['id'])
    for finding in case['originalFindings']:
        if finding['kind']!='numeric difference':
            continue
        if finding['direction']=='forward':
            add(case['definition'],finding['input'],False)
        else:
            tokens = parameters(case['definition'])[0]
            # The opposite-pole equal-area disk boundary has unbounded inverse
            # conditioning. It is documented separately, not granted this gate.
            if case['algorithm']=='laea' and abs(float(tokens['lat_0']))==90:
                continue
            native_row = next(r for r in native_case['results'] if r['input']==finding['input'])
            inv = inverse(case['definition'],native_row['forward'])
            if inv is None:
                raise ValueError('Unexpected high-precision inverse rejection')
            rows.append(dict(definition=case['definition'],input=finding['input'],forward=native_row['forward'],
                             inverse=[float(v) for v in inv],inverseTolerance=2e-10,
                             nativeInverse=native_row['inverse'],inverseOnly=True))

result=dict(nativeCompositionControls=native_composition,nativeSourceSHA256=hashlib.sha256(native_source.read_bytes()).hexdigest(),reviewSHA256=hashlib.sha256(review_path.read_bytes()).hexdigest(), precision=80,mpmath='1.3.0',native='pyproj 3.7.2 / PROJ 9.5.1',
            generatorSHA256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),cases=rows)
metadata = {k:v for k,v in result.items() if k!='cases'}
text = json.dumps(metadata,indent=2)[:-2]+',\n  \"cases\": [\n'
text += ',\n'.join('    '+json.dumps(row,separators=(',',':')) for row in rows)
text += '\n  ]\n}\n'
(root/'pole-precision-reference.json').write_text(text)
print(len(rows),'high-precision cases')
