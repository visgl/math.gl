#!/usr/bin/env python3
# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
# SPDX-FileComment: Original inputs and pinned native GeographicLib 2.7 binary64 outputs, not upstream test fixtures.
import argparse, hashlib, json, math, subprocess
from pathlib import Path
HERE=Path(__file__).resolve().parent
DEST=HERE.parent/'test/exact-area-reference.json'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def inputs():
 rows=[]
 for ratio in [.25,.5,.8,1,1.25,2,4]:
  for scale in [1e-60,1,6378137,1e60/4]:
   a=scale/max(1,ratio) if scale==1e60/4 else scale/min(1,ratio) if scale==1e-60 else scale
   b=max(1e-60,ratio*a)
   for mode,cases in [('D',[[30,20,40,1],[-45,170,125,-1.2],[90,20,35,.7],[-90,20,-65,.7],[0,0,0,2],[0,0,90,1],[1e-7,20,45,1e-7]]),('A',[[30,20,40,120],[-40,-170,-20,-240],[0,0,90,360],[80,45,0,540],[90,10,35,30],[12,30,40,720],[12,30,40,-720]]),('I',[[30,20,-20,150],[0,179.999,0,-179.999],[90,20,-90,150],[90,0,-30,120],[-90,20,30,-70],[30,20,90,150],[30,20,-90,150],[0,0,0,180],[20,30,20,30]])]:
    for p in cases:
     p=p[:]
     if mode=='D':p[3]*=min(a,b)
     rows.append(dict(mode=mode,axes=[a,b],input=p))
   polygons=[[[0,0],[0,10],[90,0]],[[20,170],[30,-175],[-20,-165]],[[80,-120],[80,0],[80,120]],[[0,0],[10,10],[0,10],[10,0]],[[10,20],[10,20],[10,20]]]
   for points in polygons:
    for reverse,unsigned in [(False,False),(True,False),(False,True)]:rows.append(dict(mode='P',axes=[a,b],points=points,reverse=reverse,unsigned=unsigned))
 seed=4123
 def random():
  nonlocal seed
  seed=(1664525*seed+1013904223)&0xffffffff
  return seed/4294967296
 for ratio in [.25,.5,.8,1,1.25,2,4]:
  for _ in range(200):rows.append(dict(mode='I',axes=[1,ratio],input=[178*random()-89,360*random()-180,178*random()-89,360*random()-180]))
 return rows
def request(r):
 fields=[r['mode'],*r['axes']]
 if r['mode']=='P':fields += [len(r['points']),int(r['reverse']),int(r['unsigned']),*[v for p in r['points'] for v in p]]
 else:fields+=r['input']
 return ' '.join(format(x,'.17g') if isinstance(x,float) else str(x) for x in fields)+'\n'
def main():
 p=argparse.ArgumentParser();p.add_argument('--native',type=Path);p.add_argument('--check',action='store_true');args=p.parse_args()
 provenance=dict(version='2.7',precisionBits=53,archiveSHA256='5aaca14cd75f13aa2690273d76e88e8ddf4aeb267d6be2c3e0ba948deb9ceea5',generatorSHA256=sha(Path(__file__)),builderSHA256=sha(HERE/'build-exact-area-native.py'),driverSHA256=sha(HERE/'geographiclib-exact-area-reference.cpp'))
 rows=inputs()
 if args.check:
  data=json.loads(DEST.read_text());assert data['provenance']==provenance
  assert [{k:v for k,v in r.items() if k!='expected'} for r in data['rows']]==rows
  assert all(len(r['expected'])==2 and all(math.isfinite(x) for x in r['expected']) for r in data['rows'])
 else:
  if not args.native:p.error('--native required')
  meta=json.loads(subprocess.check_output([str(args.native),'--metadata'],text=True))
  for k in ['version','precisionBits','driverSHA256']:assert meta[k]==provenance[k]
  output=subprocess.check_output([str(args.native)],input=''.join(map(request,rows)),text=True).splitlines();assert len(output)==len(rows)
  for r,line in zip(rows,output):r['expected']=list(map(float,line.split()))
  DEST.write_text(json.dumps(dict(provenance=provenance,rows=rows),separators=(',',':'),allow_nan=False)+'\n')
 print('Exact area native controls:',len(rows))
if __name__=='__main__':main()
