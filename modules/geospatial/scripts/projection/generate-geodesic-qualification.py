#!/usr/bin/env python3
# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
# SPDX-FileComment: Original deterministic controls and native PROJ C oracle driver; no upstream test data copied.
"""Compile pinned PROJ 9.9.0 sources supplied offline; no package/test dependency.
Usage: python3 generate-geodesic-qualification.py --source-dir /path/to/PROJ/src [--check]
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import random
import subprocess
import tempfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source-dir', type=Path, required=True)
parser.add_argument('--check', action='store_true')
args = parser.parse_args()
pins = {
    'geodesic.c': '87a91e0e30e7db839cbd1ef5aafea77487524958070565ff9155e50e9bead550',
    'geodesic.h': 'a964a747bc4f388fb3a93cc9bc379aebe4cdd78b3ee909c071be711b82db4b10',
}
for name, digest in pins.items():
    assert hashlib.sha256((args.source_dir / name).read_bytes()).hexdigest() == digest, name
# The wrapper calls the native API directly and prints every requested field at
# binary64 roundtrip precision. It does not use math.gl or the JavaScript solver.
driver = r'''
#include "geodesic.h"
#include <stdio.h>
int main(void) {
  char mode; double a,b,p,q,r,s;
  while (scanf(" %c %lf %lf %lf %lf %lf %lf", &mode,&a,&b,&p,&q,&r,&s)==7) {
    struct geod_geodesic g;
    double lat2,lon2,azi1,azi2,distance,m12,M12,M21,area,arc;
    geod_init(&g,a,(a-b)/a);
    if (mode=='I') {
      lat2=r; lon2=s;
      arc=geod_geninverse(&g,p,q,r,s,&distance,&azi1,&azi2,&m12,&M12,&M21,&area);
    } else {
      azi1=r;
      arc=geod_gendirect(&g,p,q,r,GEOD_NOFLAGS,s,&lat2,&lon2,&azi2,&distance,&m12,&M12,&M21,&area);
    }
    printf("%.17g %.17g %.17g %.17g %.17g %.17g %.17g %.17g %.17g %.17g\n",
      lat2,lon2,azi1,azi2,distance,m12,M12,M21,arc,area);
  }
  return 0;
}
'''
controls = []
axes = [(6378137,6356752.314245179), (6378137,6356752.314140356),
        (3396190,3376200), (6371000,6371000), (6378137,6378137*.98),
        (6378137,6378137*1.02), (2,1.995)]
special = [(0,0,0,0), (0,0,0,180), (0,0,1e-12,180-1e-12),
           (90,0,-90,0), (-90,180,90,-180), (89.999999,179,-89.999999,-1),
           (45,180,45,-180), (45,10,45+1e-10,10+1e-10),
           (-30,-180,60,180), (-0.0,-0.0,0.0,180), (40,-75,35,140),
           (0,0,0,1e-12), (1e-12,0,-1e-12,179.5)]
rng = random.Random(270990)
for a,b in axes:
    points = list(special)
    for i in range(64):
        lat,lon = rng.uniform(-90,90),rng.uniform(-180,180)
        points.append((lat,lon,rng.uniform(-90,90),rng.uniform(-180,180)))
        if i < 16:
            points.append((lat,lon,-lat+rng.uniform(-1e-7,1e-7),lon+180+rng.uniform(-1e-7,1e-7)))
    for values in points:
        controls.append(dict(mode='I',axes=[a,b],input=list(values)))
    for distance in [0,1e-12*a, .01*a, a, math.pi*a, 8*math.pi*a, -a, -8*math.pi*a]:
        for lat,lon,azi in [(0,179,90), (89.999999,-179,1), (-90,30,-170)]:
            controls.append(dict(mode='D',axes=[a,b],input=[lat,lon,azi,distance]))
with tempfile.TemporaryDirectory(prefix='mathgl-geodesic-oracle-') as temporary:
    root=Path(temporary); (root/'driver.c').write_text(driver)
    subprocess.run(['cc','-O2','-I',str(args.source_dir),str(root/'driver.c'),
                    str(args.source_dir/'geodesic.c'),'-lm','-o',str(root/'oracle')],check=True)
    lines=[' '.join([row['mode']]+[format(v,'.17g') for v in row['axes']+row['input']]) for row in controls]
    result=subprocess.check_output([str(root/'oracle')],input=('\n'.join(lines)+'\n').encode()).decode().splitlines()
fields=['lat2','lon2','azi1','azi2','s12','m12','M12','M21','a12','S12']
assert len(result)==len(controls)
for row,line in zip(controls,result):
    values=list(map(float,line.split())); assert all(math.isfinite(v) for v in values)
    row['expected']=dict(zip(fields,values))
report=dict(oracle='native PROJ 9.9.0 geodesic.c',sourceURL='https://github.com/OSGeo/PROJ/tree/9.9.0/src',
            sourceSHA256=pins,generatorSHA256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
            seed=270990,cases=controls)
text=json.dumps({k:v for k,v in report.items() if k!='cases'},indent=2)[:-2]+',\n  "cases": [\n'+',\n'.join('    '+json.dumps(row,separators=(',',':')) for row in controls)+'\n  ]\n}\n'
out=Path(__file__).resolve().parents[2]/'test/ellipsoid/geodesic-qualification.json'
if args.check:
    assert out.read_text()==text, 'Regenerate geodesic qualification'
else:
    out.write_text(text)
print(f'{len(controls)} native PROJ 9.9.0 controls verified')
