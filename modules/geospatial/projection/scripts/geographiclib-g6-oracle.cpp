// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original pinned GeographicLib C++ 2.7 global-intersection driver; no upstream test data copied.
#include <GeographicLib/Intersect.hpp>
#include <iostream>
#include <iomanip>
#include <limits>
using namespace GeographicLib;
int main(int argc,char**) {
 if(argc>1){std::cout<<GEOGRAPHICLIB_VERSION_STRING<<' '<<std::numeric_limits<Math::real>::digits<<'\n';return 0;}
 std::cout<<std::setprecision(21);char mode;double a,b;
 while(std::cin>>mode>>a>>b){
  Geodesic g(a,(a-b)/a);Intersect inter(g);Math::real x,y,z,u,v,w,d,ox,oy;
  if(mode=='B'){
   std::cin>>x>>y>>z>>u>>v>>w;Math::real lat,lon,azi;
   g.Direct(x,y,z,-v,lat,lon,azi);std::cout<<lat<<' '<<lon<<' '<<azi;
   g.Direct(x,y,u,-w,lat,lon,azi);std::cout<<' '<<lat<<' '<<lon<<' '<<azi;
  }else if(mode=='L'){
   std::cin>>x>>y>>z>>d;Math::real lat,lon,azi;
   g.Direct(x,y,z,d,lat,lon,azi);std::cout<<lat<<' '<<lon<<' '<<azi;
  }else if(mode=='N'){
   std::cin>>x>>y>>z>>u;int c;auto p=inter.Next(x,y,z,u,&c);std::cout<<p.first<<' '<<p.second<<' '<<c;
  }else if(mode=='S'){
   Math::real a0,a1,a2,a3,b0,b1,b2,b3;std::cin>>a0>>a1>>a2>>a3>>b0>>b1>>b2>>b3;
   int c,m;auto p=inter.Segment(a0,a1,a2,a3,b0,b1,b2,b3,m,&c);std::cout<<p.first<<' '<<p.second<<' '<<c<<' '<<m;
  }else{
   std::cin>>x>>y>>z>>u>>v>>w>>d>>ox>>oy;
   std::vector<int> c;auto points=inter.All(x,y,z,u,v,w,d,c,Intersect::Point(ox,oy));
   std::cout<<points.size();for(size_t j=0;j<points.size();j++)std::cout<<' '<<points[j].first<<' '<<points[j].second<<' '<<c[j];
   int coinc;auto p=inter.Closest(x,y,z,u,v,w,Intersect::Point(ox,oy),&coinc);std::cout<<' '<<p.first<<' '<<p.second<<' '<<coinc;
  }
  std::cout<<'\n';
 }
}
