#!/usr/bin/env python3
# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
# SPDX-FileComment: Original deterministic P0 controls and offline GeographicLib C++ API compilation; no upstream fixtures copied.
"""Generate bounded-profile P0 controls. Native C++ is offline only.
--archive GeographicLib r2.7 tar.gz builds a temporary comparator (no installation).
--oracle uses an already compiled driver. --verify-fixture needs only stdlib Python.
"""
import argparse
import concurrent.futures
from decimal import Decimal as D, localcontext
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import subprocess
import tarfile
import tempfile

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
DEST = HERE.parent / 'test/fixtures/ellipsoid-p0-reference.json'
ARCHIVE_SHA = '5aaca14cd75f13aa2690273d76e88e8ddf4aeb267d6be2c3e0ba948deb9ceea5'
spec = importlib.util.spec_from_file_location('independent', HERE / 'generate-interior-reference.py')
independent = importlib.util.module_from_spec(spec)
spec.loader.exec_module(independent)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def surface_cases():
    rows = []
    with localcontext() as ctx:
        ctx.prec = 180
        shapes = [[1., 1., 1.], [1., 1., .9966471893352525], [1., 1., 1e-6],
                  [1., 1., 1e6], [3., 2., 1.], [1., 1e-3, 1e-6]]
        for axes in shapes:
            for scale in [1e-60, 1., 6378137., 1e60]:
                radii = [float(r * scale) for r in axes]
                ds = [D.from_float(r) for r in radii]
                for depth in [-4., -1., 0., .9, 1. - 2. ** -45]:
                    for normal in [[.36, .48, .8], [-1e-12, .6, -.8]]:
                        ns = [D.from_float(n) for n in normal]
                        support = sum((r * n) ** 2 for r, n in zip(ds, ns)).sqrt()
                        lam = -min(r * r for r in ds) * D.from_float(depth)
                        xyz = [float((r * r + lam) * n / support) for r, n in zip(ds, ns)]
                        reference = independent.nearest(radii, xyz, iterations=600)
                        for permutation in [(0, 1, 2), (2, 0, 1), (1, 2, 0)]:
                            ref = dict(reference)
                            for key in ['footpoint', 'normal']:
                                ref[key] = [reference[key][i] for i in permutation]
                            rows.append(dict(radii=[radii[i] for i in permutation],
                                             xyz=[xyz[i] for i in permutation], reference=ref))
        anchors=json.loads((HERE.parent/'test/fixtures/spheroid-anchor-inputs.json').read_text())
        for anchor in anchors:
            radii=[anchor['a'],anchor['a'],anchor['b']]
            rows.append(dict(radii=radii,xyz=anchor['xyz'],anchor=anchor,
                             reference=independent.nearest(radii,anchor['xyz'],iterations=600)))
    return rows


def forward_decimal(radii, point, radians=False, triaxial=False):
    # Machin's identity and Taylor series are independent of native/libm trig.
    with localcontext() as ctx:
        ctx.prec = 180
        def atan(x):
            total = x
            term = x
            for k in range(1, 500):
                term *= -x*x
                delta = term / (2*k+1)
                total += delta
                if abs(delta) < D('1e-175'): break
            return total
        pi = 16*atan(D(1)/5)-4*atan(D(1)/239)
        def sincos(degrees):
            x = D.from_float(degrees) if radians else D.from_float(degrees) * pi / 180
            sin, cos, ts, tc = x, D(1), x, D(1)
            for k in range(1, 500):
                ts *= -x*x / ((2*k)*(2*k+1))
                tc *= -x*x / ((2*k-1)*(2*k))
                sin += ts
                cos += tc
                if max(abs(ts),abs(tc)) < D('1e-175'): break
            return sin, cos
        sl,cl = sincos(point[0]); sp,cp = sincos(point[1])
        if radians and abs(point[1]) == math.pi/2:
            sp,cp = D(1 if point[1]>0 else -1),D(0)
        n = [cp*cl,cp*sl,sp]
        a,b = [D.from_float(v) for v in radii[:2]]
        axes = [D.from_float(v) for v in radii] if triaxial else [a,a,b]
        support = sum((r*v)**2 for r,v in zip(axes,n)).sqrt()
        h = D.from_float(point[2])
        return [float(r*r*v/support+h*v) for r,v in zip(axes,n)]


