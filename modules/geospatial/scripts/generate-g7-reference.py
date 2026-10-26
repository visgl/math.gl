#!/usr/bin/env python3
# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
# SPDX-FileComment: Original stored G7 API controls for the pinned external native comparator; no upstream data copied.
import argparse
import hashlib
import json
import math
from pathlib import Path
import subprocess
ROOT=Path(__file__).resolve().parents[3]
HERE=Path(__file__).resolve().parent
DEST=ROOT/'modules/geospatial/test/g7-reference.json'
WORK=ROOT/'modules/geospatial/test/g7-workload.json'
OPS=['gi','gd','gl','ri','rd','rl','gs','rs']
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
 p=argparse.ArgumentParser();p.add_argument('--native',type=Path);p.add_argument('--check',action='store_true');a=p.parse_args()
 provenance=dict(version='2.7',precisionBits=53,archiveSHA256='5aaca14cd75f13aa2690273d76e88e8ddf4aeb267d6be2c3e0ba948deb9ceea5',
   driverSHA256=sha(HERE/'geographiclib-g7-benchmark.cpp'),builderSHA256=sha(HERE/'build-g7-native.py'),generatorSHA256=sha(Path(__file__)),workloadSHA256=sha(WORK))
 workload=json.loads(WORK.read_text())
 if a.check:
  data=json.loads(DEST.read_text());assert data['provenance']==provenance
  assert list(data['operations'])==OPS
  for op,rows in data['operations'].items():
   assert len(rows)==9 and all(all(math.isfinite(x) for x in row) for row in rows)
  print('G7 stored native controls and workload provenance passed');return
 if not a.native:p.error('--native is required for offline generation')
 metadata=json.loads(subprocess.check_output([str(a.native),'--metadata'],text=True));assert {k:metadata[k] for k in ['version','precisionBits','driverSHA256']}=={k:provenance[k] for k in ['version','precisionBits','driverSHA256']}
 operations={}
 for op in OPS:
  rows=workload['inverse' if op in ['gi','ri'] else 'direct']
  request=str(len(rows))+'\n'+''.join(' '.join(format(x,'.17g') for x in row['axes']+row['input'])+'\n' for row in rows)
  result=subprocess.check_output([str(a.native),'--evaluate',op],input=request,text=True).splitlines()
  assert len(result)==len(rows)
  operations[op]=[list(map(float,r.split())) for r in result]
  assert all(all(math.isfinite(x) for x in row) for row in operations[op])
 DEST.write_text(json.dumps(dict(provenance=provenance,nativeCompiler=metadata['compiler'],operations=operations),indent=2,allow_nan=False)+'\n')
 print('G7 native controls:',sum(map(len,operations.values())))
if __name__=='__main__':main()
