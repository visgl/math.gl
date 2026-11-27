#!/usr/bin/env python3
# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
# SPDX-FileComment: Original latitude-domain inputs and offline pinned GeographicLib 2.7 controls.
import argparse,hashlib,json,subprocess
from pathlib import Path
HERE=Path(__file__).resolve().parent;DEST=HERE.parent/'test/geographic-cuts-reference.json'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def inputs():
 rows=[];a=6378137.
 for mode in ['geodesic','rhumb']:
  shapes=[(a,6356752.314245179),(1.,1.),(a,.99*a),(a,1.01*a)]+([(a,.5*a),(a,2*a)] if mode=='rhumb' else [])
  for a,b in shapes:
   for start,end,turns in [([10,-30],[40,40],0),([-60,40],[60,40],0),([170,-30],[-170,50],0),([40,60],[40,-60],0),([-170,20],[10,20],0),([10,10],[10,60],2 if mode=='rhumb' else 0)]:
    for bounds in [[0,30],[-20,20],[50,80],[-80,-10],[0,90]]:rows.append(dict(edgeModel=mode,axes=[a,b],start=start,end=end,turns=turns,latitudeRange=bounds))
 return rows
def main():
 p=argparse.ArgumentParser();p.add_argument('--native',type=Path);p.add_argument('--check',action='store_true');args=p.parse_args();rows=inputs()
 provenance=dict(version='2.7',precisionBits=53,archiveSHA256='5aaca14cd75f13aa2690273d76e88e8ddf4aeb267d6be2c3e0ba948deb9ceea5',generatorSHA256=sha(Path(__file__)),driverSHA256=sha(HERE/'geographic-cuts-reference.cpp'),builderSHA256=sha(HERE/'build-geographic-cuts-native.py'))
 if args.check:
  stored=json.loads(DEST.read_text());assert stored['provenance']==provenance;assert [{k:v for k,v in r.items() if k!='expected'} for r in stored['rows']]==rows
 else:
  if not args.native:p.error('--native required')
  meta=json.loads(subprocess.check_output([str(args.native),'--metadata'],text=True));assert all(meta[k]==provenance[k] for k in ['version','precisionBits','driverSHA256'])
  requests=[]
  for r in rows:requests.append(('G' if r['edgeModel']=='geodesic' else 'R')+' '+' '.join(format(x,'.17g') for x in r['axes']+[r['start'][1],r['start'][0],r['end'][1],r['end'][0],r['turns']]+r['latitudeRange']))
  lines=subprocess.check_output([str(args.native)],input='\n'.join(requests)+'\n',text=True).splitlines();assert len(lines)==len(rows)
  for r,line in zip(rows,lines):
   values=list(map(float,line.split()));assert len(values)==2+6*int(values[1]);r['expected']=dict(distance=values[0],intervals=[values[i:i+6] for i in range(2,len(values),6)])
  DEST.write_text(json.dumps(dict(provenance=provenance,rows=rows),separators=(',',':'),allow_nan=False)+'\n')
 print('Native latitude cuts:',len(rows))
if __name__=='__main__':main()