def cpp_cases(surfaces):
    rows = []
    old = json.loads((HERE.parents[1] / 'test/ellipsoid/geodesic-qualification.json').read_text())
    for backend in ['S', 'E']:
        for oldrow in old['cases']:
            a, b = oldrow['axes']
            rows.append(dict(mode=oldrow['mode'], backend=backend, radii=[a, b, b], input=oldrow['input']))
        for a in [1e-60, 1., 1e60]:
            for f in [-.019, 0., .019]:
                for mode in ['D', 'A', 'U', 'V']:
                    for value in [-1440., -1e-10, 0., 1e-10, 1440.]:
                        v = value if mode in ['A', 'V'] else value * math.pi / 180 * a
                        rows.append(dict(mode=mode, backend=backend, radii=[a, a*(1-f), a*(1-f)],
                                         input=[89.999999, 179., -130., v]))
    for backend in ['S','E']:
        for f in [-.019,.019]:
            rows.append(dict(mode='U',backend=backend,radii=[6378137.,6378137.*(1-f),6378137.*(1-f)],input=[89.999999,179.,-130.,1440.*6378137.],profile='many-circuits'))
    for a, b in [(6378137., 6356752.314245179), (1., 1.), (1., .5), (1., 1e-6),
                 (1e-60, .5e-60), (1e60, .5e60)]:
        for lon, lat in [(0., 0.), (180., 45.), (-180., -45.), (73., 90.),
                         (-73., -90.), (179.999999, 89.999999), (12., -1e-12)]:
            for h in [-.1*a, 0., 4*a]:
                rows.append(dict(mode='F', backend='C', radii=[a,b,b], input=[lon,lat,h],mathematicalXYZ=forward_decimal([a,b],[lon,lat,h]),
                                 mathematicalRadiansXYZ=forward_decimal([a,b],[lon*(math.pi/180),lat*(math.pi/180),h],radians=True)))
                # LocalCartesian exposes the supplied origin's meridian at a pole.
                rows.append(dict(mode='L', backend='C', radii=[a,b,b],
                                 input=[lon,lat,h,lon+.001,max(-90.,min(90.,lat+.001)),h+.001*a]))
        for xyz in [[a*.2,a*.3,b*.4], [a,0.,1e-12*b], [0.,0.,b], [2*a,-3*a,4*b]]:
            with localcontext() as ctx:
                ctx.prec=180
                mathematical=independent.nearest([a,a,b],xyz,iterations=600)
            rows.append(dict(mode='R',backend='C',radii=[a,b,b],input=xyz,mathematicalInverse=mathematical))
    for a,b in [(6378137.,6356752.314245179),(2.,2.),(2.,1.98),(2.,2.02)]:
        for lat in [0.,40.,89.]:
            for lon in [-45.,0.,45.]:
                rows.append(dict(mode='G',backend='C',radii=[a,b,b],input=[10.,lat,10.+lon,lat*.7]))
            for x,y in [(0.,0.),(.1*a,-.2*a),(a,2*a),(10*a,-5*a)]:
                rows.append(dict(mode='H',backend='C',radii=[a,b,b],input=[10.,lat,x,y]))
    for shape in [[3.,2.,1.],[1.,1e-3,1e-6]]:
        for scale in [1e-60,1.,1e60]:
            radii=[v*scale for v in shape]
            for lon,lat in [(0.,0.),(-40.,35.),(70.,-55.),(179.999999,89.999999),(-120.,90.),(90.,-90.)]:
                for height in [-.1*max(radii),0.,4*max(radii)]:
                    point=[lon,lat,height]
                    rows.append(dict(mode='Q',backend='C',radii=radii,input=point,
                                     mathematicalXYZ=forward_decimal(radii,point,triaxial=True)))
    # Ordered distinct radii are the C++ Cartesian3 parameter contract. Axis
    # permutations and equal-axis limits are additionally gated by Decimal.
    for i, row in enumerate(surfaces):
        a,b,c = row['radii']
        if a>b>c:
            rows.append(dict(mode='T',backend='C',radii=[a,b,c],input=row['xyz'],surfaceIndex=i))
    return rows


def build(archive, temporary):
    assert digest(archive) == ARCHIVE_SHA, 'Unpinned GeographicLib archive'
    with tarfile.open(str(archive)) as tar:
        for member in tar.getmembers():
            assert not member.name.startswith('/') and '..' not in Path(member.name).parts
            assert member.isfile() or member.isdir(), 'Archive links are not needed'
        tar.extractall(str(temporary))
    source = temporary / 'geographiclib-r2.7'
    include = temporary / 'include/GeographicLib'
    include.mkdir(parents=True)
    (include/'Config.h').write_text('''#define GEOGRAPHICLIB_VERSION_STRING "2.7"
#define GEOGRAPHICLIB_VERSION_MAJOR 2
#define GEOGRAPHICLIB_VERSION_MINOR 7
#define GEOGRAPHICLIB_VERSION_PATCH 0
#define GEOGRAPHICLIB_DATA ""
#define GEOGRAPHICLIB_HAVE_LONG_DOUBLE 1
#define GEOGRAPHICLIB_WORDS_BIGENDIAN 0
#define GEOGRAPHICLIB_PRECISION 3
#define GEOGRAPHICLIB_SHARED_LIB 0
''')
    names = ['Math','Geodesic','GeodesicLine','GeodesicExact','GeodesicLineExact',
             'EllipticFunction','Geocentric','LocalCartesian','Gnomonic','Angle','AuxAngle',
             'AuxLatitude','DAuxLatitude','Ellipsoid','Cartesian3','Ellipsoid3','Trigfun','DST']
    flags = ['c++','-std=c++17','-O2','-I'+str(include.parent),'-I'+str(source/'include')]
    def compile_one(name):
        obj = temporary/(name+'.o')
        subprocess.run(flags+['-c',str(source/'src'/(name+'.cpp')),'-o',str(obj)],check=True)
        return str(obj)
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        objects = list(pool.map(compile_one,names))
    library = temporary/'libGeographicLib.a'
    subprocess.run(['ar','rcs',str(library)]+objects,check=True)
    oracle = temporary/'oracle'
    subprocess.run(flags+[str(HERE/'geographiclib-p0-oracle.cpp'),str(library),'-o',str(oracle)],check=True)
    return oracle


