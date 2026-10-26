#!/usr/bin/env python3
# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
# SPDX-FileComment: Original coordinate utility inputs and pinned native GeographicLib 2.7 controls.
import argparse, hashlib, json, math, subprocess
from pathlib import Path
HERE=Path(__file__).resolve().parent;DEST=HERE.parent/'test/utilities-reference.json'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def inputs():
 rows=[]
 latitudes=[-90,-89,-84,-80.000001,-80,-72,-64,-56,-.000001,-0.,0.,8,56,63.999999,64,71.999999,72,79.999999,80,83.999999,84,89,90]
 longitudes=[-180,-177,-90,-.000001,0,2.999999,3,6,9,12,20,21,33,42,90,179.999999,180]
 for lat in latitudes:
  for lon in longitudes:rows.append(dict(mode='G',latitude=lat,longitude=lon,precision=len(rows)%6))
 for lat,lon in [(48.8582,2.2945),(90,0),(-90,0),(-0.,3),(60,6),(78,20)]:
  for precision in range(6):rows.append(dict(mode='G',latitude=lat,longitude=lon,precision=precision))
 seed=3291
 def random():
  nonlocal seed
  seed=(1664525*seed+1013904223)&0xffffffff
  return seed/4294967296
 for _ in range(100):rows.append(dict(mode='G',latitude=180*random()-90,longitude=360*random()-180,precision=len(rows)%6))
 for latitude in range(-72,85,8):
  if latitude:
   for direction in [-math.inf,math.inf]:rows.append(dict(mode='G',latitude=math.nextafter(float(latitude),direction),longitude=3.,precision=5))
 for longitude in range(-174,180,6):
  for direction in [-math.inf,math.inf]:rows.append(dict(mode='G',latitude=30.,longitude=(math.copysign(1e-15,direction) if longitude==0 else math.nextafter(float(longitude),direction)),precision=5))
 for text in ['0','-0','12.5','-12.5','12:30','12:30:40N','12:30.5W',"N12d30'40\"","180d0'0\"E","90d0'0\"S",'0S','0W','89:59:59.999999','179:59:59.999999E']:
  rows.append(dict(mode='D',text=text))
 for text in ['31UDQ4825111932','ZAH0000000000','BAN0000000000','31MEV0000099999','00NAA','61NAA','31ZAA','31UAA','31UDQ1','31UDQ123456789012','YAA','ZZA','AAA','BAA','31NAA','32XAA','31VAA','31XAA']:
  rows.append(dict(mode='R',text=text))
 for latitude,longitude in [(48.8582,2.2945),(-33.86,151.21),(85,40),(-85,-40)]:
  for precision in range(6,12):rows.append(dict(mode='G',latitude=latitude,longitude=longitude,precision=precision))
 for latitude,longitude,zone in [(0,3,31),(-0.,3,31),(-1,3,31),(1,3,31),(60,6,31),(60,6,32),(78,20,33),(78,20,35),(83.9,3,0),(84,3,31),(-79.9,3,0),(-80.1,3,31),(45,179,1),(45,-179,60),(40,30,1),(0,0,0),(90,3,31)]:
  for north in [-1,0,1]:rows.append(dict(mode='F',latitude=latitude,longitude=longitude,zone=zone,north=north))
 for grid,target,north in [([31,1,500000,0],31,0),([31,0,500000,1e7],31,1),([31,1,500000,-110530],31,0),([31,1,500000,6651411],32,1),([0,1,2e6,2e6],0,0),([31,1,500000,9500000],0,1)]:
  rows.append(dict(mode='T',grid=grid,zone=target,north=north))
 for text in ['31U','01N','60M','Y','Z','A','B','32X','00N','61U','31Z','N','ZAH']:
  # Z mode only supplies native zone/hemisphere; our descriptor parser also requires a zone-only input.
  if text!='ZAH':rows.append(dict(mode='Z',text=text))
 for text in ["30'",'30"',"-30'",'30:15.5',"12d30.5'",'W30"']:
  rows.append(dict(mode='D',text=text))
 for latitude,longitude,zone in [(60,6,31),(60,6,32),(78,20,33),(78,20,35),(84,3,31),(83.9,3,0),(-80.1,3,31),(-79.9,3,0)]:
  for precision in range(6):rows.append(dict(mode='H',latitude=latitude,longitude=longitude,zone=zone,precision=precision))
 for zone in [1,31,60]:
  for north in [0,1]:
   for x in [0,100000,500000,900000,1000000]:
    for y in ([-9100000,0,9500000,9600000] if north else [900000,1000000,10000000,19600000]):
     rows.append(dict(mode='V',grid=[zone,north,x,y]))
 for north in [0,1]:
  for x in ([1200000,2000000,2800000] if north else [700000,2000000,3300000]):
   for y in ([1200000,2000000,2800000] if north else [700000,2000000,3300000]):
    rows.append(dict(mode='V',grid=[0,north,x,y]))
 return rows
def request(r):
 if r['mode']=='H':return 'H '+' '.join(str(r[k]) for k in ['latitude','longitude','zone','precision'])+'\n'
 if r['mode']=='V':return 'V '+' '.join(map(str,r['grid']))+'\n'
 if r['mode']=='F':return 'F '+format(r['latitude'],'.17g')+' '+format(r['longitude'],'.17g')+' '+str(r['zone'])+' '+str(r['north'])+'\n'
 if r['mode']=='T':return 'T '+' '.join(map(str,r['grid']))+' '+str(r['zone'])+' '+str(r['north'])+'\n'
 if r['mode']=='G':return 'G '+format(r['latitude'],'.17g')+' '+format(r['longitude'],'.17g')+' '+str(r['precision'])+'\n'
 return r['mode']+' '+r['text']+'\n'
def main():
 p=argparse.ArgumentParser();p.add_argument('--native',type=Path);p.add_argument('--check',action='store_true');a=p.parse_args()
 provenance=dict(version='2.7',precisionBits=53,archiveSHA256='5aaca14cd75f13aa2690273d76e88e8ddf4aeb267d6be2c3e0ba948deb9ceea5',generatorSHA256=sha(Path(__file__)),driverSHA256=sha(HERE/'geographiclib-utilities-reference.cpp'),builderSHA256=sha(HERE/'build-utilities-native.py'))
 rows=inputs()
 if a.check:
  stored=json.loads(DEST.read_text());assert stored['provenance']==provenance;assert [{k:v for k,v in r.items() if k!='expected'} for r in stored['rows']]==rows
 else:
  if not a.native:p.error('--native required')
  meta=json.loads(subprocess.check_output([str(a.native),'--metadata'],text=True))
  for key in ['version','precisionBits','driverSHA256']:assert meta[key]==provenance[key]
  lines=subprocess.check_output([str(a.native)],input=''.join(map(request,rows)),text=True).splitlines();assert len(lines)==len(rows)
  for row,line in zip(rows,lines):
   if line=='ERROR':row['expected']=None;continue
   values=line.split();row['expected']=[value if (row['mode']=='G' and i==4) or row['mode']=='H' else float(value) for i,value in enumerate(values)]
  DEST.write_text(json.dumps(dict(provenance=provenance,rows=rows),separators=(',',':'),allow_nan=False)+'\n')
 print('Native coordinate controls:',len(rows))
if __name__=='__main__':main()
