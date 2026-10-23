#!/usr/bin/env python3
# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
# SPDX-FileComment: Original shortest-path sampling controls from pinned native PROJ, not the JavaScript solver.
"""Offline controls: --source-dir /path/to/PROJ-9.9.0/src [--check]. No network access."""
import argparse
import hashlib
import json
from pathlib import Path
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

driver = r'''
#include "geodesic.h"
#include <stdio.h>
int main(void) {
  double a,b,lon1,lat1,lon2,lat2,t;
  while (scanf("%lf %lf %lf %lf %lf %lf %lf",&a,&b,&lon1,&lat1,&lon2,&lat2,&t)==7) {
    struct geod_geodesic g;
    double distance,azimuth,latitude,longitude;
    geod_init(&g,a,(a-b)/a);
    geod_inverse(&g,lat1,lon1,lat2,lon2,&distance,&azimuth,0);
    geod_gendirect(&g,lat1,lon1,azimuth,GEOD_LONG_UNROLL,t*distance,
                  &latitude,&longitude,0,0,0,0,0,0);
    printf("%.17g %.17g %.17g\n",distance,longitude,latitude);
  }
  return 0;
}
'''
rows = []
points = [
    ([0,0],[60,0]), ([170,20],[-170,40]), ([-170,-20],[170,40]),
    ([0,80],[120,80]), ([179,89.999999],[-179,-30]),
    ([0,0],[179.99999,0.00001]), ([0,0],[180,0]),
    ([-75,40],[140,35]), ([10,40],[10,40]), ([720,10],[750,20]),
    ([0,90],[100,-89.9]), ([20,-90],[-100,89.9]),
]
for axes in [[6378137,6356752.314245179], [6371000,6371000], [6378137,6505699.74]]:
    for start,end in points:
        for fraction in [0.125,0.25,0.5,0.75,0.875]:
            rows.append(dict(axes=axes,start=start,end=end,fraction=fraction))
with tempfile.TemporaryDirectory(prefix='mathgl-path-oracle-') as temporary:
    root=Path(temporary)
    (root/'driver.c').write_text(driver)
    subprocess.run(['cc','-O2','-I',str(args.source_dir),str(root/'driver.c'),
                    str(args.source_dir/'geodesic.c'),'-lm','-o',str(root/'oracle')],check=True)
    inputs=[' '.join(format(v,'.17g') for v in row['axes']+row['start']+row['end']+[row['fraction']]) for row in rows]
    lines=subprocess.check_output([str(root/'oracle')],input=('\n'.join(inputs)+'\n').encode()).decode().splitlines()
assert len(rows)==len(lines)
for row,line in zip(rows,lines):
    distance,longitude,latitude=map(float,line.split())
    row.update(distance=distance,position=[longitude,latitude])
report=dict(oracle='native PROJ 9.9.0 geodesic.c (offline)',
            sourceURL='https://github.com/OSGeo/PROJ/tree/9.9.0/src',sourceSHA256=pins,
            generatorSHA256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),cases=rows)
text=json.dumps({key:value for key,value in report.items() if key!='cases'},indent=2)[:-2]+',\n  \"cases\": [\n'+',\n'.join('    '+json.dumps(row,separators=(',',':')) for row in rows)+'\n  ]\n}\n'
out=Path(__file__).resolve().parents[1]/'test/ellipsoid/geodesic-path-reference.json'
if args.check:
    assert out.read_text()==text, 'Regenerate geodesic path reference'
else:
    out.write_text(text)
print(f'{len(rows)} shortest-path sample controls verified')
