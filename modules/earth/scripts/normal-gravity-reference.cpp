// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original offline caller of pinned GeographicLib 2.7 NormalGravity (MIT).
#include <GeographicLib/NormalGravity.hpp>
#include <GeographicLib/Geocentric.hpp>
#include <iostream>
#include <iomanip>
#include <limits>
#include <string>
using namespace GeographicLib;
int main(int argc,char**argv){
 std::cout<<std::setprecision(17);
 if(argc==2&&std::string(argv[1])=="--metadata"){
  std::cout<<"{\"version\":\""<<GEOGRAPHICLIB_VERSION_STRING<<"\",\"precisionBits\":"<<std::numeric_limits<Math::real>::digits<<",\"driverSHA256\":\""<<MATHGL_DRIVER_SHA<<"\"}\n";return 0;
 }
 double a,f,gm,w,lat,lon,h;
 while(std::cin>>a>>f>>gm>>w>>lat>>lon>>h){
  NormalGravity model(a,gm,w,f,true);Geocentric earth(a,f);double x,y,z,gx,gy,gz,vx,vy,vz;
  earth.Forward(lat,lon,h,x,y,z);double u=model.U(x,y,z,gx,gy,gz),v=model.V0(x,y,z,vx,vy,vz);
  std::cout<<x<<' '<<y<<' '<<z<<' '<<u<<' '<<v<<' '<<gx<<' '<<gy<<' '<<gz<<' '<<model.SurfaceGravity(lat)<<'\n';
 }
}
