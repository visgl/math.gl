# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
"""Independent forward fixtures from the pinned published text, stdlib only.

Uses the reference format's latitude/longitude ordering and bilinear weights.
Run from the repository root. Does not import math.gl or generated datasets.
"""
import json
import math
import re
from pathlib import Path

root = Path('modules/geospatial/test/discontinuous/fixtures/elastic')
output = []
for roman in ['I', 'II', 'III']:
    lines = (root / ('elastic-' + roman + '.txt')).read_text().splitlines()
    cursor = 1
    sections = []
    while lines[cursor].startswith('section '):
        name = lines[cursor][8:-1]
        cursor += 1
        count = int(re.search(r'\d+', lines[cursor]).group())
        cursor += 1
        ring = [tuple(map(float, line.split(','))) for line in lines[cursor:cursor+count]]
        cursor += count
        rows, cols = map(int, re.search(r'(\d+)x(\d+)', lines[cursor]).groups())
        cursor += 1
        table = [list(map(float, line.split(','))) for line in lines[cursor:cursor+rows]]
        cursor += rows
        area = sum(a[1]*b[0] - a[0]*b[1] for a,b in zip(ring, ring[1:]))
        sections.append((name, ring, area, rows, cols, table))
    for lat in [-73, -41, -7, 23, 59, 83]:
        for lon in [-169, -113, -53, 13, 71, 137, 179]:
            for name, ring, area, rows, cols, table in sections:
                inside = False
                for (ay,ax),(by,bx) in zip(ring,ring[1:]):
                    if (ay > lat) != (by > lat) and lon < ax + (lat-ay)*(bx-ax)/(by-ay):
                        inside = not inside
                if inside != (area > 0):
                    continue
                row = (lat+90)*(rows-1)/180
                col = (lon+180)*(cols-1)/360
                i,j = int(row),int(col)
                v,u = row-i,col-j
                result = [sum(table[i+dy][2*(j+dx)+axis]*weight for dy,dx,weight in
                    [(0,0,(1-u)*(1-v)),(0,1,u*(1-v)),(1,0,(1-u)*v),(1,1,u*v)]) for axis in [0,1]]
                assert all(math.isfinite(x) for x in result)
                output.append({'preset':roman,'section':name,'source':[lon,lat],'kilometers':result})
                break
(root/'reference.json').write_text(json.dumps(output,indent=2)+'\n')
print('Wrote',len(output),'independent forward fixtures')
