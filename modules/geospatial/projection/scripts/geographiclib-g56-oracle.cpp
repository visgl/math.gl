// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original offline API driver for pinned GeographicLib 2.7; no upstream test data copied.
#include <GeographicLib/Rhumb.hpp>
#include <GeographicLib/PolygonArea.hpp>
#include <GeographicLib/Intersect.hpp>
#include <iostream>
#include <iomanip>
#include <limits>
using namespace GeographicLib;
int main(int argc,char**) {
  if(argc>1) { std::cout<<GEOGRAPHICLIB_VERSION_STRING<<' '<<std::numeric_limits<Math::real>::digits<<'\n'; return 0; }
  std::cout<<std::setprecision(21);
  char mode; double a,b;
  while(std::cin>>mode>>a>>b) {
    Rhumb r(a,(a-b)/a,true);
    if(mode=='C') {
      Math::real lat,lon,az,bz,s,t,x,y,z,u,v,w;std::cin>>lat>>lon>>az>>bz>>s>>t;
      Geodesic g(a,(a-b)/a);g.Direct(lat,lon,az,-s,x,y,z);g.Direct(lat,lon,bz,-t,u,v,w);
      std::cout<<x<<' '<<y<<' '<<z<<' '<<u<<' '<<v<<' '<<w;
    } else if(mode=='I'||mode=='D') {
      Math::real x,y,z,w,u,v,S; std::cin>>x>>y>>z>>w;
      if(mode=='I') r.GenInverse(x,y,z,w,Rhumb::ALL,u,v,S);
      else r.GenDirect(x,y,z,w,Rhumb::ALL|Rhumb::LONG_UNROLL,u,v,S);
      std::cout<<u<<' '<<v<<' '<<S;
    } else if(mode=='P') {
      int n;std::cin>>n;PolygonAreaT<Rhumb> p(r);Math::real x,y,per,area;
      for(int i=0;i<n;i++){std::cin>>x>>y;p.AddPoint(x,y);}
      p.Compute(false,true,per,area);std::cout<<per<<' '<<area;
    } else {
      double x,y,z,u,v,w,d,ox,oy;std::cin>>x>>y>>z>>u>>v>>w>>d>>ox>>oy;
      Geodesic g(a,(a-b)/a);Intersect inter(g);std::vector<int> c;
      auto points=inter.All(x,y,z,u,v,w,d,c,Intersect::Point(ox,oy));
      std::cout<<points.size();
      for(size_t j=0;j<points.size();j++)std::cout<<' '<<points[j].first<<' '<<points[j].second<<' '<<c[j];
    }
    std::cout<<'\n';
  }
}
