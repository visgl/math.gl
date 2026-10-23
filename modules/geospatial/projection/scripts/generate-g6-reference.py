#!/usr/bin/env python3
# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
"""Original native global-intersection controls and independent 80-digit meridian lattices.
No third-party packages. Native tools run offline only; --check recomputes independent controls.
"""
import argparse,hashlib,importlib.util,json,math,random,subprocess
from decimal import Decimal as D
from pathlib import Path
HERE=Path(__file__).resolve().parent
DEST=HERE.parents[1]/'test/ellipsoid/g6-reference.json'
spec=importlib.util.spec_from_file_location('independent',HERE/'generate-g34-reference.py')
h=importlib.util.module_from_spec(spec);spec.loader.exec_module(h)

def workloads():
 rng=random.Random(606027);rows=[]
 for r in [.99,.9966471893352525,1.,1.01,1-2**-40,1+2**-40]:
  for a in [1.,6378137.]:
   axes=dict(a=a,b=a*r)
   for i in range(4):
    paths=[[rng.uniform(-80,80),rng.uniform(-180,180),rng.uniform(-180,180)] for _ in range(2)]
    rows.append(dict(**axes,mode='A',paths=paths,maxDistance=(4*math.pi*min(1,r) if i==3 else 10)*a,origin=[3*a,-2*a] if i%2 else [0.,0.]))
   for angle in [1e-6,1e-4,.1,45.]:
    rows.append(dict(**axes,mode='A',construction=[-60.,179.,37.,37.+angle,1.6*a,-1.6*a],maxDistance=10*a,origin=[0.,0.]))
   for path in [[0.,0.,90.],[0.,0.,0.],[20.,30.,37.]]:
    for direction in [1,-1]:
     b=path[:];b[2]+=180 if direction<0 else 0
     rows.append(dict(**axes,mode='A',paths=[path,b],maxDistance=10*a,origin=[0.,0.]))
   for direction in [1,-1]:
    rows.append(dict(**axes,mode='A',along=[20.,30.,37.,2.1*a,direction],maxDistance=10*a,origin=[.3*a,-.2*a]))
   for azimuths in [[90.,90.],[0.,180.],[37.,37.],[37.,37.0001],[0.,90.]]:
    rows.append(dict(**axes,mode='N',shared=[0.,0.,*azimuths]))
   for points in [[[0,-20],[0,20],[-20,0],[20,0]],[[0,-20],[0,20],[20,30],[30,30]],[[0,-20],[0,20],[0,0],[0,40]],[[0,-20],[0,20],[0,40],[0,0]]]:
    rows.append(dict(**axes,mode='S',points=points))
 return rows

def independent():
 rows=[]
 for ratio in [.99,.9966471893352525,1.,1.01]:
  r=D.from_float(ratio)
  def M(t):
   s,c=h.sc(t);return r*r/(c*c+r*r*s*s)**D('1.5')
  q=h.integral(M,h.PI/2)
  for a in [1e-6,1.,6378137.]:
   for origin in [[0.,0.],[.3,-.2]]:
    expected=[]
    for i in range(-5,6):
     for j in range(-5,6):
      x=(1+2*i)*q;y=(1+2*j)*q
      if (i-j)%2==0 and abs(x-D.from_float(origin[0]))+abs(y-D.from_float(origin[1]))<=10:
       expected.append([float(x)*a,float(y)*a])
    rows.append(dict(mode='meridians',a=a,b=a*ratio,paths=[[0.,0.,0.],[0.,67.,0.]],maxDistance=10*a,origin=[v*a for v in origin],expected=expected))
   for mode,distance in [('pole-next',4*q),('equator-next',2*h.PI*min(r,D(1)))]:
    rows.append(dict(mode=mode,a=a,b=a*ratio,distance=float(distance)*a))
 return rows

def digest(value):return hashlib.sha256(json.dumps(value,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def provenance():
 return dict(version='2.7',precisionBits=53,archiveSHA256=h.ARCHIVE_SHA,sourceSHA256={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [Path(__file__),HERE/'generate-g34-reference.py',HERE/'geographiclib-g6-oracle.cpp']})
def main():
 p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');p.add_argument('--oracle');p.add_argument('--archive');args=p.parse_args()
 rows=workloads();data=dict(provenance=provenance(),independent=independent())
 if args.check:
  stored=json.loads(DEST.read_text());assert stored['provenance']==data['provenance'];assert stored['independent']==data['independent']
  assert [{k:v for k,v in row.items() if k not in ['expected','pathsGenerated','closest']} for row in stored['native']]==rows
  assert stored['nativeSHA256']==digest(stored['native'])
  print('G6 original workloads, native data digest, provenance and independent 80-digit controls verified');return
 if not args.oracle or not args.archive:p.error('--oracle and --archive required')
 assert hashlib.sha256(Path(args.archive).read_bytes()).hexdigest()==h.ARCHIVE_SHA
 assert subprocess.check_output([args.oracle,'--version'],text=True).strip()=='2.7 53'
 commands=[];generated=[]
 for row in rows:
  if 'construction' in row:commands.append(' '.join(map(str,['B',row['a'],row['b'],*row['construction']])));generated.append(row)
  if 'along' in row:commands.append(' '.join(map(str,['L',row['a'],row['b'],*row['along'][:4]])));generated.append(row)
 lines=subprocess.check_output([args.oracle],input='\n'.join(commands)+'\n',text=True).splitlines();assert len(lines)==len(generated)
 for row,line in zip(generated,lines):
  v=list(map(float,line.split()))
  if 'construction' in row:row['pathsGenerated']=[v[:3],v[3:]]
  else:
   row['pathsGenerated']=[row['along'][:3],v];row['pathsGenerated'][1][2]+=180 if row['along'][4]<0 else 0
 commands=[]
 for row in rows:
  if row['mode']=='A':values=[*sum(row.get('paths',row.get('pathsGenerated')),[]),row['maxDistance'],*row['origin']]
  elif row['mode']=='N':values=row['shared']
  else:values=sum(row['points'],[])
  commands.append(' '.join(map(str,[row['mode'],row['a'],row['b'],*values])))
 lines=subprocess.check_output([args.oracle],input='\n'.join(commands)+'\n',text=True).splitlines();assert len(lines)==len(rows)
 for row,line in zip(rows,lines):
  v=list(map(float,line.split()))
  if row['mode']=='A':
   n=int(v[0]);assert len(v)==1+3*n+3;row['expected']=[v[1+3*i:4+3*i] for i in range(n)];row['closest']=v[-3:]
  else:row['expected']=v
 data['native']=rows;data['nativeSHA256']=digest(rows)
 DEST.write_text(json.dumps(data,indent=2,allow_nan=False)+'\n');print('Wrote',len(rows),'native and',len(data['independent']),'independent global controls')
if __name__=='__main__':main()
