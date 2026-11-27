# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
"""Offline boundary oracle: pyproj 3.6.1 / PROJ 9.3.0."""
import json, math
from pathlib import Path
import pyproj
assert pyproj.__version__ == '3.6.1' and pyproj.proj_version_str == '9.3.0'
pyproj.network.set_network_enabled(False)
cases=[]
for center,height,tilt,azimuth in [([37,-90],.25,-15,70),([-100,90],1,20,-40),([20,-40],3,45,120)]:
    lon,lat=map(math.radians,center)
    definition=f'+proj=tpers +lat_0={center[1]} +lon_0={center[0]} +R=1 +h={height} +tilt={tilt} +azi={azimuth}'
    project=pyproj.Proj(definition)
    origin=[math.cos(lat)*math.cos(lon),math.cos(lat)*math.sin(lon),math.sin(lat)]
    north=[-math.sin(lat)*math.cos(lon),-math.sin(lat)*math.sin(lon),math.cos(lat)]
    east=[-math.sin(lon),math.cos(lon),0]
    radius=math.acos(1/(1+height))-1e-7
    points=[]
    for degrees in range(0,360,3):
        angle=math.radians(degrees)
        xyz=[origin[i]*math.cos(radius)+(north[i]*math.cos(angle)+east[i]*math.sin(angle))*math.sin(radius) for i in range(3)]
        geographic=[math.degrees(math.atan2(xyz[1],xyz[0])),math.degrees(math.atan2(xyz[2],math.hypot(*xyz[:2])))]
        points.append(dict(geographic=geographic,target=list(project(*geographic,errcheck=True))))
    cases.append(dict(center=center,height=height,tilt=tilt,azimuth=azimuth,points=points))
Path(__file__).with_name('horizons.json').write_text(json.dumps(dict(oracle='pyproj 3.6.1 / PROJ 9.3.0; offline',cases=cases),indent=2)+'\n')
