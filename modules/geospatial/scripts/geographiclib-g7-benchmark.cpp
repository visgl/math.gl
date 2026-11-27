// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original offline API benchmark for GeographicLib 2.7 (Charles Karney, MIT); no upstream implementation copied.
#include <GeographicLib/Geodesic.hpp>
#include <GeographicLib/GeodesicLine.hpp>
#include <GeographicLib/Rhumb.hpp>
#include <chrono>
#include <cmath>
#include <iomanip>
#include <iostream>
#include <limits>
#include <memory>
#include <string>
#include <vector>
#ifndef MATHGL_DRIVER_SHA
#define MATHGL_DRIVER_SHA "unrecorded"
#endif
using namespace GeographicLib;
using R = Math::real;
struct Record {double a,b,p[4];};
struct Prepared {
  Geodesic g; Rhumb r; GeodesicLine gl; RhumbLine rl;
  explicit Prepared(const Record& v):g(v.a,(v.a-v.b)/v.a),r(v.a,(v.a-v.b)/v.a,true),
    gl(g.Line(v.p[0],v.p[1],v.p[2],(Geodesic::ALL & ~Geodesic::AREA)|Geodesic::DISTANCE_IN)),rl(r.Line(v.p[0],v.p[1],v.p[2])){}
};
int main(int argc,char** argv) {
  std::cout<<std::setprecision(17);
  if(argc==2 && std::string(argv[1])=="--metadata") {
    std::cout<<"{\"version\":\""<<GEOGRAPHICLIB_VERSION_STRING<<"\",\"precisionBits\":"<<std::numeric_limits<R>::digits<<",\"driverSHA256\":\""<<MATHGL_DRIVER_SHA<<"\",\"compiler\":\""<<__VERSION__<<"\"}\n";return 0;
  }
  if(argc<3) return 2;
  const std::string mode=argv[1],op=argv[2];
  if(mode!="--evaluate" && mode!="--measure")return 2;
  if(op!="gi"&&op!="gd"&&op!="gl"&&op!="ri"&&op!="rd"&&op!="rl"&&op!="gs"&&op!="rs")return 2;
  int count;std::cin>>count;if(count<1||count>1000)return 2;
  std::vector<Record> input(count);
  std::vector<std::unique_ptr<Prepared>> prepared;
  for(auto& v:input) {
    std::cin>>v.a>>v.b>>v.p[0]>>v.p[1]>>v.p[2]>>v.p[3];
    if(!std::cin||!std::isfinite(v.a)||!std::isfinite(v.b)||v.a<=0||v.b<=0)return 2;
    prepared.emplace_back(new Prepared(v));
  }
  const int width=op=="gi"?7:op=="gd"||op=="gl"?8:op=="gs"||op=="rs"?1:2;
  std::vector<std::vector<double>> output(count,std::vector<double>(width));
  auto evaluate=[&](int index) {
    auto& v=input[index];auto& q=*prepared[index];auto& out=output[index];
    R lat=0,lon=0,azi1=0,azi2=0,s=0,m=0,M=0,N=0,S=0,arc=0;
    const unsigned mask=(Geodesic::ALL & ~Geodesic::AREA)|Geodesic::LONG_UNROLL;
    if(op=="gs") {Geodesic g(v.a,(v.a-v.b)/v.a);out[0]=double(g.EllipsoidArea())/v.a/v.a;}
    else if(op=="rs") {Rhumb r(v.a,(v.a-v.b)/v.a,true);out[0]=double(r.EllipsoidArea())/v.a/v.a;}
    else if(op=="gi") {
      arc=q.g.GenInverse(v.p[0],v.p[1],v.p[2],v.p[3],mask,s,azi1,azi2,m,M,N,S);
      out={double(s),double(azi1),double(azi2),double(m),double(M),double(N),double(arc)};
    } else if(op=="gd"||op=="gl") {
      if(op=="gd")arc=q.g.GenDirect(v.p[0],v.p[1],v.p[2],false,v.p[3],mask,lat,lon,azi2,s,m,M,N,S);
      else arc=q.gl.GenPosition(false,v.p[3],mask,lat,lon,azi2,s,m,M,N,S);
      out={double(lat),double(lon),double(azi2),double(s),double(m),double(M),double(N),double(arc)};
    } else if(op=="ri") {
      q.r.GenInverse(v.p[0],v.p[1],v.p[2],v.p[3],Rhumb::DISTANCE|Rhumb::AZIMUTH,s,azi1,S);
      out={double(s),double(azi1)};
    } else {
      if(op=="rd")q.r.GenDirect(v.p[0],v.p[1],v.p[2],v.p[3],Rhumb::LATITUDE|Rhumb::LONGITUDE|Rhumb::LONG_UNROLL,lat,lon,S);
      else q.rl.GenPosition(v.p[3],Rhumb::LATITUDE|Rhumb::LONGITUDE|Rhumb::LONG_UNROLL,lat,lon,S);
      out={double(lat),double(lon)};
    }
  };
  if(mode=="--evaluate") {
    for(int i=0;i<count;i++){evaluate(i);for(int j=0;j<width;j++)std::cout<<(j?" ":"")<<output[i][j];std::cout<<'\n';}return 0;
  }
  if(argc!=5)return 2;
  const int points=std::stoi(argv[3]);const double minimum=std::stod(argv[4]);
  if(points<10||points>1000000||minimum<0||minimum>100)return 2;
  for(int i=0;i<points;i++)evaluate(i%count);
  size_t iterations=1;double elapsed;
  do {
    const auto start=std::chrono::steady_clock::now();
    for(size_t k=0;k<iterations;k++)for(int i=0;i<points;i++)evaluate(i%count);
    elapsed=std::chrono::duration<double,std::milli>(std::chrono::steady_clock::now()-start).count();
    if(elapsed>=minimum||iterations>=65536)break;
    iterations*=2;
  }while(true);
  double checksum=0;for(const auto& row:output)for(double x:row){if(!std::isfinite(x))return 3;checksum+=x;}
  std::cout<<"{\"milliseconds\":"<<elapsed<<",\"iterations\":"<<iterations<<",\"checksum\":"<<checksum<<"}\n";
}
