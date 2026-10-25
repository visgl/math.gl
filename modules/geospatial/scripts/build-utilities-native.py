#!/usr/bin/env python3
# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
# SPDX-FileComment: Original offline pinned-source builder; GeographicLib source remains external and is not installed or vendored.
"""Build a standalone benchmark only from the reviewed local GeographicLib r2.7 archive."""
import argparse
import concurrent.futures
import hashlib
from pathlib import Path
import subprocess
import tarfile
import tempfile
ARCHIVE_SHA='5aaca14cd75f13aa2690273d76e88e8ddf4aeb267d6be2c3e0ba948deb9ceea5'
DRIVER=Path(__file__).with_name('geographiclib-utilities-reference.cpp')
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--archive',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
 assert hashlib.sha256(a.archive.read_bytes()).hexdigest()==ARCHIVE_SHA,'Unpinned GeographicLib archive'
 with tempfile.TemporaryDirectory(prefix='mathgl-g89-native-') as name:
  root=Path(name)
  with tarfile.open(a.archive) as archive:
   for member in archive.getmembers():
    assert not member.name.startswith('/') and '..' not in Path(member.name).parts
    assert member.isfile() or member.isdir()
   archive.extractall(root)
  source=root/'geographiclib-r2.7';include=root/'include/GeographicLib';include.mkdir(parents=True)
  (include/'Config.h').write_text('#define GEOGRAPHICLIB_VERSION_STRING "2.7"\n#define GEOGRAPHICLIB_VERSION_MAJOR 2\n#define GEOGRAPHICLIB_VERSION_MINOR 7\n#define GEOGRAPHICLIB_VERSION_PATCH 0\n#define GEOGRAPHICLIB_DATA ""\n#define GEOGRAPHICLIB_HAVE_LONG_DOUBLE 1\n#define GEOGRAPHICLIB_WORDS_BIGENDIAN 0\n#define GEOGRAPHICLIB_PRECISION 2\n#define GEOGRAPHICLIB_SHARED_LIB 0\n')
  flags=['c++','-std=c++17','-O2','-I'+str(include.parent),'-I'+str(source/'include')]
  names=['UTMUPS','MGRS','TransverseMercator','TransverseMercatorExact','PolarStereographic','Math','Geodesic','GeodesicLine','GeodesicExact','GeodesicLineExact','PolygonArea','Accumulator','Rhumb','AuxAngle','AuxLatitude','DAuxLatitude','EllipticFunction','DST','Trigfun','Ellipsoid','Angle','Ellipsoid3','Cartesian3','Geodesic3','GeodesicLine3','DMS','Utility']
  def compile_one(name):
   output=root/(name+'.o');subprocess.run(flags+['-c',str(source/'src'/(name+'.cpp')),'-o',str(output)],check=True);return str(output)
  with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool: objects=list(pool.map(compile_one,names))
  sha=hashlib.sha256(DRIVER.read_bytes()).hexdigest()
  subprocess.run(flags+['-DMATHGL_DRIVER_SHA="'+sha+'"',str(DRIVER)]+objects+['-o',str(a.output.resolve())],check=True)
 print(subprocess.check_output([str(a.output.resolve()),'--metadata'],text=True).strip())
if __name__=='__main__':main()
