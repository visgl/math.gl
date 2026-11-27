#!/usr/bin/env python3
# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
# SPDX-FileComment: Original G8/G9 inputs and stored pinned native API controls, not copied upstream fixtures.
import argparse
import hashlib
import json
import math
from pathlib import Path
import subprocess
ROOT=Path(__file__).resolve().parents[3]
HERE=Path(__file__).resolve().parent
DEST=ROOT/'modules/geospatial/test/g89-reference.json'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def inputs():
 rows=[]
 seed=73421
 def random():
  nonlocal seed
  seed=(1664525*seed+1013904223)&0xffffffff
  return seed/4294967296
 direct=[[30.,20.,40.,1.],[0.,0.,90.,1.],[80.,170.,-35.,.8],[-45.,-170.,125.,-1.2],[90.,0.,35.,.7],[-90.,0.,-65.,.7],[0.,20.,0.,3.],[12.,35.,179.999999,2.],[-33.,141.,-89.999999,.01],[45.,-75.,20.,1e-9]]
 arcs=[[30.,20.,40.,120.],[-40.,-170.,-20.,-240.],[0.,0.,90.,360.],[80.,45.,0.,540.],[90.,10.,35.,30.]]
 inverse=[[0.,0.,0.,180.],[20.,0.,-20.,180.],[90.,20.,-90.,150.],[0.,179.999,0.,-179.999],[30.,20.,-20.,150.],[0.,0.,0.,120.],[80.,170.,-40.,-120.],[-45.,-170.,20.,170.],[90.,0.,-30.,120.],[-90.,20.,30.,-70.],[0.,0.,.00001,179.999],[20.,0.,-20.00001,179.99],[45.,30.,45.,30.],[20.,30.,20.00000001,30.00000001]]
 for ratio in [.25,.5,.8,1.,1.25,2.,4.]:
  for scale in [1e-60,1.,6378137.,1e60/4]:
   axes=[scale/ratio,scale] if ratio<1 else [scale,ratio*scale]
   for mode,cases in [('D',direct),('A',arcs),('I',inverse)]:
    for p in cases:
     value=p[:]
     if mode=='D':value[3]*=min(axes)
     rows.append(dict(mode=mode,radii=[*axes,axes[1]],system=0,input=value))
   rows.append(dict(mode='S',radii=[*axes,axes[1]],system=0,input=[0.,0.,0.,0.]))
   if scale==1.:
    for _ in range(20):
     rows.append(dict(mode='I',radii=[*axes,axes[1]],system=0,input=[178*random()-89,360*random()-180,178*random()-89,360*random()-180]))
     rows.append(dict(mode='D',radii=[*axes,axes[1]],system=0,input=[178*random()-89,360*random()-180,360*random()-180,(4*random()-2)*math.pi*min(axes)]))
 shapes=[[1.,1.,1.],[3.,3.,1.],[3.,1.,1.],[3.,2.,1.],[4.,2.,1.],[1.,.999999,.999998]]
 places=[[30.,40.,50.],[-45.,-135.,-80.],[0.,0.,0.],[0.,90.,90.],[90.,0.,20.],[-90.,0.,-30.],[70.,179.99,125.],[-15.,65.,179.]]
 for shape in shapes:
  for scale in [1e-60,1.,1e60/4]:
   axes=[(x/min(shape))*scale if scale==1e-60 else x*scale for x in shape]
   for system in range(3):
    for p in places:rows.append(dict(mode='C',radii=axes,system=system,input=[*p,0.]))
   for p in places[:4]+places[6:]:
    for fraction in [-1.,.01,.75,2.5,6.]:
     rows.append(dict(mode='T',radii=axes,system=0,input=[*p,fraction*max(axes)]))
 return rows
def main():
 p=argparse.ArgumentParser();p.add_argument('--native',type=Path);p.add_argument('--check',action='store_true');a=p.parse_args()
 provenance=dict(version='2.7',archiveSHA256='5aaca14cd75f13aa2690273d76e88e8ddf4aeb267d6be2c3e0ba948deb9ceea5',precisionBits=53,
  generatorSHA256=sha(Path(__file__)),driverSHA256=sha(HERE/'geographiclib-g89-reference.cpp'),builderSHA256=sha(HERE/'build-g89-native.py'))
 rows=inputs()
 if a.check:
  stored=json.loads(DEST.read_text());assert stored['provenance']==provenance
  assert [dict((k,r[k]) for k in ['mode','radii','system','input']) for r in stored['rows']]==rows
  for r in stored['rows']:
   expected=r['expected'];assert expected is not None and len(expected)==(1 if r['mode']=='S' else 9 if r['mode']in ['I','D','A'] else 6)
   assert all(math.isfinite(x) for x in expected)
  print('G8/G9 stored controls and provenance passed:',len(rows));return
 if not a.native:p.error('--native is required for offline generation')
 meta=json.loads(subprocess.check_output([str(a.native),'--metadata'],text=True))
 for k in ['version','precisionBits','driverSHA256']:assert meta[k]==provenance[k]
 request=''.join(' '.join([r['mode'],*map(lambda x:format(x,'.17g'),r['radii']),str(r['system']),*map(lambda x:format(x,'.17g'),r['input'])])+'\n' for r in rows)
 result=subprocess.check_output([str(a.native)],input=request,text=True).splitlines();assert len(result)==len(rows)
 for row,line in zip(rows,result):
  if line.startswith('ERROR'):raise ValueError((row,line))
  row['expected']=list(map(float,line.split()))
  assert all(math.isfinite(x) for x in row['expected']),(row,line)
 DEST.write_text(json.dumps(dict(provenance=provenance,nativeCompiler=meta['compiler'],rows=rows),separators=(',',':'),allow_nan=False)+'\n')
 print('G8/G9 native controls:',len(rows))
if __name__=='__main__':main()