def generate(oracle):
    surfaces = surface_cases()
    rows = cpp_cases(surfaces)
    lines = [' '.join([row['mode'],row['backend']]+[format(v,'.17g') for v in
              row['radii']+row['input']+[0.]*(6-len(row['input']))]) for row in rows]
    output = subprocess.check_output([str(oracle)],input=('\n'.join(lines)+'\n').encode(),timeout=120).decode().splitlines()
    assert len(output)==len(rows), (len(output),len(rows))
    for row,line in zip(rows,output):
        row['expected']=None if line.startswith('error ') else list(map(float,line.split()))
        if row['expected'] is not None and not all(math.isfinite(v) for v in row['expected']):
            row['expected']=None
        if row['expected'] is None: row['oracleFailure']=line[6:] if line.startswith('error ') else 'Native nonfinite result'
    version, digits = subprocess.check_output([str(oracle),'--metadata']).decode().split()
    assert version=='2.7'
    return dict(provenance=dict(version=version,precisionBits=int(digits),archiveSHA256=ARCHIVE_SHA,
        sourceURL='https://github.com/geographiclib/geographiclib/tree/r2.7',
        compiler=subprocess.check_output(['c++','--version']).decode().splitlines()[0],
        compilerFlags='-std=c++17 -O2; GEOGRAPHICLIB_PRECISION=3; actual significand bits recorded',
        driverSHA256=digest(HERE/'geographiclib-p0-oracle.cpp'),generatorSHA256=digest(Path(__file__)),
        decimalOracleSHA256=digest(HERE/'generate-interior-reference.py'),
        anchorInputSHA256=digest(HERE.parent/'test/fixtures/spheroid-anchor-inputs.json'),
        anchorGeneratorSHA256=digest(HERE/'generate-spheroid-anchor-inputs.mjs'),
        method='Original inputs; C++ series and elliptic-integral Exact; independent exact-binary64-input Decimal 180 digits/600 bisections.',
        license='MIT',scope='Bounded P0 support profile; no universal finite-input claim.'),
        surfaces=surfaces,cpp=rows)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--oracle',type=Path)
    parser.add_argument('--archive',type=Path)
    parser.add_argument('--verify-fixture',action='store_true')
    parser.add_argument('--check',action='store_true')
    args=parser.parse_args()
    if not args.verify_fixture and not (args.oracle or args.archive):
        parser.error('Supply --archive or --oracle for offline generation, or --verify-fixture for CI')
    if args.verify_fixture:
        fixture=json.loads(DEST.read_text()); provenance=fixture['provenance']
        assert provenance['driverSHA256']==digest(HERE/'geographiclib-p0-oracle.cpp')
        assert provenance['generatorSHA256']==digest(Path(__file__))
        assert provenance['decimalOracleSHA256']==digest(HERE/'generate-interior-reference.py')
        assert provenance['anchorInputSHA256']==digest(HERE.parent/'test/fixtures/spheroid-anchor-inputs.json')
        assert provenance['anchorGeneratorSHA256']==digest(HERE/'generate-spheroid-anchor-inputs.mjs')
        assert provenance['archiveSHA256']==ARCHIVE_SHA and provenance['version']=='2.7'
        assert fixture['surfaces']==surface_cases(), 'Independent Decimal references differ'
        assert [{k:v for k,v in r.items() if k not in ['expected','oracleFailure']} for r in fixture['cpp']]==cpp_cases(fixture['surfaces'])
        print('P0 fixture provenance, workload and independent Decimal controls verified')
    else:
        with tempfile.TemporaryDirectory(prefix='mathgl-cpp-p0-') as temporary:
            oracle=args.oracle or build(args.archive,Path(temporary))
            report=generate(oracle)
        header=json.dumps({'provenance':report['provenance']},indent=2)[:-2]
        text=header+',\n  \"surfaces\": [\n'+',\n'.join('    '+json.dumps(row,separators=(',',':'),allow_nan=False) for row in report['surfaces'])+'\n  ],\n  \"cpp\": [\n'+',\n'.join('    '+json.dumps(row,separators=(',',':'),allow_nan=False) for row in report['cpp'])+'\n  ]\n}\n'
        if args.check:
            assert json.loads(DEST.read_text())==report, 'Regenerate P0 references with the recorded comparator'
        else:
            DEST.write_text(text)
        print('P0 controls:',len(report['surfaces']),'Decimal,',len(report['cpp']),'C++')
