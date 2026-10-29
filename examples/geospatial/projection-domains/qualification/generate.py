# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
"""Run with pyproj 3.6.1 / PROJ 9.3.0, offline; no Python dependency ships."""
import json, math, hashlib
from pathlib import Path
import pyproj
assert pyproj.__version__ == '3.6.1' and pyproj.proj_version_str == '9.3.0'
pyproj.network.set_network_enabled(False)
root = Path(__file__).parent
cases = []
def add(name, authority, definition, bounds, angle=0, center=(0, 0)):
    w, s, e, n = bounds
    c, t = math.cos(angle), math.sin(angle)
    affine = [c*w-t*s+center[0], c*(e-w)/256, -t*(n-s)/256,
              t*w+c*s+center[1], t*(e-w)/256, c*(n-s)/256]
    transform = pyproj.Transformer.from_crs(authority, 'EPSG:4326', always_xy=True)
    points = []
    for x, y in [(0,0),(256,0),(256,256),(0,256),(128,128),(0,64),(256,64),(0,192),(256,192),(64,32),(192,224)]:
        xy = [affine[0]+x*affine[1]+y*affine[2], affine[3]+x*affine[4]+y*affine[5]]
        points.append(dict(pixel=[x,y], coordinate=xy, geographic=list(transform.transform(*xy, errcheck=True))))
    cases.append(dict(id=name,authority=authority,definition=definition,width=256,height=256,affine=affine,points=points))
polar='+proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 +datum=WGS84 +units=m'
utm='+proj=utm +zone=60 +datum=WGS84 +units=m'
add('antarctica','EPSG:3031',polar,[-4000000,-4000000,4000000,4000000])
add('rotated-antarctica','EPSG:3031',polar,[-4000000,-4000000,4000000,4000000],.4)
add('arctic','EPSG:3413','+proj=stere +lat_0=90 +lat_ts=70 +lon_0=-45 +datum=WGS84 +units=m',[-2000000,-2000000,2000000,2000000])
add('pacific-mercator','EPSG:3832','+proj=merc +lon_0=150 +datum=WGS84 +units=m',[-25000000,-2000000,-15000000,2000000])
add('utm60-left','EPSG:32660',utm,[400000,0,650000,1000000])
add('utm60-right','EPSG:32660',utm,[650000,0,900000,1000000])
add('fiji','EPSG:4326','WGS84',[-35,-20,35,20],math.pi/6,(180,-15))
image = root / '../../../earth/sun-terminator/assets/day.jpg'
result = dict(schemaVersion=1,oracle=dict(pyproj='3.6.1',proj='9.3.0',alwaysXY=True,network=False),
              cases=cases,adjacency=[dict(left='utm60-left',right='utm60-right',leftX=256,rightX=0,y=[0,64,192,256])],
              raster=dict(path='../../../earth/sun-terminator/assets/day.jpg',sha256=hashlib.sha256(image.read_bytes()).hexdigest(),
                          width=2048,height=1024,definition='EPSG:4326',affine=[-180,360/2048,0,90,0,-180/1024],
                          credit='NASA Earth Observatory / GIBS/ESDIS',provenance='../../../earth/sun-terminator/assets/README.md'))
(root / 'corpus.json').write_text(json.dumps(result,indent=2)+'\n')
