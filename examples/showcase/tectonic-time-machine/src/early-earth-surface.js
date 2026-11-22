// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// Illustrative crust and heat fields in geographic sphere coordinates.
export const earlyEarthSurfaceGLSL = `
float fissureCoverage(float contour,float halfWidth) {
  // Filter each signed contour before combining them. A derivative of the
  // absolute distance can cancel when a pixel quad straddles the centerline.
  float pixel=max(fwidth(contour),.0001);
  float distance=abs(contour);
  float coverage=clamp((halfWidth+.5*pixel-distance)/pixel,0.,1.)
    -clamp((.5*pixel-halfWidth-distance)/pixel,0.,1.);
  return coverage*(1.-smoothstep(1.,5.,pixel/halfWidth));
}

void earlyEarthSurface(vec3 p,float heat,out float basin,out float rock,
                       out float relief,out vec3 emission) {
  vec3 warp=vec3(tectonicIceDetail(p,5.),tectonicIceDetail(p.yzx+1.7,5.),
                 tectonicIceDetail(p.zxy-2.1,5.))-.5;
  vec3 flow=p+.19*warp;
  basin=.76*tectonicIceDetail(flow,5.)+.24*tectonicIceDetail(flow,12.);

  // Two intersecting contours create connected branches and wider junctions.
  float primary=tectonicIceNoise(flow*13.)-.5;
  float secondary=tectonicIceNoise((flow.yzx+3.1)*21.)-.5;
  float resolved=1.-smoothstep(.009,.026,length(fwidth(p)));

  float width=mix(.012,.034,tectonicIceDetail(flow,8.));
  float seam=resolved*max(fissureCoverage(primary,width*.68),
                 fissureCoverage(secondary,width*.45));
  float junction=resolved*(1.-smoothstep(.026,.099,length(vec2(primary,secondary))))
    *smoothstep(.46,.62,basin);
  float lake=smoothstep(.63,.75,basin);
  float pools=max(lake,junction);
  float molten=max(pools,seam*smoothstep(.31,.47,basin));

  // Warp aligned folds by the same slow flow that bends the crust rafts.
  float phase=dot(flow,vec3(105.,-54.,65.))+9.*tectonicIceDetail(flow,17.);
  float folds=(.5+.5*sin(phase))*(1.-smoothstep(.6,3.14,fwidth(phase)));
  folds=pow(folds,2.);
  rock=clamp(.13+.30*basin+.57*folds,0.,1.);
  relief=(.0035*basin+.017*folds)*(1.-.85*pools)-.0018*pools;
  float seamCore=resolved*max(fissureCoverage(primary,width*.24),
                     fissureCoverage(secondary,width*.16))
    *smoothstep(.36,.52,basin);
  vec3 margins=mix(vec3(.19,.006,.001),vec3(1.05,.22,.012),molten);
  emission=heat*(molten*margins+seamCore*vec3(6.,3.2,.95));
}
`;
